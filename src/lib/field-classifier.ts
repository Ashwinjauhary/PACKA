// Field Classifier — Maps OCR text to 10 LMPC declaration fields

import { DeclarationFieldType, ExtractedDeclaration } from '../types/declarations';

interface FieldPattern {
  type: DeclarationFieldType;
  patterns: RegExp[];
  extractValue: (text: string, matchedLine: string) => string;
  extractNumeric?: (extractedValue: string) => { numericValue: number; unit?: string } | undefined;
}

const FIELD_PATTERNS: FieldPattern[] = [
  {
    type: 'manufacturer_details',
    patterns: [
      /(?:mfg|manufactured|packed|marketed|made)\s*(?:by|at|&\s*marketed)/i,
      /(?:packer|importer|manufacturer)\s*[:.\-]/i,
      /(?:pvt\.?\s*ltd|limited|llp|inc|corp)/i,
      /\b\d{6}\b/,  // PIN code
    ],
    extractValue: (text, matched) => {
      // Try to get the full address block (2-3 lines around the match)
      const lines = text.split('\n');
      const matchIdx = lines.findIndex((l) => l.includes(matched));
      if (matchIdx >= 0) {
        const start = Math.max(0, matchIdx - 1);
        const end = Math.min(lines.length, matchIdx + 3);
        return lines.slice(start, end).join('\n').trim();
      }
      return matched;
    },
  },
  {
    type: 'commodity_name',
    patterns: [
      /^[A-Z][A-Z\s]{3,}$/m,  // ALL CAPS line (likely product name)
    ],
    extractValue: (_text, matched) => matched.trim(),
  },
  {
    type: 'net_quantity',
    patterns: [
      /(?:net\s*(?:wt|weight|qty|quantity|contents?|vol|volume))\s*[:.\-]?\s*\d+\.?\d*\s*(?:g|gm|gms|gram|grams|kg|kgs|ml|mL|ltr|l|litre|litres|cm|mm|m|pieces?|pcs|nos|units?|tablets?|capsules?|sachets?)/i,
      /\b\d+\.?\d*\s*(?:g|kg|ml|l|ltr|litre)\b/i,
    ],
    extractValue: (_text, matched) => {
      const m = matched.match(/\d+\.?\d*\s*(?:g|gm|gms|gram|grams|kg|kgs|ml|mL|ltr|l|litre|litres|cm|mm|m|pieces?|pcs|nos|units?|tablets?|capsules?|sachets?)/i);
      return m ? m[0].trim() : matched.trim();
    },
    extractNumeric: (val) => {
      const m = val.match(/(\d+\.?\d*)\s*([a-zA-Z]+)/);
      if (m) {
        let unit = m[2].toLowerCase();
        if (unit.startsWith('g')) unit = 'g';
        if (unit.startsWith('k')) unit = 'kg';
        if (unit.startsWith('m')) unit = 'ml';
        if (unit.startsWith('l')) unit = 'l';
        return { numericValue: parseFloat(m[1]), unit };
      }
      return undefined;
    }
  },
  {
    type: 'manufacture_date',
    patterns: [
      /(?:mfg|manufacture|mfd|manufactured|packed|packing|pkg)\s*(?:\.?\s*date|\.?\s*dt\.?|\.?\s*on)?\s*[:.\-]?\s*(?:\d{1,2}[/\-]\d{2,4}|\w+\s+\d{4})/i,
      /(?:date\s*of\s*(?:manufacture|mfg|packing|pkg))\s*[:.\-]?\s*\d{1,2}[/\-]\d{2,4}/i,
      /(?:month\s*&?\s*year\s*of\s*(?:manufacture|mfg))/i,
    ],
    extractValue: (_text, matched) => {
      const dateMatch = matched.match(/\d{1,2}[/\-]\d{2,4}/);
      if (dateMatch) return dateMatch[0];
      const monthYear = matched.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{4}/i);
      if (monthYear) return monthYear[0];
      return matched.trim();
    },
  },
  {
    type: 'mrp',
    patterns: [
      /(?:mrp|m\.?r\.?p\.?|max\.?\s*retail\s*price|maximum\s*retail\s*price)\s*[:.\-]?\s*[₹rs.]*\s*\d+\.?\d*/i,
      /[₹]\s*\d+\.?\d*/,
      /(?:rs\.?|inr)\s*\d+\.?\d*/i,
    ],
    extractValue: (_text, matched) => {
      const priceMatch = matched.match(/[₹]?\s*(?:rs\.?\s*)?(\d+\.?\d*)/i);
      return priceMatch ? `₹${priceMatch[1]}` : matched.trim();
    },
    extractNumeric: (val) => {
      const m = val.match(/(\d+\.?\d*)/);
      return m ? { numericValue: parseFloat(m[1]), unit: 'INR' } : undefined;
    }
  },
  {
    type: 'consumer_care',
    patterns: [
      /(?:consumer\s*care|customer\s*care|helpline|toll\s*free|complaint|grievance)/i,
      /\b1800[\-\s]?\d{3}[\-\s]?\d{4}\b/,
      /\b\d{3,4}[\-\s]\d{7,8}\b/,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    ],
    extractValue: (text, matched) => {
      const lines = text.split('\n');
      const matchIdx = lines.findIndex((l) => l.includes(matched));
      if (matchIdx >= 0) {
        const start = matchIdx;
        const end = Math.min(lines.length, matchIdx + 2);
        return lines.slice(start, end).join('\n').trim();
      }
      return matched;
    },
  },
  {
    type: 'country_of_origin',
    patterns: [
      /(?:country\s*of\s*origin|made\s*in|imported\s*(?:by|from)|product\s*of)/i,
    ],
    extractValue: (_text, matched) => matched.trim(),
  },
  {
    type: 'dimensions',
    patterns: [
      /(?:dimensions?|size)\s*[:.\-]?\s*\d+/i,
      /\d+\s*(?:mm|cm|inch|inches|m)\s*[x×X]\s*\d+/i,
    ],
    extractValue: (_text, matched) => matched.trim(),
  },
  {
    type: 'unit_sale_price',
    patterns: [
      /(?:per\s*(?:g|gm|kg|ml|l|litre|unit|piece|tablet)|price\s*per|unit\s*price|rate\s*per|USP)/i,
      /[₹rs.]\s*\d+\.?\d*\s*\/\s*(?:g|kg|ml|l)/i,
    ],
    extractValue: (_text, matched) => matched.trim(),
    extractNumeric: (val) => {
      const m = val.match(/(\d+\.?\d*)/);
      return m ? { numericValue: parseFloat(m[1]), unit: 'INR' } : undefined;
    }
  },
  {
    type: 'best_before',
    patterns: [
      /(?:best\s*before|use\s*by|expiry|exp\.?\s*(?:date|dt\.?)?|bb\.?\s*(?:date)?|shelf\s*life|valid\s*(?:till|until|upto))/i,
    ],
    extractValue: (text, matched) => {
      const lines = text.split('\n');
      const matchIdx = lines.findIndex((l) =>
        l.toLowerCase().includes(matched.toLowerCase().substring(0, 10))
      );
      if (matchIdx >= 0) return lines[matchIdx].trim();
      return matched.trim();
    },
  },
];

