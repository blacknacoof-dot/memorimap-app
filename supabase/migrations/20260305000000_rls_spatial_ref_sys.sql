-- spatial_ref_sys: PostGIS 확장 시스템 테이블 (좌표계 정의)
-- 민감 데이터 없음. Security Advisor false positive 제거용으로 RLS 활성화 + 전체 읽기 허용
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spatial_ref_sys_select_public"
  ON public.spatial_ref_sys
  FOR SELECT
  USING (true);
