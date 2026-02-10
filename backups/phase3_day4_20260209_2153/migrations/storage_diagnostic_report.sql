-- ==========================================
-- Supabase 스토리지 용량 진단 리포트
-- Storage Capacity Diagnostic Report
-- ==========================================
-- 목적: 현재 스토리지 사용량 분석 및 최적화 대상 파악

-- ==========================================
-- [1] 버킷별 전체 용량 및 파일 수 확인
-- ==========================================
SELECT 
  bucket_id as "버킷명",
  count(*) as "파일_개수",
  pg_size_pretty(sum((metadata->>'size')::bigint)) as "총_용량",
  pg_size_pretty(avg((metadata->>'size')::bigint)) as "평균_파일크기"
FROM storage.objects
GROUP BY bucket_id
ORDER BY sum((metadata->>'size')::bigint) DESC;

-- ==========================================
-- [2] 용량 돼지(가장 큰 파일) TOP 20 적발
-- ==========================================
SELECT 
  name as "파일명",
  bucket_id as "버킷",
  pg_size_pretty((metadata->>'size')::bigint) as "크기",
  created_at as "업로드일시",
  updated_at as "수정일시"
FROM storage.objects
ORDER BY (metadata->>'size')::bigint DESC
LIMIT 20;

-- ==========================================
-- [3] facility-images 버킷 상세 분석
-- ==========================================
-- defaults 폴더 vs funeral_real 폴더 비교
SELECT 
  CASE 
    WHEN name LIKE '%/defaults/%' THEN 'defaults (기본 이미지)'
    WHEN name LIKE '%/funeral_real/%' THEN 'funeral_real (최적화된 실제 이미지)'
    ELSE '기타'
  END as "폴더_분류",
  count(*) as "파일_개수",
  pg_size_pretty(sum((metadata->>'size')::bigint)) as "총_용량",
  pg_size_pretty(avg((metadata->>'size')::bigint)) as "평균_파일크기",
  pg_size_pretty(min((metadata->>'size')::bigint)) as "최소_크기",
  pg_size_pretty(max((metadata->>'size')::bigint)) as "최대_크기"
FROM storage.objects
WHERE bucket_id = 'facility-images'
GROUP BY 
  CASE 
    WHEN name LIKE '%/defaults/%' THEN 'defaults (기본 이미지)'
    WHEN name LIKE '%/funeral_real/%' THEN 'funeral_real (최적화된 실제 이미지)'
    ELSE '기타'
  END;

-- ==========================================
-- [4] 최근 업로드된 파일 (최근 7일)
-- ==========================================
SELECT 
  name as "파일명",
  bucket_id as "버킷",
  pg_size_pretty((metadata->>'size')::bigint) as "크기",
  created_at as "업로드일시"
FROM storage.objects
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- ==========================================
-- [5] 전체 스토리지 사용량 요약
-- ==========================================
SELECT 
  count(*) as "전체_파일_수",
  pg_size_pretty(sum((metadata->>'size')::bigint)) as "전체_용량",
  pg_size_pretty(sum(CASE WHEN bucket_id = 'facility-images' THEN (metadata->>'size')::bigint ELSE 0 END)) as "facility_images_용량"
FROM storage.objects;

-- ==========================================
-- 📝 진단 기준
-- ==========================================
-- 🚨 위험: 총 용량이 무료 플랜 1GB의 50% (500MB) 초과
-- ⚠️  주의: 평균 파일크기가 1MB 이상
-- ✅ 양호: 평균 파일크기 300-500KB
-- 
-- 최적화 대상:
-- - 5MB 이상 파일은 즉시 교체 또는 삭제
-- - 1MB 이상 파일은 최적화 검토
-- - defaults 폴더의 큰 파일들은 삭제 고려
