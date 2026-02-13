// geminiService.ts

import { Facility, FuneralCompany, ActionType } from '../types';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  action?: ActionType;
  options?: { label: string; value: string }[]; // [NEW] For button options
  facilities?: Facility[]; // [NEW] For recommendation results
}

export interface AIResponse {
  text: string;
  action: ActionType;
  data?: any;
}

// ==========================================
// [Simulation] Map API + AI Filter Architecture
// ==========================================

interface MapPlace {
  place_name: string;
  address_name: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  id: string; // Add ID for keying
}

// 1. Mock Map API Data Source (Simulating pure map search results)
const MOCK_MAP_DB: Record<string, MapPlace[]> = {
  '강남': [
    { id: 'gn-1', place_name: "강남성모병원 장례식장", address_name: "서울 강남구 반포동", lat: 37.500, lng: 127.004, rating: 4.3, reviewCount: 380 },
    { id: 'gn-2', place_name: "삼성서울병원 장례식장", address_name: "서울 강남구 일원동", lat: 37.488, lng: 127.085, rating: 4.6, reviewCount: 1200 },
    { id: 'gn-3', place_name: "강남세브란스병원 장례식장", address_name: "서울 강남구 언주로", lat: 37.493, lng: 127.070, rating: 4.4, reviewCount: 900 },
    { id: 'gn-4', place_name: "서울아산병원 장례식장", address_name: "서울 송파구 (강남 인접)", lat: 37.524, lng: 127.108, rating: 4.7, reviewCount: 1500 } // Slight out of bound but relevant
  ],
  '고양': [
    { id: 'gy-1', place_name: '동국대학교 일산병원 장례식장', address_name: '경기도 고양시 일산동구 동국로 27', lat: 37.676, lng: 126.806, rating: 4.1, reviewCount: 120 },
    { id: 'gy-2', place_name: '명지병원 장례식장', address_name: '경기도 고양시 덕양구 화수로 14번길', lat: 37.643, lng: 126.832, rating: 4.0, reviewCount: 95 },
    { id: 'gy-3', place_name: '인제대학교 일산백병원 장례식장', address_name: '경기도 고양시 일산서구 주화로 170', lat: 37.674, lng: 126.747, rating: 4.0, reviewCount: 80 },
    { id: 'gy-4', place_name: '원당장례식장', address_name: '경기도 고양시 덕양구 고양대로', lat: 37.656, lng: 126.835, rating: 3.5, reviewCount: 12 }
  ]
};

