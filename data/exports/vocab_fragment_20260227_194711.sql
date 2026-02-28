-- Vocabulary codes discovered from classifier feedback
-- Generated: 2026-02-27T19:47:11.225375
-- Review before applying to production

-- New source types (v_source_type)
INSERT INTO v_source_type (code, label) VALUES
  ('FBI_302', 'TODO: add label'),
  ('FBI_REPORT', 'TODO: add label'),
  ('WC_TESTIMONY', 'TODO: add label'),
  ('WITNESS_STATEMENT', 'TODO: add label')
ON CONFLICT (code) DO NOTHING;

-- New content types (v_content_type)
INSERT INTO v_content_type (code, label) VALUES
  ('INTERVIEW', 'TODO: add label')
ON CONFLICT (code) DO NOTHING;
