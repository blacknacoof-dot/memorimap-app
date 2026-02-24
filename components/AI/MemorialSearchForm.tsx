import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import {
    MapPin,
    Check,
    Phone,
    Loader2,
    Calendar
} from 'lucide-react';
import { getDistinctRegions, getDistinctRegionsFromFacilities, getIntelligentRecommendations } from '@/lib/queries';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';
import {
    MEMORIAL_TIMING_OPTIONS,
    MEMORIAL_RELIGION_OPTIONS,
    MEMORIAL_BUDGET_OPTIONS
} from '@/constants/maumAiConstants';
import { addSearchHistory } from '@/utils/searchHistory';
import { ConsultationForm } from '../Consultation/BrandChatHelpers';
// BookingPreStep 제거 — 바로 긴급 출동 접수 모달로 진입

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
    userLocation?: { lat: number; lng: number };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string; data: Record<string, unknown> }) => void;
    onClose?: () => void;
    onGoToMyPage?: () => void;
    onLoginRequired?: () => void;
    initialCategory?: string;
    facilityId?: string;
    facilityName?: string;
    currentUser?: { id: string; name?: string; firstName?: string; phone?: string } | null;
    onSwitchToFacility?: (facility: { id: string; name: string; address?: string; phone?: string }, context?: Record<string, unknown>) => void;
}

const REGION_CHIPS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '제주'];

