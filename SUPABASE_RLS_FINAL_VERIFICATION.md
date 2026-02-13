# SUPABASE_RLS_VERIFICATION_REPORT.md 코드 대조 검증

**검증일**: 2026-02-13
**검증 방법**: 보고서 SQL ↔ 실제 코드베이스 전수 대조

---

## 검증 결과 요약

| # | 항목 | 판정 | 비고 |
|---|------|------|------|
| 1 | SELECT 정책 | ✅ 적합 | `auth.jwt() ->> 'sub'` = Clerk ID, 코드 매칭 확인 |
| 2 | INSERT 정책 | ⚠️ 주의 | SearchForm은 OK, `createConsultation()` 레거시 함수 영향 |
| 3 | UPDATE 정책 | ❌ 오류 | USING에 사용자 본인 누락 → 사용자 UPDATE 불가 |
| 4 | DELETE 정책 | ✅ 적합 | super_admin 제한 적절 |
| 5 | 타입 변환 | ⚠️ 확인필요 | 기존 데이터 형식 확인 후 실행 |
| 6 | 인덱스 | ✅ 적합 | 성능 개선 적절 |
| 7 | Realtime | ✅ 적합 | 추가 권장사항 적절 |
| 8 | 감사 로깅 | ➖ 선택 | 현 단계 불필요, 추후 고려 |

---

## 1. ❌ UPDATE 정책 USING/WITH CHECK 오류

**보고서 원문 (6.3절)**:
```sql
USING (
    EXISTS(... facilities ...) OR EXISTS(... super_admin ...)  -- 관리자만
)
WITH CHECK (
    user_id = (auth.jwt() ->> 'sub') OR ...  -- 사용자 포함
)
```

**문제**: PostgreSQL RLS에서 USING이 먼저 평가됩니다. USING에 사용자 본인이 없으면 해당 행을 아예 "볼 수 없어" UPDATE 자체가 불가합니다. WITH CHECK는 이후에 평가되므로 도달하지 않습니다.

**영향받는 코드**:
- `updateConsultationStatus()` (queries.ts:1762) — 상담 상태 변경
- `answerConsultation()` (queries.ts:1789) — 관리자 답변
- `markConsultationAsRead()` (queries.ts:1817) — 읽음 처리

**수정안**:
```sql
CREATE POLICY "consultations_update" ON public.consultations
    FOR UPDATE TO authenticated
    USING (
        user_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
            SELECT 1 FROM public.facilities
            WHERE facilities.id::text = consultations.facility_id::text
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE clerk_id = (auth.jwt() ->> 'sub')
            AND role = 'super_admin'
        )
    )
    WITH CHECK (
        user_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
            SELECT 1 FROM public.facilities
            WHERE facilities.id::text = consultations.facility_id::text
            AND facilities.user_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE clerk_id = (auth.jwt() ->> 'sub')
            AND role = 'super_admin'
        )
    );
```

---

## 2. ⚠️ INSERT 정책 — 레거시 함수 영향

**보고서 제안**: `WITH CHECK (user_id = (auth.jwt() ->> 'sub'))`

**코드 대조 결과**:

| 함수 | 클라이언트 | 정책 호환 |
|------|-----------|----------|
| FuneralSearchForm INSERT | `createAuthenticatedClient(token)` | ✅ JWT 있음 |
| MemorialSearchForm INSERT | `createAuthenticatedClient(token)` | ✅ JWT 있음 |
| PetSearchForm INSERT | `createAuthenticatedClient(token)` | ✅ JWT 있음 |
| `createConsultation()` (queries.ts:462) | singleton `supabase` | ⚠️ `setSupabaseAuth` 의존 |
| `createFuneralConsultation()` (queries.ts:1635) | singleton `supabase` | ⚠️ `setSupabaseAuth` 의존 |

**위험**: `createConsultation()`과 `createFuneralConsultation()`은 singleton `supabase` 클라이언트를 사용합니다. `useAuthSync`가 `setSupabaseAuth(token)`을 호출한 후에만 동작하며, 토큰 만료 시 실패할 수 있습니다.

**권장**: 이 레거시 함수들이 현재 사용되고 있는지 확인 후, 사용 중이면 `createAuthenticatedClient`로 마이그레이션.

---

## 3. ✅ SELECT 정책 — 정확

**보고서 제안**: `user_id = (auth.jwt() ->> 'sub')` + 시설관리자 + 슈퍼관리자

**코드 대조**:
- `getConsultationsByUser(userId)` → `.eq('user_id', userId)` → userId = Clerk ID ✅
- `getConsultationsByFacility(facilityId)` → `.eq('facility_id', facilityId)` → 시설관리자 정책 커버 ✅
- `facilities.user_id` 컬럼 = Clerk ID (queries.ts:1041 확인) ✅
- `profiles.clerk_id` 컬럼 존재 (useAuthSync.ts:87 확인) ✅

**단, MyConsultations의 SELECT가 동작하려면**: singleton `supabase`에 JWT가 설정되어 있어야 합니다 (`useAuthSync` → `setSupabaseAuth` 의존).

---

## 4. ⚠️ 타입 변환 리스크

보고서의 `ALTER COLUMN user_id TYPE TEXT` 실행 전 확인 필요:

```sql
-- 반드시 먼저 실행하여 기존 데이터 형식 확인
SELECT user_id, facility_id, id FROM consultations ORDER BY created_at DESC LIMIT 5;
```

| 시나리오 | 결과 |
|---------|------|
| user_id가 이미 Clerk ID (text) | ✅ 변환 안전 |
| user_id가 UUID 형식 | ❌ RLS 매칭 불가, 기존 데이터 고아화 |
| user_id가 혼재 (UUID + Clerk ID) | ❌ 부분 고아화 |

---

## 5. 최종 권장 실행 순서

```
1단계: SELECT user_id, facility_id FROM consultations LIMIT 5;  ← 데이터 확인
2단계: 데이터 형식에 따라 마이그레이션 전략 결정
3단계: 보고서 통합 SQL 실행 (UPDATE 정책 수정본 적용)
4단계: 검증 체크리스트 실행
```

---

**결론**: 보고서는 전반적으로 올바른 방향이나, **UPDATE 정책 USING 오류**는 반드시 수정해야 하고, **기존 데이터 형식 확인** 후에만 실행해야 합니다. 위 수정안 반영 후 적용을 권장합니다.
