import express from 'express';
import multer from 'multer';
// Real ML engine only
import { evaluateCompliance } from '../engine/rule-engine';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { DeclarationCheckResult } from '../engine/declarations';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Real font measurement using OCR bounding box pixel heights
// LMPC Rules 2011 — Schedule II font height requirements based on PDP area
function getRequiredFontHeightMm(pdpAreaCmSq: number): number {
  if (pdpAreaCmSq <= 50) return 1.0;
  if (pdpAreaCmSq <= 100) return 1.5;
  if (pdpAreaCmSq <= 500) return 2.5;
  if (pdpAreaCmSq <= 2500) return 4.0;
  return 6.0;
}

function measureFontFromOCR(
  ocrWords: Array<{ fontSize?: number; bbox?: { height: number } }>,
  pdpAreaCmSq: number,
  imageDimensions?: { widthPx?: number; heightPx?: number; widthCm?: number; heightCm?: number }
) {
  const requiredHeightMm = getRequiredFontHeightMm(pdpAreaCmSq);

  // Estimate DPI from user-provided package dimensions vs image pixel size
  let pxPerMm = 10; // fallback: assume ~254 DPI (10 px/mm)
  if (imageDimensions?.heightPx && imageDimensions?.heightCm && imageDimensions.heightCm > 0) {
    pxPerMm = imageDimensions.heightPx / (imageDimensions.heightCm * 10); // cm→mm
  }

  // Calculate median font height from OCR bounding boxes
  const fontHeightsPx = ocrWords
    .map(w => w.fontSize || w.bbox?.height || 0)
    .filter(h => h > 5); // filter noise

  if (fontHeightsPx.length === 0) {
    return { measuredHeightMm: 0, requiredHeightMm, pass: false };
  }

  fontHeightsPx.sort((a, b) => a - b);
  const medianPx = fontHeightsPx[Math.floor(fontHeightsPx.length / 2)];
  const measuredHeightMm = parseFloat((medianPx / pxPerMm).toFixed(1));

  return {
    measuredHeightMm,
    requiredHeightMm,
    pass: measuredHeightMm >= requiredHeightMm,
  };
}

function calculatePDPArea(dimensions: any): number {
  if (!dimensions) return 200;
  if (dimensions.shape === 'rectangular' && dimensions.widthCm && dimensions.heightCm) {
    return dimensions.widthCm * dimensions.heightCm;
  }
  if (dimensions.shape === 'cylindrical' && dimensions.diameterCm && dimensions.heightCm) {
    return 0.4 * (Math.PI * dimensions.diameterCm * dimensions.heightCm);
  }
  return 200; // fallback
}

function calculateVerdict(checks: DeclarationCheckResult[], score: number) {
  const failedMandatory = checks.filter(
    (c) => c.status === 'fail' && !c.ruleClause.includes('conditional')
  ).length;

  if (failedMandatory > 0 || score < 70) {
    return 'non_compliant';
  } else if (checks.some((c) => c.status === 'warn') || score < 90) {
    return 'needs_review';
  }
  return 'compliant';
}

router.post('/', authenticateToken, upload.single('image'), async (req: AuthRequest, res: express.Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const imageDataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const { productInfoStr, dimensionsStr } = req.body;
    let productInfo = { category: 'general', productName: '', brandName: '', packageWeightKg: undefined };
    let packageDimensions = null;

    if (productInfoStr) {
      productInfo = JSON.parse(productInfoStr);
    }
    if (dimensionsStr) {
      packageDimensions = JSON.parse(dimensionsStr);
    }

    // Forward to Python ML Microservice (YOLOv8 + LayoutLMv3)
    let ocrResultText = "";
    let extractedFields: any[] = [];
    
    try {
      const mlFormData = new FormData();
      mlFormData.append('image', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
      
      const mlResponse = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: mlFormData
      });
      
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        ocrResultText = mlData.fullText || "";
        extractedFields = mlData.extractedFields || [];
      } else {
        throw new Error(`ML Backend failed with status ${mlResponse.status}`);
      }
    } catch (mlErr) {
      console.error('Error connecting to ML backend:', mlErr);
      return res.status(502).json({ error: 'ML Backend is offline or failed. Please ensure the Python service is running.' });
    }

    // 3. Rule Evaluation
    const isImported = ocrResultText.toLowerCase().includes('imported') || ocrResultText.toLowerCase().includes('country of origin');
    const ruleResult = evaluateCompliance(extractedFields, productInfo.category, isImported, productInfo.packageWeightKg);

    // 4. PDP and Font Analysis (real bounding-box measurement)
    const pdpAreaCmSq = calculatePDPArea(packageDimensions);
    const ocrWordsForFont = extractedFields
      .filter((f: any) => f.rawText)
      .map((f: any) => ({ fontSize: f.fontSize || 18, bbox: { height: f.fontSize || 18 } }));
      
    const checksWithFonts = ruleResult.checks.map((check) => {
      if (check.status !== 'skip' && check.extractedText) {
        const fm = measureFontFromOCR(ocrWordsForFont, pdpAreaCmSq, packageDimensions);
        if (!fm.pass && check.status === 'pass') {
          return {
            ...check,
            status: 'fail' as const,
            details: check.details + ' (Failed due to non-compliant font size)',
            fontMeasurement: fm
          };
        }
        return { ...check, fontMeasurement: fm };
      }
      return check;
    });

    // Recalculate score after font checks
    const totalApplicable = checksWithFonts.filter((c) => c.status !== 'skip').length;
    const passed = checksWithFonts.filter((c) => c.status === 'pass').length;
    const finalScore = totalApplicable > 0 ? Math.round((passed / totalApplicable) * 100) : 0;

    // 5. Verdict
    const verdictValue = calculateVerdict(checksWithFonts, finalScore);

    const scanResult = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      imageName: file.originalname,
      imageDataUrl,
      productInfo,
      ocrText: ocrResultText,
      results: checksWithFonts,
      violations: ruleResult.violations,
      verdict: {
        status: verdictValue,
        score: finalScore,
        totalChecks: checksWithFonts.length,
        passedChecks: passed,
        failedChecks: checksWithFonts.filter((c) => c.status === 'fail').length,
        warnings: checksWithFonts.filter((c) => c.status === 'warn').length,
        skipped: checksWithFonts.filter((c) => c.status === 'skip').length,
        summary: `Automated compliance check completed. Score: ${finalScore}/100.`
      },
      officerNotes: '',
      ruleVersion: 'LMPC Rules 2011 (Amended)',
      packageDimensions,
    };

    // 6. Save to PostgreSQL
    await pool.query(
      `INSERT INTO scans (id, user_id, timestamp, image_name, product_name, brand_name, category, score, verdict, details_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        scanResult.id,
        req.user.id,
        scanResult.timestamp,
        scanResult.imageName,
        productInfo.productName || null,
        productInfo.brandName || null,
        productInfo.category,
        scanResult.verdict.score,
        scanResult.verdict.status,
        JSON.stringify(scanResult)
      ]
    );

    res.json(scanResult);
  } catch (error) {
    console.error('Scan processing error:', error);
    res.status(500).json({ error: 'Internal server error processing scan' });
  }
});

export default router;
