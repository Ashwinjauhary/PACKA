import { createWorker, Worker } from 'tesseract.js';
import { BoundingBox } from './declarations';

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
  fontSize: number;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: OCRWord[];
}

let workerInstance: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerInstance) {
    workerInstance = await createWorker('eng');
  }
  return workerInstance;
}

export async function performOCR(imageBuffer: Buffer): Promise<OCRResult> {
  const worker = await getWorker();
  
  const result = await worker.recognize(imageBuffer);
  const data = result.data;

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
