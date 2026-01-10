// geminiService.ts

import { Facility } from '../types';

export type ActionType =
  | 'SHOW_FORM_A'
  | 'SHOW_FORM_B'
  | 'RECOMMEND'
  | 'RESERVE'
  | 'MAP'
  | 'CALL_MANAGER'
  | 'SWITCH_TO_CONSULT'
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
  facility?: Facility
): Promise<AIResponse> => {

  // 1. AI가 생각하는 척 연출 (1초 딜레이)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 2. 입력 메시지 정리 (공백 제거)
  const userMsg = message.trim();

  // 3. 키워드 매칭 로직

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
      text: "현재 보시는 시설의 분양가는 **평당 300만 원부터** 시작됩니다.\n관리비는 1년 기준 약 5만 원이며, 위치와 층수에 따라 차이가 있을 수 있습니다. 상세 견적표를 보내드릴까요?",
      action: 'NONE'
    };
  }

  // [Case 2] 위치, 주소, 교통 관련 질문
  if (userMsg.includes("위치") || userMsg.includes("어디") || userMsg.includes("가는 길") || userMsg.includes("주소")) {
    return {
      text: "이곳은 **경기도 고양시** 인근에 위치해 있습니다.\n서울에서 차량으로 약 30분 거리이며, 셔틀버스도 운행 중입니다. 지도 버튼을 누르시면 내비게이션으로 연결해 드릴게요.",
      action: 'MAP'
    };
  }

  // [Case 3] 예약, 상담, 전화 관련 질문
  if (userMsg.includes("예약") || userMsg.includes("전화") || userMsg.includes("상담") || userMsg.includes("번호")) {
    return {
      text: "방문 답사나 상담 예약을 원하시나요? \n**'예약해줘'**라고 말씀하시거나 하단의 **[전화 상담]** 버튼을 눌러주시면 담당자와 바로 연결해 드립니다.",
      action: 'RESERVE'
    };
  }

  // [Case 4] 대학병원 장례식장
  if (userMsg.includes("대학병원") || userMsg.includes("장례식장")) {
    return {
      text: "네, **대학병원 장례식장** 위주로 리스트를 필터링했습니다.\n서울대병원, 세브란스병원, 아산병원 장례식장 정보가 준비되어 있습니다. 원하시는 병원이 있으신가요?",
      action: 'RECOMMEND'
    };
  }

  // [Case 5] 안사 인사/기본 대응
  if (userMsg.includes("안녕") || userMsg.includes("반가")) {
    return {
      text: "안녕하세요! **통합 AI 마음이**입니다. 😌\n추모 시설 가격, 위치, 예약 절차 등 궁금한 점을 편하게 물어봐 주세요.",
      action: 'NONE'
    };
  }

  // [Default] 키워드를 못 찾았을 때 나오는 기본 답변
  return {
    text: "죄송합니다, 제가 아직 배우고 있는 단계라 정확히 이해하지 못했어요. 😅\n\n**'가격 알려줘'**, **'위치 어디야'**, **'예약하고 싶어'** 처럼 핵심 단어로 질문해 주시면 답변해 드릴게요!",
    action: 'NONE'
  };
};