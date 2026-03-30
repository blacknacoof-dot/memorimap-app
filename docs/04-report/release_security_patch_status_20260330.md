# Release Security Patch Status

작성일: 2026-03-30

## 목적

2026-03-30 기준 출시 전 보안 수정 상태를 코드 기준으로 정리한다.
이 문서는 출시 차단 이슈의 반영 여부, 남은 운영 확인 항목, 재검증 명령을 한 곳에 모으는 용도다.

## 이번 문서가 기준으로 삼는 변경 범위

- `lib/security/fileValidation.ts`
- `lib/queries.ts`
- `components/Partner/sections/ImageManager.tsx`
- `components/PartnerInquiryView.tsx`
- `components/FacilityEditModal.tsx`
- `components/SuperAdmin/PartnerAdmissions.tsx`
- `supabase/functions/deploy-bot-data/index.ts`
- `supabase/functions/deploy-bot-data/facilityId.ts`
- `supabase/migrations/20260330_secure_partner_docs.sql`
- `supabase/migrations/20260330123000_upload_policy_hardening.sql`
- `vercel.json`
- `.vercelignore`

## 반영된 보안 수정

### P0. 업로드 검증 추가

적용 상태: 완료

- 공용 검증 유틸을 `lib/security/fileValidation.ts`로 통합했다.
- 이미지 업로드는 `image/jpeg`, `image/png`, `image/webp`만 허용한다.
- 제휴 문서는 `application/pdf`와 제한된 이미지 형식만 허용한다.
- MIME, 확장자, 파일 시그니처, 크기 제한을 함께 검사한다.
- 저장 경로는 원본 파일명을 그대로 신뢰하지 않고 안전한 이름으로 생성한다.

적용 위치:

- `uploadReviewImage()` in `lib/queries.ts`
- `uploadFacilityImage()` in `lib/queries.ts`
- `submitPartnerApplication()` in `lib/queries.ts`
- `components/Partner/sections/ImageManager.tsx`
- `components/PartnerInquiryView.tsx`
- `components/FacilityEditModal.tsx`

스토리지 정책:

- `partner_docs`는 `licenses/<user-id>/...` 구조만 허용
- `facility-images`는 이미지 확장자만 허용
- `reviews`는 `review-images/<user-id>/...` 구조와 이미지 확장자만 허용

### P0. 운영 CSP에서 `unsafe-eval` 제거

적용 상태: 완료

- `vercel.json`의 `script-src`에서 `unsafe-eval`을 제거했다.
- 현재 변경은 운영 CSP 범위를 줄이는 목적이며, `unsafe-inline`은 별도 정리 대상이다.

### P0. `partner_docs` 권한 모델 정렬

적용 상태: 완료

- `partner_docs` 버킷은 private 유지다.
- 새 업로드는 공개 URL이 아니라 스토리지 경로만 저장한다.
- 관리자 열람은 signed URL 방식으로 전환했다.
- 기존 공개 URL 데이터는 `normalizePartnerDocPath()`에서 하위호환 처리한다.

현재 제품 코드 기준 판단:

- 제휴 신청은 로그인 사용자 기준 플로우다.
- 따라서 `partner_docs` INSERT를 authenticated로 제한한 현재 정책은 코드 흐름과 맞는다.
- 이 전제가 제품 의사결정으로 유지되는지는 배포 전 최종 확인이 필요하다.

### P1. `deploy-bot-data` 권한 정합성 보강

적용 상태: 완료

- `facility_id`를 진입점에서 명시적으로 파싱한다.
- 숫자형은 legacy facility ID, UUID 문자열은 sangjo facility ID로 구분한다.
- 잘못된 입력은 400으로 거부한다.
- 존재하지 않는 `facility_id`는 404로 거부한다.
- 비슈퍼관리자는 소유권이 확인된 facility만 `update_timestamp` 가능하다.
- `regenerate_all`은 `super_admin`만 가능하다.

관련 구현:

- `supabase/functions/deploy-bot-data/facilityId.ts`
- `supabase/functions/deploy-bot-data/index.ts`

### P2. 운영 품질 및 하위호환 보완

적용 상태: 완료

- `PartnerAdmissions.tsx`의 한글 깨짐 문자열을 복구했다.
- 기존 public URL, signed URL, `partner_docs/...`, `licenses/...` 입력을 모두 정규화한다.
- `public/ai-test.html`은 삭제하지 않고 `.vercelignore`로 운영 배포에서 제외했다.

## 검증 명령

### 타입 및 빌드

```bash
npm run typecheck
npm run build
```

### 단위 테스트

```bash
npx vitest run lib/security/fileValidation.test.ts
npx vitest run supabase/functions/deploy-bot-data/facilityId.test.ts components/SuperAdmin/PartnerAdmissions.test.ts
```

## 현재 판정

판정: 조건부 출시 가능

근거:

- 기존 출시 차단 항목으로 분류된 업로드 검증, `partner_docs` 비공개 모델, 운영 CSP `unsafe-eval`, `deploy-bot-data` 소유권 정합성 보강이 코드에 반영됐다.
- 타입체크와 관련 단위 테스트가 통과한 상태를 기준으로 판단한다.

단, 아래 운영 확인이 끝나야 최종 승인으로 간주한다.

## 배포 전 운영 확인 항목

### Supabase

1. `20260330_secure_partner_docs.sql` 적용 여부 확인
2. `20260330123000_upload_policy_hardening.sql` 적용 여부 확인
3. `deploy-bot-data` Edge Function 재배포 여부 확인
4. `partner_docs` 버킷이 실제로 `public = false`인지 Dashboard에서 재확인

### Vercel

1. 최신 `vercel.json`이 실제 응답 헤더에 반영되었는지 확인
2. `unsafe-eval`이 응답 CSP에 남아 있지 않은지 확인
3. `public/ai-test.html`이 운영 URL에서 404 또는 비배포 상태인지 확인

### 기능/권한

1. 일반 사용자가 `partner_docs` 직접 URL로 문서를 열 수 없는지 확인
2. super admin이 관리자 화면에서 사업자등록증 signed URL을 정상 발급받는지 확인
3. 타 시설 `facility_id`로 `deploy-bot-data` 호출 시 403이 나는지 확인
4. 허용되지 않은 MIME, 확장자, 크기 초과 업로드가 실제로 차단되는지 확인

## 남은 리스크

- `partner_docs`를 로그인 신청 기준으로 유지할지에 대한 제품 측 최종 확정이 필요하다.
- `ai-test.html`은 소스 트리에는 남아 있으므로, 실제 배포 제외가 동작하는지 운영 URL에서 확인해야 한다.
- `unsafe-inline`은 아직 남아 있으므로 CSP 강화의 다음 단계로 별도 관리가 필요하다.

## 재검증 완료 기준

- `npm run typecheck` 통과
- 관련 vitest 통과
- Supabase 마이그레이션 적용 확인
- Edge Function 재배포 확인
- 운영 URL 기준 `ai-test.html` 접근 불가 확인
- 운영 응답 헤더 기준 `unsafe-eval` 미포함 확인
