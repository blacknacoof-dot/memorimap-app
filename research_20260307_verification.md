# 2026-03-07 심층 검증 보고서 — 어제(3/6) Sonnet 작업 + 코드베이스 건강 점검

## 검증 범위

| 커밋 | 내용 | 날짜 |
|------|------|------|
| `ed69af3` | fix(superadmin): P0/P1 슈퍼관리자 버그 수정 6건 | 03-06 12:19 |
| `85672eb` | fix(superadmin): 슈퍼관리자 3건 버그 수정 | 03-06 13:08 |
| `281cef3` | fix: WebSocket race condition 경고 제거 (removeChannel 전체 제거) | 03-06 13:31 |
| `c059be8` | refactor: SuperAdmin 코드 품질 정리 (P1/P2) | 03-06 15:45 |
| `63ed0dc` | feat: 준비중 기능 4개 구현 + ContractDetailDrawer | 03-06 22:21 |
| `c749be6` | docs: 작업 계획서 및 마이그레이션 파일 저장 | 03-06 22:23 |

---

## 1. 빌드 상태

- `npm run build` — 14.97초, 성공
- `../../src/components/common/ConfirmModal` 경로는 프로젝트 구조상 정상 동작 (ConfirmModal.tsx는 `src/components/common/`에 위치, 20+파일에서 동일 패턴 사용)

---

## 2. F1~F4 기능 구현 검증 (커밋 63ed0dc)

### F1: 메시지 버튼 → 소통센터 탭 연결

| 항목 | 상태 | 비고 |
|------|------|------|
| ContractMonitoring → onNavigateCommunication 콜백 | OK | partnerName 전달 |
| SuperAdminDashboard → setCommunicationFilter → activeTab 전환 | OK | |
| AdminCommunication → initialFilter → filterText 자동 설정 | OK | inquiries 탭으로 이동 |
| **이슈**: AdminCommunication.tsx `as unknown as` 타입 캐스팅 | HIGH | getInquiries() 반환 타입 불명확 |
| **이슈**: AdminCommunication.tsx useState 9개 | MEDIUM | 규칙(5개) 초과, 훅 분리 필요 |

### F2: 계약 관제 상세 Drawer (ContractDetailDrawer)

| 항목 | 상태 | 비고 |
|------|------|------|
| ContractDetailDrawer 203줄 | OK | 300줄 이하 |
| 읽기 전용 기본 정보 (InfoRow) | OK | |
| 관리자 메모 textarea + 저장 | OK | |
| updateAdminMemo → sangjo_contracts.update | OK | |
| DB 마이그레이션 (20260306000000) | OK | admin_memo 컬럼 추가 |
| **이슈**: contract 재선택 시 memo stale 가능성 | LOW | edge case, useEffect deps로 대부분 해소 |

### F3: 리포트 다운로드 (CSV)

| 항목 | 상태 | 비고 |
|------|------|------|
| BOM (`\uFEFF`) 추가 | OK | UTF-8-BOM 인코딩 |
| CSV 따옴표 이스케이프 (`"` → `""`) | OK | |
| 빈 데이터 방지 (toast.warning) | OK | |
| **이슈**: 데이터 내 줄바꿈 미처리 | LOW | description 필드에 `\n` 있으면 CSV 파싱 깨짐 |

### F4: 알림 설정 토글 저장

| 항목 | 상태 | 비고 |
|------|------|------|
| 낙관적 업데이트 (notifOverrides) | OK | |
| 에러 시 rollback (delete copy[key]) | OK | |
| isSubmitting 방지 (notifSaving[key]) | OK | |
| DB 저장 (updateSystemSetting) | OK | |
| **이슈**: boolean/string 타입 혼합 | LOW | 동작하지만 명시성 낮음 |

### NotificationCenter → NotificationModal 분리

| 항목 | 상태 | 비고 |
|------|------|------|
| NotificationCenter.tsx 50줄 (wrapper) | OK | |
| NotificationModal.tsx 302줄 | WARN | 300줄 경계선 (2줄 초과) |
| import 경로 `../src/components/common/ConfirmModal` | OK | 빌드 통과 확인 |

---

## 3. SuperAdmin 버그수정 검증 (커밋 ed69af3, 85672eb, c059be8)

### 파일 크기 (300줄 규칙)

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| SuperAdminDashboard.tsx | 240 | OK |
| ContractMonitoring.tsx | 175 | OK |
| RevenueManagement.tsx | 222 | OK |
| AdminSettings.tsx | 165 | OK |
| ContractDetailDrawer.tsx | 203 | OK |
| PartnerAdmissions.tsx | 182 | OK |
| PartnerManagement.tsx | 224 | OK |
| FacilityManagement.tsx | 232 | OK |
| NoticeManagement.tsx | 264 | OK (인라인 모달, 분리 권장) |
| UserManagement.tsx | 144 | OK |
| SystemSettings.tsx | 139 | OK |

