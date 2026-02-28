-- user_notifications INSERT RLS 추가
-- 문제: 시설 관리자/파트너가 예약 승인/거절 시 고객 알림 INSERT 403 에러
-- 원인: INSERT 정책 없음 (SELECT, UPDATE만 존재)
-- 해결: 관리자 역할만 INSERT 허용

DROP POLICY IF EXISTS "admin_insert_notifications" ON public.user_notifications;

CREATE POLICY "admin_insert_notifications" ON public.user_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE clerk_id = public.clerk_user_id()
      AND role::text IN ('admin', 'partner', 'super_admin')
    )
  );
