-- File: 011_witness_validation.sql
-- Add validation framework for witness data integrity

-- Add validation function for witness data
create or replace function validate_witness_data(witnesses jsonb) 
returns boolean as $$
declare
    witness jsonb;
    required_fields text[] := array['name', 'role', 'witness_hierarchy', 'event_specific_role'];
    field text;
begin
    -- Return true if no witnesses
    if witnesses is null then
        return true;
    end if;
    
    -- Check if witnesses is an array
    if jsonb_typeof(witnesses) != 'array' then
        return false;
    end if;
    
    -- Validate each witness
    for witness in select value from jsonb_array_elements(witnesses) loop
        -- Check required fields
        for field in select unnest(required_fields) loop
            if not (witness ? field) or witness ->> field is null then
                return false;
            end if;
        end loop;
        
        -- Validate witness_hierarchy is in allowed values
        if not exists (
            select 1 from v_witness_hierarchy 
            where code = witness ->> 'witness_hierarchy'
        ) then
            return false;
        end if;
    end loop;
    
    return true;
end;
$$ language plpgsql;

-- Add check constraint to validate witness data
alter table event 
add constraint if not exists chk_witness_data_valid 
check (validate_witness_data(witnesses));

-- Add trigger to automatically validate witness data on insert/update
create or replace function trigger_validate_witness_data()
returns trigger as $$
begin
    if not validate_witness_data(new.witnesses) then
        raise exception 'Invalid witness data: missing required fields or invalid witness_hierarchy';
    end if;
    return new;
end;
$$ language plpgsql;

-- Create trigger
drop trigger if exists tr_validate_witness_data on event;
create trigger tr_validate_witness_data
    before insert or update on event
    for each row
    execute function trigger_validate_witness_data();
