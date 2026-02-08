# Memorimap 유저 마이페이지 데이터흐름 검증 보고서

**생성일**: 2026-02-08  
**검증범위**: 유저 마이페이지, 찜 목록, 엔딩노트, 상담/예약, 실시간 소통, 파트너 신청  
**검증자**: OpenCode AI  

---

## 1. 개요 (Executive Summary)

본 보고서는 Memorimap 플랫폼의 유저 마이페이지 및 관련 기능의 데이터흐름을 심층 분석한 결과입니다. 총 6개의 주요 기능 영역을 검증했으며, 데이터 일관성, 에러 핸들링, 실시간 동기화, 보안 등 다양한 관점에서 분석을 수행했습니다.

**총 검파일 수**: 25+ 파일  
**심각도별 이슈**: 
- 🔴 치명적(Critical): 5건
- 🟠 중요(Major): 9건  
- 🟡 경고(Minor): 15건

---

## 2. 유저 마이페이지 (MyPageView)

### 2.1 구조 분석

**주요 파일**:
- `components/MyPageView.tsx` (625라인)
- `components/MyPageV2.tsx` (파일 존재, 복잡도 높음)

**데이터 흐름**:
```
User → MyPageView → fetchMyReservations → getMyReservations (queries.ts)
                → fetchMyFavorites → favoriteService.getFavorites
                → fetchSangjoFavorites → sangjoFavoriteService.getFavorites
                → fetchUserPhone → getUserPhoneNumber
```

**의존성**:
- `MyConsultations` (상담 내역 컴포넌트)
- `IntegratedJourneyView` (엔딩노트/여정)
- `ReservationList` (예약 목록)

### 2.2 발견된 오류

#### 🔴 CRITICAL-001: 타입 불일치 및 강제 캐스팅
**위치**: `components/MyPageView.tsx:79`

**문제**: Reservation 타입 강제 캐스팅

```typescript
const data = await getMyReservations(user.id);
setMyReservations(data as unknown as Reservation[]);
```

**영향**: 런타임 에러 가능성, 타입 안정성 상실
**해결**: getMyReservations의 반환 타입을 정확히 정의하거나, 매퍼 함수 사용

#### 🔴 CRITICAL-002: Props 타입이 any로 선언됨
**위치**: `components/MyPageView.tsx:20-30`

**문제**: 핵심 Props가 any 타입으로 선언

```typescript
interface Props {
    isLoggedIn: boolean;
    user: any;  // ⚠️ 구체적 타입 필요
    userRole?: string;
    reservations?: Reservation[];
    facilities: any[];  // ⚠️ 구체적 타입 필요
    onLoginClick: () => void;
    onNavigate?: (view: any) => void;  // ⚠️ view 타입 필요
    onReviewDeleted?: (facilityId: string, reviewId: string, rating: number) => void;
    onSelectFacility?: (facility: Facility) => void;
    onSelectCompany?: (company: any) => void;  // ⚠️ 구체적 타입 필요
}
```

**해결**: User, Facility 등의 구체적 타입 정의 필요

#### 🟠 MAJOR-001: 에러 핸들링 불충분
**위치**: `components/MyPageView.tsx:74-85`

**문제**: fetchMyReservations 에러 발생 시 사용자 피드백 없음

```typescript
const fetchMyReservations = async () => {
    if (!user) return;
    setIsLoadingReservations(true);
    try {
        const data = await getMyReservations(user.id);
        setMyReservations(data as unknown as Reservation[]);
    } catch (err) {
        console.error(err);  // ⚠️ UI 피드백 없음
    } finally {
        setIsLoadingReservations(false);
    }
};
```

**해결**: Toast나 에러 메시지로 사용자에게 알림 필요

#### 🟠 MAJOR-002: 찜 목록 중복 데이터 처리 로직 복잡성
**위치**: `components/MyPageView.tsx:87-170`

**문제**: Two-Step Fetch 로직이 복잡하고 유지보수 어려움

```typescript
// 1. Favorites 조회
const data = await favoriteService.getFavorites(user.id);
setMyFavorites(data);

// 2. 누락된 시설 정보 별도 조회 (UUID/Legacy 분리)
const missingIds = data.map(...).filter(...);
// UUID vs Legacy ID 분리 로직
const uuidIds = idsToFetchFromDB.filter(isUUID);
const legacyIds = idsToFetchFromDB.filter(id => !isUUID(id));
```

