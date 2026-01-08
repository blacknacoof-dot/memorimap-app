import { Facility } from '../types';

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
 * DB 설명이 없을 때 보여줄 '자동 생성 소개글'을 반환합니다.
 */
export const getSmartDescription = (facility: Facility): string => {
    if (facility.description && facility.description.length > 10) {
        return facility.description;
    }

    const location = facility.address ? facility.address.split(" ").slice(0, 2).join(" ") : "도심";
    let typeStr = "장례 시설";

    switch (facility.type) {
        case 'funeral': typeStr = "전문 장례식장"; break;
        case 'charnel': typeStr = "고품격 봉안당"; break;
        case 'natural': typeStr = "친환경 자연장지"; break;
        case 'pet': typeStr = "반려동물 전용 장례 시설"; break;
        case 'park': case 'complex': typeStr = "종합 추모 공원"; break;
        case 'assistant': typeStr = "AI 통합 상담 시스템"; break;
    }

    return `${facility.name}은(는) ${location} 지역에서 유가족의 슬픔을 함께 나누는 ${typeStr}입니다. 경건한 분위기와 쾌적한 시설로 고인의 마지막 길을 예우하며, 최상의 정성으로 추모를 돕습니다.`;
};
