// PDF Export — Generate compliance report PDFs using jsPDF

import jsPDF from 'jspdf';
import { ScanRecord } from '../types/scan';

export async function generatePDF(scan: ScanRecord): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Helper functions
  const addText = (text: string, x: number, yPos: number, options?: { fontSize?: number; fontStyle?: string; color?: [number, number, number]; maxWidth?: number }) => {
    doc.setFontSize(options?.fontSize || 10);
    doc.setFont('helvetica', options?.fontStyle || 'normal');
    if (options?.color) doc.setTextColor(...options.color);
    else doc.setTextColor(30, 30, 30);
    doc.text(text, x, yPos, { maxWidth: options?.maxWidth || contentWidth });
  };

  const addLine = (y1: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y1, pageWidth - margin, y1);
  };

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header ──
  addText('PACKA', margin, y, { fontSize: 22, fontStyle: 'bold', color: [0, 166, 133] });
  y += 6;
  addText('Packaged Commodity Compliance Report', margin, y, { fontSize: 10, color: [100, 100, 100] });
  y += 4;
  addText('Under Legal Metrology (Packaged Commodities) Rules, 2011', margin, y, { fontSize: 8, color: [130, 130, 130] });
  y += 8;
  addLine(y);
  y += 8;

  // ── Verdict Banner ──
  const verdictColor: [number, number, number] =
    scan.verdict.status === 'compliant' ? [16, 185, 129] :
    scan.verdict.status === 'non_compliant' ? [239, 68, 68] :
    [245, 158, 11];

  const verdictLabel =
    scan.verdict.status === 'compliant' ? 'COMPLIANT' :
    scan.verdict.status === 'non_compliant' ? 'NON-COMPLIANT' :
    'NEEDS REVIEW';

  doc.setFillColor(...verdictColor);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  addText(verdictLabel, margin + contentWidth / 2 - 15, y + 9, { fontSize: 16, fontStyle: 'bold', color: [255, 255, 255] });
  addText(`Score: ${scan.verdict.score}%`, margin + contentWidth / 2 - 10, y + 16, { fontSize: 9, color: [255, 255, 255] });
  y += 28;

  // ── Scan Details ──
  addText('Scan Details', margin, y, { fontSize: 12, fontStyle: 'bold' });
  y += 7;

  const details = [
    ['Scan ID', scan.id],
    ['Date & Time', new Date(scan.timestamp).toLocaleString('en-IN')],
    ['Product', scan.productInfo.productName || 'N/A'],
    ['Brand', scan.productInfo.brandName || 'N/A'],
    ['Category', scan.productInfo.category],
    ['Rule Version', scan.ruleVersion],
    ['Image', scan.imageName],
  ];

  for (const [label, value] of details) {
    addText(`${label}:`, margin, y, { fontSize: 9, fontStyle: 'bold', color: [80, 80, 80] });
    addText(value, margin + 35, y, { fontSize: 9 });
    y += 5;
  }
  y += 5;
  addLine(y);
  y += 8;

  // ── Scanned Image ──
  let imgData = scan.imageDataUrl;
  if (!imgData && scan.imageUrl) {
    try {
      // Fetch the image from the server proxy and convert to base64
      const response = await fetch(scan.imageUrl);
      const blob = await response.blob();
      imgData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to fetch image for PDF', e);
    }
  }

  if (imgData) {
    checkPage(70);
    addText('Scanned Package Image', margin, y, { fontSize: 12, fontStyle: 'bold' });
    y += 7;
    try {
      // Adding image to PDF. 80x60mm maintains a reasonable thumbnail size.
      // We pass the data URL directly, jsPDF will auto-detect JPEG/PNG.
      doc.addImage(imgData, margin, y, 80, 60, undefined, 'FAST');
      y += 65;
    } catch (e) {
      console.warn('Could not add image to PDF', e);
      addText('(Image could not be rendered)', margin, y, { fontSize: 9, color: [150, 150, 150]});
      y += 10;
    }
    addLine(y);
    y += 8;
  }

  // ── Summary ──
  addText('Compliance Summary', margin, y, { fontSize: 12, fontStyle: 'bold' });
  y += 7;

  addText(`Total Checks: ${scan.verdict.totalChecks}`, margin, y, { fontSize: 9 });
  y += 5;
  addText(`Passed: ${scan.verdict.passedChecks}`, margin, y, { fontSize: 9, color: [16, 185, 129] });
  addText(`Failed: ${scan.verdict.failedChecks}`, margin + 40, y, { fontSize: 9, color: [239, 68, 68] });
  addText(`Warnings: ${scan.verdict.warnings}`, margin + 75, y, { fontSize: 9, color: [245, 158, 11] });
  addText(`Skipped: ${scan.verdict.skipped}`, margin + 115, y, { fontSize: 9, color: [130, 130, 130] });
  y += 5;
  addText(scan.verdict.summary, margin, y, { fontSize: 9, color: [80, 80, 80], maxWidth: contentWidth });
  y += 10;
  addLine(y);
  y += 8;

  // ── Declaration-by-Declaration Results ──
  addText('Declaration-by-Declaration Analysis', margin, y, { fontSize: 12, fontStyle: 'bold' });
  y += 8;

  for (const result of scan.results) {
    checkPage(25);

    const statusColor: [number, number, number] =
      result.status === 'pass' ? [16, 185, 129] :
      result.status === 'fail' ? [239, 68, 68] :
      result.status === 'warn' ? [245, 158, 11] :
      [130, 130, 130];

    const statusLabel = result.status.toUpperCase();

    // Status badge
    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, y - 3, 14, 5, 1, 1, 'F');
    addText(statusLabel, margin + 1, y, { fontSize: 6, fontStyle: 'bold', color: [255, 255, 255] });

    // Field name
    addText(result.label, margin + 18, y, { fontSize: 9, fontStyle: 'bold' });
    y += 4;

    // Rule clause
    addText(`Clause: ${result.ruleClause}`, margin + 18, y, { fontSize: 7, color: [100, 100, 100] });
    y += 4;

    // Details
    addText(result.details, margin + 18, y, { fontSize: 8, color: [80, 80, 80], maxWidth: contentWidth - 20 });
    y += 4;

    // Extracted text
    if (result.extractedText) {
      addText(`Extracted: "${result.extractedText.substring(0, 80)}${result.extractedText.length > 80 ? '...' : ''}"`, margin + 18, y, { fontSize: 7, color: [120, 120, 120], maxWidth: contentWidth - 20 });
      y += 4;
    }

    // Font measurement
    if (result.fontMeasurement) {
      const fm = result.fontMeasurement;
      const fmColor: [number, number, number] = fm.pass ? [16, 185, 129] : [239, 68, 68];
      addText(`Font: ${fm.measuredHeightMm}mm measured / ${fm.requiredHeightMm}mm required — ${fm.pass ? 'PASS' : 'FAIL'}`, margin + 18, y, { fontSize: 7, color: fmColor });
      y += 4;
    }

    y += 3;
  }

  // ── Violations Summary ──
  if (scan.violations.length > 0) {
    checkPage(20);
    y += 5;
    addLine(y);
    y += 8;
    addText('Violations Summary', margin, y, { fontSize: 12, fontStyle: 'bold', color: [239, 68, 68] });
    y += 8;

    for (const violation of scan.violations) {
      checkPage(15);
      addText(`• [${violation.clause}] ${violation.message}`, margin + 5, y, { fontSize: 8, maxWidth: contentWidth - 10 });
      y += 5;
    }
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    addText(
      `Generated by PACKA — ${new Date().toLocaleString('en-IN')} — Page ${i} of ${totalPages}`,
      margin, pageH - 8,
      { fontSize: 7, color: [150, 150, 150] }
    );
    addText(
      'This is a decision-support document. Final enforcement action rests with the authorised Legal Metrology Officer.',
      margin, pageH - 4,
      { fontSize: 6, color: [180, 180, 180] }
    );
  }

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
