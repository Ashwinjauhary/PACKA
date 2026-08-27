// Rule Engine — Evaluates extracted declarations against LMPC Rules, 2011

import { DeclarationFieldType, DeclarationCheckResult, DECLARATION_FIELDS, ExtractedDeclaration } from '../types/declarations';
import { RuleViolation } from '../types/rules';
import lmpcRules from '../config/lmpc-rules.json';

export interface RuleEngineResult {
  checks: DeclarationCheckResult[];
  violations: RuleViolation[];
  score: number;
}

/**
 * Run all rule checks against extracted declaration fields.
 */
export function evaluateCompliance(
  extractedFields: ExtractedDeclaration[],
  category: string,
  isImported: boolean = false,
  packageWeightKg?: number
): RuleEngineResult {
  const checks: DeclarationCheckResult[] = [];
  const violations: RuleViolation[] = [];

  // Get category config
  const categoryConfig = lmpcRules.categories.find((c) => c.id === category)
    || lmpcRules.categories.find((c) => c.id === 'general')!;

  const requiredFields = new Set(categoryConfig.requiredFields);
  const conditionalFields = new Set(categoryConfig.conditionalFields);

  // Rule 3 Exemption: Packages > 25kg
  const isExemptWeight = packageWeightKg !== undefined && packageWeightKg > 25;

  for (const field of DECLARATION_FIELDS) {
    const extracted = extractedFields.find((e) => e.fieldType === field.type);
    const rule = lmpcRules.rules.find((r) => r.field === field.type);

    if (!rule || !rule.active) {
      checks.push({
        fieldType: field.type,
        label: field.label,
        status: 'skip',
        ruleClause: field.ruleRef,
        extractedText: null,
        details: 'Rule not active',
        confidence: 0,
      });
      continue;
    }

    // Determine if this field is required for the category
    const isRequired = requiredFields.has(field.type);
    const isConditional = conditionalFields.has(field.type);

    // Exemption handling for >25kg
    if (isExemptWeight && (field.type === 'mrp' || field.type === 'unit_sale_price' || field.type === 'net_quantity')) {
      checks.push(createSkipResult(field.type, field.label, field.ruleRef, extracted, 'Exempt under Rule 3 (Package > 25kg)'));
      continue;
    }

    // Handle conditional fields
    if (field.conditional && !isRequired) {
      // Country of origin is required only for imported goods
      if (field.type === 'country_of_origin' && !isImported) {
        checks.push(createSkipResult(field.type, field.label, field.ruleRef, extracted, 'Not applicable (domestic product)'));
        continue;
      }

      // Best before — required for food category
      if (field.type === 'best_before' && category !== 'food' && category !== 'cosmetics') {
        if (!isConditional) {
          checks.push(createSkipResult(field.type, field.label, field.ruleRef, extracted, `Not required for ${category} category`));
          continue;
        }
      }

      // Dimensions — required for apparel
      if (field.type === 'dimensions' && category !== 'apparel') {
        if (!isConditional || !extracted) {
          checks.push(createSkipResult(field.type, field.label, field.ruleRef, extracted, `Conditional for ${category} category`));
          continue;
        }
      }

      // Unit sale price — conditional
      if (field.type === 'unit_sale_price' && !extracted) {
        checks.push(createSkipResult(field.type, field.label, field.ruleRef, extracted, 'Not prescribed for this product'));
        continue;
      }
    }

    // Check presence
    if (!extracted) {
      const status = isRequired ? 'fail' : 'warn';
      checks.push({
        fieldType: field.type,
        label: field.label,
        status,
        ruleClause: rule.clause,
        extractedText: null,
        details: `${field.label} not found on the package`,
        confidence: 0,
      });

      if (status === 'fail') {
        violations.push({
          ruleId: rule.id,
          clause: rule.clause,
          severity: 'error',
          message: `Missing mandatory declaration: ${field.label}`,
          field: field.type,
          expected: 'Present',
          found: 'Not found',
        });
      }
      continue;
    }

    // Arithmetic check for Unit Sale Price
    if (field.type === 'unit_sale_price' && extracted?.numericValue) {
      const mrpField = extractedFields.find(e => e.fieldType === 'mrp');
      const qtyField = extractedFields.find(e => e.fieldType === 'net_quantity');
      
      if (mrpField?.numericValue && qtyField?.numericValue && qtyField.numericValue > 0) {
        let baseQty = qtyField.numericValue;
        // Normalise to kg/l
        if (qtyField.unit === 'g' || qtyField.unit === 'ml') {
          baseQty = baseQty / 1000;
        }
        
        const expectedUSP = mrpField.numericValue / baseQty;
        // Allow a small margin of error for rounding
        if (Math.abs(extracted.numericValue - expectedUSP) > 1.0) {
          checks.push({
            fieldType: field.type,
            label: field.label,
            status: 'fail',
            ruleClause: rule.clause,
            extractedText: extracted.rawText,
            details: `Arithmetic mismatch: USP declared is ${extracted.numericValue}, but MRP/Qty = ${expectedUSP.toFixed(2)}`,
            confidence: extracted.confidence
          });
          violations.push({
            ruleId: rule.id,
            clause: rule.clause,
            severity: 'error',
            message: `Arithmetic mismatch for Unit Sale Price.`,
            field: field.type,
            expected: expectedUSP.toFixed(2).toString(),
            found: extracted.numericValue.toString()
          });
          continue; // skip the regular format check
        }
      }
    }

    // Run format-specific checks
    const checkResult = runFormatCheck(field.type, extracted, rule);
    checks.push({
      fieldType: field.type,
      label: field.label,
      ...checkResult,
      ruleClause: rule.clause,
    });

    if (checkResult.status === 'fail') {
      violations.push({
        ruleId: rule.id,
        clause: rule.clause,
        severity: 'error',
        message: checkResult.details,
        field: field.type,
        expected: rule.format || 'Valid format',
        found: extracted.rawText,
      });
    } else if (checkResult.status === 'warn') {
      violations.push({
        ruleId: rule.id,
        clause: rule.clause,
        severity: 'warning',
        message: checkResult.details,
        field: field.type,
        expected: rule.format || 'Standard format',
        found: extracted.rawText,
      });
    }
  }

  // Calculate score
  const totalApplicable = checks.filter((c) => c.status !== 'skip').length;
  const passed = checks.filter((c) => c.status === 'pass').length;
  const score = totalApplicable > 0 ? Math.round((passed / totalApplicable) * 100) : 0;

  return { checks, violations, score };
}

