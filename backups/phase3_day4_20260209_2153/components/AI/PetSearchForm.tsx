import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, MapPin, Check, Heart, Dog, Cat, Fish, ArrowRight, Phone, Loader2 } from 'lucide-react';
import { createLead, getDistinctRegions, getIntelligentRecommendations } from '../../lib/queries';

interface FormProps {
    userLocation?: { lat: number, lng: number, type: string };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string, data: any }) => void;
    onClose?: () => void;
    initialCategory?: string;
    currentUser?: any;
    onSwitchToFacility?: (facility: any) => void;
}

const PetSearchForm: React.FC<FormProps> = ({
    userLocation,
    onGetCurrentPosition,
    onSubmit,
    initialCategory = 'pet_funeral',
    currentUser,
    onClose,
    onSwitchToFacility
}) => {
    const [step, setStep] = useState(1);
    const [timing, setTiming] = useState<'immediate' | 'prepare' | ''>('');
    const [petType, setPetType] = useState('');
    const [weight, setWeight] = useState('');
    const [region, setRegion] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [error, setError] = useState('');

    // [ADD] State for recommendations
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
    const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
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

        // [ADD] Fetch Recommendations
        setIsSubmitted(true);
        setIsLoadingRecommendations(true);

        try {
            // Use user location GPS if available, otherwise 0,0
            const lat = userLocation?.lat || 0;
            const lng = userLocation?.lng || 0;
            const searchRegion = region || (userLocation?.type === 'gps' ? '' : ''); // Priority to text region

            const results = await getIntelligentRecommendations(lat, lng, 'pet', searchRegion);
            setRecommendedFacilities(results.slice(0, 3));
        } catch (e) {
            console.error("Failed to fetch pet recommendations", e);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    const toggleService = (opt: string) => {
        setServices(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
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
                                    {recommendedFacilities.map((f, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                            onClick={() => {
                                                if (onSwitchToFacility) {
                                                    const targetId = typeof f.id === 'object' ? (f.id as any).id || (f as any).facilityId : f.id;
                                                    onSwitchToFacility({
                                                        ...f,
                                                        id: targetId,
                                                        category: 'pet_funeral'
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
                        <button onClick={() => { onGetCurrentPosition?.(); setRegion(''); setError(''); }} className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${userLocation?.type === 'gps' && !region ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <MapPin size={16} /> 내 위치 주변 (GPS)
                        </button>
                        <div className="relative">
                            <input type="text" value={region} onChange={(e) => { setRegion(e.target.value); setError(''); }} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="예: 경기 김포시, 서울 마포구" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-indigo-600 focus:outline-none" />
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
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
