
import React, { useState } from 'react';
import { Consultation } from '../lib/queries';
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    consultations: Consultation[];
    onAnswer: (id: string, answer: string) => Promise<void>;
    onRead?: (id: string) => void;
}

export const ConsultationList: React.FC<Props> = ({ consultations, onAnswer, onRead }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setAnswerText('');
        } else {
            setExpandedId(id);
            setAnswerText('');

            // Mark as read if expanding
            const item = consultations.find(c => c.id === id);
            if (item && !item.is_read && onRead) {
                onRead(id);
            }
        }
    };

    const handleSubmit = async (id: string) => {
        if (!answerText.trim()) {
            toast.error('답변 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onAnswer(id, answerText);
            setAnswerText('');
            // Optional: Close expansion or keep open to show result?
            // Keep open to show "Answered just now" logic if parent updates state
        } catch (e) {
            console.error(e);
            toast.error('답변 전송 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (consultations.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-400">
                <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
                <p>접수된 상담 문의가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {consultations.map(item => {
                const isExpanded = expandedId === item.id;
                const isAnswered = item.status === 'accepted' || item.status === 'completed' || !!item.answer;
                const isUnread = !item.is_read;

                return (
                    <div key={item.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'ring-2 ring-primary/20 shadow-md' : 'hover:shadow-sm'}`}>
                        {/* Header Summary */}
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleExpand(item.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnswered ? 'bg-green-100 text-green-600' :
                                    item.status === 'cancelled' ? 'bg-gray-100 text-gray-400' :
                                        'bg-amber-100 text-amber-600'
                                    }`}>
                                    {isAnswered ? <CheckCircle size={20} /> :
                                        item.status === 'cancelled' ? <XCircle size={20} /> :
                                            <Clock size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{item.user_name || '익명 사용자'}</span>
                                        {isUnread && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">NEW</span>
                                        )}
                                        <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                        {item.urgency === 'deceased' && (
                                            <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">긴급</span>
                                        )}
                                    </div>
                                    <p className={`text-sm truncate max-w-xs sm:max-w-md ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                        {item.notes || '문의 내용 없음'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-gray-400">
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-4 pb-4 border-t pt-4 bg-gray-50/50 rounded-b-xl">
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div>
                                        <span className="text-gray-500 block mb-1">연락처</span>
                                        <span className="font-medium">{item.user_phone || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block mb-1">장례 규모</span>
                                        <span className="font-medium">{item.scale || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block mb-1">종교</span>
                                        <span className="font-medium">{item.religion || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block mb-1">장례 일정</span>
                                        <span className="font-medium">{item.schedule || '-'}</span>
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border mb-4">
                                    <span className="text-xs text-gray-400 block mb-1">문의 내용</span>
                                    <p className="text-gray-800 whitespace-pre-wrap">{item.notes}</p>
                                </div>

                                {/* Answer Section */}
                                {item.answer ? (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-blue-800 text-sm">보낸 답변</span>
                                            <span className="text-xs text-blue-400">
                                                {item.answered_at ? new Date(item.answered_at).toLocaleString() : ''}
                                            </span>
                                        </div>
                                        <p className="text-blue-900 text-sm whitespace-pre-wrap">{item.answer}</p>
                                    </div>
                                ) : item.status === 'cancelled' ? (
                                    <div className="text-center py-2 text-gray-400 text-sm">
                                        취소된 상담입니다.
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">답변 작성하기</label>
                                        <textarea
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="상담 문의에 대한 답변을 입력해주세요..."
                                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] text-sm"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={() => handleSubmit(item.id)}
                                                disabled={isSubmitting || !answerText.trim()}
                                                className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                                                답변 전송
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
