import { create } from 'zustand';

interface MainBotContext {
    userRequirements?: {
        religion?: string;      // "기독교", "천주교"
        budget?: string;        // "300만원 이하"
        location?: string;      // "서울 강남구"
        urgency?: string;       // "긴급", "준비"
        features?: string[];    // ["24시간", "주차 가능"]
        originalMessage?: string; // The raw last message from user
    };
    recommendedFacilities?: string[];  // IDs
}

interface ConversationState {
    mainBotContext: MainBotContext;
    updateContext: (context: Partial<MainBotContext>) => void;
    clearContext: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
    mainBotContext: {},
    updateContext: (context) =>
        set((state) => ({
            mainBotContext: { ...state.mainBotContext, ...context }
        })),
    clearContext: () => set({ mainBotContext: {} })
}));

/**
 * Helper to generate a summary string for the Facility Bot System Prompt
 */
export function generateContextSummary(context: MainBotContext): string {
    const { userRequirements } = context;
    if (!userRequirements) return '';

    const parts = [];
    if (userRequirements.religion) {
        parts.push(`${userRequirements.religion} 시설 선호`);
    }
    if (userRequirements.budget) {
        parts.push(`예산 ${userRequirements.budget}`);
    }
    if (userRequirements.urgency === '긴급') {
        parts.push(`[긴급] 빠른 상담 필요`);
    } else if (userRequirements.urgency) {
        parts.push(`${userRequirements.urgency} 상황`);
    }
    if (userRequirements.location) {
        parts.push(`희망지역: ${userRequirements.location}`);
    }

    if (parts.length === 0 && userRequirements.originalMessage) {
        return `[이전 대화 요약] 고객이 "${userRequirements.originalMessage}"라고 문의했습니다.`;
    }

    return parts.length > 0
        ? `[고객 요구사항] ${parts.join(', ')}`
        : '';
}
