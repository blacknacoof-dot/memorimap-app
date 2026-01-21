// geminiService.ts

import { Facility, FuneralCompany } from '../types';

export type ActionType =
  | 'SHOW_FORM_A'
  | 'SHOW_FORM_B'
  | 'RECOMMEND'
  | 'RESERVE'
  | 'MAP'
  | 'CALL_MANAGER'
  | 'SWITCH_TO_CONSULT'
  | 'SHOW_PRODUCTS'     // [NEW]
  | 'URGENT_DISPATCH'   // [NEW]
  | 'URGENT_CHECK'      // [NEW]
  | 'URGENT_RESERVATION_CONFIRM' // [NEW]
  | 'NONE';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  action?: ActionType;
  options?: { label: string; value: string }[]; // [NEW] For button options
}

export interface AIResponse {
  text: string;
  action: ActionType;
  data?: any;
}

/**
 * 실제 AI 연결 없이, 정해진 키워드에 따라 답변하는 목(Mock) 함수입니다.
 */
/**
 * 실제 AI 연결 없이, 정해진 키워드에 따라 답변하는 목(Mock) 함수입니다.
 */
export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[] = [],
  facility?: Facility | FuneralCompany
): Promise<AIResponse> => {

  // 1. Mock Delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const userMsg = message.trim();

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