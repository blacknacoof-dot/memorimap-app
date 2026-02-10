-- Remove unique constraint on user_id to allow multiple inquiries (Consultations)
-- 기존에는 한 계정당 하나의 문의만 가능했으나, 1:1 상담은 여러 번 신청할 수 있어야 하므로 제약을 제거합니다.
ALTER TABLE public.partner_inquiries DROP CONSTRAINT IF EXISTS partner_inquiries_user_id_key;

-- Add a comment for clarification
COMMENT ON TABLE public.partner_inquiries IS 'Partner join requests and 1:1 consultations (Allows multiple per user)';