function runFormatCheck(
  fieldType: DeclarationFieldType,
  extracted: ExtractedDeclaration,
  rule: typeof lmpcRules.rules[0]
): Pick<DeclarationCheckResult, 'status' | 'extractedText' | 'details' | 'confidence'> {
  const text = extracted.rawText;
  const confidence = extracted.confidence;

  switch (fieldType) {
    case 'net_quantity':
      return checkNetQuantity(text, confidence);
    case 'mrp':
      return checkMRP(text, confidence);
    case 'manufacture_date':
      return checkManufactureDate(text, confidence);
    case 'best_before':
      return checkBestBefore(text, confidence);
    case 'consumer_care':
      return checkConsumerCare(text, confidence);
    default:
      // Basic presence check
      if (text.trim().length > 2) {
        return {
          status: confidence > 60 ? 'pass' : 'warn',
          extractedText: text,
          details: confidence > 60
            ? `${DECLARATION_FIELDS.find(f => f.type === fieldType)?.label || fieldType} detected`
            : `Low confidence detection (${Math.round(confidence)}%)`,
          confidence,
        };
      }
      return {
        status: 'fail',
        extractedText: text,
        details: `Insufficient content for ${fieldType}`,
        confidence,
      };
  }
}

function checkNetQuantity(text: string, confidence: number) {
  const unitPattern = /\d+\.?\d*\s*(?:g|gm|gms|gram|grams|kg|kgs|ml|mL|ltr|l|litre|litres|cm|mm|m|pieces?|pcs|nos|units?)/i;
  const hasUnit = unitPattern.test(text);

  if (hasUnit) {
    return {
      status: 'pass' as const,
      extractedText: text,
      details: 'Net quantity with valid standard unit detected',
      confidence,
    };
  }
  return {
    status: 'warn' as const,
    extractedText: text,
    details: 'Net quantity found but standard unit format may not comply',
    confidence: confidence * 0.7,
  };
}

