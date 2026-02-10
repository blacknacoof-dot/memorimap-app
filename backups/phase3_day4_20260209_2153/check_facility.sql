-- Check if 인제대학교일산백병원 장례식장 exists in memorial_spaces
SELECT id, name, type, owner_user_id, address
FROM memorial_spaces
WHERE name ILIKE '%일산백%'
   OR name ILIKE '%인제대%일산%';
