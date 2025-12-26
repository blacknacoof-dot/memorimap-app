-- ==========================================================
-- [긴급 보안 패치] RLS 활성화 및 권한/정책 설정 (최종/실행용)
-- 작성일: 2024-12-24
-- 설명: 취약한 테이블의 RLS를 켜고, 관리자/사용자/공개 권한을 재설정합니다.
--       기존 정책이 있어도 에러가 나지 않도록 (DROP IF EXISTS) 처리되었습니다.
-- ==========================================================

-- 1. RLS(Row Level Security) 활성화 (이미 켜져 있어도 에러 안 남)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sangjo_dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_spaces_backup_20251223 ENABLE ROW LEVEL SECURITY;

-- 2. 중복 리뷰 방지 (시설당 1개)
-- UNIQUE 인덱스 추가 (이미 있으면 무시)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_user 
ON public.facility_reviews(facility_id, user_id) 
WHERE source = 'user';


-- 3. 정책(Policy) 설정
-- 기존 정책 충돌 방지를 위해 삭제 후 재생성

-- (1) 누구나 조회 가능한 테이블 (공개 데이터)

DROP POLICY IF EXISTS "Public Read Access" ON public.subscription_plans;
CREATE POLICY "Public Read Access" ON public.subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.facility_images;
CREATE POLICY "Public Read Access" ON public.facility_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.facility_reviews;
CREATE POLICY "Public Read Access" ON public.facility_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.review_helpful_logs;
CREATE POLICY "Public Read Access" ON public.review_helpful_logs FOR SELECT USING (true);

-- (2) 관리자(Super Admin) 전용 테이블 (민감 데이터 및 모든 관리 권한)

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.subscription_plans;
CREATE POLICY "Super Admin Manage All" ON public.subscription_plans FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.sms_templates;
CREATE POLICY "Super Admin Manage All" ON public.sms_templates FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.subscription_payments;
CREATE POLICY "Super Admin Manage All" ON public.subscription_payments FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.facility_reviews;
CREATE POLICY "Super Admin Manage All" ON public.facility_reviews FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.facility_images;
CREATE POLICY "Super Admin Manage All" ON public.facility_images FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.sangjo_dashboard_users;
CREATE POLICY "Super Admin Manage All" ON public.sangjo_dashboard_users FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.review_helpful_logs;
CREATE POLICY "Super Admin Manage All" ON public.review_helpful_logs FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.subscription_history;
CREATE POLICY "Super Admin Manage All" ON public.subscription_history FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.faq_view_logs;
CREATE POLICY "Super Admin Manage All" ON public.faq_view_logs FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.memorial_spaces_backup_20251223;
CREATE POLICY "Super Admin Manage All" ON public.memorial_spaces_backup_20251223 FOR ALL USING (is_super_admin());

-- (3) 일반 사용자(Authenticated) 쓰기 권한 추가

-- 리뷰 작성: "예약 확정(confirmed)" 된 사용자만 가능 + 본인 확인
DROP POLICY IF EXISTS "User Create Review" ON public.facility_reviews;
CREATE POLICY "User Create Review" ON public.facility_reviews 
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM public.reservations
      WHERE user_id = auth.uid()::text
      AND facility_id = public.facility_reviews.facility_id::text
      AND status = 'confirmed'
    )
  );

-- 리뷰 수정(본인만)
DROP POLICY IF EXISTS "User Update Own Review" ON public.facility_reviews;
CREATE POLICY "User Update Own Review" ON public.facility_reviews 
  FOR UPDATE USING (auth.uid()::text = user_id);
  
-- 리뷰 삭제(본인만)
DROP POLICY IF EXISTS "User Delete Own Review" ON public.facility_reviews;
CREATE POLICY "User Delete Own Review" ON public.facility_reviews 
  FOR DELETE USING (auth.uid()::text = user_id);

-- 리뷰 도움됨 클릭
DROP POLICY IF EXISTS "User Create Helpful Log" ON public.review_helpful_logs;
CREATE POLICY "User Create Helpful Log" ON public.review_helpful_logs 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- FAQ 조회 로그 (누구나)
DROP POLICY IF EXISTS "Anyone Create View Log" ON public.faq_view_logs;
CREATE POLICY "Anyone Create View Log" ON public.faq_view_logs 
  FOR INSERT WITH CHECK (true);

-- 4. 함수 경로(Search Path) 보안 패치
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_facility_rating() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
