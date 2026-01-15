
-- Fix Hyowon Funeral Center Category
UPDATE facilities
SET category = 'funeral_home'
WHERE name LIKE '%효원장례문화센타%' OR name LIKE '%효원상조%';
