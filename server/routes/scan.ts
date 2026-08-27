import express from 'express';
import multer from 'multer';
import { performOCR } from '../engine/ocr-engine';
import { classifyFields } from '../engine/field-classifier';
import { evaluateCompliance } from '../engine/rule-engine';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { DeclarationCheckResult } from '../engine/declarations';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Add simple font measurement mock here for MVP
function simulateFontMeasurement(pdpAreaCmSq: number) {
  let requiredHeightMm = 1.0;
  if (pdpAreaCmSq > 50 && pdpAreaCmSq <= 100) requiredHeightMm = 1.5;
  else if (pdpAreaCmSq > 100 && pdpAreaCmSq <= 500) requiredHeightMm = 2.5;
  else if (pdpAreaCmSq > 500 && pdpAreaCmSq <= 2500) requiredHeightMm = 4.0;
  else if (pdpAreaCmSq > 2500) requiredHeightMm = 6.0;

  const measuredHeightMm = requiredHeightMm + (Math.random() * 1.5 - 0.2); // Random near required
  
  return {
    measuredHeightMm: parseFloat(measuredHeightMm.toFixed(1)),
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

    // 1. OCR Extraction
    const ocrResult = await performOCR(file.buffer);

    // 2. Classification
    const extractedFields = classifyFields(ocrResult.fullText);

    // 3. Rule Evaluation
    const isImported = ocrResult.fullText.toLowerCase().includes('imported') || ocrResult.fullText.toLowerCase().includes('country of origin');
    const ruleResult = evaluateCompliance(extractedFields, productInfo.category, isImported, productInfo.packageWeightKg);

    // 4. PDP and Font Analysis
    const pdpAreaCmSq = calculatePDPArea(packageDimensions);
    const checksWithFonts = ruleResult.checks.map((check) => {
      if (check.status !== 'skip' && check.extractedText) {
        return { ...check, fontMeasurement: simulateFontMeasurement(pdpAreaCmSq) };
      }
      return check;
    });

    // 5. Verdict
    const verdictValue = calculateVerdict(checksWithFonts, ruleResult.score);

    const scanResult = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      imageName: file.originalname,
      imageDataUrl,
      productInfo,
      ocrText: ocrResult.fullText,
      results: checksWithFonts,
      violations: ruleResult.violations,
      verdict: {
        status: verdictValue,
        score: ruleResult.score,
        totalChecks: checksWithFonts.length,
        passedChecks: checksWithFonts.filter((c) => c.status === 'pass').length,
        failedChecks: checksWithFonts.filter((c) => c.status === 'fail').length,
        warnings: checksWithFonts.filter((c) => c.status === 'warn').length,
        skipped: checksWithFonts.filter((c) => c.status === 'skip').length,
        summary: `Automated compliance check completed. Score: ${ruleResult.score}/100.`
      },
      officerNotes: '',
      ruleVersion: 'LMPC Rules 2011 (Amended)',
      packageDimensions,
    };

    // 6. Save to DB
    const stmt = db.prepare(`
      INSERT INTO scans (id, user_id, timestamp, image_name, product_name, brand_name, category, score, verdict, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
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
    );

    res.json(scanResult);
  } catch (error) {
    console.error('Scan processing error:', error);
    res.status(500).json({ error: 'Internal server error processing scan' });
  }
});

export default router;