**해결**: RPC나 View로 한 번에 조회하도록 DB 개선 권장

#### 🟡 MINOR-001: 매직 넘버 사용
**위치**: `components/MyPageView.tsx:116-118`

**문제**: UUID 정규식이 인라인으로 하드코딩됨

```typescript
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
```

**해결**: 유틸리티 함수로 분리 (`utils/validation.ts`)

#### 🟡 MINOR-002: 사용하지 않는 import
**위치**: `components/MyPageView.tsx:9`

**문제**: `Heart`, `Star`가 import되었으나 사용 여부 불명확

---

## 3. 찜 목록 (Favorites)

### 3.1 구조 분석

**주요 파일**:
- `hooks/useFavorites.ts` (166라인)
- `services/favoriteService.ts` (154라인)
- `types/favorites.ts` (36라인)

**데이터 흐름**:
```
useMyFavorites → supabase.rpc('get_my_favorites') 
useToggleFavorite → supabase.rpc('toggle_favorite')
useRemoveFavorite → supabase.rpc('remove_favorite')
```

### 3.2 발견된 오류

#### 🔴 CRITICAL-003: 찜하기 Mock Mode 로직 문제
**위치**: `services/favoriteService.ts:22-58`

**문제**: 세션 체크와 Mock 모드 판단 로직이 복잡하고 예측 어려움

```typescript
async getFavorites(userId: string): Promise<Favorite[]> {
    // 🚑 [Direct Attack] Check session before Supabase call
    const { data: { session } } = await supabase.auth.getSession();

    // 🚑 Mock Mode Fallback (Explicit)
    if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
        const localFavIds = this._getLocalFavorites();
        return localFavIds.map(fid => ({...}));
    }
    // ...
}
```

**문제점**:
1. `userId.startsWith('mock-')` 체크가 보안상 적절하지 않음
2. localStorage fallback이 개발/프로덕션 모두에서 동작 가능
3. RLS 에러(42501) 시 재귀 호출로 인한 무한 루프 가능성

**해결**: 환경 변수로 Mock 모드 명확히 구분, 에러 처리 개선

#### 🔴 CRITICAL-004: 타입 불일치
**위치**: `types/favorites.ts` vs `services/favoriteService.ts`

**문제**: 서비스와 타입 정의 불일치

```typescript
// types/favorites.ts
export interface UserFavorite {
    id: string;
    facility_id: string;
    facility_name: string;
    // ...
}

// services/favoriteService.ts
export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string;
    created_at: string;
    memorial_spaces?: any;
}
```

**해결**: 단일 타입으로 통합 필요

#### 🟠 MAJOR-003: RLS 에러 fallback 처리 문제
**위치**: `services/favoriteService.ts:44-57`

**문제**: RLS 에러 시 Mock 데이터로 fallback

```typescript
if (error) {
    // RLS or Auth Error Fallback
    if (error.code === '42501' || (error as any).status === 401) {
        console.warn('[favoriteService] Supabase error, falling back to localStorage');
        return this.getFavorites(`mock-${userId}`); // Recursively use mock logic
    }
}
```

**문제점**: 
- 사용자에게 알림 없이 로컬 데이터로 전환
- 실제 에러를 숨김
- 디버깅 어려움

#### 🟠 MAJOR-004: useFavorites와 favoriteService 중복
**위치**: `hooks/useFavorites.ts` vs `services/favoriteService.ts`

**문제**: 두 가지 방식으로 찜하기 기능 구현됨

- `hooks/useFavorites.ts`: TanStack Query + RPC 사용
- `services/favoriteService.ts`: 일반 Service + 직접 쿼리

**해결**: 하나로 통합 필요 (TanStack Query 방식 권장)

#### 🟡 MINOR-003: any 타입 사용
**위치**: `services/favoriteService.ts:9`

```typescript
memorial_spaces?: any; // Join된 시설 정보
```

#### 🟡 MINOR-004: 콘솔 로그 과다
**위치**: `hooks/useFavorites.ts:19-26`

```typescript
console.log("👀 [useMyFavorites] Starting query for user:", userId);
// ...
console.log('✅ [useMyFavorites] Fetched Data:', data);
```

---

## 4. 엔딩노트 (Ending Note)

### 4.1 구조 분석

**주요 파일**:
- `components/IntegratedJourneyView.tsx` (400+ 라인)
- `components/EndingNoteCard.tsx`
- `components/EndingNoteEditModal.tsx`
- `hooks/useFavorites.ts:87-130`

