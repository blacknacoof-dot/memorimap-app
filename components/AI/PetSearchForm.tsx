import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, MapPin, Check, Heart, Dog, Cat, Fish, Phone, Loader2, ChevronDown } from 'lucide-react';
import { createLead, getDistinctRegions, searchFacilitiesByRegion } from '../../lib/queries';

interface FormProps {
    userLocation?: { lat: number, lng: number, type: string };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string, data: any }) => void;
    onClose?: () => void;
    onLoginRequired?: () => void;
    initialCategory?: string;
    facilityId?: string;
    facilityName?: string;
    currentUser?: any;
    onSwitchToFacility?: (facility: any) => void;
}

const PetSearchForm: React.FC<FormProps> = ({
    userLocation,
    onGetCurrentPosition,
    onSubmit,
    onClose,
    onLoginRequired,
    initialCategory = 'pet_funeral',
    facilityId,
    facilityName,
    currentUser,
    onSwitchToFacility
}) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    const [petType, setPetType] = useState('');
    const [weight, setWeight] = useState('');
    const [region, setRegion] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [error, setError] = useState('');

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
        if (step === 1 && !region) return setError('지역을 입력해 주세요.');
        if (step === 2 && (!petType || !weight)) return setError('아이의 정보를 모두 선택해 주세요.');
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setIsSaving(true);

        const searchData = {
            category: initialCategory,
            petType,
            weight,
            location: {
                type: 'text',
                text: region
            },
            services,
            priorities: services,
            notes: `접수시설: ${facilityName || '미지정'}`
        };

        const petLabel = PACK_TYPE_OPTIONS.find(o => o.id === petType)?.label;
        const weightLabel = WEIGHT_OPTIONS.find(o => o.id === weight)?.label;

        const finalText = `[🐾 반려동물 장례 찾기]\n` +
            `| 구분 | 선택 내용 |\n` +
            `|---|---|\n` +
            `| 아이 | ${petLabel} (${weightLabel}) |\n` +
            `| 지역 | ${region} |\n` +
            `| 서비스 | ${services.join(', ') || '없음'} |`;

        onSubmit({ text: finalText, data: searchData });
        setIsSaving(false);
        setIsSubmitted(true);

        // For facility-specific consultations, save directly to DB
        if (facilityId && currentUser) {
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_ANON_KEY
                );

                const consultationData = {
                    user_id: currentUser.id,
                    facility_id: facilityId,
                    user_name: currentUser.firstName || 'Unknown',
                    user_phone: currentUser.phoneNumbers?.[0]?.phoneNumber || 'N/A',
                    status: 'pending',
                    notes: finalText
                };

                const { error: dbError } = await supabase
                    .from('consultations')
                    .insert([consultationData]);

                if (dbError) {
                    console.error('[PetSearchForm] Failed to save consultation:', dbError);
                } else {
                    console.log('[PetSearchForm] Consultation saved successfully to facility:', facilityId);
                }
            } catch (e) {
                console.error('[PetSearchForm] Exception saving consultation:', e);
            }
        }

        // Fetch recommendations
        setIsLoadingRecommendations(true);
        try {
            const { getIntelligentRecommendations } = await import('@/lib/queries');
            if (facilityId && facilityName) {
                setRecommendedFacilities([{
                    id: facilityId,
                    name: facilityName,
                    address: '현재 상담 중인 시설',
                    phone: '010-0000-0000'
                }]);
            } else {
                const recs = await getIntelligentRecommendations(0, 0, 'pet_funeral', region);
                setRecommendedFacilities(recs.slice(0, 3));
            }
        } catch (e) {
            console.error("Failed to fetch recommendations", e);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    const toggleService = (opt: string) => {
        setServices(prev => prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]);
    };

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
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                                <Check size={18} className="text-indigo-600" />
                                접수 내역
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">시설명</span>
                                    <span className="font-bold text-slate-900">{facilityName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">아이</span>
                                    <span className="font-medium text-slate-800">{PACK_TYPE_OPTIONS.find(o => o.id === petType)?.label} ({WEIGHT_OPTIONS.find(o => o.id === weight)?.label})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">지역</span>
                                    <span className="font-medium text-slate-800">{region}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-indigo-200">
                                <p className="text-[10px] text-slate-500 text-center">
                                    💼 시설 대시보드 및 마이페이지에서 확인 가능합니다
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pl-10 pt-2">
                        <button
                            onClick={onClose}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3.5 rounded-xl shadow-lg transition-all"
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
                    입력하신 정보(<strong>{region}</strong>)를 바탕으로 엄선한<br />
                    추천 반려동물 장례식장을 안내해 드립니다.
                </QuestionBubble>

                <div className="pl-10">
                    {isLoadingRecommendations ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-white border border-slate-200 rounded-xl">
                            <Heart className="animate-pulse text-indigo-600" size={32} />
                            <span className="text-xs text-slate-500 font-medium">맞춤 시설을 찾고 있습니다...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recommendedFacilities.length > 0 ? (
                                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
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
        <div className="space-y-3 w-full">
            {/* Progress Bar - 3 steps */}
            <div className="flex gap-1 mb-2 px-1">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                ))}
            </div>

            {/* Step 1: Location (NO GPS) */}
            {step === 1 && (
                <>
                    <QuestionBubble>
                        어느 <strong>지역</strong>의 반려동물 장례식장을 찾으시나요?<br />
                        도시나 동 이름을 입력해 주세요.
                    </QuestionBubble>
                    <div className="pl-10 space-y-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => { setRegion(e.target.value); setError(''); }}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="예: 경기 김포시, 서울 마포구"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-indigo-600 focus:outline-none"
                            />
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setRegion(s); setShowSuggestions(false); setError(''); }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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

            {/* Step 3: Services */}
            {step === 3 && (
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
                    onClick={step === 3 ? handleSubmit : handleNext}
                    disabled={isSaving}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                >
                    {step === 3 ? <><Check size={16} /> 펫 장례식장 찾기</> : '다음'}
                </button>
            </div>
        </div>
    );
};

export default PetSearchForm;
