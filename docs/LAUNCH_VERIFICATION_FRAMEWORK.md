# 추모맵 출시 전 단계별 검증 프레임워크

> 최종 업데이트: 2026-02-26 (PHASE 1~4 코드 점검 완료)
> 빌드 상태: ✅ 성공 (25s, index.js 777KB)
> 코드 품질: any 0건, 하드코딩 0건, anon write 0건, @ts-ignore 0건

---

## 🔑 핵심 원칙 (매 단계 반드시 준수)

1. **한 세션에 한 파일만 수정** — 동시 수정은 충돌 위험
2. **수정 → 즉시 빌드 → 확인 → 다음** — 빌드 깨지면 즉시 되돌림
3. **실패하면 그 자리에서 되돌리고 원인 파악** — 무시하고 넘어가지 않음
4. **DB 작업은 반드시 백업 후 실행** — `pg_dump` 또는 Supabase 스냅샷
5. **클로드한테 요청 시: 파일 하나씩, 문제 하나씩** — 토큰 효율 + 정확도
6. **각 항목 완료 시 ✅ 체크** — 건너뛰면 ⏭️ 표시 + 사유 기록
7. **보안 검증은 모든 PHASE에서 병행** — 마지막에 몰아서 하지 않음

---

## PHASE 1: 코드 품질 최종 점검 ✅ 완료 (커밋: 9d61ff8)

### 1-1. 빌드 검증
- [x] `npm run build` 성공 확인
- [x] 빌드 경고(warning) 목록 확인 → 치명적 경고 0건
- [x] `dist/` 번들 크기 확인 (index.js 777KB)

### 1-2. console.error 검토 (7건 → 전수 확인)
- [x] faq.tsx: fetch/save 실패 → toast.error 추가
- [x] ConfirmModal.tsx: 공통 catch → 유지
- [x] StatusTracker.tsx: fetch 에러 → 무음 유지, update 에러 → toast.error 추가
- [x] StatusTracker.tsx: anon→auth 클라이언트 전환

### 1-3. TypeScript 엄격 검증
- [x] `any` 타입 0건
- [x] `@ts-ignore` / `@ts-expect-error` 0건
- [x] `as unknown as` 강제 캐스팅 0건

### 1-4. 보안 점검
- [x] `.gitignore` 완비
- [x] 소스코드 내 API 키/시크릿 하드코딩 0건
- [x] `VITE_` 접두사 남용 0건

---

## PHASE 2: Supabase 백엔드 검증 — 코드 ✅ / Dashboard ⏳ (커밋: 2b133fd)

### 2-1. DB 데이터 무결성
- [x] facilities 2,139건, funeral_companies 50건
- [x] 이미지 없는 시설/상조 0건
- [x] 분류 오류/중복/비표준 type 0건

### 2-2. 코드 레벨 검증 (완료)
- [x] Edge Function 4개: CORS localhost:5173 제거
- [x] approve-partner, verify-payment: @ts-nocheck 제거
- [x] useNotifications.ts: anon→getAuthClient(strict) 전환 (write 3건)
- [x] Edge Function auth 검증: 4개 모두 Bearer + getUser 정상
- [x] lib/queries.ts: client 파라미터 주입 방식 정상
- [x] services/: client 파라미터 주입 방식 정상
- [x] fallback 패턴 (token ? auth : anon): 0건

### 2-3. RPC 함수 테스트 (수동 — dev 서버에서 확인)
- [ ] `search_facilities` → 결과 반환 확인
- [ ] `search_facilities_by_text` → 한글 검색 정상
- [ ] `search_facilities_in_view` → 좌표 범위 정상
- [ ] `search_facilities_v2` → 필터 조합 정상

### 2-4. RLS 정책 검증 (수동)
- [ ] 비로그인 사용자: 시설 목록 조회 가능, 쓰기 불가
- [ ] 로그인 사용자: 본인 데이터만 수정 가능
- [ ] 관리자: 담당 시설 데이터만 접근 가능
- [ ] 슈퍼관리자: 전체 데이터 접근 가능

### 2-5. Edge Function 재배포 ⚠️ (Supabase Dashboard 필수)

| Function | 코드 수정 | 재배포 | 검증 |
|----------|:---------:|:------:|:----:|
| `approve-partner` | [x] CORS+@ts-nocheck | [ ] | [ ] 파트너 승인 테스트 |
| `gemini-proxy` | [x] CORS | [ ] | [ ] AI 챗봇 응답 확인 |
| `verify-payment` | [x] CORS+@ts-nocheck | [ ] | [ ] 결제 검증 테스트 |
| `deploy-bot-data` | [x] CORS | [ ] | [ ] 봇 데이터 배포 테스트 |