export function classifyFields(fullText: string): ExtractedDeclaration[] {
  const results: ExtractedDeclaration[] = [];
  const lines = fullText.split('\n');
  const usedLines = new Set<number>();

  for (const fieldPattern of FIELD_PATTERNS) {
    let bestMatch: { line: string; lineIdx: number; confidence: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      if (usedLines.has(i)) continue;

      const line = lines[i];
      for (const pattern of fieldPattern.patterns) {
        if (pattern.test(line)) {
          const conf = 70 + Math.random() * 25;
          if (!bestMatch || conf > bestMatch.confidence) {
            bestMatch = { line, lineIdx: i, confidence: conf };
          }
          break;
        }
      }
    }

    if (bestMatch) {
      usedLines.add(bestMatch.lineIdx);
      const extractedValue = fieldPattern.extractValue(fullText, bestMatch.line);
      const numData = fieldPattern.extractNumeric ? fieldPattern.extractNumeric(extractedValue) : undefined;
      results.push({
        fieldType: fieldPattern.type,
        rawText: extractedValue,
        confidence: bestMatch.confidence,
        parsedValue: extractedValue,
        numericValue: numData?.numericValue,
        unit: numData?.unit,
      });
    }
  }

  // Try to identify commodity name if not found via patterns
  // Look for the first prominent ALL CAPS line that isn't already classified
  if (!results.find((r) => r.fieldType === 'commodity_name')) {
    for (let i = 0; i < lines.length; i++) {
      if (usedLines.has(i)) continue;
      const line = lines[i].trim();
      if (line.length > 3 && line === line.toUpperCase() && /[A-Z]/.test(line)) {
        results.push({
          fieldType: 'commodity_name',
          rawText: line,
          confidence: 65,
          parsedValue: line,
        });
        break;
      }
    }
  }

  return results;
}

export function getFieldConfidence(
  extracted: ExtractedDeclaration[],
  fieldType: DeclarationFieldType
): number {
  const field = extracted.find((e) => e.fieldType === fieldType);
  return field ? field.confidence : 0;
}
