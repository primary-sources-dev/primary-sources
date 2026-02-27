-- File: 009_witness_hierarchy.sql
-- Witness hierarchy vocabulary and schema foundation

-- Create witness hierarchy vocabulary table
create table if not exists v_witness_hierarchy (
  code text primary key, 
  label text not null
);

-- Insert witness hierarchy values
insert into v_witness_hierarchy values
  ('PRIMARY_WITNESS', 'Primary Witness - Directly experienced the event'),
  ('SECONDARY_WITNESS', 'Secondary Witness - Learned about the event from others'),
  ('INVESTIGATOR', 'Investigator - Official investigation role'),
  ('EXPERT', 'Expert - Specialist analysis role')
on conflict (code) do nothing;

-- Add witness_hierarchy column to event table
alter table event 
add column if not exists witness_hierarchy text 
references v_witness_hierarchy(code);

-- Add index for performance
create index if not exists idx_event_witness_hierarchy on event(witness_hierarchy);
