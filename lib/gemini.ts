import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "../types/consultation";
import { Facility } from "../types";
import { getMockAIResponse } from "./mockAI";

// Initialize Gemini Client
// NOTE: Ideally this should be server-side or via a proxy to protect the API key in production.
// For this MVP/Demo, client-side usage is acceptable with restrictions.
const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || "AIzaSyDt2aQzcyigpeIZGWug1e-jE0raTxnFXUE";
const USE_REAL_AI = false; // [Mock Mode] Set to true to enable Gemini

let genAI: any = null;

try {
    if (API_KEY && USE_REAL_AI) {
        genAI = new GoogleGenerativeAI(API_KEY);
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

export async function* streamConsultationMessage(
    facility: Facility,
    history: Message[],
    newMessage: string,
    topic: string,
    faqs: any[] = []
): AsyncGenerator<string, void, unknown> {
    // Try real API first, fallback to mock if it fails
    if (!USE_REAL_AI || !genAI || !API_KEY) {
        console.log("Using Mock AI (Simulation Mode)");
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
        generationConfig: MODEL_CONFIG.generationConfig
    });

    // Construct System Prompt
    const systemPrompt = `
당신은 '추모맵의 AI 상담사 마음이'입니다. 
다음 시설에 대한 상담을 진행하고 있습니다.

[시설 정보]
- 이름: ${facility.name}
- 유형: ${facility.type === 'charnel' ? '납골당' : facility.type === 'natural' ? '자연장' : '공원묘원/복합'}
- 주소: ${facility.address}
- 가격대: ${facility.priceRange}
- 상세설명: ${facility.description}
- 가격표: ${facility.prices.map(p => `${p.type}: ${p.price}`).join(', ')}

${faqs.length > 0 ? `
[자주 묻는 질문(FAQ)]
${faqs.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join('\n')}
` : ''}

[상담 지침]
1. 당신의 이름은 '마음이'입니다. 항상 친절하고 정중하게 답변하세요.
2. **모든 답변은 무조건 1~2줄 내외의 단답형으로 매우 간결하게 작성하세요.** 핵심 정보만 즉시 제공합니다.
3. 사용자가 1:1 상담, 전문 상담사 연결, 혹은 계약 의사를 밝히면 다음과 같이 안내하세요:
   - "성함, 연락처, 상담 가능 시간을 남겨주시면 담당자가 업체 대시보드에서 확인 후 즉시 연락드리겠습니다."
4. 불필요한 위로나 과도한 미사여구, 결정을 지연시키는 영업 멘트는 모두 삭제하세요.
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
                    parts: [{ text: systemPrompt + "\n\n준비가 되셨나요?" }]
                },
                {
                    role: "model",
                    parts: [{ text: `네, ${facility.name}의 ${topic}에 대해 성심성의껏 안내해 드리겠습니다. 무엇이 궁금하신가요?` }]
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
