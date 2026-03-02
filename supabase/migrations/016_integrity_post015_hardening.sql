-- =============================================================
-- 016_integrity_post015_hardening.sql
-- Post-015 integrity hardening for provenance safety
-- Assumption: no production data migration has occurred yet.
-- =============================================================

-- -----------------------
-- 1) Protect source excerpts from accidental evidence-chain loss
-- -----------------------
create or replace function prevent_source_excerpt_deletion()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from assertion_support s
    where s.excerpt_id = old.excerpt_id
  ) then
    raise exception
      'Cannot delete source_excerpt %: referenced in assertion_support',
      old.excerpt_id;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_source_excerpt_deletion on source_excerpt;
create trigger trg_prevent_source_excerpt_deletion
  before delete on source_excerpt
  for each row execute function prevent_source_excerpt_deletion();


-- -----------------------
-- 2) Make optional assertion provenance links explicit:
--    if assertion row is deleted, nullable assertion_id fields are nulled.
-- -----------------------
alter table event_participant
  drop constraint if exists event_participant_assertion_id_fkey;
alter table event_participant
  add constraint event_participant_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;

alter table event_place
  drop constraint if exists event_place_assertion_id_fkey;
alter table event_place
  add constraint event_place_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;

alter table event_object
  drop constraint if exists event_object_assertion_id_fkey;
alter table event_object
  add constraint event_object_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;

alter table event_relation
  drop constraint if exists event_relation_assertion_id_fkey;
alter table event_relation
  add constraint event_relation_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;

alter table person_alias
  drop constraint if exists person_alias_assertion_id_fkey;
alter table person_alias
  add constraint person_alias_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;

alter table entity_identifier
  drop constraint if exists entity_identifier_assertion_id_fkey;
alter table entity_identifier
  add constraint entity_identifier_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;

alter table person_relation
  drop constraint if exists person_relation_assertion_id_fkey;
alter table person_relation
  add constraint person_relation_assertion_id_fkey
  foreign key (assertion_id)
  references assertion(assertion_id)
  on delete set null;


-- -----------------------
-- 3) Enforce explicit event time precision contract at schema level
-- -----------------------
alter table event
  alter column time_precision set default 'UNKNOWN';

update event
set time_precision = 'UNKNOWN'
where time_precision is null;

alter table event
  alter column time_precision set not null;

-- =============================================================
-- Migration complete
-- =============================================================

