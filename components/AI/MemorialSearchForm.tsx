import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin,
    Check,
    X,
    Phone,
    Loader2,
    ChevronDown,
    Calendar
} from 'lucide-react';
import { getDistinctRegions, getIntelligentRecommendations } from '@/lib/queries';
import { createAuthenticatedClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';
import {
    MEMORIAL_TIMING_OPTIONS,
    MEMORIAL_RELIGION_OPTIONS,
    MEMORIAL_BUDGET_OPTIONS
} from '@/constants/maumAiConstants';
import { addSearchHistory } from '@/utils/searchHistory';

const MEMORIAL_LIGHTING_OPTIONS = [
    { id: 'bright', label: '☀️ 채광 좋음', sub: '자연광이 잘 드는 밝은 공간' },
    { id: 'medium', label: '🌤️ 보통', sub: '적당한 채광' },
    { id: 'dim', label: '🌙 은은함', sub: '차분하고 조용한 분위기' }
];

const MEMORIAL_TIER_OPTIONS = [
    { id: 'low', label: '저단 (1~2단)', sub: '쉽게 접근 가능' },
    { id: 'mid', label: '중단 (3~4단)', sub: '적당한 높이' },
    { id: 'high', label: '고단 (5단 이상)', sub: '조용하고 전망 좋음' }
];

interface FormProps {
    userLocation?: { lat: number; lng: number };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string; data: any }) => void;
    onClose?: () => void;
    onGoToMyPage?: () => void;
    onLoginRequired?: () => void;
    initialCategory?: string;
    facilityId?: string;
    facilityName?: string;
    currentUser?: any;
    onSwitchToFacility?: (facility: any, context?: any) => void;
}

