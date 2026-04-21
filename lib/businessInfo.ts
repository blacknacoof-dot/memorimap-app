export const BUSINESS_INFO = {
  serviceName: '메모리맵',
  operatorName: '(주)아톰케어',
  representative: '박태용',
  registrationNumber: '576-87-02748',
  address: '경기 고양시 일산동구 탄중로 421 웅산프라자 3층 305-1호',
  supportPhone: '031-975-3335',
  supportEmail: 'atomcare@naver.com',
  faxNumber: '0504-336-4569',
  ecommerceRegistration: '2024-고양일산동-0025',
  businessHours: '평일 09:00 ~ 18:00',
} as const;

export const BUSINESS_REVIEW_FIELDS = [
  `상호: ${BUSINESS_INFO.operatorName}`,
  `대표자명: ${BUSINESS_INFO.representative}`,
  `사업자등록번호: ${BUSINESS_INFO.registrationNumber}`,
  `사업장 주소: ${BUSINESS_INFO.address}`,
  `고객센터: ${BUSINESS_INFO.supportPhone}`,
  `이메일: ${BUSINESS_INFO.supportEmail}`,
  `통신판매업신고: ${BUSINESS_INFO.ecommerceRegistration}`,
] as const;
