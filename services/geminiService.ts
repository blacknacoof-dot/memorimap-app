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