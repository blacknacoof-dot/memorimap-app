# 상조회사 서비스 구성 및 시설 자료 정리 작업계획

## 📊 현황 분석

### 상조 데이터 구조

```typescript
interface FuneralCompany {
  id: string;
  name: string;                    // 업첼명
  rating: number;                  // 평점
  reviewCount: number;             // 리뷰 수
  imageUrl: string;                // 대표 이미지
  description: string;             // 업체 설명
  features: string[];              // 주요 특징
  phone: string;                   // 연락처
  priceRange: string;              // 가격대
  benefits: string[];              // 혜택/할인
  galleryImages?: string[];        // 갤러리 이미지
  products?: SangjoProduct[];      // 상조 상품 목록
  specialties?: string[];          // 특화 서비스
  supportPrograms?: string[];      // 정부 지원 프로그램
  ai_tone?: AiTone;               // AI 말투 설정
  ai_welcome_message?: string;     // AI 첫인사
  ai_context?: string;            // AI 상담 지식
  ai_price_summary?: Record;       // AI 학습용 가격
}

interface SangjoProduct {
  id: string;
  name: string;                    // 상품명
  price: number;                   // 가격
  tagline: string;                 // 홍보 문구
  description: string;             // 상품 설명
  serviceDetails: ServiceDetail[]; // 카테고리별 상세 서비스
  includedServices: string[];      // 포함 서비스
  optionalServices: string[];      // 선택 서비스
  distinguishingFeatures?: string[]; // 차별화 특징
  faq?: Array<{ q: string; a: string }>; // 상품별 FAQ
}
```

### 등록된 상조회사 현황 (constants.ts 기준)

| 상조회사명 | 로고 이미지 | 설명 | 상태 |
|-----------|------------|------|------|
| 프리드라이프상조 | ✅ | 대한민국 선수금 1위 | 완료 |
| 교원라이프 | ✅ | 교원그룹의 신뢰 | 완료 |
| 예다함상조 | ✅ | 한국교직원공제회 연대보증 | 완료 |
| 본인한눈에 | ✅ | 실속형 후불제 | 완료 |
| 본인코코상조 | ✅ | 조선미디어그룹 보증 | 완료 |
| 본인상조 | ✅ | 실속형 후불제 | 완료 |
| 본인상조개발 | ✅ | 30년 전통 | 완료 |
| 본인상조라이프 | ✅ | - | 완료 |
| 본인상조리더스 | ✅ | - | 완료 |
| 본인상조피플 | ✅ | - | 완료 |
| 효원상조 | ⚠️ | 설명 부재 | 미완 |
| SJ산림조합상조 | ⚠️ | 설명 부재 | 미완 |
| 본인상조애니콜 | ✅ | - | 완료 |
| 한라상조 | ⚠️ | 설명 부재 | 미완 |
| 본인상조실로암 | ✅ | - | 완료 |
| 크리스찬상조 | ⚠️ | 설명 부재 | 미완 |
| 보훈상조 | ⚠️ | 설명 부재 | 미완 |
| 불교조상조 | ✅ | - | 완료 |
| 우리제주상조 | ✅ | 지역 상조 | 완료 |

### 주요 문제점

1. **상품 정보 부재**: 대부분의 상조회사에 상품(products) 데이터 없음
2. **설명 문구 동일화**: "믿을 수 있는 상조 서비스" 반복 사용 (15개 이상)
3. **AI 설정 미비**: ai_tone, ai_welcome_message, ai_context 설정 안 된 업체 다수
4. **서비스 상세 정보 부재**: serviceDetails, includedServices 등 구체적 서비스 내역 없음
5. **이미지 품질 불균일**: 일부는 로컬, 일부는 Supabase Storage, 일부는 누락

---

## 🎯 작업 목표

### Phase 1: 기본 정보 정비 (1주)
- [ ] 업첼별 고유 설명 문구 작성 (중복 제거)
- [ ] 누락된 로고 이미지 확보 및 등록
- [ ] 연락처/홈페이지 정보 검증

### Phase 2: 상품 데이터 구축 (2-3주)
- [ ] 주요 상조회사별 상품 정보 수집
- [ ] 상품별 가격/서비스 내역 정리
- [ ] 상품별 FAQ 구성

### Phase 3: AI 상담 데이터 설정 (1-2주)
- [ ] AI 말톤 설정 (warm/polite/factual)
- [ ] AI 환영 메시지 작성
- [ ] AI 학습용 상담 지식 구축

### Phase 4: 서비스 상세 정보 구축 (2주)
- [ ] 차별화 특징 정리
- [ ] 포함/선택 서비스 명세
- [ ] 갤러리 이미지 확보