const MemorialSearchForm: React.FC<FormProps> = ({
    onSubmit,
    onClose,
    onGoToMyPage,
    onLoginRequired,
    initialCategory = 'memorial',
    facilityId,
    facilityName,
    currentUser,
    onSwitchToFacility,
}) => {
    const { session } = useSession();
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form fields (single screen)
    const [timing, setTiming] = useState('');
    const [location, setLocation] = useState('');
    const [religion, setReligion] = useState('');
    const [budget, setBudget] = useState('');

    // Recommendations
    const [recommendedFacilities, setRecommendedFacilities] = useState<Array<{ id: string; name: string; address?: string; jibun_address?: string; phone?: string; image_url?: string; imageUrl?: string; images?: string[] }>>([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    // Booking state
    const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [consultFacility, setConsultFacility] = useState<{ id: string; name: string; phone?: string } | null>(null);
    // preStepData 제거 — 바로 ConsultationForm 진입
    const [bookingComplete, setBookingComplete] = useState<{ facilityName: string; scale: string; religion: string } | null>(null);

    // Autocomplete
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (facilityName && !location) setLocation(facilityName);
    }, [facilityName]);

    useEffect(() => {
        if (!location || location.length < 2) {
            setSuggestions([]); setShowSuggestions(false); return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            try {
                // RPC(memorial_spaces) + facilities 테이블 병합 조회
                const [rpcResults, facilityResults] = await Promise.all([
                    getDistinctRegions(location).catch(() => []),
                    getDistinctRegionsFromFacilities(location).catch(() => []),
                ]);
                const merged = Array.from(new Set([...(rpcResults as string[]), ...facilityResults]));
                const uniqueResults = merged.slice(0, 8);
                setSuggestions(uniqueResults);
                setShowSuggestions(uniqueResults.length > 0);
            } catch (e) { console.error(e); }
        }, 300);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [location]);

    const canSubmit = timing && location;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSaving(true);

        const searchData = {
            category: initialCategory,
            timing,
            location: { type: 'text', text: location },
            religion,
            budget,
        };

        const timingLabel = MEMORIAL_TIMING_OPTIONS.find(o => o.id === timing)?.label || timing;
        const religionLabel = MEMORIAL_RELIGION_OPTIONS.find(o => o.id === religion)?.label || '미선택';
        const budgetLabel = MEMORIAL_BUDGET_OPTIONS.find(o => o.id === budget)?.label || '미선택';

        const finalText = `[추모시설 찾기]\n| 구분 | 선택 |\n|---|---|\n| 상황 | ${timingLabel} |\n| 지역 | ${location} |\n| 종교 | ${religionLabel} |\n| 예산 | ${budgetLabel} |`;

        setIsSaving(false);
        setIsSubmitted(true);
        addSearchHistory(location, 'memorial');
        onSubmit({ text: finalText, data: searchData });

        // Save to DB for facility-specific
        if (facilityId && currentUser) {
            try {
                const authClient = await getAuthClient(session, { strict: true });

                // 카테고리별 1건 제한: 기존 추모시설 예약 체크
                const { data: existingRes } = await authClient
                    .from('reservations')
                    .select('id, facility_id')
                    .eq('user_id', currentUser.id)
                    .eq('purpose', 'memorial')
                    .in('status', ['pending', 'urgent'])
                    .limit(1);
                if (existingRes && existingRes.length > 0) {
                    const willReplace = await confirmAsync('이미 접수된 추모시설 예약이 있습니다.\n새 시설로 변경하시겠습니까? (기존 예약은 자동 취소됩니다)');
                    if (!willReplace) return;
                    await authClient.from('reservations')
                        .update({ status: 'cancelled' })
                        .eq('id', existingRes[0].id);
                }

                await authClient.from('reservations').insert({
                    facility_id: facilityId,
                    facility_name: facilityName || '',
                    user_id: currentUser.id,
                    visitor_name: currentUser.firstName || 'Unknown',
                    contact_number: '',
                    visit_date: new Date().toISOString(),
                    time_slot: '상담예약',
                    visitor_count: 1,
                    purpose: 'memorial',
                    special_requests: `시설: ${facilityName || ''}\n${finalText}`,
                    status: 'waiting',
                    payment_amount: 0,
                });
            } catch (e) {
                console.error('[MemorialSearchForm] Exception saving:', e);
            }
        }

        // Fetch recommendations
        setIsLoadingRecommendations(true);
        try {
            if (facilityId && facilityName) {
                setRecommendedFacilities([{
                    id: facilityId, name: facilityName,
                    address: '현재 상담 중인 시설', phone: '010-0000-0000'
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

    // Handle ConsultationForm submit
    const handleConsultSubmit = async (data: Record<string, unknown>) => {
        if (!consultFacility) return;
        setBookingId(consultFacility.id);

        const religionVal = (data.religion as string) || MEMORIAL_RELIGION_OPTIONS.find(o => o.id === religion)?.label || '미선택';
        const memorialType = (data.memorialType as string) || '미선택';
        const urnCount = data.urnCount || '1기';

        const notes = [
            `[AI 마음이 추모시설 상담 접수]`,
            `시설: ${consultFacility.name}`,
            `고인: ${data.deceasedName || '미입력'} (${data.deceasedGender || ''})`,
            data.deathDate ? `사망일: ${data.deathDate}` : '',
            `안치유형: ${memorialType}`,
            `유골함: ${urnCount}`,
            `지역: ${location}`,
            `종교: ${religionVal}`,
            `예산: ${data.memorialBudget || MEMORIAL_BUDGET_OPTIONS.find(o => o.id === budget)?.label || '미선택'}`,
            data.visitDate ? `희망방문일: ${data.visitDate}` : '',
            data.requests ? `요청: ${data.requests}` : '',
        ].filter(Boolean).join(', ');

        try {
            const authClient = await getAuthClient(session, { strict: true });

            // 카테고리별 1건 제한: 추모시설 기존 예약 체크
            const { data: existingRes } = await authClient
                .from('reservations')
                .select('id, facility_id')
                .eq('user_id', currentUser?.id)
                .eq('purpose', 'memorial')
                .in('status', ['pending', 'urgent'])
                .limit(1);
            if (existingRes && existingRes.length > 0) {
                const willReplace = await confirmAsync('이미 접수된 추모시설 예약이 있습니다.\n새 시설로 변경하시겠습니까? (기존 예약은 자동 취소됩니다)');
                if (!willReplace) return;
                await authClient.from('reservations')
                    .update({ status: 'cancelled' })
                    .eq('id', existingRes[0].id);
            }

            const { error } = await authClient.from('reservations').insert({
                facility_id: consultFacility.id,
                facility_name: consultFacility.name,
                user_id: currentUser?.id,
                visitor_name: data.name || currentUser?.name || '',
                contact_number: '',
                visit_date: new Date().toISOString(),
                time_slot: '상담예약',
                visitor_count: 1,
                purpose: 'memorial',
                special_requests: notes,
                status: 'waiting',
                payment_amount: 0,
            });
            if (error) throw error;
            setBookedIds(prev => new Set(prev).add(consultFacility.id));
            setBookingComplete({ facilityName: consultFacility.name, scale: memorialType, religion: religionVal });
        } catch (e) {
            console.error('상담접수 실패:', e);
            toast.error('접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setBookingId(null);
            setConsultFacility(null);
        }
    };

    // Login required
    if (!currentUser && onLoginRequired) {
        return (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-bold mb-2">로그인이 필요합니다</p>
                <p className="text-xs text-amber-700 mb-3">상담 접수를 위해 로그인해 주세요.</p>
                <button onClick={() => onLoginRequired?.()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl">
                    로그인하기
                </button>
            </div>
        );
    }

    // Results view
    if (isSubmitted) {
        // Facility-specific completion
        if (facilityId && facilityName) {
            return (
                <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-sm text-green-700 font-bold"><Check size={14} className="inline mr-1" /><strong>{facilityName}</strong> 상담 접수 완료</p>
                    </div>
                    <button onClick={onClose} className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl">확인</button>
                </div>
            );
        }

        // Booking complete confirmation
        if (bookingComplete) {
            return (
                <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
                        <Check className="text-green-500 mx-auto" size={40} />
                        <p className="text-lg font-bold text-green-700">상담 접수 완료</p>
                        <p className="text-sm text-slate-600 font-semibold">{bookingComplete.facilityName}</p>
                        <p className="text-xs text-slate-500">
                            안치유형: {bookingComplete.scale} | 종교: {bookingComplete.religion}
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

        // General recommendations
        return (
            <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                {/* ConsultationForm modal — 바로 긴급 출동 접수 */}
                {consultFacility && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto">
                            <ConsultationForm
                                company={{
                                    id: consultFacility.id,
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
                                mode="memorial"
                                preStepData={{ scale: '', religion: religion || '' }}
                                onClose={() => { setConsultFacility(null); }}
                                onSubmit={handleConsultSubmit}
                            />
                        </div>
                    </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-sm text-green-700 font-bold"><Check size={14} className="inline mr-1" />접수 완료 — <strong>{location}</strong> 지역 추천 시설</p>
                </div>

                {isLoadingRecommendations ? (
                    <div className="flex flex-col items-center py-6 space-y-2 bg-white border border-slate-200 rounded-xl">
                        <Loader2 className="animate-spin text-emerald-600" size={28} />
                        <span className="text-xs text-slate-500">맞춤 시설을 찾고 있습니다...</span>
                    </div>
                ) : recommendedFacilities.length > 0 ? (
                    <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                        {recommendedFacilities.map((f, idx) => {
                            const fId = String(typeof f.id === 'object' ? (f.id as Record<string, unknown>).id || (f as Record<string, unknown>).facilityId : f.id);
                            const isBooked = bookedIds.has(fId);

                            const imgUrl = f.image_url || f.imageUrl || ((f.images?.length ?? 0) > 0 ? f.images![0] : null);
                            return (
                                <div key={fId} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                    <div className="flex gap-3">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={f.name} className="w-[60px] h-[60px] rounded-lg object-cover shrink-0 bg-slate-100" />
                                        ) : (
                                            <div className="w-[60px] h-[60px] rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 text-lg">🕊️</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <button onClick={() => onSwitchToFacility?.({ id: f.id, name: f.name, address: f.address, phone: f.phone })} className="font-bold text-sm text-emerald-700 hover:underline truncate text-left">{f.name}</button>
                                                <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1">추천 {idx + 1}</span>
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
                                        <button onClick={() => setConsultFacility({ id: fId, name: f.name, phone: f.phone })} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1">
                                            <Calendar size={14} /> 상담 신청
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
        <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-4 animate-in fade-in duration-300">
            {/* Section 1: Timing */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">안치 시기</label>
                <div className="flex flex-wrap gap-1.5">
                    {MEMORIAL_TIMING_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setTiming(opt.id)}
                            className={`px-3 py-2 min-h-[44px] md:min-h-0 rounded-lg text-xs font-bold border transition-all ${timing === opt.id
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 2: Location */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">희망 지역</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {REGION_CHIPS.map(reg => (
                        <button key={reg} onClick={() => { setLocation(reg); setShowSuggestions(false); }}
                            className={`px-3 py-2 rounded-full text-xs font-bold border transition-all min-h-[44px] md:min-h-[36px] ${location === reg
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300'}`}>
                            {reg}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <input
                        type="text" value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="또는 직접 입력 (예: 용인, 분당)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {showSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[200] max-h-36 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => { setLocation(s); setShowSuggestions(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none">
                                    <SafeHighlight text={s} highlight={location} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section 3: Religion */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">종교 <span className="text-slate-400 font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-1.5">
                    {MEMORIAL_RELIGION_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setReligion(religion === opt.id ? '' : opt.id)}
                            className={`px-3 py-2 min-h-[44px] md:min-h-0 rounded-lg text-xs font-bold border transition-all ${religion === opt.id
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 4: Budget */}
            <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">예산 범위 <span className="text-slate-400 font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-1.5">
                    {MEMORIAL_BUDGET_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setBudget(budget === opt.id ? '' : opt.id)}
                            className={`px-3 py-2 min-h-[44px] md:min-h-0 rounded-lg text-xs font-bold border transition-all ${budget === opt.id
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> 맞춤 추모시설 찾기</>}
            </button>
        </div>
    );
};

export default MemorialSearchForm;
