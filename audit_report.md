# PACKA (SIH 26034) - Deep Technical Audit Report

This report cross-references the exact state of the codebase (`server/`, `src/`, `ml-backend/`) against the claims made in the SIH Documentation and Pitch.

> [!NOTE]
> **OVERALL VERDICT:** The core MVP (Scanning, OCR, Rule Engine, React UI, PostgreSQL JSONB) is fully operational. However, several "Gold Mine" features pitched in the documentation are currently only theoretical or mocked.

---

## 🟢 1. Fully Implemented & Working

These features are mathematically and logically complete in the code.

1. **Deterministic Rule Engine (`server/engine/rule-engine.ts`)**
   - Successfully evaluates extracted text against LMPC Rule 6 (Mandatory declarations).
   - Accurately processes Rule 3 (Exemption for Packages > 25kg).
   - Correctly marks `country_of_origin` as conditional (only required for imported goods).
2. **Rule 8 Font Metrology (`server/routes/scan.ts`)**
   - The system genuinely calculates font size in millimeters. It uses the user-provided "Actual Package Width (mm)" to establish a pixel-to-mm ratio, and multiplies it by the EasyOCR bounding box heights. This is a massive technical win.
3. **NLP Extraction Engine (`ml-backend/nlp.py`)**
   - Employs robust Regex-based NER (Named Entity Recognition) to pull out MRP, Net Quantity, Best Before, and Consumer Care details flawlessly.
4. **PostgreSQL JSONB Database (`server/db.ts`)**
   - The architecture is genuine. It uses a `scans` table with a `details_json` column of type `JSONB` to store the deeply nested AI rule evaluations.

---

## 🔴 2. Left Out / Fake / Incomplete (Critical Gaps)

These features are heavily promoted in `README.md` and `Documentation.md` but do **NOT** exist in the code yet.

> [!WARNING]
> If a tech-savvy judge asks to see the code for these specific features, the team will be caught empty-handed.

### A. The 2026 E-Commerce Amendment (Country of Origin Filter)
- **Documentation Claim:** System checks e-commerce websites to ensure Country of Origin is a "searchable and sortable filter" as per the 13 Feb 2026 mandate.
- **Code Reality:** **MISSING.** The `rule-engine.ts` only checks if the text "Country of Origin" is printed on a physical package. There is zero web-scraping or DOM-parsing logic to check e-commerce website filters.

### B. Barcode Cross-checking for Subtle Fraud
- **Documentation Claim:** System checks declared price/quantity against barcode database to catch inconsistencies.
- **Code Reality:** **MISSING.** The word "barcode" only exists as an optional string in a TypeScript interface (`scan.ts:25`). The Python ML backend (`vision.py`) does not use `pyzbar` or any other library to read barcodes, nor does it query any external database.

### C. e-Jagriti Portal & National Consumer Helpline Sync
- **Documentation Claim:** System acts as an integration layer, feeding data to e-Jagriti.
- **Code Reality:** **MISSING.** The API routes (`server/routes/scan.ts`) only save data locally to our own PostgreSQL database. There are no webhooks, API calls, or database flags (`ejagriti_sync_status`) actually implemented to simulate sending data to a government portal.

### D. Multi-Language / Regional Scripts
- **Documentation Claim:** Strong multilingual OCR so labels in regional scripts aren't a blind spot.
- **Code Reality:** **FAKE.** The python file `ml-backend/nlp.py` (Line 8) explicitly initializes EasyOCR in English only (`easyocr.Reader(['en'])`). Adding Hindi (`'hi'`) or Tamil (`'ta'`) is possible, but currently hardcoded to English to save RAM.

### E. AI/ML YOLOv8 Segmentation
- **Documentation Claim:** Advanced Computer Vision layout parsing for the Principal Display Panel (PDP).
- **Code Reality:** **MOCKED.** In `ml-backend/vision.py` (Line 15-18), the code admits that since YOLOv8 Nano isn't fine-tuned on a "PDP class", it just crops the largest bounding box it finds. LayoutLMv3 is also commented out in favor of regex.

---

## 📋 Recommendations for the Hackathon

To ensure we don't get caught lying, we have two options:
1. **The "Roadmap" Defense:** Keep the code as-is, but clearly state to the panel that features A, B, and C are part of "Phase 2 (Post-Hackathon Scalability)".
2. **Quick Mocking:** I can write quick mock functions for Barcode and e-Jagriti sync so they at least appear in the codebase and UI.

**Would you like me to build out the code for any of these missing features (like Barcode Fraud checking or the e-Jagriti Sync)?**
