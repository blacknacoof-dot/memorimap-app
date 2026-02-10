# Phase 3 코드 품질 개선 완료 계획

> 작성일: 2026-02-10 | 작성자: Antigravity

## 배경

kimi2.5가 Phase 3 작업 중 Hook 파일들을 생성했지만 일부만 통합됨. 현재 상태:

| Hook | 상태 | 비고 |
|------|------|------|
| `useToast` | ✅ App.tsx에서 사용 중 | 라인 30, 131 |
| `useComparison` | ✅ App.tsx에서 사용 중 | 라인 31, 134-145 |
| `useReservations` | ✅ App.tsx에서 사용 중 | 라인 32, 167-175 |
| `useAppInitialization` | ❌ Dead Code | App.tsx에서 미사용 |
| `useFacilityData` | ❌ Dead Code | App.tsx에서 미사용 |
| `useMapHandlers` | ❌ Dead Code | App.tsx에서 미사용 |

## ⚠️ Dead Code Hook이 위험한 이유

단순 교체 불가 — App.tsx의 실제 로직과 미묘한 차이 존재:

| Hook | 차이점 |
|------|--------|
| `useFacilityData` | 이미지 fallback 로직 다름 (로컬 이미지 vs Unsplash URL) |
| `useAppInitialization` | toast 호출 누락, viewState 의존성 차이 |
| `useMapHandlers` | setFacilities 병합 로직 차이 (append vs overwrite) |

## 전략: 안전 우선

### 1단계: Dead Code Hook 파일 삭제
- `hooks/useAppInitialization.ts` → 삭제
- `hooks/useFacilityData.ts` → 삭제
- `hooks/useMapHandlers.ts` → 삭제

### 2단계: alert() → toast() 변환 (14개 소스 파일)

| # | 파일 | alert() 수 | 변환 |
|---|------|-----------|------|
| 1 | `hooks/useFacilityAdmin.ts` | 4 | toast.success / toast.error |
| 2 | `hooks/useAdminFacilities.ts` | 2 | toast.success / toast.error |
| 3 | `hooks/useUsers.ts` | 1 | toast.error |
| 4 | `components/EditProfileModal.tsx` | 2 | toast.success / toast.error |
| 5 | `components/InquiryModal.tsx` | 1 | toast.error |
| 6 | `components/dashboard/ConsultationList.tsx` | 3 | toast |
| 7 | `components/dashboard/MyConsultations.tsx` | 1 | toast.info |
| 8 | `components/dashboard/super-admin/NoticeManager.tsx` | 3 | toast |
| 9 | `components/Consultation/ConsultationHistoryView.tsx` | 1 | toast.error |
| 10 | `components/dashboard/facility/ConsultationActionModal.tsx` | 2 | toast |
| 11 | `components/AI/ChatInterface.tsx` | 1 | toast.error |
| 12 | `components/admin/AdminApprovals.tsx` | 2 | toast |
| 13 | `components/AI/MemorialConsultationForm.tsx` | 1 | toast.success |
| 14 | `components/Consultation/PetChatInterface.tsx` | 1 | toast.info |
| 15 | `src/components/partner/StatusTracker.tsx` | 1 | toast.error |
| 16 | `App.tsx` | 2 | toast.info → setTimeout → tel: 링크 |

> `src/pages/ExternalBrowserGuidePage.tsx`의 alert()는 의도적으로 유지 (모바일 인앱 브라우저 호환성)
> `App.tsx` L1920, L1924: CALL_MANAGER 액션 — alert 후 전화 연결. toast.info로 표시 후 1초 뒤 tel: 이동

### 3단계: 빌드 검증
```powershell
npx tsc --noEmit
```

## 롤백 계획
- Git: `git reset --hard 4b6a159`
- 파일 백업: `D:\추모맵\memorimap_backup_20260210`

## 예상 시간: 약 20~30분
