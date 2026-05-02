import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { sendMessageToGemini, ChatMessage } from '../../services/geminiService';
import { getAuthClient } from '../../lib/supabaseClient';
import { getFacilityLatestInfo } from '../../lib/queries';
import { X, Send, MapPin, Phone, CalendarCheck, Loader2, Bot, Sparkles } from 'lucide-react';
import { ActionType, Facility } from '../../types';
import { createLead, getIntelligentRecommendations, createUrgentReservation, createConsultationFromLead } from '../../lib/queries';
import { PetChatInterface } from '../Consultation/PetChatInterface';
import { ConsultationForm } from '../Consultation/BrandChatHelpers';
import { RecommendList } from './RecommendList';
import FuneralSearchForm from './FuneralSearchForm';
import MemorialSearchForm from './MemorialSearchForm';
import PetSearchForm from './PetSearchForm';
import { useClerk, useSession } from '../../lib/auth'; // For login modal + auth client
import { logger } from '../../utils/logger';
import type { AiConsultCategory, QuotaCheckResult } from '../../types/subscription';
import UpgradePrompt from '../UpgradePrompt';
import { checkAiConsultationQuota } from '../../lib/aiConsultationQuota';

interface Props {
    facility: Facility;
    allFacilities?: Facility[];
    onAction: (action: ActionType, data?: Facility | Record<string, unknown>) => void;
    onClose: () => void;
    currentUser: { id: string; name?: string; phone?: string } | null;
    initialIntent?: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | null;
    onSwitchToFacility?: (facility: Facility | { id: string; name: string; address?: string; phone?: string }, context?: Record<string, unknown>) => void;
    onNavigateToFacility?: (facility: Facility) => void;
    userLocation?: { lat: number, lng: number, type: string };
    onGetCurrentPosition?: () => void;
    handoverContext?: { urgency?: string; location?: { text?: string }; [key: string]: unknown };
    onSearchFacilities?: (region: string) => Facility[];
    onGoToMyPage?: () => void;
}



// Safe Highlighting Component
const _SafeHighlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? <b key={i}>{part}</b> : part
            )}
        </span>
    );
};

// MemorialSearchForm moved to ./MemorialSearchForm.tsx



