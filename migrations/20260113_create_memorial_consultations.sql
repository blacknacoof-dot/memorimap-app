-- Migration: create memorial_consultations table for AI consultation bot
CREATE TABLE IF NOT EXISTS memorial_consultations (
  id BIGSERIAL PRIMARY KEY,
  facility_id BIGINT REFERENCES memorial_spaces(id) NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  mode TEXT CHECK (mode IN ('urgent', 'prepare')) NOT NULL,
  religion TEXT,
  budget TEXT,
  lighting TEXT, -- 채광 옵션 (e.g., 'bright', 'dim')
  tier TEXT,      -- 단높이 옵션 (e.g., 'low', 'mid', 'high')
  preferences JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','contracted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_memorial_consultations_timestamp ON memorial_consultations;

CREATE TRIGGER trg_memorial_consultations_timestamp
BEFORE UPDATE ON memorial_consultations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
BEFORE UPDATE ON memorial_consultations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
