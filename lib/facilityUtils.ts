import { Facility } from '../types';

const DESCRIPTION_PENDING_TEXT = '상세 소개 준비 중입니다.';

const STRONG_TEMPLATE_DESCRIPTION_PATTERNS = [
    /고품격\s*시설입니다/,
    /위치한\s*(?:고품격\s*)?시설입니다/,
    /관리되는\s*시설입니다/,
    /지역에\s*위치한/,
];

const SOFT_TEMPLATE_DESCRIPTION_PATTERNS = [
    /자연과\s*(?:함께|하나 되는)\s*공간/,
    /맑은\s*공기와\s*따뜻한\s*햇살/,
    /품격\s*있는\s*시설과\s*정성\s*어린\s*서비스/,
    /마음까지\s*치유되는\s*힐링의\s*공간/,
    /프리미엄\s*(?:복합추모시설|봉안당|시설)/,
    /최고의\s*(?:안식|추모\s*공간)/,
];

const REGION_PATTERNS: Array<[string, RegExp]> = [
    ['경기', /(경기도?\s+광주시|경기\s+광주시)/],
    ['광주', /(광주광역시|광주\s+(?:북구|서구|남구|동구|광산구))/],
    ['서울', /(서울특별시|서울시|서울\s|서울$)/],
    ['부산', /(부산광역시|부산시|부산\s|부산$)/],
    ['대구', /(대구광역시|대구시|대구\s|대구$)/],
    ['인천', /(인천광역시|인천시|인천\s|인천$)/],
    ['대전', /(대전광역시|대전시|대전\s|대전$)/],
    ['울산', /(울산광역시|울산시|울산\s|울산$)/],
    ['세종', /(세종특별자치시|세종시|세종\s|세종$)/],
    ['경기', /(경기도|경기\s|경기$)/],
    ['강원', /(강원특별자치도|강원도|강원\s|강원$)/],
    ['충북', /(충청북도|충북\s|충북$)/],
    ['충남', /(충청남도|충남\s|충남$)/],
    ['전북', /(전북특별자치도|전라북도|전북\s|전북$)/],
    ['전남', /(전라남도|전남\s|전남$)/],
    ['경북', /(경상북도|경북\s|경북$)/],
    ['경남', /(경상남도|경남\s|경남$)/],
    ['제주', /(제주특별자치도|제주도|제주\s|제주$)/],
];

const PET_TEXT_PATTERN = /(반려동물|동물장례|강아지|고양이|펫|pet)/i;

function normalizeFacilityType(facility: Facility): string {
    const rawType = String(facility.type || facility.category || '').toLowerCase();
    if ([
        'pet',
        'pet_funeral',
        'pet_memorial',
        '동물장례',
        '반려동물',
        '펫장례',
        '펫추모',
        '동물추모',
        '반려동물장례',
        '반려동물추모',
    ].includes(rawType)) return 'pet';
    if (['funeral', 'funeral_home', 'funeral_hall'].includes(rawType)) return 'funeral';
    if (['charnel', 'columbarium', 'charnel_house', 'memorial'].includes(rawType)) return 'charnel';
    if (['natural', 'natural_burial', 'tree_burial'].includes(rawType)) return 'natural';
    if (['park', 'cemetery', 'park_cemetery', 'complex'].includes(rawType)) return 'park';
    if (['sea', 'sea_burial'].includes(rawType)) return 'sea';
    return rawType;
}

function getRegionFromAddress(address?: string): string {
    const trimmed = address?.trim() || '';
    if (/^경기도?\s+광주시|^경기\s+광주시/.test(trimmed)) return '경기';
    if (/^광주광역시|^광주\s+(?:북구|서구|남구|동구|광산구)/.test(trimmed)) return '광주';

    const firstToken = trimmed.split(/\s+/)[0] || '';
    if (/^서울/.test(firstToken)) return '서울';
    if (/^부산/.test(firstToken)) return '부산';
    if (/^대구/.test(firstToken)) return '대구';
    if (/^인천/.test(firstToken)) return '인천';
    if (/^광주/.test(firstToken)) return '광주';
    if (/^대전/.test(firstToken)) return '대전';
    if (/^울산/.test(firstToken)) return '울산';
    if (/^세종/.test(firstToken)) return '세종';
    if (/^경기/.test(firstToken)) return '경기';
    if (/^강원/.test(firstToken)) return '강원';
    if (/^충청북도|^충북/.test(firstToken)) return '충북';
    if (/^충청남도|^충남/.test(firstToken)) return '충남';
    if (/^전북특별자치도|^전라북도|^전북/.test(firstToken)) return '전북';
    if (/^전라남도|^전남/.test(firstToken)) return '전남';
    if (/^경상북도|^경북/.test(firstToken)) return '경북';
    if (/^경상남도|^경남/.test(firstToken)) return '경남';
    if (/^제주/.test(firstToken)) return '제주';
    return '';
}

