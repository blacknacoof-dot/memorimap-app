-- Update the type check constraint to include new types
alter table memorial_spaces drop constraint if exists memorial_spaces_type_check;

alter table memorial_spaces add constraint memorial_spaces_type_check 
check (type in ('funeral', 'park', 'memorial_park', 'charnel', 'natural', 'complex', 'sea', 'pet', 'sangjo'));

-- Also update existing 'funeral_home' or 'memorial_park' strings if they exist (though we map them in code)
-- This ensures the DB stays clean.
comment on constraint memorial_spaces_type_check on memorial_spaces is 'Allowed facility types';
