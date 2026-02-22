-- =============================================================
-- 004_integrity_fixes.sql
-- Primary Sources Research Vault — Integrity Reinforcement
-- Applies: CHECK constraints, polymorphic FK triggers,
--          updated_at triggers, indexes, date range guards,
--          time precision enforcement, entity deletion protection.
-- Prerequisite: 001, 002, 003 must already be applied.
-- =============================================================


-- =============================================================
-- STEP 1: CHECK constraint — assertion.object_type allowed values
-- =============================================================

alter table assertion
  add constraint chk_assertion_object_type
  check (object_type in ('person','org','place','object','event'));


-- =============================================================
-- STEP 2: CHECK constraint — assertion object value semantics
-- If object_type is set, at least one of object_id / object_value
-- must be populated. object_id and object_value are mutually
-- exclusive (entity reference vs. literal value).
-- =============================================================

alter table assertion
  add constraint chk_assertion_object_value
  check (
    (object_type is null)
    or (object_id is not null and object_value is null)
    or (object_id is null     and object_value is not null)
  );


-- =============================================================
-- STEP 3: Trigger — assertion.object_id polymorphic FK
-- Mirrors check_assertion_subject_fk from 001.
-- Only fires when object_id is NOT NULL.
-- =============================================================

create or replace function check_assertion_object_fk()
returns trigger language plpgsql as $$
begin
  if new.object_id is null then
    return new;
  end if;

  if new.object_type = 'person' and not exists (
      select 1 from person where person_id = new.object_id) then
    raise exception 'object_id % not found in person', new.object_id;

  elsif new.object_type = 'org' and not exists (
      select 1 from org where org_id = new.object_id) then
    raise exception 'object_id % not found in org', new.object_id;

  elsif new.object_type = 'place' and not exists (
      select 1 from place where place_id = new.object_id) then
    raise exception 'object_id % not found in place', new.object_id;

  elsif new.object_type = 'object' and not exists (
      select 1 from object where object_id = new.object_id) then
    raise exception 'object_id % not found in object', new.object_id;

  elsif new.object_type = 'event' and not exists (
      select 1 from event where event_id = new.object_id) then
    raise exception 'object_id % not found in event', new.object_id;

  end if;
  return new;
end $$;

drop trigger if exists trg_check_assertion_object_fk on assertion;
create trigger trg_check_assertion_object_fk
  before insert or update on assertion
  for each row execute function check_assertion_object_fk();


-- =============================================================
-- STEP 4: Trigger — entity_identifier.entity_id polymorphic FK
-- Validates entity_id exists in the table named by entity_type.
-- =============================================================

create or replace function check_entity_identifier_fk()
returns trigger language plpgsql as $$
begin
  if new.entity_type = 'person' and not exists (
      select 1 from person where person_id = new.entity_id) then
    raise exception 'entity_id % not found in person', new.entity_id;

  elsif new.entity_type = 'org' and not exists (
      select 1 from org where org_id = new.entity_id) then
    raise exception 'entity_id % not found in org', new.entity_id;

  elsif new.entity_type = 'place' and not exists (
      select 1 from place where place_id = new.entity_id) then
    raise exception 'entity_id % not found in place', new.entity_id;

  elsif new.entity_type = 'object' and not exists (
      select 1 from object where object_id = new.entity_id) then
    raise exception 'entity_id % not found in object', new.entity_id;

  elsif new.entity_type = 'event' and not exists (
      select 1 from event where event_id = new.entity_id) then
    raise exception 'entity_id % not found in event', new.entity_id;

  elsif new.entity_type = 'source' and not exists (
      select 1 from source where source_id = new.entity_id) then
    raise exception 'entity_id % not found in source', new.entity_id;

  end if;
  return new;
end $$;

drop trigger if exists trg_check_entity_identifier_fk on entity_identifier;
create trigger trg_check_entity_identifier_fk
  before insert or update on entity_identifier
  for each row execute function check_entity_identifier_fk();


-- =============================================================
-- STEP 5: Triggers — updated_at auto-update
-- One shared function; one trigger per table.
-- Tables: person, org, place, object, event, source
-- =============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_person_updated_at on person;
create trigger trg_person_updated_at
  before update on person
  for each row execute function set_updated_at();

drop trigger if exists trg_org_updated_at on org;
create trigger trg_org_updated_at
  before update on org
  for each row execute function set_updated_at();

drop trigger if exists trg_place_updated_at on place;
create trigger trg_place_updated_at
  before update on place
  for each row execute function set_updated_at();

drop trigger if exists trg_object_updated_at on object;
create trigger trg_object_updated_at
  before update on object
  for each row execute function set_updated_at();

drop trigger if exists trg_event_updated_at on event;
create trigger trg_event_updated_at
  before update on event
  for each row execute function set_updated_at();

drop trigger if exists trg_source_updated_at on source;
create trigger trg_source_updated_at
  before update on source
  for each row execute function set_updated_at();


-- =============================================================
-- STEP 6: Indexes — name fields and source identifiers
-- Name columns: functional lower() index for case-insensitive
--               exact-match de-duplication.
-- source.title, source.external_ref: standard B-tree for ILIKE
--               prefix searches.
-- =============================================================

