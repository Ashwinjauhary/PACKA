// OCR Engine — Tesseract.js wrapper for browser-based text extraction

import { createWorker, Worker } from 'tesseract.js';
import { ExtractedDeclaration, BoundingBox } from '../types/declarations';

export interface OCRResult {
  fullText: string;
  words: OCRWord[];
  lines: OCRLine[];
  confidence: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  fontSize: number; // estimated pixel height
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: OCRWord[];
}

export type OCRProgressCallback = (stage: string, progress: number) => void;

let workerInstance: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerInstance) {
    workerInstance = await createWorker('eng', undefined, {
      logger: () => {},
    });
  }
  return workerInstance;
}

export async function performOCR(
  imageSource: string | File | HTMLCanvasElement,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  onProgress?.('Initializing OCR engine...', 0.1);

  const worker = await getWorker();
  onProgress?.('Processing image...', 0.3);

  let imageData: string;
  if (typeof imageSource === 'string') {
    imageData = imageSource;
  } else if (imageSource instanceof File) {
    imageData = await fileToDataURL(imageSource);
  } else {
    imageData = imageSource.toDataURL();
  }

  onProgress?.('Extracting text...', 0.5);

  const result = await worker.recognize(imageData);
  onProgress?.('Analyzing results...', 0.8);

  const data = result.data as any;

  const words: OCRWord[] = [];
  const lines: OCRLine[] = [];

  if (data.lines) {
    for (const line of data.lines) {
      const lineWords: OCRWord[] = [];

      if (line.words) {
        for (const word of line.words) {
          const ocrWord: OCRWord = {
            text: word.text,
            confidence: word.confidence,
            bbox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
            },
            fontSize: word.bbox.y1 - word.bbox.y0,
          };
          words.push(ocrWord);
          lineWords.push(ocrWord);
        }
      }

      lines.push({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0,
        },
        words: lineWords,
      });
    }
  }

  onProgress?.('Complete', 1.0);

  return {
    fullText: data.text,
    words,
    lines,
    confidence: data.confidence,
  };
}

export async function terminateOCR(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Pre-process an image for better OCR accuracy:
 * - Enhance contrast
 * - Convert to grayscale
 */
export function preprocessImage(
  imageDataUrl: string,
  onProgress?: OCRProgressCallback
): Promise<string> {
  return new Promise((resolve) => {
    onProgress?.('Pre-processing image...', 0.2);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and enhance contrast
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Contrast enhancement (simple curve)
        const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));

        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
}

// Simulated OCR for demo purposes when Tesseract is slow/unavailable
export function simulateOCR(category: string): OCRResult {
  const demoTexts: Record<string, string> = {
    food: `Tasty Bites Pvt. Ltd.
Plot No. 45, Industrial Area Phase-II
Chandigarh - 160002, India

WHEAT FLOUR (ATTA)
Whole Wheat Chakki Atta

Net Wt: 5 kg
MRP ₹ 285.00 (Inclusive of all taxes)
Mfg Date: 03/2026
Best Before: 6 months from date of manufacture
Batch No: WA-2026-0345

Consumer Care: 1800-123-4567
Email: care@tastybites.in

FSSAI Lic. No. 10012345678901`,

    cosmetics: `GlowSkin Beauty Products
23, Cosmetic Hub, Andheri East
Mumbai - 400093, Maharashtra

MOISTURIZING FACE CREAM
With Vitamin E & Aloe Vera

Net Qty: 100 ml
M.R.P. Rs. 499.00 (Incl. of all taxes)
Mfg. Date: 01/2026
Use By: 24 months from mfg
Batch: FC-0126-A

For complaints: support@glowskin.in
Helpline: 022-28361234

Made in India
Imported Ingredients: Shea Butter (Ghana)`,

    electronics: `TechVolt India Pvt. Ltd.
B-12, Electronic City, Bengaluru
Karnataka - 560100

LED SMART BULB - 12W
Model: TV-SB12W

1 Unit
MRP ₹ 349.00 (inclusive of all taxes)
Month & Year of Manufacture: 06/2026
Country of Origin: India

Customer Care: 1800-599-8765
support@techvolt.in

BIS Registration: R-12345678
Dimensions: 60mm × 120mm`,

    general: `HomeCraft Industries
Plot 78, Sector 5, IMT Manesar
Gurugram, Haryana - 122050

PREMIUM STAINLESS STEEL WATER BOTTLE

Net Contents: 1 Piece (750 ml capacity)
MRP: ₹ 599/- (Inclusive of all taxes)
Date of Manufacture: 04/2026

Consumer Helpline: 1800-111-2345
Email: info@homecraft.co.in

Made in India`,
  };

  const text = demoTexts[category] || demoTexts['general'];

  const lines: OCRLine[] = text.split('\n').map((lineText, idx) => ({
    text: lineText,
    confidence: 85 + Math.random() * 15,
    bbox: { x: 10, y: idx * 30, width: 400, height: 25 },
    words: lineText.split(/\s+/).filter(Boolean).map((word, wIdx) => ({
      text: word,
      confidence: 80 + Math.random() * 20,
      bbox: { x: 10 + wIdx * 60, y: idx * 30, width: 50, height: 22 },
      fontSize: 22,
    })),
  }));

  const words = lines.flatMap((l) => l.words);

  return {
    fullText: text,
    words,
    lines,
    confidence: 90 + Math.random() * 8,
  };
}

export { type ExtractedDeclaration };
