# Memorimap 모바일 UI 검증 리포트

**작성일**: 2026-02-17
**원칙**: 데스크톱(>768px)은 변경 없음. 모바일(≤768px)에서만 수정.

---

## 1. 메인 화면 (목록 뷰)

### 1.1 TopBar.tsx
| 라인 | 현재 코드 | 문제 | 수정 방향 |
|------|----------|------|----------|
| 26 | `top-20` (FilterBar) | 검색창-탭 여백 부족 | `top-24 md:top-20` |
| 34 | `p-4` (헤더 버튼) | 모바일 과도한 패딩 | `p-3 md:p-4` |
| **58-66** | 지도 전환 버튼 항상 표시 | **하단 탭과 중복 + 이전 빌드 캐시에 남음** | **제거 또는 `hidden md:flex`** |

### 1.2 FilterBar.tsx
| 라인 | 현재 코드 | 문제 | 수정 방향 |
|------|----------|------|----------|
| 24 | `mb-2` | 검색창-카테고리 여백 부족 | `mb-3 md:mb-2` |
| 47 | `min-h-[36px]` | 터치 타겟 44px 미달 | `min-h-[44px] md:min-h-[36px]` |

### 1.3 BottomNav.tsx
| 라인 | 현재 코드 | 문제 | 수정 방향 |
|------|----------|------|----------|
| 26 | `z-[200] pb-safe` | Safe Area는 적용됨 ✅ | - |
| 31 | `min-h-[48px]` | 일부 기기에서 부족 | `min-h-[52px] md:min-h-[48px]` |

### 1.4 SmartSearchInput.tsx
| 라인 | 현재 코드 | 문제 | 수정 방향 |
|------|----------|------|----------|
| 90 | `h-12` (compact) | 터치 타겟 OK | 유지 |

---

## 2. 엔딩노트

### 2.1 EndingNoteEditModal.tsx
| 라인 | 현재 코드 | 문제 | 수정 방향 |
|------|----------|------|----------|
| 94 | `max-h-[60vh]` | **하단 저장/다음 버튼 잘림** | `max-h-[80vh] md:max-h-[60vh]` + 버튼 sticky |

### 2.2 엔딩노트 공유 화면 (스크린샷 이슈)
| 위치 | 문제 | 수정 방향 |
|------|------|----------|
| 콘텐츠 하단 | "남기고 싶은 말" 등 바텀 네비(z-200)에 가려짐 | `pb-24 md:pb-4` 추가 |

---

## 3. 모달/시트 z-index 충돌

### 3.1 현재 z-index 분포 (문제)
```
SideMenu backdrop: z-40   ← 너무 낮음
SideMenu panel:    z-50   ← 너무 낮음
BottomNav:         z-[200]
FacilitySheet:     z-[210]
FuneralCompanySheet: z-[250]
AI Chat:           z-[300]
ReservationModal:  z-[300]~z-[310]
SangjoContract:    z-[400]
```

### 3.2 권장 z-index 정책
```
TopBar/BottomNav:    z-30 ~ z-50
SideMenu:            z-[60]/z-[70]  ← 수정 필요
Bottom Sheets:       z-[100]~z-[150]
Full Modals:         z-[200]~z-[250]
AI Chat:             z-[300]
System Alerts:       z-[400]+
```

### 3.3 iOS Safari 100vh 문제
| 컴포넌트 | 현재 | 수정 방향 |
|---------|------|----------|
| FacilitySheet.tsx:189 | `h-[85vh]` | `h-[80vh] md:h-[85vh]` |
| FuneralCompanySheet.tsx:140 | `h-[80vh]` | `h-[75vh] md:h-[80vh]` |
| SangjoConsultationModal | `h-[85vh]` | `h-[80vh] md:h-[85vh]` |

---

## 4. 상담 모달 X 버튼

### SangjoConsultationModal.tsx
| 문제 | 수정 방향 |
|------|----------|
| X 버튼이 모바일에서 화면 밖으로 밀림 | `sticky top-0` 또는 `fixed` + Safe Area 패딩 |
| SangjoContractModal X 버튼 p-1 | `p-2 md:p-1` (터치 타겟 확보) |

---

## 5. AI 채팅