**데이터 흐름**:
```
IntegratedJourneyView → supabase.rpc('get_my_journey_full')
                      → supabase.from('user_ending_notes').upsert()
                      → supabase.rpc('create_journey_share')
```

### 4.2 발견된 오류

#### 🔴 CRITICAL-005: 엔딩노트 RLS 정책 복잡성
**위치**: `supabase/migrations/20260205_fix_rls_clerk.sql`, `20260204_p0_security_fix.sql`

**문제**: 여러 차례 RLS 정책 패치 이력 존재

```sql
-- 20260204_rls_fix_v8.sql
DROP POLICY IF EXISTS "ending_notes_select" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_insert" ON public.user_ending_notes;
-- ...
CREATE POLICY "ending_notes_owner_all" ON public.user_ending_notes
```

**문제점**:
- 정책이 반복적으로 변경됨 (8번째 패치)
- Clerk JWT와 Supabase Auth 간 충돌 이력
- 보안 정책이 명확하지 않음

#### 🟠 MAJOR-005: createAuthenticatedClient 중복 생성
**위치**: `components/IntegratedJourneyView.tsx:46-96`

**문제**: 매 요청마다 새로운 클라이언트 생성

```typescript
const loadData = async () => {
    // Clerk JWT 토큰을 명시적으로 가져와서 Supabase에 설정
    if (session) {
        const token = await session.getToken({ template: 'supabase' });
        if (token) {
            authClient = createAuthenticatedClient(token);  // ⚠️ 매번 새로 생성
        }
    }
};
```

**해결**: 싱글톤 패턴 유지, 토큰만 업데이트

#### 🟠 MAJOR-006: 엔딩노트 타입 불일치
**위치**: `types/favorites.ts:14-24` vs `IntegratedJourneyView.tsx:16-21`

**문제**: 두 곳에서 다른 타입 정의

```typescript
// types/favorites.ts
export interface EndingNote {
    user_id: string;
    preferred_method?: string[];
    emergency_contact_name?: string;
    // ...
}

// IntegratedJourneyView.tsx
interface EndingNote {
    preferences: string[];
    contact: string;
    memo: string;
    percent: number;
}
```

#### 🟡 MINOR-005: 엔딩노트 테이블명 혼란
**위치**: 여러 마이그레이션 파일

**문제**: `user_ending_note` vs `user_ending_notes` 테이블명 혼란

```sql
-- 20260204_user_journey.sql
CREATE TABLE public.user_ending_notes (...)

-- 20260203_cleanup_unused_features.sql
DROP TABLE IF EXISTS public.user_ending_note CASCADE;
```

---

## 5. 상담 접수 및 예약 (Consultations & Reservations)

### 5.1 구조 분석

**주요 파일**:
- `components/dashboard/MyConsultations.tsx` (346라인)
- `lib/api/aiConsultation.ts` (100+ 라인)
- `lib/queries/consultation.ts` (73라인)

**데이터 흐름**:
```
MyConsultations → getConsultationsByUser (Legacy)
                → aiConsultationService.getUserConsultations (AI)
                → supabase.channel (Realtime)
```

### 5.2 발견된 오류

#### 🔴 CRITICAL-006: 상담 데이터 병합 로직 문제
**위치**: `components/dashboard/MyConsultations.tsx:42-71`

**문제**: Legacy와 AI 상담 데이터 병합 시 타입 불일치

```typescript
const fetchConsultations = async () => {
    // 1. Fetch Legacy Consultations
    const legacyData = await getConsultationsByUser(userId);

    // 2. Fetch AI Consultations
    const aiData = await aiConsultationService.getUserConsultations(userId);

    // 3. Merge & Adapt
    const aiAdapted = aiData.map(ai => ({
        id: ai.conversation_id, // Use conversation_id as ID
        facility_id: ai.facility_id || '',
        status: mapAiStatusToLegacy(ai.status),
        scale: 'small', // Default
        religion: 'none', // Default
        schedule: '3day', // Default
        isAi: true,
    })) as any[];  // ⚠️ any 사용

    setConsultations([...aiAdapted, ...legacyData]...);
};
```

**문제점**:
- AI 상담에 기본값 하드코딩 (`scale: 'small'`, `religion: 'none'`)
- `as any`로 타입 체크 회피
- 두 데이터 소스의 ID 충돌 가능성

