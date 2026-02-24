-- =============================================================
-- 005_age_at_event.sql
-- Age-at-Event Badge: Calculate a person's age at any event
-- Prerequisite: migrations 001-004 must be applied
-- =============================================================

-- Step 1: Create function to calculate age at a specific event
-- Returns NULL if birth_date or event timestamp is missing
CREATE OR REPLACE FUNCTION age_at_event(p_person_id UUID, p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_birth_date DATE;
    v_event_ts TIMESTAMPTZ;
    v_age INTEGER;
BEGIN
    -- Get person's birth date
    SELECT birth_date INTO v_birth_date
    FROM person
    WHERE person_id = p_person_id;
    
    -- Get event start timestamp
    SELECT start_ts INTO v_event_ts
    FROM event
    WHERE event_id = p_event_id;
    
    -- Return NULL if either date is missing
    IF v_birth_date IS NULL OR v_event_ts IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate age in years
    v_age := EXTRACT(YEAR FROM AGE(v_event_ts::DATE, v_birth_date))::INTEGER;
    
    RETURN v_age;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION age_at_event(UUID, UUID) IS 
'Returns the age (in years) of a person at the time of a specific event. Returns NULL if birth_date or event.start_ts is missing.';


-- Step 2: Create function to calculate age at any arbitrary date
-- Useful for calculating age at document dates, etc.
CREATE OR REPLACE FUNCTION age_at_date(p_person_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
    v_birth_date DATE;
BEGIN
    SELECT birth_date INTO v_birth_date
    FROM person
    WHERE person_id = p_person_id;
    
    IF v_birth_date IS NULL OR p_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN EXTRACT(YEAR FROM AGE(p_date, v_birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION age_at_date(UUID, DATE) IS 
'Returns the age (in years) of a person at a specific date. Returns NULL if birth_date is missing.';


-- Step 3: Create view for event participants with age badges
CREATE OR REPLACE VIEW v_event_participant_with_age AS
SELECT 
    ep.event_id,
    ep.party_id,
    ep.party_type,
    ep.role,
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


-- Step 4: Create index to optimize age calculations
-- (birth_date is frequently accessed for these calculations)
CREATE INDEX IF NOT EXISTS idx_person_birth_date 
ON person(birth_date) 
WHERE birth_date IS NOT NULL;
