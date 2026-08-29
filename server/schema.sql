-- =================================================================================
-- PACKA - Advanced PostgreSQL & Supabase Database Schema
-- SIH 2026 Problem Statement ID: 26034
-- =================================================================================
-- This schema includes Tables, Indexes, Triggers, Views, and Row Level Security (RLS)
-- optimized for a national-scale Legal Metrology compliance architecture.
-- =================================================================================

-- 0. EXTENSIONS
-- Enable pgcrypto for UUID generation and password hashing (if needed at DB level)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================================================================================
-- 1. USERS TABLE
-- Manages RBAC (Role-Based Access Control) for Legal Metrology Officers and Admins
-- =================================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Stored as bcrypt hash from Node.js
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('officer', 'admin', 'supervisor')) DEFAULT 'officer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =================================================================================
-- 2. SCANS TABLE (Compliance Audit Trail)
-- The core transactional table. Stores immutable audit trails of every package scanned.
-- Heavily utilizes JSONB for flexible rule evaluations without schema migrations.
-- =================================================================================
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY, -- Unique Scan ID (e.g., SCAN-1787722907213)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_name TEXT NOT NULL, -- Reference to cloud storage bucket or local path
  product_name TEXT,
  brand_name TEXT,
  category TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  verdict TEXT NOT NULL CHECK (verdict IN ('COMPLIANT', 'NON_COMPLIANT', 'MANUAL_REVIEW_REQUIRED')),
  details_json JSONB NOT NULL, -- Stores { extractedFields: [], ruleEvaluations: [] }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization Indexes for national scale queries
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scans_verdict ON scans(verdict);
-- GIN Index on JSONB for advanced querying (e.g., finding all scans missing 'mrp')
CREATE INDEX IF NOT EXISTS idx_scans_details_json ON scans USING GIN (details_json);

-- =================================================================================
-- 3. TRIGGERS (Auto-updating timestamps)
-- =================================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Supabase security rules for direct DB access / API access
-- =================================================================================
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Note: Our Node.js backend connects using a service_role/superuser string so it 
-- bypasses RLS. But if Supabase Data API (PostgREST) is used, these apply:

-- Users Policy: Users can only see their own profile, but admins can see everyone
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid()::text = id::text OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- Scans Policy: Officers can only view/insert their own scans. Admins can view all.
CREATE POLICY "Officers view own scans" 
ON scans FOR SELECT 
USING (user_id::text = auth.uid()::text OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

CREATE POLICY "Officers insert own scans" 
ON scans FOR INSERT 
WITH CHECK (user_id::text = auth.uid()::text);

-- =================================================================================
-- 5. ANALYTICS VIEWS
-- Pre-computed views for the Dashboard (Top Violations, Compliance Rates)
-- =================================================================================
CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT 
    COUNT(id) AS total_scans,
    SUM(CASE WHEN verdict = 'COMPLIANT' THEN 1 ELSE 0 END) AS compliant_count,
    SUM(CASE WHEN verdict = 'NON_COMPLIANT' THEN 1 ELSE 0 END) AS non_compliant_count,
    AVG(score) AS average_score
FROM scans;

CREATE OR REPLACE VIEW recent_violations AS
SELECT 
    s.id,
    s.brand_name,
    s.category,
    s.timestamp,
    u.name as officer_name
FROM scans s
JOIN users u ON s.user_id = u.id
WHERE s.verdict = 'NON_COMPLIANT'
ORDER BY s.timestamp DESC
LIMIT 50;

-- =================================================================================
-- 6. MOCK DATA (Optional Seed)
-- =================================================================================
-- Insert a default Admin user (Password: admin123 - bcrypt hash below)
-- Hash generated via standard Node.js bcrypt rounds=10
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '$2b$10$Ep2/wJtA.Fq2L0B0L.C1X.E3O3Iq6e.H.o3wH.G7xH4v6y1w7xH4', 'Super Admin', 'admin')
ON CONFLICT (username) DO NOTHING;
