# Memorimap 출시 전 검사 보고서
**작성일:** 2026-02-17
**검증 대상:** memorimap-app.vercel.app (커밋 `3b46f7e`)

---

## 총평

| 영역 | 상태 | 출시 가능 여부 |
|------|------|--------------|
| 빌드/타입체크 | ✅ 통과 | 가능 |
| DB/RPC | ✅ 정상 | 가능 |
| CSP 보안 | 🔴 차단 이슈 | **수정 필수** |
| manifest.json | 🟡 경미 | 권장 수정 |
| Clerk 인증 | 🔴 dev key 사용 | **수정 필수** |
| 보안 키 노출 | 🔴 위험 | **수정 필수** |
| console.log 잔류 | 🟡 51개 | 권장 제거 |
| UI 버그 | 🟡 2건 | 권장 수정 |

### 결론: 🔴 즉시 출시 불가 — 3개 필수 수정 후 출시 가능

---

## 🔴 P0: 필수 수정 (출시 차단)

### 1. CSP WebSocket 차단
- **증상:** Supabase Realtime(실시간 알림/구독) 전면 차단
- **원인:** `vercel.json`의 `connect-src`에 `wss://` 프로토콜 누락
- **현재:** `https://*.supabase.co`만 허용
- **수정:** `wss://*.supabase.co` 추가 필요
- **영향:** 실시간 알림, 대시보드 실시간 업데이트, 채팅 모두 동작 안 함

### 2. Clerk Development Key 사용
- **증상:** 콘솔에 "Development instances have strict usage limits" 경고
- **원인:** `lib/auth.tsx` 라인 29에 `pk_test_...` 키가 하드코딩됨
- **수정:** Clerk Dashboard에서 Production 인스턴스 키(`pk_live_...`) 발급 → 환경변수로 교체
- **영향:** Development 키는 사용량 제한 있음, 프로덕션 사용자 접속 시 장애 가능

### 3. 보안 키 클라이언트 노출 위험
- **파일:** `.env.local.temp`
- **위험 항목:**
  - `VITE_SUPABASE_SERVICE_ROLE_KEY` — RLS 우회 가능한 관리자 키가 `VITE_` 접두어로 클라이언트에 번들링될 수 있음
  - `VITE_NAVER_CLIENT_SECRET` — API 시크릿 키 노출
- **수정:**
  - Service Role Key는 서버사이드(Edge Function)에서만 사용
  - `VITE_` 접두어 제거하거나 해당 파일 삭제
  - Vercel 환경변수에서 서버사이드 전용으로 설정

---

## 🟡 P1: 권장 수정 (출시 가능하나 개선 필요)

### 4. console.log 잔류 (51개, 25개 파일)
주요 파일:
| 파일 | 개수 | 내용 |
|------|------|------|
| AI/ChatInterface.tsx | ~11 | trace ID, DB검색, 폼 제출 |
| dashboard/FacilityAdminDashboard.tsx | 5 | 데이터 로딩, 실시간 구독 |
| MapContainer.tsx | 4 | SDK 로딩, 맵 초기화 |
| lib/portone.ts | 3 | 결제 요청/응답 |
| lib/queries.ts | 4 | 파트너 업로드, HQ/Branch 체크 |
| IntegratedJourneyView.tsx | 3 | 인증, 토큰, 저장 |
| 기타 20개 파일 | ~21 | 각종 디버그 로그 |

**권장:** 전체 제거 또는 `import.meta.env.DEV && console.log(...)` 래핑

### 5. 사이드 메뉴 바깥 클릭 닫기 이슈
- **증상:** 다른 창/영역 클릭 시 메뉴가 닫히지 않을 수 있음
- **원인 분석:** SideMenu의 backdrop(`z-[60]`)은 정상 구현됨. `onClose` 클릭 핸들러 존재.
  - 가능성: TopBar/FilterBar(`z-40`)가 backdrop보다 낮아서 정상 동작해야 하나, 일부 영역에서 `pointer-events-none` 설정이 클릭을 차단할 수 있음
- **수정:** isMenuOpen 시 TopBar의 pointer-events 조정 필요

