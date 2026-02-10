-- Update script to randomize Sangjo review ratings
-- Goal: Skew distribution towards high ratings but introduce variation (3~5 stars)
-- Approx distribution: 5 star (60%), 4 star (30%), 3 star (10%)

UPDATE reviews
SET rating = CASE 
    WHEN floor(random() * 10) < 6 THEN 5 -- 0~5 (60%)
    WHEN floor(random() * 10) < 9 THEN 4 -- 6~8 (30%)
    ELSE 3 -- 9 (10%)
END
WHERE id IN (
    SELECT id FROM reviews 
    WHERE space_id IN (
        SELECT id::text FROM facilities WHERE category = 'sangjo'
        UNION
        SELECT id::text FROM memorial_spaces WHERE type = 'sangjo'
    ) -- Filter Sangjo from both tables
    OR user_name IS NOT NULL -- Safety catch for all mock reviews
);

-- Force some variety in dates as well (optional, but good for realism)
-- Random date within last year
UPDATE reviews
SET created_at = to_char(current_date - (floor(random() * 365) || ' days')::interval, 'YYYY-MM-DD')::timestamp
WHERE created_at IS NULL OR created_at::date = '2023-01-01';

-- Force update names to standard masked format (Kim**, Lee**, etc.)
UPDATE reviews
SET user_name = (ARRAY['김**', '이**', '박**', '최**', '정**', '강**', '조**', '윤**', '장**', '임**', '한**', '오**', '서**', '신**', '권**', '황**', '안**', '송**', '전**', '홍**'])[floor(random() * 20 + 1)]
WHERE user_name IS NULL OR user_name = '' OR user_name LIKE '%님';

-- Verify update
SELECT rating, user_name, count(*) 
FROM reviews 
GROUP BY rating, user_name
ORDER BY rating DESC;
