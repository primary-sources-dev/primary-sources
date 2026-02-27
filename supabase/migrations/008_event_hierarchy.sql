-- =============================================================
-- 008_event_hierarchy.sql
-- Add 3-level event hierarchy system (CATEGORY_1/2/3)
-- =============================================================

-- -----------------------
-- Add event hierarchy vocabulary table
-- -----------------------
create table if not exists v_event_hierarchy (code text primary key, label text not null);

-- -----------------------
-- Seed event hierarchy vocabulary
-- -----------------------
insert into v_event_hierarchy (code, label) values 
  ('CATEGORY_1', 'Main Political Violence Events'),
  ('CATEGORY_2', 'Direct Investigations'),
  ('CATEGORY_3', 'Documentation & Reports')
on conflict (code) do nothing;

-- -----------------------
-- Add event_hierarchy column to event table
-- -----------------------
alter table event 
add column if not exists event_hierarchy text not null default 'CATEGORY_3' 
references v_event_hierarchy(code);

-- -----------------------
-- Add index for event_hierarchy
-- -----------------------
create index if not exists idx_event_hierarchy on event(event_hierarchy);

-- -----------------------
-- Update existing events with appropriate hierarchy levels
-- -----------------------
-- Set main events as CATEGORY_1
update event 
set event_hierarchy = 'CATEGORY_1' 
where event_type in ('SHOT') and (
  title ilike '%walker%' or 
  title ilike '%jfk%' or 
  title ilike '%tippit%' or 
  title ilike '%oswald%'
);

-- Set direct investigations as CATEGORY_2
update event 
set event_hierarchy = 'CATEGORY_2' 
where event_type in ('INTERVIEW', 'TRANSFER') and 
  event_level = 'PRIMARY';

-- Set documentation as CATEGORY_3
update event 
set event_hierarchy = 'CATEGORY_3' 
where event_type in ('REPORT_WRITTEN', 'PHONE_CALL') or 
  event_level = 'SECONDARY';

-- -----------------------
-- Add check constraint for valid event hierarchies
-- -----------------------
alter table event 
add constraint if not exists chk_event_hierarchy 
check (event_hierarchy in (select code from v_event_hierarchy));

-- =============================================================
-- Migration complete
-- =============================================================