### 코드 품질

| 항목 | 상태 | 비고 |
|------|------|------|
| dead code 제거 | OK | 사용되지 않는 함수/변수 없음 |
| @ts-ignore / any | OK | 0건 |
| 인증 패턴 (useSuperAdminClient) | OK | 100% 준수 |
| confirm dialog (비가역 액션) | OK | |
| isSubmitting 중복 클릭 방지 | OK | |
| **이슈**: `lib/api/superAdmin.ts:49` console.error 잔존 | P1 | audit_log insert 실패 시 로그 |

---

## 4. WebSocket Race Condition 검증 (커밋 281cef3)

### removeChannel 완전 제거: PASS (0건)

### Realtime 구독 전수 (10개 파일, 14개 채널)

| 파일 | 채널 수 | mounted | cleanup | 상태 |
|------|---------|---------|---------|------|
| useContractMonitoring.ts | 2 | OK | OK | PASS |
| useFacilityAdmin.ts | 2 | OK | OK | PASS |
| usePartnerDashboard.ts | 3 | OK | OK | PASS |
| MyConsultations.tsx | 1 | OK | OK | PASS |
| ConsultationList.tsx | 1 | OK | OK | PASS |
| OperationsManagement.tsx | 1 | OK | OK | PASS |
| LiveConsultation.tsx | 1 | OK | OK | PASS |
| ScenarioBot.tsx | 1 | OK | OK | PASS |
| useNotifications.ts | 1 | OK | OK | PASS |
| **StatusTracker.tsx** | **1** | **MISSING** | OK | **FAIL** |

### StatusTracker.tsx 상세 (P0 이슈)

- mounted 플래그 없음 (라인 35~92)
- console.error 2건 잔존 (라인 52, 58)
- getAuthClient().then() 내부에서 mounted 체크 없이 setState 호출
- 빠른 mount/unmount 시 race condition 발생 가능

---

## 5. 전체 코드베이스 건강 점검

### console.log/warn/error 현황 (프로덕션 제거 대상)

| 영역 | 파일 수 | 건 수 |
|------|---------|-------|
| components/ | 11개 | 26건 |
| hooks/ | 11개 | 22건 |
| lib/ | 8개 | 11건 |
| **합계** | **30개** | **59건** |

**제외 (의도적 유지)**: lib/logger.ts (2건), lib/errorHandler.ts (2건), lib/security/auditLog.ts (1건)

**실질 제거 대상**: ~54건

### 주요 파일별 console 잔존

| 파일 | 건 수 | 심각도 |
|------|-------|--------|
| components/AI/ChatInterface.tsx | 10 | HIGH (핵심 기능) |
| components/MyPageView/useMyPage.ts | 5 | MEDIUM |
| hooks/useQuotaGate.ts | 3 | MEDIUM |
| hooks/useFacilities.ts | 3 | MEDIUM |
| hooks/useProfileSync.ts | 2 | MEDIUM |
| hooks/useReservations.ts | 2 | MEDIUM |
| hooks/useScenarioChat.ts | 2 | MEDIUM |
| hooks/useUserRole.ts | 2 | MEDIUM |
| lib/portone.ts | 2 | MEDIUM |
| lib/api/superAdmin.ts | 1 | P1 |

### 300줄 초과 파일 (P2 분리 대상)

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| lib/queries.ts | ~2,048 | P2 (기능별 분리) |
| components/AI/ChatInterface.tsx | ~954 | P2 (useChat 훅 분리) |
| components/FacilityEditModal.tsx | ~624 | P2 (useFacilityEditForm 훅 분리) |

### 보안 점검

| 항목 | 상태 |
|------|------|
| .env.local → .gitignore 등록 | OK |
| VITE_ 접두사에 민감키 없음 | OK (SERVICE_ROLE_KEY에 VITE_ 미사용) |
| any 타입 사용 | OK (lint-staged 차단) |
| createAuthenticatedClient 직접 호출 | OK (0건) |
| fallback 패턴 | OK (0건) |
| window.location.reload() | OK (제거됨) |

### @ts-expect-error 잔존 (수용 가능)

| 파일 | 라인 | 사유 |
|------|------|------|
| useReservation.ts | 26 | zodResolver generic 불일치 |
| useReservation.ts | 155 | handleSubmit generic 불일치 |
| MapContainer.legacy.tsx | 13 | Leaflet icon deletion |