### 2-6. Auth 설정 (Supabase Dashboard 필수)

| 항목 | 상태 | 비고 |
|------|:----:|------|
| Email Templates 한글화 | [ ] | 회원가입 확인, 비밀번호 재설정, 매직링크 |
| Google OAuth | [ ] | Client ID/Secret 설정 |
| Kakao OAuth | [ ] | REST API Key/Secret 설정 |
| Redirect URL | [ ] | 프로덕션 도메인 등록 |

---

## PHASE 3: 프론트엔드 기능 검증 — 코드 ✅ / 브라우저 ⏳ (커밋: 2829d2a)

### 3-0. 코드 레벨 점검 (완료)
- [x] 라우팅: HashRouter + ContentRouter 정상
- [x] getAuthClient strict 누락: 0건
- [x] fallback 패턴: 0건
- [x] IntegratedJourneyView 로그인 버그 수정 (window.location→onLoginClick)
- [x] 삭제 작업 auth 클라이언트 사용: 정상
- [x] isSubmitting 중복 클릭 방지: 11개 컴포넌트 적용
- [x] Lazy loading + Suspense: 12개 뷰 컴포넌트 적용
- [x] 역할 기반 접근 제어: 4종 가드 정상

### 3-1. 인증 플로우 (수동)
- [ ] 이메일 회원가입 → 확인 이메일 수신 → 로그인
- [ ] 이메일 로그인 → 프로필 동기화
- [ ] 로그아웃 → 세션 정리
- [ ] Google 소셜 로그인 (OAuth 설정 후)
- [ ] Kakao 소셜 로그인 (OAuth 설정 후)
- [ ] 비밀번호 재설정 플로우

### 3-2. 핵심 기능 — 시설 검색/조회 (수동)
- [ ] 지도 로드 → 마커 표시 (카테고리별 색상/아이콘)
- [ ] 검색어 입력 → 결과 목록 표시
- [ ] 지역 필터 ("서울" ↔ "서울특별시" alias)
- [ ] 시설 유형 필터
- [ ] 시설 클릭 → 상세 시트
- [ ] 시설 상세 → 리뷰 목록

### 3-3. 핵심 기능 — 상조 서비스 (수동)
- [ ] 상조 업체 목록 조회
- [ ] 상조 상세 → 서비스 구성/가격
- [ ] 상담 신청 모달 → 제출 성공
- [ ] 상조 예약 플로우 (스텝 1→2→3→4)

### 3-4. 사용자 기능 (수동)
- [ ] 마이페이지 → 프로필 조회/수정
- [ ] 즐겨찾기 추가/제거
- [ ] 엔딩노트 작성/편집/공유
- [ ] AI 채팅 상담 (gemini-proxy 배포 후)

### 3-5. 런타임 에러 확인 (수동)
- [ ] DevTools Console 빨간 에러 0건
- [ ] Network 탭 → 4xx/5xx 응답 0건

---

## PHASE 4: 관리자 기능 검증 — 코드 ✅ / 수동 ⏳ (커밋: 69cc62e)

### 4-0. 코드 레벨 점검 (완료)

| 관리자 유형 | auth client | confirm dialog | 역할 가드 |
|-------------|:-----------:|:--------------:|:---------:|
| 슈퍼관리자 (9파일) | ✅ strict:true | ✅ | ✅ |
| 시설관리자 (3파일) | ✅ strict:true | ✅ | ✅ |
| 상조관리자 (5파일) | ✅ strict:true | ✅ | ✅ |
| FacilityInfoEditor | ✅ | ✅ confirm 2건 추가 | ✅ |

### 4-1. 슈퍼관리자 대시보드 (수동)
- [ ] 로그인 후 관리자 메뉴 접근
- [ ] 파트너 승인/거절 (confirm dialog) ⚠️ approve-partner 배포 필수
- [ ] 시설 관리 (목록/수정)
- [ ] 사용자 관리

### 4-2. 시설 관리자 대시보드 (수동)
- [ ] 담당 시설 정보 조회/수정
- [ ] 예약 목록 조회
- [ ] 상담 내역 조회
- [ ] 구독/매출 현황

### 4-3. 상조 관리자 대시보드 (수동)
- [ ] 예약 관리 (목록/상세/상태 변경)
- [ ] 상담 관리
- [ ] 구독/매출 분석

