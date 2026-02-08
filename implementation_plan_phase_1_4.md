# Phase 1-4: Security Hardening Implementation Plan

## 목표 (Objective)
보안 취약점을 제거하고 RLS 정책, SQL Injection, XSS 방어 체계를 강화합니다.

---

## 작업 범위 (Scope)

### 1. RLS 정책 검증 및 보완
**대상 테이블:**
- `profiles` - 사용자 프로필 보호
- `partner_conversations` - 파트너 대화 내역 보호
- `consultations` - 상담 데이터 보호
- `facilities` - 시설 정보 접근 제어

**작업 내용:**
1. 기존 RLS 정책 감사 (71개 RLS 관련 SQL 파일 확인됨)
2. 누락된 정책 추가
3. Clerk JWT 토큰 기반 인증 검증
4. UUID 타입 캐스팅 일관성 확보 (`::uuid`)

### 2. SQL Injection 방어
**취약점:**
- `ilike` 연산자 사용 시 사용자 입력 검증 부재
- 동적 쿼리 생성 시 파라미터 바인딩 미흡

**작업 내용:**
1. 모든 `ilike` 사용처 검사 (100+ 파일에서 발견됨)
2. 입력 검증 함수 작성 (`sanitizeSearchInput`)
3. Supabase 파라미터 바인딩 강제 사용
4. 정규표현식 기반 특수문자 필터링

### 3. XSS 방어
**취약점:**
- 사용자 생성 콘텐츠 렌더링 시 sanitization 부재
- `dangerouslySetInnerHTML` 사용 가능성

**작업 내용:**
1. `DOMPurify` 라이브러리 설치
2. 모든 사용자 입력 렌더링 포인트 식별
3. `sanitizeHtml` 헬퍼 함수 작성
4. 리뷰, 상담노트, FAQ 등 sanitize 적용

---

## 세부 구현 계획

### Step 1: RLS 정책 검증 스크립트 작성

#### 파일: `scripts/verify_rls_complete.sql`
```sql
-- 모든 테이블의 RLS 상태 확인
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 각 테이블의 정책 목록
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- partner_conversations 테이블 존재 여부 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partner_conversations'
) as table_exists;
```

**검증 항목:**
- [ ] `profiles`: SELECT (자신 + super_admin), UPDATE (자신만), INSERT (authenticated)
- [ ] `partner_conversations`: SELECT/INSERT/UPDATE (파트너 본인 or super_admin) [테이블 존재 확인됨 ✅]
- [ ] `consultations`: SELECT (시설 관리자 or 작성자 or super_admin)
- [ ] `facilities`: SELECT (public), UPDATE (owner_user_id or super_admin)

---

### Step 2: SQL Injection 방어 유틸리티

#### 파일: `lib/security/sqlSanitize.ts`
```typescript
/**
 * SQL Injection 방지를 위한 입력 검증
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // 위험한 SQL 키워드 제거
  const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi;
  
  // 특수문자 이스케이핑 (%, _, ;, --, /*, */)
  return input
    .replace(dangerous, '')
    .replace(/[%_';\\]/g, '')
    .trim()
    .slice(0, 200); // 최대 길이 제한
}

/**
 * ILIKE 쿼리용 안전한 패턴 생성
 */
export function createSafeIlikePattern(input: string): string {
  const sanitized = sanitizeSearchInput(input);
  return `%${sanitized}%`;
}
```

**적용 대상:**
- `lib/queries.ts`: `searchFacilitiesByRegion`, `getDistinctRegions`
- `lib/api/superAdmin.ts`: `searchFacilities`
- `components/FilterBar.tsx`: 검색 입력 처리

---

### Step 3: XSS 방어 유틸리티

