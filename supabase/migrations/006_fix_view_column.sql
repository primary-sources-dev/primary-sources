-- =============================================================
-- 006_fix_view_column.sql
-- Fix: v_event_participant_with_age view references wrong column
-- The view used 'ep.role' but the table column is 'role_type'
-- Prerequisite: migrations 001-005 must be applied
-- =============================================================

-- Drop and recreate the view with the correct column name
CREATE OR REPLACE VIEW v_event_participant_with_age AS
SELECT 
    ep.event_id,
    ep.party_id,
    ep.party_type,
    ep.role_type,
    ep.assertion_id,
    ep.notes,
    e.event_type,
    e.start_ts AS event_date,
    e.description AS event_description,
    CASE 
        WHEN ep.party_type = 'person' THEN p.display_name
        WHEN ep.party_type = 'org' THEN o.name
    END AS party_name,
    CASE 
        WHEN ep.party_type = 'person' THEN age_at_event(ep.party_id, ep.event_id)
        ELSE NULL
    END AS age_at_event
FROM event_participant ep
JOIN event e ON ep.event_id = e.event_id
LEFT JOIN person p ON ep.party_type = 'person' AND ep.party_id = p.person_id
LEFT JOIN org o ON ep.party_type = 'org' AND ep.party_id = o.org_id;

COMMENT ON VIEW v_event_participant_with_age IS 
'Event participants with pre-calculated age badges. Use for UI display.';
