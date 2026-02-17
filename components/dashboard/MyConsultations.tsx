import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getConsultationsByUser, updateConsultationStatus, getFacility, Consultation } from '@/lib/queries';
import { Clock, CheckCircle, XCircle, Check, MapPin, Building2, Calendar, ChevronRight, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';
import { aiConsultationService } from '@/lib/api/aiConsultation';
import { AiConsultationStatus } from '@/types';
import { supabase, createAuthenticatedClient } from '@/lib/supabaseClient'; // [Realtime]
import { useSession } from '@/lib/auth';

interface Props {
    userId: string;
    onResumeChat?: (consultation: Consultation & { conversation_id?: string; isAi?: boolean; originStatus?: string }) => void;
    onViewFacility?: (facility: any) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
    pending: { label: '대기중', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, description: '담당자 확인 중' },
    waiting: { label: '대기중', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, description: '담당자 확인 중' },
    accepted: { label: '접수됨', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, description: '담당자가 확인했습니다' },
    cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, description: '상담이 취소되었습니다' },
    completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Check, description: '장례가 완료되었습니다' }
};

const getFacilityName = (c: any): string => {
    if (c.facility_name) return c.facility_name;
    if (c.notes) {
        const match = c.notes.match(/시설:\s*([^,\n]+)/);
        if (match) return match[1].trim();
    }
    return '장례식장';
};

const RELIGION_LABELS: Record<string, string> = {
    buddhist: '불교',
    christian: '기독교',
    catholic: '천주교',
    none: '무교/기타'
};

const SCALE_LABELS: Record<string, string> = {
    small: '소규모',
    medium: '중규모',
    large: '대규모'
};

const SCHEDULE_LABELS: Record<string, string> = {
    '3day': '3일장',
    '2day': '2일장',
    other: '기타'
};

export const MyConsultations: React.FC<Props> = ({ userId, onResumeChat, onViewFacility }) => {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { session } = useSession();

    const fetchConsultations = async () => {
        setIsLoading(true);
        // 1. Fetch Legacy Consultations (인증된 클라이언트로 RLS 통과)
        let legacyData: Consultation[] = [];
        try {
            const token = await session?.getToken({ template: 'supabase' });
            if (token) {
                const authClient = createAuthenticatedClient(token);
                const { data, error } = await authClient
                    .from('consultations')
                    .select('*')
                    .eq('user_id', userId)
                    .not('status', 'eq', 'cancelled')
                    .order('created_at', { ascending: false });
                if (!error && data) {
                    legacyData = data as Consultation[];
                }
            }
        } catch (e) {
            console.error('인증 consultations 조회 실패:', e);
            legacyData = await getConsultationsByUser(userId); // fallback
        }

        // 2. Fetch AI Consultations (deleted 제외)
        const aiDataRaw = await aiConsultationService.getUserConsultations(userId);
        const aiData = aiDataRaw.filter(ai => ai.status !== 'cancelled' && ai.status !== 'deleted');

        // 3. Merge & Adapt
        const aiAdapted = aiData.map(ai => ({
            id: ai.conversation_id, // Use conversation_id as ID
            facility_id: ai.facility_id || '',
            user_id: ai.user_id || userId,
            status: mapAiStatusToLegacy(ai.status),
            created_at: ai.created_at || new Date().toISOString(),
            facility_name: ai.facility_name,
            scale: 'small', // Default
            religion: 'none', // Default
            schedule: '3day', // Default
            urgency: 'inquiry',
            // Custom field to identify AI
            isAi: true,
            conversation_id: ai.conversation_id,
            originStatus: ai.status
        })) as any[];

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
        if (userId) {
            fetchConsultations();

            // [Realtime Sync]
            const channel = supabase
                .channel(`consultations-user-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen for updates (status change)
                        schema: 'public',
                        table: 'ai_consultations',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        // User Realtime update received
                        fetchConsultations(); // Refresh to see new status and instructions
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId]);

    const handleCancel = async (consultationId: string) => {
        if (!confirm('상담을 취소하시겠습니까?')) return;

        const success = await updateConsultationStatus(consultationId, 'cancelled');
        if (success) {
            setConsultations(prev =>
                prev.map(c => c.id === consultationId ? { ...c, status: 'cancelled' } : c)
            );
        }
    };

    const handleDelete = async (consultation: any) => {
        if (!confirm('상담 내역을 삭제하시겠습니까?')) return;

        try {
            const token = await session?.getToken({ template: 'supabase' });
            if (!token) throw new Error('인증 토큰 없음');
            const authClient = createAuthenticatedClient(token);

            if (consultation.isAi) {
                // AI 상담: cancelled로 상태 변경
                const { error } = await authClient
                    .from('ai_consultations')
                    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                    .eq('conversation_id', consultation.conversation_id)
                    .eq('user_id', userId);
                if (error) {
                    const { error: e2 } = await supabase
                        .from('ai_consultations')
                        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                        .eq('conversation_id', consultation.conversation_id)
                        .eq('user_id', userId);
                    if (e2) throw e2;
                }
            } else {
                // 일반 상담: cancelled로 상태 변경
                const { error } = await authClient
                    .from('consultations')
                    .update({ status: 'cancelled' })
                    .eq('id', consultation.id)
                    .eq('user_id', userId);
                if (error) {
                    const { error: e2 } = await supabase
                        .from('consultations')
                        .update({ status: 'cancelled' })
                        .eq('id', consultation.id)
                        .eq('user_id', userId);
                    if (e2) throw e2;
                }
            }

            setConsultations(prev => prev.filter(c => c.id !== consultation.id));
            toast.success('상담 내역이 삭제되었습니다.');
        } catch (e) {
            console.error('삭제 실패:', e);
            toast.error('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const handleViewFacility = async (facilityId: string) => {
        if (!onViewFacility || !facilityId) return;
        try {
            const facility = await getFacility(facilityId);
            if (facility) onViewFacility(facility);
        } catch (e) {
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
                            key={consultation.id}
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
                            {consultation.status === 'accepted' && (consultation as any).metadata && (
                                <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <h4 className="flex items-center gap-2 text-indigo-900 font-bold mb-2 text-sm">
                                        <MessageSquare size={16} /> 장례식장 안내 메시지
                                    </h4>

                                    {(consultation as any).metadata.expected_time && (
                                        <p className="text-sm text-indigo-800 font-bold mb-1">
                                            ⏰ {(consultation as any).metadata.expected_time}
                                        </p>
                                    )}

                                    {(consultation as any).metadata.instruction && (
                                        <p className="text-sm text-indigo-700 whitespace-pre-wrap">
                                            {(consultation as any).metadata.instruction}
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
                            {(consultation as any).isAi && (consultation as any).originStatus !== AiConsultationStatus.COMPLETED && (
                                <button
                                    onClick={() => {
                                        if (onResumeChat) {
                                            onResumeChat(consultation as any);
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
                                    onClick={() => handleCancel(consultation.id)}
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
