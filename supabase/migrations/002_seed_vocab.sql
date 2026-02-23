-- =============================================================
-- 002_seed_vocab.sql
-- Primary Sources Research Vault — Controlled Vocabulary Seed
-- Run immediately after 001_initial_schema.sql.
-- No research data can be entered until this completes.
-- =============================================================

-- 1. Event types
insert into v_event_type (code, label) values
  ('SHOT',           'Specific instance of a firearm discharge'),
  ('SIGHTING',       'Visual observation of a person or object by a witness'),
  ('TRANSFER',       'Movement of a person or object between custody or location'),
  ('INTERVIEW',      'Formal or informal questioning session'),
  ('REPORT_WRITTEN', 'Act of an official documenting an event or investigation'),
  ('PHONE_CALL',     'Telephonic communication between two or more parties')
on conflict (code) do nothing;

-- 2. Participant roles
insert into v_role_type (code, label) values
  ('WITNESS',      'Individual who personally observed the event'),
  ('SUBJECT',      'Primary focus of the event'),
  ('INVESTIGATOR', 'Official conducting the inquiry or reporting'),
  ('PHOTOGRAPHER', 'Individual capturing visual evidence'),
  ('PHYSICIAN',    'Medical professional performing an evaluation'),
  ('OFFICER',      'Law enforcement personnel participating in the event')
on conflict (code) do nothing;

-- 3. Place roles
insert into v_place_role (code, label) values
  ('OCCURRED_AT', 'Primary location of the event'),
  ('STARTED_AT',  'Point of origin for a movement or duration'),
  ('ENDED_AT',    'Destination or terminal point'),
  ('FOUND_AT',    'Location where evidence was recovered')
on conflict (code) do nothing;

-- 4. Object roles
insert into v_object_role (code, label) values
  ('USED',         'Object was utilized during the event'),
  ('RECOVERED',    'Object was taken into custody during the event'),
  ('EXAMINED',     'Object was the subject of a forensic test or review'),
  ('PHOTOGRAPHED', 'Object was visually documented during the event'),
  ('TRANSFERRED',  'Object was moved to a new party or location')
on conflict (code) do nothing;

-- 5. Event relation types
insert into v_relation_type (code, label) values
  ('PRECEDES',     'Event A occurs chronologically before Event B'),
  ('PART_OF',      'Event A is a sub-component of larger Event B'),
  ('CORROBORATES', 'Event A provides secondary evidence that Event B occurred'),
  ('CONTRADICTS',  'Event A makes the occurrence or timing of Event B logically impossible')
on conflict (code) do nothing;

-- 6. Source types
insert into v_source_type (code, label) values
  ('REPORT',    'Official government or agency findings (e.g., FBI 302)'),
  ('TESTIMONY', 'Sworn statements, depositions, or hearings'),
  ('BOOK',      'Published historical or investigative literature'),
  ('FILM',      'Moving image artifacts (newsreels, home movies)'),
  ('PHOTO',     'Still photography'),
  ('MEMO',      'Internal informal correspondence or notes'),
  ('ARTICLE',   'Periodical or newspaper clippings')
on conflict (code) do nothing;

-- 7. Assertion types
insert into v_assertion_type (code, label) values
  ('TIME',            'A claim regarding when an event occurred'),
  ('LOCATION',        'A claim regarding where an entity was located'),
  ('PARTICIPATION',   'A claim regarding who was present at or involved in an event'),
  ('POSSESSION',      'A claim regarding who owned, held, or controlled an object'),
  ('OBSERVATION',     'A claim regarding a specific detail witnessed by a participant'),
  ('IDENTIFICATION',  'A claim that Entity A is the same as or an alias for Entity B')
on conflict (code) do nothing;

-- 8. Support types
insert into v_support_type (code, label) values
  ('SUPPORTS',    'Excerpt explicitly corroborates the claim'),
  ('CONTRADICTS', 'Excerpt provides a conflicting account'),
  ('MENTIONS',    'Excerpt refers to the subjects without confirming or denying the claim')
on conflict (code) do nothing;

-- 9. Time precision
insert into v_time_precision (code, label) values
  ('EXACT',   'Timestamp is known to the minute or second'),
  ('APPROX',  'Timestamp is estimated within a 15-30 minute window'),
  ('RANGE',   'Event occurred between two known points in time'),
  ('UNKNOWN', 'Specific time is not recorded or is highly disputed')
on conflict (code) do nothing;

-- 10. Org types
insert into v_org_type (code, label) values
  ('AGENCY',   'Government or law enforcement bodies (e.g., FBI, DPD)'),
  ('MEDIA',    'News outlets or publishers'),
  ('BUSINESS', 'Commercial entities'),
  ('GROUP',    'Political or social organizations'),
  ('ORGANIZATION', 'Generic social or public organization'),
  ('ARCHIVE',  'Document repository or research collection')
on conflict (code) do nothing;

-- 11. Place types
insert into v_place_type (code, label) values
  ('BUILDING', 'A specific structure'),
  ('STREET',   'A road or intersection'),
  ('CITY',     'A municipal area'),
  ('SITE',     'A specific area or geographic zone'),
  ('RESIDENCE', 'A domestic building (Building subtype)'),
  ('OFFICE',    'A workspace building (Building subtype)')
on conflict (code) do nothing;

-- 12. Object types
insert into v_object_type (code, label) values
  ('DOCUMENT',      'A written or printed record (report, letter, exhibit)'),
  ('WEAPON',        'A firearm, blade, or instrument used to cause harm'),
  ('VEHICLE',       'A car, motorcycle, or other mode of transport'),
  ('MEDIA_CARRIER', 'A film reel, audio tape, or photographic negative'),
  ('CLOTHING',      'Garments or personal effects worn by a subject')
on conflict (code) do nothing;