// [NEW] Dynamic Mock Generator for Nationwide Support (With Radius Expansion Simulation)
const generateMockFacilities = (region: string, isGranular: boolean = false): MapPlace[] => {
  const facilities = [];

  // 1. Exact Match (The requested region)
  facilities.push({
    id: `gen-${region}-1`,
    place_name: `${region} 대학병원 장례식장`,
    address_name: `${region} 중심가 123`,
    lat: 37.5, lng: 127.0,
    rating: 4.6, reviewCount: 850
  });

  if (isGranular) {
    // 2. [Strict Mode] Granular (Dong) Search
    // We simulated having fewer results locally (only strict matches).
    // Logic: Do NOT add "Nearby" (Expansion) results.

    // Simulating a second local facility ONLY if it exists strictly in that Dong
    facilities.push({
      id: `gen-${region}-2`,
      place_name: `${region} 전문 장례식장`,
      address_name: `${region} 2번길 45`,
      lat: 37.51, lng: 127.01,
      rating: 4.2, reviewCount: 65 // Adjusted to > 50 for realistic "High Review" testing
    });
  } else {
    // Standard City-level generation (Plenty of results in the city itself)
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

// 2. AI Scoring Logic (Matched to User Request)
const scorePlace = (p: MapPlace) => {
  let score = 0;

  // ⭐ Rating Weight
  if (p.rating) score += p.rating * 10;

  // 📝 Review Count Weight (Adjusted for initial phase: 50/10)
  if (p.reviewCount > 50) score += 20;
  else if (p.reviewCount > 10) score += 10;

  // 🏥 Hospital Premium
  if (p.place_name.includes("병원") || p.place_name.includes("의료원")) score += 15;

  return score;
};

// 3. Badge Generator (For UI Tags)
const buildReasonTags = (p: MapPlace) => {
  const tags = [];
  if (p.rating >= 4.5) tags.push("⭐ 4.5 이상");
  else if (p.rating >= 4.0) tags.push("⭐ 평점 우수");

  if (p.reviewCount >= 50) tags.push("🔥 후기 많음");
  else if (p.reviewCount >= 10) tags.push("📝 리뷰 다수");

  if (p.place_name.includes("병원")) tags.push("🏥 병원 연계");

  return tags;
};

// [NEW] Reason Sentence Generator (For Data Payload)
const buildReasonSentence = (p: MapPlace) => {
  const reasons = [];
  if (p.rating >= 4.3) reasons.push("이용자 평점이 높고");
  if (p.reviewCount > 50) reasons.push("후기 수가 많으며");
  if (p.place_name.includes("병원")) reasons.push("대형 병원과 연계된");

  return reasons.join(" ") + " 장례식장입니다.";
};

// 4. Main Recommendation Function
const recommendTop3 = (places: MapPlace[]) => {
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


/**
 * 실제 AI 연결 없이, 정해진 키워드에 따라 답변하는 목(Mock) 함수입니다.
 */
export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[] = [],
  facility?: Facility | FuneralCompany,
  context?: string
): Promise<AIResponse> => {

  // 1. Mock Delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const userMsg = message.trim();

  // ==========================================
  // [SANGJO BUTTON ACTIONS]
  // ==========================================

  // 1. 상품 안내 (Product Info)
  if (userMsg.includes("상품 종류") || userMsg.includes("상품 안내")) {
    return {
      text: "저희 상조의 대표 상품들을 안내해 드립니다.\n원하시는 상품을 선택하시면 상세 정보를 확인하실 수 있습니다.",
      action: 'SHOW_PRODUCTS'
    };
  }

  // 2. 긴급 접수 (Urgent Dispatch)
  if (userMsg.includes("긴급 장례 접수") || userMsg.includes("긴급 접수")) {
    return {
      text: "🚨 긴급 장례 접수가 필요하시군요.\n\n가장 가까운 의전 팀을 즉시 배정하기 위해 **현재 계신 위치와 연락처**를 확인해 주세요.\n(24시간 긴급 콜센터가 즉시 연락드립니다)",
      action: 'URGENT_DISPATCH'
    };
  }

  // 3. 장례 절차 (Process Guide)
  if (userMsg.includes("장례 절차")) {
    return {
      text: "일반적인 3일장 절차에 대해 안내해 드리겠습니다.\n\n임종 직후부터 발인까지, 상주님께서 준비하셔야 할 사항들을 정리했습니다.",
      action: 'SHOW_PROCESS' as any
    };
  }

  // 4. 상담 예약 (Consultation)
  if (userMsg.includes("상담원 연결") || userMsg.includes("상담 예약")) {
    return {
      text: "전문 장례지도사와 상담을 연결해 드리겠습니다.\n\n**원하시는 상담 방식**을 선택해 주세요.\n(전화 상담은 10분 내로 연락드리며, 채팅 상담은 실시간으로 진행됩니다.)",
      action: 'RESERVE'
    };
  }

  if (userMsg.includes("[🚨 장례식장 찾기]") || userMsg.includes("장례식장 추천") || userMsg.includes("찾아")) {
    // 1. Detect Region from Message (Advanced Parsing for Dong/Gu)
    let regionKey = '서울'; // Default Fallback
    let isGranular = false; // Flag for expansion simulation

    // Regex to capture City/District/Neighborhood (e.g., 강남구, 역삼동, 일산서구, 고양시)
    // Now supports no-space patterns like '분당장례식장' via aggressive matching
    const locationRegex = /([가-힣]+[시군구동읍면])/g;
    const matches = userMsg.match(locationRegex);

    if (matches && matches.length > 0) {
      // Use the last specific match (usually the most granular, e.g., "고양시 일산동구" -> "일산동구")
      regionKey = matches[matches.length - 1];

      // Check if it's 'Dong' or 'Myeon' or 'Eup' -> trigger expansion if needed
      if (regionKey.endsWith('동') || regionKey.endsWith('읍') || regionKey.endsWith('면')) {
        isGranular = true;
      }
    } else {
      // [NLP Fix] Check for known regions explicitly even if attached to other words (e.g. 분당장례식장)
      const commonRegions = ['강남', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '고양', '분당', '수원', '일산', '성남', '용인', '부천', '안양', '안산', '남양주', '화성', '평택', '의정부', '파주', '시흥', '김포', '광명', '군포', '하남', '오산', '이천', '안성', '의왕', '양주', '여주', '과천'];

      for (const region of commonRegions) {
        if (userMsg.includes(region)) {
          regionKey = region;
          break;
        }
      }
    }

    // [Bkit Fix] Disable Internal Mock Generation for Map Search
    // Instead of generating "Budae-si" data here, we simply acknowledge the region 
    // and let ChatInterface perform the Real DB Search.

    // We strictly DO NOT return 'data.facilities' here if we want to enforce Real DB priority.
    // The previous logic was generating MOCK_MAP_DB results which caused the "4 found -> Top 3 picked" log.

    return {
      text: ``, // [NLP Fix] Empty text as user requested "메시지창 없어도 될듯" - ChatInterface creates the UI container
      action: 'RECOMMEND',
      data: {
        facilities: []
      }
    };
  }

  if (userMsg.includes("[🌳 추모시설 상담 신청]")) {
    return {
      text: "요청하신 조건에 최적화된 추모시설들을 추천해 드립니다.\n상세한 안치 비용과 시설 정보를 확인해 보세요.",
      action: 'RECOMMEND',
      data: {
        facilities: [
          {
            id: 'demo-mem-1',
            name: '분당 휴(休) 추모공원',
            address: '경기도 성남시 분당구 야탑동',
            type: 'columbarium',
            rating: 4.9,
            reviewCount: 156,
            imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400'
          },
          {
            id: 'demo-mem-2',
            name: '용인 평온의 숲',
            address: '경기도 용인시 처인구 이동읍',
            type: 'natural_burial',
            rating: 4.7,
            reviewCount: 289,
            imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=400'
          }
        ]
      }
    };
  }

  if (userMsg.includes("[🐾 반려동물 장례 신청]")) {
    return {
      text: "사랑하는 아이를 위해 믿고 맡길 수 있는 반려동물 전용 장례식장을 찾아드렸습니다.",
      action: 'RECOMMEND',
      data: {
        facilities: [
          {
            id: 'demo-pet-1',
            name: '펫포레스트 (광주)',
            address: '경기도 광주시 오포읍',
            type: 'pet_funeral',
            rating: 4.9,
            reviewCount: 567,
            imageUrl: 'https://images.unsplash.com/photo-1530281703120-608b49910d54?auto=format&fit=crop&q=80&w=400'
          },
          {
            id: 'demo-pet-2',
            name: '21그램 반려동물 장례식장',
            address: '경기도 광주시',
            type: 'pet_funeral',
            rating: 4.8,
            reviewCount: 423
          }
        ]
      }
    };
  }

  // === [CONTEXT CHECK] Determine Type ===
  const isMemorial = facility && ['columbarium', 'natural_burial', 'cemetery', 'sea_burial', 'memorial'].includes((facility as Facility).facility_type || (facility as Facility).type as any);
  const isPet = facility && (facility as Facility).facility_type === 'pet_funeral';

  // Helper to format prices
  const getPriceInfo = () => {
    if (!facility) return '가격 정보는 상담을 통해 확인하실 수 있습니다.';

    // 1. Check for specific products (Sangjo/Funeral)
    if ('products' in facility && facility.products && facility.products.length > 0) {
      return facility.products.map(p => `- **${p.name}**: ${p.price.toLocaleString()}원~`).join('\n');
    }

    // 2. Check for prices array (Facility)
    if ('prices' in facility && Array.isArray(facility.prices) && facility.prices.length > 0) {
      return facility.prices.map((p: any) => `- **${p.item_name || p.name}**: ${parseInt(p.price || 0).toLocaleString()}원~`).join('\n');
    }

    // 3. Fallback to priceRange string
    if (facility.priceRange) return facility.priceRange;

    // 4. Default
    return '상세 가격은 방문 상담 시 안내해 드립니다.';
  };

  // ==========================================
  // [SCENARIO A] Memorial Facility (봉안당/수목장)
  // ==========================================
  if (isMemorial) {
    // [1] Price Inquiry
    if (userMsg.includes("가격") || userMsg.includes("비용") || userMsg.includes("분양") || userMsg.includes("얼마")) {
      const priceText = getPriceInfo();
      return {
        text: `**${facility?.name}**의 가격 정보입니다.\n\n${priceText}\n\n*정확한 비용은 안치 위치와 조건에 따라 달라질 수 있습니다.*\n\n상세 견적이나 카탈로그가 필요하신가요?`,
        action: 'NONE'
      };
    }

    // [2] Procedure / Visit
    if (userMsg.includes("절차") || userMsg.includes("방법") || userMsg.includes("안치")) {
      return {
        text: `안치 절차는 다음과 같습니다.\n\n1. **상담 및 답사** (현장 방문)\n2. **안치단 선정** (위치 지정)\n3. **계약 작성** (필요 서류 안내)\n4. **안치** (화장 후 유골함 안치)\n\n원하시는 날짜에 방문 예약을 도와드릴까요?`,
        action: 'NONE'
      };
    }

    // [3] Location / Map
    if (userMsg.includes("위치") || userMsg.includes("주소") || userMsg.includes("어디")) {
      return {
        text: `시설 위치: **${(facility as Facility).address}**\n\n대중교통이나 자가용 방문 경로가 궁금하신가요?\n아래 버튼을 눌러 지도에서 확인하실 수 있습니다.`,
        action: 'MAP'
      };
    }

    // [4] Reservation Trigger (Visit/Counsel)
    if (userMsg.includes("예약") || userMsg.includes("잡아") || userMsg.includes("방문") || userMsg.includes("답사")) {
      return {
        text: `방문 답사 예약을 도와드리겠습니다.\n\n원하시는 날짜와 시간을 선택해 주시면, 전문 상담사가 안내해 드립니다.\n아래 예약 버튼을 눌러주세요.`,
        action: 'RESERVE'
      };
    }

    // [5] Fallback for Memorial
    return {
      text: `죄송합니다. 질문을 잘 이해하지 못했습니다.\n\n**"가격 알려줘"**, **"위치 어디야"**, **"방문 예약해줘"** 와 같이 말씀해 주세요.`,
      action: 'NONE'
    };
  }


  // ==========================================
  // [SCENARIO B] Funeral Home / Sangjo (장례식장)
  // ==========================================

  // Existing Logic for Funeral (Kept as fallback or primary for non-memorial)

  // [Step 1] Initial Status Check (Imminent/Death)
  if (userMsg.includes("임종") || userMsg.includes("위독") || userMsg.includes("돌아가") || userMsg.includes("사망")) {
    return {
      text: `삼가 고인의 명복을 빕니다. 정성을 다해 모시겠습니다.\n\n현재 어떤 도움이 필요하신가요?\n\n1. **임종(운명)하셨습니다** (장례 접수)\n2. **임종이 임박**하여 미리 상담하고 싶습니다\n3. 단순 시설 이용 문의`,
      action: 'NONE'
    };
  }

  // [Step 1-Response] User selected "Imminent" or "Death" -> Ask Location
  if (userMsg.includes("임종하") || userMsg.includes("운명") || userMsg.includes("접수")) {
    return {
      text: `현재 고인이 계신 곳은 어디인가요?\n(예: OO병원 응급실, 자택, 요양원 등)\n\n운구 차량(앰뷸런스)이 바로 필요하신가요?`,
      action: 'NONE'
    };
  }

  // [Step 2] Scale (Guest Count)
  if (userMsg.includes("병원") || userMsg.includes("자택") || userMsg.includes("요양원") || userMsg.includes("없어") || userMsg.includes("필요")) {
    return {
      text: `확인했습니다. 곧 바로 조치해드리겠습니다.\n\n원활한 빈소 준비를 위해 **예상 조문객 수**를 알려주세요.\n\n- 50명 미만 (가족장/소규모)\n- 100~200명 (일반)\n- 300명 이상 (대규모)`,
      action: 'NONE'
    };
  }

  // [Step 3] Religion
  if (userMsg.includes("명") || userMsg.includes("가족장") || userMsg.includes("소규모")) {
    return {
      text: `빈소 규모를 확인했습니다.\n\n**장례를 진행할 종교**가 있으신가요?\n종교에 맞춰 제단과 의전을 준비해 드립니다.\n\n(불교, 기독교, 천주교, 무교 등)`,
      action: 'NONE'
    };
  }

  // [Step 4] Schedule
  if (userMsg.includes("교") || userMsg.includes("불교") || userMsg.includes("무교")) {
    return {
      text: `알겠습니다.\n\n**장례 일정**은 어떻게 계획하고 계신가요?\n\n- **3일장** (일반적: 입실-입관-발인)\n- **2일장** (약식: 입실-내일 발인)`,
      action: 'NONE'
    };
  }

  // [Step 5] Summary & Reservation
  if (userMsg.includes("일장") || userMsg.includes("일")) {
    return {
      text: `상담 내용을 요약해 드립니다.\n\n- **희망 빈소**: 고객님 요청 규모\n- **종교**: 입력하신 종교\n- **일정**: 입력하신 일정\n\n지금 바로 **상담 예약**을 남겨주시면, 담당자가 장례식장 예약을 확정해 드립니다.`,
      action: 'RESERVE'
    };
  }


  // === [Shared/Utility Logic] ===

  // Urgent Key override
  if (userMsg === "mode_urgent" || userMsg === "긴급" || userMsg === "긴급 접수" || userMsg.includes("장례 발생")) {
    return {
      text: JSON.stringify({
        message: "삼가 조의를 표합니다. 전화 대기 없이 **지금 바로 안치 예약**을 확정해 드리겠습니다.\\n시설에 도착하시는 날짜(발인일)를 선택해 주세요.",
        options: [
          { label: "📅 오늘 (즉시 이동)", value: "date_today" },
          { label: "📅 내일", value: "date_tomorrow" },
          { label: "📅 모레", value: "date_dayafter" }
        ],
        action_trigger: "URGENT_CHECK"
      }),
      action: 'NONE' // Handled via JSON parsing in frontend
    };
  }

  // Date Selection -> Type Selection
  if (userMsg.startsWith("date_")) {
    return {
      text: JSON.stringify({
        message: "내일 안치 가능한 자리를 확보하겠습니다.\\n어떤 유형으로 준비해 드릴까요?",
        options: [
          { label: "👤 개인단 (1분)", value: "type_single" },
          { label: "👥 부부단 (2분)", value: "type_couple" }
        ],
        action_trigger: "URGENT_CHECK"
      }),
      action: 'NONE'
    };
  }

  // Type Selection -> Time Selection
  if (userMsg.startsWith("type_")) {
    return {
      text: JSON.stringify({
        message: "네, 여유분 확보되었습니다.\\n도착하셔서 **계약 및 안치를 진행할 시간**을 선택해 주세요.\\n(선택하신 시간에 맞춰 직원이 서류를 준비하고 정문에서 대기합니다.)",
        options: [
          { label: "09:00 도착", value: "time_0900" },
          { label: "11:00 도착", value: "time_1100" },
          { label: "13:00 도착", value: "time_1300" },
          { label: "15:00 도착", value: "time_1500" }
        ],
        action_trigger: "URGENT_CHECK"
      }),
      action: 'NONE'
    };
  }

  // Time Selection -> Confirm
  if (userMsg.startsWith("time_")) {
    const time = userMsg.replace("time_", "");
    const formattedTime = time.slice(0, 2) + ":" + time.slice(2);
    return {
      text: JSON.stringify({
        message: `**[예약 확정] 내일 오전 ${formattedTime}**로 접수되었습니다.\\n도착 즉시 안치가 가능하도록 준비해 두겠습니다.\\n\\n⚠️ **필수 지참 서류:**\\n1. 화장 증명서\\n2. 계약자 신분증\\n\\n조심히 오십시오.`,
        options: [
          { label: "📍 내비게이션 실행", "value": "open_navi" },
          { label: "📄 예약증 보기 (바코드)", "value": "show_ticket" }
        ],
        action_trigger: "URGENT_RESERVATION_CONFIRM"
      }),
      action: 'NONE'
    };
  }

  // Facility Search (Form A)
  if (userMsg.includes("장례식장") && (userMsg.includes("찾아") || userMsg.includes("검색"))) {
    return {
      text: "원하시는 장례식장을 찾기 위해 몇 가지 질문을 드릴게요.\n\n가장 중요하게 생각하시는 조건은 무엇인가요?",
      action: 'SHOW_FORM_A'
    };
  }

  // Memorial Search (Form B)
  if ((userMsg.includes("납골당") || userMsg.includes("수목장")) && (userMsg.includes("찾아") || userMsg.includes("검색"))) {
    return {
      text: "고인을 편안히 모실 수 있는 추모시설을 찾아드릴게요.\n\n원하시는 지역이나 종교가 있으신가요?",
      action: 'SHOW_FORM_B'
    };
  }



  // Default Fallback
  return {
    text: "죄송합니다, 잘 이해하지 못했습니다. **'장례식장 찾아줘'** 또는 **'긴급 접수'**라고 말씀해 주시면 도와드릴게요.",
    action: 'NONE'
  };
};