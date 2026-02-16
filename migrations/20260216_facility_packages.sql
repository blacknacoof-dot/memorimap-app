-- ============================================================
-- facility_packages 테이블 생성
-- 시설별 가격/패키지 정보 관리
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.facility_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price BIGINT,
  price_label TEXT,
  description TEXT,
  included_items TEXT[],
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_facility_packages_facility_id ON public.facility_packages(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_packages_active ON public.facility_packages(facility_id, is_active) WHERE is_active = true;

-- 3. updated_at 트리거
CREATE OR REPLACE FUNCTION public.update_facility_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_facility_packages_updated_at ON public.facility_packages;
CREATE TRIGGER set_facility_packages_updated_at
  BEFORE UPDATE ON public.facility_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_facility_packages_updated_at();

-- 4. RLS 활성화
ALTER TABLE public.facility_packages ENABLE ROW LEVEL SECURITY;

-- 일반 유저: 활성 패키지만 조회
CREATE POLICY "facility_packages_select_active"
  ON public.facility_packages
  FOR SELECT
  USING (is_active = true);

-- 시설 소유자: 자기 시설 패키지 전체 관리
CREATE POLICY "facility_packages_owner_all"
  ON public.facility_packages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = facility_id
      AND f.user_id = public.clerk_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = facility_id
      AND f.user_id = public.clerk_user_id()
    )
  );

-- 슈퍼관리자: 전체 접근
CREATE POLICY "facility_packages_super_admin"
  ON public.facility_packages
  FOR ALL
  USING (
    public.is_super_admin()
  )
  WITH CHECK (
    public.is_super_admin()
  );

-- 5. 권한 부여
GRANT SELECT ON public.facility_packages TO anon;
GRANT ALL ON public.facility_packages TO authenticated;