create index if not exists idx_person_display_name on person (lower(display_name));
create index if not exists idx_org_name            on org    (lower(name));
create index if not exists idx_place_name          on place  (lower(name));
create index if not exists idx_object_name         on object (lower(name));
create index if not exists idx_source_title        on source (title);
create index if not exists idx_source_external_ref on source (external_ref);


-- =============================================================
-- STEP 7: CHECK constraints — date range ordering
-- All constraints allow NULLs on either bound.
-- =============================================================

alter table event
  add constraint chk_event_ts_order
  check (end_ts is null or start_ts is null or end_ts >= start_ts);

alter table person
  add constraint chk_person_date_order
  check (death_date is null or birth_date is null or death_date >= birth_date);

alter table person_alias
  add constraint chk_person_alias_date_order
  check (to_date is null or from_date is null or to_date >= from_date);

alter table org
  add constraint chk_org_date_order
  check (end_date is null or start_date is null or end_date >= start_date);


-- =============================================================
-- STEP 8: Partial UNIQUE index — source.external_ref
-- Enforces uniqueness of NARA RIF numbers where present.
-- Multiple NULLs (non-archival sources) are permitted.
-- =============================================================

create unique index if not exists uq_source_external_ref
  on source(external_ref)
  where external_ref is not null;


-- =============================================================
-- STEP 9: Trigger — event time precision enforcement
--
-- UNKNOWN → start_ts NULL,     end_ts NULL
-- APPROX  → start_ts NOT NULL, end_ts NULL   (one soft anchor)
-- EXACT   → start_ts NOT NULL, end_ts NULL or = start_ts
-- RANGE   → start_ts NOT NULL, end_ts NOT NULL
-- =============================================================

create or replace function check_event_time_precision()
returns trigger language plpgsql as $$
begin
  -- no precision code set: nothing to enforce
  if new.time_precision is null then
    return new;
  end if;

  if new.time_precision = 'UNKNOWN' then
    if new.start_ts is not null or new.end_ts is not null then
      raise exception
        'time_precision=UNKNOWN requires start_ts and end_ts to both be NULL';
    end if;

  elsif new.time_precision = 'APPROX' then
    if new.start_ts is null then
      raise exception
        'time_precision=APPROX requires start_ts to be NOT NULL';
    end if;
    if new.end_ts is not null then
      raise exception
        'time_precision=APPROX requires end_ts to be NULL — use RANGE for two endpoints';
    end if;

  elsif new.time_precision = 'EXACT' then
    if new.start_ts is null then
      raise exception
        'time_precision=EXACT requires start_ts to be NOT NULL';
    end if;
    if new.end_ts is not null and new.end_ts <> new.start_ts then
      raise exception
        'time_precision=EXACT requires end_ts to be NULL or equal to start_ts';
    end if;

  elsif new.time_precision = 'RANGE' then
    if new.start_ts is null or new.end_ts is null then
      raise exception
        'time_precision=RANGE requires both start_ts and end_ts to be NOT NULL';
    end if;

  end if;

  return new;
end $$;

drop trigger if exists trg_check_event_time_precision on event;
create trigger trg_check_event_time_precision
  before insert or update on event
  for each row execute function check_event_time_precision();


-- =============================================================
-- STEP 10a: Entity deletion protection — person
-- Blocks if any downstream table references this person.
-- =============================================================

create or replace function prevent_person_deletion()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from person_alias
             where person_id = old.person_id) then
    raise exception 'Cannot delete person %: referenced in person_alias', old.person_id;
  end if;

  if exists (select 1 from event_participant
             where party_type = 'person' and party_id = old.person_id) then
    raise exception 'Cannot delete person %: referenced in event_participant', old.person_id;
  end if;

  if exists (select 1 from assertion
             where subject_type = 'person' and subject_id = old.person_id) then
    raise exception 'Cannot delete person %: referenced as assertion subject', old.person_id;
  end if;

  if exists (select 1 from assertion
             where object_type = 'person' and object_id = old.person_id) then
    raise exception 'Cannot delete person %: referenced as assertion object', old.person_id;
  end if;

  if exists (select 1 from entity_identifier
             where entity_type = 'person' and entity_id = old.person_id) then
    raise exception 'Cannot delete person %: referenced in entity_identifier', old.person_id;
  end if;

  return old;
end $$;

drop trigger if exists trg_prevent_person_deletion on person;
create trigger trg_prevent_person_deletion
  before delete on person
  for each row execute function prevent_person_deletion();


-- =============================================================
-- STEP 10b: Entity deletion protection — org
-- =============================================================

create or replace function prevent_org_deletion()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from event_participant
             where party_type = 'org' and party_id = old.org_id) then
    raise exception 'Cannot delete org %: referenced in event_participant', old.org_id;
  end if;

  if exists (select 1 from assertion
             where subject_type = 'org' and subject_id = old.org_id) then
    raise exception 'Cannot delete org %: referenced as assertion subject', old.org_id;
  end if;

  if exists (select 1 from assertion
             where object_type = 'org' and object_id = old.org_id) then
    raise exception 'Cannot delete org %: referenced as assertion object', old.org_id;
  end if;

  if exists (select 1 from entity_identifier
             where entity_type = 'org' and entity_id = old.org_id) then
    raise exception 'Cannot delete org %: referenced in entity_identifier', old.org_id;
  end if;

  return old;