---

## PHASE 5: 모바일 + 배포 (실기기 + Vercel)

> 목표: 모바일 UX 확인 + 프로덕션 배포

### 5-1. 모바일 UI 점검

| 항목 | Chrome 시뮬 | iOS 실기기 | Android 실기기 |
|------|:-----------:|:----------:|:--------------:|
| 헤더/검색창 | [ ] | [ ] | [ ] |
| 지도 마커/클릭 | [ ] | [ ] | [ ] |
| 시설 상세 시트 | [ ] | [ ] | [ ] |
| 모달 (상담/예약) | [ ] | [ ] | [ ] |
| 터치 타겟 44px | [ ] | [ ] | [ ] |
| iOS Safe Area | N/A | [ ] | N/A |
| 100vh 이슈 | [ ] | [ ] | [ ] |
| AI 채팅 입력 | [ ] | [ ] | [ ] |

### 5-2. 성능 체크
- [ ] Lighthouse 점수 (모바일): Performance 60+, Accessibility 80+, Best Practices 80+
- [ ] 초기 로딩 시간 확인
- [ ] 이미지 로딩 속도

### 5-3. Vercel 배포
- [ ] `git push` → Vercel 자동 빌드
- [ ] 빌드 로그 → 에러 0건
- [ ] 프로덕션 URL 접속 → 정상 로드
- [ ] 환경변수 확인 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### 5-4. 프로덕션 스모크 테스트 (배포 직후 5분)
- [ ] 메인 페이지 로드 (지도 + 시설 목록)
- [ ] 검색 동작
- [ ] 회원가입/로그인
- [ ] 시설 상세 조회
- [ ] 상조 서비스 조회

---

## 커밋 이력

| 커밋 | PHASE | 내용 |
|------|-------|------|
| `9d61ff8` | 1 | toast.error 3건 + StatusTracker anon→auth + faq useEffect lint |
| `2b133fd` | 2 | Edge Function CORS localhost 4건 제거 + @ts-nocheck 2건 + useNotifications anon→auth |
| `2829d2a` | 3 | IntegratedJourneyView 로그인 버그 (HashRouter 호환) |
| `69cc62e` | 4 | FacilityInfoEditor confirm dialog 2건 추가 |

---

## 📌 이슈 발생 시 대응 매뉴얼

### 빌드 실패
```
1. git stash (현재 변경 보관)
2. git log --oneline -5 (최근 커밋 확인)
3. 마지막 성공 커밋으로 checkout
4. 문제 파일 하나씩 비교/수정
5. npm run build 재확인
```

### 런타임 에러
```
1. DevTools Console에서 에러 메시지 복사
2. 에러 발생 파일:라인번호 확인
3. 해당 파일만 수정 (다른 파일 건드리지 않기)
4. npm run build → dev 서버 재확인
```

### DB/RLS 에러
```
1. Supabase Dashboard → Logs 확인
2. 해당 테이블 RLS 정책 확인
3. clerk_user_id() 함수 정상 동작 확인
4. 수정 시 반드시 migrations/ 파일로 관리
```

### Edge Function 에러
```
1. Supabase Dashboard → Edge Functions → Logs
2. Bearer 토큰 검증 로직 확인
3. CORS 설정 확인 (localhost 제거 완료)
4. 함수 재배포 후 재테스트
```

---

## 남은 수동 작업 요약

### 즉시 가능 (로컬)
1. `npm run dev` → 브라우저 수동 테스트 (PHASE 3, 4 수동 항목)
2. Chrome DevTools 모바일 시뮬레이션 (PHASE 5-1 Chrome 열)

### Supabase Dashboard 필요
3. Edge Function 4개 재배포
4. Auth Email Templates 한글화
5. Google/Kakao OAuth Provider 설정
6. Redirect URL 프로덕션 도메인 등록

### Vercel 필요
7. `git push` → 프로덕션 배포
8. 환경변수 확인
9. 스모크 테스트

### 실기기 필요
10. iOS Safari 테스트 (Safe Area, 100vh)
11. Android Chrome 테스트

---

## 진행률

| 구분 | 완료 | 남음 | 진행률 |
|------|------|------|--------|
| 코드 레벨 (자동) | 32 | 0 | **100%** |
| 수동 테스트 | 0 | 38 | 0% |
| 외부 설정 | 0 | 6 | 0% |
| **전체** | **32** | **44** | **42%** |
