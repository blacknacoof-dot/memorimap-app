import React, { useState, useRef, useEffect } from 'react';
import { Facility } from '../../types';
import { sendMessageToGemini, ChatMessage, ActionType } from '../../services/geminiService';
import { getIntelligentRecommendations, createLead, getDistinctRegions, searchFacilitiesByRegion } from '../../lib/queries';
import { MessageCircle, X, Send, MapPin, Phone, CalendarCheck, Loader2, Bot, Sparkles, ChevronLeft, Users, Star, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { PetChatInterface } from '../Consultation/PetChatInterface';

interface Props {
    facility: Facility;
    allFacilities?: Facility[];
    onAction: (action: ActionType) => void;
    onClose: () => void;
    currentUser: any;
    initialIntent?: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general' | null;
    onSwitchToFacility?: (facility: Facility, context?: any) => void;
    onNavigateToFacility?: (facility: Facility) => void;
    userLocation?: { lat: number, lng: number, type: string };
    onGetCurrentPosition?: () => void;
    handoverContext?: any;
    onSearchFacilities?: (region: string) => Facility[];
}



interface FormProps {
    userLocation?: { lat: number, lng: number, type: string };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: any) => void;
    initialCategory?: string; // [NEW] Allow overriding category
}

const FuneralSearchForm: React.FC<FormProps> = ({ userLocation, onGetCurrentPosition, onSubmit, initialCategory = 'funeral' }) => {
    const [step, setStep] = useState(1);
    const [urgency, setUrgency] = useState<'immediate' | 'imminent' | 'prepare' | ''>('');
    const [region, setRegion] = useState('');
    const [scale, setScale] = useState('');
    const [priorities, setPriorities] = useState<string[]>([]);
    const [error, setError] = useState('');

    const URGENCY_OPTIONS = [
        { id: 'immediate', label: '🚨 지금 임종하셨어요 (긴급)', sub: '운구차 및 빈소 즉시 확보' },
        { id: 'imminent', label: '🏥 임종이 임박했어요 (위독)', sub: '사전 상담 및 빈소 예약 준비' },
        { id: 'prepare', label: '📅 미리 알아보고 있어요', sub: '비교 견적 및 시설 탐색' }
    ];

    const SCALE_OPTIONS = [
        { id: 'small', label: '가족장 (소규모)', sub: '50명 미만 (20~30평형)' },
        { id: 'medium', label: '일반 (중형)', sub: '100~200명 (40~60평형)' },
        { id: 'large', label: '대규모 (단체장)', sub: '300명 이상 (VIP실)' }
    ];

    const PRIORITY_OPTIONS = ['💰 비용 절약', '🚗 주차 편리', '✨ 시설 쾌적', '🍽️ 음식 맛', '✝️ 종교 전용'];

    // [NEW] Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // [NEW] Handle Region Input with Debounce
    useEffect(() => {
        if (!region || region.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Use the new RPC wrapper
                const results = await getDistinctRegions(region) as string[];
                // Simple deduplication just in case
                const uniqueResults = Array.from(new Set(results)).slice(0, 5);
                setSuggestions(uniqueResults);
                setShowSuggestions(uniqueResults.length > 0);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms delay

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [region]);

    const handleNext = async () => {
        if (step === 1 && !urgency) {
            setError('현재 상황을 선택해 주세요.');
            return;
        }
        if (step === 2) {
            if (!region && userLocation?.type !== 'gps') {
                setError('지역을 입력하거나 내 위치를 사용해 주세요.');
                return;
            }
            // [NEW] Validation: If user entered text manually, check if it yields results
            if (region) {
                // Quick check using searchFacilitiesByRegion (limit 1)
                // This prevents "Next" if no facilities exist for that region text
                // Note: We skip this check if user chose "GPS" explicitly, but here we cover text case.
                try {
                    const check = await searchFacilitiesByRegion(region, 'funeral'); // Assuming funeral for now or generic
                    if (!check || check.length === 0) {
                        setError('해당 지역에는 등록된 장례식장이 없습니다. 다른 지역을 입력해 주세요.');
                        return;
                    }
                } catch (e) {
                    // ignore error, proceed? or block? 
                    // block better
                }
            }
        }
        if (step === 3 && !scale) {
            setError('조문객 규모를 선택해 주세요.');
            return;
        }
        setError('');
        setStep(prev => prev + 1);
    };

    const handleSubmit = () => {
        if (priorities.length === 0) {
            setError('하나 이상의 우선순위를 선택해 주세요.');
            return;
        }

        // Structured JSON for recommended action
        const searchData = {
            category: initialCategory, // [FIX] Use dynamic category
            urgency,
            location: {
                type: userLocation?.type === 'gps' && !region ? 'gps' : 'text',
                lat: userLocation?.lat,
                lng: userLocation?.lng,
                text: region || '내 위치 주변'
            },
            scale,
            priorities
        };

        const finalText = `[🏢 장례식장 상담 신청]\n상황: ${URGENCY_OPTIONS.find(o => o.id === urgency)?.label}\n지역: ${region || '내 위치 주변'}\n규모: ${SCALE_OPTIONS.find(o => o.id === scale)?.label}\n우선순위: ${priorities.join(', ')}`;

        onSubmit({ text: finalText, data: searchData });
    };

    const togglePriority = (option: string) => {
        setPriorities(prev =>
            prev.includes(option) ? prev.filter(p => p !== option) : [...prev, option]
        );
        setError('');
    };

    return (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 w-full animate-in fade-in zoom-in-95 duration-300">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-5 px-1">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex-1 flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {s}
                        </div>
                        {s < 4 && <div className={`flex-1 h-px mx-1 ${step > s ? 'bg-slate-900' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Urgency */}
            {step === 1 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-red-500" />
                        현재 상황이 어떠신가요?
                    </label>
                    <div className="flex flex-col gap-2">
                        {URGENCY_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { setUrgency(opt.id as any); setError(''); }}
                                className={`text-left p-3 rounded-xl border transition-all ${urgency === opt.id
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="text-sm font-bold">{opt.label}</div>
                                <div className={`text-[10px] mt-0.5 ${urgency === opt.id ? 'text-slate-400' : 'text-slate-400'}`}>{opt.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin size={14} className="text-indigo-600" />
                        어느 지역의 장례식장을 찾으시나요?
                    </label>

                    <button
                        onClick={() => { onGetCurrentPosition?.(); setRegion(''); setError(''); }}
                        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${userLocation?.type === 'gps' && !region
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <MapPin size={16} />
                        내 위치 주변 (GPS)
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="bg-slate-50 px-2 text-slate-400 uppercase">또는 직접 입력</span>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={region}
                            onChange={(e) => { setRegion(e.target.value); setError(''); }}
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                            placeholder="예: 서울 강남구, 부산진구"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-sm focus:border-slate-900 focus:outline-none"
                        />
                        {/* [NEW] Suggestions Dropdown */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setRegion(s);
                                            setShowSuggestions(false);
                                            setError('');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none flex items-center gap-2"
                                    >
                                        <MapPin size={12} className="text-slate-400" />
                                        {/* Highlight matching part */}
                                        <span dangerouslySetInnerHTML={{
                                            __html: s.replace(new RegExp(region, 'gi'), (match) => `<b>${match}</b>`)
                                        }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Scale */}
            {step === 3 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600" />
                        예상 조문객 수는 어느 정도인가요?
                    </label>
                    <div className="flex flex-col gap-2">
                        {SCALE_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { setScale(opt.id); setError(''); }}
                                className={`text-left p-3 rounded-xl border transition-all ${scale === opt.id
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="text-sm font-bold">{opt.label}</div>
                                <div className={`text-[10px] mt-0.5 ${scale === opt.id ? 'text-slate-400' : 'text-slate-400'}`}>{opt.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Priorities */}
            {step === 4 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Star size={14} className="text-indigo-600" />
                        우선순위를 선택해 주세요 (중복 가능)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRIORITY_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => togglePriority(opt)}
                                className={`py-2 px-3 text-xs rounded-full border transition-all ${priorities.includes(opt)
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-3 flex items-center gap-1.5 text-red-500 text-[10px] animate-pulse">
                    <AlertCircle size={10} />
                    <span>{error}</span>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-4 flex gap-2">
                {step > 1 && (
                    <button
                        onClick={() => setStep(prev => prev - 1)}
                        className="px-4 py-2 text-slate-500 text-xs hover:bg-slate-100 rounded-xl transition"
                    >
                        이전
                    </button>
                )}
                <button
                    onClick={step === 4 ? handleSubmit : handleNext}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                    {step === 4 ? <><Check size={16} /> 최적의 장소 찾기</> : '다음 단계'}
                </button>
            </div>
        </div>
    );
};

export const ChatInterface: React.FC<Props> = ({
    facility,
    allFacilities = [],
    onAction,
    onClose,
    currentUser,
    initialIntent,
    onSwitchToFacility,
    onNavigateToFacility,
    userLocation,
    onGetCurrentPosition,
    handoverContext
}) => {

    const isPetFacility = facility.type === 'pet' || initialIntent === 'pet_funeral';

    if (isPetFacility && facility.id !== 'maum-i') {
        return <PetChatInterface
            company={facility as any}
            onClose={onClose}
            onBack={onClose}
        />;
    }

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendedCandidates, setRecommendedCandidates] = useState<Facility[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // FAQ Chips (Dynamic based on facility type)
    const FAQ_LIST_FUNERAL = [
        { icon: "📍", label: "내 위치 주변", question: "내 주변에서 가장 가까운 장례식장을 찾아주세요." },
        { icon: "👨‍👩‍👧‍👦", label: "가족장(소규모)", question: "조문객 50명 미만의 소규모 가족장 장례식장을 추천해 주세요." },
        { icon: "🏢", label: "대학병원", question: "대학병원 장례식장 위주로 보여주세요." },
        { icon: "💰", label: "비용 우선", question: "가격이 합리적이고 저렴한 장례식장을 찾아주세요." },
        { icon: "🅿️", label: "주차 편리", question: "주차가 편리한 장례식장 위주로 추천해 주세요." },
    ];

    const FAQ_LIST_PET = [
        { icon: "🚗", label: "픽업 서비스 가능", question: "픽업 서비스가 가능한 곳을 찾아주세요." },
        { icon: "🌙", label: "24시간 장례", question: "24시간 운영하는 반려동물 장례식장을 찾고 있어요." },
        { icon: "💎", label: "메모리얼 스톤", question: "메모리얼 스톤 제작이 가능한 곳인가요?" },
        { icon: "🐶", label: "강아지 장례", question: "강아지 장례 절차와 비용을 알려주세요." },
        { icon: "🐱", label: "고양이 장례", question: "고양이 장례 전문 시설을 추천해주세요." },
    ];

    const FAQ_LIST_MEMORIAL = [
        { icon: "🏛️", label: "실내 봉안당", question: "실내 봉안당 시설을 추천해 주세요." },
        { icon: "🌳", label: "자연 속 수목장", question: "자연 친화적인 수목장을 찾고 있습니다." },
        { icon: "✝️", label: "기독교/천주교 전용", question: "기독교 예식이 가능한 추모시설을 알려주세요." },
        { icon: "☸️", label: "불교 전용", question: "불교 전용 납골당이나 추모공원을 찾아주세요." },
        { icon: "💎", label: "가격 비교하기", question: "주변 시설들의 가격을 비교해 주세요." },
    ];

    const FAQ_LIST_CONCIERGE = [
        { icon: "🏢", label: "장례식장 찾기", question: "장례식장을 찾고 있습니다." }, // Trigger Scenario A
        { icon: "🌲", label: "추모시설 찾기", question: "납골당이나 수목장을 찾고 있습니다." }, // Trigger Scenario B
        { icon: "🐶", label: "동물장례 찾기", question: "반려동물 장례식장을 찾고 있습니다." }, // Trigger Scenario C
        { icon: "📞", label: "상담원 연결", question: "상담원과 직접 통화하고 싶습니다." }, // Trigger Scenario F
    ];

    const activeFaqList = isPetFacility
        ? FAQ_LIST_PET
        : (initialIntent === 'memorial_facility' ? FAQ_LIST_MEMORIAL :
            (initialIntent === 'funeral_home' ? FAQ_LIST_FUNERAL :
                (initialIntent ? FAQ_LIST_CONCIERGE : (facility.type === 'funeral' ? FAQ_LIST_FUNERAL : FAQ_LIST_CONCIERGE))));

    // Check if a form is currently active in the chat
    const lastMessage = messages[messages.length - 1];
    const isFormActive = lastMessage?.action === 'SHOW_FORM_A';

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            // Determine welcome message based on facility type
            const isFuneralHome = facility.type === 'funeral';
            const userName = currentUser?.name || '고객';

            let defaultWelcome = ``;

            if (initialIntent) {
                if (initialIntent === 'funeral_home') {
                    // Scenario A: Funeral Home Form (Detected Intent)
                    // Trigger Form A immediately
                    defaultWelcome = `갑작스러운 소식에 마음이 무거우시겠습니다. 고인과 유족분들에게 가장 편안한 장례식장을 빠르게 찾아드리겠습니다.\n\n아래 양식을 작성해 주시면 조건에 딱 맞는 장례식장을 추천해 드립니다.`;
                    setMessages([{
                        role: 'model',
                        text: defaultWelcome,
                        timestamp: new Date(),
                        action: 'SHOW_FORM_A'
                    }]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return; // Skip default setMessages below
                } else if (initialIntent === 'memorial_facility') {
                    // Scenario B: Memorial Facility Form
                    defaultWelcome = `고인을 영원히 기억할 수 있는 평온한 안식처를 찾고 계신가요?\n원하시는 장묘 형태나 지역이 있으시다면 말씀해 주세요. 마음(Maeum)이 투명한 가격 정보로 안내해 드립니다.\n\n1. **희망 지역** (예: 경기 용인)\n2. **장묘 형태** (예: 봉안당, 수목장)\n3. **예산 범위** (예: 1,000만 원 이하)`;
                } else if (initialIntent === 'pet_funeral') {
                    // Scenario C: Pet Funeral Form
                    defaultWelcome = `사랑하는 아이와의 이별, 얼마나 가슴 아프실지 짐작이 갑니다. 아이가 무지개다리를 편안히 건널 수 있도록, 믿을 수 있는 장례식장을 안내해 드릴까요?\n\n1. **희망 지역** (예: 서울 마포구)\n2. **아이 정보** (예: 강아지/5kg)\n3. **필요 서비스** (예: 픽업, 스톤제작)`;
                } else {
                    defaultWelcome = `반갑습니다, ${userName}님! **AI 마음이**입니다.\n무엇을 도와드릴까요?\n\n아래 버튼을 눌러 원하시는 서비스를 선택해 주세요.`;
                }
            } else if (isPetFacility) {
                // Scenario C-like for specific facility
                defaultWelcome = `안녕하세요. **${facility.name}** 반려동물 장례지도사입니다.\n소중한 아이와의 이별을 도와드리겠습니다. \n차분하고 아름다운 이별을 위해 무엇이든 물어보세요.`;
            } else if (isFuneralHome) {
                // Scenario A-like for specific facility
                defaultWelcome = `전화주셔서 감사합니다. **${facility.name}**입니다. \n빈소 현황이나 가격 등 궁금하신 점을 말씀해 주세요.`;
            } else {
                // Scenario B-like for specific facility
                let contextText = "";
                if (handoverContext) {
                    const urgencyMap: any = { immediate: '긴급한', imminent: '위독하신', prepare: '준비하시는' };
                    contextText = ` 앞서 말씀하신 대로 ${urgencyMap[handoverContext.urgency] || ''} 상황에 맞춰 최선의 지원을 다하겠습니다. (${handoverContext.location?.text || ''}) `;
                }

                defaultWelcome = `안녕하세요. **${facility.name}**입니다. \n${contextText}시설 위치나 가격 등 무엇이든 물어보세요.`;
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
    }, [facility, isPetFacility, initialIntent, currentUser]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async (textOverride?: string | { text: string, data: any }) => {
        const textToSend = typeof textOverride === 'object' ? textOverride.text : (textOverride || input);
        const structuredData = typeof textOverride === 'object' ? textOverride.data : null;

        if (!textToSend.trim() || isLoading) return;

        if (typeof textOverride !== 'object' && !textOverride) setInput('');

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

            // [Phase 3] RECOMMEND 액션 시 추천 데이터 처리
            if (aiMsg.action === 'RECOMMEND') {
                if (response.data && response.data.facilities) {
                    // 1. Mock Data가 있으면 바로 사용
                    setRecommendedCandidates(response.data.facilities);
                } else {
                    // 2. 없으면 기존 DB 검색 로직 (Fallback)
                    const searchLat = structuredData?.location?.lat || userLocation?.lat || 37.5665;
                    const searchLng = structuredData?.location?.lng || userLocation?.lng || 126.9780;
                    const category = structuredData?.category || (initialIntent === 'funeral_home' ? 'funeral' : undefined);
                    const regionText = structuredData?.location?.text; // [NEW] Region text

                    // Pass regionText as the 4th argument
                    const recommendations = await getIntelligentRecommendations(searchLat, searchLng, category, regionText);
                    if (recommendations && recommendations.length > 0) {
                        setRecommendedCandidates(recommendations as any);
                    }
                }

                // [Phase 5] 리드 저장 (DB 연동)
                try {
                    await createLead({
                        userId: currentUser?.id, // Link to verified user if available
                        contactName: currentUser?.name || '익명 고객', // Fallback name
                        contactPhone: currentUser?.phone || '010-0000-0000', // Fallback phone (or request it in future flow)
                        category: structuredData.category,
                        urgency: structuredData.urgency,
                        scale: structuredData.scale,
                        contextData: structuredData.location,
                        priorities: structuredData.priorities
                    });
                } catch (e) {
                    console.error('Lead creation failed:', e);
                }
            }
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
                    {facility.id !== 'maum-i' && (
                        <button
                            onClick={() => onAction('RESERVE')}
                            className={`bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-lg active:scale-95`}
                        >
                            <CalendarCheck size={14} />
                            바로 예약하기
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-4 no-scrollbar" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex flex-col items-start gap-2`}>
                            <div className={`p-4 text-sm leading-relaxed ${msg.role === 'user'
                                ? `bg-slate-800 text-white rounded-2xl rounded-tr-sm shadow-sm self-end`
                                : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm w-full'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>

                                {/* Action Buttons for AI messages */}
                                {msg.role === 'model' && msg.action && msg.action !== 'NONE' && (
                                    <>
                                        {msg.action === 'SHOW_FORM_A' && (
                                            <FuneralSearchForm
                                                userLocation={userLocation}
                                                onGetCurrentPosition={onGetCurrentPosition}
                                                onSubmit={(payload) => handleSend(payload)}
                                                initialCategory={
                                                    initialIntent === 'pet_funeral' ? 'pet' :
                                                        initialIntent === 'memorial_facility' ? 'memorial' : 'funeral'
                                                }
                                            />
                                        )}

                                        {msg.action === 'RECOMMEND' && recommendedCandidates.length > 0 && (
                                            <div className="mt-3 flex flex-col gap-2">
                                                {recommendedCandidates.slice(0, 3).map(cand => (
                                                    <div
                                                        key={cand.id}
                                                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all active:scale-95 group"
                                                        onClick={() => onSwitchToFacility && onSwitchToFacility(cand)}
                                                    >
                                                        <div className="flex gap-3">
                                                            {cand.imageUrl && !cand.imageUrl.includes('placeholder') ? (
                                                                <img src={cand.imageUrl} alt={cand.name} className="w-14 h-14 rounded-lg object-cover bg-slate-200 border border-slate-100" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-lg bg-indigo-50 flex items-center justify-center text-xs text-indigo-400 font-bold border border-indigo-100 shrink-0">
                                                                    {cand.name.slice(0, 2)}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{cand.name}</h4>
                                                                    <div className="flex items-center gap-1 text-[9px] bg-white border border-indigo-100 px-1.5 py-0.5 rounded-full text-indigo-600 font-bold">
                                                                        AI 상담
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mb-1 truncate">{cand.address}</p>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="text-amber-500 flex items-center gap-0.5 font-bold"><Star size={10} fill="currentColor" /> {cand.rating}</span>
                                                                    <span className="text-slate-400">리뷰 {cand.reviewCount}개</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 underline transition mt-1"
                                                    onClick={() => onAction('RECOMMEND')}
                                                >
                                                    전체 목록 더 보기
                                                </button>

                                                {/* [Phase 5] Urgency Actions */}
                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => onAction('CALL_MANAGER')}
                                                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                                                    >
                                                        <Phone size={16} />
                                                        🚨 운구차 호출
                                                    </button>
                                                    <button
                                                        onClick={() => onAction('RESERVE')}
                                                        className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                                                    >
                                                        <CalendarCheck size={16} />
                                                        📅 상담/가예약
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Other Actions */}
                                        {msg.action !== 'SHOW_FORM_A' && (msg.action !== 'RECOMMEND' || recommendedCandidates.length === 0) && (
                                            <button
                                                onClick={() => onAction(msg.action!)}
                                                className="mt-3 w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm"
                                            >
                                                {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> 예약 상담 접수</>}
                                                {msg.action === 'MAP' && <><MapPin size={16} /> 오시는 길 보기</>}
                                                {msg.action === 'CALL_MANAGER' && <><Phone size={16} /> 담당자 전화 연결</>}
                                                {msg.action === 'RECOMMEND' && <><Sparkles size={16} /> 추천 결과 보기</>}
                                                {msg.action === 'SWITCH_TO_CONSULT' && <><Phone size={16} /> 전문 상담원 연결</>}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
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

            {/* FAQ Chips & Input Area (Hidden when form is active) */}
            {!isFormActive && (
                <>
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
                </>
            )}
        </div>
    );
};
