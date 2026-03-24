import { useState } from 'react';
import { Check, X, Clock, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { Reservation } from '@/types/db';
import { promptAsync, confirmAsync } from '@/src/components/common/ConfirmModal';

interface ReservationManagerProps {
    reservations: Reservation[];
    onUpdateStatus: (id: string, status: Reservation['status'], reason?: string) => void;
}

export default function ReservationManager({ reservations, onUpdateStatus }: ReservationManagerProps) {
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const pendingReservations = reservations.filter(
        (reservation) => reservation.status === 'pending' || reservation.status === 'urgent'
    );

    const filteredList = reservations.filter((reservation) => {
        if (filter === 'all') return true;
        if (filter === 'pending') return reservation.status === 'pending' || reservation.status === 'urgent';
        return reservation.status === filter;
    });

    const handleApproveClick = async (id: string) => {
        if (processingId) return;
        const ok = await confirmAsync('예약을 확정하시겠습니까?', '예약 확정');
        if (!ok) return;
        setProcessingId(id);
        try {
            onUpdateStatus(id, 'confirmed');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectClick = async (id: string) => {
        if (processingId) return;
        const reason = await promptAsync('거절 사유를 입력해주세요', '예약 거절', {
            placeholder: '예: 예약 마감, 내부 사정',
        });
        if (reason !== null) {
            setProcessingId(id);
            try {
                onUpdateStatus(id, 'rejected', reason || undefined);
            } finally {
                setProcessingId(null);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            urgent: 'bg-red-100 text-red-800',
            confirmed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
            completed: 'bg-blue-100 text-blue-800',
        };
        const labels: Record<string, string> = {
            pending: '대기중',
            urgent: '긴급접수',
            confirmed: '확정됨',
            rejected: '거절됨',
            cancelled: '취소됨',
            completed: '방문완료',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b pb-4 overflow-x-auto">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    전체
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    대기중 ({pendingReservations.length})
                </button>
                <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-4 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    확정됨
                </button>
            </div>

            <div className="space-y-4">
                {filteredList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">예약 내역이 없습니다.</div>
                ) : (
                    filteredList.map((reservation) => (
                        <div key={reservation.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(reservation.status)}
                                    <span className="text-sm text-gray-500">
                                        {new Date(reservation.created_at || '').toLocaleDateString()} 요청
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {reservation.visitor_name}{' '}
                                    <span className="text-sm font-normal text-gray-500">({reservation.visitor_count}명)</span>
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={16} /> {reservation.visit_date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} /> {reservation.time_slot || reservation.visit_time || '시간 미정'}
                                    </div>
                                </div>
                                {(reservation.special_requests || reservation.request_note) && (
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 flex gap-2 mt-2">
                                        <MessageSquare size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                        "{reservation.special_requests || reservation.request_note}"
                                    </div>
                                )}
                                {reservation.rejection_reason && (
                                    <p className="text-sm text-red-600">거절 사유: {reservation.rejection_reason}</p>
                                )}
                            </div>

                            {(reservation.status === 'pending' || reservation.status === 'urgent') && (
                                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                                    <button
                                        onClick={() => reservation.id && handleApproveClick(reservation.id)}
                                        disabled={processingId === reservation.id}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingId === reservation.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                        확정하기
                                    </button>
                                    <button
                                        onClick={() => reservation.id && handleRejectClick(reservation.id)}
                                        disabled={processingId === reservation.id}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingId === reservation.id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                                        거절하기
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
