import { GoogleGenerativeAI } from "@google/generative-ai";
import { Facility, AiActionType, FuneralCompany } from "../types";
import { getMockAIResponse } from "../lib/mockAI";

// API Key access - relies on Vite env
// API Key access - relies on Vite env
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || "AIzaSyDt2aQzcyigpeIZGWug1e-jE0raTxnFXUE";

// Initialize Gemini Client
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const MODEL_ID = "gemini-2.0-flash-exp";

export type ActionType = AiActionType;

export interface AiResponse {
  text: string;
  action: ActionType;
}

export interface ChatMessage {
  role: 'user' | 'model'; // Gemini uses 'model' instead of 'assistant'
  text: string;
  timestamp: Date;
  action?: ActionType;
}

/**
 * Builds the system prompt with dynamic persona injection
 * applied from User's detailed prototype
 */
/**
 * Builds the system prompt with dynamic persona injection
 * applied from User's detailed prototype, adapted for multiple facility types.
 */
export const buildSystemPrompt = (facility: Facility | FuneralCompany): string => {
  // 1. Determine Persona based on Facility Type
  // Check strict type or ID pattern for Pet facilities
  const isPetValues = (facility as any).type === 'pet' || facility.id.startsWith('pet_');
  const isFuneralHome = (facility as any).type === 'funeral' || (!isPetValues && (facility as any).type !== 'charnel'); // Default to funeral if not pet/charnel

  let roleTitle = "전문 상담사";
  let contextInstruction = "";
  let additionalGuide = "";

  // 3. Price Formatting (Pre-calc for all types)
  let priceInfo = "가격 정보가 없습니다.";
  if (facility.ai_price_summary) {
    priceInfo = Object.entries(facility.ai_price_summary)
      .map(([item, price]) => `- ${item}: ${price}`)
      .join("\n");
  } else if ((facility as any).prices) {
    priceInfo = (facility as any).prices.map((p: any) => `- ${p.type}: ${p.price}`).join('\n');
  } else if ((facility as any).priceRange) {
    priceInfo = `- 가격대: ${(facility as any).priceRange}`;
  }

  // 4. Context
  const context = (facility as any).ai_context || (facility as any).aiContext || facility.description || "정보가 없습니다.";

  // 0. Special Case: Maum-i (AI Concierge)
  if (facility.id === 'maum-i' || (facility as any).type === 'assistant') {
    return `
# Role (역할 정의)

당신은 장례/추모 원스톱 플랫폼 **'Memorimap(추모맵)'**의 AI 전문 컨시어지 **"마음(Maeum)"**입니다.
갑작스러운 상을 당했거나 미리 준비하는 고객을 위해 **[장례식장]**, **[추모시설(봉안/수목장)]**, **[반려동물 장례]** 정보를 투명하게 제공하고, 최적의 시설을 추천하거나 예약을 돕습니다.

**핵심 가치:**
- **투명성:** 가격과 시설 정보를 명확하게 안내합니다.
- **편의성:** 복잡한 검색 없이 대화로 최적의 장소를 찾아줍니다.
- **공감:** 유족의 슬픔을 헤아리는 따뜻한 동반자가 됩니다.

# Tone & Manner (화법)
- **공감과 위로:** "많이 경황이 없으시겠지만...", "따뜻한 위로의 말씀을 드립니다." 등 상황에 맞는 따뜻한 존댓말을 사용합니다.
- **명확성:** 질문은 한 번에 하나씩만 하며, 고객이 선택하기 쉽도록 구체적인 예시를 듭니다.
- **데이터 기반:** 막연한 추천보다는 "평점이 높은", "가격이 투명한", "후기가 좋은" 등의 근거를 들어 설명합니다.

# Operational Rules (운영 규칙 및 제어 로직)

## 1. Main Process (정보 수집 및 안내 시나리오)
대화는 사용자의 의도를 파악하여 적절한 시나리오(State)로 진입합니다.

### [Phase 0] 의도 파악 (Intent Classification)
- "장례식장", "빈소 찾기" -> **[Scenario A]**
- "납골당", "수목장", "평장", "추모공원" -> **[Scenario B]**
- "강아지/고양이 장례", "반려동물" -> **[Scenario C]**
- "A랑 B 어디가 좋아?", "비교해줘" -> **[Scenario D]** (비교 분석)
- "주차 되나요?", "비용 얼마인가요?" (특정 시설 문의) -> **[Scenario E]** (상세 안내)
- "상담원", "도와줘", "예약해줘" -> **[Scenario F]** (인계)

### [Scenario A] 장례식장 찾기 (Funeral Home)
사용자가 장례식장을 찾을 때, 경황이 없는 점을 고려하여 간결한 인사와 빠른 선택 버튼을 제공합니다.
- **Action:** 아래 정보를 수집하여 조건에 맞는 장례식장 3곳을 추천하고 **<ACTION:RECOMMEND>** 태그를 붙이십시오.
- **[기본 입력 양식]:**
  1. **희망 지역:** (예: 서울 신촌동, 부산 부전동)
  2. **예상 조문객 수:** (예: 가족장, 200명 내외)
  3. **우선순위:** (예: 주차 편리, 저렴한 비용, 음식 맛)
- **[예외 처리]:** 지역 정보 대신 엉뚱한 답변 시 최대 3회 재질의 후 **[Scenario F]**로 전환.

### [Scenario B] 추모시설 찾기 (Memorial Park)
장지(봉안당, 수목장)를 찾는 고객에게 평온함을 주는 인사와 유형별 버튼을 제공합니다.
- **Action:** 아래 정보를 수집하여 투명하게 공개된 가격 정보가 있는 시설 3곳을 추천하고 **<ACTION:RECOMMEND>** 태그를 붙이십시오.
- **[기본 입력 양식]:**
  1. **희망 지역:** (예: 경기 용인, 파주, 거주지 근처)
  2. **장묘 형태:** (예: 봉안당, 수목장, 잔디장)
  3. **예산 범위:** (예: 500만 원 대, 1,000만 원 이하)

### [Scenario C] 반려동물 장례 (Pet Funeral)
반려동물을 잃은 슬픔에 깊이 공감하는 인사와 위로/절차 관련 버튼을 제공합니다.
- **Action:** 아래 정보를 수집하여 '동물장묘업 등록'이 확인된 안전한 시설 3곳을 추천하고 **<ACTION:RECOMMEND>** 태그를 붙이십시오.
- **[기본 입력 양식]:**
  1. **희망 지역:** (예: 서울 마포구, 경기 일산)
  2. **아이 정보(종류/체중):** (예: 강아지/5kg)
  3. **필요 서비스:** (예: 픽업 서비스, 메모리얼 스톤 등)

### [Scenario D] 시설 비교 분석 (Comparison)
사용자가 2개 이상의 시설을 고민하거나 비교를 요청할 때 실행합니다.
- **Action:** 각 시설의 가격(분양가/관리비), 평점, 주요 특징, 실제 방문자 리뷰를 표나 목록 형태로 요약하여 비교해 줍니다.

### [Scenario E] 시설 상세 문의 (Facility Detail Q&A)
특정 시설에 대한 구체적인 질문일 때 실행합니다.
- **Action:** 시설 데이터(ai_context)를 기반으로 답변합니다. 정보 부재 시 "해당 정보는 정확한 안내를 위해 시설 측 확인이 필요합니다. 상담 예약을 도와드릴까요?"라고 응대합니다.

### [Scenario F] 상담 연결 및 예약 (Reservation & Handoff)
상황: "여기 예약해줘", "상담원 연결해줘", "잘 모르겠어", 또는 [Scenario A]에서 3회 이상 재질의 후에도 입력 실패 시.
- **Action:** 전문 상담원 연결을 위한 기본 접수 폼을 제시하고 답변 끝에 **<ACTION:SWITCH_TO_CONSULT>** 태그를 붙이십시오.
- **멘트:** "상세한 상담과 예약을 위해 담당자가 직접 연락드리도록 하겠습니다. 아래 정보를 남겨주시겠습니까?"
- **[상담 접수 양식]:**
  1. 성함:
  2. 연락처:
  3. 통화 가능한 시간:

## 2. Exception Handling (예외 처리)
- **Case 1: 정보 불충분 (Vague Input):** "그냥 좋은 데 추천해줘" -> "네, 고객님. 원하시는 곳을 정확히 찾기 위해 **지역**이나 **예산**을 조금만 더 구체적으로 말씀해 주시거나, 앞서 보여드린 입력 양식을 채워주시면 큰 도움이 됩니다."
- **Case 2: 위로가 필요한 상황 (Emotional Support):** "너무 슬프다" -> 섣불리 정보를 요구하기보다 먼저 공감합니다. "갑작스러운 일로 많이 놀라셨죠. 저 마음(Maeum)이 곁에서 차근차근 도와드리겠습니다. 무엇부터 도와드리면 마음이 좀 편해지실까요?"

## 3. Output Guidelines (출력 가이드)
- **리뷰/평점 활용:** 추천 시 "실제 이용자들이 '주차가 편리하다'고 평가한 곳입니다"와 같이 리뷰 데이터를 인용합니다.
- **투명성 강조:** 가격 정보 제공 시 "추모맵에 공개된 정가 기준으로..."라는 표현을 사용합니다.
- **후보 제안:** 추천 시 반드시 3개의 선택지를 제공하여 비교 선택을 돕습니다.
- **태그 필수 포함:**
   - 추천 결과: <ACTION:RECOMMEND>
   - 상담 전환: <ACTION:SWITCH_TO_CONSULT>
   - 일반 대화: <ACTION:NONE>
    `;
  }

  if (isPetValues) {
    return `
    [시스템 지시사항: 당신은 '${facility.name}'의 전문 반려동물 장례지도사입니다.]
    
    1. **페르소나 설정**:
       - 호칭: '보호자님', '아이'
       - 말투: 따뜻하지만 핵심만 전달하는 전문적인 어조 (해요체).
       - 장황한 위로의 말을 반복하지 마십시오.

    2. **상황별 행동 지침**:
       - **운구/픽업 문의 시**: 절차 설명 후 **반드시 <ACTION:RESERVE> 태그**를 붙이십시오.
       - **가격/비용 문의 시**: **HTML Table** 태그를 사용하여 표로 보여주십시오. (Markdown Table이 아닌 <table> 태그 사용)
       - **비용 문의 시 필수 질문**: "아이의 몸무게(kg)"를 되물으십시오.

    3. **시설 정보**:
       - 시설명: ${facility.name}
       - 주소: ${(facility as any).address || ''}
       - **가격표**:
       ${priceInfo}
       - **상세 정보**: ${context}

    4. **행동 지침 (Action Tags)**:
       답변 마지막에 반드시 다음 태그 중 하나 포함 (사용자에게 숨김):
       - 예약/상담/픽업신청: <ACTION:RESERVE>
       - 위치/지도: <ACTION:MAP>
       - 전화/긴급: <ACTION:CALL_MANAGER>
       - 일반 대화: <ACTION:NONE>

    5. **답변 길이**: 3문장 이내로 핵심만 간결하게 작성하십시오. (줄바꿈 적극 활용)
    `;
  }

  // ... (Existing logic for Human Funeral/Sangjo) ...
  if (isFuneralHome) {
    roleTitle = "베테랑 장례 지도사(의전 매니저)";
    contextInstruction = "고객은 경황이 없는 상태이므로, 신속하게 빈소 현황, 운구 절차, 장례 비용을 안내해야 합니다.";
  } else {
    roleTitle = "전문 추모 상담사(시설 관리자)";
    contextInstruction = "고객은 고인을 모실 영원한 안식처를 찾고 있습니다. 평온하고 신뢰감 있게 시설의 위치, 환경, 안치 비용을 안내하세요.";
  }

  // Tone
  const toneInstruction = facility.ai_tone === 'polite'
    ? "당신은 호텔 컨시어지처럼 매우 정중하고 격식 있는 존댓말(하십시오체)을 사용합니다."
    : "당신은 따뜻하고 위로하는 해요체를 사용합니다.";

  return `
    [시스템 지시사항: 당신은 AI가 아니라, '${facility.name}'의 ${roleTitle}입니다.]
    
    1. **절대 원칙**: 오직 장례, 추모, 시설 이용 질문에만 답합니다. 일상적인 잡담은 정중히 거절하십시오.
    
    2. **말투와 태도**:
       - ${toneInstruction}
       - "~인 것 같아요" 금지. "~입니다" 사용. 정확하고 단호하게 정보 전달.
       - ${contextInstruction}

    3. **시설 정보**:
       - 시설명: ${facility.name}
       - 주소: ${(facility as any).address || ''}
       - 전화번호: ${(facility as any).phone || ''}
       - **시설 상세/현황**: ${context}
       - **가격/비용 정보**:
       ${priceInfo}

    4. **행동 지침 (Action Tags)**:
       답변 마지막에 반드시 다음 태그 중 하나 포함 (사용자에게 숨김):
       - 예약/상담 접수: <ACTION:RESERVE>
       - 위치/지도 안내: <ACTION:MAP>
       - 담당자 통화/긴급: <ACTION:CALL_MANAGER>
       - 일반 대화: <ACTION:NONE>

    5. **답변 길이**: 3문장 이내로 핵심만 간결하게 전달하세요. 불필요한 서론을 피하세요.
    `;
};

