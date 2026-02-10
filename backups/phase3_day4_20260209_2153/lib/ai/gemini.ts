import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
// ERROR HANDLING: Ensure VITE_GEMINI_API_KEY is set in .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-pro' });
} else {
  console.warn('Verificaton Warning: VITE_GEMINI_API_KEY is missing. AI features will be disabled.');
}

/**
 * Generate a response from Gemini AI
 */
export const generateAIResponse = async (prompt: string, context: string): Promise<string> => {
  if (!model) {
    return '죄송합니다. 현재 AI 서비스를 사용할 수 없습니다. (API Key Missing)';
  }

  try {
    const fullPrompt = `
System Context:
${context}

User Query:
${prompt}

Instructions:
당신은 위 시설의 친절한 장례 상담원 '초코'입니다.
고객의 질문에 대해 주어진 Context를 바탕으로 정확하고 따뜻하게 답변해주세요.
한국어로 답변하고, 모르는 내용은 솔직하게 "해당 내용은 시설에 직접 문의가 필요합니다"라고 답변하세요.
    `.trim();

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return '죄송합니다. AI 응답 생성 중 오류가 발생했습니다.';
  }
};
