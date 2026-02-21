-- =============================================================
-- 003_predicate_registry.sql
-- Primary Sources Research Vault — Controlled Predicate Registry
-- Run after 002_seed_vocab.sql.
-- Converts assertion.predicate from free-text to a typed FK.
-- =============================================================

-- 1. Create the predicate registry table
create table if not exists v_predicate (
  code        text primary key,
  label       text not null,
  notes       text
);

-- 2. Seed initial predicate registry
insert into v_predicate (code, label, notes) values
  -- Presence and location
  ('WAS_PRESENT_AT',     'Subject was present at the event',                        null),
  ('WAS_LOCATED_AT',     'Subject was at a specific place at a specific time',      null),

  -- Identity and relation
  ('IS_ALIAS_OF',        'Subject is an alternate name or identifier for entity',   null),
  ('IS_SAME_AS',         'Subject and object refer to the same real-world entity',  null),
  ('IS_MEMBER_OF',       'Subject belongs to the named organization',               null),
  ('IS_EMPLOYED_BY',     'Subject was employed by the named organization',          null),

  -- Possession and custody
  ('OWNED',              'Subject owned or possessed the object',                   null),
  ('HELD_CUSTODY_OF',    'Subject had legal or physical custody of the object',     null),
  ('TRANSFERRED_TO',     'Subject transferred the object to the named entity',      null),

  -- Action
  ('FIRED',              'Subject discharged the named weapon',                     null),
  ('ORDERED',            'Subject gave an instruction or command',                  null),
  ('COMMUNICATED_WITH',  'Subject had contact with the named entity',               null),
  ('OBSERVED',           'Subject witnessed the named event or entity',             null),

  -- Testimony and documentation
  ('TESTIFIED_THAT',     'Subject made a sworn statement regarding the claim',      null),
  ('DOCUMENTED',         'Subject created a written record of the event',           null),
  ('CONTRADICTED',       'Subject made a statement contradicting the named claim',  null),

  -- State
  ('WAS_ALIVE_AT',       'Subject was alive at the time of the event',              null),
  ('WAS_DECEASED_AT',    'Subject was deceased at the time of the event',           null),
  ('WAS_INJURED_AT',     'Subject sustained injury at the time of the event',       null)

on conflict (code) do nothing;

-- 3. Add FK constraint to assertion.predicate
--    Safe to run on an empty or populated table.
--    Existing free-text values must be migrated or cleared before this runs
--    against a pre-populated database.
alter table assertion
  add constraint fk_assertion_predicate
  foreign key (predicate) references v_predicate(code);
