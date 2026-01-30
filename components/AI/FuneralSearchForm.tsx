import React, { useState, useEffect, useRef } from 'react';
import {
    Clock,
    MapPin,
    Users,
    ArrowRight,
    Check,
    X,
    ChevronRight,
    Calendar,
    Phone,
    Loader2
} from 'lucide-react';
import { createFuneralConsultation, getDistinctRegions, getIntelligentRecommendations } from '@/lib/queries';

interface FormProps {
    userLocation?: { lat: number; lng: number };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string; data: any }) => void;
    onClose?: () => void;
    onLoginRequired?: () => void;
    initialCategory?: string;
    facilityId?: string;
    facilityName?: string;
    currentUser?: any;
    onSwitchToFacility?: (facility: any) => void;
}

const FuneralSearchForm: React.FC<FormProps> = ({
    onSubmit,
    onClose,
    onLoginRequired,
    initialCategory = 'funeral',
    facilityId,
    facilityName,
    currentUser,
    onSwitchToFacility
}) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // [ADD] State for in-form recommendations
    const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    const [urgency, setUrgency] = useState('');

    // Step 2: Deceased Location (if urgent)
    const [deceasedLocation, setDeceasedLocation] = useState('');
    const [needsAmbulance, setNeedsAmbulance] = useState<boolean | null>(null);

    // Step 3: Search Region
    const [location, setLocation] = useState('');

    // Step 4: Scale
    const [scale, setScale] = useState('');

    // Step 5: Religion
    const [religion, setReligion] = useState('');

    // Step 6: Schedule
    const [schedule, setSchedule] = useState('');

    // Step 7: Services
    const [services, setServices] = useState<string[]>([]);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const queryText = step === 2 ? deceasedLocation : location;
        if (!queryText || queryText.length < 2) {
            setSuggestions([]); setShowSuggestions(false); return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await getDistinctRegions(queryText) as string[];
                const uniqueResults = Array.from(new Set(results)).slice(0, 5);
                setSuggestions(uniqueResults);
                setShowSuggestions(uniqueResults.length > 0);
            } catch (e) { console.error(e); }
        }, 300);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [location, deceasedLocation, step]);

    const toggleService = (opt: string) => {
        setServices(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

    const URGENCY_OPTIONS = [
        { id: 'deceased', label: '⚫ 임종(운명)하셨습니다', sub: '장례 접수 진행' },
        { id: 'imminent', label: '🔵 임종이 임박하여 미리 상담', sub: '사전 상담 및 예약 준비' },
        { id: 'inquiry', label: '⚪ 시설 이용 안내 및 단순 문의', sub: '시설 정보 확인' }
    ];

    const SCALE_OPTIONS = [
        { id: 'small', label: '약 50명 미만', sub: '가족장, 30~40평형' },
        { id: 'medium', label: '약 100~200명', sub: '일반적인 규모, 50~60평형' },
        { id: 'large', label: '300명 이상', sub: '대규모, 80평형 이상' }
    ];

    const RELIGION_OPTIONS = [
        { id: 'buddhist', label: '☸️ 불교', sub: '전통식, 분향' },
        { id: 'christian', label: '✝️ 기독교', sub: '예배 중심, 헌화' },
        { id: 'catholic', label: '⛪ 천주교', sub: '연도회, 미사' },
        { id: 'none', label: '🕊️ 무교/기타', sub: '일반 장례' }
    ];

    const SCHEDULE_OPTIONS = [
        { id: '3day', label: '3일장 (일반적)', sub: '오늘 입실 → 내일 입관 → 모레 발인' },
        { id: '2day', label: '2일장 (간소화)', sub: '오늘 입실 → 내일 입관 후 바로 발인' },
        { id: 'other', label: '기타 (상담 필요)', sub: '상담원과 일정 협의' }
    ];

    const SERVICE_OPTIONS = ['🅿️ 주자창 완비', '🛁 샤워실 구비', '🥣 식사 제공', '🦼 장례용품 제공', '🚑 운구차 지원'];

    const handleNext = () => {
        if (step === 1) {
            if (!urgency) return;
            // [FIX] 'inquiry'일 때도 Step 3에서 멈추도록 step 상태만 변경 (UI 조건문은 JSX에서 처리)
            if (urgency === 'deceased' || urgency === 'imminent') {
                setStep(2);
            } else {
                setStep(3); // Skip deceased location for simple inquiry
            }
            return;
        }
        if (step === 2) {
            if (!deceasedLocation) return;
            setStep(3);
            return;
        }
        if (step === 3 && !location) return;
        if (step === 4 && !scale) return;
        if (step === 5 && !religion) return;
        if (step === 6 && !schedule) return;

        // [FIX] Ensure transition to step 8
        if (step === 7 && services.length === 0) {
            // Optional check for services, currently allowed to be empty
        }

        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setIsSaving(true);

        const searchData = {
            category: initialCategory,
            urgency,
            location: {
                type: 'text',
                text: location
            },
            deceasedLocation,
            needsAmbulance,
            scale,
            religion,
            schedule,
            services,
            notes: `운구차필요: ${needsAmbulance ? '예' : '아니오'}, 고인위치: ${deceasedLocation}`
        };

        const urgencyLabel = URGENCY_OPTIONS.find(o => o.id === urgency)?.label || urgency;
        const scaleLabel = SCALE_OPTIONS.find(o => o.id === scale)?.label || scale;
        const religionLabel = RELIGION_OPTIONS.find(o => o.id === religion)?.label || religion;
        const scheduleLabel = SCHEDULE_OPTIONS.find(o => o.id === schedule)?.label || schedule;

        const finalText = `[🚨 장례식장 찾기]\n` +
            `| 구분 | 선택 내용 |\n` +
            `|---|---|\n` +
            `| 상황 | ${urgencyLabel} |\n` +
            `${deceasedLocation ? `| 고인 위치 | ${deceasedLocation} |\n` : ''}` +
            `| 지역 설정 | ${location} |\n` +
            `| 희망 규모 | ${scaleLabel} |\n` +
            `| 종교 | ${religionLabel} |\n` +
            `| 일정 | ${scheduleLabel} |\n` +
            `| 부대시설 | ${services.join(', ') || '선택 없음'} |`;

        // Submit to AI
        onSubmit({ text: finalText, data: searchData });
        setIsSaving(false);
        setIsSubmitted(true); // Show success view

        // [FIX] Fetch recommendations inside the form instead of auto-closing
        setIsLoadingRecommendations(true);
        try {
            // Use getIntelligentRecommendations for better results
            // Adjust arguments as needed: lat, lng, category, regionText
            // Assuming we have location text, let's try to get coordinates or just use region text if API supports it
            // For now, falling back to a region-based search or similar if intelligent search needs coordinates
            // NOTE: getIntelligentRecommendations needs lat/lng. If we don't have them, we might need a geocoding step or use a simpler query.
            // Let's assume we can use the region text for a simple search or if we have userLocation (which we don't in props yet, maybe need to add).
            // For this implementation, let's assume we use the region text to find facilities.
            // If getIntelligentRecommendations requires lat/lng, we might need to fetch them.
            // Let's use getFuneralFacilities (which seems to exist or we can use a similar one).
            // Actually, querying by region text directly might be best if available.
            // Let's use `getFuneralFacilitiesByRegion` if available, or fetch all and filter (inefficient).
            // Better: use `getDistinctRegions` to get list, but we need facilities.

            // Let's import getIntelligentRecommendations from lib/queries
            // We need lat/lng. If not available, maybe skip or use defaults?
            // Let's try to pass 0,0 and region text if the API supports filtering by region text logic inside.
            // Wait, getIntelligentRecommendations implementation in queries.ts:
            // "export const getIntelligentRecommendations = async (lat: number, lng: number, category?: string, regionText?: string)"
            // It seems it CAN take regionText.
            const recs = await getIntelligentRecommendations(0, 0, 'funeral_home', location);
            setRecommendedFacilities(recs.slice(0, 3));
        } catch (e) {
            console.error("Failed to fetch recommendations", e);
        } finally {
            setIsLoadingRecommendations(false);
        }

        // [REMOVED] Auto-close timeout
        // setTimeout(() => { onClose?.(); }, 1500);
    };

    const handleReset = () => {
        setStep(1);
        setIsSubmitted(false);
        setUrgency('');
        setDeceasedLocation('');
        setNeedsAmbulance(null);
        setLocation('');
        setScale('');
        setReligion('');
        setSchedule('');
        setServices([]);
        setRecommendedFacilities([]); // Clear recommendations on reset
    };

    // Chat bubble style for AI question
    const QuestionBubble = ({ children }: { children: React.ReactNode }) => (
        <div className="flex gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs shrink-0">
                AI
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 max-w-[85%] shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
            </div>
        </div>
    );

    // Selection button style
    const SelectButton = ({
        selected,
        onClick,
        label,
        sub
    }: {
        selected: boolean;
        onClick: () => void;
        label: string;
        sub?: string;
    }) => (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all mb-2 ${selected
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
        >
            <div className="font-bold text-sm">{label}</div>
            {sub && <div className={`text-xs mt-0.5 ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</div>}
        </button>
    );

    // Login Required Screen
    if (!currentUser) {
        return (
            <div className="space-y-4">
                <div className="flex gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs shrink-0">
                        AI
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-sm p-4 max-w-[85%] shadow-sm">
                        <p className="text-sm text-amber-800 font-bold mb-1">🔐 로그인이 필요합니다</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            상담 접수 및 내역 조회를 위해 로그인이 필요합니다.<br />
                            로그인 후 다시 시도해 주세요.
                        </p>
                    </div>
                </div>
                <div className="pl-10">
                    <button
                        onClick={() => onLoginRequired?.()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all"
                    >
                        로그인하기
                    </button>
                </div>
            </div>
        );
    }

    // Step 6: Completion Screen (fallback if onClose not provided)
    // [FIX] Render In-Form Recommendations on Success
    if (isSubmitted) {
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <QuestionBubble>
                    ✅ <strong>상담 접수 완료!</strong><br />
                    입력하신 정보(<strong>{location}</strong>)를 바탕으로 엄선한<br />
                    추천 장례식장을 안내해 드립니다.
                </QuestionBubble>

                <div className="pl-10">
                    {isLoadingRecommendations ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-white border border-slate-200 rounded-xl">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                            <span className="text-xs text-slate-500 font-medium">맞춤 시설을 찾고 있습니다...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recommendedFacilities.length > 0 ? (
                                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                    {recommendedFacilities.map((f, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                            onClick={() => {
                                                // Navigate to facility
                                                if (onSwitchToFacility) {
                                                    const targetId = typeof f.id === 'object' ? (f.id as any).id || (f as any).facilityId : f.id;
                                                    onSwitchToFacility({
                                                        ...f,
                                                        id: targetId,
                                                        category: 'funeral_home'
                                                    });
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {f.name}
                                                </div>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                    추천 {idx + 1}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                                <MapPin size={12} /> {f.address || f.jibun_address || '주소 정보 없음'}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Phone size={12} /> {f.phone || '연락처 정보 없음'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                                    <p className="text-sm text-slate-600 font-medium mb-1">추천 가능한 시설이 없습니다.</p>
                                    <p className="text-xs text-slate-500">
                                        선택하신 지역({location})에 등록된 시설이 없거나<br />
                                        일시적인 오류일 수 있습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pl-10 pt-2">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg transition-all"
                    >
                        닫기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Step 1: Urgency */}
            {step >= 1 && (
                <>
                    <QuestionBubble>
                        삼가 고인의 명복을 빕니다. 정성을 다해 모시겠습니다.<br />
                        <strong>1. 현재 어떤 도움이 필요하신가요?</strong>
                    </QuestionBubble>
                    {step === 1 && (
                        <div className="pl-10">
                            {URGENCY_OPTIONS.map(opt => (
                                <SelectButton
                                    key={opt.id}
                                    selected={urgency === opt.id}
                                    onClick={() => { setUrgency(opt.id); }}
                                    label={opt.label}
                                    sub={opt.sub}
                                />
                            ))}
                        </div>
                    )}
                    {step > 1 && urgency && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {URGENCY_OPTIONS.find(o => o.id === urgency)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 2: Deceased Location (for urgent cases) */}
            {step >= 2 && (urgency === 'deceased' || urgency === 'imminent') && (
                <>
                    <QuestionBubble>
                        <strong>2. 긴급 대응:</strong> 현재 <strong>고인이 계신 곳</strong>은 어디인가요?<br />
                        (예: OO병원, 자택 등)
                    </QuestionBubble>
                    {step === 2 && (
                        <div className="pl-10 space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={deceasedLocation}
                                    onChange={(e) => setDeceasedLocation(e.target.value)}
                                    placeholder="예: 서울아산병원, 자택"
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                {showSuggestions && step === 2 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <button key={i} onClick={() => { setDeceasedLocation(s); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none">
                                                <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(deceasedLocation, 'gi'), (match) => `<b>${match}</b>`) }} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 mt-2">장례식장까지 운구 차량(앰뷸런스) 지원이 필요하십니까?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setNeedsAmbulance(true)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${needsAmbulance === true
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                        }`}
                                >
                                    🚑 예, 필요합니다
                                </button>
                                <button
                                    onClick={() => setNeedsAmbulance(false)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${needsAmbulance === false
                                        ? 'bg-slate-700 border-slate-700 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                        }`}
                                >
                                    아니요, 괜찮습니다
                                </button>
                            </div>
                        </div>
                    )}
                    {step > 2 && deceasedLocation && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                🚑 고인 위치: {deceasedLocation}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 3: Search Region */}
            {step >= 3 && (
                <>
                    <QuestionBubble>
                        <strong>3. 지역 설정:</strong> 어느 지역의 장례식장을 추천해 드릴까요?<br />
                        (예: 용인시, 분당구 등)
                    </QuestionBubble>
                    {step === 3 && (
                        <div className="pl-10 space-y-3">
                            {/* Region Chips */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종'].map(reg => (
                                    <button
                                        key={reg}
                                        onClick={() => { setLocation(reg); setShowSuggestions(false); }}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${location === reg
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                            }`}
                                    >
                                        {reg}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="또는 구체적인 지역 입력 (예: 분당구, 수지구)"
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                {showSuggestions && step === 3 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                        {suggestions.map((s, i) => (
                                            <button key={i} onClick={() => { setLocation(s); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none">
                                                <span dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(location, 'gi'), (match) => `<b>${match}</b>`) }} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {step > 3 && location && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                📍 추천 지역: {location}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 4: Scale */}
            {step >= 4 && (
                <>
                    <QuestionBubble>
                        <strong>4. 규모 선택:</strong> 원활한 조문객 맞이를 위해 <strong>빈소 규모</strong>를 선택해 주세요.
                    </QuestionBubble>
                    {step === 4 && (
                        <div className="pl-10">
                            {SCALE_OPTIONS.map(opt => (
                                <SelectButton
                                    key={opt.id}
                                    selected={scale === opt.id}
                                    onClick={() => { setScale(opt.id); }}
                                    label={opt.label}
                                    sub={opt.sub}
                                />
                            ))}
                        </div>
                    )}
                    {step > 4 && scale && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {SCALE_OPTIONS.find(o => o.id === scale)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 5: Religion */}
            {step >= 5 && (
                <>
                    <QuestionBubble>
                        <strong>5. 종교 선택:</strong> 장례 절차를 진행할 <strong>종교</strong>를 선택해 주세요.
                    </QuestionBubble>
                    {step === 5 && (
                        <div className="pl-10 grid grid-cols-2 gap-2">
                            {RELIGION_OPTIONS.map(opt => (
                                <SelectButton
                                    key={opt.id}
                                    selected={religion === opt.id}
                                    onClick={() => { setReligion(opt.id); }}
                                    label={opt.label}
                                    sub={opt.sub}
                                />
                            ))}
                        </div>
                    )}
                    {step > 5 && religion && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {RELIGION_OPTIONS.find(o => o.id === religion)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 6: Schedule */}
            {step >= 6 && (
                <>
                    <QuestionBubble>
                        <strong>6. 일정 확인:</strong> <strong>장례 일정</strong>은 어떻게 계획하고 계신가요?
                    </QuestionBubble>
                    {step === 6 && (
                        <div className="pl-10">
                            {SCHEDULE_OPTIONS.map(opt => (
                                <SelectButton
                                    key={opt.id}
                                    selected={schedule === opt.id}
                                    onClick={() => { setSchedule(opt.id); }}
                                    label={opt.label}
                                    sub={opt.sub}
                                />
                            ))}
                        </div>
                    )}
                    {step > 6 && schedule && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {SCHEDULE_OPTIONS.find(o => o.id === schedule)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 7: Services */}
            {step >= 7 && (
                <>
                    <QuestionBubble>
                        <strong>7. 추가 서비스:</strong> 추가적으로 필요한 서비스가 있으신가요?
                    </QuestionBubble>
                    {step === 7 && (
                        <div className="pl-10">
                            <div className="flex flex-wrap gap-2">
                                {SERVICE_OPTIONS.map(opt => (
                                    <button key={opt} onClick={() => toggleService(opt)} className={`py-2 px-3 text-xs rounded-full border transition-all ${services.includes(opt) ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step > 7 && services.length > 0 && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm max-w-[80%] text-right">
                                {services.join(', ')}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 8: Summary */}
            {step === 8 && (
                <>
                    <QuestionBubble>
                        <strong>8. 최종 확인:</strong> 입력하신 내용을 확인해 주세요. 아래 내용이 맞으시면 <strong>상담 접수</strong> 버튼을 눌러주세요.
                    </QuestionBubble>
                    <div className="pl-10">
                        <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">현재 상황</span>
                                <span className="font-bold text-slate-800">{URGENCY_OPTIONS.find(o => o.id === urgency)?.label}</span>
                            </div>
                            {deceasedLocation && (
                                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">고인 위치</span>
                                    <span className="font-bold text-slate-800">{deceasedLocation} {needsAmbulance ? '(🚑 운구 필요)' : ''}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">추천 지역</span>
                                <span className="font-bold text-slate-800">{location}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">희망 규모</span>
                                <span className="font-bold text-slate-800">{SCALE_OPTIONS.find(o => o.id === scale)?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">종교</span>
                                <span className="font-bold text-slate-800">{RELIGION_OPTIONS.find(o => o.id === religion)?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">장례 일정</span>
                                <span className="font-bold text-slate-800">{SCHEDULE_OPTIONS.find(o => o.id === schedule)?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">부대시설</span>
                                <span className="font-bold text-slate-800">{services.join(', ') || '선택 없음'}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Step 8: Final Summary & Submit */}
            {step === 8 && (
                <div className="pl-10 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                        <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-2">입력하신 정보를 확인해주세요</h4>
                        <div className="grid grid-cols-[80px_1fr] gap-y-1">
                            <span className="text-slate-500">상황:</span>
                            <span className="font-medium text-slate-800">
                                {urgency === 'deceased' ? '임종 발생 (긴급)' :
                                    urgency === 'imminent' ? '임종 임박 (준비)' : '단순 문의'}
                            </span>

                            {deceasedLocation && (
                                <>
                                    <span className="text-slate-500">고인 위치:</span>
                                    <span className="font-medium text-slate-800">{deceasedLocation}</span>
                                </>
                            )}

                            <span className="text-slate-500">희망 지역:</span>
                            <span className="font-medium text-slate-800">{location}</span>

                            <span className="text-slate-500">예상 조문:</span>
                            <span className="font-medium text-slate-800">{scale}</span>

                            <span className="text-slate-500">종교:</span>
                            <span className="font-medium text-slate-800">{religion}</span>

                            <span className="text-slate-500">장례 일정:</span>
                            <span className="font-medium text-slate-800">{schedule}</span>

                            <span className="text-slate-500">필요 서비스:</span>
                            <span className="font-medium text-slate-800">
                                {services.length > 0 ? services.join(', ') : '선택 없음'}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                        위 내용으로 상담을 접수하고<br />
                        맞춤 장례식장 추천을 받으시겠습니까?
                    </p>
                </div>
            )}

            {/* Navigation */}
            {step < 8 && (
                <div className="pl-10 pt-2 flex gap-2">
                    {step > 1 && <button onClick={() => {
                        // [FIX] Previous button logic
                        if (step === 3 && (urgency !== 'deceased' && urgency !== 'imminent')) {
                            // If simple inquiry, go back to Step 1 (skip Step 2)
                            setStep(1);
                        } else {
                            setStep(prev => prev - 1);
                        }
                    }} className="px-3 py-3 text-slate-500 text-xs hover:bg-slate-100 rounded-xl border border-slate-200 transition">이전</button>}
                    <button
                        onClick={handleNext}
                        disabled={
                            (step === 1 && !urgency) ||
                            (step === 2 && !deceasedLocation) ||
                            (step === 3 && !location) ||
                            (step === 4 && !scale) ||
                            (step === 5 && !religion) ||
                            (step === 6 && !schedule)
                        }
                        className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all"
                    >
                        {step === 7 ? '마지막 확인 →' : '다음 질문으로 →'}
                    </button>
                </div>
            )}

            {/* Submit button on summary step */}
            {step === 8 && (
                <div className="pl-10 pt-2 flex gap-2">
                    <button onClick={() => setStep(7)} className="px-3 py-3 text-slate-500 text-xs hover:bg-slate-100 rounded-xl border border-slate-200 transition">수정하기</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> 상담 접수하기</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FuneralSearchForm;
