# 구현 계획: 카카오톡 인앱 브라우저 및 IOS 대응 (In-App Browser Support)

> **날짜**: 2026-02-02
> **기능**: 인앱 브라우저 감지, 외부 브라우저 이탈 유도, iOS Safe Area 대응
> **상태**: 📝 계획 수립 (Planning)

## 목표
카카오톡, 네이버 등 인앱 브라우저에서 발생하는 **Google OAuth 403 오류("disallowed_useragent")**와 **레이아웃 깨짐(Viewport 이슈)**을 해결합니다.

## 문제 분석
1.  **Google OAuth 차단**: 인앱 브라우저는 '보안 브라우저' 정책 위반으로 간주되어 구글 로그인이 불가능합니다.
2.  **레이아웃 침범**: 상단 바/하단 바가 Viewport를 가리거나, 스크롤 시 화면이 튀는 현상이 발생합니다.

## 해결 전략 (PDCA)

### 1단계: 감지 및 이탈 (Detection & Redirect)
- [ ] **`src/utils/browserDetection.ts`**: User-Agent를 분석하여 인앱 브라우저 여부를 판단하는 유틸리티 구현.
    - Android: `intent://` 스킴을 사용하여 Chrome 강제 실행 시도.
    - iOS: `window.location.href`로 Safari 이동 유도 (또는 안내 페이지 표시).
- [ ] **`src/pages/ExternalBrowserGuidePage.tsx`**: 자동 이탈이 실패하거나 iOS 정책상 불가능할 경우 보여줄 "외부 브라우저 이용 안내" 페이지 구현.
- [ ] **`App.tsx`**: 앱 진입 시 감지 로직 실행 및 라우팅 추가.

### 2단계: UI/UX 최적화 (Viewport & Safe Area)
- [ ] **Viewport Meta Tag**: `viewport-fit=cover` 및 `maximum-scale=1.0` 설정으로 확대 방지 및 전체 화면 사용.
- [ ] **CSS Safe Area**: `env(safe-area-inset-*)` 변수를 활용하여 노치(Notch) 및 홈바(Home Indicator) 영역 확보.
    - `index.css` 전역 스타일 업데이트.

### 3단계: 인증 대안 (Auth Fallback) - *Optional*
- [ ] **Email Magic Link**: 구글 로그인이 안 될 경우를 대비해, 비밀번호 없는 이메일 링크 로그인 지원 (안내 페이지에서 제안).
- [ ] **Auth Callback**: 매직 링크 로그인 처리를 위한 라우트 추가.

## 상세 변경 목록

### [NEW] 유틸리티
- `src/utils/browserDetection.ts`: `isInAppBrowser()`, `getInAppBrowserName()`, `redirectToExternalBrowserIfNeeded()`

### [NEW] 페이지/컴포넌트
- `src/pages/ExternalBrowserGuidePage.tsx`: 브라우저별(카톡/네이버/인스타) 이탈 가이드 UI
- `src/pages/AuthCallbackPage.tsx`: (옵션) 매직 링크 콜백 처리

### [MODIFY] 핵심 설정
- `index.html`: `<meta name="viewport" ...>` 수정
- `src/index.css`: `:root` 변수 및 Safe Area Padding 추가
- `src/App.tsx`: 라우트 추가 및 `useEffect` 훅에 감지 로직 삽입

## 검증 계획
1.  **카카오톡 테스트**: 카카오톡 채팅방에 링크 전송 후 클릭 -> 안내 페이지 이동 또는 외부 브라우저 실행 확인.
2.  **로그인 테스트**: 외부 브라우저(Chrome/Safari)로 열린 후 Google 로그인 정상 작동 확인.
3.  **레이아웃 확인**: iPhone (노치 있는 기종)에서 상/하단 잘림 없는지 확인.
