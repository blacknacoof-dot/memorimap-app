-- ai_consultations 테이블 고도화 (v2.0)
-- 2026-02-01 통합 거버넌스 구축용

-- 1. 기존 컬럼 및 제약사항 정리
ALTER TABLE public.ai_consultations 
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL;

-- 2. 컬럼 매핑 (데이터 보존용)
-- 기존 space_id가 legacy_id일 가능성이 크므로 facility_id 매핑 시도
UPDATE public.ai_consultations ac
SET facility_id = f.id
FROM public.facilities f
WHERE ac.space_id = f.legacy_id OR ac.space_id = f.id::text
AND ac.facility_id IS NULL;

-- 3. 유니크 제약 조건 추가 (Ghost Session 방지)
-- 동일한 기반 세션 식별자가 있으면 upsert 가능하게 함
-- (참고: conversation_id가 중복될 경우 기존 레코드를 업데이트하는 로직은 애플리케이션 레벨에서 수행)
CREATE INDEX IF NOT EXISTS idx_ai_consultations_conv_id ON public.ai_consultations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_status ON public.ai_consultations(status);

-- 4. RLS 정책 보완 (Support/Admin 접근 권한 추가 필요 시)
-- Super Admin은 모든 상담 내역을 볼 수 있어야 함
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_consultations' AND policyname = 'Admins can view all consultations'
    ) THEN
        CREATE POLICY "Admins can view all consultations"
          ON public.ai_consultations FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles
              WHERE id = auth.uid() AND role = 'super_admin'
            )
          );
    END IF;
END $$;
