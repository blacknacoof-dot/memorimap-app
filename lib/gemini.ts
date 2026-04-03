import { Message } from "../types/consultation";
import { Facility } from "../types";
import { getMockAIResponse } from "./mockAI";

// Gemini API는 Edge Function (gemini-proxy)을 통해 호출
// 클라이언트에 API 키를 노출하지 않음
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_PROXY_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/gemini-proxy` : '';
const USE_REAL_AI = !!GEMINI_PROXY_URL;

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

const _MODEL_CONFIG = {
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
    faqs: Array<{ question: string; answer: string }> = []
): AsyncGenerator<string, void, unknown> {
    if (!USE_REAL_AI) {
        yield* getMockAIResponse(facility, newMessage, topic);
        return;
    }

    // System prompt 구성
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

- 현재 상담 주제: ${topic}
${faqs.length > 0 ? `
[자주 묻는 질문(FAQ)]
${faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')}
` : ''}
`;

    const chatHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.text,
    }));

    try {
        // [AUTH-13 FIX] 사용자 JWT를 Authorization 헤더로 전송
        // Edge Function이 인증된 사용자만 허용하도록 변경됨
        const { getCurrentAccessToken } = await import('./supabaseClient');
        const userToken = await getCurrentAccessToken();
        if (!userToken) {
            throw new Error('인증 토큰이 없습니다. 로그인 후 다시 시도해주세요.');
        }

        const response = await fetch(GEMINI_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                systemPrompt,
                history: chatHistory,
                message: newMessage,
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini proxy error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE 파싱: data: {...} 형태
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(jsonStr);
                    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) yield text;
                } catch {
                    // JSON 파싱 실패 시 무시
                }
            }
        }
    } catch (_error: unknown) {
        yield* getMockAIResponse(facility, newMessage, topic);
    }
}
