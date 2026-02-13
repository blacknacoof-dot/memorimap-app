# 동물장례 PetSearchForm 수정 계획

## 발견된 문제점

### 1. ConsultationForm mode 불일치 (치명적)
- **위치**: `components/AI/PetSearchForm.tsx:246`
- **현재**: `mode="urgent"` → 장례식장 긴급 출동 폼 표시 (고인 정보, 앰뷸런스 등)
- **원인**: ConsultationForm에 이미 `isPetCompany = company.id.startsWith('pet_')` 분기가 있어 pet 전용 필드(아이 종류/이름/몸무게/방문일시/메모리얼 스톤)를 표시하지만, `mode="urgent"`일 때는 이 분기를 무시하고 긴급 출동 UI를 렌더링
- **수정**: `mode="urgent"` → `mode="phone"`

### 2. 예약 버튼 색상 불일치 (경미)
- **위치**: `components/AI/PetSearchForm.tsx:293`
- **현재**: `bg-red-600` (빨간색 긴급 스타일)
- **수정**: `bg-orange-500` (Pet 테마 오렌지)

## 수정 범위
- `components/AI/PetSearchForm.tsx` 2줄 변경
