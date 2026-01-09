import { useState } from 'react';
import { Check, X, Clock, Calendar, MessageSquare } from 'lucide-react';
import { Reservation } from '@/types/db';

interface ReservationManagerProps {
    reservations: Reservation[];
    onUpdateStatus: (id: string, status: Reservation['status'], reason?: string) => void;
}

export default function ReservationManager({ reservations, onUpdateStatus }: ReservationManagerProps) {
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

    const filteredList = reservations.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'pending') return r.status === 'pending' || r.status === 'urgent';
        return r.status === filter;
    });

    const handleRejectClick = (id: string) => {
        const reason = prompt("거절 사유를 입력해주세요 (예: 예약 마감, 휴무일 등)");
        if (reason) {
            onUpdateStatus(id, 'rejected', reason);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            urgent: 'bg-red-100 text-red-800', // Added urgent style
            confirmed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
            completed: 'bg-blue-100 text-blue-800',
        };
        const labels: Record<string, string> = {
            pending: '대기중', urgent: '긴급접수', confirmed: '확정됨', rejected: '거절됨', cancelled: '취소됨', completed: '방문완료'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* 필터 탭 */}
            <div className="flex gap-2 border-b pb-4">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>전체</button>
                <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>대기중 ({reservations.filter(r => r.status === 'pending').length})</button>
                <button onClick={() => setFilter('confirmed')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>확정됨</button>
            </div>

            {/* 예약 리스트 */}
            <div className="space-y-4">
                {filteredList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">예약 내역이 없습니다.</div>
                ) : (
                    filteredList.map((res) => (
                        <div key={res.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(res.status)}
                                    <span className="text-sm text-gray-500">{new Date(res.created_at || '').toLocaleDateString()} 신청</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {res.visitor_name} <span className="text-sm font-normal text-gray-500">({res.visitor_count}명)</span>
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1"><Calendar size={16} /> {res.visit_date}</div>
                                    <div className="flex items-center gap-1"><Clock size={16} /> {res.time_slot || res.visit_time || '시간 미지정'}</div>
                                </div>
                                {(res.special_requests || res.request_note) && (
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 flex gap-2 mt-2">
                                        <MessageSquare size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                        "{res.special_requests || res.request_note}"
                                    </div>
                                )}
                                {res.rejection_reason && (
                                    <p className="text-sm text-red-600">⛔ 거절 사유: {res.rejection_reason}</p>
                                )}
                            </div>

                            {/* 액션 버튼 (대기중/긴급 일 때만 표시) */}
                            {(res.status === 'pending' || res.status === 'urgent') && (
                                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                                    <button
                                        onClick={() => res.id && onUpdateStatus(res.id, 'confirmed')}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                    >
                                        <Check size={18} /> 승인하기
                                    </button>
                                    <button
                                        onClick={() => res.id && handleRejectClick(res.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        <X size={18} /> 거절하기
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
