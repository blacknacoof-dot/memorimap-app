import React, { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { getAuthClient } from '../../lib/supabaseClient';
import { approveReservation, rejectReservation } from '../../lib/queries';
import { Reservation } from '../../types';
import { toast } from 'sonner';
import { confirmAsync, promptAsync } from '@/src/components/common/ConfirmModal';
import type { Session } from '@supabase/supabase-js';

interface Props {
    reservations: Reservation[];
    setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
    session: Session | null;
}

export const PartnerReservationsTab: React.FC<Props> = ({ reservations, setReservations, session }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (id: string) => {
        if (processingId) return;
        if (!await confirmAsync('이 예약을 승인하시겠습니까?', '예약 승인')) return;
        setProcessingId(id);
        try {
            const client = await getAuthClient(session, { strict: true });
            await approveReservation(id, client);
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed' as const } : r));
            toast.success('예약이 승인되었습니다.');
        } catch {
            toast.error('예약 승인 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (processingId) return;
        const reason = await promptAsync('거절 사유를 입력해주세요', '예약 거절', { placeholder: '예: 예약 마감, 휴무일 등' });
        if (reason === null) return;
        setProcessingId(id);
        try {
            const client = await getAuthClient(session, { strict: true });
            await rejectReservation(id, reason || undefined, client);
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const, rejection_reason: reason || undefined } : r));
            toast.success('예약이 거절되었습니다.');
        } catch {
            toast.error('예약 거절 중 오류가 발생했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="text-blue-600" size={20} />
                    예약 관리
                </h2>
                <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100">
                        대기 {reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length}
                    </span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                        확정 {reservations.filter(r => r.status === 'confirmed').length}
                    </span>
                </div>
            </div>
            {reservations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                    <Calendar size={48} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm font-medium">접수된 예약이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reservations.map(res => (
                        <div key={res.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{res.visitor_name || '예약자'}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{res.contact_number || '연락처 없음'}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                    res.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    res.status === 'urgent' ? 'bg-red-100 text-red-700 animate-pulse' :
                                    res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {res.status === 'pending' ? '대기' : res.status === 'urgent' ? '긴급' : res.status === 'confirmed' ? '확정' : '취소'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <Calendar size={13} className="text-slate-400" />
                                    {res.visit_date ? new Date(res.visit_date).toLocaleDateString() : '-'}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <Clock size={13} className="text-slate-400" />
                                    {res.time_slot || '-'}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <User size={13} className="text-slate-400" />
                                    {res.visitor_count || 1}명
                                </div>
                            </div>
                            {res.purpose && (
                                <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{res.purpose}</p>
                            )}
                            {(res.status === 'pending' || res.status === 'urgent') && (
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => res.id && handleApprove(res.id)}
                                        disabled={processingId === res.id}
                                        className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <CheckCircle size={14} /> 승인
                                    </button>
                                    <button
                                        onClick={() => res.id && handleReject(res.id)}
                                        disabled={processingId === res.id}
                                        className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <XCircle size={14} /> 거절
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
