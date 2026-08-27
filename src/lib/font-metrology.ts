// Font Metrology Module — PDP area estimation and font height measurement

import { PackageDimensions } from '../types/scan';
import { FontMeasurement } from '../types/declarations';
import lmpcRules from '../config/lmpc-rules.json';

export interface PDPResult {
  pdpAreaCmSq: number;
  minLetterHeightMm: number;
  minNumeralHeightMm: number;
  thresholdDescription: string;
}

/**
 * Calculate PDP (Principal Display Panel) area from package dimensions.
 * Per LMPC Rules:
 * - Rectangular packs: one full face (width × height)
 * - Cylindrical packs: ~40% of total surface area
 * - Other shapes: ~40% of total surface area (excl. tops/bottoms)
 */
export function calculatePDPArea(dimensions: PackageDimensions): number {
  switch (dimensions.shape) {
    case 'rectangular': {
      const w = dimensions.widthCm || 0;
      const h = dimensions.heightCm || 0;
      return w * h; // One full face
    }
    case 'cylindrical': {
      const d = dimensions.diameterCm || 0;
      const h = dimensions.heightCm || 0;
      const circumference = Math.PI * d;
      const totalSurfaceArea = circumference * h + 2 * Math.PI * (d / 2) ** 2;
      return totalSurfaceArea * 0.4; // ~40% of surface area
    }
    case 'other': {
      const w = dimensions.widthCm || 0;
      const h = dimensions.heightCm || 0;
      const d = dimensions.depthCm || w;
      // Approximate: total surface area minus top/bottom, × 40%
      const totalSA = 2 * (w * h + w * d + h * d);
      const excludedArea = 2 * (w * d); // Top and bottom
      return (totalSA - excludedArea) * 0.4;
    }
    default:
      return 0;
  }
}

/**
 * Get the minimum font size thresholds for a given PDP area.
 */
export function getFontThresholds(pdpAreaCmSq: number): PDPResult {
  const thresholds = lmpcRules.fontSizeThresholds;

  for (const t of thresholds) {
    if (pdpAreaCmSq >= t.pdpAreaMinCmSq && pdpAreaCmSq < t.pdpAreaMaxCmSq) {
      return {
        pdpAreaCmSq,
        minLetterHeightMm: t.minLetterHeightMm,
        minNumeralHeightMm: t.minNumeralHeightMm,
        thresholdDescription: t.description,
      };
    }
  }

  // Default to the largest band
  const last = thresholds[thresholds.length - 1];
  return {
    pdpAreaCmSq,
    minLetterHeightMm: last.minLetterHeightMm,
    minNumeralHeightMm: last.minNumeralHeightMm,
    thresholdDescription: last.description,
  };
}

/**
 * Convert pixel height to millimetres using a known reference dimension.
 * 
 * @param pixelHeight - Height of the text in pixels
 * @param imageWidthPx - Total image width in pixels
 * @param knownWidthCm - Known real-world width of the package in cm
 * @returns Height in millimetres
 */
export function pixelsToMm(
  pixelHeight: number,
  imageWidthPx: number,
  knownWidthCm: number
): number {
  const pixelsPerCm = imageWidthPx / knownWidthCm;
  const pixelsPerMm = pixelsPerCm / 10;
  return pixelHeight / pixelsPerMm;
}

/**
 * Measure font heights from OCR bounding boxes and compare against thresholds.
 */
export function measureFontCompliance(
  avgCharHeightPx: number,
  imageWidthPx: number,
  packageWidthCm: number,
  pdpAreaCmSq: number,
  isNumeral: boolean = false
): FontMeasurement {
  const measuredMm = pixelsToMm(avgCharHeightPx, imageWidthPx, packageWidthCm);
  const thresholds = getFontThresholds(pdpAreaCmSq);
  const requiredMm = isNumeral
    ? thresholds.minNumeralHeightMm
    : thresholds.minLetterHeightMm;

  return {
    measuredHeightMm: Math.round(measuredMm * 10) / 10,
    requiredHeightMm: requiredMm,
    pass: measuredMm >= requiredMm - 0.2, // 0.2mm tolerance
  };
}

/**
 * Estimate font heights for demo mode (when actual measurement isn't available).
 */
export function simulateFontMeasurement(pdpAreaCmSq: number): FontMeasurement {
  const thresholds = getFontThresholds(pdpAreaCmSq);
  // Simulate: ~70% chance of passing
  const passes = Math.random() > 0.3;
  const required = thresholds.minLetterHeightMm;
  const measured = passes
    ? required + Math.random() * 1.5
    : required - 0.3 - Math.random() * 0.5;

  return {
    measuredHeightMm: Math.round(Math.max(0.5, measured) * 10) / 10,
    requiredHeightMm: required,
    pass: passes,
  };
}
