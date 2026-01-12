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
  | 'NONE';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  action?: ActionType;
}

export interface AIResponse {
  text: string;
  action: ActionType;
  data?: any;
}

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

  // === [SCENARIO LOGIC] 5-Step Flow ===
  // This logic attempts to follow the user's defined flow based on keywords.

  // [Step 1] Initial Status Check (Imminent/Death)
  if (userMsg.includes("임종") || userMsg.includes("위독") || userMsg.includes("돌아가") || userMsg.includes("사망")) {
    return {
      text: `삼가 고인의 명복을 빕니다. 정성을 다해 모시겠습니다.\n\n현재 어떤 도움이 필요하신가요?\n\n1. **임종(운명)하셨습니다** (장례 접수)\n2. **임종이 임박**하여 미리 상담하고 싶습니다\n3. 단순 시설 이용 문의`,
      action: 'NONE' // User selects option next
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
  // If user mentions location or says "no ambulance", move to Scale
  if (userMsg.includes("병원") || userMsg.includes("자택") || userMsg.includes("요양원") || userMsg.includes("없어") || userMsg.includes("필요")) {
    return {
      text: `확인했습니다. 곧 바로 조치해드리겠습니다.\n\n원활한 빈소 준비를 위해 **예상 조문객 수**를 알려주세요.\n\n- 50명 미만 (가족장/소규모)\n- 100~200명 (일반)\n- 300명 이상 (대규모)`,
      action: 'NONE'
    };
  }

  // [Step 3] Religion
  // If user mentions number of people or scale
  if (userMsg.includes("명") || userMsg.includes("가족장") || userMsg.includes("소규모")) {
    return {
      text: `빈소 규모를 확인했습니다.\n\n**장례를 진행할 종교**가 있으신가요?\n종교에 맞춰 제단과 의전을 준비해 드립니다.\n\n(불교, 기독교, 천주교, 무교 등)`,
      action: 'NONE'
    };
  }

  // [Step 4] Schedule (3-day vs 2-day)
  // If user mentions religion
  if (userMsg.includes("교") || userMsg.includes("불교") || userMsg.includes("무교")) {
    return {
      text: `알겠습니다.\n\n**장례 일정**은 어떻게 계획하고 계신가요?\n\n- **3일장** (일반적: 입실-입관-발인)\n- **2일장** (약식: 입실-내일 발인)`,
      action: 'NONE'
    };
  }

  // [Step 5] Summary & Reservation Trigger
  // If user mentions days or schedule
  if (userMsg.includes("일장") || userMsg.includes("일")) {
    return {
      text: `상담 내용을 요약해 드립니다.\n\n- **희망 빈소**: 고객님 요청 규모\n- **종교**: 입력하신 종교\n- **일정**: 입력하신 일정\n\n지금 바로 **상담 예약**을 남겨주시면, 담당자가 장례식장 예약을 확정해 드립니다.`,
      action: 'RESERVE' // This triggers the form
    };
  }


  // === [Existing/Utility Logic] ===

  // Urgent Key override
  if (userMsg === "긴급" || userMsg === "긴급 접수") {
    return {
      text: "🚨 **긴급 상황**입니다. 아래 버튼을 눌러 바로 접수해주세요.",
      action: 'URGENT_DISPATCH'
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