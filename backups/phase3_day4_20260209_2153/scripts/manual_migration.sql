-- 1. Backup Current Table
CREATE TABLE IF NOT EXISTS memorial_spaces_backup_20251223 AS SELECT * FROM memorial_spaces;

-- 2. Add parent_id Column
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES memorial_spaces(id);
