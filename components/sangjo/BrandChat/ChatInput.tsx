import React from 'react';
import { FileText, Siren, BookOpen, Clock, Send } from 'lucide-react';
import { QuickMenuBtn } from '../ConsultationForm/QuickMenuBtn';

interface ChatInputProps {
    input: string;
    onInputChange: (val: string) => void;
    onSend: (msg?: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    themeColor: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ input, onInputChange, onSend, onKeyDown, themeColor }) => {
    return (
        <div className="bg-white border-t border-gray-100 p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0 relative">
            <div className="grid grid-cols-4 gap-2 mb-2">
                <QuickMenuBtn icon={<FileText className="w-5 h-5" />} label="상품 안내" onClick={() => onSend("상품 종류 보여줘")} />
                <QuickMenuBtn icon={<Siren className="w-5 h-5 text-red-500" />} label="긴급 접수" onClick={() => onSend("긴급 장례 접수")} />
                <QuickMenuBtn icon={<BookOpen className="w-5 h-5" />} label="장례 절차" onClick={() => onSend("장례 절차는 어떻게 돼?")} />
                <QuickMenuBtn icon={<Clock className="w-5 h-5" />} label="상담 예약" onClick={() => onSend("상담원 연결해줘")} active />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-[#005B50]/30 focus-within:border-[#005B50] transition-all">
                <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                    placeholder="궁금한 내용을 입력하세요..."
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={onKeyDown}
                />
                <button
                    onClick={() => onSend()}
                    disabled={!input.trim()}
                    className={`p-2 rounded-full transition-colors ${input.trim() ? `${themeColor} text-white` : 'bg-gray-200 text-gray-400'}`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
