// Scan record types

import { DeclarationCheckResult } from './declarations';
import { RuleViolation } from './rules';

export interface ScanRecord {
  id: string;
  timestamp: string;
  imageDataUrl: string;  // base64 data URL for MVP (localStorage)
  imageName: string;
  productInfo: ProductInfo;
  ocrText: string;
  results: DeclarationCheckResult[];
  violations: RuleViolation[];
  verdict: ComplianceVerdict;
  officerNotes: string;
  ruleVersion: string;
  packageDimensions?: PackageDimensions;
}

export interface ProductInfo {
  productName: string;
  brandName: string;
  category: string;
  barcode?: string;
  packageWeightKg?: number;
}

export interface PackageDimensions {
  shape: 'rectangular' | 'cylindrical' | 'other';
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  diameterCm?: number;
  pdpAreaCmSq?: number;
}

export interface ComplianceVerdict {
  status: 'compliant' | 'non_compliant' | 'needs_review';
  score: number; // 0-100
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  skipped: number;
  summary: string;
}

export type ScanFilter = {
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  verdict: '' | 'compliant' | 'non_compliant' | 'needs_review';
  category: string;
};
