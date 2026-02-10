import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getConsultationsByFacility, updateConsultationStatus, Consultation } from '@/lib/queries';
import { Clock, CheckCircle, XCircle, Check, Phone, MapPin, Users, Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { aiConsultationService } from '@/lib/api/aiConsultation';
import { AiConsultationStatus } from '@/types';
import { supabase } from '@/lib/supabaseClient'; // [Realtime]
import { ConsultationActionModal } from './facility/ConsultationActionModal';

interface Props {
    facilityId: string;
}

const STATUS_CONFIG = {
    waiting: { label: '대기중', color: 'bg-amber-100 text-amber-700', icon: Clock },
    accepted: { label: '접수됨', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700', icon: XCircle },
    completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700', icon: Check }
};

const RELIGION_LABELS: Record<string, string> = {
    buddhist: '불교',
    christian: '기독교',
    catholic: '천주교',
    none: '무교/기타'
};

const SCALE_LABELS: Record<string, string> = {
    small: '소규모 (50명 미만)',
    medium: '중규모 (100~200명)',
    large: '대규모 (300명 이상)'
};

const SCHEDULE_LABELS: Record<string, string> = {
    '3day': '3일장',
    '2day': '2일장',
    other: '기타'
};

const URGENCY_LABELS: Record<string, string> = {
    deceased: '임종',
    imminent: '임박',
    inquiry: '문의'
};

export const ConsultationList: React.FC<Props> = ({ facilityId }) => {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // [Modal Logic]
    const [selectedConsultation, setSelectedConsultation] = useState<{ id: string, name: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchConsultations = async () => {
        setIsLoading(true);
        const data = await getConsultationsByFacility(
            facilityId,
            filter === 'all' ? undefined : filter
        );
        setConsultations(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchConsultations();

        // [Realtime Sync] Subscribe to changes
        const channel = supabase
            .channel(`consultations-facility-${facilityId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT/UPDATE
                    schema: 'public',
                    table: 'ai_consultations',
                    filter: `facility_id=eq.${facilityId}`
                },
                (payload) => {
                    console.log('Realtime update received:', payload);
                    fetchConsultations(); // Refresh list on change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [facilityId, filter]);

    const handleStatusChange = async (consultationId: string, newStatus: 'waiting' | 'accepted' | 'cancelled' | 'completed') => {
        try {
            // [Migration] AI Service Integration for 'accepted' (Confirm)
            if (newStatus === 'accepted') {
                // Open Modal instead of direct update
                const target = consultations.find(c => c.id === consultationId);
                if (target) {
                    setSelectedConsultation({ id: consultationId, name: target.user_name || '익명' });
                    setIsModalOpen(true);
                }
                return; // Stop here, wait for modal confirm
            } else {
                // Legacy or other statuses
                await updateConsultationStatus(consultationId, newStatus);
            }

            // Update UI
            setConsultations(prev =>
                prev.map(c => c.id === consultationId ? { ...c, status: newStatus } : c)
            );


        } catch (error) {
            console.error('Status Update Failed:', error);
            toast.error('상태 변경에 실패했습니다. (권한이 없거나 이미 처리됨)');
        }
    };

    // [New] Handle Modal Confirmation
    const handleConfirmAccept = async ({ expectedTime, instruction }: { expectedTime: string; instruction: string }) => {
        if (!selectedConsultation) return;

        try {
            await aiConsultationService.updateStatus(
                selectedConsultation.id,
                AiConsultationStatus.CONSULTATION_CONFIRMED,
                {
                    last_event: 'CONSULTATION_CONFIRMED',
                    event_time: new Date().toISOString(),
                    instruction: instruction,          // [New Field]
                    expected_time: expectedTime        // [New Field]
                }
            );

            // Optimistic UI Update
            setConsultations(prev =>
                prev.map(c => c.id === selectedConsultation.id ? { ...c, status: 'accepted' } : c)
            );

            toast.success('예약이 확정되었습니다.');
        } catch (error) {
            console.error('Confirm Failed:', error);
            toast.error('확인 처리에 실패했습니다.');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const waitingCount = consultations.filter(c => c.status === 'waiting').length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800">상담 접수 현황</h3>
                    {waitingCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                            {waitingCount} 대기중
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchConsultations}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                    title="새로고침"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-100">
                {[
                    { id: 'all', label: '전체' },
                    { id: 'waiting', label: '대기중' },
                    { id: 'accepted', label: '접수됨' },
                    { id: 'completed', label: '완료' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex-1 py-3 text-sm font-medium transition ${filter === tab.id
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">
                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                        불러오는 중...
                    </div>
                ) : consultations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        접수된 상담이 없습니다.
                    </div>
                ) : (
                    consultations.map(consultation => {
                        const StatusIcon = STATUS_CONFIG[consultation.status].icon;
                        const isExpanded = expandedId === consultation.id;

                        return (
                            <div key={consultation.id} className="hover:bg-slate-50 transition">
                                {/* Summary Row */}
                                <div
                                    className="p-4 flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : consultation.id)}
                                >
                                    <div className={`p-2 rounded-full ${STATUS_CONFIG[consultation.status].color}`}>
                                        <StatusIcon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 truncate">
                                                {consultation.user_name || '익명'}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[consultation.status].color}`}>
                                                {STATUS_CONFIG[consultation.status].label}
                                            </span>
                                            {consultation.urgency === 'deceased' && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                                                    긴급
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                            <span>{formatDate(consultation.created_at)}</span>
                                            {consultation.location && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={10} />
                                                        {consultation.location}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {/* Details Grid */}
                                        <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Phone size={12} className="text-slate-400" />
                                                <span className="text-slate-600">{consultation.user_phone || '번호 없음'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={12} className="text-slate-400" />
                                                <span className="text-slate-600">{SCALE_LABELS[consultation.scale] || consultation.scale}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span className="text-slate-600">{SCHEDULE_LABELS[consultation.schedule] || consultation.schedule}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">종교</span>
                                                <span className="text-slate-600">{RELIGION_LABELS[consultation.religion] || consultation.religion}</span>
                                            </div>
                                            {consultation.needs_ambulance && (
                                                <div className="col-span-2 flex items-center gap-2 text-red-600">
                                                    <span>🚑</span>
                                                    <span>운구차 필요</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Actions */}
                                        <div className="flex gap-2">
                                            {consultation.status === 'waiting' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(consultation.id, 'accepted')}
                                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition"
                                                    >
                                                        ✓ 접수하기
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(consultation.id, 'cancelled')}
                                                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition"
                                                    >
                                                        취소
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Instruction Modal */}
            <ConsultationActionModal
                isOpen={isModalOpen}
                consultationName={selectedConsultation?.name || ''}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAccept}
            />
        </div>
    );
};
