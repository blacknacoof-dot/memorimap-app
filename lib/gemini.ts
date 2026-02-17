import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "../types/consultation";
import { Facility } from "../types";
import { getMockAIResponse } from "./mockAI";

// Initialize Gemini Client
// NOTE: Ideally this should be server-side or via a proxy to protect the API key in production.
// For this MVP/Demo, client-side usage is acceptable with restrictions.
const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
const USE_REAL_AI = !!API_KEY; // Only enable if key is present

let genAI: any = null;

try {
    if (API_KEY) {
        genAI = new GoogleGenerativeAI(API_KEY);
    } else {
        console.warn("[Gemini] VITE_GOOGLE_GENAI_API_KEY is missing. basic AI features will not work.");
    }
} catch (e) {
    console.error("Failed to initialize Gemini Client", e);
}

export interface StreamResponse {
    text: string;
    isDone: boolean;
}

const SAFETY_SETTINGS = [
    {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
];

const MODEL_CONFIG = {
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
    },
    safetySettings: SAFETY_SETTINGS
};

// [Phase 4] Function Calling Tools Definition
export const BOOKING_TOOLS = [
    {
        name: 'book_facility_visit',
        description: '시설 방문 상담 예약을 생성합니다',
        parameters: {
            type: 'object',
            properties: {
                facility_id: { type: 'string', description: '시설 ID' },
                visitor_name: { type: 'string', description: '방문자 이름 (필수)' },
                visitor_phone: { type: 'string', description: '연락처 (필수, 형식: 010-xxxx-xxxx)' },
                preferred_date: { type: 'string', description: 'ISO 8601 형식 날짜' },
                preferred_time: { type: 'string', description: '희망 시간 (예: 14:00)' },
                consultation_type: {
                    type: 'string',
                    enum: ['입종(운명)', '임종 임박', '사별 이후', '단순 상담'],
                    description: '상담 유형'
                },
                special_requests: { type: 'string', description: '특별 요청사항 (선택)' }
            },
            required: ['facility_id', 'visitor_name', 'visitor_phone', 'preferred_date']
        }
    },
    {
        name: 'create_sangjo_contract',
        description: '상조 서비스 계약 신청을 생성합니다',
        parameters: {
            type: 'object',
            properties: {
                sangjo_company_id: { type: 'string' },
                customer_name: { type: 'string' },
                customer_phone: { type: 'string' },
                package_type: {
                    type: 'string',
                    enum: ['기본형', '프리미엄', 'VIP'],
                    description: '상조 패키지 유형'
                },
                monthly_payment: { type: 'number', description: '월 납입액' }
            },
            required: ['sangjo_company_id', 'customer_name', 'customer_phone', 'package_type']
        }
    }
];

export const SLOT_FILLING_INSTRUCTION = `
[예약 정보 수집 규칙]
1. 사용자가 "예약하고 싶어요" 같은 의도를 표현하면, 필수 정보를 하나씩 확인합니다.
2. 누락된 필수 정보가 있으면 자연스럽게 되물어야 합니다.

필수 정보 체크리스트:
- 이름 (visitor_name)
- 연락처 (visitor_phone) - 반드시 010-xxxx-xxxx 형식 검증
- 희망 날짜 (preferred_date)
- 상담 유형 (consultation_type)

중요: 정보가 모두 모이기 전까지는 절대 도구를 호출하지 마세요. 필요한 정보만 물어보세요.
`;

