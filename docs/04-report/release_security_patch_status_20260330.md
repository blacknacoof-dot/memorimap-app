# Release Security Patch Status

작성일: 2026-03-30

## 목적

출시 직전 보안 하드닝과 운영 반영 상태를 코드 기준으로 정리한다.
이 문서는 출시 차단 이슈 반영 여부, 남은 운영 확인 항목, 재검증 명령을 한 곳에 모은다.

## 이번 문서 기준 변경 범위

- `lib/security/fileValidation.ts`
- `lib/security/sqlSanitize.ts`
- `lib/validation/commonSchema.ts`
- `lib/validation/reviewSchema.ts`
- `lib/validation/facilitySchema.ts`
- `lib/queries.ts`
- `lib/admin.ts`
- `components/ReviewForm.tsx`
- `components/FacilityEditModal.tsx`
- `components/Partner/sections/ImageManager.tsx`
- `components/PartnerInquiryView.tsx`
- `components/SuperAdmin/PartnerAdmissions.tsx`
- `src/pages/ExternalBrowserGuidePage.tsx`
- `src/utils/browserDetection.ts`
- `supabase/functions/deploy-bot-data/index.ts`
- `supabase/functions/deploy-bot-data/facilityId.ts`
- `supabase/functions/send-monthly-report/core.ts`
- `supabase/migrations/20260330_secure_partner_docs.sql`
- `supabase/migrations/20260330123000_upload_policy_hardening.sql`
- `tests/e2e/report.smoke.spec.ts`
- `tests/e2e/security.xss.spec.ts`
- `vercel.json`
- `public/404.html`

## 반영된 보안 수정

### P0. 업로드 검증 추가

적용 상태: 완료

- 공통 검증 유틸을 `lib/security/fileValidation.ts`로 통합했다.
- 이미지 업로드는 `image/jpeg`, `image/png`, `image/webp`만 허용한다.
- 제휴 문서는 `application/pdf`만 허용한다.
- MIME, 확장자, 파일 시그니처, 크기 제한을 모두 검증한다.
- 저장 경로는 원본 파일명을 그대로 신뢰하지 않고 안전한 파일명으로 생성한다.

적용 위치:

- `uploadReviewImage()` in `lib/queries.ts`
- `uploadFacilityImage()` in `lib/queries.ts`
- `submitPartnerApplication()` in `lib/queries.ts`
- `components/Partner/sections/ImageManager.tsx`
- `components/PartnerInquiryView.tsx`
- `components/FacilityEditModal.tsx`

스토리지 정책:

- `partner_docs`는 `licenses/<user-id>/...` 경로만 허용
- `facility-images`는 이미지 확장자만 허용
- `reviews`는 `review-images/<user-id>/...` 경로와 이미지 확장자만 허용

### P0. 운영 CSP에서 `unsafe-eval` 제거

적용 상태: 완료

- `vercel.json`의 `script-src`에서 `unsafe-eval`을 제거했다.
- 운영 배포 응답 헤더 기준으로 `unsafe-eval` 미포함을 확인했다.

### P0. `partner_docs` 권한 모델 정렬

적용 상태: 완료

- `partner_docs` 버킷을 private로 전환했다.
- 새 업로드는 공개 URL 대신 스토리지 경로만 저장한다.
- 관리자 열람은 signed URL 발급 방식으로 전환했다.
- 기존 공개 URL 데이터는 `normalizePartnerDocPath()`로 하위호환 처리한다.

현재 코드 기준 판단:

- 제휴 신청은 로그인 사용자 기준 흐름으로 정렬되어 있다.
- 따라서 `partner_docs` INSERT를 authenticated로 제한한 현재 정책은 코드와 맞는다.
- 이 정책이 제품 의도와도 일치하는지는 운영 측 최종 확인이 필요하다.

### P1. `deploy-bot-data` 권한 및 계약 정합성 보강

적용 상태: 완료

- `facility_id`를 함수 입구에서 명시적으로 파싱한다.
- 숫자 문자열은 legacy facility ID, UUID 문자열은 sangjo facility ID로 구분한다.
- 일반 시설 UUID는 허용하지 않는다.
- 잘못된 입력은 400, 존재하지 않는 식별자는 404로 차단한다.
- 비슈퍼관리자는 소유 시설만 `update_timestamp` 가능하다.
- `regenerate_all`은 `super_admin`만 가능하다.

관련 구현:

- `supabase/functions/deploy-bot-data/facilityId.ts`
- `supabase/functions/deploy-bot-data/index.ts`

### P1. `send-monthly-report` cron 전용 제한

적용 상태: 완료

- `x-vercel-cron: 1` 헤더가 없는 호출은 403으로 차단한다.
- 기존 service-role key 검증은 유지한다.
- 따라서 cron 헤더와 내부 키가 모두 맞아야 실행 경로로 진입한다.

관련 구현:

- `supabase/functions/send-monthly-report/core.ts`
- `tests/e2e/report.smoke.spec.ts`

### P1. 입력 검증 공통화 및 redirect 경계 강화

적용 상태: 완료

