import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, MapPin, Phone, CalendarCheck, Loader2, Bot, Heart, Sparkles, ChevronLeft, Dog, CheckCircle } from 'lucide-react';
import { FuneralCompany } from '../../types';
import { sendMessageToGemini, ChatMessage as GeminiMessage } from '../../services/geminiService';

/**
 * ------------------------------------------------------------------
 * Type Definitions & Interfaces
 * ------------------------------------------------------------------
 */
type AiActionType = 'NONE' | 'RESERVE' | 'MAP' | 'CALL_MANAGER';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
    action?: AiActionType;
}

interface ComponentProps {
    company: FuneralCompany;
    onClose: () => void;
    onBack: () => void;
}

/**
 * ------------------------------------------------------------------
 * Reservation Form Component
 * ------------------------------------------------------------------
 */
const ReservationForm = ({ onClose, companyName }: { onClose: () => void, companyName: string }) => {
    const [formData, setFormData] = useState({
        guardianName: '',
        phone: '',
        petType: '강아지',
        petName: '',
        weight: '',
        date: '',
        requests: '',
        stone: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 rounded-[32px]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">예약 신청 완료</h3>
                <p className="text-stone-500 text-center mb-6 text-sm">
                    {formData.petName}의 장례 예약이 접수되었습니다.<br />
                    입력하신 연락처로 담당자가<br />확인 후 10분 내로 연락드리겠습니다.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition"
                >
                    확인
                </button>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300 sm:rounded-[32px]">
            {/* Form Header */}
            <div className="bg-amber-900 text-white p-5 pt-6 shadow-md shrink-0 flex justify-between items-center sm:rounded-t-[32px]">
                <h2 className="font-bold text-lg">장례 예약 신청</h2>
                <button onClick={onClose} className="p-1 hover:bg-amber-800 rounded-full">
                    <X className="w-6 h-6 text-amber-200" />
                </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50 scrollbar-hide">
                <form onSubmit={handleSubmit} className="space-y-5 pb-6">

                    {/* 보호자 정보 그룹 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            보호자 정보
                        </h3>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">성함</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                placeholder="홍길동"
                                value={formData.guardianName}
                                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">연락처 (핸드폰)</label>
                            <input
                                required
                                type="tel"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                placeholder="010-0000-0000"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 my-2"></div>

                    {/* 아이 정보 그룹 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            아이 정보
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-1.5">종류</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm appearance-none"
                                    value={formData.petType}
                                    onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                                >
                                    <option value="강아지">강아지</option>
                                    <option value="고양이">고양이</option>
                                    <option value="소동물">소동물 (햄스터/토끼 등)</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-1.5">이름</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                    placeholder="ex. 몽이"
                                    value={formData.petName}
                                    onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">몸무게 (kg)</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                placeholder="ex. 3.5"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 my-2"></div>

                    {/* 예약 정보 그룹 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            예약 상세
                        </h3>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">희망 방문 일시</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm text-stone-600"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">추가 요청사항 (선택)</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm resize-none"
                                placeholder="ex. 픽업 서비스가 필요합니다."
                                rows={2}
                                value={formData.requests}
                                onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                checked={formData.stone}
                                onChange={(e) => setFormData({ ...formData, stone: e.target.checked })}
                            />
                            <span className="text-sm font-medium text-amber-900">
                                메모리얼 스톤(보석) 제작 상담 희망
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg active:scale-95 disabled:bg-stone-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
                            예약 신청하기
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

/**
 * ------------------------------------------------------------------
 * Pet Chat Interface Component
 * ------------------------------------------------------------------
 */
export const PetChatInterface: React.FC<ComponentProps> = ({ company, onClose, onBack }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showReservation, setShowReservation] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 반려동물 장례 특화 FAQ
    const FAQ_LIST = [
        { icon: "🚑", label: "운구/픽업", question: "아이가 무지개 다리를 건넜어요. 픽업 와주실 수 있나요?" },
        { icon: "⚖️", label: "비용 안내", question: "장례 비용과 스톤 제작 비용 등을 표로 보여주세요." },
        { icon: "💎", label: "스톤/보석", question: "메모리얼 스톤(루세떼) 제작 가격과 과정을 표로 정리해주세요." },
        { icon: "🕯️", label: "장례 절차", question: "장례 진행 시간과 절차가 어떻게 되나요?" },
    ];

    // Initialize Welcome Message
    useEffect(() => {
        setMessages([{
            id: 'welcome',
            sender: 'ai',
            text: company.ai_welcome_message || `보호자님, ${company.name} 반려동물 장례지도사입니다. 아이와의 이별 절차에 대해 무엇이든 물어보세요.`,
            timestamp: new Date(),
            action: 'NONE' as AiActionType
        }]);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [company]);

    // Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const getStandardResponse = (topic: string, company: FuneralCompany): { text: string, action: AiActionType } | null => {
        const prices = company.ai_price_summary || {
            basic_5kg: "20만원",
            basic_10kg: "25만원",
            large_kg: "40만원 부터",
            shroud: "10만원",
            stone: "20만원",
            pickup_basic: "5만원",
            pickup_long: "10만원~"
        };

        const safeTopic = topic.replace(/\s+/g, ''); // 공백 제거 후 비교

        // 1. Pickup/Transport (가장 우선순위 높음)
        if (safeTopic.includes("픽업") || safeTopic.includes("운구") || safeTopic.includes("이송")) {
            return {
                text: `보호자님, 얼마나 마음이 아프실까요. 깊은 위로의 말씀을 전합니다.
네, 저희가 아이를 직접 모시러 가는 픽업 서비스가 가능합니다.

정확한 픽업 시간과 비용 안내를 위해 현재 계신 곳의 주소를 알려주시겠어요? 신속하게 움직이겠습니다.`,
                action: 'RESERVE' // "바로 예약하기" 버튼 표시
            };
        }

        // 2. Stone/Lucete (Cost보다 먼저 체크하되, '장례비용'을 묻는 경우는 제외)
        if ((safeTopic.includes("루세떼") || safeTopic.includes("스톤") || safeTopic.includes("보석")) && !safeTopic.includes("장례비용")) {
            return {
                text: `보호자님, 루세떼(메모리얼 스톤) 제작 비용은 기본 20만원이며, 제작 과정은 아래와 같습니다.

| 단계 | 과정 | 소요 시간 |
| :--- | :--- | :--- |
| **1단계** | 유골 수습 및 미세 분골 | 10분 |
| **2단계** | 유골 성형 및 용융 준비 | 5분 |
| **3단계** | 고온 용융 및 냉각 | 약 40~50분 |
| **4단계** | 스톤 완성 및 보호자 인도 | 즉시 |

전체적으로 1시간 내외의 시간이 소요되며, 아이의 유골만 100% 사용하여 투명하고 아름다운 스톤을 제작합니다.`,
                action: 'NONE'
            };
        }

        // 3. Procedure
        if (safeTopic.includes("절차") || safeTopic.includes("과정") || safeTopic.includes("순서")) {
            return {
                text: `장례 절차는 아이의 몸무게와 선택하신 서비스에 따라 다르지만, 보통 1시간 30분에서 2시간 정도 소요됩니다.

일반적인 절차는 '염습 및 추모식(15분) → 개별 화장(40분~1시간) → 유골 수습 및 분골(10분) → 스톤 또는 유골함 인도' 순으로 진행됩니다.

저희 '${company.name}'에서는 모든 과정을 보호자님께 투명하게 공개하고, 아이를 정성껏 배웅하실 수 있도록 돕겠습니다.`,
                action: 'NONE'
            };
        }

        // 4. Cost (가장 포괄적인 키워드이므로 마지막에 체크)
        if (safeTopic.includes("비용") || safeTopic.includes("가격") || safeTopic.includes("금액")) {
            return {
                text: `보호자님, 아이의 몸무게(kg)에 따라 기본 화장 비용이 달라집니다. 아이의 몸무게를 먼저 알려주시겠어요?
일반적인 비용 항목은 아래 표를 참고해 주세요.

| 서비스 항목 | 상세 내용 | 가격 |
| :--- | :--- | :--- |
| **기본 화장** | ~5kg | ${prices.basic_5kg} |
| **기본 화장** | 5~10kg | ${prices.basic_10kg} |
| **대형견 화장** | 15kg~ | ${prices.large_kg} |
| **염습/수의** | 준비 및 정돈 | ${prices.shroud} |
| **메모리얼 스톤** | 기본 제작 | ${prices.stone} |
| **픽업(기본거리)** | 운구 서비스 | ${prices.pickup_basic} |
| **픽업(장거리)** | 운구 서비스 | ${prices.pickup_long} |`,
                action: 'NONE'
            };
        }

        return null; // 표준 응답이 없으면 AI 로직으로 넘어감
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : input;
        if (!textToSend.trim() || isLoading) return;

        if (!textOverride) setInput('');

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setIsTyping(true);



        // 1. Check for Standard Responses (Rules Rule-based)
        const standardResponse = getStandardResponse(textToSend, company);
        if (standardResponse) {
            // Simulate a short delay for natural feel
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: standardResponse.text,
                    timestamp: new Date(),
                    action: standardResponse.action
                }]);
                setIsLoading(false);
                setIsTyping(false);
            }, 500);
            return; // Early return if standard response is found
        }

        // 2. Convert local messages to Gemini history format
        try {
            const history: GeminiMessage[] = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                text: m.text,
                timestamp: m.timestamp
            }));

            const response = await sendMessageToGemini(textToSend, history, company);

            // Parse Action
            let action: AiActionType = 'NONE';
            if (response.action === 'RESERVE') action = 'RESERVE';
            if (response.action === 'MAP') action = 'MAP';
            if (response.action === 'CALL_MANAGER') action = 'CALL_MANAGER';

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response.text,
                timestamp: new Date(),
                action: action
            }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "죄송합니다. 잠시 후 다시 시도해 주세요.",
                timestamp: new Date(),
                action: 'NONE'
            }]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleActionClick = (action: AiActionType) => {
        if (action === 'RESERVE') {
            setShowReservation(true);
        }
        if (action === 'MAP') alert(`[지도 연동]\n주소: ${(company as any).address || '주소 정보 없음'}`);
        if (action === 'CALL_MANAGER') window.location.href = `tel:${company.phone}`;
    };

    return (
        <div className="flex flex-col h-full bg-white relative font-sans">

            {/* Reservation Form Overlay */}
            {showReservation && (
                <div className="absolute inset-0 z-50">
                    <ReservationForm onClose={() => setShowReservation(false)} companyName={company.name} />
                </div>
            )}

            {/* Header */}
            <div className="bg-amber-900 text-white p-5 pt-6 shadow-md z-10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="mr-1 hover:text-amber-200">
                            <ChevronLeft className="text-white w-6 h-6" />
                        </button>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-amber-800 flex items-center justify-center border-2 border-amber-600 overflow-hidden shadow-sm">
                                {/* Logo or Dog Icon */}
                                {company.imageUrl ? (
                                    <img src={company.imageUrl} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Dog className="text-amber-100 w-7 h-7" />
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-amber-900 rounded-full animate-pulse"></span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight text-white">{company.name}</h1>
                            <p className="text-xs text-amber-200/80 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                반려동물 장례지도사
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-amber-800 rounded-full transition-colors" title="닫기">
                        <X className="w-6 h-6 text-amber-200 hover:text-white" />
                    </button>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex gap-2 text-[11px] font-medium">
                        <span className="bg-amber-800/50 px-2 py-1 rounded text-amber-100 border border-amber-700">개별 화장</span>
                        <span className="bg-amber-800/50 px-2 py-1 rounded text-amber-100 border border-amber-700">스톤 제작</span>
                    </div>
                    {/* 바로 예약하기 버튼 */}
                    <button
                        onClick={() => handleActionClick('RESERVE')}
                        className="bg-white hover:bg-amber-50 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-md active:scale-95"
                    >
                        <CalendarCheck size={14} />
                        바로 예약하기
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 bg-stone-50 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                            ? 'bg-amber-800 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white text-stone-800 border border-stone-200 rounded-2xl rounded-tl-sm'
                            }`}>
                            <div
                                className="whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: msg.text }}
                            />

                            {msg.sender === 'ai' && msg.action !== 'NONE' && (
                                <button onClick={() => handleActionClick(msg.action!)} className="mt-4 w-full bg-amber-50/50 border border-amber-100 hover:bg-amber-100/50 text-amber-900 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm">
                                    {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> 바로 예약하기</>}
                                    {msg.action === 'MAP' && <><MapPin size={16} /> 오시는 길</>}
                                    {msg.action === 'CALL_MANAGER' && <><Phone size={16} /> 지도사 전화 연결</>}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1.5 items-center">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* FAQ Chips */}
            <div className="bg-white border-t border-stone-100 p-3 pb-0">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {FAQ_LIST.map((faq, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(faq.question)}
                            disabled={isLoading}
                            className="flex-shrink-0 bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-amber-200 text-stone-600 hover:text-amber-900 text-xs py-2 px-3 rounded-full transition whitespace-nowrap flex items-center gap-1.5 active:scale-95"
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
                    <div className="flex-1 bg-stone-50 rounded-2xl border border-transparent focus-within:border-amber-300 focus-within:bg-white transition-all px-4 py-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendMessage()}
                            placeholder="아이 이름, 몸무게 등을 말씀해주세요..."
                            className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-stone-400 text-stone-800"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="w-12 h-12 bg-amber-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-800 active:scale-95 transition-all disabled:bg-stone-200 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