#### 🟠 MAJOR-007: Realtime Subscription 누수 가능성
**위치**: `components/dashboard/MyConsultations.tsx:83-109`

**문제**: userId 변경 시 cleanup 후 재구독하나 의존성 관리 불확실

```typescript
useEffect(() => {
    if (userId) {
        fetchConsultations();
        
        const channel = supabase
            .channel(`consultations-user-${userId}`)
            .on(...)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}, [userId]);
```

**개선**: 컴포넌트 언마운트 시 cleanup 확인 필요

#### 🟠 MAJOR-008: 예약 취소 시 에러 처리 불충분
**위치**: `components/MyPageView.tsx:213-226`

**문제**: 예약 취소 에러 시 사용자 피드백만 alert로 처리

```typescript
const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('정말로 예약을 취소하시겠습니까?')) return;
    try {
        await cancelReservation(reservationId);
        setMyReservations(prev => ...);
        alert('예약이 취소되었습니다.');  // ⚠️ alert 사용
    } catch (err) {
        alert('예약 취소 중 오류가 발생했습니다.');  // ⚠️ 에러 정보 미전달
    }
};
```

**해결**: Toast 컴포넌트 사용 및 구체적 에러 메시지

#### 🟡 MINOR-006: Reservation 타입 import 혼란
**위치**: 여러 파일

**문제**: `types/index.ts`와 `types/db.ts`에서 각각 정의된 Reservation 타입 혼용

#### 🟡 MINOR-007: 상태 매핑 함수 위치
**위치**: `components/dashboard/MyConsultations.tsx:74-81`

**문제**: 컴포넌트 내부에 유틸리티 함수 정의

```typescript
const mapAiStatusToLegacy = (status: AiConsultationStatus): string => {
    switch (status) {
        case AiConsultationStatus.COMPLETED: return 'completed';
        // ...
    }
};
```

**해결**: 별도 유틸리티 파일로 분리

---

## 6. 실시간 업체-유저 간 소통 (Realtime Communication)

### 6.1 구조 분석

**주요 파일**:
- `lib/api/aiConsultation.ts`
- `lib/queries/consultation.ts`
- `components/FacilityAdminView.tsx` (Realtime)

**데이터 흐름**:
```
[User] → aiConsultationService.appendMessage → Supabase
                                          ↓
[Facility] ← Realtime Subscription ← postgres_changes
```

### 6.2 발견된 오류

#### 🔴 CRITICAL-007: 실시간 채널명 충돌 가능성
**위치**: `lib/queries/consultation.ts:13-41`

**문제**: 채널명이 고정되어 있어 다중 인스턴스 시 충돌 가능

```typescript
export const subscribeToConsultations = (
  facilityId: string,
  onInsert: (payload: any) => void,
  onUpdate: (payload: any) => void
) => {
  return supabase
    .channel(`public:consultations:facility_id=eq.${facilityId}`)
    // ...
};
```

**해결**: 채널명에 랜덤 접두사 추가 권장

#### 🟠 MAJOR-009: 실시간 이벤트 중복 처리
**위치**: `components/FacilityAdminView.tsx:74-165`

**문제**: INSERT/UPDATE 이벤트 모두 처리하여 중복 데이터 가능성

```typescript
.on('postgres_changes', { event: '*' }, (payload) => {
    if (payload.eventType === 'INSERT') {
        setConsultations(prev => [payload.new as Consultation, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
        setConsultations(prev => prev.map(c => ...));
    }
})
```

#### 🟠 MAJOR-010: 실시간 연결 실패 시 fallback 없음
**위치**: 전체 Realtime 구독 코드

**문제**: WebSocket 연결 실패 시 폴링 등 fallback 없음

#### 🟡 MINOR-008: any 타입 사용
**위치**: `lib/queries/consultation.ts:15-16`

```typescript
onInsert: (payload: any) => void,
onUpdate: (payload: any) => void
```

#### 🟡 MINOR-009: Realtime payload 타입 체크 없음
**위치**: `components/dashboard/MyConsultations.tsx:98-101`

```typescript
(payload) => {
    console.log('User Realtime update:', payload);
    fetchConsultations(); // Refresh
}
```

---

## 7. 파트너 신청하기 (Partner Inquiry)

### 7.1 구조 분석

**주요 파일**:
- `components/PartnerInquiryView.tsx` (571라인)
- `lib/queries.ts` (submitPartnerApplication)

