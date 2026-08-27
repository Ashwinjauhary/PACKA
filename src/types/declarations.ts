// LMPC Declaration field types

export type DeclarationFieldType =
  | 'manufacturer_details'
  | 'commodity_name'
  | 'net_quantity'
  | 'manufacture_date'
  | 'mrp'
  | 'consumer_care'
  | 'country_of_origin'
  | 'dimensions'
  | 'unit_sale_price'
  | 'best_before';

export interface DeclarationField {
  type: DeclarationFieldType;
  label: string;
  ruleRef: string;
  required: boolean;
  conditional: boolean;
  conditionDescription?: string;
}

export interface ExtractedDeclaration {
  fieldType: DeclarationFieldType;
  rawText: string;
  confidence: number;
  boundingBox?: BoundingBox;
  parsedValue?: string;
  numericValue?: number;
  unit?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DeclarationCheckResult {
  fieldType: DeclarationFieldType;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  ruleClause: string;
  extractedText: string | null;
  details: string;
  confidence: number;
  fontMeasurement?: FontMeasurement;
}

export interface FontMeasurement {
  measuredHeightMm: number;
  requiredHeightMm: number;
  pass: boolean;
}

export const DECLARATION_FIELDS: DeclarationField[] = [
  {
    type: 'manufacturer_details',
    label: 'Manufacturer / Packer / Importer Details',
    ruleRef: 'Rule 6(1)(a)',
    required: true,
    conditional: false,
  },
  {
    type: 'commodity_name',
    label: 'Common / Generic Name of Commodity',
    ruleRef: 'Rule 6(1)(b)',
    required: true,
    conditional: false,
  },
  {
    type: 'net_quantity',
    label: 'Net Quantity',
    ruleRef: 'Rule 6(1)(c)',
    required: true,
    conditional: false,
  },
  {
    type: 'manufacture_date',
    label: 'Month & Year of Manufacture / Packing',
    ruleRef: 'Rule 6(1)(d)',
    required: true,
    conditional: false,
  },
  {
    type: 'mrp',
    label: 'Maximum Retail Price (MRP)',
    ruleRef: 'Rule 6(1)(e)',
    required: true,
    conditional: false,
  },
  {
    type: 'consumer_care',
    label: 'Consumer Care Details',
    ruleRef: 'Rule 6(1)(f)',
    required: true,
    conditional: false,
  },
  {
    type: 'country_of_origin',
    label: 'Country of Origin / Imported By',
    ruleRef: 'Rule 6(1)(g)',
    required: false,
    conditional: true,
    conditionDescription: 'Required only for imported goods',
  },
  {
    type: 'dimensions',
    label: 'Dimensions / Size of Commodity',
    ruleRef: 'Rule 6(1)(h)',
    required: false,
    conditional: true,
    conditionDescription: 'Required for apparel, tiles, and similar categories',
  },
  {
    type: 'unit_sale_price',
    label: 'Unit Sale Price',
    ruleRef: 'Rule 6(1)(i)',
    required: false,
    conditional: true,
    conditionDescription: 'Required where prescribed by Rules',
  },
  {
    type: 'best_before',
    label: 'Best Before / Use By Date',
    ruleRef: 'Rule 6(1)(j)',
    required: false,
    conditional: true,
    conditionDescription: 'Required for food and perishable goods',
  },
];
