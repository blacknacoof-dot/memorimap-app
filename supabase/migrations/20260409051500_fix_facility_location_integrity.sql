-- Fix facility records whose stored address/coordinates are inconsistent with
-- verified public listing data. Keep the scope narrow to rows that were
-- confirmed as mismatched during April 9, 2026 validation.

update public.facilities
set
  address = '경기도 고양시 덕양구 내유길131번길 123',
  latitude = 37.7253315,
  longitude = 126.8629778,
  updated_at = now()
where legacy_id = '1179'
  and name = '백란공원묘원';

update public.facilities
set
  address = '전북특별자치도 전주시 덕진구 초포다리로 64',
  latitude = 35.8524212,
  longitude = 127.1542373,
  updated_at = now()
where legacy_id = '10988915'
  and name = '(유)현대장례식장';

update public.facilities
set
  latitude = 37.7468679,
  longitude = 127.0565892,
  updated_at = now()
where legacy_id = '1068'
  and name = '자미원스카이장례식장';