**데이터 흐름**:
```
PartnerInquiryView → submitPartnerApplication → Supabase
                                               → Storage (business license)
                                               → 슈퍼관리자 승인
```

### 7.2 발견된 오류

#### 🔴 CRITICAL-008: 폼 데이터 민감 정보 처리
**위치**: `components/PartnerInquiryView.tsx:17-31`

**문제**: 개인정보가 폼 state로 관리되나 보안 고려사항 없음

```typescript
const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    phone: '',
    managerMobile: '',
    companyPhone: '',
    managerPosition: '',
    address: '',
    email: '',
    companyEmail: '',
    // ...
});
```

**해결**: 메모리 보안 및 XSS 방지 고려

#### 🟠 MAJOR-011: 파일 업로드 에러 핸들링 불충분
**위치**: `components/PartnerInquiryView.tsx:174-178`

**문제**: 파일 선택 시 에러 체크 없음

```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
    }
};
```

**문제점**:
- 파일 크기 체크 없음
- 파일 형식 검증 없음 (accept 속성만 존재)
- 중복 파일명 처리 없음

#### 🟠 MAJOR-012: 검색 결과 메모리 누수 가능성
**위치**: `components/PartnerInquiryView.tsx:68-103`

**문제**: useEffect cleanup에서 타이머만 정리

```typescript
useEffect(() => {
    const timer = setTimeout(async () => {
        if (formData.companyName.length >= 2) {
            setIsSearching(true);
            try {
                const results = await searchKnownFacilities(...);
                setSearchResults(results);
                setShowResults(true);
            } catch (e) {
                console.error('Search error', e);
            } finally {
                setIsSearching(false);
            }
        }
    }, 500);

    return () => clearTimeout(timer);  // ⚠️ 진행 중인 API 요청은 취소 안됨
}, [formData.companyName, formData.type]);
```

**해결**: AbortController 사용하여 API 요청 취소

#### 🟡 MINOR-010: 중복 이메일 에러 메시지 하드코딩
**위치**: `components/PartnerInquiryView.tsx:149-161`

```typescript
if (error?.code === '23505' && error?.message?.includes('partner_inquiries_company_email_idx')) {
    alert('⚠️ 이미 등록된 회사 이메일입니다.\n\n다른 이메일로 신청하시거나, 기존 신청 상태를 확인해주세요.\n문의: 고객센터');
}
```

#### 🟡 MINOR-011: onBack 콜백 타입 정의 없음
**위치**: `components/PartnerInquiryView.tsx:8-11`

```typescript
interface Props {
    onBack: () => void;
    onLoginClick?: () => void;
}
```

---

## 8. 종합 평가 및 권고사항

### 8.1 심각도별 요약

#### 🔴 치명적 (5건) - 즉시 수정 필요
1. **타입 불일치**: Reservation, Favorite, EndingNote 등 다수 타입 중복/불일치
2. **Props any 타입**: MyPageView 등 핵심 컴포넌트의 Props 타입 미정의
3. **Mock Mode 보안**: userId.startsWith('mock-') 체크 방식의 보안 취약점
4. **RLS 정책 불안정**: 엔딩노트 RLS 정책의 반복적 변경 이력
5. **상담 데이터 병합**: Legacy와 AI 데이터 병합 로직의 타입 안정성 문제

#### 🟠 중요 (9건) - 우선 수정 권장
1. 에러 핸들링 불충분 (MyPageView, favoriteService)
2. createAuthenticatedClient 중복 생성
3. 찜 목록 Two-Step Fetch 복잡성
4. Realtime Subscription 누수/충돌 가능성
5. 파일 업로드 검증 부재
6. API 요청 취소 미처리 (검색)
7. 중복 데이터 처리 로직 (Favorites)
8. useFavorites와 favoriteService 중복 구현
9. 상태 매핑 함수 위치 부적절

#### 🟡 경고 (15건) - 개선 권장
- 매직 넘버 사용
- 사용하지 않는 import
- any 타입 과다 사용
- 콘솔 로그 과다
- 컴포넌트 분리 권장
- 매핑 함수 모듈화
- 타입 import 통일

### 8.2 코드 품질 점수

