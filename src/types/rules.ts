// Rule engine types

export interface RuleSet {
  version: string;
  effectiveDate: string;
  amendments: string[];
  rules: Rule[];
  fontSizeThresholds: FontSizeThreshold[];
  exemptions: Exemption[];
  categories: ProductCategory[];
}

export interface Rule {
  id: string;
  clause: string;
  field: string;
  check: RuleCheckType;
  required: boolean;
  description: string;
  format?: string;
  pattern?: string;
  crossFieldCheck?: CrossFieldCheck;
  active: boolean;
}

export type RuleCheckType =
  | 'presence'
  | 'format'
  | 'date_validity'
  | 'currency_format'
  | 'unit_format'
  | 'cross_field'
  | 'conditional_presence'
  | 'font_size';

export interface FontSizeThreshold {
  pdpAreaMinCmSq: number;
  pdpAreaMaxCmSq: number;
  minLetterHeightMm: number;
  minNumeralHeightMm: number;
  description: string;
}

export interface Exemption {
  id: string;
  clause: string;
  condition: string;
  description: string;
  affectedFields: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  requiredFields: string[];
  conditionalFields: string[];
  specialRules?: string[];
}

export interface CrossFieldCheck {
  type: 'arithmetic' | 'date_range' | 'consistency';
  fields: string[];
  formula?: string;
  tolerance?: number;
}

export interface RuleViolation {
  ruleId: string;
  clause: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field: string;
  expected?: string;
  found?: string;
}