### ChatInterface.tsx
| 문제 | 수정 방향 |
|------|----------|
| 시설 AI 상담 페이지에서 불필요한 입력창 표시 | 조건부 숨김 처리 |
| 헤더 pt-6 iOS Safe Area 미적용 | `pt-safe` 추가 |

---

## 6. 상조 서비스

### FuneralCompanySheet.tsx
| 문제 | 수정 방향 |
|------|----------|
| "서비스구성" 탭 텍스트 깨짐 (overflow) | `break-words` / `overflow-wrap: break-word` 추가 |

---

## 7. 검색/필터 로직 버그

### 7.1 "서울" → "경기도" 표시 (FacilityList.tsx:24-25)
**현재**: `facility.address.toLowerCase().includes(searchQuery)`
**문제**: "경기도 서울산동" 같은 도로명도 매칭
**수정**:
```tsx
// 주소 첫 토큰(시/도) 우선 매칭
const firstToken = facility.address.split(' ')[0];
const matchesAddress = firstToken.includes(searchQuery) ||
    facility.address.includes(searchQuery);
```

### 7.2 "광주" 검색 결과 없음
**원인 추정**: DB에 "광주광역시"로 저장, "광주"로 검색 시 미매칭 가능
**수정**: 지역 동의어 매핑 추가
```tsx
const REGION_ALIASES = {
  '광주': ['광주광역시', '광주시'],
  '대전': ['대전광역시'],
  // ...
};
```

---

## 8. 전역 스타일

### 8.1 index.html
- `viewport-fit=cover` ✅
- `apple-mobile-web-app-status-bar-style: black-translucent` ✅

### 8.2 tailwind.config.js
**문제**: Safe Area 유틸리티 클래스 미정의
**권장**:
```js
theme: {
  extend: {
    spacing: {
      'safe-bottom': 'env(safe-area-inset-bottom)',
    }
  }
}
```

---

## 9. 터치 타겟 검증 (최소 44px)

| 컴포넌트 | 라인 | 현재 크기 | 수정 |
|---------|------|----------|------|
| FilterBar.tsx | 47 | 36px | → 44px (모바일) |
| BottomNav.tsx | 31 | 48px | → 52px (모바일) |
| SangjoContractModal | 44 | p-1 (X버튼) | → p-2 (모바일) |
| TopBar 버튼들 | 40 | p-3 (~48px) | ✅ OK |

---

## 10. 배포 캐시 이슈

| 문제 | 원인 | 해결 |
|------|------|------|
| 모바일에서 이전 버전 UI 표시 (지도 아이콘 등) | Vercel CDN 캐시 또는 브라우저 캐시 | Vercel 재배포 + 캐시 무효화 |
| 목록 우측 상단 지도 버튼 | TopBar.tsx:58-66 코드 존재 | 코드 제거 후 재배포 |

---

## 11. 우선순위 정리

### P0 (즉시 수정)
1. TopBar.tsx:58-66 — 지도 전환 버튼 제거
2. EndingNoteEditModal.tsx:94 — 모달 높이 조정 (버튼 잘림)
3. FacilityList.tsx:24-25 — 지역 검색 필터링 개선
4. z-index 정책 통일 — SideMenu z-60/70으로 상향

### P1 (중요)
5. 엔딩노트 공유 화면 — 하단 `pb-24` 추가
6. FilterBar.tsx — 터치 타겟 44px
7. FacilitySheet/FuneralCompanySheet — iOS 100vh 대응
8. FuneralCompanySheet — 서비스구성 텍스트 `break-words`
9. ChatInterface — 시설 AI 상담 입력창 숨김
10. SangjoConsultationModal — X 버튼 위치 고정

### P2 (개선)
11. BottomNav 최소 높이 52px
12. TopBar FilterBar 위치 조정
13. tailwind.config.js Safe Area 유틸리티
14. 추모시설 AI 상담 "접수 중 오류" 디버깅

### 미조사 (별도 확인 필요)
- `components/MyPageView.tsx` — 마이페이지 모바일 레이아웃
- `components/IntegratedJourneyView.tsx` — 엔딩노트 표시 영역
- `components/AI/ChatInterface.tsx` 라인 700+ — 입력창 렌더링

---

**총 수정 항목**: 14개 (P0: 4개, P1: 6개, P2: 4개)
**영향 범위**: 모바일(768px 이하)만. 데스크톱 변경 없음.
**예상 번들 증가**: ~3-5KB (0.1% 미만)
