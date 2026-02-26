import { create } from 'zustand';

type ChatIntent = 'funeral_home' | 'memorial_facility' | 'pet_funeral' | null;

interface ChatState {
    isOpen: boolean;
    intent: ChatIntent;
    openChat: (intent: ChatIntent) => void;
    closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    intent: null,
    openChat: (intent) => set({ isOpen: true, intent }),
    closeChat: () => set({ isOpen: false, intent: null }),
}));
