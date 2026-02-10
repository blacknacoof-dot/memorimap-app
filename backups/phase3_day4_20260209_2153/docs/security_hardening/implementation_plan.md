# Supabase PostGIS 격격리 및 보안 강화 계획

본 계획은 전문가가 제안한 **'PostGIS Isolation'** 전략을 바탕으로, `public` 스키마의 시스템 테이블 노출을 근본적으로 차단하고 `backup` 스키마를 완벽히 봉인하는 절차를 담고 있습니다.

## ⚠️ 사전 필수 조건 (Preconditions)
- [ ] **전체 DB 백업**: Supabase 대시보드에서 스냅샷(PITR) 또는 `pg_dump`를 통한 데이터 백업을 반드시 완료해야 합니다.
- [ ] **권한 확인**: `service_role` 또는 슈퍼유저 권한이 필요합니다 (SQL 에디터 권장).

## 작업 세부 사항 (Step-by-Step)

### [Phase 1: 사전 점검 (Inspection)]
현재 PostGIS 객체의 위치를 확인합니다.
```sql
-- 1. public 스키마 내 PostGIS 시스템 객체 확인
SELECT n.nspname AS schema, c.relname AS object 
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace 
WHERE c.relkind IN ('r','v','m') 
AND n.nspname = 'public' 
AND c.relname IN ('spatial_ref_sys','geometry_columns','geography_columns');

-- 2. PostGIS 확장 프로그램 설치 스키마 확인
SELECT extname, nspname 
FROM pg_extension 
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid 
WHERE extname = 'postgis';
```

### [Phase 2: PostGIS 시스템 예외 처리 (Genius Verdict)]
`spatial_ref_sys` 경고는 PostGIS 확장 프로그램의 내부 구조와 관련된 것으로, 현재 환경의 `service_role` 권한으로는 직접 RLS를 활성화할 수 없음을 확인했습니다. (오류: Must be owner)

**해결 방안:**
1.  **[수용]**: 시스템 테이블의 특성상 공개된 읽기 전용 정보이므로 보안 리스크가 낮습니다. 공식적으로 '안전한 예외'로 관리합니다.
2.  **[수동 해결]**: 린터 경고를 반드시 제거하고 싶다면, 사용자가 Supabase Dashboard SQL Editor(슈퍼유저 권한)에서 아래 SQL을 직접 실행해야 합니다.

```sql
-- 대시보드 SQL Editor 전용 (슈퍼유저용)
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.spatial_ref_sys FOR SELECT TO public USING (true);
```

### [Phase 3: Profiles 테이블 RLS 정상화 (Completed)]
- 사용자가 자신의 프로필을 생성/수정할 수 있도록 정책을 보강하여 콘솔의 `42501` 에러 해결 완료.

### [Phase 4: 백업 스키마 최종 봉인 (Lockdown)]
이전에 격리한 `backup` 스키마를 완전히 블랙박스화합니다.
```sql
-- 1. 린터 방해물 제거
DROP POLICY IF EXISTS "super_admin_manage__policy_backup" ON backup."VOID_TO_DELETE__policy_backup";

-- 2. 완전 권한 박탈
REVOKE ALL ON SCHEMA backup FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA backup FROM PUBLIC;
```

### [Phase 5: 허용적 RLS 정책 강화 (Permissive RLS Hardening)]
`INSERT` 또는 `ALL` 작업에 대해 `USING (true)`를 사용하는 위험한 정책들을 식별하고, 실제 소유자만 작업을 수행할 수 있도록 강화합니다.

#### 1. 대화 및 문의 (Conversations & Inquiries)
```sql
-- partner_conversations: 본인 대화만 삽입 가능
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.partner_conversations;
CREATE POLICY "Users/Partners can insert their own conversations" 
ON public.partner_conversations FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text OR auth.uid()::text = partner_id::text);

-- partner_inquiries: 본인 문의만 삽입 가능
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.partner_inquiries;
CREATE POLICY "Users can insert their own inquiries" 
ON public.partner_inquiries FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);
```

#### 2. 결제 및 알림 (Payments & Notifications)
```sql
-- subscription_payments: 서비스 롤 또는 소유자만 삽입 가능 (복합 체크)
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.subscription_payments;
CREATE POLICY "Service role or owner can insert payments" 
ON public.subscription_payments FOR INSERT 
WITH CHECK (
  auth.role() = 'service_role' 
  OR EXISTS (
    SELECT 1 FROM public.facility_subscriptions fs
    JOIN public.memorial_spaces ms ON fs.facility_id = ms.id
    WHERE fs.id = subscription_id AND ms.owner_user_id = (select auth.uid())::text
  )
);

-- user_notifications: 본인 알림만 조회/수정 가능, 관리 환경은 서비스 롤만
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.user_notifications;
CREATE POLICY "Users can view own notifications" 
ON public.user_notifications FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications (is_read)" 
ON public.user_notifications FOR UPDATE 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);
```

### [Phase 7: Genius Profile Sync Fix (Emergency)]
콘솔에 탐지된 `406`, `401`, `42501` 에러를 한 번에 해결하기 위한 마스터 쿼리입니다. 이 작업은 스키마 캐시를 강제 갱신하고, Clerk-Supabase 간의 복잡한 인증 경로를 모두 허용하도록 정책을 재구성합니다.

```sql
-- 1. 스키마 캐시 갱신 (406 Not Acceptable 해결의 핵심)
NOTIFY pgrst, 'reload schema';

-- 2. Profiles 권한 및 RLS 상태 확인
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO anon;

-- 3. 천재적 RLS 정책 (Clerk ID와 JWT sub를 모두 포용)
-- INSERT 정책: 데이터의 clerk_id가 현재 인증된 사용자의 ID(Clerk UUID 또는 sub)와 일치하면 허용
DROP POLICY IF EXISTS "Genius profile insert" ON public.profiles;
CREATE POLICY "Genius profile insert" 
ON public.profiles FOR INSERT 
TO authenticated, anon
WITH CHECK (
  clerk_id = (select auth.jwt() ->> 'sub') 
  OR clerk_id = (select auth.uid())::text
);

-- SELECT 정책: 조회 에러(406) 및 권한(401) 방지를 위한 기본 정책 보강
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- UPDATE 정책: 소유자 확인 로직 강화
DROP POLICY IF EXISTS "Genius profile update" ON public.profiles;
CREATE POLICY "Genius profile update" 
ON public.profiles FOR UPDATE 
USING (
  clerk_id = (select auth.jwt() ->> 'sub') 
  OR clerk_id = (select auth.uid())::text
)
WITH CHECK (
  clerk_id = (select auth.jwt() ->> 'sub') 
  OR clerk_id = (select auth.uid())::text
);
```

### [Phase 8: 최종 클린업 (Final Cleanup)]
모든 설정이 정상인 경우 격리했던 테이블을 삭제합니다.
```sql
DROP TABLE public."VOID_TO_DELETE__policy_backup";
DROP TABLE public."VOID_TO_DELETE_backup_policies_20260129";
```

## 검증 계획 (Verification)
- [ ] **Linter 확인**: `rls_policy_always_true` 경고가 해당 테이블들에서 사라졌는지 확인.
- [ ] **기능 테스트**: 일반 사용자로 로그인하여 본인의 알림, 대화가 정상적으로 작동하는지 확인.
- [ ] **보안 테스트**: 타인의 ID로 `INSERT` 시도 시 RLS에 의해 차단되는지 확인.
