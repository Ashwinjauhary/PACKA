-- =================================================================================
-- 🏢 PACKA (Packaged Commodity Compliance & Knowledge Assistant)
-- 🏛️ Ministry of Consumer Affairs, Food & Public Distribution
-- 🚀 Enterprise Production Database Schema (PostgreSQL 18+)
-- =================================================================================
-- Architecture Note: 
-- This schema is designed for National-Scale Analytics, supporting high-throughput 
-- concurrent inserts from LMO field officers and E-Commerce API bulk validations.
-- =================================================================================

-- ---------------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUMS
-- ---------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('super_admin', 'state_admin', 'lmo_officer', 'manufacturer', 'ecommerce_api');
CREATE TYPE notice_status AS ENUM ('draft', 'issued', 'disputed', 'resolved_penalty_paid', 'court_forwarded');
CREATE TYPE compliance_status AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW_REQUIRED');

-- ---------------------------------------------------------------------------------
-- 2. CORE IDENTITY & ACCESS MANAGEMENT (RBAC)
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sso_parichay_id TEXT UNIQUE, -- Government MeriPehchaan SSO integration mapping
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    designation TEXT,
    state_jurisdiction TEXT, -- e.g., 'Maharashtra', 'Delhi'
    role user_role NOT NULL DEFAULT 'lmo_officer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_hash TEXT NOT NULL UNIQUE,
    platform_name TEXT NOT NULL, -- e.g., 'Amazon India', 'Flipkart'
    rate_limit_per_hour INTEGER DEFAULT 5000,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------------
-- 3. MANUFACTURER & BRAND REPOSITORY
-- ---------------------------------------------------------------------------------
-- Tracks repeat offenders and aggregates brand-level compliance scores nationally.
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fssai_license_no TEXT UNIQUE,
    gstin TEXT UNIQUE,
    company_name TEXT NOT NULL,
    registered_address TEXT,
    grievance_officer_email TEXT,
    national_compliance_score NUMERIC(5,2) DEFAULT 100.00, -- Automatically drops upon violations
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------------
-- 4. MASTER PRODUCT CATALOG (SKU Level)
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    gtin_barcode TEXT PRIMARY KEY, -- GS1 Standard Barcode
    manufacturer_id UUID REFERENCES manufacturers(id),
    generic_name TEXT NOT NULL,
    brand_name TEXT,
    category TEXT NOT NULL, -- 'Food', 'Cosmetics', 'Electronics'
    is_imported BOOLEAN DEFAULT FALSE,
    country_of_origin TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------------
-- 5. THE SCAN & INFERENCE ENGINE (High Throughput Table)
-- ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scanned_by UUID NOT NULL REFERENCES users(id),
    gtin_barcode TEXT REFERENCES products(gtin_barcode), -- Links scan to master catalog if barcode found
    
    -- Evidence
    evidence_image_s3_url TEXT NOT NULL,
    geo_location_lat NUMERIC(10, 8),
    geo_location_lng NUMERIC(11, 8),
    
    -- AI/ML Output & Rule Engine Verdict
    confidence_score NUMERIC(5,2) NOT NULL,
    verdict compliance_status NOT NULL,
    
    -- 🧠 THE HYBRID NOSQL BRAIN (JSONB)
    -- Stores exhaustive layout bounding boxes, OCR strings, and nested rule evaluations.
    -- Example: {"rule_6": {"mrp": "pass", "net_qty": "fail"}, "rule_8_font_mm": 1.2}
    ml_inference_details JSONB NOT NULL,
    
    scanned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------------
-- 6. LEGAL METROLOGY NOTICES (Challans & E-Jagriti Sync)
-- ---------------------------------------------------------------------------------
-- When a scan is NON_COMPLIANT, a formal legal notice can be generated.
CREATE TABLE IF NOT EXISTS legal_notices (
    notice_id TEXT PRIMARY KEY, -- Standardized Govt Notice Number format (e.g., MH-2026-LMO-001)
    scan_id UUID NOT NULL REFERENCES scans(id),
    issued_by UUID NOT NULL REFERENCES users(id),
    manufacturer_id UUID REFERENCES manufacturers(id),
    
    violation_clauses TEXT[], -- Array of specific rules broken e.g. ['Rule 6(1)(e)', 'Rule 8']
    penalty_amount_inr NUMERIC(10,2),
    status notice_status NOT NULL DEFAULT 'draft',
    
    -- e-Jagriti Portal Synchronization
    ejagriti_sync_status BOOLEAN DEFAULT FALSE,
    ejagriti_case_id TEXT,
    
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------------
-- 7. SYSTEM AUDIT LOGS (Strict Govt Compliance)
-- ---------------------------------------------------------------------------------
-- Immutable ledger of all system actions (preventing tampering by corrupt officials).
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action_type TEXT NOT NULL, -- 'LOGIN', 'NOTICE_ISSUED', 'SCAN_DELETED'
    target_table TEXT,
    target_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXING (For Big Data Analytics)
-- ---------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_scans_verdict ON scans(verdict);
CREATE INDEX IF NOT EXISTS idx_scans_date ON scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_status ON legal_notices(status);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(gtin_barcode);

-- 🔥 GIN Index for blazing fast queries across unstructured AI JSON metadata
CREATE INDEX IF NOT EXISTS idx_scans_ml_json ON scans USING GIN (ml_inference_details);