function getRegionsFromDescription(description: string): string[] {
    return REGION_PATTERNS
        .filter(([, pattern]) => pattern.test(description))
        .map(([region]) => region);
}

function descriptionConflictsWithCategory(description: string, facility: Facility): boolean {
    const type = normalizeFacilityType(facility);
    const hasFuneral = /(?:장례식장|장례문화원|병원장례)\s*(?:입니다|시설입니다|전문\s*시설입니다)/.test(description);
    const hasCharnel = /(?:봉안당|납골당|봉안시설|추모관)\s*(?:입니다|시설입니다|전문\s*시설입니다)/.test(description);
    const hasNatural = /(?:수목장|자연장|자연장지)\s*(?:입니다|시설입니다|전문\s*시설입니다)/.test(description);
    const hasCemetery = /(?:공원묘지|묘원|묘지|추모공원)\s*(?:입니다|시설입니다|전문\s*시설입니다)/.test(description);
    const hasPet = /(?:동물장례|반려동물\s*장례|펫장례)\s*(?:입니다|시설입니다|전문\s*시설입니다|전문\s*시설)/.test(description);
    const hasSea = /(?:해양장|바다장)\s*(?:입니다|시설입니다|전문\s*시설입니다)/.test(description);

    if (type !== 'funeral' && hasFuneral) return true;
    if (type !== 'charnel' && hasCharnel) return true;
    if (type !== 'natural' && hasNatural) return true;
    if (!['park', 'charnel', 'natural'].includes(type) && hasCemetery) return true;
    if (type !== 'pet' && hasPet) return true;
    if (type !== 'sea' && hasSea) return true;
    return false;
}

function shouldHideFacilityDescription(facility: Facility, description: string): boolean {
    const addressRegion = getRegionFromAddress(facility.address);
    const descriptionRegions = getRegionsFromDescription(description);
    const type = normalizeFacilityType(facility);
    const hasRegionMismatch = Boolean(addressRegion && descriptionRegions.some((region) => region !== addressRegion));
    const hasPetMismatch = type !== 'pet' && PET_TEXT_PATTERN.test(description);
    const hasCategoryMismatch = descriptionConflictsWithCategory(description, facility);
    const hasSoftTemplateSignal = SOFT_TEMPLATE_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(description));

    if (STRONG_TEMPLATE_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(description))) return true;
    if (hasRegionMismatch) return true;
    if (hasPetMismatch) return true;
    if (hasCategoryMismatch) return true;
    if (hasSoftTemplateSignal && (hasRegionMismatch || hasPetMismatch || hasCategoryMismatch)) return true;

    return false;
}

/**
 * DB 데이터가 없어도 이름과 타입을 분석해 '스마트 특징'을 반환합니다.
 */
export const getSmartFeatures = (facility: Facility): string[] => {
    // 1. 이미 데이터가 있다면 그대로 사용
    if (facility.features && facility.features.length > 0) {
        return facility.features;
    }

    const name = facility.name || "";
    const features = new Set<string>();

    // 2. 기본 필수 태그
    features.add("주차 상담");
    features.add("24시간 상담");

    // 3. 타입별/이름 기반 추론
    if (facility.type === 'funeral' || name.includes("병원") || name.includes("의료원")) {
        features.add("전문 장례식장");
        features.add("ATM/은행 인근");
        features.add("편의점/매점");
        features.add("식당 완비");
    }

    if (['charnel', 'natural', 'park', 'complex'].includes(facility.type as string) ||
        name.includes("추모") || name.includes("공원") || name.includes("숲")) {
        features.add("자연 친화적");
        features.add("넓은 주차장");
        features.add("안치실 보유");
        features.add("제례실 운영");
    }

    if (facility.type === 'pet') {
        features.add("반려동물 장례지도사");
        features.add("개별 화장");
        features.add("추모 전용");
    }

    return Array.from(features);
};

/**
 * 검증되지 않은 DB 소개문은 숨기고 중립 문구만 반환합니다.
 */
export const getSmartDescription = (facility: Facility): string => {
    const description = facility.description?.trim();

    if (!description || description.length <= 10) {
        return DESCRIPTION_PENDING_TEXT;
    }

    if (shouldHideFacilityDescription(facility, description)) {
        return DESCRIPTION_PENDING_TEXT;
    }

    return description;
};
