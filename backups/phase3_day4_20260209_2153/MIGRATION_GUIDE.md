# Phase 2: Supabase Migration Guide

## 📋 준비사항

### 1. Supabase 프로젝트 설정 확인
- Supabase 대시보드에 로그인
- 프로젝트 URL과 Anon Key 확인
- `.env.local` 파일에 설정되어 있는지 확인

### 2. 필요한 패키지 설치
```bash
npm install tsx --save-dev
```

## 🚀 마이그레이션 실행 단계

### Step 1: 스키마 생성
Supabase 대시보드의 SQL Editor에서 `supabase_migration_schema.sql` 실행

1. Supabase Dashboard → SQL Editor
2. `supabase_migration_schema.sql` 파일 내용 복사
3. "Run" 버튼 클릭
4. 성공 메시지 확인

### Step 2: 데이터 마이그레이션
터미널에서 마이그레이션 스크립트 실행:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

예상 출력:
```
🚀 Starting Supabase data migration...

🏛️  Migrating facilities to Supabase...
✅ Successfully migrated 20 facilities

🏢 Migrating funeral companies to Supabase...
✅ Successfully migrated 10 funeral companies

🔍 Verifying migration...
📊 Total facilities in DB: 20
📊 Total funeral companies in DB: 10

🎉 Migration completed successfully!
```

### Step 3: 검증
1. Supabase Dashboard → Table Editor
2. `memorial_spaces` 테이블 확인 (20개 행)
3. `funeral_companies` 테이블 확인 (10개 행)

### Step 4: 앱 테스트
1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 앱 열기
3. 콘솔에서 "최신 시설 정보를 불러왔습니다" 메시지 확인
4. 지도/목록에서 20개 시설 표시 확인

## 🔧 트러블슈팅

### 문제: "Permission denied" 에러
**해결**: Supabase RLS 정책 확인
- SQL Editor에서 정책이 제대로 생성되었는지 확인
- 필요시 RLS 임시 비활성화 후 테스트

### 문제: 마이그레이션 스크립트 실행 실패
**해결**: 
```bash
# tsx가 없는 경우
npm install tsx --save-dev

# 또는 ts-node 사용
npm install ts-node --save-dev
npx ts-node scripts/migrate-to-supabase.ts
```

### 문제: 데이터가 중복으로 들어감
**해결**: 
- `upsert` 사용으로 중복 방지됨
- 필요시 테이블 초기화:
```sql
DELETE FROM memorial_spaces;
DELETE FROM funeral_companies;
```

## ✅ 완료 체크리스트

- [ ] Supabase 스키마 생성 완료
- [ ] 20개 시설 데이터 업로드 완료
- [ ] 10개 장례업체 데이터 업로드 완료
- [ ] 웹에서 Supabase 데이터 로딩 확인
- [ ] 필터/검색 기능 정상 작동 확인

## 🎯 다음 단계 (선택사항)

### 관리자 페이지에서 CRUD 구현
- 시설 추가/수정/삭제 기능
- 장례업체 관리 기능

### 성능 최적화
- React Query 또는 SWR 도입
- 페이지네이션 구현
- 이미지 최적화

### constants.ts 정리
- Supabase 마이그레이션 완료 후
- `constants.ts`는 타입 정의와 샘플 데이터만 유지
- 또는 완전히 제거하고 Supabase를 Single Source of Truth로 사용