- 리뷰, 시설 수정 입력 검증을 Zod 공용 스키마로 분리했다.
- 서버 경계인 `lib/queries.ts`에서 리뷰 본문과 시설 `name`, `description`, `website`를 재검증한다.
- validation 실패 시 민감정보 없이 구조화 로그를 남긴다.
- 검색 정규화는 allowlist 기반으로 강화했고 `.or()` 문자열 조합도 검증한다.
- 외부 브라우저 안내 페이지의 redirect는 동일 origin만 허용한다.
- 외부 URL, `javascript:`, protocol-relative URL은 차단한다.

관련 구현:

- `lib/validation/commonSchema.ts`
- `lib/validation/reviewSchema.ts`
- `lib/validation/facilitySchema.ts`
- `lib/queries.ts`
- `lib/admin.ts`
- `lib/security/sqlSanitize.ts`
- `src/pages/ExternalBrowserGuidePage.tsx`
- `src/utils/browserDetection.ts`

### P2. 운영 품질 및 하위호환 보완

적용 상태: 완료

- `PartnerAdmissions.tsx` 한글 깨짐을 복구했다.
- 기존 public URL, signed URL, `partner_docs/...`, `licenses/...`를 모두 정규화한다.
- `public/ai-test.html`은 운영 배포에서 제외하고 `/ai-test.html`은 404로 처리한다.

## 검증 명령

### 타입 및 빌드

```bash
npm run typecheck
npm run build
```

### 단위 테스트

```bash
npx vitest run lib/security/fileValidation.test.ts
npx vitest run lib/security/sqlSanitize.test.ts lib/validation/reviewSchema.test.ts lib/validation/facilitySchema.test.ts src/utils/browserDetection.test.ts
npx vitest run supabase/functions/deploy-bot-data/facilityId.test.ts components/SuperAdmin/PartnerAdmissions.test.ts
```

### E2E 테스트

```bash
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.dataIsolation.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/report.smoke.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/security.xss.spec.ts --reporter=line --workers=1
```

## 현재 판정

판정: 조건부 출시 가능

근거:

- 기존 출시 차단 항목으로 분류된 업로드 검증, `partner_docs` 비공개 모델, 운영 CSP `unsafe-eval`, `deploy-bot-data` 소유권 정합성 보강이 코드에 반영됐다.
- 입력 검증 공통화, redirect 차단, XSS 회귀 테스트가 추가됐다.
- `send-monthly-report`는 cron 전용 헤더와 service-role key를 함께 요구하도록 보강됐다.
- Supabase SQL 2건 적용과 `deploy-bot-data` Edge Function 재배포가 완료됐다.
- Vercel 프로덕션 재배포 후 운영 도메인 `https://memorimap.kr/ai-test.html`가 `404 Not Found`로 확인됐다.

단, 아래 운영 확인이 끝나야 최종 승인으로 간주한다.

## 운영 반영 완료 사항

### Supabase

- `20260330_secure_partner_docs.sql` 적용 완료
- `20260330123000_upload_policy_hardening.sql` 적용 완료
- `deploy-bot-data` Edge Function 재배포 완료

### Vercel

- 프로덕션 재배포 완료
- 운영 CSP에서 `unsafe-eval` 제거 확인 완료
- `https://memorimap.kr/ai-test.html` → `404 Not Found` 확인 완료

## 배포 전 운영 확인 항목

### Supabase

1. `partner_docs` 버킷이 실제로 `public = false`인지 Dashboard에서 재확인
2. `send-monthly-report`가 cron 헤더 없이 직접 호출되면 403인지 확인

### Vercel

1. 최신 `vercel.json`이 실제 응답 헤더에 반영되었는지 확인
2. `external-browser-guide`가 외부 redirect를 동일 origin으로 강제하는지 확인

### 기능/권한

1. 일반 사용자가 `partner_docs` 직접 URL로 문서를 열 수 없는지 확인
2. super admin 관리자 화면에서 사업자등록증 signed URL이 정상 발급되는지 확인
3. 타 시설 `facility_id`로 `deploy-bot-data` 호출 시 403인지 확인
4. 허용하지 않은 MIME, 확장자, 크기 초과 업로드가 실제로 차단되는지 확인
5. 리뷰 본문 10자 미만, 1000자 초과 입력이 서버에서 거부되는지 확인

## 남은 리스크

- `partner_docs`를 로그인 신청 기준으로 유지하는 정책이 제품 의사결정과 일치하는지 최종 확인이 필요하다.
- `unsafe-inline`은 아직 남아 있으므로 CSP 강화는 다음 단계 과제다.
- 입력 검증은 핵심 경계부터 공통화했지만 모든 폼 필드 전체로 확장되지는 않았다.

## 재검증 완료 기준

- `npm run typecheck` 통과
- 관련 vitest 통과
- 관련 Playwright 통과
- Supabase 마이그레이션 적용 확인 완료
- Edge Function 재배포 확인 완료
- 운영 URL 기준 `ai-test.html` 404 확인 완료
- 운영 응답 헤더 기준 `unsafe-eval` 미포함 확인 완료
