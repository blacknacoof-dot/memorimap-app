-- Add target_facility_id to partner_inquiries table
ALTER TABLE partner_inquiries
ADD COLUMN IF NOT EXISTS target_facility_id UUID REFERENCES memorial_spaces(id);

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_target_facility_id ON partner_inquiries(target_facility_id);
