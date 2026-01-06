
-- 1. partner_inquiries 테이블 컬럼 보강
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_license_url TEXT;

-- 비로그인 신청을 위해 user_id를 NULL 허용으로 변경 (이미 설정되어 있다면 무시됨)
ALTER TABLE public.partner_inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 2. Storage Bucket 'partner_docs' 생성 및 권한 설정
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner_docs', 'partner_docs', true)
ON CONFLICT (id) DO NOTHING;

-- 기존 정책 충돌 방지를 위해 삭제 후 재생성
DROP POLICY IF EXISTS "Public Upload partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Select partner_docs" ON storage.objects;

-- 누구나 파일 업로드 가능 (비로그인 포함)
CREATE POLICY "Public Upload partner_docs" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'partner_docs' );

-- 누구나 파일 조회 가능
CREATE POLICY "Public Select partner_docs" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'partner_docs' );

-- 3. partner_inquiries 테이블 Insert 권한 설정 (RLS)
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.partner_inquiries;
CREATE POLICY "Enable insert for all users" 
ON public.partner_inquiries FOR INSERT 
WITH CHECK (true);

-- (선택) 본인 것만 조회
DROP POLICY IF EXISTS "Enable select for own rows" ON public.partner_inquiries;
CREATE POLICY "Enable select for own rows" 
ON public.partner_inquiries FOR SELECT 
USING (auth.uid()::text = user_id);
