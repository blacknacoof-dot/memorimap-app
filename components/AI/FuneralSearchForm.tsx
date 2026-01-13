import React, { useState } from 'react';
import { AlertCircle, MapPin, Users, Star, Check, CalendarCheck, Ambulance, Church, Cross, Heart, CircleDot, Loader2 } from 'lucide-react';
import { createFuneralConsultation } from '@/lib/queries';

interface FormProps {
    userLocation?: { lat: number; lng: number; type: string };
    onGetCurrentPosition?: () => void;
    onSubmit: (data: { text: string; data: any }) => void;
    onClose?: () => void;
    onLoginRequired?: () => void;
    initialCategory?: string;
    facilityId?: string;
    facilityName?: string;
    currentUser?: { id: string; email?: string; name?: string; phone?: string } | null;
}

const FuneralSearchForm: React.FC<FormProps> = ({
    onSubmit,
    onClose,
    onLoginRequired,
    initialCategory = 'funeral',
    facilityId,
    facilityName,
    currentUser
}) => {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Step 1: Urgency
    const [urgency, setUrgency] = useState('');

    // Step 1-1: Location (if urgent)
    const [location, setLocation] = useState('');
    const [needsAmbulance, setNeedsAmbulance] = useState<boolean | null>(null);

    // Step 2: Scale
    const [scale, setScale] = useState('');

    // Step 3: Religion
    const [religion, setReligion] = useState('');

    // Step 4: Schedule
    const [schedule, setSchedule] = useState('');

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

    const handleNext = () => {
        if (step === 1 && !urgency) return;
        if (step === 1.5 && (urgency === 'deceased' || urgency === 'imminent')) {
            if (!location) return;
        }
        if (step === 2 && !scale) return;
        if (step === 3 && !religion) return;
        if (step === 4 && !schedule) return;

        // Handle sub-step for urgent cases
        if (step === 1 && (urgency === 'deceased' || urgency === 'imminent')) {
            setStep(1.5);
            return;
        }
        if (step === 1.5) {
            setStep(2);
            return;
        }

        setStep(prev => prev + 1);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        setIsSaving(true);

        // Save to database
        if (facilityId) {
            try {
                await createFuneralConsultation({
                    facility_id: facilityId,
                    facility_name: facilityName,
                    user_id: currentUser?.id,
                    user_name: currentUser?.name,
                    user_phone: currentUser?.phone,
                    urgency,
                    location: location || undefined,
                    needs_ambulance: needsAmbulance || false,
                    scale,
                    religion,
                    schedule
                });
                console.log('[Consultation] Saved to database');
            } catch (e) {
                console.error('[Consultation] Failed to save:', e);
            }
        }

        const searchData = {
            category: initialCategory,
            urgency,
            location: location || '미지정',
            needsAmbulance,
            scale,
            religion,
            schedule
        };

        const urgencyLabel = URGENCY_OPTIONS.find(o => o.id === urgency)?.label || urgency;
        const scaleLabel = SCALE_OPTIONS.find(o => o.id === scale)?.label || scale;
        const religionLabel = RELIGION_OPTIONS.find(o => o.id === religion)?.label || religion;
        const scheduleLabel = SCHEDULE_OPTIONS.find(o => o.id === schedule)?.label || schedule;

        const finalText = `[📋 장례 상담 접수]\n` +
            `| 구분 | 선택 내용 |\n` +
            `|---|---|\n` +
            `| 현재 상황 | ${urgencyLabel}${location ? ` (${location})` : ''} |\n` +
            `| 희망 빈소 | ${scaleLabel} |\n` +
            `| 종교 | ${religionLabel} |\n` +
            `| 장례 일정 | ${scheduleLabel} |`;

        onSubmit({ text: finalText, data: searchData });

        setIsSaving(false);

        // Close chat after successful submission (no completion message in chat)
        if (onClose) {
            onClose();
        } else {
            // Fallback: show completion step if onClose not provided
            setIsSubmitted(true);
            setStep(6);
        }
    };

    const handleReset = () => {
        // Reset all state to start fresh
        setStep(1);
        setIsSubmitted(false);
        setUrgency('');
        setLocation('');
        setNeedsAmbulance(null);
        setScale('');
        setReligion('');
        setSchedule('');
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
    if (isSubmitted) {
        return (
            <div className="space-y-4">
                <div className="flex gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shrink-0">
                        ✓
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl rounded-tl-sm p-4 max-w-[85%] shadow-sm">
                        <p className="text-sm text-emerald-800 font-bold mb-1">✅ 상담 접수가 완료되었습니다.</p>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                            담당자가 확인 후 빠른 시간 내에 연락드리겠습니다.
                        </p>
                    </div>
                </div>
                <div className="pl-10 space-y-2">
                    <button
                        onClick={handleReset}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-3 rounded-xl transition-all"
                    >
                        🔄 새로운 상담 시작하기
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
                        <strong>현재 어떤 도움이 필요하신가요?</strong>
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

            {/* Step 1.5: Location & Ambulance (for urgent cases) */}
            {step >= 1.5 && (urgency === 'deceased' || urgency === 'imminent') && (
                <>
                    <QuestionBubble>
                        현재 <strong>고인이 계신 곳</strong>은 어디인가요?<br />
                        (예: OO병원, 자택 등)
                    </QuestionBubble>
                    {step === 1.5 && (
                        <div className="pl-10 space-y-3">
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="예: 서울아산병원, 자택"
                                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                            />

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
                    {step > 1.5 && location && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                📍 {location} {needsAmbulance ? '(🚑 운구차 필요)' : ''}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 2: Scale */}
            {step >= 2 && (
                <>
                    <QuestionBubble>
                        원활한 조문객 맞이를 위해 <strong>빈소 규모</strong>를 선택해 주세요.<br />
                        예상하시는 총 조문객 수는 어느 정도인가요?
                    </QuestionBubble>
                    {step === 2 && (
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
                    {step > 2 && scale && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {SCALE_OPTIONS.find(o => o.id === scale)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 3: Religion */}
            {step >= 3 && (
                <>
                    <QuestionBubble>
                        장례 절차를 진행할 <strong>종교</strong>를 선택해 주세요.<br />
                        종교에 맞춰 제단 장식과 의전 절차를 준비해 드립니다.
                    </QuestionBubble>
                    {step === 3 && (
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
                    {step > 3 && religion && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {RELIGION_OPTIONS.find(o => o.id === religion)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 4: Schedule */}
            {step >= 4 && (
                <>
                    <QuestionBubble>
                        <strong>장례 일정</strong>은 어떻게 계획하고 계신가요?<br />
                        최근에는 상황에 따라 일정 조율이 가능합니다.
                    </QuestionBubble>
                    {step === 4 && (
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
                    {step > 4 && schedule && (
                        <div className="flex justify-end mb-3">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm">
                                {SCHEDULE_OPTIONS.find(o => o.id === schedule)?.label}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
                <>
                    <QuestionBubble>
                        입력하신 내용을 확인해 주세요. 아래 내용이 맞으시면 <strong>상담 접수</strong> 버튼을 눌러주세요.
                    </QuestionBubble>
                    <div className="pl-10">
                        <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">현재 상황</span>
                                <span className="font-bold text-slate-800">{URGENCY_OPTIONS.find(o => o.id === urgency)?.label}{location && ` (${location})`}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">희망 빈소</span>
                                <span className="font-bold text-slate-800">{SCALE_OPTIONS.find(o => o.id === scale)?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500">종교</span>
                                <span className="font-bold text-slate-800">{RELIGION_OPTIONS.find(o => o.id === religion)?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">장례 일정</span>
                                <span className="font-bold text-slate-800">{SCHEDULE_OPTIONS.find(o => o.id === schedule)?.label}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Navigation - Only show Next button when selection is made */}
            {step < 5 && (
                <div className="pl-10 pt-2">
                    <button
                        onClick={handleNext}
                        disabled={
                            (step === 1 && !urgency) ||
                            (step === 1.5 && !location) ||
                            (step === 2 && !scale) ||
                            (step === 3 && !religion) ||
                            (step === 4 && !schedule)
                        }
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all"
                    >
                        다음 질문으로 →
                    </button>
                </div>
            )}

            {/* Submit button on summary step */}
            {step === 5 && (
                <div className="pl-10 pt-2">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} /> 상담 접수하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default FuneralSearchForm;