export async function* streamConsultationMessage(
    facility: Facility,
    history: Message[],
    newMessage: string,
    topic: string,
    faqs: any[] = []
): AsyncGenerator<string, void, unknown> {
    // Try real API first, fallback to mock if it fails
    if (!USE_REAL_AI || !genAI || !API_KEY) {
        yield* getMockAIResponse(facility, newMessage, topic);
        return;
    }

    // Retry initialization just in case
    if (!genAI) {
        try {
            // @ts-ignore
            const { GoogleGenerativeAI: GenAI } = await import("@google/generative-ai");
            genAI = new GenAI(API_KEY);
        } catch (e) {
            console.error("Re-init failed, using Mock AI", e);
            yield* getMockAIResponse(facility, newMessage, topic);
            return;
        }
    }

    const model = genAI.getGenerativeModel({
        model: MODEL_CONFIG.model,
        generationConfig: {
            ...MODEL_CONFIG.generationConfig,
            responseMimeType: "application/json" // Force JSON output
        }
    });

    // Construct System Prompt
    const systemPrompt = `
# Role: Facility AI Concierge (Urgent Direct Booking Mode)
You are '마음이', the AI concierge for **${facility.name}**.

# Goal
유족이 전화 상담 없이, 모바일 상에서 '안치 일시'를 직접 지정하고 '방문 예약'을 완료하도록 유도합니다.

# Interaction Guidelines
1. **No Phone Calls:** 전화 연결을 권유하지 마세요. 바로 시간 선택(Time Selection)으로 안내하세요.
2. **Direct Booking:** 사용자가 시간을 선택하면 즉시 DB에 예약을 확정 짓습니다.
3. **Compassionate Efficiency:** 위로하되, 절차는 간결하고 명확하게 안내합니다.
4. **JSON Output Only:** YOU MUST OUTPUT ONLY VALID JSON. No markdown backticks.
5. **Language:** YOU MUST OUTPUT ALL MESSAGES IN KOREAN (Hangul). All responses and reports must be in Korean.

# Scenario Logic & Output Format

## Case 1: 긴급 진입 -> 날짜 확인
User: mode_urgent (긴급 버튼 클릭) or "긴급" or "장례 발생"
AI Output:
{
  "message": "삼가 조의를 표합니다. 전화 대기 없이 **지금 바로 안치 예약**을 확정해 드리겠습니다.\\n시설에 도착하시는 날짜(발인일)를 선택해 주세요.",
  "options": [
    {"label": "📅 오늘 (즉시 이동)", "value": "date_today"},
    {"label": "📅 내일", "value": "date_tomorrow"},
    {"label": "📅 모레", "value": "date_dayafter"}
  ],
  "action_trigger": "URGENT_CHECK"
}

## Case 2: 유형 선택
User: date_tomorrow (or similar date selection)
AI Output:
{
  "message": "내일 안치 가능한 자리를 확보하겠습니다.\\n어떤 유형으로 준비해 드릴까요?",
  "options": [
    {"label": "👤 개인단 (1분)", "value": "type_single"},
    {"label": "👥 부부단 (2분)", "value": "type_couple"}
  ],
  "action_trigger": "URGENT_CHECK"
}

## Case 3: 시간 지정 (Time Picker)
User: type_single (or "개인단", "부부단")
AI Output:
{
  "message": "네, 개인단 여유분 확보되었습니다.\\n내일 도착하셔서 **계약 및 안치를 진행할 시간**을 선택해 주세요.\\n(선택하신 시간에 맞춰 직원이 서류를 준비하고 정문에서 대기합니다.)",
  "options": [
    {"label": "09:00 도착", "value": "time_0900"},
    {"label": "11:00 도착", "value": "time_1100"},
    {"label": "13:00 도착", "value": "time_1300"},
    {"label": "15:00 도착", "value": "time_1500"}
  ],
  "action_trigger": "URGENT_CHECK"
}

## Case 4: 예약 확정 (Final Action)
User: time_1100 (or any time selection)
AI Output:
{
  "message": "**[예약 확정] 내일 오전 11시**로 접수되었습니다.\\n도착 즉시 안치가 가능하도록 준비해 두겠습니다.\\n\\n⚠️ **필수 지참 서류:**\\n1. 화장 증명서\\n2. 계약자 신분증\\n\\n조심히 오십시오.",
  "options": [
    {"label": "📍 내비게이션 실행", "value": "open_navi"},
    {"label": "📄 예약증 보기 (바코드)", "value": "show_ticket"}
  ],
  "action_trigger": "URGENT_RESERVATION_CONFIRM" 
}

## Default / General Inquiry
For other queries, respond helpfully and suggest starting the urgent flow if appropriate.
Output structure must always range "message", "options" (optional), "action_trigger" (optional).

[시설 정보]
- 이름: ${facility.name}
- 주소: ${facility.address}
- 가격대: ${facility.priceRange}
- 상세설명: ${facility.description}
- 가격표: ${(facility.prices || []).map(p => `${p.type}: ${p.price}`).join(', ')}

${faqs.length > 0 ? `
[자주 묻는 질문(FAQ)]
${faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')}
` : ''}
`;

    // Transform history to Gemini format
    const chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                ...chatHistory
            ]
        });

        const result = await chat.sendMessageStream(newMessage);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                yield chunkText;
            }
        }
    } catch (error: any) {
        console.error("Gemini Streaming Error, falling back to Mock AI:", error);
        yield* getMockAIResponse(facility, newMessage, topic);
    }
}