function checkMRP(text: string, confidence: number) {
  const mrpPattern = /(?:mrp|m\.?r\.?p\.?|max\.?\s*retail)/i;
  const pricePattern = /[₹]?\s*(?:rs\.?\s*)?\d+\.?\d*/i;
  const inclusivePattern = /incl|inclusive|all\s*taxes/i;

  const hasMRPLabel = mrpPattern.test(text);
  const hasPrice = pricePattern.test(text);

  if (hasMRPLabel && hasPrice) {
    return {
      status: 'pass' as const,
      extractedText: text,
      details: 'MRP with proper labeling detected' + (inclusivePattern.test(text) ? ' (inclusive of taxes noted)' : ''),
      confidence,
    };
  }
  if (hasPrice) {
    return {
      status: 'warn' as const,
      extractedText: text,
      details: 'Price found but "Max. Retail Price" wording may be missing',
      confidence: confidence * 0.8,
    };
  }
  return {
    status: 'fail' as const,
    extractedText: text,
    details: 'MRP not properly formatted',
    confidence: confidence * 0.5,
  };
}

function checkManufactureDate(text: string, confidence: number) {
  const datePattern = /\d{1,2}[/\-]\d{2,4}/;
  const monthYearPattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{4}/i;

  if (datePattern.test(text) || monthYearPattern.test(text)) {
    return {
      status: 'pass' as const,
      extractedText: text,
      details: 'Valid manufacture date format detected',
      confidence,
    };
  }
  return {
    status: 'warn' as const,
    extractedText: text,
    details: 'Date indicator found but valid MM/YYYY format not confirmed',
    confidence: confidence * 0.7,
  };
}

function checkBestBefore(text: string, confidence: number) {
  const datePattern = /\d{1,2}[/\-]\d{2,4}/;
  const durationPattern = /\d+\s*(?:months?|days?|years?|hrs?|hours?)/i;

  if (datePattern.test(text) || durationPattern.test(text)) {
    return {
      status: 'pass' as const,
      extractedText: text,
      details: 'Best before/expiry information with valid format detected',
      confidence,
    };
  }
  return {
    status: 'warn' as const,
    extractedText: text,
    details: 'Expiry indicator found but date format not fully validated',
    confidence: confidence * 0.7,
  };
}

function checkConsumerCare(text: string, confidence: number) {
  const phonePattern = /(?:1800[\-\s]?\d{3}[\-\s]?\d{4}|\d{3,4}[\-\s]\d{6,8}|\d{10,})/;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  const hasPhone = phonePattern.test(text);
  const hasEmail = emailPattern.test(text);

  if (hasPhone || hasEmail) {
    return {
      status: 'pass' as const,
      extractedText: text,
      details: `Consumer care details detected (${hasPhone ? 'phone' : ''}${hasPhone && hasEmail ? ' + ' : ''}${hasEmail ? 'email' : ''})`,
      confidence,
    };
  }
  return {
    status: 'warn' as const,
    extractedText: text,
    details: 'Consumer care section found but contact details not clearly identified',
    confidence: confidence * 0.6,
  };
}

function createSkipResult(
  fieldType: DeclarationFieldType,
  label: string,
  ruleClause: string,
  extracted: ExtractedDeclaration | undefined,
  reason: string
): DeclarationCheckResult {
  return {
    fieldType,
    label,
    status: 'skip',
    ruleClause,
    extractedText: extracted?.rawText || null,
    details: reason,
    confidence: extracted?.confidence || 0,
  };
}
