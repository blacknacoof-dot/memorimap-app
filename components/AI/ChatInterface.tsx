import React, { useState, useRef, useEffect } from 'react';
import { Facility } from '../../types';
import { sendMessageToGemini, ChatMessage, ActionType } from '../../services/geminiService';
import { MessageCircle, X, Send, MapPin, Phone, CalendarCheck, Loader2, Bot, Sparkles, ChevronLeft } from 'lucide-react';
import { PetChatInterface } from '../Consultation/PetChatInterface';

interface Props {
    facility: Facility;
    onAction: (action: ActionType) => void;
    onClose: () => void;
}

export const ChatInterface: React.FC<Props> = ({ facility, onAction, onClose }) => {
    const isPetFacility = facility.type === 'pet';

    if (isPetFacility) {
        return <PetChatInterface
            company={facility as any}
            onClose={onClose}
            onBack={onClose}
        />;
    }

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // FAQ Chips (Dynamic based on facility type)
    const FAQ_LIST_FUNERAL = [
        { icon: "🚑", label: "운구요청", question: "지금 임종하셨습니다. 운구차(엠뷸런스)를 바로 보내줄 수 있나요? (긴급)" },
        { icon: "💰", label: "가격안내", question: "빈소 사용료와 식사 비용 등 대략적인 장례 비용을 알려주세요." },
        { icon: "🅿️", label: "주차안내", question: "조문객 주차 요금과 무료 주차 시간, 주차장 위치를 알려주세요." },
        { icon: "📄", label: "준비서류", question: "장례 접수 시 필요한 서류(사망진단서 등)와 준비물을 상세히 알려주세요." },
    ];

    const FAQ_LIST_PET = [
        { icon: "🚑", label: "픽업/이송", question: "아이가 무지개다리를 건넜어요. 픽업 와주실 수 있나요?" },
        { icon: "💰", label: "장례비용", question: "기본 화장 비용과 장례 패키지 가격이 궁금해요." },
        { icon: "⚱️", label: "유골안치", question: "화장 후 유골함 보관이나 메모리얼 스톤 제작이 가능한가요?" },
        { icon: "📝", label: "예약절차", question: "장례 예약을 하고 싶습니다. 절차가 어떻게 되나요?" },
    ];

    const FAQ_LIST_DEFAULT = [
        { icon: "💰", label: "가격/비용", question: "분양 가격과 관리비가 대략 얼마인가요?" },
        { icon: "🗺️", label: "위치/교통", question: "대중교통으로 가는 방법과 셔틀버스 운행 여부가 궁금합니다." },
        { icon: "📝", label: "계약 절차", question: "계약 진행 절차와 필요 서류를 알려주세요." },
        { icon: "📞", label: "상담 연결", question: "상담원과 직접 통화하고 싶습니다." },
    ];

    const activeFaqList = isPetFacility
        ? FAQ_LIST_PET
        : (facility.type === 'funeral' ? FAQ_LIST_FUNERAL : FAQ_LIST_DEFAULT);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            // Determine welcome message based on facility type
            const isFuneralHome = facility.type === 'funeral';

            let defaultWelcome = ``;
            if (isPetFacility) {
                defaultWelcome = `안녕하세요. **${facility.name}** 반려동물 장례지도사입니다.\n소중한 아이와의 이별을 도와드리겠습니다. \n차분하고 아름다운 이별을 위해 무엇이든 물어보세요.`;
            } else if (isFuneralHome) {
                defaultWelcome = `삼가 고인의 명복을 빕니다. **${facility.name}** 의전 매니저입니다. \n빈소 현황이나 절차에 대해 무엇이든 물어보세요.`;
            } else {
                defaultWelcome = `안녕하세요. **${facility.name}**입니다. \n고인을 위한 평온한 안식처를 찾으시나요? 시설 위치나 가격 등 무엇이든 물어보세요.`;
            }

            setMessages([{
                role: 'model',
                text: facility.ai_welcome_message || defaultWelcome,
                timestamp: new Date(),
                action: 'NONE'
            }]);

            // Auto-focus input on open
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [facility, isPetFacility]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : input;
        if (!textToSend.trim() || isLoading) return;

        if (!textOverride) setInput('');

        const userMsg: ChatMessage = {
            role: 'user',
            text: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await sendMessageToGemini(textToSend, messages, facility);

            const aiMsg: ChatMessage = {
                role: 'model',
                text: response.text,
                timestamp: new Date(),
                action: response.action
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden shadow-inner">

            {/* Header Area */}
            <div className={`bg-slate-900 text-white p-5 pt-6 shadow-md z-10 shrink-0`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-slate-500/30 overflow-hidden bg-slate-700`}>
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{facility.name}</h1>
                            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                {facility.type === 'funeral' ? 'AI 의전 매니저' : 'AI 추모 상담사'}
                            </p>
                        </div>
                    </div>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        title="상담 종료"
                    >
                        <X className="w-5 h-5 text-slate-300 hover:text-white" />
                    </button>
                </div>

                {/* Quick Info Badges & Direct Action */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 text-[11px] font-medium">
                        <span className={`bg-slate-800 border-slate-700 px-2 py-1 rounded text-slate-200`}>24시간 상담</span>
                        <span className={`bg-slate-800 border-slate-700 px-2 py-1 rounded text-slate-200 hidden sm:inline-block`}>실시간 답변</span>
                    </div>
                    <button
                        onClick={() => onAction('RESERVE')}
                        className={`bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-lg active:scale-95`}
                    >
                        <CalendarCheck size={14} />
                        바로 예약하기
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-4 no-scrollbar" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 text-sm leading-relaxed ${msg.role === 'user'
                            ? `bg-slate-800 text-white rounded-2xl rounded-tr-sm shadow-sm`
                            : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm'
                            }`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>

                            {/* Action Buttons for AI messages */}
                            {msg.role === 'model' && msg.action && msg.action !== 'NONE' && (
                                <button
                                    onClick={() => onAction(msg.action!)}
                                    className="mt-3 w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm"
                                >
                                    {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> 예약 상담 접수</>}
                                    {msg.action === 'MAP' && <><MapPin size={16} /> 오시는 길 보기</>}
                                    {msg.action === 'CALL_MANAGER' && <><Phone size={16} /> 담당자 전화 연결</>}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.32s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.16s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* FAQ Chips */}
            <div className="bg-white border-t border-slate-100 p-3 pb-0">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {activeFaqList.map((faq, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(faq.question)}
                            disabled={isLoading}
                            className="flex-shrink-0 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-full transition whitespace-nowrap flex items-center gap-1.5 active:scale-95"
                        >
                            <span>{faq.icon}</span>
                            <span className="font-medium">{faq.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 pt-2 pb-6">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all px-4 py-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="궁금하신 점을 말씀해주세요..."
                            className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-slate-400"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Sparkles size={10} /> Powered by Gemini 2.0 Flash
                    </p>
                </div>
            </div>
        </div>
    );
};
