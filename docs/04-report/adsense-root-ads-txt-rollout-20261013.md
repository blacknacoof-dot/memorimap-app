# memorimap.kr ads.txt 최소 수정 — 2026-10-13

## 범위 및 보호 조건
- 신규 공개 텍스트 파일 `public/ads.txt` 및 독립 검증 테스트/CI만 추가한다.
- 기존 `vercel.json`, React 앱, Supabase DB·RLS·Storage·Edge Functions, 결제, 로그인, 지도, DNS, 계산해줘는 수정하지 않는다.
- `main` 병합 및 Production 배포는 별도 사용자 승인 전 금지한다.
- AdSense 심사 진행 중인 기존 신청은 변경하거나 재제출하지 않는다.
- 게시자 ID `pub-4865485908744524`는 계산해줘 AdSense 계정 확인 메타 태그와 일치해야 한다. Production 적용 전 AdSense 계정에서 확인한다.
- 루트 ads.txt가 다른 서비스에 의해 관리되고 있는지 확인하고 기존 판매자 행이 존재한다면 덮어쓰지 않고 병합한다.

## 배포 전 기본 검증
1. GitHub 기준 `main` 커밋과 새로운 파일만 변경됐는지 확인한다.
2. `npx vitest run tests/security/adsTxtContracts.spec.ts tests/security/releaseConfig.spec.ts`
3. `npm run build`
4. 빌드 결과 `dist/ads.txt`가 정확한 텍스트 한 줄이며 HTML이 아닌지 확인한다.
5. `vercel.json`의 `handle: filesystem` 규칙이 최종 SPA 폴백보다 앞서는지 확인한다.
6. 기존 GitHub Actions가 PR에서 Cypress를 실행한다는 점을 고려하여 테스트 실패가 기존 이슈인지 신규 변경 영향인지 분리한다.

## Vercel Preview 검증
- 추모맵 운영 Vercel 프로젝트를 확인하고 PR의 Preview 호스트가 올바른 프로젝트/커밋에 배포됐는지 검증한다.
- `curl -i https://<verified-preview-host>/ads.txt` 가 200이고 콘텐츠 유형이 일반 텍스트인지 확인한다.
- 반환 본문에는 승인된 판매자 한 줄만 있어야 하며 SPA HTML/리다이렉션/인증 안내로 대체되면 실패한다.
- `/robots.txt`, `/privacy/`, `/app/`, `/account-deletion/`, 지도·로그인·결제·관리자 동작의 기존 상태를 유지한다.

## Production 승인 및 롤백
- Preview와 기본 서비스 회귀 검증 후 사용자에게 별도 병합/배포 승인을 받는다.
- Production 배포 전 직전 정상 배포 ID와 라우팅/도메인 연결을 보존한다.
- `https://memorimap.kr/ads.txt`의 HTTP 200/텍스트 응답을 확인한다.
- 문제가 발생하면 기록한 이전 Vercel 정상 배포로 롤백한다. DB/DNS 변경이 없어야 한다.
- 광고 승인 여부는 보장하지 않는다. 추모맵 공개 HTML·시설별 canonical 문제는 별도 PR로 다룬다.
