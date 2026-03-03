-- S-1: user_notifications DELETE RLS 정책 추가
-- 사용자가 자신의 알림만 삭제할 수 있도록 허용

CREATE POLICY "notifications_delete_own"
  ON public.user_notifications
  FOR DELETE
  USING (public.clerk_user_id() = user_id);
