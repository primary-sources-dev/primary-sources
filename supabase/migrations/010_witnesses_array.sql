-- File: 010_witnesses_array.sql
-- Add witnesses array to event schema

-- Add witnesses column as JSONB array
alter table event 
add column if not exists witnesses jsonb;

-- Add constraint to ensure witnesses is always an array if present
alter table event 
add constraint if not exists chk_witnesses_json 
check (witnesses is null or jsonb_typeof(witnesses) = 'array');

-- Add index for performance on witness data
create index if not exists idx_event_witnesses on event using gin(witnesses);
