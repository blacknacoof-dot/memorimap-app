import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, ChatMessage } from '../../services/geminiService';
import { getDistinctRegions, searchFacilitiesByRegion, getFacilityLatestInfo } from '../../lib/queries';
import { MessageCircle, X, Send, MapPin, Phone, CalendarCheck, Loader2, Bot, Sparkles, ChevronLeft, Users, Star, AlertCircle, CheckCircle2, Check, Siren, Building2 } from 'lucide-react';
import { ActionType, Message, Facility } from '../../types';
import { createLead, getIntelligentRecommendations, createUrgentReservation, createConsultationFromLead } from '../../lib/queries';
import { PetChatInterface } from '../Consultation/PetChatInterface';
import { ConsultationForm } from '../Consultation/BrandChatHelpers';
import FuneralSearchForm from './FuneralSearchForm';
import PetSearchForm from './PetSearchForm';
import GeneralInquiryForm from './GeneralInquiryForm';
import { useClerk } from '../../lib/auth'; // For login modal
import { logger } from '../../utils/logger';

interface Props {
    facility: Facility;
    allFacilities?: Facility[];
    onAction: (action: ActionType, data?: any) => void;
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

const MemorialSearchForm: React.FC<FormProps> = ({ userLocation, onGetCurrentPosition, onSubmit, initialCategory = 'memorial' }) => {
    const [step, setStep] = useState(1);
    const [timing, setTiming] = useState<'immediate' | 'prepare' | ''>('');
    const [region, setRegion] = useState('');
    const [religion, setReligion] = useState('');
    const [budget, setBudget] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [error, setError] = useState('');

    const TIMING_OPTIONS = [
        { id: 'immediate', label: '🚨 지금 안치해야 해요 (긴급)', sub: '화장 후 바로 안치 필요' },
        { id: 'prepare', label: '📅 미리 알아보고 있어요', sub: '사전 답사 및 가격 비교' }
    ];

    const RELIGION_OPTIONS = [
        { id: 'none', label: '무교/일반', icon: '🏛️' },
        { id: 'christian', label: '기독교 전용', icon: '✝️' },
        { id: 'catholic', label: '천주교 전용', icon: '⛪' },
        { id: 'buddhist', label: '불교 전용', icon: '☸️' }
    ];

    const BUDGET_OPTIONS = [
        { id: 'low', label: '실속형 (500만 원 미만)', sub: '합리적인 가격의 안식처' },
        { id: 'medium', label: '표준형 (500~1,000만 원)', sub: '가장 많이 찾는 가격대' },
        { id: 'high', label: '고급형 (1,000만 원 이상)', sub: '품격 있는 프리미엄 시설' }
    ];

    const SERVICE_OPTIONS = ['🚗 주차 편리', '🚌 셔틀버스', '☕ 카페/편의시설', '🕰️ 365일 개방', '🏞️ 자연 경관'];

    // Autocomplete State (Reused logic could be extracted but keeping local for speed)
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!region || region.length < 2) {
            setSuggestions([]); setShowSuggestions(false); return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await getDistinctRegions(region) as string[];
                const uniqueResults = Array.from(new Set(results)).slice(0, 5);
                setSuggestions(uniqueResults);
                setShowSuggestions(uniqueResults.length > 0);
            } catch (e) { console.error(e); }
        }, 300);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [region]);

    const handleNext = async () => {
        setError('');
        if (step === 1 && !timing) return setError('시기를 선택해 주세요.');
        if (step === 2) {
            if (!region && userLocation?.type !== 'gps') return setError('지역을 입력하거나 내 위치를 사용해 주세요.');
            if (region) {
                try {
                    const check = await searchFacilitiesByRegion(region); // Generic check
                    if (!check || check.length === 0) return setError('해당 지역에는 등록된 추모시설이 없습니다.');
                } catch (e) { }
            }
        }
        if (step === 3 && !religion) return setError('종교 유형을 선택해 주세요.');
        if (step === 4 && !budget) return setError('예산 범위를 선택해 주세요.');

        setStep(prev => prev + 1);
    };

    const handleSubmit = () => {
        // Structured JSON
        const searchData = {
            category: initialCategory,
            urgency: timing,
            location: {
                type: userLocation?.type === 'gps' && !region ? 'gps' : 'text',
                lat: userLocation?.lat,
                lng: userLocation?.lng,
                text: region || '내 위치 주변'
            },
            religion,
            budget,
            services
        };

        const finalText = `[🌳 추모시설 상담 신청]\n시기: ${TIMING_OPTIONS.find(o => o.id === timing)?.label}\n지역: ${region || '내 위치 주변'}\n종교: ${RELIGION_OPTIONS.find(o => o.id === religion)?.label}\n예산: ${BUDGET_OPTIONS.find(o => o.id === budget)?.label}\n서비스: ${services.join(', ') || '없음'}`;

        onSubmit({ text: finalText, data: searchData });
    };

    const toggleService = (opt: string) => {
        setServices(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

    return (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 w-full animate-in fade-in zoom-in-95 duration-300">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-5 px-1">
                {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className="flex-1 flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
                        {s < 5 && <div className={`flex-1 h-px mx-1 ${step > s ? 'bg-emerald-700' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Timing/Urgency */}
            {step === 1 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><AlertCircle size={14} /> 언제 안치가 필요하신가요?</label>
                    <div className="flex flex-col gap-2">
                        {TIMING_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => { setTiming(opt.id as any); setError(''); }} className={`text-left p-3 rounded-xl border transition-all ${timing === opt.id ? 'bg-emerald-700 border-emerald-700 text-white shadow-md' : 'bg-white border-emerald-100 text-slate-600 hover:bg-emerald-50'}`}>
                                <div className="text-sm font-bold">{opt.label}</div>
                                <div className={`text-[10px] mt-0.5 ${timing === opt.id ? 'text-emerald-200' : 'text-slate-400'}`}>{opt.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><MapPin size={14} /> 원하시는 지역이 있나요?</label>
                    <button onClick={() => { onGetCurrentPosition?.(); setRegion(''); setError(''); }} className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${userLocation?.type === 'gps' && !region ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-emerald-100 text-slate-600 hover:bg-emerald-50'}`}>
                        <MapPin size={16} /> 내 위치 주변 (GPS)
                    </button>
                    <div className="relative">
                        <input type="text" value={region} onChange={(e) => { setRegion(e.target.value); setError(''); }} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="예: 경기 용인, 분당" className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-3 text-sm focus:border-emerald-600 focus:outline-none" />
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => { setRegion(s); setShowSuggestions(false); setError(''); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none">
                                        <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(region, 'gi'), (match) => `<b>${match}</b>`) }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Religion */}
            {step === 3 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><Star size={14} /> 종교가 있으신가요?</label>
                    <div className="grid grid-cols-2 gap-2">
                        {RELIGION_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => { setReligion(opt.id); setError(''); }} className={`p-3 rounded-xl border text-center transition-all ${religion === opt.id ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-emerald-100 text-slate-600 hover:bg-emerald-50'}`}>
                                <div className="text-xl mb-1">{opt.icon}</div>
                                <div className="text-xs font-bold">{opt.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Budget */}
            {step === 4 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><Users size={14} /> 생각하시는 예산 범위는?</label>
                    <div className="flex flex-col gap-2">
                        {BUDGET_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => { setBudget(opt.id); setError(''); }} className={`text-left p-3 rounded-xl border transition-all ${budget === opt.id ? 'bg-emerald-700 border-emerald-700 text-white shadow-md' : 'bg-white border-emerald-100 text-slate-600 hover:bg-emerald-50'}`}>
                                <div className="text-sm font-bold">{opt.label}</div>
                                <div className={`text-[10px] mt-0.5 ${budget === opt.id ? 'text-emerald-200' : 'text-slate-400'}`}>{opt.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 5: Services */}
            {step === 5 && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><Sparkles size={14} /> 원하시는 부대시설이 있나요?</label>
                    <div className="flex flex-wrap gap-2">
                        {SERVICE_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => toggleService(opt)} className={`py-2 px-3 text-xs rounded-full border transition-all ${services.includes(opt) ? 'bg-emerald-600 border-emerald-600 text-white font-bold' : 'bg-white border-emerald-100 text-slate-600 hover:bg-emerald-50'}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="mt-3 flex items-center gap-1.5 text-red-500 text-[10px] animate-pulse"><AlertCircle size={10} /><span>{error}</span></div>}

            <div className="mt-4 flex gap-2">
                {step > 1 && <button onClick={() => setStep(prev => prev - 1)} className="px-4 py-2 text-slate-500 text-xs hover:bg-slate-100 rounded-xl transition">이전</button>}
                <button onClick={step === 5 ? handleSubmit : handleNext} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1">
                    {step === 5 ? <><Check size={16} /> 맞춤 추모시설 찾기</> : '다음 단계'}
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

    const { openSignIn } = useClerk(); // For login modal
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
    const [searchContext, setSearchContext] = useState<string>('');
    const [liveFacility, setLiveFacility] = useState<Facility>(facility); // [Dynamic Prompt Injection] Live facility data
    const [activeScenario, setActiveScenario] = useState<'funeral' | 'memorial' | 'pet' | 'general' | null>(null);
    const [currentLeadId, setCurrentLeadId] = useState<string | null>(null); // [NEW] Track Lead ID for handover
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // [NEW] Modal State for ConsultationForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'phone' | 'chat' | 'urgent'>('phone');
    // [NEW] Track Urgent Booking Context (Date, Type)
    const [urgentBookingContext, setUrgentBookingContext] = useState<{ date?: string; type?: string }>({});

    // [Task 2] Dynamic Prompt Injection - Fetch latest facility data on chat open
    useEffect(() => {
        const fetchLatestFacilityData = async () => {
            if (facility.id === 'maum-i') return; // Skip for Maum-i concierge

            try {
                const latestData = await getFacilityLatestInfo(facility.id.toString());
                if (latestData) {
                    const data = latestData as any; // Cast to any to handle Union type differences
                    // Merge latest DB data with existing facility object
                    setLiveFacility(prev => ({
                        ...prev,
                        ...data,
                        // Ensure prices is properly formatted
                        prices: data.prices || prev.prices || [],
                        // Map snake_case DB fields to camelCase Facility type
                        aiContext: data.ai_context || (prev as any).aiContext,
                        features: data.ai_features || data.features || prev.features,
                        ai_welcome_message: data.ai_welcome_message || prev.ai_welcome_message,
                    }));
                    logger.debug('[Dynamic Prompt Injection] Loaded latest facility data:', data.name);
                }
            } catch (e) {
                console.error('[Dynamic Prompt Injection] Failed to fetch latest data:', e);
            }
        };

        fetchLatestFacilityData();
    }, [facility.id]);

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
                    setMessages([{
                        role: 'model',
                        text: `고인과 유족분들의 평온한 안식을 위해 최선을 다해 돕겠습니다. \n원하시는 조건(지역, 종교, 예산 등)을 선택해 주시면, 맞춤 추모시설을 추천해 드립니다.`,
                        timestamp: new Date(),
                        action: 'SHOW_FORM_B'
                    }]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return;
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
                // [NEW] Auto-show consultation form for funeral facilities
                defaultWelcome = `삼가 고인의 명복을 빕니다. **${facility.name}**에서 정성을 다해 모시겠습니다.\n\n아래 질문에 답변해 주시면 빠르게 도움드리겠습니다.`;
                setMessages([{
                    role: 'model',
                    text: defaultWelcome,
                    timestamp: new Date(),
                    action: 'SHOW_FORM_A'
                }]);
                setTimeout(() => inputRef.current?.focus(), 100);
                return; // Skip default setMessages below

            } else if (['charnel', 'columbarium', 'natural', 'natural_burial', 'park', 'cemetery', 'sea', 'sea_burial', 'memorial'].includes(facility.type || '')) {
                // [Fix] Auto-show consultation form for memorial facilities (User Request)
                defaultWelcome = `안녕하세요. **${facility.name}**입니다.\n고인과 유족분들의 평온한 안식을 위해 최선을 다해 돕겠습니다.\n\n원하시는 조건을 선택해 주시면, 맞춤 상담을 도와드립니다.`;
                setMessages([{
                    role: 'model',
                    text: defaultWelcome,
                    timestamp: new Date(),
                    action: 'SHOW_FORM_B'
                }]);
                setTimeout(() => inputRef.current?.focus(), 100);
                return;

            } else {
                // Scenario B-like for specific facility (Generic fallback)
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
                // Force Update: Ensure buttons are visible in Vercel build
                options: facility.id === 'maum-i' ? [
                    { label: '🚨 장례식장 찾기', value: 'scenario_funeral' },
                    { label: '🌳 추모시설 찾기', value: 'scenario_memorial' },
                    { label: '🐾 반려동물 장례', value: 'scenario_pet' },
                    { label: '📞 일반/제휴 문의', value: 'scenario_general' }
                ] : [
                    { label: '🚨 장례 발생/임종 임박', value: 'mode_urgent' },
                    { label: '📋 사전 상담/내방', value: 'consult_chat' }
                ]
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
            const response = await sendMessageToGemini(textToSend, messages, liveFacility);

            // [NEW] Capture Context from User Input (to track state across turns)
            if (textToSend.startsWith('date_')) {
                setUrgentBookingContext(prev => ({ ...prev, date: textToSend }));
            }
            if (textToSend.startsWith('type_')) {
                setUrgentBookingContext(prev => ({ ...prev, type: textToSend }));
            }

            // [NEW] Attempt JSON Parsing for Urgent Flow
            let displayText = response.text;
            let options = null;
            let actionTrigger = response.action;

            try {
                // If response looks like JSON, parse it
                if (displayText.trim().startsWith('{') || displayText.trim().startsWith('```json')) {
                    const cleanJson = displayText.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleanJson);
                    displayText = parsed.message || parsed.text;
                    options = parsed.options;
                    if (parsed.action_trigger) {
                        actionTrigger = parsed.action_trigger as ActionType;
                    }
                }
            } catch (e) {
                // Fallback to plain text if parsing fails
                console.log("Not a JSON response:", e);
            }

            const aiMsg: ChatMessage = {
                role: 'model',
                text: displayText,
                timestamp: new Date(),
                action: actionTrigger,
                options: options // Add to ChatMessage type if needed (will do via any cast for now or extend type)
            };

            setMessages(prev => [...prev, aiMsg]);


            // [Phase 5] Urgent Reservation Confirmation
            if (aiMsg.action === 'URGENT_RESERVATION_CONFIRM') {
                try {
                    // Extract Time from User's last message (simple parsing for now)
                    // Messages: [..., {role: 'user', text: 'time_1500'}, {role: 'model', ...}]
                    // The user's last message triggered this.
                    const lastUserMsg = messages[messages.length - 1]?.text || textToSend;
                    let timeStr = "09:00"; // Fallback

                    if (lastUserMsg.includes("time_")) {
                        const rawTime = lastUserMsg.replace("time_", ""); // "1500"
                        timeStr = rawTime.slice(0, 2) + ":" + rawTime.slice(2); // "15:00"
                    }

                    // Calculate Visit Date based on Context
                    const visitDate = new Date();
                    if (urgentBookingContext.date === 'date_tomorrow') {
                        visitDate.setDate(visitDate.getDate() + 1);
                    } else if (urgentBookingContext.date === 'date_dayafter') {
                        visitDate.setDate(visitDate.getDate() + 2);
                    }
                    // If 'date_today', do nothing (matches new Date())

                    const [hours, minutes] = timeStr.split(':').map(Number);
                    visitDate.setHours(hours, minutes, 0, 0);

                    // Call DB
                    // @ts-ignore
                    await createUrgentReservation(
                        facility.id.toString(),
                        currentUser?.id,
                        currentUser?.name,
                        currentUser?.phone,
                        visitDate,
                        urgentBookingContext.type?.replace('type_', '') as 'single' | 'couple' || 'single',
                        'AI 긴급 예약'
                    );

                    console.log("Urgent Reservation Confirmed in DB:", visitDate);

                } catch (e) {
                    console.error("Failed to save Urgent Reservation:", e);
                    // Fallback UI
                    setMessages(prev => [...prev, {
                        role: 'model',
                        text: "⚠️ 예약 확정 중 오류가 발생했습니다.\n담당자가 확인 후 5분 내로 직접 연락드리겠습니다.\n(비상 연락처: 010-0000-0000)",
                        timestamp: new Date(),
                        action: 'NONE'
                    }]);
                }
            }

            // [Phase 3] RECOMMEND 액션 시 추천 데이터 처리
            if (aiMsg.action === 'RECOMMEND') {
                // [FIX] structuredData가 없어도 기본 검색 실행 (사용자 리포트 수정)
                const searchData = structuredData || {
                    category: initialIntent === 'funeral_home' ? 'funeral' :
                        initialIntent === 'memorial_facility' ? 'memorial' : 'funeral',
                    location: {
                        type: userLocation?.type || 'gps',
                        lat: userLocation?.lat || 37.5665,
                        lng: userLocation?.lng || 126.9780,
                        text: searchContext || '서울 전체'
                    },
                    urgency: 'immediate',
                    scale: 'medium'
                };

                if (response.data && response.data.facilities) {
                    // 1. Mock Data가 있으면 바로 사용
                    setRecommendedCandidates(response.data.facilities);
                } else {
                    // 2. 없으면 실제 DB 검색 (Fallback)
                    const searchLat = searchData.location?.lat || 37.5665;
                    const searchLng = searchData.location?.lng || 126.9780;
                    const category = searchData.category || (initialIntent === 'funeral_home' ? 'funeral' : undefined);
                    const regionText = searchData.location?.text;

                    if (regionText) {
                        setSearchContext(regionText);
                    }

                    console.log('🔍 검색 시작:', { searchLat, searchLng, category, regionText });

                    const recommendations = await getIntelligentRecommendations(searchLat, searchLng, category, regionText);

                    console.log('✅ 검색 결과:', recommendations);

                    if (recommendations && recommendations.length > 0) {
                        setRecommendedCandidates(recommendations as any);
                    } else {
                        // [UX FIX] 검색 결과가 없을 때 사용자에게 알림
                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: '죄송합니다. 해당 조건에 맞는 시설을 찾지 못했습니다.\n다른 지역이나 조건으로 다시 검색해 주세요.',
                            timestamp: new Date(),
                            action: 'NONE'
                        }]);
                    }
                }

                // [Phase 5] 리드 저장 (DB 연동)
                try {
                    const lead = await createLead({
                        userId: currentUser?.id,
                        contactName: currentUser?.name || '익명 고객',
                        contactPhone: currentUser?.phone || '010-0000-0000',
                        category: searchData.category,
                        urgency: searchData.urgency,
                        scale: searchData.scale,
                        priorities: searchData.priorities || [],
                        contextData: {
                            ...(searchData.location || {}),
                            ...searchData,
                            notes: searchData.notes || ''
                        }
                    });
                    if (lead) {
                        setCurrentLeadId(lead.id);
                        console.log('[ChatInterface] Lead created:', lead.id);
                    }
                } catch (e) {
                    console.error('Lead creation failed:', e);
                }
            }
        } catch (error) {
            console.error('[ChatInterface] ERROR:', error);
            // 🚑 Robust Fallback: Show error message to user instead of just console logging
            const errorMsg: ChatMessage = {
                role: 'model',
                text: "죄송합니다. 현재 상담 요청이 많아 일시적인 오류가 발생했습니다.\n\n잠시 후 다시 시도하시거나, 하단의 [전문가 상담 신청] 버튼을 통해 매니저와 직접 상담하실 수 있습니다.",
                timestamp: new Date(),
                action: 'NONE'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // [NEW] Handle Scenario Switching from Buttons
    const handleActionClick = (actionValue: string) => {
        if (actionValue.startsWith('scenario_')) {
            const scenario = actionValue.replace('scenario_', '');
            let welcomeMsg = '';
            let actionType: ActionType = 'NONE';

            if (scenario === 'funeral') {
                setActiveScenario('funeral');
                welcomeMsg = `갑작스러운 소식에 마음이 무거우시겠습니다. 고인과 유족분들에게 가장 편안한 장례식장을 빠르게 찾아드리겠습니다.\n\n아래 양식을 작성해 주시면 조건에 딱 맞는 장례식장을 추천해 드립니다.`;
                actionType = 'SHOW_FORM_A';
            } else if (scenario === 'memorial') {
                setActiveScenario('memorial');
                welcomeMsg = `고인과 유족분들의 평온한 안식을 위해 최선을 다해 돕겠습니다. \n원하시는 조건(지역, 종교, 예산 등)을 선택해 주시면, 맞춤 추모시설을 추천해 드립니다.`;
                actionType = 'SHOW_FORM_B';
            } else if (scenario === 'pet') {
                setActiveScenario('pet');
                welcomeMsg = `사랑하는 아이와의 이별, 얼마나 가슴 아프실지 짐작이 갑니다. 아이가 무지개다리를 편안히 건널 수 있도록, 믿을 수 있는 장례식장을 안내해 드릴까요?`;
                actionType = 'SHOW_FORM_C'; // New Action for Pet
            } else if (scenario === 'general') {
                setActiveScenario('general');
                welcomeMsg = `안녕하세요. 무엇을 도와드릴까요?\n일반 상담이나 제휴 문의, 오류 신고 등 궁금한 점을 남겨주세요.`;
                actionType = 'SHOW_FORM_D'; // New Action for General
            }

            setMessages(prev => [...prev, {
                role: 'user',
                text: {
                    'funeral': '장례식장 찾기',
                    'memorial': '추모시설 찾기',
                    'pet': '반려동물 장례',
                    'general': '일반/제휴 문의'
                }[scenario] || '선택',
                timestamp: new Date()
            }, {
                role: 'model',
                text: welcomeMsg,
                timestamp: new Date(),
                action: actionType
            }]);
        } else {
            handleSend(actionValue);
        }
    };

    // [New] Handle Reserve with Deep Handover
    const handleReserve = async (candidate: Facility) => {
        try {
            if (currentLeadId) {
                console.log('[ChatInterface] Handing over lead to facility:', candidate.id);
                await createConsultationFromLead(currentLeadId, candidate.id);
            }
            onAction('RESERVE', candidate);
        } catch (e) {
            console.error('Handover failed:', e);
            // Fallback: Proceed to reserve anyway
            onAction('RESERVE', candidate);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    // [Derived State] Check if an inline form is active in the chat
    const isFormActive = messages.length > 0 && (
        messages[messages.length - 1].action === 'SHOW_FORM_A' ||
        messages[messages.length - 1].action === 'SHOW_FORM_B' ||
        messages[messages.length - 1].action === 'SHOW_FORM_C' ||
        messages[messages.length - 1].action === 'SHOW_FORM_D'
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden shadow-inner">
            {/* [NEW] Consultation Form Modal */}
            {isFormOpen && (
                <ConsultationForm
                    company={facility as any} // Cast to match type
                    mode={formMode}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={(data) => {
                        console.log('Form Submitted:', data);
                        setIsFormOpen(false);
                        // Add system message confirming submission
                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: `✅ [${data.type}] ${data.name}님의 접수가 완료되었습니다.\n담당자가 확인 후 ${data.phone}으로 신속히 연락드리겠습니다.`,
                            timestamp: new Date(),
                            action: 'NONE'
                        }]);
                    }}
                />
            )}

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
                            onClick={() => {
                                setFormMode('phone'); // [MODIFIED] Open detailed form ("General Reservation") by default
                                setIsFormOpen(true);
                            }}
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
                                        {
                                            msg.options && msg.options.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2 text-left">
                                                    {msg.options.map((opt: any, i: number) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleActionClick(opt.value)}
                                                            className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        }

                                        {msg.action === 'SHOW_FORM_A' && (
                                            <FuneralSearchForm
                                                userLocation={userLocation}
                                                onGetCurrentPosition={onGetCurrentPosition}
                                                onSubmit={(payload: { text: string; data: any }) => handleSend(payload)}
                                                onClose={onClose}
                                                onLoginRequired={() => {
                                                    onClose();
                                                    openSignIn(); // Open Clerk login modal
                                                }}
                                                initialCategory={
                                                    initialIntent === 'pet_funeral' ? 'pet' :
                                                        initialIntent === 'memorial_facility' ? 'memorial' : 'funeral'
                                                }
                                                facilityId={facility.id.toString()}
                                                facilityName={facility.name}
                                                currentUser={currentUser}
                                            />
                                        )}

                                        {msg.action === 'SHOW_FORM_B' && (
                                            <MemorialSearchForm
                                                userLocation={userLocation}
                                                onGetCurrentPosition={onGetCurrentPosition}
                                                onSubmit={(payload) => handleSend(payload)}
                                                initialCategory="memorial"
                                            />
                                        )}

                                        {msg.action === 'SHOW_FORM_C' && (
                                            <PetSearchForm
                                                userLocation={userLocation}
                                                onGetCurrentPosition={onGetCurrentPosition}
                                                onSubmit={(payload) => handleSend(payload)}
                                                initialCategory="pet_funeral"
                                                currentUser={currentUser}
                                            />
                                        )}

                                        {msg.action === 'SHOW_FORM_D' && (
                                            <GeneralInquiryForm
                                                onSubmit={(payload) => handleSend(payload)}
                                            />
                                        )}

                                        {msg.action === 'RECOMMEND' && recommendedCandidates.length > 0 && (
                                            <div className="w-full mt-3">
                                                <div className="flex gap-2 w-full overflow-x-auto pb-2 snap-x px-1 no-scrollbar">
                                                    {recommendedCandidates.map((cand, i) => (
                                                        <div
                                                            key={i}
                                                            className="min-w-[200px] w-[200px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer snap-center"
                                                            onClick={() => {
                                                                // [FIX] Map data correctly for recommendation click
                                                                const targetId = typeof cand.id === 'object' ? (cand.id as any).id || (cand as any).facilityId : cand.id;
                                                                // If specific navigation handler exists, use it
                                                                if (onNavigateToFacility) {
                                                                    onNavigateToFacility(targetId.toString());
                                                                } else if (onSwitchToFacility) {
                                                                    // Fallback
                                                                    onSwitchToFacility({
                                                                        ...cand,
                                                                        id: targetId,
                                                                        category: (cand as any).category || 'funeral_home'
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <div className="h-32 w-full bg-slate-100 rounded-xl mb-3 overflow-hidden relative">
                                                                {cand.imageUrl && !cand.imageUrl.includes('placeholder') ? (
                                                                    <img src={cand.imageUrl} alt={cand.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full text-indigo-200 bg-indigo-50/50">
                                                                        <Building2 size={36} />
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 font-bold">
                                                                    <Star size={10} className="fill-amber-400 text-amber-400" /> {cand.rating || '4.5'}
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 px-1">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{cand.name}</h4>
                                                                    {cand.type === 'funeral' && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold shrink-0">전문장례</span>}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 mb-2 line-clamp-1 flex items-center gap-1"><MapPin size={10} /> {cand.address}</p>

                                                                {/* Dynamic Badges */}
                                                                {(cand as any).badges && (cand as any).badges.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                                        {(cand as any).badges.map((badge: string, i: number) => (
                                                                            <span key={i} className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
                                                                                {badge}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">후기 {cand.reviewCount || 0}</span>
                                                                        <span className="text-[10px] text-indigo-600 font-bold">인기시설</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button className="w-full bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-sm">
                                                                <CalendarCheck size={14} /> 상담 예약하기
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 underline transition mt-1 font-medium"
                                                    onClick={() => onAction('RECOMMEND', searchContext)}
                                                >
                                                    전체 목록 더 보기
                                                </button>
                                            </div>
                                        )}

                                        {/* Other Actions */}
                                        {!['SHOW_FORM_A', 'SHOW_FORM_B', 'SHOW_FORM_C', 'SHOW_FORM_D', 'RECOMMEND'].includes(msg.action || '') && (
                                            <button
                                                onClick={() => {
                                                    if (msg.action === 'URGENT_DISPATCH') {
                                                        // [UX Fix] Reset Chat & Start Urgent Flow (AI Mode)
                                                        setMessages([]);
                                                        handleSend('mode_urgent'); // Trigger AI Scenario
                                                    } else if (msg.action === 'RESERVE') {
                                                        setFormMode('chat'); // Or 'phone' depending on preference
                                                        setIsFormOpen(true);
                                                    } else {
                                                        onAction(msg.action!);
                                                    }
                                                }}
                                                className={`mt-3 w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm ${msg.action === 'URGENT_DISPATCH' ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : ''}`}
                                            >
                                                {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> 예약 상담 접수</>}
                                                {msg.action === 'URGENT_DISPATCH' && <><Siren size={16} /> 긴급 출동 접수</>}
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
            {
                !isFormActive && (
                    <>
                        {/* FAQ Chips */}
                        {messages.length > 0 && messages[messages.length - 1].role === 'model' && !messages[messages.length - 1].action && (
                            <div className="px-4 pb-2 text-left">
                                <div className="flex flex-wrap gap-2">
                                    {activeFaqList.map((faq, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(faq.question)}
                                            className="bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-[11px] py-1.5 px-3 rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-1.5 font-medium"
                                        >
                                            <span>{faq.icon}</span> {faq.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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
                )
            }
        </div >
    );
};