---

## 🔍 데이터 수집 방법론

### 1. 공식 홈페이지 크롤링

#### 대상 상조회사 홈페이지
| 상조회사 | 홈페이지 | 수집 가능 데이터 |
|----------|----------|-----------------|
| 프리드라이프상조 | www.freedlife.co.kr | 상품, 가격, 서비스 |
| 교원라이프 | www.kyowonlife.co.kr | 상품, 혜택, 지점 |
| 예다함상조 | www.yedahm.com | 상품, 특징, FAQ |
| 본인상조 | www.boramsangjo.co.kr | 상품, 가격, 서비스 |
| 본인상조개발 | www.boramdev.co.kr | 상품, 특징 |

#### 크롤링 전략
```python
# 상조회사 홈페이지 크롤러
class SangjoCrawler:
    def extract_products(self, url):
        # 1. 상품 목록 페이지 접근
        # 2. 상품명, 가격, 특징 추출
        # 3. 상세 페이지에서 서비스 내역 수집
        pass
    
    def extract_services(self, product_url):
        # 1. 포함 서비스 목록
        # 2. 선택 서비스 목록
        # 3. 차별화 특징
        pass
```

### 2. 공정거래위원회 공공데이터 활용

**상조업체 등록 정보 API**
- URL: https://www.data.go.kr/data/15051027/fileData.do
- 제공 데이터: 업첼명, 등록번호, 대표자, 주소, 연락처
- 활용: 업체 기본 정보 검증 및 누락 정보 보충

### 3. 플레이스(네이버/카카오) 데이터 수집

#### 수집 대상
- **리뷰 데이터**: 실제 이용 고객 후기
- **별점**: 평점 정보
- **사진**: 시설/장례식장 사진
- **운영 정보**: 영업시간, 주차, 편의시설

#### 수집 방법
```javascript
// 네이버 플레이스 API 활용
const searchSangjoOnNaver = async (companyName) => {
  const query = `${companyName} 상조`;
  const results = await naverPlace.search(query);
  
  return results.map(place => ({
    name: place.name,
    rating: place.rating,
    reviewCount: place.reviewCount,
    photos: place.photos,
    phone: place.phone,
    address: place.address
  }));
};
```

### 4. AI 학습 데이터 구축

#### AI 상담 지식 구성
```typescript
const aiContextTemplate = {
  companyOverview: "업체 소개 및 특징",
  mainProducts: [
    { name: "상품명", price: "가격", features: ["특징1", "특징2"] }
  ],
  serviceAreas: ["서비스 지역1", "서비스 지역2"],
  strengths: ["강점1", "강점2", "강점3"],
  customerSupport: "고객 지원 방식",
  priceCompetitiveness: "가격 경쟁력 설명",
  uniqueFeatures: "차별화 요소"
};
```

---

## 📋 상세 작업 계획

### Week 1: 기본 정보 정비

#### 작업 1: 설명 문구 개선
**현재 문제**: "믿을 수 있는 상조 서비스" 15개 이상 중복

**개선 방향**:
```typescript
// Before
{ name: '효원상조', description: '믿을 수 있는 상조 서비스' }

// After
{ 
  name: '효원상조', 
  description: '전통과 신뢰를 바탕으로 한 효원상조는 합리적인 가격과 정직한 서비스로 고객 만족을 실현합니다. 전국 네트워크를 통해 어디서나 품격 있는 장례 서비스를 제공합니다.',
  features: ['합리적인 가격', '전국 네트워크', '24시 장례 지원']
}
```

**산출물**: `sangjo_descriptions.json`

#### 작업 2: 누락 이미지 확보
- [ ] 효원상조 로고 이미지 확보
- [ ] SJ산림조합상조 로고 이미지 확보
- [ ] 한라상조 로고 이미지 확보
- [ ] 크리스찬상조 로고 이미지 확보
- [ ] 보훈상조 로고 이미지 확보

**이미지 규격**:
- 크기: 400x400px (정사각형)
- 형식: JPG 또는 PNG
- 배경: 흰색 또는 투명

**산출물**: `sangjo_logos/` 폴더

### Week 2-3: 상품 데이터 수집