export const ChatInterface: React.FC<Props> = ({
    facility,
    allFacilities: _allFacilities = [],
    onAction,
    onClose,
    currentUser,
    initialIntent,
    onSwitchToFacility,
    onNavigateToFacility: _onNavigateToFacility,
    userLocation,
    onGetCurrentPosition,
    handoverContext,
    onGoToMyPage
}) => {

    const { openSignIn } = useClerk(); // For login modal
    const { session } = useSession();
    const isPetFacility = facility.type === 'pet' || initialIntent === 'pet_funeral';

    // [HOOKS FIX] All hooks MUST be declared before any conditional return
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [_recommendedCandidates, setRecommendedCandidates] = useState<Facility[]>([]);
    const [searchContext, setSearchContext] = useState<string>('');
    const [liveFacility, setLiveFacility] = useState<Facility>(facility); // [Dynamic Prompt Injection] Live facility data
    const [_activeScenario, setActiveScenario] = useState<'funeral' | 'memorial' | 'pet' | null>(null);
    const [currentLeadId, setCurrentLeadId] = useState<string | null>(null); // [NEW] Track Lead ID for handover
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // [NEW] Modal State for ConsultationForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'chat' | 'phone'>('chat');
    // [Quota] 세션별 쿼터 체크 (re-mount 중복 방지)
    const sessionQuotaCheckedRef = useRef(false);
    const [quotaExceeded, setQuotaExceeded] = useState<QuotaCheckResult | null>(null);
    // [PDCA VERIFICATION] Trace ID Generator
    const generateTraceId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

    // [PDCA] System Logging Helper — system_logs는 서버(Edge Function)에서만 INSERT 가능
    // 클라이언트에서는 console로만 기록 (RLS가 클라이언트 INSERT 차단)
    const logToSystem = async (_level: 'INFO' | 'WARN' | 'ERROR', _message: string, _traceId?: string, _meta: Record<string, unknown> = {}) => {
        // RLS가 클라이언트 INSERT 차단 — 서버 로깅만 사용
    };

    // [NEW] Track Urgent Booking Context (Date, Type)
    const [urgentBookingContext, setUrgentBookingContext] = useState<{ date?: string; type?: string }>({});

    // [HOOKS FIX] Early return moved below ALL hooks (useState, useRef, useEffect)
    // See line ~298 for the actual early return

    // [Task 2] Dynamic Prompt Injection - Fetch latest facility data on chat open
    useEffect(() => {
        const fetchLatestFacilityData = async () => {
            if (facility.id === 'maum-i') return; // Skip for Maum-i concierge

            try {
                const latestData = await getFacilityLatestInfo(facility.id.toString());
                if (latestData) {
                    const data = latestData as Facility & { ai_context?: string; price_range?: string };
                    // Merge latest DB data with existing facility object
                    setLiveFacility(prev => ({
                        ...prev,
                        ...data,
                        priceRange: data.priceRange || data.price_range || prev.priceRange,
                        // Ensure prices is properly formatted
                        prices: data.prices || prev.prices || [],
                        packages: data.packages || prev.packages || [],
                        products: data.products || prev.products || [],
                        // Map snake_case DB fields to camelCase Facility type
                        aiContext: data.ai_context || data.aiContext || prev.aiContext,
                        features: data.ai_features || data.features || prev.features,
                        ai_welcome_message: data.ai_welcome_message || prev.ai_welcome_message,
                    }));
                    if (data.ai_welcome_message) {
                        setMessages(prev => {
                            if (prev.length === 0 || prev[0].role !== 'model' || prev[0].action) return prev;
                            return [{ ...prev[0], text: data.ai_welcome_message as string }, ...prev.slice(1)];
                        });
                    }
                    logger.debug('[Dynamic Prompt Injection] Loaded latest facility data:', data.name);
                }
            } catch (_e) {
                // Dynamic prompt injection fetch failed
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
                        text: `고인과 유족분들의 평온한 안식을 위해 최선을 다해 돕겠습니다.\n납골당·수목장·묘지 등 추모시설을 통합 안내해 드립니다. 원하시는 조건(지역, 종교, 예산 등)을 선택해 주세요.`,
                        timestamp: new Date(),
                        action: 'SHOW_FORM_B'
                    }]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return;
                } else if (initialIntent === 'pet_funeral') {
                    // Scenario C: Pet Funeral Form — 바로 폼 표시
                    setMessages([{
                        role: 'model',
                        text: `사랑하는 아이와의 이별, 얼마나 가슴 아프실지 짐작이 갑니다.\n아이가 무지개다리를 편안히 건널 수 있도록, 아래 정보를 입력해 주시면 맞춤 장례식장을 안내해 드릴게요.`,
                        timestamp: new Date(),
                        action: 'SHOW_FORM_C'
                    }]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return;
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
                    const urgencyMap: Record<string, string> = { immediate: '긴급한', imminent: '위독하신', prepare: '준비하시는' };
                    contextText = ` 앞서 말씀하신 대로 ${(handoverContext.urgency && urgencyMap[handoverContext.urgency]) || ''} 상황에 맞춰 최선의 지원을 다하겠습니다. (${handoverContext.location?.text || ''}) `;
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
                    { label: '🐾 반려동물 장례', value: 'scenario_pet' }
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

    // [HOOKS FIX] Early return AFTER all hooks — prevents React Hooks order violation
    if (isPetFacility && facility.id !== 'maum-i') {
        return <PetChatInterface
            company={{ id: facility.id, name: facility.name, rating: facility.rating || 0, reviewCount: facility.reviewCount || 0, imageUrl: facility.imageUrl || '', description: facility.description || '', features: facility.features || [], phone: facility.phone || '', priceRange: facility.priceRange || '', benefits: [] }}
            onClose={onClose}
            onBack={onClose}
        />;
    }

    // facility.type → AiConsultCategory 매핑
    const getAiCategory = (): AiConsultCategory => {
        if (initialIntent === 'funeral_home') return 'funeral_home';
        if (initialIntent === 'pet_funeral') return 'pet_funeral';
        if (initialIntent === 'memorial_facility') return 'memorial_facility';
        const t = facility.type || '';
        if (t === 'funeral_home' || t === '장례식장') return 'funeral_home';
        if (t === 'pet_funeral' || t === '동물장례' || t === 'pet') return 'pet_funeral';
        return 'memorial_facility';
    };

    const handleSend = async (textOverride?: string | { text: string, data: Record<string, unknown> }) => {
        const traceId = generateTraceId(); // [PDCA] Generate Trace ID for this transaction
        logToSystem('INFO', 'Action Started', traceId, { intent: initialIntent, facilityId: facility.id }); // [PDCA]

        const textToSend = typeof textOverride === 'object' ? textOverride.text : (textOverride || input);
        const structuredData = typeof textOverride === 'object' ? textOverride.data : null;

        if (!textToSend.trim() || isLoading) return;

        // [Auth Gate] AI 호출 전 비로그인 차단 — 무인증 AI 사용 및 비용 남용 방지
        if (!currentUser) {
            toast.error('AI 상담을 이용하려면 로그인이 필요합니다.');
            openSignIn?.();
            return;
        }

        // [Quota] 첫 메시지 시 쿼터 체크 (세션당 1회)
        // 단일 RPC 호출 안에서 사용자/시설 쿼터를 함께 검증하고 함께 차감한다.
        if (messages.length === 0 && !sessionQuotaCheckedRef.current && currentUser) {
            try {
                const client = await getAuthClient(session, { strict: true });
                const result = await checkAiConsultationQuota(client, facility.id, getAiCategory());
                if (!result.allowed) {
                    setQuotaExceeded(result);
                    toast.error('AI 상담 이용 한도를 확인하지 못했습니다. 다시 시도해 주세요.');
                    return;
                }
                sessionQuotaCheckedRef.current = true;
            } catch (_err) {
                toast.error('AI 상담 이용 한도를 확인하지 못했습니다. 다시 시도해 주세요.');
                return;
            }
        }

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
            } catch (_e) {
                // Fallback to plain text if parsing fails
                // Not a JSON response, use plain text
            }

            const aiMsg: ChatMessage & { facilities?: Facility[] } = {
                role: 'model',
                text: displayText,
                timestamp: new Date(),
                action: actionTrigger,
                options: options // Add to ChatMessage type if needed (will do via any cast for now or extend type)
            };

            // [Phase 3] RECOMMEND 액션 시 추천 데이터 처리 (Moved logic BEFORE adding to messages)
            if (aiMsg.action === 'RECOMMEND') {
                // [FIX] Prioritize Real DB Search over Mock Data
                const searchData = structuredData || {
                    category: initialIntent === 'funeral_home' ? 'funeral' :
                        initialIntent === 'memorial_facility' ? 'memorial' : 'funeral',
                    location: {
                        type: userLocation?.type || 'gps',
                        lat: userLocation?.lat || 37.5665,
                        lng: userLocation?.lng || 126.9780,
                        text: searchContext // [PDCA HIGH] Remove '서울 전체' fallback. Strict check below.
                    },
                    urgency: 'immediate',
                    scale: 'medium'
                };

                const loc = searchData.location as { lat?: number; lng?: number; text?: string } | undefined;
                const searchLat = loc?.lat || 37.5665;
                const searchLng = loc?.lng || 126.9780;
                const category = (searchData.category as string) || (initialIntent === 'funeral_home' ? 'funeral' : undefined);
                const regionText = loc?.text;

                if (regionText) {
                    setSearchContext(regionText);
                }

                logToSystem('INFO', 'Real DB Search Start', traceId, { category, regionText }); // [PDCA]

                // [PDCA] Location Check - 위치 없으면 전국 검색 허용
                if (!regionText && !userLocation?.lat) {
                    logToSystem('INFO', 'No location - searching nationwide', traceId);
                }

                let realResults: Facility[] = [];
                try {
                    // Try User Query-based Search
                    const results = await getIntelligentRecommendations(searchLat, searchLng, category, regionText);
                    if (results && results.length > 0) {
                        realResults = results as Facility[];
                    }
                } catch (e) {
                    logToSystem('ERROR', 'Real DB Search failed', traceId, { error: e });                }

                if (realResults.length > 0) {
                    // 1. Use Real DB Data
                    logToSystem('INFO', `Real DB Found facilities: ${realResults.length}`, traceId, { count: realResults.length }); // [PDCA]
                    // Attach to message for rendering
                    aiMsg.facilities = realResults;

                    // [PDCA MED] Remove UI State Dependency (removed setRecommendedCandidates)
                    // setRecommendedCandidates(realResults); <--- REMOVED

                    // [VERIFICATION] Check Pet Region Strictness (Redundant but kept for safety)
                    if ((category === 'pet' || initialIntent === 'pet_funeral') && !regionText) {
                        logToSystem('WARN', 'Pet Search BLOCKED: No Region provided', traceId);
                        aiMsg.action = 'NONE';
                        aiMsg.text = "반려동물 장례식장은 지역 정보가 필수입니다. \n\n어느 지역을 찾으시나요? (예: 일산, 강남구)";
                        aiMsg.facilities = []; // Clear results if any accidental match
                        setRecommendedCandidates([]);
                    }
                } else {
                    // 2. No results (Mock Data Disabled for 'Maum-i' logic purity, or fallback text)
                    // No results found from real DB
                    // Fallback handled by logic below if no facilities attached
                    aiMsg.action = 'NONE';
                    aiMsg.text = '죄송합니다. 해당 조건에 맞는 시설을 찾지 못했습니다.\n다른 지역이나 조건으로 다시 검색해 주세요.';
                }

                // [Phase 5] 리드 저장 (DB 연동)
                try {
                    const authClient = await getAuthClient(session, { strict: true });
                    const lead = await createLead({
                        userId: currentUser?.id,
                        contactName: currentUser?.name || '익명 고객',
                        contactPhone: currentUser?.phone || '010-0000-0000',
                        category: (searchData.category as string) || 'funeral',
                        urgency: (searchData.urgency as string) || 'immediate',
                        scale: (searchData.scale as string) || undefined,
                        priorities: (searchData.priorities as string[]) || [],
                        contextData: {
                            ...(searchData.location as Record<string, unknown> || {}),
                            ...searchData,
                            notes: (searchData.notes as string) || ''
                        }
                    }, authClient);
                    if (lead) {
                        setCurrentLeadId(lead.id);
                        logToSystem('INFO', 'Lead created', traceId, { leadId: lead.id });
                    }
                } catch (_e) {
                    // Lead creation failed
                }
            }

            setMessages(prev => [...prev, aiMsg]);

            /* REMOVED OLD RECOMMEND BLOCK as it is now integrated above */
            /*
                        // [Phase 5] Urgent Reservation Confirmation
            */
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
                    const urgentClient = await getAuthClient(session, { strict: true });
                    await createUrgentReservation(
                        facility.id.toString(),
                        currentUser?.id || '',
                        currentUser?.name || '',
                        currentUser?.phone || '',
                        visitDate,
                        (urgentBookingContext.type?.replace('type_', '') || 'single') as 'single' | 'couple',
                        'AI 긴급 예약',
                        urgentClient
                    );

                    logToSystem('INFO', 'Urgent Reservation Confirmed in DB', traceId, { visitDate: visitDate.toISOString() });

                } catch (_e) {
                    // Failed to save urgent reservation
                    // Fallback UI
                    setMessages(prev => [...prev, {
                        role: 'model',
                        text: "⚠️ 예약 확정 중 오류가 발생했습니다.\n담당자가 확인 후 5분 내로 직접 연락드리겠습니다.\n(비상 연락처: 010-0000-0000)",
                        timestamp: new Date(),
                        action: 'NONE'
                    }]);
                }
            }

            /* REMOVED DUPLICATE RECOMMEND BLOCK */
        } catch (error) {
            logToSystem('ERROR', 'Unhandled Exception', traceId || 'UNKNOWN', { error });            // 🚑 Robust Fallback: Show error message to user instead of just console logging
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

            // [VERIFICATION LOG]
            const traceId = generateTraceId();
            logToSystem('INFO', `Button click: intent=${scenario}`, traceId);

            if (scenario === 'funeral') {
                setActiveScenario('funeral');
                welcomeMsg = `갑작스러운 소식에 마음이 무거우시겠습니다. 고인과 유족분들에게 가장 편안한 장례식장을 빠르게 찾아드리겠습니다.\n\n아래 양식을 작성해 주시면 조건에 딱 맞는 장례식장을 추천해 드립니다.`;
                actionType = 'SHOW_FORM_A';
            } else if (scenario === 'memorial') {
                setActiveScenario('memorial');
                welcomeMsg = `고인과 유족분들의 평온한 안식을 위해 최선을 다해 돕겠습니다.\n납골당·수목장·묘지 등 추모시설을 통합 안내해 드립니다. 원하시는 조건(지역, 종교, 예산 등)을 선택해 주세요.`;
                actionType = 'SHOW_FORM_B';
            } else if (scenario === 'pet') {
                setActiveScenario('pet');
                welcomeMsg = `사랑하는 아이와의 이별, 얼마나 가슴 아프실지 짐작이 갑니다.\n아이가 무지개다리를 편안히 건널 수 있도록, 아래 정보를 입력해 주시면 맞춤 장례식장을 안내해 드릴게요.`;
                actionType = 'SHOW_FORM_C'; // New Action for Pet
            }

            setMessages(prev => [...prev, {
                role: 'user',
                text: {
                    'funeral': '장례식장 찾기',
                    'memorial': '추모시설 찾기',
                    'pet': '반려동물 장례',
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
                // Handing over lead to facility
                const authClient = await getAuthClient(session, { strict: true });
                await createConsultationFromLead(currentLeadId, candidate.id, authClient);
            }
            onAction('RESERVE', candidate);
        } catch (_e) {
            // Handover failed
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
        messages[messages.length - 1].action === 'SHOW_FORM_C'
    );
    const isMaumiAssistant = facility.id === 'maum-i';

    return (
        <>
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden shadow-inner" data-debug={isMaumiAssistant ? 'ai-chat-root' : 'facility-ai-chat'}>
            {/* [NEW] Consultation Form Modal */}
            {isFormOpen && (
                <ConsultationForm
                    company={{ id: facility.id, name: facility.name, rating: facility.rating || 0, reviewCount: facility.reviewCount || 0, imageUrl: facility.imageUrl || '', description: facility.description || '', features: facility.features || [], phone: facility.phone || '', priceRange: facility.priceRange || '', benefits: [] }}
                    mode={formMode}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={async (data) => {
                        // Form Submitted (Urgent/Consult)
                        const traceId = generateTraceId();

                        try {
                            // [PDCA] 1. Persistent Log
                            logToSystem('INFO', `Urgent Form Submission: ${data.formattedType || data.type}`, traceId, {
                                facilityId: facility.id,
                                type: data.type,
                                phone: data.phone
                            });

                            // [PDCA] 2. Save to DB (Leads)
                            const formClient = await getAuthClient(session, { strict: true });
                            const lead = await createLead({
                                userId: currentUser?.id,
                                facilityId: facility.id.toString(), // Ensure string
                                contactName: (data.name as string) || '',
                                contactPhone: (data.phone as string) || '',
                                category: facility.type === 'pet_funeral' ? 'pet' : (facility.type === 'funeral' ? 'funeral' : 'memorial'),
                                urgency: (formMode as string) === 'urgent' ? 'immediate' : 'high',
                                priorities: data.requests ? [data.requests as string] : [],
                                contextData: {
                                    ...data,
                                    traceId,
                                    source: 'ConsultationForm'
                                },
                                notes: `[${data.type || ''}] ${(data.requests as string) || ''} (Relation: ${(data.relation as string) || 'N/A'})`
                            }, formClient);

                            if (lead) {
                                // Lead saved successfully

                                // [PDCA] 3. Sync to System Log (Success)
                                logToSystem('INFO', 'Lead Created Successfully', traceId, { leadId: lead.id });
                            }

                            setIsFormOpen(false);

                            // 4. User Feedback
                            setMessages(prev => [...prev, {
                                role: 'model',
                                text: `✅ **[접수 완료]**\n담당자가 내용을 확인하고 있습니다.\n\n📞 **${data.phone}** 번호로 10분 내에 연락드리겠습니다.\n(발신번호: 02-1234-5678)`,
                                timestamp: new Date(),
                                action: 'NONE'
                            }]);

                        } catch (error) {
                            // Urgent form submission failed
                            logToSystem('ERROR', 'Urgent Form Submission Failed', traceId, { error });

                            // Error Feedback
                            toast.error('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
                        }
                    }}
                />
            )}

            {/* Header Area */}
            <div className={`bg-slate-900 text-white p-5 pt-6 shadow-md z-10 shrink-0`} data-debug={isMaumiAssistant ? 'ai-header' : 'facility-ai-header'}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0" data-debug={isMaumiAssistant ? 'ai-avatar' : 'facility-ai-avatar'}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-slate-500/30 overflow-hidden bg-slate-700`}>
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                        </div>
                        <div className="min-w-0 flex-1" data-debug={isMaumiAssistant ? 'ai-title' : 'facility-ai-title'}>
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
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                        data-debug="ai-close"
                        title="상담 종료"
                    >
                        <X className="w-5 h-5 text-slate-300 hover:text-white" />
                    </button>
                </div>

                {/* Quick Info Badges */}
                <div className="flex gap-2 text-[11px] font-medium">
                    <span className={`bg-slate-800 border-slate-700 px-2 py-1 rounded text-slate-200`}>24시간 상담</span>
                    <span className={`bg-slate-800 border-slate-700 px-2 py-1 rounded text-slate-200 hidden sm:inline-block`}>실시간 답변</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50 pb-4 no-scrollbar" ref={scrollRef} data-debug={isMaumiAssistant ? 'ai-body' : 'facility-ai-body'}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${['SHOW_FORM_A', 'SHOW_FORM_B', 'SHOW_FORM_C'].includes(msg.action || '') ? 'max-w-full w-full' : 'max-w-[92%] sm:max-w-[85%]'} flex flex-col items-start gap-2`}>
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
                                                    {msg.options.map((opt: { label: string; value: string }, i: number) => (
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
                                                onSubmit={() => { }}
                                                onClose={onClose}
                                                onGoToMyPage={onGoToMyPage}
                                                onLoginRequired={() => {
                                                    onClose();
                                                    openSignIn();
                                                }}
                                                initialCategory={
                                                    initialIntent === 'pet_funeral' ? 'pet' :
                                                        initialIntent === 'memorial_facility' ? 'memorial' : 'funeral'
                                                }
                                                facilityId={facility.id.toString()}
                                                facilityName={facility.name}
                                                currentUser={currentUser}
                                                onSwitchToFacility={(f, ctx) => onSwitchToFacility?.(f, ctx)}
                                            />
                                        )}

                                        {msg.action === 'SHOW_FORM_B' && (
                                            <MemorialSearchForm
                                                userLocation={userLocation}
                                                onGetCurrentPosition={onGetCurrentPosition}
                                                onSubmit={() => { }}
                                                onClose={onClose}
                                                onGoToMyPage={onGoToMyPage}
                                                onLoginRequired={() => { onClose(); openSignIn(); }}
                                                facilityId={facility.id !== 'maum-i' ? facility.id.toString() : undefined}
                                                facilityName={facility.id !== 'maum-i' ? facility.name : undefined}
                                                facilityType={facility.id !== 'maum-i' ? facility.type : undefined}
                                                currentUser={currentUser}
                                                onSwitchToFacility={(f, ctx) => onSwitchToFacility?.(f, ctx)}
                                            />
                                        )}

                                        {msg.action === 'SHOW_FORM_C' && (
                                            <PetSearchForm
                                                userLocation={userLocation}
                                                onGetCurrentPosition={onGetCurrentPosition}
                                                onSubmit={() => { }}
                                                onClose={onClose}
                                                onGoToMyPage={onGoToMyPage}
                                                onLoginRequired={() => { onClose(); openSignIn(); }}
                                                initialCategory="pet_funeral"
                                                currentUser={currentUser}
                                                onSwitchToFacility={(f, ctx) => onSwitchToFacility?.(f, ctx)}
                                            />
                                        )}

                                        {msg.action === 'RECOMMEND' && msg.facilities && msg.facilities.length > 0 && (
                                            <RecommendList
                                                facilities={msg.facilities}
                                                onViewDetail={handleReserve}
                                            />
                                        )}

                                        {/* Other Actions */}
                                        {!['SHOW_FORM_A', 'SHOW_FORM_B', 'SHOW_FORM_C', 'RECOMMEND', 'URGENT_DISPATCH'].includes(msg.action || '') && (
                                            <button
                                                onClick={() => {
                                                    if (msg.action === 'RESERVE') {
                                                        setFormMode('chat');
                                                        setIsFormOpen(true);
                                                    } else {
                                                        onAction(msg.action!);
                                                    }
                                                }}
                                                className="mt-3 w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm"
                                            >
                                                {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> 예약 상담 접수</>}
                                                {msg.action === 'MAP' && <><MapPin size={16} /> 오시는 길 보기</>}
                                                {msg.action === 'CALL_MANAGER' && <><Phone size={16} /> 담당자 전화 연결</>}
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
                                            className="bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-[11px] py-1.5 px-3 min-h-[44px] md:min-h-0 rounded-full shadow-sm transition-all active:scale-95 flex items-center gap-1.5 font-medium"
                                        >
                                            <span>{faq.icon}</span> {faq.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="bg-white p-4 pt-2 pb-safe" data-debug="ai-input-bar">
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
                                    <Sparkles size={10} /> AI 상담 비서
                                </p>
                            </div>
                        </div>
                    </>
                )
            }
        </div >

            {/* 쿼터 초과 모달 */}
            <UpgradePrompt
                isOpen={!!quotaExceeded && quotaExceeded?.reason !== 'facility_limit'}
                onClose={() => setQuotaExceeded(null)}
                featureName={`AI 상담 (${getAiCategory() === 'funeral_home' ? '장례식장' : getAiCategory() === 'pet_funeral' ? '반려동물' : '추모시설 (납골당·수목장·묘지 등)'})`}
                current={quotaExceeded?.current ?? 0}
                limit={quotaExceeded?.limit ?? 0}
                onNavigateToPlan={onGoToMyPage}
            />

            {quotaExceeded?.reason === 'facility_limit' && (
                <div className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[24px] shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">지금은 AI 상담이 어렵습니다</h2>
                            </div>
                            <button
                                onClick={() => setQuotaExceeded(null)}
                                className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5">
                            <p className="text-sm leading-6 text-gray-700 mb-5">
                                현재 이 시설의 AI 상담 가능 횟수가 모두 사용되어 지금은 AI 상담을 진행하기 어렵습니다.
                                다른 시설을 확인하시거나, 일반 문의 또는 예약 경로를 이용해 주세요.
                            </p>

                            <button
                                onClick={() => setQuotaExceeded(null)}
                                className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
