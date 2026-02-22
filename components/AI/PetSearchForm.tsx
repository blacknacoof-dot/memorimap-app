import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { MapPin, Check, Phone, Loader2, Calendar } from 'lucide-react';
import { getDistinctRegions, getDistinctRegionsFromFacilities, getIntelligentRecommendations } from '../../lib/queries';
import { createAuthenticatedClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';
import { addSearchHistory } from '@/utils/searchHistory';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { ConsultationForm } from '../Consultation/BrandChatHelpers';
import {
    PET_TYPE_OPTIONS,
    PET_WEIGHT_OPTIONS,
    PET_SERVICE_OPTIONS,
} from '@/constants/maumAiConstants';

// Safe Highlighting Component
const SafeHighlight = ({ text, highlight }: { text: string, highlight: string }) => {
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

const REGION_CHIPS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '강원', '제주'];

const PetSearchForm: React.FC<FormProps> = ({
    userLocation,
    onSubmit,
    initialCategory = 'pet_funeral',
    currentUser,
    onClose,
    onGoToMyPage,
    onLoginRequired,
    onSwitchToFacility,
}) => {
    const { session } = useSession();
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form fields
    const [petType, setPetType] = useState('');
    const [petName, setPetName] = useState('');
    const [weight, setWeight] = useState('');
    const [services, setServices] = useState<string[]>([]);
    const [region, setRegion] = useState('');

    // Recommendations
    const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    // Booking state
    const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [consultFacility, setConsultFacility] = useState<{ id: string; name: string; phone?: string } | null>(null);
    const [bookingComplete, setBookingComplete] = useState<{ facilityName: string; petType: string } | null>(null);

    // Autocomplete
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!region || region.length < 2) {
            setSuggestions([]); setShowSuggestions(false); return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            try {
                const [rpcResults, facilityResults] = await Promise.all([
                    getDistinctRegions(region).catch(() => []),
                    getDistinctRegionsFromFacilities(region).catch(() => []),
                ]);
                const merged = Array.from(new Set([...(rpcResults as string[]), ...facilityResults]));
                const uniqueResults = merged.slice(0, 8);
                setSuggestions(uniqueResults);
                setShowSuggestions(uniqueResults.length > 0);
            } catch (e) { console.error(e); }
        }, 300);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [region]);

    const canSubmit = petType && weight && region;

    const toggleService = (id: string) => {
        setServices(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        const searchData = {
            category: initialCategory,
            petType,
            petName,
            weight,
            services,
            location: {
                type: userLocation?.type === 'gps' && !region ? 'gps' : 'text',
                lat: userLocation?.lat,
                lng: userLocation?.lng,
                text: region || '내 위치 주변'
            },
        };

        const petLabel = PET_TYPE_OPTIONS.find(o => o.id === petType)?.label || '미선택';
        const weightLabel = PET_WEIGHT_OPTIONS.find(o => o.id === weight)?.label || '';
        const serviceLabels = services.map(s => PET_SERVICE_OPTIONS.find(o => o.id === s)?.label).filter(Boolean).join(', ');

        const finalText = [
            `[반려동물 장례]`,
            `아이: ${petLabel}${petName ? ` (${petName})` : ''}`,
            `몸무게: ${weightLabel}`,
            serviceLabels ? `서비스: ${serviceLabels}` : '',
            `지역: ${region || '내 위치 주변'}`,
        ].filter(Boolean).join('\n');

        onSubmit({ text: finalText, data: searchData });
        setIsSubmitted(true);
        addSearchHistory(region || '내 위치 주변', 'pet');

        // Fetch recommendations
        setIsLoadingRecommendations(true);
        try {
            const lat = userLocation?.lat || 0;
            const lng = userLocation?.lng || 0;
            const results = await getIntelligentRecommendations(lat, lng, 'pet', region);
            setRecommendedFacilities(results.slice(0, 5));
        } catch (e) {
            console.error("Failed to fetch pet recommendations", e);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    // Handle ConsultationForm submit
    const handleConsultSubmit = async (data: any) => {
        if (!consultFacility) return;
        setBookingId(consultFacility.id);

        const petLabel = PET_TYPE_OPTIONS.find(o => o.id === petType)?.label || '미선택';
        const weightLabel = PET_WEIGHT_OPTIONS.find(o => o.id === weight)?.label || '';
        const serviceLabels = services.map(s => PET_SERVICE_OPTIONS.find(o => o.id === s)?.label).filter(Boolean).join(', ');
        const notes = [
            `[AI 마음이 반려동물 장례 바로 예약 접수]`,
            `시설: ${consultFacility.name}`,
            `아이: ${petLabel}${petName ? ` (${petName})` : ''}`,
            `몸무게: ${weightLabel}`,
            serviceLabels ? `서비스: ${serviceLabels}` : '',
            `지역: ${region || '내 위치 주변'}`,
            data.petName ? `이름: ${data.petName}` : '',
            data.requests ? `요청: ${data.requests}` : '',
        ].filter(Boolean).join(', ');

        try {
            const token = await session?.getToken({ template: 'supabase' });
            if (!token) throw new Error('인증 토큰 없음');
            const authClient = createAuthenticatedClient(token);

            // 카테고리별 1건 제한: 기존 반려동물 예약 체크
            const { data: existingRes } = await authClient
                .from('reservations')
                .select('id, facility_id')
                .eq('user_id', currentUser?.id)
                .eq('purpose', 'pet')
                .in('status', ['pending', 'urgent'])
                .limit(1);
            if (existingRes && existingRes.length > 0) {
                const willReplace = await confirmAsync('이미 접수된 동물장례 예약이 있습니다.\n새 시설로 변경하시겠습니까? (기존 예약은 자동 취소됩니다)');
                if (!willReplace) { setBookingId(null); setConsultFacility(null); return; }
                await authClient.from('reservations')
                    .update({ status: 'cancelled' })
                    .eq('id', existingRes[0].id);
            }

            // 상수 ID → 실제 facilities UUID 매핑
            let actualFacilityId = consultFacility.id;
            const { data: facilityRow } = await authClient
                .from('facilities')
                .select('id')
                .eq('name', consultFacility.name)
                .limit(1)
                .single();
            if (facilityRow) {
                actualFacilityId = facilityRow.id;
            }

            const { error } = await authClient.from('reservations').insert({
                facility_id: actualFacilityId,
                facility_name: consultFacility.name,
                user_id: currentUser?.id,
                visitor_name: data.name || currentUser?.name || '',
                contact_number: '',
                visit_date: new Date().toISOString(),
                time_slot: '긴급(즉시)',
                visitor_count: 1,
                purpose: 'pet',
                special_requests: notes,
                status: 'urgent',
                payment_amount: 0,
            });
            if (error) throw error;
            setBookedIds(prev => new Set(prev).add(consultFacility.id));
            setBookingComplete({ facilityName: consultFacility.name, petType: petLabel });
        } catch (e) {
            console.error('상담접수 실패:', e);
            toast.error('접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setBookingId(null);
            setConsultFacility(null);
        }
    };

    // Login required
    if (!currentUser) {
        return (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-bold mb-2">로그인이 필요합니다</p>
                <p className="text-xs text-amber-700 mb-3">상담 접수를 위해 로그인해 주세요.</p>
                <button onClick={() => onLoginRequired?.()} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl">
                    로그인하기
                </button>
            </div>
        );
    }

    // Results view
    if (isSubmitted) {
        // Booking complete confirmation
        if (bookingComplete) {
            return (
                <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
                        <Check className="text-green-500 mx-auto" size={40} />
                        <p className="text-lg font-bold text-green-700">바로 예약 되었습니다</p>
                        <p className="text-sm text-slate-600 font-semibold">{bookingComplete.facilityName}</p>
                        <p className="text-xs text-slate-500">
                            반려동물: {bookingComplete.petType}
                        </p>
                        <p className="text-xs text-slate-400">담당자가 곧 연락드립니다.</p>
                        <p className="text-xs text-slate-400">접수 내역은 마이페이지에서 확인하실 수 있습니다.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onGoToMyPage ? onGoToMyPage() : onClose?.()} className="flex-1 bg-slate-900 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            상담 내역 보기
                        </button>
                        <button onClick={() => setBookingComplete(null)} className="flex-1 bg-slate-100 text-slate-700 text-sm font-bold py-3 rounded-xl">
                            닫기
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                {/* ConsultationForm modal overlay */}
                {consultFacility && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto">
                            <ConsultationForm
                                company={{
                                    id: `pet_${consultFacility.id}`,
                                    name: consultFacility.name,
                                    rating: 0,
                                    reviewCount: 0,
                                    imageUrl: '',
                                    description: '',
                                    features: [],
                                    phone: consultFacility.phone || '',
                                    priceRange: '',
                                    benefits: [],
                                }}
                                mode="phone"
                                onClose={() => setConsultFacility(null)}
                                onSubmit={handleConsultSubmit}
                            />
                        </div>
                    </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-sm text-green-700 font-bold"><Check size={14} className="inline mr-1" />접수 완료 — <strong>{region}</strong> 지역 추천 시설</p>
                </div>

                {isLoadingRecommendations ? (
                    <div className="flex flex-col items-center py-6 space-y-2 bg-white border border-slate-200 rounded-xl">
                        <Loader2 className="animate-spin text-orange-500" size={28} />
                        <span className="text-xs text-slate-500">맞춤 시설을 찾고 있습니다...</span>
                    </div>
                ) : recommendedFacilities.length > 0 ? (
                    <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                        {recommendedFacilities.map((f, idx) => {
                            const fId = String(typeof f.id === 'object' ? (f.id as any).id || (f as any).facilityId : f.id);
                            const isBooked = bookedIds.has(fId);

                            const imgUrl = f.image_url || f.imageUrl || (f.images?.length > 0 ? f.images[0] : null);
                            return (
                                <div key={fId} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                    <div className="flex gap-3">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={f.name} className="w-[60px] h-[60px] rounded-lg object-cover shrink-0 bg-slate-100" />
                                        ) : (
                                            <div className="w-[60px] h-[60px] rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 text-lg">🐾</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <button onClick={() => onSwitchToFacility?.({ id: f.id, name: f.name, address: f.address, phone: f.phone })} className="font-bold text-sm text-orange-700 hover:underline truncate text-left">{f.name}</button>
                                                <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1">추천 {idx + 1}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate"><MapPin size={11} className="shrink-0" /> {f.address || f.jibun_address || '주소 없음'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={11} className="shrink-0" /> {f.phone || '연락처 없음'}</div>
                                        </div>
                                    </div>

                                    {isBooked ? (
                                        <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1">
                                            <Check size={14} /> 접수 완료
                                        </div>
                                    ) : (
                                        <button onClick={() => setConsultFacility({ id: fId, name: f.name, phone: f.phone })} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1">
                                            <Calendar size={14} /> 바로 예약 접수
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-slate-600">추천 가능한 시설이 없습니다.</p>
                    </div>
                )}

                <button onClick={() => onGoToMyPage ? onGoToMyPage() : onClose?.()} className="w-full bg-slate-900 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <Check size={16} /> 상담 내역 보기
                </button>
            </div>
        );
    }

    // Single-screen form
    return (
        <div className="mt-3 bg-orange-50/50 border border-orange-100 rounded-xl p-4 space-y-4 animate-in fade-in duration-300">
            {/* Section 1: Pet Type */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">🐾 아이 종류</label>
                <div className="flex gap-2">
                    {PET_TYPE_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setPetType(petType === opt.id ? '' : opt.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] md:min-h-0 rounded-lg text-xs font-bold border transition-all ${petType === opt.id
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 2: Pet Name */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">💕 아이 이름 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input
                    type="text" value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="예: 초코, 나비"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                />
            </div>

            {/* Section 3: Weight */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">⚖️ 몸무게</label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PET_WEIGHT_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setWeight(weight === opt.id ? '' : opt.id)}
                            className={`px-3 py-2 min-h-[44px] md:min-h-0 rounded-lg text-xs font-bold border transition-all text-left ${weight === opt.id
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                            {opt.label} <span className={`font-normal ${weight === opt.id ? 'text-orange-100' : 'text-slate-400'}`}>({opt.sub})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 4: Services (multi-select) */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">🛎️ 필요 서비스 <span className="text-slate-400 font-normal">(선택, 복수 가능)</span></label>
                <div className="flex flex-wrap gap-1.5">
                    {PET_SERVICE_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => toggleService(opt.id)}
                            className={`px-3 py-2 min-h-[44px] md:min-h-0 rounded-lg text-xs font-bold border transition-all ${services.includes(opt.id)
                                ? 'bg-orange-100 border-orange-400 text-orange-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 5: Region */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">📍 희망 지역</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {REGION_CHIPS.map(reg => (
                        <button key={reg} onClick={() => { setRegion(reg); setShowSuggestions(false); }}
                            className={`px-3 py-2 rounded-full text-xs font-bold border transition-all min-h-[44px] md:min-h-[36px] ${region === reg
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-orange-300'}`}>
                            {reg}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <input
                        type="text" value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="또는 직접 입력 (예: 일산, 강남구)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                    />
                    {showSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[200] max-h-36 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => { setRegion(s); setShowSuggestions(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none">
                                    <SafeHighlight text={s} highlight={region} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
                <Check size={16} /> 맞춤 동물장례식장 찾기
            </button>
        </div>
    );
};

export default PetSearchForm;