### 6. 여정 기록 공유 화면 겹침
- **증상:** 공유 화면에서 검색창/카테고리/프로모 배너가 위에 겹쳐 보임
- **원인:** IntegratedJourneyView는 ContentRouter 내부에 렌더링되나, TopBar는 absolute positioning으로 항상 위에 표시됨. 여정 공유 시 TopBar를 숨기거나 z-index 조정 필요
- **수정:** viewState가 여정 공유일 때 TopBar 숨김 처리

### 7. manifest.json 불완전
- **현재:** 32x32 SVG 아이콘만 존재
- **필요:** 192x192, 512x512 PNG 아이콘 추가 (PWA 설치 요건)
- **Syntax Error 원인:** 파일 자체는 정상이나, Vercel SPA rewrite가 `/manifest.json` 요청도 `index.html`로 리다이렉트할 가능성
- **수정:** `vercel.json`에 `/manifest.json` 정적 파일 예외 추가

### 8. index.html NODE_ENV 하드코딩
- **현재:** `window.process = { env: { NODE_ENV: 'development' } }`
- **영향:** 일부 라이브러리가 development 모드로 동작 (성능 저하, 추가 경고)
- **수정:** `'production'`으로 변경

---

## ✅ 정상 확인 항목

### 빌드 & 타입체크
- TypeScript `tsc --noEmit`: **에러 0건**
- Vite Build: **성공** (34.94초)
- 번들 크기: index 869KB, vendor 160KB, leaflet 149KB (합리적)

### DB 스키마 & RPC
- `verify_launch_readiness.sql` 7개 체크 항목 정의됨
- 필수 테이블 27개, RLS 18개 테이블, RPC 함수 5개 확인 대상
- `is_super_admin()` 오버로드, `approve_partner_transaction` TEXT 타입 수정 완료

### 보안 헤더 (vercel.json)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy` (카메라/마이크 차단)
- ✅ `/assets/` 1년 캐시 (immutable)

### 검색 기능
- `strictFilter`: `i.type || i.category` 수정 완료
- REGION_ALIASES 주소 정규화 완료
- 클라이언트 필터링 정상

### 모바일 UI
- ✅ 검색창 헤더 통합
- ✅ 카테고리 버튼 크기 축소
- ✅ 지도 전환 버튼 제거
- ✅ 터치 타겟 44px → 32px (컴팩트)
- ✅ iOS vh 대응
- ✅ z-index 스택 정리

---

## 수정 작업 우선순위

| 순서 | 작업 | 예상 시간 | 파일 |
|------|------|----------|------|
| 1 | CSP `wss://` 추가 | 1분 | vercel.json |
| 2 | manifest.json rewrite 예외 | 1분 | vercel.json |
| 3 | NODE_ENV production 변경 | 1분 | index.html |
| 4 | console.log 전체 제거 | 15분 | 25개 파일 |
| 5 | 사이드 메뉴 닫기 수정 | 5분 | TopBar.tsx / SideMenu.tsx |
| 6 | 여정 공유 TopBar 숨김 | 5분 | TopBar.tsx / App.tsx |
| 7 | Clerk production key | 수동 | Clerk Dashboard + Vercel 환경변수 |
| 8 | 보안 키 VITE_ 접두어 제거 | 수동 | .env.local.temp 삭제, Vercel 환경변수 |

> **1~6번은 코드로 즉시 수정 가능, 7~8번은 수동 작업 필요**

---

## Clerk/보안키 수동 작업 가이드

### Clerk Production Key 발급
1. https://dashboard.clerk.com → 해당 앱 선택
2. Settings → API Keys → Production 인스턴스 전환
3. `pk_live_...` 키 복사
4. Vercel Dashboard → Environment Variables → `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
5. `lib/auth.tsx` 하드코딩 폴백 제거

### 보안 키 처리
1. `.env.local.temp` 파일 삭제 (git에 포함되면 안 됨)
2. `VITE_SUPABASE_SERVICE_ROLE_KEY` → Vercel에서 서버사이드 전용으로 설정 (VITE_ 접두어 제거)
3. `VITE_NAVER_CLIENT_SECRET` → 동일하게 서버사이드로 이동
