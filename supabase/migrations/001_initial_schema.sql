-- =============================================================
-- 001_initial_schema.sql
-- Primary Sources Research Vault — MVP Schema
-- Run this first against a fresh Supabase / PostgreSQL database.
-- Requires: pgcrypto extension (enabled by default on Supabase).
-- =============================================================

create extension if not exists "pgcrypto";

-- -----------------------
-- Controlled vocab tables
-- -----------------------
create table if not exists v_event_type      (code text primary key, label text not null);
create table if not exists v_role_type       (code text primary key, label text not null);
create table if not exists v_place_role      (code text primary key, label text not null);
create table if not exists v_object_role     (code text primary key, label text not null);
create table if not exists v_relation_type   (code text primary key, label text not null);
create table if not exists v_source_type     (code text primary key, label text not null);
create table if not exists v_assertion_type  (code text primary key, label text not null);
create table if not exists v_support_type    (code text primary key, label text not null);
create table if not exists v_time_precision  (code text primary key, label text not null);
create table if not exists v_org_type        (code text primary key, label text not null);
create table if not exists v_place_type      (code text primary key, label text not null);
create table if not exists v_object_type     (code text primary key, label text not null);

-- -----------------------
-- Core entity tables
-- -----------------------
create table if not exists person (
  person_id    uuid primary key default gen_random_uuid(),
  display_name text not null,
  given_name   text,
  middle_name  text,
  family_name  text,
  birth_date   date,
  death_date   date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists org (
  org_id     uuid primary key default gen_random_uuid(),
  name       text not null,
  org_type   text references v_org_type(code),
  start_date date,
  end_date   date,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists place (
  place_id        uuid primary key default gen_random_uuid(),
  name            text not null,
  place_type      text references v_place_type(code),
  parent_place_id uuid references place(place_id),
  lat             double precision,
  lon             double precision,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists object (
  object_id   uuid primary key default gen_random_uuid(),
  name        text not null,
  object_type text references v_object_type(code),
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------
-- Events
-- -----------------------
create table if not exists event (
  event_id       uuid primary key default gen_random_uuid(),
  event_type     text not null references v_event_type(code),
  title          text,
  start_ts       timestamptz,
  end_ts         timestamptz,
  time_precision text references v_time_precision(code),
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -----------------------
-- Assertions (Claims layer)
-- -----------------------
create table if not exists assertion (
  assertion_id     uuid primary key default gen_random_uuid(),
  assertion_type   text not null references v_assertion_type(code),
  context_event_id uuid references event(event_id) on delete set null,
  subject_type     text not null check (subject_type in ('person','org','place','object','event')),
  subject_id       uuid not null,
  predicate        text not null,
  object_type      text,
  object_id        uuid,
  object_value     text,
  notes            text,
  created_at       timestamptz not null default now()
);

-- -----------------------
-- Junction tables
-- -----------------------
create table if not exists event_participant (
  event_id     uuid not null references event(event_id) on delete cascade,
  party_type   text not null check (party_type in ('person','org')),
  party_id     uuid not null,
  role_type    text not null references v_role_type(code),
  assertion_id uuid references assertion(assertion_id),
  notes        text,
  created_at   timestamptz not null default now(),
  primary key (event_id, party_type, party_id, role_type)
);

create table if not exists event_place (
  event_id     uuid not null references event(event_id) on delete cascade,
  place_id     uuid not null references place(place_id),
  place_role   text not null references v_place_role(code),
  assertion_id uuid references assertion(assertion_id),
  notes        text,
  created_at   timestamptz not null default now(),
  primary key (event_id, place_id, place_role)
);

create table if not exists event_object (
  event_id     uuid not null references event(event_id) on delete cascade,
  object_id    uuid not null references object(object_id),
  object_role  text not null references v_object_role(code),
  assertion_id uuid references assertion(assertion_id),
  notes        text,
  created_at   timestamptz not null default now(),
  primary key (event_id, object_id, object_role)
);

create table if not exists event_relation (
  event_id_from uuid not null references event(event_id) on delete cascade,
  relation_type text not null references v_relation_type(code),
  event_id_to   uuid not null references event(event_id) on delete cascade,
  assertion_id  uuid references assertion(assertion_id),
  notes         text,
  created_at    timestamptz not null default now(),
  primary key (event_id_from, relation_type, event_id_to)
);

-- -----------------------
-- Sources and support
-- -----------------------
create table if not exists source (
  source_id     uuid primary key default gen_random_uuid(),
  source_type   text not null references v_source_type(code),
  title         text not null,
  author        text,
  publisher     text,
  published_date date,
  external_ref  text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists source_excerpt (
  excerpt_id   uuid primary key default gen_random_uuid(),
  source_id    uuid not null references source(source_id) on delete cascade,
  locator      text not null,
  excerpt_text text,
  created_at   timestamptz not null default now()
);

create table if not exists assertion_support (
  assertion_id uuid not null references assertion(assertion_id) on delete cascade,
  excerpt_id   uuid not null references source_excerpt(excerpt_id) on delete cascade,
  support_type text not null references v_support_type(code),
  notes        text,
  created_at   timestamptz not null default now(),
  primary key (assertion_id, excerpt_id, support_type)
);

-- -----------------------
-- 4NF split tables
-- -----------------------
create table if not exists person_alias (
  person_id    uuid not null references person(person_id) on delete cascade,
  alias        text not null,
  alias_type   text,
  from_date    date,
  to_date      date,
  assertion_id uuid references assertion(assertion_id),
  primary key (person_id, alias)
);

create table if not exists entity_identifier (
  entity_type  text not null check (entity_type in ('person','org','place','object','event','source')),
  entity_id    uuid not null,
  id_type      text not null,
  id_value     text not null,
  issuer       text,
  assertion_id uuid references assertion(assertion_id),
  created_at   timestamptz not null default now(),
  primary key (entity_type, entity_id, id_type, id_value)
);

-- -----------------------
-- Indexes
-- -----------------------
create index if not exists idx_event_type         on event(event_type);
create index if not exists idx_event_start_ts     on event(start_ts);
create index if not exists idx_ep_party           on event_participant(party_type, party_id);
create index if not exists idx_event_place_place  on event_place(place_id);
create index if not exists idx_event_object_object on event_object(object_id);
create index if not exists idx_excerpt_source     on source_excerpt(source_id);
create index if not exists idx_assertion_context  on assertion(context_event_id);
create index if not exists idx_assertion_subject  on assertion(subject_type, subject_id);
create index if not exists idx_assertion_predicate on assertion(predicate);
create index if not exists idx_support_excerpt    on assertion_support(excerpt_id);

-- -----------------------
-- Polymorphic FK triggers
-- -----------------------
create or replace function check_event_participant_party_fk()
returns trigger language plpgsql as $$
begin
  if new.party_type = 'person' then
    if not exists (select 1 from person where person_id = new.party_id) then
      raise exception 'party_id % not found in person', new.party_id;
    end if;
  elsif new.party_type = 'org' then
    if not exists (select 1 from org where org_id = new.party_id) then
      raise exception 'party_id % not found in org', new.party_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_check_event_participant_party_fk on event_participant;
create trigger trg_check_event_participant_party_fk
  before insert or update on event_participant
  for each row execute function check_event_participant_party_fk();

create or replace function check_assertion_subject_fk()
returns trigger language plpgsql as $$
begin
  if new.subject_type = 'person' and not exists (select 1 from person where person_id = new.subject_id) then
    raise exception 'subject_id % not found in person', new.subject_id;
  elsif new.subject_type = 'org' and not exists (select 1 from org where org_id = new.subject_id) then
    raise exception 'subject_id % not found in org', new.subject_id;
  elsif new.subject_type = 'place' and not exists (select 1 from place where place_id = new.subject_id) then
    raise exception 'subject_id % not found in place', new.subject_id;
  elsif new.subject_type = 'object' and not exists (select 1 from object where object_id = new.subject_id) then
    raise exception 'subject_id % not found in object', new.subject_id;
  elsif new.subject_type = 'event' and not exists (select 1 from event where event_id = new.subject_id) then
    raise exception 'subject_id % not found in event', new.subject_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_check_assertion_subject_fk on assertion;
create trigger trg_check_assertion_subject_fk
  before insert or update on assertion
  for each row execute function check_assertion_subject_fk();
