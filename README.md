# PACKA: Packaged Commodity Compliance & Knowledge Assistant

> **SMART INDIA HACKATHON 2026**  
> **Problem Statement ID:** 26034  
> **Organisation:** Ministry of Consumer Affairs, Food & Public Distribution  
> **Department:** Department of Consumer Affairs (DoCA)  
> **Category:** Software  
> **Theme:** Agriculture, FoodTech & Rural Development  

**An AI-Powered Vision & Rule-Engine System for Automated Legal Metrology (Packaged Commodities) Rules, 2011 Compliance Checking.**

---

## 1. Executive Summary

Every packaged commodity sold in India — from a biscuit packet on a kirana shelf to a skincare bottle listed on an e-commerce marketplace — is legally required under the *Legal Metrology Act, 2009* and the *Legal Metrology (Packaged Commodities) Rules, 2011* to carry a defined set of declarations: manufacturer details, net quantity, MRP, date of manufacture, consumer-care information, and more. 

Enforcement of these rules today is almost entirely manual. With crores of SKUs in circulation, manual inspection cannot scale. Non-compliance remains widespread and largely undetected.

**PACKA** is a web and mobile software system that allows an enforcement officer, e-commerce compliance team, or authorised auditor to photograph or upload a product image/label and receive — within seconds — an automated, rule-mapped compliance report. 

### Key Outcomes:
* **10x+ faster inspection cycle** per SKU compared to manual checking.
* **Objective, repeatable, evidence-backed compliance verdicts**, reducing disputes.
* **Scalable coverage of e-commerce listings** through bulk/API-based scanning.
* **Live, searchable national repository** of scanned products and violation history for DoCA.
* **Rules-as-data architecture** allowing LMPC rule amendments to be deployed without re-writing application code.

---

## 2. Problem Statement — Deep Analysis

### 2.1 Mandatory Declarations under Rule 6 
PACKA's rule engine is built around this exact checklist:

| # | Declaration | What PACKA validates |
|---|---|---|
| 1 | **Manufacturer/packer details** | Presence, non-blank text block near PDP, PIN-code sanity check. |
| 2 | **Common/generic name** | Presence of a product name distinct from the brand name. |
| 3 | **Net quantity** | Numeric value + recognized standard unit (g, kg, ml, l, count); unit-conformance check. |
| 4 | **Month & year of manufacture** | Valid MM/YYYY date field; sanity check against “best before”. |
| 5 | **Retail Sale Price (MRP)** | Currency-formatted numeric value adjacent to prescribed MRP phrasing; inclusive-of-tax phrase detection. |
| 6 | **Consumer care details** | Contact block containing a phone-number or e-mail pattern. |
| 7 | **Country of origin** | Conditional check triggered when import indicators are detected. |
| 8 | **Dimensions/size** | Category-conditional presence check. |
| 9 | **Unit sale price** | Arithmetic cross-check (MRP ÷ net quantity). |
| 10 | **“Best before” / “Use by”** | Conditional presence + valid date-pattern check. |

### 2.2 Font Size & Placement (Rule 8) — The Hardest Part to Automate
Beyond mere presence, declarations must sit on the **Principal Display Panel (PDP)** and scale up in size with the PDP area. PACKA estimates PDP area from the package image, measures detected-text cap-height in millimetres via a pixel-to-mm calibration step, and flags any declaration whose measured height falls below the rule-mapped minimum for that PDP band.

---

## 3. Proposed Solution — PACKA

PACKA is a modular, cloud-deployable software system with three user-facing surfaces (officer mobile app, web console, e-commerce bulk/API interface) sitting on a shared AI + rule-engine backend.

### High-Level Architecture
1. **Presentation Layer:** Progressive Web App + native-feel mobile app (Flutter) for field officers; React web console for supervisors.
2. **API & Orchestration Layer:** API gateway fronting microservices (Scan Orchestrator, Report Generator, Repository Service).
3. **AI / Vision Layer:** Image Pre-processing → Package & PDP Detection → OCR & Multilingual Text Extraction → Declaration Field Classifier → Font-Metrology Module.
4. **Rule Engine Layer:** A versioned, JSON/YAML-encoded rule set mirroring LMPC Rules, 2011 clauses. Produces a structured verdict object with clause references.
5. **Data & Storage Layer:** Relational store (PostgreSQL) for records, object storage (S3) for images/reports, search index for repository search.

> **Design principle: Rules-as-Data**
> The LMPC Rules are encoded as versioned, human-editable rule objects. When DoCA issues an amendment, an authorised administrator can publish an updated rule-set without a software release.

---

## 4. Technology Stack

| Layer | Recommended Technologies |
|---|---|
| **Mobile App** | Flutter (Android/iOS), offline-first local queue |
| **Web Console** | React + TypeScript, Tailwind CSS, Recharts |
| **API Gateway & Auth** | Node.js; OAuth2 / JWT; Govt SSO integration |
| **OCR & Text Extraction** | PaddleOCR / Google Cloud Vision / Tesseract |
| **Computer Vision** | YOLOv8 / Detectron2 for segmentation; OpenCV for calibration |
| **NLP / Classification** | Transformer-based NER (IndicBERT / LayoutLMv3) |
| **Rule Engine** | Custom JSON-Schema / rule-object engine |
| **Databases** | PostgreSQL, Amazon S3 / MinIO, OpenSearch |

---

## 5. Unique Selling Proposition (USP)

* **Only solution that automates font-size & PDP-area metrology** directly from a phone photograph, with no special hardware.
* **Rules-as-data architecture** keeping the system perpetually current and audit-ready.
* **Dual-mode coverage** serving both physical-market field inspection and e-commerce-scale bulk scanning.
* **Evidence-grade, exportable reports** producing litigation-ready documentation instantly.
* **National repository effect** providing DoCA with brand/manufacturer-level repeat-offender analytics.

---

## 6. Implementation Roadmap

* **Phase 1 (MVP / Proof of Concept):** Web app, single-category OCR extraction, core rule engine, basic PDP/font check, PDF report export.
* **Phase 2 (Field Pilot):** Native mobile app (offline-first), multilingual OCR expansion, dashboard v1, RBAC + Govt SSO.
* **Phase 3 (Scale & E-commerce Integration):** Bulk/API scanning for marketplaces, national repository & analytics, integration with DoCA case-management.
* **Phase 4 (Continuous Improvement):** Active-learning feedback loop, expansion to additional package categories/exemption rules.

---

## 7. Known Limitations & Responsible-Use Notes

* Automated verdicts are **decision-support tools**, not a substitute for statutory determination. Final enforcement action rests with an authorised Legal Metrology Officer.
* Measurement accuracy depends on image quality and calibration method. Low-confidence scans are flagged for manual review.
* Category-specific exemptions (e.g., packages > 25 kg, agricultural produce) are encoded as explicit rule exceptions to avoid false violations.

---
*Developed for Smart India Hackathon 2026*
