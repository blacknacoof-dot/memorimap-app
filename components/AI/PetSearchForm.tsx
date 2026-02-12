import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, MapPin, Check, Heart, Dog, Cat, Fish, ArrowRight, Phone, Loader2, Calendar } from 'lucide-react';
import { createLead, getDistinctRegions, getIntelligentRecommendations } from '../../lib/queries';
import { createAuthenticatedClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';
import { addSearchHistory } from '@/utils/searchHistory';

interface FormProps {
    userLocation?: { lat: number, lng: number, type: string };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string, data: any }) => void;
    onClose?: () => void;
    onGoToMyPage?: () => void;
    onLoginRequired?: () => void;
    initialCategory?: string;
    currentUser?: any;
    onSwitchToFacility?: (facility: any, context?: any) => void;
}

const PetSearchForm: React.FC<FormProps> = ({
    userLocation,
    onGetCurrentPosition,
    onSubmit,
    initialCategory = 'pet_funeral',
    currentUser,
    onClose,
    onGoToMyPage,
    onLoginRequired,
    onSwitchToFacility
}) => {
    const { session } = useSession();
    const [step, setStep] = useState(1);
    const [timing, setTiming] = useState<'immediate' | 'prepare' | ''>('');
    const [petType, setPetType] = useState('');
    const [weight, setWeight] = useState('');
    const [region, setRegion] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [gpsError, setGpsError] = useState('');

    // State for recommendations
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
    const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);

    // 인라인 상담접수 상태
    const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [showContactFor, setShowContactFor] = useState<string | null>(null);
    const [cName, setCName] = useState(currentUser?.name || '');
    const [cPhone, setCPhone] = useState(currentUser?.phone || '');
    const [cMemo, setCMemo] = useState('');

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const TIMING_OPTIONS = [
        { id: 'immediate', label: '🚨 지금 떠났어요 (긴급)', sub: '화장 후 바로 안치 필요' },
        { id: 'prepare', label: '📅 미리 알아보고 있어요', sub: '사전 답사 및 가격 비교' }
    ];

    const PACK_TYPE_OPTIONS = [
        { id: 'dog', label: '강아지', icon: <Dog size={20} /> },
        { id: 'cat', label: '고양이', icon: <Cat size={20} /> },
        { id: 'small', label: '소동물', icon: <Fish size={20} /> } // rabbit/hamster etc
    ];

    const WEIGHT_OPTIONS = [
        { id: 'under_5', label: '5kg 미만' },
        { id: '5_15', label: '5~15kg' },
        { id: 'over_15', label: '15kg 이상' }
    ];

    const SERVICE_OPTIONS = ['🚗 픽업/운구', '💎 메모리얼 스톤', '👘 수의/관 준비', '🕒 24시간 운영', '📸 장례 촬영'];

    useEffect(() => {
        if (!region || region.length < 2) {
            setSuggestions([]); setShowSuggestions(false); return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            try {
                // Using the same RPC, maybe specific to pet later?
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
        if (step === 2 && (!petType || !weight)) return setError('아이의 정보를 모두 선택해 주세요.');
        if (step === 3) {
            if (!region && userLocation?.type !== 'gps') return setError('지역을 입력하거나 내 위치를 사용해 주세요.');
            // Optional: Check if region exists
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        const searchData = {
            category: initialCategory,
            urgency: timing,
            petType,
            weight,
            location: {
                type: userLocation?.type === 'gps' && !region ? 'gps' : 'text',
                lat: userLocation?.lat,
                lng: userLocation?.lng,
                text: region || '내 위치 주변'
            },
            services,
            priorities: services
        };

        const petLabel = PACK_TYPE_OPTIONS.find(o => o.id === petType)?.label;
        const weightLabel = WEIGHT_OPTIONS.find(o => o.id === weight)?.label;
        const timingLabel = TIMING_OPTIONS.find(o => o.id === timing)?.label;

        const finalText = `[🐾 반려동물 장례 상담]\n상황: ${timingLabel}\n아이: ${petLabel} (${weightLabel})\n지역: ${region || '내 위치 주변'}\n추가 요청: ${services.join(', ') || '없음'}`;

        onSubmit({ text: finalText, data: searchData });

        // Fetch Recommendations
        setIsSubmitted(true);
        addSearchHistory(region || '내 위치 주변', 'pet');
        setIsLoadingRecommendations(true);

        try {
            // Use user location GPS if available, otherwise 0,0
            const lat = userLocation?.lat || 0;
            const lng = userLocation?.lng || 0;
            const searchRegion = region || (userLocation?.type === 'gps' ? '' : ''); // Priority to text region

            const results = await getIntelligentRecommendations(lat, lng, 'pet', searchRegion);
            setRecommendedFacilities(results.slice(0, 5));
        } catch (e) {
            console.error("Failed to fetch pet recommendations", e);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    const toggleService = (opt: string) => {
        setServices(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

    // 인라인 상담접수 제출
    const doBooking = async (fId: string, fName: string) => {
        if (!cName.trim() || !cPhone.trim()) return;
        setBookingId(fId);

        const petLabel = PACK_TYPE_OPTIONS.find(o => o.id === petType)?.label;
        const weightLabel = WEIGHT_OPTIONS.find(o => o.id === weight)?.label;
        const notes = [
            `[AI 마음이 반려동물 장례 추천 접수]`,
            `시설: ${fName}`,
            `상황: ${TIMING_OPTIONS.find(o => o.id === timing)?.label}`,
            `아이: ${petLabel} (${weightLabel})`,
            `지역: ${region || '내 위치 주변'}`,
            `서비스: ${services.join(', ') || '없음'}`,
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

    // Helper Components
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

    const SelectButton = ({ selected, onClick, label, icon, sub }: any) => (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-xl border transition-all mb-2 flex items-center gap-3 ${selected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
        >
            {icon && <div className="text-xl">{icon}</div>}
            <div>
                <div className="font-bold text-sm">{label}</div>
                {sub && <div className={`text-xs mt-0.5 ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</div>}
            </div>
        </button>
    );

    // [ADD] Render Success / Recommendations View
    if (isSubmitted) {
        return (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <QuestionBubble>
                    ✅ <strong>상담 접수 완료!</strong><br />
                    아이가 편안히 쉴 수 있는<br />
                    <strong>추천 반려동물 장례식장</strong>을 안내해 드립니다.
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
                                                        <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">추천 {idx + 1}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {f.address || f.jibun_address || '주소 정보 없음'}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={12} /> {f.phone || '연락처 정보 없음'}</div>

                                                    {isBooked ? (
                                                        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                                                            <Check size={16} /> 접수 완료
                                                        </div>
                                                    ) : isThisOpen ? (
                                                        <div className="space-y-2 border-t border-slate-100 pt-3">
                                                            <input type="text" value={cName} onChange={e => setCName(e.target.value)} placeholder="성함 *" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                                                            <input type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="연락처 * (010-1234-5678)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                                                            <input type="text" value={cMemo} onChange={e => setCMemo(e.target.value)} placeholder="요청사항 (선택)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => setShowContactFor(null)} className="flex-1 bg-slate-100 text-slate-600 text-sm font-bold py-2.5 rounded-xl">취소</button>
                                                                <button type="button" onClick={() => doBooking(fId, f.name)} disabled={!cName.trim() || !cPhone.trim() || !!bookingId} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                                                                    {isThisBooking ? <><Loader2 size={16} className="animate-spin" /> 접수 중...</> : <><Check size={16} /> 접수하기</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button type="button" onClick={() => { setCName(currentUser?.name || ''); setCPhone(currentUser?.phone || ''); setCMemo(''); setShowContactFor(fId); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5">
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
                                        선택하신 지역({region})에 등록된 시설이 없거나<br />
                                        운영 중인 시설을 찾지 못했습니다.
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

    return (
        <div className="space-y-3 w-full">
            {/* Progress Bar (simplified) */}
            <div className="flex gap-1 mb-2 px-1">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                ))}
            </div>

            {/* Step 1: Urgency */}
            {step === 1 && (
                <>
                    <QuestionBubble>
                        <strong>아이가 무지개다리를 건넜나요?</strong><br />
                        보호자님의 상황에 맞춰 안내해 드리겠습니다.
                    </QuestionBubble>
                    <div className="pl-10">
                        {TIMING_OPTIONS.map(opt => (
                            <SelectButton
                                key={opt.id}
                                selected={timing === opt.id}
                                onClick={() => { setTiming(opt.id as any); setError(''); }}
                                label={opt.label}
                                sub={opt.sub}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Step 2: Pet Info */}
            {step === 2 && (
                <>
                    <QuestionBubble>
                        <strong>아이의 정보</strong>를 알려주세요.<br />
                        종류와 몸무게에 따라 장례 절차와 비용이 달라집니다.
                    </QuestionBubble>
                    <div className="pl-10 space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {PACK_TYPE_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPetType(opt.id)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${petType === opt.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'
                                        }`}
                                >
                                    {opt.icon}
                                    <span className="text-xs font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {petType && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs font-bold text-slate-500">몸무게</p>
                                <div className="flex gap-2">
                                    {WEIGHT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setWeight(opt.id)}
                                            className={`flex-1 py-2 text-xs rounded-lg border transition-all ${weight === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
                <>
                    <QuestionBubble>
                        어느 <strong>지역</strong>의 장례식장을 찾으시나요?
                    </QuestionBubble>
                    <div className="pl-10 space-y-2">
                        <button onClick={() => {
                            setGpsError('');
                            if (!navigator.geolocation) {
                                setGpsError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
                                return;
                            }
                            navigator.geolocation.getCurrentPosition(
                                () => { onGetCurrentPosition?.(); setRegion(''); setError(''); },
                                (err) => {
                                    if (err.code === 1) setGpsError('위치 권한이 거부되었습니다. 아래에서 지역을 직접 입력해주세요.');
                                    else setGpsError('위치를 가져올 수 없습니다. 지역을 직접 입력해주세요.');
                                },
                                { timeout: 10000 }
                            );
                        }} className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${userLocation?.type === 'gps' && !region ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <MapPin size={16} /> 내 위치 주변 (GPS)
                        </button>
                        {gpsError && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{gpsError}</p>}
                        <div className="relative">
                            <input type="text" value={region} onChange={(e) => { setRegion(e.target.value); setError(''); }} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onCompositionStart={() => setIsComposing(true)} onCompositionEnd={() => setIsComposing(false)} placeholder="예: 경기 김포시, 서울 마포구" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-indigo-600 focus:outline-none" aria-label="지역 검색" />
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[200] max-h-48 overflow-y-auto">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => { setRegion(s); setShowSuggestions(false); setError(''); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Step 4: Services */}
            {step === 4 && (
                <>
                    <QuestionBubble>
                        특별히 <strong>필요하신 서비스</strong>가 있나요? (중복 선택 가능)
                    </QuestionBubble>
                    <div className="pl-10">
                        <div className="flex flex-wrap gap-2">
                            {SERVICE_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => toggleService(opt)} className={`py-2 px-3 text-xs rounded-full border transition-all ${services.includes(opt) ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {error && <div className="pl-10 mt-2 flex items-center gap-1.5 text-red-500 text-[10px] animate-pulse"><AlertCircle size={10} /><span>{error}</span></div>}

            <div className="pl-10 pt-2 flex gap-2">
                {step > 1 && <button onClick={() => setStep(prev => prev - 1)} className="px-3 py-3 text-slate-500 text-xs hover:bg-slate-100 rounded-xl border border-slate-200 transition">이전</button>}
                <button
                    onClick={step === 4 ? handleSubmit : handleNext}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                >
                    {step === 4 ? <><Check size={16} /> 펫 장례식장 찾기</> : '다음'}
                </button>
            </div>
        </div>
    );
};

export default PetSearchForm;