#### 파일: `lib/security/xssSanitize.ts`
```typescript
import DOMPurify from 'dompurify';

/**
 * XSS 공격 방지를 위한 HTML sanitization
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  });
}

/**
 * Plain text로 변환 (모든 HTML 제거)
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

> [!IMPORTANT]
> **DOMPurify 패키지 선택:**
> - 현재 `components/Consultation/PetChatInterface.tsx`에서 이미 `dompurify` 사용 중 ✅
> - `isomorphic-dompurify` 대신 기존 `dompurify` 유지 (이미 설치됨)
> - `@types/dompurify`는 이미 포함되어 있음

**적용 대상:**
- `components/ReviewCard.tsx`: 리뷰 내용 렌더링
- `components/Consultation/ConsultationView.tsx`: 상담 노트
- `components/FacilityFAQManager.tsx`: FAQ 답변
- `components/Consultation/PetChatInterface.tsx`: 이미 적용됨 (Line 504) ✅

---

### Step 4: 파일 업로드 보안 강화

#### 파일: `lib/security/fileValidation.ts`
```typescript
/**
 * 허용된 이미지 MIME 타입
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 파일 업로드 검증
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 1. 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 5MB 이하여야 합니다.' };
  }

  // 2. MIME 타입 검증
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 허용)' };
  }

  // 3. 파일 확장자 이중 검증
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!fileExt || !allowedExts.includes(fileExt)) {
    return { valid: false, error: '잘못된 파일 확장자입니다.' };
  }

  return { valid: true };
}
```

**적용 위치:**
- `lib/queries.ts`: `uploadReviewImage` 함수 (Line 42-58) 수정
- `components/ReviewForm.tsx`: 파일 선택 시 즉시 검증

---

### Step 5: Rate Limiting (API 남용 방지)

#### Supabase 함수 기반 Rate Limiting
```sql
-- scripts/create_rate_limit_function.sql
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
```

**적용 대상:**
- 리뷰 작성: 10회/시간
- 상담 신청: 5회/시간
- 검색 쿼리: 100회/분

---

### Step 6: 감사 로그 (Audit Logging)

#### 파일: `lib/security/auditLog.ts`
```typescript
import { supabase } from '@/lib/supabaseClient';

export enum AuditAction {
  PROFILE_UPDATE = 'profile_update',
  REVIEW_CREATE = 'review_create',
  REVIEW_DELETE = 'review_delete',
  CONSULTATION_CREATE = 'consultation_create',
  FACILITY_UPDATE = 'facility_update',
  ADMIN_ACCESS = 'admin_access',
  RLS_VIOLATION = 'rls_violation'
}

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * 감사 로그 기록
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      metadata: entry.metadata,
      ip_address: entry.ipAddress,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Audit Log Error]', error);
    // 감사 로그 실패는 사용자 경험을 방해하지 않도록 silent fail
  }
}
```

**감사 로그 테이블 생성:**
```sql
-- scripts/create_audit_logs_table.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**적용 대상:**
- 프로필 수정: `updateUserProfile`
- 시설 정보 수정: `updateFacility`
- 관리자 접근: `SuperAdminDashboard`, `FacilityAdminDashboard`
- RLS 위반 시도 (Supabase 트리거)

---

### Step 7: RLS 정책 보완 SQL

#### 파일: `scripts/apply_rls_phase_1_4.sql`
```sql
-- [CRITICAL] 기존 정책 백업 (DROP 전)
-- CREATE TABLE rls_policies_backup_20260208 AS 
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 1. profiles 테이블 RLS 강화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'sub' = clerk_id::text
    OR 
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = clerk_id::text);

-- 2. partner_conversations RLS (UUID 일관성)
ALTER TABLE partner_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners can view own conversations" ON partner_conversations;
CREATE POLICY "Partners can view own conversations" ON partner_conversations
  FOR SELECT
  USING (
    auth.jwt() ->> 'sub' = partner_id::text
    OR 
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );

-- 3. consultations RLS 
DROP POLICY IF EXISTS "Facility admins can view consultations" ON consultations;
CREATE POLICY "Facility admins can view consultations" ON consultations
  FOR SELECT
  USING (
    -- 시설 소유자
    EXISTS (
      SELECT 1 FROM facilities 
      WHERE id::text = consultations.facility_id::text
      AND user_id = auth.jwt() ->> 'sub'
    )
    OR
    -- 작성자 본인
    auth.jwt() ->> 'sub' = user_id::text
    OR
    -- Super Admin
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );
```

---

## 검증 계획 (Verification)

### 1. RLS 테스트
```typescript
// tests/security/rls.test.ts
describe('RLS Policies', () => {
  it('should prevent unauthorized profile access', async () => {
    // 다른 사용자 프로필 조회 시도 -> 실패 예상
  });
  
  it('should allow super_admin to view all data', async () => {
    // Super Admin으로 로그인 -> 모든 데이터 접근 가능 확인
  });
});
```

### 2. SQL Injection 테스트
```typescript
// tests/security/sql-injection.test.ts
describe('SQL Injection Prevention', () => {
  it('should sanitize search input', () => {
    const malicious = "'; DROP TABLE users; --";
    const result = sanitizeSearchInput(malicious);
    expect(result).not.toContain('DROP');
  });
});
```

### 3. XSS 테스트
```typescript
// tests/security/xss.test.ts
describe('XSS Prevention', () => {
  it('should strip dangerous HTML', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('<script>');
  });
});
```

### 4. File Upload 테스트
```typescript
// tests/security/file-upload.test.ts
describe('File Upload Security', () => {
  it('should reject invalid MIME types', () => {
    const fakeImage = new File([''], 'test.exe', { type: 'application/exe' });
    const result = validateImageFile(fakeImage);
    expect(result.valid).toBe(false);
  });

  it('should reject files exceeding size limit', () => {
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
  });
});
```

---

## 우선순위 (Priority)

### P0 (즉시)
1. `profiles` RLS 정책 검증 및 적용
2. `ilike` 입력 검증 (`searchFacilitiesByRegion`)
3. 파일 업로드 MIME 타입 검증 (`uploadReviewImage`)

### P1 (이번 주)
4. `partner_conversations` RLS 정책
5. XSS sanitization (리뷰, 상담노트)
6. Rate Limiting 함수 및 테이블 생성

### P2 (다음 주)
7. 감사 로그 시스템 구축
8. 전체 보안 감사 스크립트 자동화
9. 보안 테스트 케이스 작성

---

## 추가 고려사항

### 1. DOMPurify 패키지 선택
- ✅ **기존 `dompurify` 사용 확인** (`PetChatInterface.tsx`에서 이미 사용 중)
- ✅ **번들 크기 최적화**: `isomorphic-dompurify` 불필요 (SSR 사용 안 함)
- ⚠️ **Tree-shaking 확인**: Vite 빌드 시 사용하지 않는 DOMPurify 기능 제거 확인

### 2. `dangerouslySetInnerHTML` 사용 현황
- ✅ **확인됨**: `components/Consultation/PetChatInterface.tsx` Line 504
- ✅ **이미 DOMPurify 적용됨**: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }}`
- ✅ **추가 작업 불필요**: 이미 안전하게 처리됨

### 3. `partner_conversations` 테이블 사전 확인
- ✅ **테이블 존재 확인됨**: `scripts/list_partner_conversations_policies.sql` 파일 발견
- ✅ **RLS 정책 적용 가능**

### 4. 스테이징 환경 테스트
- ⚠️ **스테이징 DB 필요**: RLS 정책은 즉시 적용되므로 프로덕션 전 반드시 스테이징에서 테스트
- ⚠️ **롤백 계획**: 정책 적용 실패 시 즉시 롤백할 수 있도록 백업 SQL 준비

### 5. Rate Limiting 성능 고려
- ⚠️ **DB 부하**: `rate_limit_log` 테이블은 빠르게 증가하므로 정기적인 purge 필요
- 💡 **권장**: 7일 이상 된 로그는 자동 삭제 (pg_cron 또는 Supabase Edge Function 사용)

---

## 체크리스트

### 기본 작업
- [ ] `lib/security/` 폴더 생성
- [ ] SQL Injection 방어 함수 작성 (`sqlSanitize.ts`)
- [ ] XSS 방어 함수 작성 (`xssSanitize.ts`) - DOMPurify 이미 설치됨 ✅
- [ ] 파일 업로드 검증 함수 작성 (`fileValidation.ts`)
- [ ] Rate Limiting 함수 및 테이블 생성
- [ ] 감사 로그 시스템 구축

### RLS 정책 적용
- [ ] **[CRITICAL]** 기존 RLS 정책 백업 (`CREATE TABLE rls_policies_backup_...`)
- [ ] RLS 검증 스크립트 실행 (`verify_rls_complete.sql`)
- [ ] 스테이징 환경에서 RLS 정책 테스트
- [ ] RLS 정책 보완 SQL 적용 (`apply_rls_phase_1_4.sql`)
- [ ] 프로덕션 배포 시 다운타임 최소화 계획 수립

### 코드 적용
- [ ] 모든 `ilike` 사용처 수정 (100+ 파일)
- [ ] `uploadReviewImage` 함수에 파일 검증 추가
- [ ] 사용자 입력 렌더링 포인트 sanitize 적용
- [ ] 관리자 접근 시 audit log 기록

### 테스트 및 검증
- [ ] 보안 테스트 작성 및 실행
- [ ] TypeScript 빌드 확인 (`tsc --noEmit`)
- [ ] 스테이징 환경에서 E2E 테스트
- [ ] Rate Limiting 동작 확인
- [ ] 감사 로그 정상 기록 확인

---

## 예상 소요 시간
- RLS 정책 검증/보완: 2-3시간
- SQL Injection 방어: 1-2시간
- XSS 방어: 0.5시간 (이미 부분 적용됨)
- 파일 업로드 보안: 1시간
- Rate Limiting: 2시간
- 감사 로그: 1.5시간
- 테스트 및 검증: 2시간
- **총 예상 시간: 10-12시간**

