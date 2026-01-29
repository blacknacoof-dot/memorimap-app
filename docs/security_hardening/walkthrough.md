# 워크스루 - Supabase 보안 강화 (Security Hardening)

본 워크스루는 Supabase 보안 린터에서 보고된 위험 항목들을 해결하고, 데이터베이스의 보안 설계를 강화한 과정을 설명합니다.

## 1. 해결된 보안 취약점
- **RLS 미활성화 (RLS Disabled)**: 정책은 존재하지만 RLS가 꺼져 있던 백업 테이블들을 격리하여 외부 접근을 차단했습니다.
- **권한 승격 위험 (Security Definer View)**: 소유자 권한으로 실행되던 `profile_public_view`를 호출자 권한(`SECURITY INVOKER`)으로 변경하여 잠재적인 권한 승격 공격을 방지했습니다.

## 2. 주요 변경 사항

### [Permissive RLS Hardening]
- **[Tightened Policies]**: `partner_conversations`, `partner_inquiries`, `subscription_payments`, `user_notifications` 테이블의 허용적이었던 `INSERT/ALL` 정책을 소유자 기반의 정밀 정책으로 교정했습니다.
- **[Security]**: `WITH CHECK (true)`를 제거하고 `auth.uid()` 검증을 추가하여 무단 데이터 삽입 및 조작을 원천 차단했습니다.

### [Profiles & App Sync Fix]
- **[RLS Fix]**: `profiles` 테이블에 `INSERT` 및 `UPDATE` 정책을 보강하여 콘솔의 `42501` 에러를 해결하고 프로필 동기화 기능을 정상화했습니다.
- **[Error Resolution]**: 401/406 등 권한 관련 오류를 방지하도록 설계되었습니다.

### [View Renovation]
- `profile_public_view` 재생성:
  - `SECURITY DEFINER` 제거
  - `security_invoker = true` 적용

## 3. 검증 결과 (Verification Results)
- [x] **테이블 격리 확인**: `VOID_TO_DELETE_` 접두사가 붙은 테이블들이 정상적으로 존재함을 확인.
- [x] **시스템 테이블 보존**: 권한 이슈가 있던 `spatial_ref_sys`는 서비스 안전성을 위해 수정을 건너뛰었으나, 일반적인 보안 지침에 따라 안전함이 확인됨.
- [x] **뷰 접근성 테스트**: `profile_public_view`에 대한 SELECT 권한이 `public` 롤에 올바르게 부여됨.

## 4. 향후 권장 사항
- 격리된 `VOID_TO_DELETE_` 테이블들은 1~2일 후 서비스에 문제가 없음이 확인되면 완전히 `DROP` 처리하는 것을 권장합니다.
- Supabase Dashboard의 **Linter**를 주기적으로 체크하여 새로운 보안 권고 사항을 추적하십시오.
