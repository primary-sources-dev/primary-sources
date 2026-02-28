-- =============================================================
-- 015_classifier_vocab.sql
-- Classifier UI Vocabulary Alignment
--
-- Reconciles the 4-tier metadata vocabulary used by the
-- Classifier Review UI (web/html/tools/classifier/classifier-ui.html)
-- with the database controlled vocabulary tables.
--
-- Scope:
--   - Expand v_source_type with 7 codes used by the UI but missing from DB
--   - Expand v_doc_format with 9 codes used by the UI but missing from DB
--   - Add performance indexes on source.origin_agency, source.doc_format,
--     and the source_content_type junction table
--
-- No DDL changes: all tables and columns already exist (001_initial_schema.sql).
-- No existing seed data is modified.
--
-- Prerequisite: migrations 001-014 must be applied.
-- See: docs/schema-alignment.md for full gap analysis.
-- =============================================================

-- ---------------------------------------------------------
-- Step 1: Expand v_source_type (Tier 2 — Class)
--
-- Existing codes: REPORT, TESTIMONY, BOOK, FILM, PHOTO, MEMO, ARTICLE
-- Adding 7 codes used by Classifier UI CLASSES array
-- ---------------------------------------------------------
INSERT INTO v_source_type (code, label) VALUES
  ('CABLE',          'Classified field cable communication'),
  ('CORRESPONDENCE', 'Formal letter or official written exchange'),
  ('EXHIBIT',        'Evidence exhibit entered into investigation record'),
  ('DEPOSITION',     'Pre-trial sworn questioning transcript'),
  ('AFFIDAVIT',      'Signed sworn written statement'),
  ('TRAVEL',         'Travel-related document (passport application, visa, ticket)'),
  ('OTHER',          'Source type not covered by existing categories')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------
-- Step 2: Expand v_doc_format (Tier 3 — Format)
--
-- Existing codes: CABLE, 201_FILE, RIF, AFFIDAVIT, DEPOSITION,
--   EXHIBIT, TESTIMONY, COVER_SHEET, INDEX_PAGE, TOC, GENERIC_TEMPLATE
-- Adding 9 codes used by Classifier UI FORMATS array
--
-- Note: UI uses "VISA" but DB stores "VISA_FORM" to avoid
-- semantic confusion with travel visa concepts vs. the physical
-- document format. The UI presentation layer should map this.
-- ---------------------------------------------------------
INSERT INTO v_doc_format (code, label) VALUES
  ('FD-302',    'FBI Report of Interview (standard field interview form)'),
  ('AIRTEL',    'FBI priority internal communication (teletype-grade)'),
  ('TELETYPE',  'Teletype machine communication'),
  ('MEMO',      'Internal memorandum or routing slip'),
  ('LETTER',    'Formal correspondence on letterhead'),
  ('ENVELOPE',  'Mailing envelope (physical evidence)'),
  ('PASSPORT',  'Passport document or application'),
  ('VISA_FORM', 'Visa application or stamp document'),
  ('OTHER',     'Document format not covered by existing categories')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------
-- Step 3: Performance indexes
--
-- source.origin_agency and source.doc_format are FK columns
-- that will be used for filtering/faceting in the UI.
-- source_content_type needs indexes for both directions of
-- the many-to-many join.
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_source_origin_agency        ON source(origin_agency);
CREATE INDEX IF NOT EXISTS idx_source_doc_format           ON source(doc_format);
CREATE INDEX IF NOT EXISTS idx_source_content_type_source  ON source_content_type(source_id);
CREATE INDEX IF NOT EXISTS idx_source_content_type_type    ON source_content_type(content_type);
