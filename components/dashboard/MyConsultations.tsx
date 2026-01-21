import React, { useState, useEffect } from 'react';
import { getConsultationsByUser, updateConsultationStatus, Consultation } from '@/lib/queries';
import { Clock, CheckCircle, XCircle, Check, MapPin, Building2, Calendar, ChevronRight, RefreshCw } from 'lucide-react';

interface Props {
    userId: string;
}

const STATUS_CONFIG = {
    waiting: { label: '대기중', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, description: '담당자 확인 중' },
    accepted: { label: '접수됨', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, description: '담당자가 확인했습니다' },
    cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, description: '상담이 취소되었습니다' },
    completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Check, description: '장례가 완료되었습니다' }
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

export const MyConsultations: React.FC<Props> = ({ userId }) => {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConsultations = async () => {
        setIsLoading(true);
        const data = await getConsultationsByUser(userId);
        setConsultations(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (userId) {
            fetchConsultations();
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
                    const StatusIcon = STATUS_CONFIG[consultation.status].icon;
                    const statusConfig = STATUS_CONFIG[consultation.status];

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
                            <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <Building2 size={18} className="text-slate-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-800">{consultation.facility_name || '장례식장'}</h4>
                                    {consultation.location && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} />
                                            {consultation.location}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight size={16} className="text-slate-400" />
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <span className="text-slate-400 block">규모</span>
                                    <span className="font-bold text-slate-700">{SCALE_LABELS[consultation.scale]}</span>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <span className="text-slate-400 block">종교</span>
                                    <span className="font-bold text-slate-700">{RELIGION_LABELS[consultation.religion]}</span>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2 text-center">
                                    <span className="text-slate-400 block">일정</span>
                                    <span className="font-bold text-slate-700">{SCHEDULE_LABELS[consultation.schedule]}</span>
                                </div>
                            </div>

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
                            {consultation.status === 'waiting' && (
                                <button
                                    onClick={() => handleCancel(consultation.id)}
                                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                                >
                                    상담 취소하기
                                </button>
                            )}

                            {/* Progress Bar */}
                            <div className="mt-3">
                                <div className="flex items-center gap-1">
                                    {['waiting', 'accepted', 'completed'].map((step, idx) => {
                                        const stepOrder = { waiting: 0, accepted: 1, cancelled: -1, completed: 2 };
                                        const currentOrder = stepOrder[consultation.status];
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
