-- File: 012_witness_data_migration.sql
-- Migrate participants to witnesses array with hierarchy classification

-- Helper function to build witnesses array from participants
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
        -- Determine witness hierarchy based on role
        local witness_hierarchy text := case
            when witness ->> 'role' like '%FBI%' or witness ->> 'role' like '%Agent%' or witness ->> 'role' like '%SA %' then 'INVESTIGATOR'
            when witness ->> 'role' like '%Examiner%' or witness ->> 'role' like '%Analyst%' or witness ->> 'role' like '%Expert%' then 'EXPERT'
            when witness ->> 'role' like '%Witness%' then 'PRIMARY_WITNESS'
            else 'SECONDARY_WITNESS'
        end;
        
        -- Determine event-specific role
        local event_specific_role text := case
            when witness ->> 'role' = 'FBI Agent' then 'Lead Investigator'
            when witness ->> 'role' = 'Witness' then 'Reporting Witness'
            when witness ->> 'role' = 'Relative' then 'Family Witness'
            when witness ->> 'role' = 'Family' then 'Family Witness'
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

-- Migration function to update all events
create or replace function migrate_participants_to_witnesses()
returns void as $$
declare
    event_record record;
    witness_array jsonb;
    migration_count integer := 0;
begin
    -- Log start of migration
    raise notice 'Starting witness migration: Moving participants to witnesses array';
    
    for event_record in select * from event loop
        -- Skip if already has witnesses
        if event_record.witnesses is not null and jsonb_array_length(event_record.witnesses) > 0 then
            raise notice 'Skipping event %: already has witnesses array', event_record.id;
            continue;
        end if;
        
        -- Skip if no participants
        if event_record.participants is null or jsonb_array_length(event_record.participants) = 0 then
            raise notice 'Skipping event %: no participants to migrate', event_record.id;
            continue;
        end if;
        
        -- Build witnesses array from participants
        witness_array := build_witnesses_from_participants(event_record.participants);
        
        -- Update event with new witnesses data
        update event 
        set 
            witnesses = witness_array,
            participants = '[]'::jsonb  -- Clear participants after migration
        where id = event_record.id;
        
        migration_count := migration_count + 1;
        raise notice 'Migrated event %: % participants to witnesses array', event_record.id, jsonb_array_length(event_record.participants);
    end loop;
    
    raise notice 'Migration complete: % events processed', migration_count;
end;
$$ language plpgsql;

-- Execute migration
select migrate_participants_to_witnesses();

-- Verify migration results
do $$
declare
    events_with_witnesses integer;
    events_with_empty_witnesses integer;
    events_with_participants integer;
begin
    select count(*) into events_with_witnesses from event where witnesses is not null and jsonb_array_length(witnesses) > 0;
    select count(*) into events_with_empty_witnesses from event where witnesses is null or jsonb_array_length(witnesses) = 0;
    select count(*) into events_with_participants from event where participants is not null and jsonb_array_length(participants) > 0;
    
    raise notice 'Migration verification:';
    raise notice '- Events with witnesses: %', events_with_witnesses;
    raise notice '- Events with empty witnesses: %', events_with_empty_witnesses;
    raise notice '- Events still with participants: %', events_with_participants;
end $$;
