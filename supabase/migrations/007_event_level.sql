-- =============================================================
-- 007_event_level.sql
-- Add event_level field to event table and vocabulary
-- =============================================================

-- -----------------------
-- Add event level vocabulary table
-- -----------------------
create table if not exists v_event_level (code text primary key, label text not null);

-- -----------------------
-- Seed event level vocabulary
-- -----------------------
insert into v_event_level (code, label) values 
  ('PRIMARY', 'Primary Event - What actually happened'),
  ('SECONDARY', 'Secondary Event - Documentation about primary events')
on conflict (code) do nothing;

-- -----------------------
-- Add event_level column to event table
-- -----------------------
alter table event 
add column if not exists event_level text not null default 'PRIMARY' 
references v_event_level(code);

-- -----------------------
-- Add index for event_level
-- -----------------------
create index if not exists idx_event_level on event(event_level);

-- -----------------------
-- Update existing events with appropriate levels
-- -----------------------
-- Set documentation events as SECONDARY
update event 
set event_level = 'SECONDARY' 
where event_type in ('INTERVIEW', 'REPORT_WRITTEN', 'PHONE_CALL');

-- Set actual events as PRIMARY  
update event 
set event_level = 'PRIMARY' 
where event_type in ('SIGHTING', 'SHOT', 'TRANSFER', 'EMPLOYMENT');

-- -----------------------
-- Add check constraint for valid event levels
-- -----------------------
alter table event 
add constraint if not exists chk_event_level 
check (event_level in (select code from v_event_level));

-- =============================================================
-- Migration complete
-- =============================================================