end $$;

drop trigger if exists trg_prevent_org_deletion on org;
create trigger trg_prevent_org_deletion
  before delete on org
  for each row execute function prevent_org_deletion();


-- =============================================================
-- STEP 10c: Entity deletion protection — place
-- Also blocks hierarchical parent deletion (child places exist).
-- =============================================================

create or replace function prevent_place_deletion()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from place
             where parent_place_id = old.place_id) then
    raise exception 'Cannot delete place %: has child places', old.place_id;
  end if;

  if exists (select 1 from event_place
             where place_id = old.place_id) then
    raise exception 'Cannot delete place %: referenced in event_place', old.place_id;
  end if;

  if exists (select 1 from assertion
             where subject_type = 'place' and subject_id = old.place_id) then
    raise exception 'Cannot delete place %: referenced as assertion subject', old.place_id;
  end if;

  if exists (select 1 from assertion
             where object_type = 'place' and object_id = old.place_id) then
    raise exception 'Cannot delete place %: referenced as assertion object', old.place_id;
  end if;

  if exists (select 1 from entity_identifier
             where entity_type = 'place' and entity_id = old.place_id) then
    raise exception 'Cannot delete place %: referenced in entity_identifier', old.place_id;
  end if;

  return old;
end $$;

drop trigger if exists trg_prevent_place_deletion on place;
create trigger trg_prevent_place_deletion
  before delete on place
  for each row execute function prevent_place_deletion();


-- =============================================================
-- STEP 10d: Entity deletion protection — object
-- =============================================================

create or replace function prevent_object_deletion()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from event_object
             where object_id = old.object_id) then
    raise exception 'Cannot delete object %: referenced in event_object', old.object_id;
  end if;

  if exists (select 1 from assertion
             where subject_type = 'object' and subject_id = old.object_id) then
    raise exception 'Cannot delete object %: referenced as assertion subject', old.object_id;
  end if;

  if exists (select 1 from assertion
             where object_type = 'object' and object_id = old.object_id) then
    raise exception 'Cannot delete object %: referenced as assertion object', old.object_id;
  end if;

  if exists (select 1 from entity_identifier
             where entity_type = 'object' and entity_id = old.object_id) then
    raise exception 'Cannot delete object %: referenced in entity_identifier', old.object_id;
  end if;

  return old;
end $$;

drop trigger if exists trg_prevent_object_deletion on object;
create trigger trg_prevent_object_deletion
  before delete on object
  for each row execute function prevent_object_deletion();


-- =============================================================
-- STEP 10e: Entity deletion protection — event
-- Checks both directions of event_relation, context references,
-- and polymorphic assertion references.
-- =============================================================

create or replace function prevent_event_deletion()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from event_relation
             where event_id_from = old.event_id
                or event_id_to   = old.event_id) then
    raise exception 'Cannot delete event %: referenced in event_relation', old.event_id;
  end if;

  if exists (select 1 from assertion
             where context_event_id = old.event_id) then
    raise exception 'Cannot delete event %: referenced as assertion context', old.event_id;
  end if;

  if exists (select 1 from assertion
             where subject_type = 'event' and subject_id = old.event_id) then
    raise exception 'Cannot delete event %: referenced as assertion subject', old.event_id;
  end if;

  if exists (select 1 from assertion
             where object_type = 'event' and object_id = old.event_id) then
    raise exception 'Cannot delete event %: referenced as assertion object', old.event_id;
  end if;

  if exists (select 1 from entity_identifier
             where entity_type = 'event' and entity_id = old.event_id) then
    raise exception 'Cannot delete event %: referenced in entity_identifier', old.event_id;
  end if;

  return old;
end $$;

drop trigger if exists trg_prevent_event_deletion on event;
create trigger trg_prevent_event_deletion
  before delete on event
  for each row execute function prevent_event_deletion();


-- =============================================================
-- STEP 10f: Entity deletion protection — source
-- Hard block if any excerpt is linked to assertion_support.
-- This protects the evidentiary chain.
-- Deletion allowed only after all assertion links are cleared.
-- =============================================================

create or replace function prevent_source_deletion()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1
    from   source_excerpt   se
    join   assertion_support aps on aps.excerpt_id = se.excerpt_id
    where  se.source_id = old.source_id
  ) then
    raise exception
      'Cannot delete source %: excerpts are linked to assertion_support. '
      'Remove dependent assertions before deleting this source.',
      old.source_id;
  end if;

  if exists (select 1 from entity_identifier
             where entity_type = 'source' and entity_id = old.source_id) then
    raise exception 'Cannot delete source %: referenced in entity_identifier', old.source_id;
  end if;

  return old;
end $$;

drop trigger if exists trg_prevent_source_deletion on source;
create trigger trg_prevent_source_deletion
  before delete on source
  for each row execute function prevent_source_deletion();
