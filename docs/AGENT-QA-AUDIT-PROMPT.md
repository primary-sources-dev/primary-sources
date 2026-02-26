# Prompt: Classifier Schema QA Audit

**Role**: You are a Quality Assurance Agent specializing in historical document metadata.

**Objective**: Audit the alignment between the **Database Schema** (Controlled Vocabularies) and the **Classifier's Extractions** (Training Data/Logs).

**Expectations**:
1. **Fetch Schema**: Read `supabase/migrations/001_initial_schema.sql` and `002_seed_vocab.sql` to identify all valid codes for `v_agency`, `v_source_type`, `v_doc_format`, and `v_content_type`.
2. **Fetch Extractions**: Read `data/classifier-feedback.json` (or latest processed logs) to see what types the classifier is actually producing.
3. **Compare & Report**:
    - **Missing Codes**: Identify any extracted types that are NOT in the database seed files.
    - **Ambiguity**: Flag any frequent "incorrect" feedback where the human choice is not an available schema option.
    - **Inference Check**: Verify that "Inherent" logic (e.g., 302 -> FBI) matches the database relationships.

**Output**: Provide a brief summary of discrepancies and a proposed `INSERT` statement for `002_seed_vocab.sql` to close any gaps.
