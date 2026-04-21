import React from 'react';
import { ClipboardList } from 'lucide-react';
import { ConsultationList } from '../ConsultationList';
import { getAuthClient } from '../../lib/supabaseClient';
import { Consultation } from '../../lib/queries';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { persistReadSangjoContractId } from './sangjoContractState';

interface Props {
    consultations: Consultation[];
    setConsultations: React.Dispatch<React.SetStateAction<Consultation[]>>;
    session: Session | null;
}

export const PartnerConsultationsTab: React.FC<Props> = ({ consultations, setConsultations, session }) => {
    const handleAnswer = async (id: string, text: string) => {
        const client = await getAuthClient(session, { strict: true });
        const target = consultations.find(c => c.id === id);

        if (target?.source === 'sangjo_contract') {
            const { error } = await client
                .from('sangjo_contracts')
                .update({ status: '계약진행', assigned_counselor: text })
                .eq('id', id);
            if (!error) {
                persistReadSangjoContractId(session?.user?.id, target.facility_id, id);
                setConsultations(prev => prev.map(c =>
                    c.id === id ? { ...c, answer: text, answered_at: new Date().toISOString(), status: 'accepted' as const, is_read: true } : c
                ));
                toast.success('상조 상담 답변이 전송되었습니다.');
            } else { toast.error('답변 전송 실패'); }
        } else {
            const { error } = await client
                .from('consultations')
                .update({ answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true })
                .eq('id', id);
            if (!error) {
                setConsultations(prev => prev.map(c =>
                    c.id === id ? { ...c, answer: text, answered_at: new Date().toISOString(), status: 'accepted' as const, is_read: true } : c
                ));
                toast.success('답변이 전송되었습니다.');
            } else { toast.error('답변 전송 실패'); }
        }
    };

    const handleRead = async (id: string) => {
        const target = consultations.find(c => c.id === id);
        if (target?.source === 'sangjo_contract') {
            persistReadSangjoContractId(session?.user?.id, target.facility_id, id);
            setConsultations(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
        } else {
            const client = await getAuthClient(session, { strict: true });
            await client.from('consultations').update({ is_read: true }).eq('id', id);
            setConsultations(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <ClipboardList className="text-blue-600" size={20} />
                    상담 문의 관리
                </h2>
                <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100">
                        대기 {consultations.filter(c => c.status === 'pending' || c.status === 'waiting').length}
                    </span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                        완료 {consultations.filter(c => c.status === 'accepted' || c.status === 'completed').length}
                    </span>
                </div>
            </div>
            <ConsultationList
                consultations={consultations}
                onAnswer={handleAnswer}
                onRead={handleRead}
            />
        </div>
    );
};
