-- =================================================================================
-- PACKA - PostgreSQL Database Schema
-- SIH 2026 Problem Statement ID: 26034
-- =================================================================================
-- This file serves as the exact DDL schema definition for the PACKA platform.
-- It matches the backend API (Node.js) table initialization found in server/db.ts
-- We heavily utilize JSONB for highly flexible, indexable rule evaluations.
-- =================================================================================

-- 1. USERS TABLE
-- Manages RBAC (Role-Based Access Control) for Legal Metrology Officers, Admins, etc.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'officer'
);

-- 2. SCANS TABLE
-- The core transactional table. Stores immutable audit trails of every package scanned.
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ NOT NULL,
  image_name TEXT NOT NULL,
  product_name TEXT,
  brand_name TEXT,
  category TEXT NOT NULL,
  score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  details_json JSONB NOT NULL
);

-- 3. OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