---

## 6. 모델별 작업 이력 (Opus 4.6 vs Sonnet 4.6)

### Opus 4.6 작업 기간: 2026-02-17 ~ 2026-03-04 (커밋 체인 기준)

| 날짜 | 커밋 수 | 주요 작업 |
|------|---------|----------|
| 02-17~02-19 | 10+ | 초기 모바일 UI, 검색, CSP, 출시전 검증 |
| 02-22~02-24 | 10+ | Clerk→Supabase Auth 전환, 보안 감사, any 310건 제거, ESLint |
| 02-25~02-26 | 12+ | 런타임 버그 15건, 상조 대시보드, PHASE 1~4 검증, Feature Gating |
| 02-27~02-28 | 5 | 요금제 구현, journey_share 404, 상조 대시보드 분리 |
| 03-01 | 9 | RLS 표준화, partnerId 네이밍, SuperAdmin 인증 통일 |
| 03-03~03-04 | 3 | UX/UI 진단, BLOCK 1-10 적용, TypeScript 30에러 수정 |

**Opus 총 커밋**: ~50+건
**주요 성과**: 인증 전환, 보안 강화, RLS 표준화, 코드 품질 대규모 정리

### Sonnet 4.6 작업 기간: 2026-03-03 ~ 2026-03-06

| 날짜 | 커밋 수 | 주요 작업 |
|------|---------|----------|
| 03-03 | 7 | Consultation 타입 SSOT, Realtime auth 전환, queries 수정 |
| 03-04 | 3 | Block1 UX, Block2 파일분리, FilterBar 복원 |
| 03-05 | 17 | 무결성 P0 수정, GA4, UX개선, 배포설정, WebSocket, SuperAdmin |
| 03-06 | 6 | SuperAdmin 버그 9건, WebSocket 제거, 코드품질, F1~F4 구현 |

**Sonnet 총 커밋**: ~33건
**주요 성과**: 기능 구현(F1~F4), WebSocket 안정화, 배포 준비

### 전환 지점 분석

```
Opus 마지막: 30bc651 (03-04 07:36) — TypeScript 30에러 수정
     ↓ (같은 날)
Sonnet 시작: a9eff44 (03-04 22:49) — Block1 UX개선
```

**참고**: 03-03에 Opus(83fde16, 5c460ea)와 Sonnet(06bcb4b~e3f2335)이 같은 날 공존.
Opus가 오전~오후, Sonnet이 저녁~밤 작업으로 추정.

---

## 7. 발견된 이슈 종합 (우선순위별)

### P0 — 즉시 수정 (2건)

| # | 파일 | 이슈 | 영향 |
|---|------|------|------|
| 1 | `src/components/partner/StatusTracker.tsx` | mounted 플래그 누락 + console.error 2건 | race condition, 프로덕션 로그 |
| 2 | `lib/api/superAdmin.ts:49` | console.error 잔존 | 프로덕션 로그 |

### P1 — 이번 주 (4건)

| # | 파일 | 이슈 |
|---|------|------|
| 3 | `components/admin/AdminCommunication.tsx` | `as unknown as` 타입 캐스팅, useState 9개 |
| 4 | console.log/warn/error 54건 | 30개 파일 프로덕션 콘솔 제거 |
| 5 | `components/NotificationModal.tsx` | 302줄 (경계 초과) |
| 6 | `components/SuperAdmin/NoticeManagement.tsx` | 인라인 모달 별도 파일 분리 |

### P2 — 출시 후 (3건)

| # | 파일 | 이슈 |
|---|------|------|
| 7 | `lib/queries.ts` (~2,048줄) | 기능별 파일 분리 |
| 8 | `components/AI/ChatInterface.tsx` (~954줄) | useChat 훅 분리 |
| 9 | `components/FacilityEditModal.tsx` (~624줄) | useFacilityEditForm 훅 분리 |

---

## 8. 전체 평가

| 영역 | 점수 | 비고 |
|------|------|------|
| F1~F4 기능 구현 | 85/100 | 동작 정상, 타입/리팩토링 개선 필요 |
| SuperAdmin 버그수정 | 90/100 | console.error 1건 외 우수 |
| WebSocket 안정화 | 93/100 | StatusTracker 1건 외 완벽 (9/10) |
| 코드베이스 건강 | 75/100 | console 54건, 대형 파일 3개 |
| 빌드/보안 | 95/100 | 빌드 성공, 보안 규칙 준수 |

### 종합: 87/100 — 양호

**출시 전 필수**: P0 2건 수정 → 빌드 검증 → 배포
**권장**: P1 console 54건 일괄 제거 (프로덕션 클린)