#### 작업 1: 프리드라이프상조 상품 수집
**대표 상품** (예시):
```typescript
{
  id: 'freedlife-premium',
  name: '프리미엄 400',
  price: 4000000,
  tagline: '품격 있는 마지막 가시는 길',
  description: '고급 수의, 최고급 관, 전문 장례지도사 동행',
  serviceDetails: [
    {
      category: '장례 용품',
      items: ['고급 수의', '최고급 관', '제단 꽃장식'],
      notes: '모든 용품 포함'
    },
    {
      category: '장례 지도',
      items: ['전문 장례지도사', '1:1 맞춤 서비스'],
      notes: '24시간 상주'
    }
  ],
  includedServices: ['장례식장 대관', '고인 운구', '화장/매장 지원'],
  optionalServices: ['호화 영결식', '특별 수의', '추가 장식'],
  distinguishingFeatures: ['선수금 1위', '전국 300개 지점', 'VIP 라운지'],
  faq: [
    { q: '환불은 가능한가요?', a: '계약 후 7일 이내 전액 환불 가능합니다.' },
    { q: '지방에서도 이용 가능한가요?', a: '전국 어디서나 동일한 서비스로 이용 가능합니다.' }
  ]
}
```

#### 작업 2: 교원라이프 상품 수집
#### 작업 3: 예다함상조 상품 수집
#### 작업 4: 본인상조 계열사 통합 상품 수집

**산출물**: `sangjo_products.json`

### Week 4-5: AI 상담 데이터 설정

#### 작업 1: AI 말톤 설정
```typescript
const aiToneSettings: Record<string, AiTone> = {
  '프리드라이프상조': 'warm',      // 따뜻하고 공감하는 말톤
  '교원라이프': 'polite',          // 정중하고 격식 있는 말톤
  '예다함상조': 'warm',            // 친근하고 따뜻한 말톤
  '본인상조': 'factual',           // 객관적이고 정확한 말톤
  '본인상조개발': 'factual'
};
```

#### 작업 2: AI 환영 메시지 작성
```typescript
const welcomeMessages: Record<string, string> = {
  '프리드라이프상조': '안녕하세요. 프리드라이프상조입니다. 대한민국 선수금 1위, 가장 많은 고객님이 선택한 프리미엄 상조 서비스로 정성을 다해 모시겠습니다. 장례 준비나 상조 가입에 대해 궁금하신 점이 있으시면 편하게 문의해 주세요.',
  
  '교원라이프': '안녕하세요. 교원라이프입니다. 교원그룹의 신뢰를 바탕으로 한 고품격 상조 서비스로 정성껏 모시겠습니다. 상조 상품이나 서비스에 대해 문의하실 점이 있으시면 말씀해 주세요.'
};
```

#### 작업 3: AI 학습용 지식 구축
```typescript
const aiContexts: Record<string, string> = {
  '프리드라이프상조': `
    프리드라이프상조는 대한민국 선수금 1위 상조회사입니다.
    
    [주요 상품]
    - 프리미엄 400: 400만원대 고급 상품
    - 스탠다드 300: 300만원대 실속 상품
    - 베이직 200: 200만원대 경제 상품
    
    [강점]
    - 전국 300개 이상 지점 보유
    - 24시간 장례 지원 시스템
    - VIP 전용 라운지 운영
    - 전문 장례지도사 배정
    
    [차별화 요소]
    - 선수금 1위 브랜드 파워
    - 고급 수의/관 기본 제공
    - 전국 네트워크로 어디서나 이용 가능
    
    [자주 묻는 질문]
    Q: 환불 정책은?
    A: 계약 후 7일 이내 전액 환불, 이후에는 공정거래위원회 기준에 따름
    
    Q: 지방 장례도 가능?
    A: 전국 어디서나 동일한 서비스 제공
  `
};
```

**산출물**: `sangjo_ai_config.json`

### Week 6: 서비스 상세 정보 구축

#### 작업 1: 차별화 특징 정리
```typescript
const distinguishingFeatures: Record<string, string[]> = {
  '프리드라이프상조': [
    '선수금 1위 브랜드',
    '전국 300개 지점',
    'VIP 전용 라운지',
    '프리미엄 수의/관 기본 제공'
  ],
  '교원라이프': [
    '교원그룹 계열 신뢰성',
    '교원 멤버십 혜택',
    '전문 장례 상담사',
    '온라인 계약 시스템'
  ]
};
```

#### 작업 2: 갤러리 이미지 확보
- [ ] 각 상조회사별 시설/장례식장 이미지 5-10장 확보
- [ ] 실제 장례 행사 이미지 (고객 동의 하에)
- [ ] 상품별 제공 용품 이미지

**이미지 규격**:
- 크기: 1200x800px
- 형식: JPG, WebP
- 용량: 200KB 이하 (최적화)

**산출물**: Supabase Storage `/facility-images/sangjo/[company-name]/`

---

## 🛠️ 도구 및 스택

### 데이터 수집 도구
```bash
# 필요한 패키지
pip install requests beautifulsoup4 selenium pandas
npm install puppeteer cheerio axios
```

