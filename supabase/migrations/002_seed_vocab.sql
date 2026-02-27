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
  ('PHONE_CALL',     'Telephonic communication between two or more parties'),
  ('EMPLOYMENT',     'Work relationship or employment event'),
  ('MEETING',        'Gathering or conference between parties')
on conflict (code) do nothing;

-- 1.1. Event levels
insert into v_event_level (code, label) values
  ('PRIMARY',   'Primary Event - What actually happened'),
  ('SECONDARY', 'Secondary Event - Documentation about primary events')
on conflict (code) do nothing;

-- 1.2. Event hierarchy
insert into v_event_hierarchy (code, label) values
  ('CATEGORY_1', 'Main Political Violence Events'),
  ('CATEGORY_2', 'Direct Investigations'),
  ('CATEGORY_3', 'Documentation & Reports')
on conflict (code) do nothing;

-- 2. Participant roles
insert into v_role_type (code, label) values
  ('WITNESS',         'Individual who personally observed the event'),
  ('SUBJECT',         'Primary focus of the event'),
  ('INVESTIGATOR',    'Official conducting the inquiry or reporting'),
  ('REPORTING_AGENT', 'Official authoring the formal record/document'),
  ('INTERVIEWER',    'Agent physically conducting the questioning session'),
  ('EXAMINER',       'Specialist conducting forensic or technical tests (e.g. Polygraph)'),
  ('AFFIANT',        'Individual providing a signed, sworn statement'),
  ('PHOTOGRAPHER',    'Individual capturing visual evidence'),
  ('PHYSICIAN',       'Medical professional performing an evaluation'),
  ('OFFICER',         'Law enforcement personnel participating in the event')
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
  ('PRECEDES',          'Event A occurs chronologically before Event B'),
  ('PART_OF',           'Event A is a sub-component of larger Event B'),
  ('CORROBORATES',      'Event A provides secondary evidence that Event B occurred'),
  ('CONTRADICTS',       'Event A makes the occurrence or timing of Event B logically impossible'),
  ('RESULTS_IN',        'Event A procedurally leads to the initiation of Event B'),
  ('FOLLOWS_PROCEDURE', 'Event B occurs as a formal follow-up to Event A')
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

-- 13. Predicates (Subject-Verb-Object labels for assertions)
insert into v_predicate (code, label) values
  ('STATED_OBSERVATION', 'Subject declared they saw a specific detail'),
  ('IDENTIFIED_PHOTO',   'Subject identified an entity from a photograph'),
  ('PROVIDED_ALIBI',     'Subject provided information verifying their location elsewhere'),
  ('DENIED_KNOWLEDGE',   'Subject explicitly stated they have no information on the topic'),
  ('REPORTED_MOVEMENT',  'Subject described the travel or transfer of an entity'),
  ('WAS_PRESENT_AT',     'Subject was physically at the specified location'),
  ('IS_SPOUSE_OF',       'Subject is legally married to the object'),
  ('IS_CHILD_OF',        'Subject is the biological or legal offspring of the object'),
  ('IS_PARENT_OF',       'Subject is the biological or legal parent of the object'),
  ('IS_SIBLING_OF',      'Subject shares parents with the object')
on conflict (code) do nothing;

-- 14. Global Person Relations
insert into v_person_relation_type (code, label) values
  ('SPOUSE', 'Legal or common-law marriage'),
  ('CHILD',  'Biological or legal offspring'),
  ('PARENT', 'Biological or legal parent'),
  ('SIBLING', 'Biological or legal brother or sister'),
  ('CO-WORKER', 'Professional colleague at the same organization'),
  ('EMPLOYER', 'Organization or person and their employee'),
  ('FRIEND', 'Non-familial social relationship')
on conflict (code) do nothing;

-- 15. Identifier Types (reference systems for entity_identifier)
insert into v_id_type (code, label) values
  ('NARA_RIF',         'NARA Record Information Form number (e.g., 180-10001-10234)'),
  ('CD_NUMBER',        'Warren Commission Document number (e.g., CD-205)'),
  ('CE_NUMBER',        'Warren Commission Exhibit number (e.g., CE-2003)'),
  ('FBI_FILE',         'FBI field office file number (e.g., DL 44-1639)'),
  ('CIA_FILE',         'CIA file or reference number'),
  ('CIA_201',          'CIA 201 personality file number'),
  ('DPD_FILE',         'Dallas Police Department file number'),
  ('HSCA_DOC',         'HSCA document reference number'),
  ('SSN',              'Social Security Number'),
  ('PASSPORT',         'Passport number'),
  ('ARCHIVE_CUSTODIAN', 'Archive holding the source (e.g., NARA, MFF)')
on conflict (code) do nothing;

-- 16. Agencies
insert into v_agency (code, label) values
  ('FBI',  'Federal Bureau of Investigation'),
  ('CIA',  'Central Intelligence Agency'),
  ('DPD',  'Dallas Police Department'),
  ('WC',   'Warren Commission'),
  ('HSCA', 'House Select Committee on Assassinations'),
  ('NARA', 'National Archives and Records Administration'),
  ('SS',   'Secret Service'),
  ('UNKNOWN', 'Unspecified or Ambiguous Agency')
on conflict (code) do nothing;

-- 17. Document Formats (Classifier support)
insert into v_doc_format (code, label) values
  ('CABLE',            'Field cable communication'),
  ('201_FILE',         'Personality File dossier'),
  ('RIF',              'NARA Record Information Form'),
  ('AFFIDAVIT',        'Sworn written affidavit form'),
  ('DEPOSITION',       'Legal deposition transcript'),
  ('EXHIBIT',          'Evidence exhibit (Commission/Court)'),
  ('TESTIMONY',        'Sworn oral testimony transcript'),
  ('COVER_SHEET',      'Document cover or routing sheet'),
  ('INDEX_PAGE',       'Index or file inventory page'),
  ('TOC',              'Table of Contents'),
  ('GENERIC_TEMPLATE', 'Standard agency letterhead or blank form')
on conflict (code) do nothing;

-- 18. Content Types (Functional purpose)
insert into v_content_type (code, label) values
  ('WITNESS_INTERVIEW',  'Questioning of a witness or subject'),
  ('FORENSIC_ANALYSIS',  'Scientific or technical lab evaluation'),
  ('BALLISTICS',         'Firearms and ammunition analysis'),
  ('SURVEILLANCE',       'Physical or electronic monitoring report'),
  ('INVESTIGATIVE_SUMM', 'Summary of findings in an inquiry'),
  ('AUTOPSY_REPORT',     'Post-mortem medical examination'),
  ('SECURITY_CLEARANCE', 'Personnel security or background check'),
  ('POLYGRAPH_EXAM',    'Lie detector test results'),
  ('TIPS_AND_LEADS',     'Incoming information or public tips'),
  ('ADMINISTRATIVE',     'Internal housekeeping or procedural matter'),
  ('CORRESPONDENCE',     'Direct communication between parties'),
  ('SEARCH_WARRANT',     'Legal authorization for search/seizure')
on conflict (code) do nothing;
