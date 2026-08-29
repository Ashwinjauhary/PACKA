-- =================================================================================
-- PACKA - PostgreSQL Database Schema
-- SIH 2026 Problem Statement ID: 26034
-- =================================================================================
-- This file serves as the official DDL schema definition for the PACKA platform.
-- The backend API (Node.js) automatically executes this on startup via db.ts.
-- We heavily utilize JSONB for highly flexible, indexable rule evaluations.
-- =================================================================================

-- 1. USERS TABLE
-- Manages RBAC (Role-Based Access Control) for Legal Metrology Officers, Admins, etc.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Stored as bcrypt hash
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'officer' -- 'admin', 'officer', 'manufacturer'
);

-- 2. SCANS TABLE
-- The core transactional table. Stores immutable audit trails of every package scanned.
CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY, -- Unique UUID for the scan
    user_id INTEGER NOT NULL REFERENCES users(id), -- Officer who performed the scan
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image_name TEXT NOT NULL, -- S3/Local reference to the uploaded evidence image
    product_name TEXT,
    brand_name TEXT,
    category TEXT NOT NULL, -- e.g., 'food', 'cosmetics', 'electronics'
    score INTEGER NOT NULL, -- 0 to 100 compliance score
    verdict TEXT NOT NULL, -- 'COMPLIANT' or 'NON-COMPLIANT'
    
    -- THE CROWN JEWEL: JSONB Document Store
    -- Contains the deeply nested, exhaustive evaluation of all LMPC rules.
    -- Stored as JSONB so DoCA can query across millions of scans instantly
    -- (e.g. "Find all scans where details_json->'rule_8_font' = 'FAIL'")
    details_json JSONB NOT NULL
);

-- 3. OPTIMIZATION INDEXES
-- For National Analytics Dashboard (Real-time performance tuning)
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scans_verdict ON scans(verdict);
-- Optional: GIN index for deep JSONB querying on rule failures
-- CREATE INDEX IF NOT EXISTS idx_scans_jsonb_failures ON scans USING GIN (details_json);
