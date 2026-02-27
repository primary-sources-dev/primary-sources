-- File: 013_witness_types.sql
-- Add new witness types to simplify role classification

-- Insert new witness hierarchy values
insert into v_witness_hierarchy values
  ('EYE_WITNESS', 'Eyewitness - Directly saw the event occur'),
  ('ALIBI_WITNESS', 'Alibi Witness - Provides alibi information'),
  ('CHARACTER_WITNESS', 'Character Witness - Testifies to character'),
  ('LAY_WITNESS', 'Lay Witness - General factual testimony')
on conflict (code) do nothing;

-- Update existing witness migration logic to simplify roles
create or replace function build_witnesses_from_participants(participants jsonb)
returns jsonb as $$
declare
    witness jsonb;
    witnesses jsonb := '[]'::jsonb;
begin
    -- If no participants, return empty array
    if participants is null then
        return witnesses;
    end if;
    
    -- Process each participant and convert to witness
    for witness in select value from jsonb_array_elements(participants) loop
        -- Simplify to just INVESTIGATOR for all official roles
        local witness_hierarchy text := case
            when witness ->> 'role' like '%FBI%' or witness ->> 'role' like '%Agent%' or witness ->> 'role' like '%SA %' or witness ->> 'role' like '%Investigator%' then 'INVESTIGATOR'
            when witness ->> 'role' like '%Examiner%' or witness ->> 'role' like '%Analyst%' or witness ->> 'role' like '%Expert%' then 'EXPERT'
            when witness ->> 'role' like '%Alibi%' then 'ALIBI_WITNESS'
            when witness ->> 'role' like '%Character%' then 'CHARACTER_WITNESS'
            when witness ->> 'role' like '%Eyewitness%' or witness ->> 'role' like '%Eye%' then 'EYE_WITNESS'
            when witness ->> 'role' like '%Witness%' then 'LAY_WITNESS'
            else 'LAY_WITNESS'
        end;
        
        -- Simplify event-specific role
        local event_specific_role text := case
            when witness_hierarchy = 'INVESTIGATOR' then 'Investigator'
            when witness_hierarchy = 'ALIBI_WITNESS' then 'Alibi Witness'
            when witness_hierarchy = 'CHARACTER_WITNESS' then 'Character Witness'
            when witness_hierarchy = 'EYE_WITNESS' then 'Eyewitness'
            when witness_hierarchy = 'LAY_WITNESS' then 'Lay Witness'
            when witness_hierarchy = 'EXPERT' then 'Expert'
            else witness ->> 'role'
        end;
        
        -- Build witness object
        local witness_obj jsonb := jsonb_build_object(
            'name', witness ->> 'name',
            'role', witness_hierarchy,
            'witness_hierarchy', witness_hierarchy,
            'event_specific_role', event_specific_role,
            'description', coalesce(witness ->> 'description', ''),
            'credibility', 'UNKNOWN'::text
        );
        
        -- Add to witnesses array
        witnesses := witnesses || witness_obj;
    end loop;
    
    return witnesses;
end;
$$ language plpgsql;

-- Re-run migration to update existing data
select migrate_participants_to_witnesses();
