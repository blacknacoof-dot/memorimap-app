-- Phase 1-4: Audit Logging System
-- 감사 로그 테이블 생성

-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS 정책 (Super Admin만 조회 가능)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'sangjo_manager')
    )
  );

-- 삽입은 모든 인증된 사용자 가능 (애플리케이션 레벨에서 호출)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 정리 함수 (90일 이상 된 로그 아카이빙)
CREATE OR REPLACE FUNCTION archive_old_audit_logs() RETURNS void AS $$
BEGIN
  -- 실제 운영 시에는 별도 아카이브 테이블로 이동
  -- 현재는 단순 삭제 (필요시 수정)
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
