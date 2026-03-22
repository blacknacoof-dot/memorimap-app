// geminiScoring.ts — Mock 데이터 + AI 스코어링 로직

import type { MapPlace } from './geminiTypes';

// 1. Mock Map API Data Source (Simulating pure map search results)
export const MOCK_MAP_DB: Record<string, MapPlace[]> = {
  '강남': [
    { id: 'gn-1', place_name: "강남성모병원 장례식장", address_name: "서울 강남구 반포동", lat: 37.500, lng: 127.004, rating: 4.3, reviewCount: 380 },
    { id: 'gn-2', place_name: "삼성서울병원 장례식장", address_name: "서울 강남구 일원동", lat: 37.488, lng: 127.085, rating: 4.6, reviewCount: 1200 },
    { id: 'gn-3', place_name: "강남세브란스병원 장례식장", address_name: "서울 강남구 언주로", lat: 37.493, lng: 127.070, rating: 4.4, reviewCount: 900 },
    { id: 'gn-4', place_name: "서울아산병원 장례식장", address_name: "서울 송파구 (강남 인접)", lat: 37.524, lng: 127.108, rating: 4.7, reviewCount: 1500 }
  ],
  '고양': [
    { id: 'gy-1', place_name: '동국대학교 일산병원 장례식장', address_name: '경기도 고양시 일산동구 동국로 27', lat: 37.676, lng: 126.806, rating: 4.1, reviewCount: 120 },
    { id: 'gy-2', place_name: '명지병원 장례식장', address_name: '경기도 고양시 덕양구 화수로 14번길', lat: 37.643, lng: 126.832, rating: 4.0, reviewCount: 95 },
    { id: 'gy-3', place_name: '인제대학교 일산백병원 장례식장', address_name: '경기도 고양시 일산서구 주화로 170', lat: 37.674, lng: 126.747, rating: 4.0, reviewCount: 80 },
    { id: 'gy-4', place_name: '원당장례식장', address_name: '경기도 고양시 덕양구 고양대로', lat: 37.656, lng: 126.835, rating: 3.5, reviewCount: 12 }
  ]
};

// Dynamic Mock Generator for Nationwide Support (With Radius Expansion Simulation)
export const generateMockFacilities = (region: string, isGranular: boolean = false): MapPlace[] => {
  const facilities: MapPlace[] = [];

  // 1. Exact Match (The requested region)
  facilities.push({
    id: `gen-${region}-1`,
    place_name: `${region} 대학병원 장례식장`,
    address_name: `${region} 중심가 123`,
    lat: 37.5, lng: 127.0,
    rating: 4.6, reviewCount: 850
  });

  if (isGranular) {
    facilities.push({
      id: `gen-${region}-2`,
      place_name: `${region} 전문 장례식장`,
      address_name: `${region} 2번길 45`,
      lat: 37.51, lng: 127.01,
      rating: 4.2, reviewCount: 65
    });
  } else {
    facilities.push({
      id: `gen-${region}-2`,
      place_name: `${region} 중앙 전문 장례식장`,
      address_name: `${region} 시청로 45`,
      lat: 37.5, lng: 127.0,
      rating: 4.2, reviewCount: 320
    });
    facilities.push({
      id: `gen-${region}-3`,
      place_name: `${region} 시립 추모관`,
      address_name: `${region} 외곽순환로 99`,
      lat: 37.5, lng: 127.0,
      rating: 3.9, reviewCount: 150
    });
    facilities.push({
      id: `gen-${region}-4`,
      place_name: `${region} VIP 장례식장`,
      address_name: `${region} 터미널 인근`,
      lat: 37.5, lng: 127.0,
      rating: 4.8, reviewCount: 42
    });
  }

  return facilities;
};

// AI Scoring Logic (Matched to User Request)
export const scorePlace = (p: MapPlace): number => {
  let score = 0;
  if (p.rating) score += p.rating * 10;
  if (p.reviewCount > 50) score += 20;
  else if (p.reviewCount > 10) score += 10;
  if (p.place_name.includes("병원") || p.place_name.includes("의료원")) score += 15;
  return score;
};

// Badge Generator (For UI Tags)
export const buildReasonTags = (p: MapPlace): string[] => {
  const tags: string[] = [];
  if (p.rating >= 4.5) tags.push("⭐ 4.5 이상");
  else if (p.rating >= 4.0) tags.push("⭐ 평점 우수");
  if (p.reviewCount >= 50) tags.push("🔥 후기 많음");
  else if (p.reviewCount >= 10) tags.push("📝 리뷰 다수");
  if (p.place_name.includes("병원")) tags.push("🏥 병원 연계");
  return tags;
};

// Reason Sentence Generator (For Data Payload)
export const buildReasonSentence = (p: MapPlace): string => {
  const reasons: string[] = [];
  if (p.rating >= 4.3) reasons.push("이용자 평점이 높고");
  if (p.reviewCount > 50) reasons.push("후기 수가 많으며");
  if (p.place_name.includes("병원")) reasons.push("대형 병원과 연계된");
  return reasons.join(" ") + " 장례식장입니다.";
};

// Main Recommendation Function
export const recommendTop3 = (places: MapPlace[]) => {
  return places
    .map(p => ({
      ...p,
      aiScore: scorePlace(p),
      badges: buildReasonTags(p),
      reasonSentence: buildReasonSentence(p)
    }))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);
};