const MemorialSearchForm: React.FC<FormProps> = ({
    onSubmit,
    onClose,
    onGoToMyPage,
    onLoginRequired,
    initialCategory = 'memorial',
    facilityId,
    facilityName,
    currentUser,
    onSwitchToFacility
}) => {
    const { session } = useSession();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 인라인 상담접수 상태
    const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [showContactFor, setShowContactFor] = useState<string | null>(null);
    const [cName, setCName] = useState(currentUser?.name || '');
    const [cPhone, setCPhone] = useState(currentUser?.phone || '');
    const [cMemo, setCMemo] = useState('');

    const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    const [timing, setTiming] = useState('');
    const [location, setLocation] = useState('');
    const [religion, setReligion] = useState('');
    const [budget, setBudget] = useState('');
    const [lighting, setLighting] = useState('');
    const [tier, setTier] = useState('');

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-fill location if facility context exists
    useEffect(() => {
        if (facilityName && (!location || location === '')) {
            setLocation(facilityName);
        }
    }, [facilityName]);

    useEffect(() => {
        if (!location || location.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await getDistinctRegions(location) as string[];
                const uniqueResults = Array.from(new Set(results)).slice(0, 5);
                setSuggestions(uniqueResults);
                setShowSuggestions(uniqueResults.length > 0);
            } catch (e) {
                console.error(e);
            }
        }, 300);
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [location]);

    const handleNext = () => {
        if (step === 1 && !timing) return;
        if (step === 2 && !location) return;
        if (step === 3 && !religion) return;
        if (step === 4 && !budget) return;
        if (step === 5 && !lighting) return;

        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setIsSaving(true);

        const searchData = {
            category: initialCategory,
            timing,
            location: {
                type: 'text',
                text: location
            },
            religion,
            budget,
            lighting,
            tier,
            notes: `접수시설: ${facilityName || '미지정'}`
        };

        const timingLabel = MEMORIAL_TIMING_OPTIONS.find(o => o.id === timing)?.label || timing;
        const religionLabel = MEMORIAL_RELIGION_OPTIONS.find(o => o.id === religion)?.label || religion;
        const budgetLabel = MEMORIAL_BUDGET_OPTIONS.find(o => o.id === budget)?.label || budget;
        const lightingLabel = MEMORIAL_LIGHTING_OPTIONS.find(o => o.id === lighting)?.label || lighting;
        const tierLabel = MEMORIAL_TIER_OPTIONS.find(o => o.id === tier)?.label || tier;

        const finalText = `[🏛️ 추모시설 찾기]\n` +
            `| 구분 | 선택 내용 |\n` +
            `|---|---|\n` +
            `| 상황 | ${timingLabel} |\n` +
            `| 지역 설정 | ${location} |\n` +
            `| 종교 | ${religionLabel} |\n` +
            `| 예산 | ${budgetLabel} |\n` +
            `| 채광 | ${lightingLabel} |\n` +
            `| 단높이 | ${tierLabel} |`;

        // Submit to AI
        onSubmit({ text: finalText, data: searchData });
        setIsSaving(false);
        setIsSubmitted(true);
        addSearchHistory(location, 'memorial');

        // For facility-specific consultations, save directly to DB (authenticated)
        if (facilityId && currentUser) {
            try {
                const token = await session?.getToken({ template: 'supabase' });
                if (!token) throw new Error('인증 토큰 없음');
                const authClient = createAuthenticatedClient(token);

                const { error: dbError } = await authClient
                    .from('consultations')
                    .insert({
                        user_id: currentUser.id,
                        facility_id: facilityId,
                        user_name: currentUser.firstName || 'Unknown',
                        user_phone: currentUser.phoneNumbers?.[0]?.phoneNumber || 'N/A',
                        status: 'pending',
                        notes: finalText
                    });

                if (dbError) {
                    console.error('[MemorialSearchForm] Failed to save consultation:', dbError);
                }
            } catch (e) {
                console.error('[MemorialSearchForm] Exception saving consultation:', e);
            }
        }

        // Fetch recommendations
        setIsLoadingRecommendations(true);
        try {
            if (facilityId && facilityName) {
                setRecommendedFacilities([{
                    id: facilityId,
                    name: facilityName,
                    address: '현재 상담 중인 시설',
                    phone: '010-0000-0000'
                }]);
            } else {
                const recs = await getIntelligentRecommendations(0, 0, 'memorial', location);
                setRecommendedFacilities(recs.slice(0, 5));
            }
        } catch (e) {
            console.error("Failed to fetch recommendations", e);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setIsSubmitted(false);
        setTiming('');
        if (!facilityId) setLocation('');
        setReligion('');
        setBudget('');
        setLighting('');
        setTier('');
        setRecommendedFacilities([]);
    };

    const QuestionBubble = ({ children }: { children: React.ReactNode }) => (
        <div className="flex gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs shrink-0">
                AI
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm leading-relaxed">
                {children}
            </div>
        </div>
    );

    const OptionButton = ({ selected, onClick, children }: any) => (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${selected
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
        >
            {children}
        </button>
    );

    // 인라인 상담접수 제출
    const doBooking = async (fId: string, fName: string) => {
        if (!cName.trim() || !cPhone.trim()) return;
        setBookingId(fId);

        const notes = [
            `[AI 마음이 추모시설 추천 접수]`,
            `시설: ${fName}`,
            `상황: ${MEMORIAL_TIMING_OPTIONS.find(o => o.id === timing)?.label}`,
            `지역: ${location}`,
            `종교: ${MEMORIAL_RELIGION_OPTIONS.find(o => o.id === religion)?.label}`,
            `예산: ${MEMORIAL_BUDGET_OPTIONS.find(o => o.id === budget)?.label}`,
            cMemo ? `요청: ${cMemo}` : '',
        ].filter(Boolean).join(', ');

        try {
            const token = await session?.getToken({ template: 'supabase' });
            if (!token) throw new Error('인증 토큰 없음');
            const authClient = createAuthenticatedClient(token);

            const { error } = await authClient
                .from('consultations')
                .insert({
                    facility_id: fId,
                    user_id: currentUser?.id,
                    user_name: cName.trim(),
                    user_phone: cPhone.trim(),
                    notes,
                    status: 'pending'
                });

            if (error) throw error;
            setBookedIds(prev => new Set(prev).add(String(fId)));
            setShowContactFor(null);
        } catch (e) {
            console.error('상담접수 실패:', e);
        } finally {
            setBookingId(null);
        }
    };

    // Login required screen
    if (!currentUser && onLoginRequired) {
        return (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <QuestionBubble>
                    <strong>로그인이 필요합니다</strong><br />
                    상담 접수를 위해 로그인해 주세요.
                </QuestionBubble>
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

    // Completion Screen
    if (isSubmitted) {
        // Facility-specific: Show completion message
        if (facilityId && facilityName) {
            return (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <QuestionBubble>
                        ✅ <strong>상담 접수 완료!</strong><br />
                        <strong>{facilityName}</strong>에 상담 요청이 전달되었습니다.<br />
                        담당자가 확인 후 연락드리겠습니다.
                    </QuestionBubble>

                    <div className="pl-10">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                                <Check size={18} className="text-purple-600" />
                                접수 내역
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">시설명</span>
                                    <span className="font-bold text-slate-900">{facilityName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">상황</span>
                                    <span className="font-medium text-slate-800">{MEMORIAL_TIMING_OPTIONS.find(o => o.id === timing)?.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">예산</span>
                                    <span className="font-medium text-slate-800">{MEMORIAL_BUDGET_OPTIONS.find(o => o.id === budget)?.label}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-purple-200">
                                <p className="text-[10px] text-slate-500 text-center">
                                    💼 시설 대시보드 및 마이페이지에서 확인 가능합니다
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pl-10 pt-2">
                        <button
                            onClick={onClose}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg transition-all"
                        >
                            확인
                        </button>
                    </div>
                </div>
            );
        }

        // General search: Show recommendations
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <QuestionBubble>
                    ✅ <strong>상담 접수 완료!</strong><br />
                    입력하신 정보(<strong>{location}</strong>)를 바탕으로 엄선한<br />
                    추천 추모시설을 안내해 드립니다.
                </QuestionBubble>

                <div className="pl-10">
                    {isLoadingRecommendations ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-white border border-slate-200 rounded-xl">
                            <Loader2 className="animate-spin text-purple-600" size={32} />
                            <span className="text-xs text-slate-500 font-medium">맞춤 시설을 찾고 있습니다...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recommendedFacilities.length > 0 ? (
                                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                                    {recommendedFacilities.map((f, idx) => {
                                        const fId = String(typeof f.id === 'object' ? (f.id as any).id || (f as any).facilityId : f.id);
                                        const imageUrl = f.image_url || (f.images?.[0] ?? null);
                                        const isBooked = bookedIds.has(fId);
                                        const isThisOpen = showContactFor === fId;
                                        const isThisBooking = bookingId === fId;

                                        return (
                                            <div key={fId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                {imageUrl && <img src={imageUrl} alt={f.name} className="w-full h-32 object-cover" loading="lazy" />}
                                                <div className="p-4 space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-slate-900">{f.name}</span>
                                                        <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full font-bold">추천 {idx + 1}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {f.address || f.jibun_address || '주소 정보 없음'}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={12} /> {f.phone || '연락처 정보 없음'}</div>

                                                    {isBooked ? (
                                                        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                                                            <Check size={16} /> 접수 완료
                                                        </div>
                                                    ) : isThisOpen ? (
                                                        <div className="space-y-2 border-t border-slate-100 pt-3">
                                                            <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="성함 *" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                                                            <input type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="연락처 * (010-1234-5678)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                                                            <input type="text" value={cMemo} onChange={e => setCMemo(e.target.value)} placeholder="요청사항 (선택)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => setShowContactFor(null)} className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold py-2.5 rounded-xl">취소</button>
                                                                <button type="button" onClick={() => doBooking(fId, f.name)} disabled={!cName.trim() || !cPhone.trim() || !!bookingId} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                                                                    {isThisBooking ? <><Loader2 size={16} className="animate-spin" /> 접수 중...</> : <><Check size={16} /> 접수하기</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button type="button" onClick={() => { setCName(currentUser?.name || ''); setCPhone(currentUser?.phone || ''); setCMemo(''); setShowContactFor(fId); }} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5">
                                                            <Calendar size={16} /> 상담접수하기
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                        onClick={() => onGoToMyPage ? onGoToMyPage() : onClose?.()}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={16} /> 상담 내역 보기
                    </button>
                </div>
            </div>
        );
    }

    // Step 1: Timing
    if (step === 1) {
        return (
            <div className="space-y-4">
                <QuestionBubble>
                    <strong>1. 현재 어떤 상황이신가요?</strong><br />
                    긴급 상황인지, 미리 알아보시는지 선택해 주시면<br />
                    맞춤 추모시설을 추천해 드립니다.
                </QuestionBubble>

                <div className="pl-10 space-y-2">
                    {MEMORIAL_TIMING_OPTIONS.map(opt => (
                        <OptionButton key={opt.id} selected={timing === opt.id} onClick={() => setTiming(opt.id)}>
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{opt.sub}</div>
                        </OptionButton>
                    ))}
                </div>

                <div className="pl-10 pt-2">
                    <button
                        onClick={handleNext}
                        disabled={!timing}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all disabled:cursor-not-allowed"
                    >
                        다음 단계
                    </button>
                </div>
            </div>
        );
    }

    // Step 2: Location (Text-based, NO GPS)
    if (step === 2) {
        return (
            <div className="space-y-4">
                <QuestionBubble>
                    <strong>2. 원하시는 지역이 있나요?</strong><br />
                    원하시는 도시나 지역(예: 경기 고양, 부천)을 선택해 주시면<br />
                    맞춤 추모시설을 추천해 드립니다.
                </QuestionBubble>

                <div className="pl-10 space-y-2 relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="예: 경기 용인, 서울 강남"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm"
                            aria-label="지역 검색"
                        />
                        <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-[200] w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map((sug, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setLocation(sug);
                                        setShowSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b last:border-b-0"
                                >
                                    <MapPin size={14} className="inline mr-2 text-slate-400" />
                                    {sug}
                                </button>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-slate-500 italic">
                        이전 ← <span className="cursor-pointer hover:underline" onClick={() => setStep(1)}>1단계로 돌아가기</span>
                    </p>
                </div>

                <div className="pl-10 pt-2">
                    <button
                        onClick={handleNext}
                        disabled={!location}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all disabled:cursor-not-allowed"
                    >
                        다음 단계
                    </button>
                </div>
            </div>
        );
    }

    // Step 3: Religion
    if (step === 3) {
        return (
            <div className="space-y-4">
                <QuestionBubble>
                    <strong>3. 종교가 어떻게 되시나요?</strong><br />
                    종교에 따라 적합한 시설을 추천해 드립니다.
                </QuestionBubble>

                <div className="pl-10 space-y-2">
                    {MEMORIAL_RELIGION_OPTIONS.map(opt => (
                        <OptionButton key={opt.id} selected={religion === opt.id} onClick={() => setReligion(opt.id)}>
                            <span className="text-base">{opt.icon}</span> <strong>{opt.label}</strong>
                        </OptionButton>
                    ))}
                </div>

                <div className="pl-10 pt-2">
                    <button
                        onClick={handleNext}
                        disabled={!religion}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all disabled:cursor-not-allowed"
                    >
                        다음 단계
                    </button>
                </div>
            </div>
        );
    }

    // Step 4: Budget
    if (step === 4) {
        return (
            <div className="space-y-4">
                <QuestionBubble>
                    <strong>4. 예상 예산은 어느 정도인가요?</strong><br />
                    예산에 맞는 시설을 추천해 드립니다.
                </QuestionBubble>

                <div className="pl-10 space-y-2">
                    {MEMORIAL_BUDGET_OPTIONS.map(opt => (
                        <OptionButton key={opt.id} selected={budget === opt.id} onClick={() => setBudget(opt.id)}>
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{opt.sub}</div>
                        </OptionButton>
                    ))}
                </div>

                <div className="pl-10 pt-2">
                    <button
                        onClick={handleNext}
                        disabled={!budget}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all disabled:cursor-not-allowed"
                    >
                        다음 단계
                    </button>
                </div>
            </div>
        );
    }

    // Step 5: Lighting
    if (step === 5) {
        return (
            <div className="space-y-4">
                <QuestionBubble>
                    <strong>5. 채광은 어떤 것을 선호하시나요?</strong><br />
                    밝고 따뜻한 분위기 또는 조용하고 차분한 분위기를 선택해 주세요.
                </QuestionBubble>

                <div className="pl-10 space-y-2">
                    {MEMORIAL_LIGHTING_OPTIONS.map(opt => (
                        <OptionButton key={opt.id} selected={lighting === opt.id} onClick={() => setLighting(opt.id)}>
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{opt.sub}</div>
                        </OptionButton>
                    ))}
                </div>

                <div className="pl-10 pt-2">
                    <button
                        onClick={handleNext}
                        disabled={!lighting}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all disabled:cursor-not-allowed"
                    >
                        다음 단계
                    </button>
                </div>
            </div>
        );
    }

    // Step 6: Tier
    if (step === 6) {
        return (
            <div className="space-y-4">
                <QuestionBubble>
                    <strong>6. 단높이는 어느 정도를 원하시나요?</strong><br />
                    접근성과 전망을 고려하여 선택해 주세요.
                </QuestionBubble>

                <div className="pl-10 space-y-2">
                    {MEMORIAL_TIER_OPTIONS.map(opt => (
                        <OptionButton key={opt.id} selected={tier === opt.id} onClick={() => setTier(opt.id)}>
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-xs text-slate-600 mt-0.5">{opt.sub}</div>
                        </OptionButton>
                    ))}
                </div>

                <div className="pl-10 pt-2 flex gap-2">
                    <button
                        onClick={() => setStep(5)}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold py-3 rounded-xl transition-all"
                    >
                        이전
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!tier || isSaving}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                처리 중...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                맞춤 추모시설 찾기
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default MemorialSearchForm;
