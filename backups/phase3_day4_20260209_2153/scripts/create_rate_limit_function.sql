-- Phase 1-4: Rate Limiting System
-- API 남용 방지를 위한 Rate Limiting 함수 및 테이블 생성

-- Rate Limit 로그 테이블 생성
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time
ON rate_limit_log(user_id, action, created_at DESC);

-- Rate Limiting 함수 생성
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_identifier TEXT,
  action_type TEXT,
  max_requests INT DEFAULT 10,
  time_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  request_count INT;
BEGIN
  -- 최근 시간 창 내 요청 수 조회
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_log
  WHERE user_id = user_identifier
    AND action = action_type
    AND created_at > NOW() - (time_window_seconds || ' seconds')::INTERVAL;

  -- 제한 초과 시 false 반환
  IF request_count >= max_requests THEN
    RETURN FALSE;
  END IF;

  -- 로그 기록
  INSERT INTO rate_limit_log (user_id, action, created_at)
  VALUES (user_identifier, action_type, NOW());

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 정리 함수 (7일 이상 된 로그 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_log
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용 예시:
-- SELECT check_rate_limit('user_123', 'review_create', 10, 3600); -- 10회/시간
-- SELECT check_rate_limit('user_123', 'consultation_create', 5, 3600); -- 5회/시간
-- SELECT check_rate_limit('user_123', 'search_query', 100, 60); -- 100회/분
