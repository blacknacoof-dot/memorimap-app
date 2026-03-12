import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getConsultationsByUser, updateConsultationStatus, getFacility, Consultation } from '@/lib/queries';
import { Clock, CheckCircle, XCircle, Check, Building2, Calendar, ChevronRight, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
// aiConsultationService import 제거 — 인증 클라이언트 미전달 방지
import { AiConsultationStatus, Facility } from '@/types';
import { getAuthClient } from '@/lib/supabaseClient';
import { useApiRetry } from '@/hooks/useApiRetry';
import { useSession } from '@/lib/auth';
import { confirmAsync } from '@/src/components/common/ConfirmModal';

/** Extended consultation type with AI-specific fields */
type ExtendedConsultation = Consultation & {
    conversation_id?: string;
    isAi?: boolean;
    ai_pk?: string;
    originStatus?: string;
    facility_name?: string;
};

interface Props {
    userId: string;
    onResumeChat?: (consultation: ExtendedConsultation) => void;
    onViewFacility?: (facility: Facility) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon; description: string }> = {
    pending: { label: '대기중', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, description: '담당자 확인 중' },
    waiting: { label: '대기중', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, description: '담당자 확인 중' },
    accepted: { label: '접수됨', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, description: '담당자가 확인했습니다' },
    cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, description: '상담이 취소되었습니다' },
    completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Check, description: '장례가 완료되었습니다' }
};

const getFacilityName = (c: ExtendedConsultation): string => {
    if (c.facility_name) return c.facility_name;
    if (c.notes) {
        const match = c.notes.match(/시설:\s*([^,\n]+)/);
        if (match) return match[1].trim();
    }
    return '장례식장';
};

const _RELIGION_LABELS: Record<string, string> = {
    buddhist: '불교',
    christian: '기독교',
    catholic: '천주교',
    none: '무교/기타'
};

const _SCALE_LABELS: Record<string, string> = {
    small: '소규모',
    medium: '중규모',
    large: '대규모'
};

const _SCHEDULE_LABELS: Record<string, string> = {
    '3day': '3일장',
    '2day': '2일장',
    other: '기타'
};

