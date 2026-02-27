-- File: 014_person_names_schema.sql
-- Add middle name support and LNU/FNU vocabulary for unknown names

-- Add LNU/FNU to v_name_type vocabulary
insert into v_name_type values
  ('FNU', 'First Name Unknown - Used when first name is not known'),
  ('LNU', 'Last Name Unknown - Used when last name is not known')
on conflict (code) do nothing;

-- Add middle_name column to people table
alter table people add column middle_name text;

-- Update existing records with proper name handling
update people set 
  middle_name = 'Harvey' 
where person_id = '3f4a5b6c-7d8e-49f0-a1b2-c3d4e5f6a7b8'; -- Lee Harvey Oswald

update people set 
  middle_name = 'Leon' 
where person_id = '8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d'; -- Ralph Leon Yates

update people set 
  family_name = 'LNU',
  display_name = 'Bernice (LNU)'
where person_id = 'b5c6d7e8-f9a0-4123-b4c5-d6e7f8a9b0c1'; -- Bernice (last name unknown)

update people set 
  family_name = 'LNU',
  display_name = 'Angelo (LNU)'
where person_id = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'; -- Angelo (no last name)

-- Add comments for clarity
comment on column people.middle_name is 'Middle name or initial of the person';
comment on column people.family_name is 'Family name (surname). Use LNU for unknown last names';
comment on column people.given_name is 'Given name (first name). Use FNU for unknown first names';
