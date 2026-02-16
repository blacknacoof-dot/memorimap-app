# Memorimap 프로젝트

## 토큰 절약 필수 규칙 (항상 적용)
- 코드 탐색 최소화: 이미 아는 파일은 다시 읽지 않기
- 응답은 짧고 핵심만. 불필요한 설명/반복 금지
- 여러 작업이라도 한 번에 병렬 처리 (독립적인 수정은 동시에)
- 파일 전체 읽기 대신 필요한 부분만 offset/limit으로 읽기
- 중간 확인 질문 최소화. 명확하면 바로 실행

## 완료
- [x] 슈퍼관리자 이메일 하드코딩 보안 수정
- [x] MyPage V1/V2 중복 통합
- [x] FacilityAdmin 레거시/신규 중복 정리
- [x] 엔딩노트 편집 버튼 연결
- [x] window.location.reload() 제거
- [x] 매출분석/구독관리 실데이터 연결
- [x] 빌드 성공 (P0)
- [x] 알림 개선 (P1)
- [x] 상조 서비스 분류/이미지/가격 (P2)
- [x] 성능 최적화 (P3)
- [x] DB 마이그레이션 `20260216_launch_readiness.sql` 작성/실행
- [x] is_super_admin 오버로드, partners.id DEFAULT, approve_partner_transaction 타입 수정
- [x] 상조 타입 매핑 수정 (`'상조'→'sangjo'` TYPE_MAP 추가)
- [x] PetChat DOMPurify JSX 텍스트 버그 제거
- [x] 예약 스텝 3→4 전환 오류 수정 (defaultValues 추가)
- [x] 이미지 업로드 교체 버튼 추가 (메인+갤러리)
- [x] FAQ 저장→목록 미반영 수정 (upsert→insert/update 분리)
- [x] 파트너 승인 흐름 코드 수정 (PartnerAdmissions, superAdmin API, sangjoQueries)
- [x] E2E 테스트 시나리오 문서 작성 (`docs/E2E_TEST_SCENARIOS.md`)
- [x] 검증 SQL 작성 (`scripts/verify_launch_readiness.sql`)

## 남은 작업
### 출시 전 E2E 검증 (수동 테스트)
- [ ] 슈퍼관리자 파트너 승인 E2E (코드 완료, 실 테스트 필요)
- [ ] 상조 관리자 대시보드 예약/상담 표시 확인
- [ ] 상조 대시보드 구독/매출 확인
- [ ] 요금제 체계 검증
- [ ] 모바일 UI 점검
- [ ] 시설별 대시보드 (장례/동물/추모/수목/공원) 확인
- [ ] 마이페이지 검증
- [ ] Edge Function `approve-partner` 재배포 (Supabase Dashboard)
- [ ] 최종 빌드 + 배포