export const MyConsultations: React.FC<Props> = ({ userId, onResumeChat, onViewFacility }) => {
    const [consultations, setConsultations] = useState<ExtendedConsultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { callWithRetry } = useApiRetry();
    const { session } = useSession();

    const fetchConsultations = async () => {
        setIsLoading(true);
        // 1. Fetch Legacy Consultations (자동 재시도 + 토큰 갱신)
        let legacyData: Consultation[] = [];
        try {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client
                .from('consultations')
                .select('*')
                .eq('user_id', userId)
                .not('status', 'eq', 'cancelled')
                .order('created_at', { ascending: false });
            if (!error && data) {
                legacyData = data as Consultation[];
            }
        } catch {
            const fallbackClient = await getAuthClient(session, { strict: true });
            legacyData = await getConsultationsByUser(userId, fallbackClient);
        }

        // 2. Fetch AI Consultations (인증 클라이언트 사용, deleted 제외)
        let aiData: Array<Record<string, unknown>> = [];
        try {
            const aiClient = await getAuthClient(session, { strict: true });
            const { data: aiResult, error: aiError } = await aiClient
                .from('ai_consultations')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            if (!aiError && aiResult) {
                aiData = (aiResult as Array<Record<string, unknown>>).filter(ai => ai.status !== 'cancelled' && ai.status !== 'deleted');
            }
        } catch (_e) {
            // ai_consultations 조회 실패 — 빈 배열로 fallback
            // fallback 제거 — 인증 실패 시 빈 배열
            aiData = [];
        }

        // 3. Merge & Adapt
        const aiAdapted: ExtendedConsultation[] = aiData.map((ai) => ({
            id: String(ai.id), // UUID PK - always exists
            facility_id: String(ai.facility_id || ''),
            user_id: String(ai.user_id || userId),
            status: mapAiStatusToLegacy(ai.status as AiConsultationStatus) as ExtendedConsultation['status'],
            created_at: String(ai.created_at || new Date().toISOString()),
            updated_at: String(ai.updated_at || new Date().toISOString()),
            facility_name: String(ai.facility_name || ''),
            scale: 'small',
            religion: 'none',
            schedule: '3day',
            urgency: 'inquiry',
            is_ai_response: true,
            metadata: (ai.metadata || {}) as Record<string, unknown>,
            source: 'ai',
            isAi: true,
            conversation_id: String(ai.conversation_id || ''),
            ai_pk: String(ai.id), // ai_consultations PK for delete/cancel
            originStatus: String(ai.status || '')
        }));

        setConsultations(
            [...aiAdapted, ...legacyData]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );
        setIsLoading(false);
    };

    const mapAiStatusToLegacy = (status: AiConsultationStatus): string => {
        switch (status) {
            case AiConsultationStatus.COMPLETED: return 'completed';
            case AiConsultationStatus.AGENT_CONNECTED: return 'accepted';
            case AiConsultationStatus.AGENT_REQUESTED: return 'waiting';
            default: return 'waiting'; // AI_HANDLING -> waiting
        }
    };

    useEffect(() => {
        if (!userId || !session) return;
        fetchConsultations();

        // [Realtime Sync] — auth client
        let mounted = true;
        let cleanup: (() => void) | undefined;

        getAuthClient(session).then(client => {
            if (!mounted) return;
            const channel = client
                .channel(`consultations-user-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'ai_consultations',
                        filter: `user_id=eq.${userId}`
                    },
                    () => { fetchConsultations(); }
                )
                .subscribe();

            cleanup = () => {
                channel.unsubscribe();

            };
        });

        return () => { mounted = false; cleanup?.(); };
    }, [userId, session]);

    const handleCancel = async (consultation: ExtendedConsultation) => {
        const consultationId = consultation.id;
        if (!consultationId || consultationId.startsWith('ai_temp_')) {
            toast.error('상담 ID가 없어 취소할 수 없습니다.');
            return;
        }
        if (!await confirmAsync('상담을 취소하시겠습니까?')) return;

        try {
            if (consultation.isAi) {
                const aiId = consultation.ai_pk || consultation.id;
                if (!aiId || String(aiId).startsWith('ai_temp_')) {
                    toast.error('AI 상담 ID가 유효하지 않습니다.');
                    return;
                }
                const cancelClient = await getAuthClient(session, { strict: true });
                const { error } = await cancelClient
                    .from('ai_consultations')
                    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                    .eq('id', aiId)
                    .eq('user_id', userId);
                if (error) {
                    toast.error('취소 중 오류가 발생했습니다.');
                    return;
                }
            } else {
                // 일반 상담: 자동 재시도 포함
                const client = await getAuthClient(session, { strict: true });
                const success = await callWithRetry(() =>
                    updateConsultationStatus(consultationId, 'cancelled', undefined, client)
                );
                if (!success) {
                    toast.error('취소 중 오류가 발생했습니다.');
                    return;
                }
            }
            setConsultations(prev =>
                prev.map(c => c.id === consultationId ? { ...c, status: 'cancelled' } : c)
            );
            toast.success('상담이 취소되었습니다.');
        } catch (_e) {
            toast.error('취소 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (consultation: ExtendedConsultation) => {
        if (!await confirmAsync('상담 내역을 삭제하시겠습니까?')) return;

        try {
            if (consultation.isAi) {
                const aiId = consultation.ai_pk || consultation.id;
                if (!aiId || String(aiId).startsWith('ai_temp_')) {
                    toast.error('AI 상담 ID가 유효하지 않아 삭제할 수 없습니다.');
                    return;
                }
                const cancelClient = await getAuthClient(session, { strict: true });
                const { error } = await cancelClient
                    .from('ai_consultations')
                    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                    .eq('id', aiId)
                    .eq('user_id', userId);
                if (error) throw error;
            } else {
                const legacyCancelClient = await getAuthClient(session, { strict: true });
                const { error } = await legacyCancelClient
                    .from('consultations')
                    .update({ status: 'cancelled' })
                    .eq('id', consultation.id)
                    .eq('user_id', userId);
                if (error) throw error;
            }

            setConsultations(prev => prev.filter(c => c.id !== consultation.id));
            toast.success('상담 내역이 삭제되었습니다.');
        } catch (_e) {
            toast.error('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const handleViewFacility = async (facilityId: string) => {
        if (!onViewFacility || !facilityId) return;
        try {
            const facility = await getFacility(facilityId);
            if (facility) onViewFacility(facility);
        } catch (_e) {
            toast.error('시설 정보를 불러올 수 없습니다.');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <RefreshCw className="animate-spin mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-slate-400">상담 내역을 불러오는 중...</p>
            </div>
        );
    }

    if (consultations.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">상담 내역이 없습니다</h3>
                <p className="text-sm text-slate-500">장례식장에서 상담을 신청하시면 여기에 표시됩니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">내 상담 내역</h2>
                <button
                    onClick={fetchConsultations}
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                    <RefreshCw size={14} />
                    새로고침
                </button>
            </div>

            <div className="space-y-3">
                {consultations.map(consultation => {
                    const statusConfig = STATUS_CONFIG[consultation.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.waiting;
                    const StatusIcon = statusConfig.icon;

                    return (
                        <div
                            key={consultation.id || `fallback_${consultation.created_at}`}
                            className={`bg-white rounded-2xl border-2 ${statusConfig.color} p-4 transition hover:shadow-md`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${statusConfig.color}`}>
                                        <StatusIcon size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800">
                                                {statusConfig.label}
                                            </span>
                                            {consultation.urgency === 'deceased' && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                                    긴급
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">{statusConfig.description}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {formatDate(consultation.created_at)}
                                </span>
                            </div>

                            {/* Facility Info */}
                            <div
                                onClick={() => handleViewFacility(consultation.facility_id)}
                                className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 active:scale-[0.98] transition"
                            >
                                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <Building2 size={18} className="text-slate-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-800">{getFacilityName(consultation)}</h4>
                                    <p className="text-xs text-blue-500">상세 보기</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-400" />
                            </div>

                            {/* Facility Instruction Box */}
                            {consultation.status === 'accepted' && consultation.metadata && Object.keys(consultation.metadata).length > 0 && (
                                <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <h4 className="flex items-center gap-2 text-indigo-900 font-bold mb-2 text-sm">
                                        <MessageSquare size={16} /> 장례식장 안내 메시지
                                    </h4>

                                    {!!consultation.metadata.expected_time && (
                                        <p className="text-sm text-indigo-800 font-bold mb-1">
                                            ⏰ {String(consultation.metadata.expected_time)}
                                        </p>
                                    )}

                                    {!!consultation.metadata.instruction && (
                                        <p className="text-sm text-indigo-700 whitespace-pre-wrap">
                                            {String(consultation.metadata.instruction)}
                                        </p>
                                    )}

                                    <p className="text-xs text-indigo-400 mt-2">
                                        * 위 안내사항을 꼭 확인하고 방문해주세요.
                                    </p>
                                </div>
                            )}

                            {/* Answer Section */}
                            {consultation.answer && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-blue-100 p-1 rounded-full">
                                            <CheckCircle size={14} className="text-blue-600" />
                                        </div>
                                        <span className="font-bold text-blue-800 text-sm">담당자 답변</span>
                                        <span className="text-xs text-blue-400">
                                            {consultation.answered_at ? new Date(consultation.answered_at).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <p className="text-blue-900 text-sm whitespace-pre-wrap">{consultation.answer}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {/* [AI] Resume Chat Button */}
                            {consultation.isAi && consultation.originStatus !== AiConsultationStatus.COMPLETED && (
                                <button
                                    onClick={() => {
                                        if (onResumeChat) {
                                            onResumeChat(consultation);
                                        } else {
                                            toast.info(`[상담 이어하기] 채팅창을 엽니다.\nID: ${consultation.id}`);
                                        }
                                    }}
                                    className="w-full py-2 mb-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-bold flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={16} />
                                    상담 이어하기
                                </button>
                            )}

                            {(['waiting', 'pending'].includes(consultation.status)) && (
                                <button
                                    onClick={() => handleCancel(consultation)}
                                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                                >
                                    상담 취소하기
                                </button>
                            )}

                            {/* Delete Button */}
                            {(['waiting', 'pending', 'cancelled'].includes(consultation.status)) && (
                                <button
                                    onClick={() => handleDelete(consultation)}
                                    className="w-full py-2 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition font-medium flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    삭제
                                </button>
                            )}

                            {/* Progress Bar */}
                            <div className="mt-3">
                                <div className="flex items-center gap-1">
                                    {['waiting', 'accepted', 'completed'].map((step, idx) => {
                                        const stepOrder: Record<string, number> = { pending: 0, waiting: 0, accepted: 1, cancelled: -1, completed: 2 };
                                        const currentOrder = stepOrder[consultation.status] ?? 0;
                                        const isActive = stepOrder[step as keyof typeof stepOrder] <= currentOrder && currentOrder >= 0;
                                        const isCancelled = consultation.status === 'cancelled';

                                        return (
                                            <React.Fragment key={step}>
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCancelled
                                                        ? 'bg-red-100 text-red-400'
                                                        : isActive
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-200 text-slate-400'
                                                        }`}
                                                >
                                                    {idx + 1}
                                                </div>
                                                {idx < 2 && (
                                                    <div className={`flex-1 h-1 rounded ${isCancelled
                                                        ? 'bg-red-100'
                                                        : stepOrder[step as keyof typeof stepOrder] < currentOrder
                                                            ? 'bg-indigo-600'
                                                            : 'bg-slate-200'
                                                        }`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>대기</span>
                                    <span>접수</span>
                                    <span>완료</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyConsultations;
