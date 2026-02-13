# 카카오톡 공유 링크 인앱 브라우저 차단 문제

## 현상
카카오톡에서 추모맵 공유 링크를 열면 **공유 내용 대신 "외부 브라우저에서 열어주세요" 안내 페이지**가 표시됨.

## 원인
`App.tsx:199-201`에서 인앱 브라우저를 무조건 차단:

```tsx
const isInApp = isInAppBrowser();
const isGuidePage = window.location.hash.includes('external-browser-guide');
if (isInApp && !isGuidePage) return <ExternalBrowserGuidePage />;
```

- `/share/:token` 경로가 예외 처리되지 않아 인앱 가드에 걸림
- 공유 페이지는 Clerk 로그인이 필요 없는데도 차단당함 (비밀번호 입력 → Supabase RPC 조회만 수행)

## 영향 범위
| 공유 경로 | 형식 | 차단 여부 |
|-----------|------|----------|
| 여정 공유 | `/#/share/:token` | 차단됨 |
| 시설 공유 | `navigator.share(window.location.href)` | 차단됨 |

## 수정 방안

### App.tsx 인앱 가드에 `/share/` 예외 추가
```tsx
const isInApp = isInAppBrowser();
const isGuidePage = window.location.hash.includes('external-browser-guide');
const isShareRoute = window.location.hash.startsWith('#/share/');
if (isInApp && !isGuidePage && !isShareRoute) return <ExternalBrowserGuidePage />;
```

### 검증 항목
- [ ] 카카오톡에서 `/#/share/토큰` 열면 비밀번호 입력 화면 표시
- [ ] 카카오톡에서 일반 링크(`/`) 열면 기존대로 외부 브라우저 안내 표시
- [ ] 외부 브라우저(Chrome/Safari)에서 공유 링크 정상 작동 확인
