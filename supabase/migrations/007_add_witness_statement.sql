-- =============================================================
-- 007_add_witness_statement.sql
-- Primary Sources Research Vault — Add WITNESS_STATEMENT source type
-- Prerequisite: migrations 001-006 must be applied
-- =============================================================
-- 
-- Adds WITNESS_STATEMENT as a distinct source type, separate from:
-- - REPORT (agent's summary of what witness said, e.g., FBI 302)
-- - TESTIMONY (sworn statements before a commission/court)
--
-- WITNESS_STATEMENT captures signed statements in the witness's
-- own words, often typed by an agent but signed by the witness.
-- These have higher evidentiary weight than agent summaries.
-- =============================================================

-- Add WITNESS_STATEMENT to v_source_type
INSERT INTO v_source_type (code, label) VALUES
  ('WITNESS_STATEMENT', 'Signed statement in witness''s own words (distinct from agent summary)')
ON CONFLICT (code) DO NOTHING;
