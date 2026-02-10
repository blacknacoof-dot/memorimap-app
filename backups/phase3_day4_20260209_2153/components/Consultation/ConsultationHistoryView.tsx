import React, { useEffect, useState } from 'react';
import { useUser } from '../../lib/auth';
import { getConsultationHistory, deleteConsultation } from '../../lib/queries';
import { Consultation } from '../../types/consultation';
import { MessageSquare, Clock, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Facility } from '../../types';

interface Props {
    facilities: Facility[];
    onBack: () => void;
    onSelectConsultation: (consultation: Consultation) => void;
}

export const ConsultationHistoryView: React.FC<Props> = ({ facilities, onBack, onSelectConsultation }) => {
    const { user } = useUser();
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getConsultationHistory(user.id);
            setHistory(data);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('정말 이 상담 내역을 삭제하시겠습니까?')) return;
        try {
            await deleteConsultation(id);
            setHistory(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="font-bold text-lg">상담 히스토리</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                        <p>진행된 상담 내역이 없습니다.</p>
                    </div>
                ) : (
                    history.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onSelectConsultation(item)}
                            className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">
                                    {item.topic}
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{item.facilityName}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {item.messages[item.messages.length - 1]?.text || "(대화 내용 없음)"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                                <Clock size={12} />
                                <span>{item.updatedAt.toLocaleDateString()} {item.updatedAt.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