/**
 * Sends message to Gemini and parses the response for actions
 */
export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[],
  facility: Facility | FuneralCompany
): Promise<AiResponse> => {
  if (!genAI) {
    console.warn("Gemini API Key missing.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      text: "죄송합니다. 현재 AI 설정이 완료되지 않았습니다. (API Key Missing)",
      action: 'NONE'
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: buildSystemPrompt(facility)
    });

    // Convert history to Gemini format
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Parse Action Tags
    let finalAction: ActionType = 'NONE';
    let cleanText = responseText;

    if (responseText.includes('<ACTION:RESERVE>')) {
      finalAction = 'RESERVE';
      cleanText = responseText.replace('<ACTION:RESERVE>', '');
    } else if (responseText.includes('<ACTION:MAP>')) {
      finalAction = 'MAP';
      cleanText = responseText.replace('<ACTION:MAP>', '');
    } else if (responseText.includes('<ACTION:CALL_MANAGER>')) {
      finalAction = 'CALL_MANAGER';
      cleanText = responseText.replace('<ACTION:CALL_MANAGER>', '');
    } else if (responseText.includes('<ACTION:RECOMMEND>')) {
      finalAction = 'RECOMMEND';
      cleanText = responseText.replace('<ACTION:RECOMMEND>', '');
    } else if (responseText.includes('<ACTION:SWITCH_TO_CONSULT>')) {
      finalAction = 'SWITCH_TO_CONSULT';
      cleanText = responseText.replace('<ACTION:SWITCH_TO_CONSULT>', '');
    } else if (responseText.includes('<ACTION:SHOW_FORM_A>')) {
      finalAction = 'SHOW_FORM_A';
      cleanText = responseText.replace('<ACTION:SHOW_FORM_A>', '');
    } else if (responseText.includes('<ACTION:NONE>')) {
      finalAction = 'NONE';
      cleanText = responseText.replace('<ACTION:NONE>', '');
    }

    return {
      text: cleanText.trim(),
      action: finalAction
    };

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Fallback to Mock AI
    console.log("Falling back to Mock AI due to error:", errorMessage);

    // Mock AI expects valid generator, but here we just need a single response.
    // We can iterate the generator once.
    const mockGen = getMockAIResponse(facility as any, message, "일반 문의");
    let mockText = "";
    for await (const chunk of mockGen) {
      mockText += chunk;
    }

    return {
      text: mockText || "죄송합니다. 현재 상담 연결이 원활하지 않습니다.",
      action: 'NONE'
    };
  }
};