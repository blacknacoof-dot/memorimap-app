import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

// 5단계 상태 정의
const PROGRESS_STEPS = [
    { key: 'WAITING', label: '접수 대기', emoji: '📋' },
    { key: 'MORTUARY', label: '빈소 설치', emoji: '🏠' },
    { key: 'ENCOFFINING', label: '입관 진행', emoji: '🙏' },
    { key: 'DEPARTURE', label: '발인/출상', emoji: '🚗' },
    { key: 'ARRIVED', label: '장지 도착', emoji: '🌿' },
] as const;

type ProgressStatus = typeof PROGRESS_STEPS[number]['key'];

interface StatusTrackerProps {
    contractNumber: string;
    isPartner?: boolean; // true = 상조직원(수정가능), false = 유족(읽기전용)
    onStatusChange?: (newStatus: ProgressStatus) => void;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
    contractNumber,
    isPartner = false,
    onStatusChange
}) => {
    const { session } = useSession();
    const [currentStatus, setCurrentStatus] = useState<ProgressStatus>('WAITING');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // 현재 진행 상태 조회 + Realtime — auth client
    useEffect(() => {
        if (!contractNumber || !session) return;

        let cleanup: (() => void) | undefined;

        getAuthClient(session).then(client => {
            // 초기 데이터 조회
            const fetchProgress = async () => {
                setIsLoading(true);
                try {
                    const { data, error } = await client
                        .from('funeral_progress')
                        .select('current_status')
                        .eq('contract_number', contractNumber)
                        .single();

                    if (error && error.code !== 'PGRST116') {
                        console.error('Progress fetch error:', error);
                    }
                    if (data) {
                        setCurrentStatus(data.current_status as ProgressStatus);
                    }
                } catch (e) {
                    console.error('Progress fetch exception:', e);
                } finally {
                    setIsLoading(false);
                }
            };

            void fetchProgress();

            // Realtime 구독 (유족 뷰에서 실시간 업데이트)
            const channel = client
                .channel(`progress-${contractNumber}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'funeral_progress',
                        filter: `contract_number=eq.${contractNumber}`
                    },
                    (payload: { new: { current_status: string } }) => {
                        if (payload.new?.current_status) {
                            setCurrentStatus(payload.new.current_status as ProgressStatus);
                        }
                    }
                )
                .subscribe();

            cleanup = () => {
                channel.unsubscribe();
                client.removeChannel(channel);
            };
        });

        return () => { cleanup?.(); };
    }, [contractNumber, session]);

    // 상태 업데이트 (상조 직원 전용)
    const handleStatusUpdate = async (newStatus: ProgressStatus) => {
        if (!isPartner || isUpdating) return;

        setIsUpdating(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            // Upsert: 없으면 INSERT, 있으면 UPDATE
            const { error } = await client
                .from('funeral_progress')
                .upsert({
                    contract_number: contractNumber,
                    current_status: newStatus,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'contract_number'
                });

            if (error) {
                console.error('Status update error:', error);
                toast.error('상태 업데이트에 실패했습니다.');
                return;
            }

            setCurrentStatus(newStatus);
            onStatusChange?.(newStatus);
        } catch (e) {
            console.error('Status update exception:', e);
            toast.error('상태 업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    const currentStepIndex = PROGRESS_STEPS.findIndex(s => s.key === currentStatus);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
                {isPartner ? '장례 진행 상태 관리' : '장례 진행 현황'}
            </h3>

            {/* Progress Bar (유족 뷰) */}
            {!isPartner && (
                <div className="mb-6">
                    <div className="relative">
                        {/* 배경 바 */}
                        <div className="h-2 bg-gray-200 rounded-full" />
                        {/* 진행 바 */}
                        <div
                            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStepIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* 단계 버튼/표시 */}
            <div className={`grid gap-3 ${isPartner ? 'grid-cols-1' : 'grid-cols-5'}`}>
                {PROGRESS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;

                    if (isPartner) {
                        // 상조 직원 뷰: 클릭 가능한 버튼
                        return (
                            <button
                                key={step.key}
                                onClick={() => handleStatusUpdate(step.key)}
                                disabled={isUpdating}
                                className={`
                                    flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                                    ${isCurrent
                                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                        : isCompleted
                                            ? 'border-emerald-200 bg-emerald-50/50'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }
                                    ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                `}
                            >
                                <span className="text-2xl">{step.emoji}</span>
                                <div className="flex-1 text-left">
                                    <p className={`font-medium ${isCurrent ? 'text-emerald-700' : 'text-gray-700'}`}>
                                        {step.label}
                                    </p>
                                    {isCurrent && (
                                        <p className="text-xs text-emerald-600">현재 단계</p>
                                    )}
                                </div>
                                {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : isCurrent ? (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 animate-pulse" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300" />
                                )}
                            </button>
                        );
                    } else {
                        // 유족 뷰: 읽기 전용 Progress 표시
                        return (
                            <div
                                key={step.key}
                                className="flex flex-col items-center text-center"
                            >
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2
                                    ${isCurrent
                                        ? 'bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-200'
                                        : isCompleted
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-gray-100 text-gray-400'
                                    }
                                `}>
                                    {step.emoji}
                                </div>
                                <p className={`text-xs font-medium ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                                    }`}>
                                    {step.label}
                                </p>
                            </div>
                        );
                    }
                })}
            </div>

            {/* 현재 상태 강조 (유족 뷰) */}
            {!isPartner && (
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm text-emerald-700">
                        <span className="font-bold">현재 진행:</span>{' '}
                        {PROGRESS_STEPS[currentStepIndex]?.emoji} {PROGRESS_STEPS[currentStepIndex]?.label}
                    </p>
                </div>
            )}
        </div>
    );
};

export default StatusTracker;
