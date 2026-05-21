import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getConsultationsByUser, updateConsultationStatus, getFacility, Consultation } from '@/lib/queries';
import { Clock, CheckCircle, XCircle, Check, Building2, Calendar, ChevronRight, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Facility } from '@/types';
import { getAuthClient } from '@/lib/supabaseClient';
import { useApiRetry } from '@/hooks/useApiRetry';
import { useSession } from '@/lib/auth';
import { confirmAsync } from '@/src/components/common/ConfirmModal';

/** Extended consultation type */
type ExtendedConsultation = Consultation & {
    facility_name?: string;
    source_kind?: 'consultation' | 'lead' | 'reservation';
    source_label?: string;
};

interface Props {
    userId: string;
    onResumeChat?: (consultation: ExtendedConsultation) => void; // 향후 AI 상담 인계 복구 시 활용
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

export const MyConsultations: React.FC<Props> = ({ userId, onViewFacility }) => {
    const [consultations, setConsultations] = useState<ExtendedConsultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { callWithRetry } = useApiRetry();
    const { session } = useSession();

    const fetchConsultations = async () => {
        setIsLoading(true);
        // 1. Fetch Legacy Consultations (자동 재시도 + 토큰 갱신)
        let mergedData: ExtendedConsultation[] = [];
        try {
            const client = await getAuthClient(session, { strict: true });
            const [consultationsResult, leadsResult, reservationsResult] = await Promise.all([
                client.from('consultations').select('*').eq('user_id', userId).not('status', 'eq', 'cancelled').order('created_at', { ascending: false }),
                client.from('leads').select('*').eq('user_id', userId).not('status', 'eq', 'cancelled').order('created_at', { ascending: false }),
                client.from('reservations').select('*').eq('user_id', userId).in('purpose', ['funeral', 'memorial', 'pet']).not('status', 'eq', 'cancelled').not('status', 'eq', 'rejected').order('created_at', { ascending: false }),
            ]);
            const consultationRows = (consultationsResult.data || []).map((row) => ({
                ...(row as Consultation),
                source_kind: 'consultation' as const,
                source_label: '상담',
            }));
            const leadRows = (leadsResult.data || []).map((row: Record<string, unknown>) => ({
                id: `lead-${String(row.id || '')}`,
                facility_id: String(row.facility_id || ''),
                facility_name: String(row.facility_name || row.company_name || ''),
                user_id: userId,
                user_name: String(row.contact_name || ''),
                user_phone: String(row.contact_phone || ''),
                urgency: String(row.urgency || 'normal'),
                scale: String(row.scale || ''),
                religion: '',
                schedule: '',
                notes: String((row.context_data as { notes?: string } | null)?.notes || row.notes || ''),
                status: row.status === 'converted' || row.status === 'contacted' ? 'accepted' : 'waiting',
                created_at: String(row.created_at || new Date().toISOString()),
                updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
                is_ai_response: true,
                metadata: (row.context_data as Record<string, unknown>) || {},
                source: 'lead',
                source_kind: 'lead' as const,
                source_label: 'AI 접수',
            } as ExtendedConsultation));
            const reservationRows = (reservationsResult.data || []).map((row: Record<string, unknown>) => {
                const rawStatus = String(row.status || 'pending');
                const status = rawStatus === 'confirmed' ? 'accepted' : rawStatus === 'completed' ? 'completed' : 'waiting';
                return {
                    id: `reservation-${String(row.id || '')}`,
                    facility_id: String(row.facility_id || ''),
                    facility_name: String(row.facility_name || ''),
                    user_id: userId,
                    user_name: String(row.visitor_name || ''),
                    user_phone: String(row.contact_number || ''),
                    urgency: rawStatus === 'urgent' ? 'deceased' : 'normal',
                    scale: '',
                    religion: '',
                    schedule: String(row.time_slot || ''),
                    notes: String(row.special_requests || row.purpose || ''),
                    status,
                    created_at: String(row.created_at || row.visit_date || new Date().toISOString()),
                    updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
                    is_ai_response: true,
                    metadata: { visit_date: row.visit_date, time_slot: row.time_slot, purpose: row.purpose },
                    source: 'reservation',
                    source_kind: 'reservation' as const,
                    source_label: '예약 접수',
                } as ExtendedConsultation;
            });
            mergedData = [...consultationRows, ...leadRows, ...reservationRows];
        } catch {
            const fallbackClient = await getAuthClient(session, { strict: true });
            mergedData = (await getConsultationsByUser(userId, fallbackClient)).map((row) => ({
                ...row,
                source_kind: 'consultation' as const,
                source_label: '상담',
            }));
        }

        // ai_consultations 조회 제거 — ScenarioBot(유일한 쓰기 경로) 폐기로 빈 테이블
        // 향후 AI 상담 인계 복구 시 여기에 다시 추가

        setConsultations(
            mergedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );
        setIsLoading(false);
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
                        table: 'consultations',
                        filter: `user_id=eq.${userId}`
                    },
                    () => { fetchConsultations(); }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'leads',
                        filter: `user_id=eq.${userId}`
                    },
                    () => { fetchConsultations(); }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'reservations',
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
        if (!consultationId) {
            toast.error('상담 ID가 없어 취소할 수 없습니다.');
            return;
        }
        if (!await confirmAsync('상담을 취소하시겠습니까?')) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            const success = await callWithRetry(() =>
                updateConsultationStatus(consultationId, 'cancelled', undefined, client)
            );
            if (!success) {
                toast.error('취소 중 오류가 발생했습니다.');
                return;
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
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client
                .from('consultations')
                .update({ status: 'cancelled' })
                .eq('id', consultation.id)
                .eq('user_id', userId);
            if (error) throw error;

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
                            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 mb-3">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className={`shrink-0 p-2 rounded-full ${statusConfig.color}`}>
                                        <StatusIcon size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                            <span className="whitespace-nowrap font-bold leading-tight text-slate-800">
                                                {statusConfig.label}
                                            </span>
                                            {consultation.source_label && (
                                                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-bold leading-tight text-slate-600">
                                                    {consultation.source_label}
                                                </span>
                                            )}
                                            {consultation.urgency === 'deceased' && (
                                                <span className="whitespace-nowrap rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                                                    긴급
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">{statusConfig.description}</p>
                                    </div>
                                </div>
                                <span className="ml-auto max-w-[112px] shrink-0 text-right text-[11px] leading-snug text-slate-400 sm:max-w-none sm:text-xs">
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
                            {consultation.source_kind === 'consultation' && (['waiting', 'pending'].includes(consultation.status)) && (
                                <button
                                    onClick={() => handleCancel(consultation)}
                                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                                >
                                    상담 취소하기
                                </button>
                            )}

                            {/* Delete Button */}
                            {consultation.source_kind === 'consultation' && (['waiting', 'pending', 'cancelled'].includes(consultation.status)) && (
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