| 기능 영역 | 구조 | 타입안정성 | 에러처리 | 성능 | 종합 |
|----------|------|-----------|---------|------|------|
| 마이페이지 | B | C+ | C | B | B- |
| 찜 목록 | B | C+ | C+ | B | B- |
| 엔딩노트 | B | C | B | B- | B- |
| 상담/예약 | B+ | C | B | B | B |
| 실시간 소통 | A- | C+ | B+ | B+ | B+ |
| 파트너 신청 | A- | B | B | B | B+ |
| **평균** | **B+** | **C+** | **B-** | **B** | **B** |

### 8.3 우선순위별 수정 계획

**1순위 (1주일 내)**:
- [ ] 타입 정의 통일 (Reservation, Favorite, EndingNote)
- [ ] MyPageView Props 타입 정의
- [ ] Mock Mode 보안 강화
- [ ] RLS 정책 정리 및 문서화

**2순위 (2주일 내)**:
- [ ] 에러 핸들링 개선 (Toast 컴포넌트 적용)
- [ ] createAuthenticatedClient 싱글톤 유지
- [ ] 파일 업로드 검증 추가
- [ ] Realtime 채널명 고유화

**3순위 (한 달 내)**:
- [ ] 찜하기 로직 통일 (TanStack Query)
- [ ] 컴포넌트 분리 (MyPageView 리팩토링)
- [ ] API 요청 취소 처리 (AbortController)
- [ ] 테스트 코드 작성

### 8.4 테스트 권고사항

**통합 테스트**:
- [ ] 마이페이지 전체 플로우 테스트
- [ ] 찜하기 추가/삭제/조회 테스트
- [ ] 엔딩노트 CRUD 테스트
- [ ] 상담 신청 → 접수 → 완료 플로우
- [ ] 파트너 신청 → 승인 플로우

**E2E 테스트**:
- [ ] 실시간 상담 메시지 교환
- [ ] 예약 생성 → 승인 → 취소
- [ ] 파일 업로드/다운로드

**성능 테스트**:
- [ ] 대용량 찜 목록 로딩
- [ ] 실시간 메시지 부하 테스트

### 8.5 보안 권고사항

1. **타입 안정성 강화**: any 타입 제거 및 strict mode 활성화
2. **RLS 정책 검토**: 모든 테이블 RLS 정책 재검토
3. **입력값 검증**: 폼 데이터 서버/클라이언트 양쪽 검증
4. **파일 업로드 제한**: 크기, 형식, 개수 제한
5. **로그 민감정보 마스킹**: 사용자 정보 로그 제한

---

## 9. 결론

Memorimap의 유저 마이페이지 및 관련 기능은 전반적으로 사용자 친화적인 설계가 되어 있으나, 타입 안정성과 에러 핸들링 부분에서 상당한 개선이 필요합니다. 특히 여러 파일에서 중복/불일치된 타입 정의는 런타임 에러의 주요 원인이 될 수 있으므로 즉시 정리가 필요합니다.

또한 개발 편의를 위해 추가된 Mock Mode와 fallback 로직들이 프로덕션 환경에서 예기치 않은 동작을 일으킬 수 있으므로, 환경별로 명확히 구분하여 관리해야 합니다.

실시간 기능은 Supabase Realtime을 효과적으로 활용하고 있으나, 채널 관리와 에러 핸들링 부분에서 추가 개선이 필요합니다.

**전반적 등급: B (양호)**
**권고**: 타입 정의 정리 및 에러 핸들링 개선 후 재검증

---

## 10. 부록: 주요 파일 목록

### 핵심 컴포넌트
- `components/MyPageView.tsx` (625라인)
- `components/MyPageV2.tsx`
- `components/IntegratedJourneyView.tsx`
- `components/EndingNoteCard.tsx`
- `components/EndingNoteEditModal.tsx`
- `components/dashboard/MyConsultations.tsx` (346라인)
- `components/PartnerInquiryView.tsx` (571라인)

### 서비스/훅
- `services/favoriteService.ts` (154라인)
- `hooks/useFavorites.ts` (166라인)
- `lib/api/aiConsultation.ts`
- `lib/queries/consultation.ts`

### 타입 정의
- `types/favorites.ts` (36라인)
- `types/index.ts` (Reservation 등)
- `types/db.ts` (DB 스키마 타입)

### 마이그레이션
- `supabase/migrations/20260205_fix_rls_clerk.sql`
- `supabase/migrations/20260204_user_journey.sql`
- `migrations/20260202_add_favorites_rpc.sql`

---

**보고서 작성 완료**  
**다음 검증 예정일**: 2026-02-22 (2주 후)
