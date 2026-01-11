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

  // 1. AI가 생각하는 척 연출 (1초 딜레이)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 2. 입력 메시지 정리 (공백 제거)
  const userMsg = message.trim();

  // 3. 키워드 매칭 로직

  // [NEW] 긴급/임종 상황 감지
  if (userMsg.includes("긴급") || userMsg.includes("임종") || userMsg.includes("사망") || userMsg.includes("돌아가셨")) {
    return {
      text: "🚨 **긴급 상황**으로 확인되었습니다.\n\n즉시 의전 팀을 출동시키기 위해 **[긴급 출동 접수]** 버튼을 눌러주세요.\n최우선으로 배정하여 빠르게 도착하겠습니다.",
      action: 'URGENT_DISPATCH'
    };
  }

  // [NEW] 상품 안내 요청 감지
  if (userMsg.includes("상품") || userMsg.includes("종류") || userMsg.includes("패키지") || userMsg.includes("가입")) {
    return {
      text: `${facility?.name || '저희'}의 대표적인 **Best 3 상품**을 안내해 드립니다.\n\n3가지 핵심 구성을 살펴보시고, 더 맞춤형 설계가 필요하시다면 **상담 예약**을 남겨주세요.`,
      action: 'SHOW_PRODUCTS'
    };
  }

  // [NEW] 설문조사 제출 감지 및 추천 로직
  if (userMsg.startsWith("[🏢 장례식장 상담 신청]") || userMsg.startsWith("[🌳 추모시설 상담 신청]")) {
    return {
      action: "RECOMMEND",
      text: "작성해주신 내용을 바탕으로 고객님께 가장 적합한 시설 3곳을 찾았습니다. \n\n위치와 예산을 고려하여 선별했습니다.",
      // [MODIFIED] Remove mock 'facilities' data to trigger real DB search in frontend
      data: {}
    };
  }

  // [Case 1] 가격, 비용 관련 질문
  if (userMsg.includes("가격") || userMsg.includes("비용") || userMsg.includes("얼마")) {
    return {
      text: "현재 저희 상품의 월 납입금은 **3만원대부터** 다양하게 준비되어 있습니다.\n구체적인 만기 환급금과 혜택은 **[상품 안내]**를 통해 확인하실 수 있습니다.",
      action: 'SHOW_PRODUCTS' // Redirect to products
    };
  }

  // [Case 2] 위치, 주소, 교통 관련 질문
  if (userMsg.includes("위치") || userMsg.includes("어디") || userMsg.includes("가는 길") || userMsg.includes("주소")) {
    return {
      text: "저희는 **전국 직영망**을 운영하고 있어, 전국 어디서나 2시간 이내 출동이 가능합니다.\n가장 가까운 지점에서 즉시 찾아뵙겠습니다.",
      action: 'NONE'
    };
  }

  // [Case 3] 예약, 상담, 전화 관련 질문
  if (userMsg.includes("예약") || userMsg.includes("전화") || userMsg.includes("상담") || userMsg.includes("번호")) {
    return {
      text: "상세 상담이 필요하신가요? \n**'전화 상담'** 버튼을 누르시면 전문 지도사와 바로 연결됩니다.",
      action: 'RESERVE'
    };
  }

  // [Case 4] 대학병원 장례식장
  if (userMsg.includes("대학병원") || userMsg.includes("장례식장")) {
    return {
      text: "네, 저희는 전국의 모든 대학병원 장례식장과 제휴되어 있습니다.\n원하시는 장례식장이 있으시면 즉시 빈소 현황을 파악해 드립니다.",
      action: 'RECOMMEND'
    };
  }

  // [Case 5] 안사 인사/기본 대응
  if (userMsg.includes("안녕") || userMsg.includes("반가")) {
    return {
      text: `반갑습니다! **${facility?.name || '상조 서비스'}** AI 상담사입니다.\n\n무엇을 도와드릴까요?\n\n- **상품 종류 보기**\n- **긴급 출동 요청**\n- **장례 절차 문의**`,
      action: 'NONE'
    };
  }

  // [Default] 키워드를 못 찾았을 때 나오는 기본 답변
  return {
    text: "죄송합니다, 제가 아직 배우고 있는 단계라 정확히 이해하지 못했어요. 😅\n\n**'상품 보여줘'**, **'긴급 접수'**, **'상담 예약'** 처럼 핵심 단어로 질문해 주시면 빠르게 도와드릴게요!",
    action: 'NONE'
  };
};