### 스크립트 구조
```
scripts/
├── sangjo/
│   ├── crawlers/
│   │   ├── freedlife_crawler.py
│   │   ├── kyowon_crawler.py
│   │   ├── yedahm_crawler.py
│   │   └── boram_crawler.py
│   ├── processors/
│   │   ├── product_parser.py
│   │   ├── image_downloader.py
│   │   └── ai_context_builder.py
│   ├── validators/
│   │   ├── data_validator.py
│   │   └── image_checker.py
│   └── importers/
│       ├── import_products.ts
│       ├── import_ai_config.ts
│       └── update_companies.ts
└── data/
    ├── sangjo_companies.json
    ├── sangjo_products.json
    └── sangjo_ai_config.json
```

---

## 📈 성과 지표 (KPI)

| 지표 | 현재 | 목표 | 기한 |
|------|------|------|------|
| **상품 등록률** | 20% | 100% (주요 5개사) | 3주 |
| **설명 문구 품질** | 30% | 100% (고유 문구) | 1주 |
| **AI 설정 완료율** | 10% | 100% | 2주 |
| **이미지 확보율** | 75% | 100% | 1주 |
| **서비스 상세 정보** | 10% | 80% | 4주 |

---

## ⚠️ 주의사항 및 법적 고려사항

### 1. 가격 정보 표기
- **공정거래위원회 기준 준수**: 표시광고법 위반 주의
- **실제 가격과 동일**: 크롤링한 가격이 실제와 다를 수 있으므로 검증 필요
- **부가세 표기**: 가격에 부가세 포함 여부 명확히 표기

### 2. 저작권
- **로고 이미지**: 각 상조회사 공식 로고 사용 시 저작권 확인
- **시설 이미지**: 상조회사로부터 사용 허가 받은 이미지만 사용
- **홈페이지 크롤링**: robots.txt 준수, 상업적 이용 제한 확인

### 3. 개인정보
- **고객 리뷰**: 실명 노출 시 개인정보 보호법 주의
- **장례 사진**: 고객 동의 없이 사용 금지

---

## 🚀 즉시 실행 가능한 작업

### 오늘 바로 시작할 수 있는 작업:

1. **설명 문구 개선**
   ```bash
   # constants.ts에서 중복 설명 찾기
   grep -n "믿을 수 있는 상조 서비스" constants.ts
   
   # 설명 문구 일괄 수정
   node scripts/sangjo/update_descriptions.js
   ```

2. **이미지 누락 확인**
   ```bash
   # 로고 이미지 없는 업체 목록 추출
   node scripts/sangjo/check_missing_images.js
   ```

3. **상품 데이터 수집 테스트**
   ```bash
   # 프리드라이프상조 크롤링 테스트
   python scripts/sangjo/crawlers/freedlife_crawler.py --dry-run
   ```

---

## 📞 상조회사 연락처 정보 수집

### 공식 홈페이지 및 연락처

| 상조회사 | 홈페이지 | 대표번호 | 이메일 |
|----------|----------|----------|--------|
| 프리드라이프상조 | www.freedlife.co.kr | 1588-0000 | cs@freedlife.co.kr |
| 교원라이프 | www.kyowonlife.co.kr | 1588-0000 | help@kyowonlife.co.kr |
| 예다함상조 | www.yedahm.com | 1588-0000 | support@yedahm.com |
| 본인상조 | www.boramsangjo.co.kr | 1588-0000 | info@boramsangjo.co.kr |
| 본인상조개발 | www.boramdev.co.kr | 1588-0000 | contact@boramdev.co.kr |

**수집 방법**:
1. 각 홈페이지 방문
2. 고객센터 연락처 확인
3. 공식 이메일 수집
4. constants.ts 업데이트

---

## 📎 참고 문서

- [상조정보공개서비스](https://www.sangjo.go.kr) - 공정거래위원회
- [상조업법](https://www.law.go.kr) - 국가법령정보센터
- [Memorimap 상조 데이터 구조](../types/index.ts)
- [상조회사 constants](../constants.ts)

---

## 📝 작업 일지 템플릿

```markdown
## YYYY-MM-DD 작업일지

### 완료된 작업
- [ ] 작업 항목 1
- [ ] 작업 항목 2

### 수집된 데이터
- 업첼명: XXX
- 상품 수: X개
- 이미지 수: X장

### 이슈 및 해결
- 이슈: XXX
- 해결: XXX

### 다음 작업
- [ ] 다음 작업 1
- [ ] 다음 작업 2
```

---

**작성일**: 2026-02-12  
**작성자**: AI Assistant  
**목표 완료일**: 2026-03-26 (6주)
