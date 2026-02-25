
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
        <div className="space-y-3">
            {consultations.map(item => {
                const isExpanded = expandedId === item.id;
                const isAnswered = item.status === 'accepted' || item.status === 'completed' || !!item.answer;
                const isUnread = !item.is_read;

                return (
                    <div key={item.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-primary/20 shadow-md' : 'hover:shadow-sm'}`}>
                        {/* Header Summary */}
                        <div
                            className="p-3 flex items-center justify-between cursor-pointer gap-2"
                            onClick={() => toggleExpand(item.id)}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isAnswered ? 'bg-green-100 text-green-600' :
                                    item.status === 'cancelled' ? 'bg-gray-100 text-gray-400' :
                                        'bg-amber-100 text-amber-600'
                                    }`}>
                                    {isAnswered ? <CheckCircle size={16} /> :
                                        item.status === 'cancelled' ? <XCircle size={16} /> :
                                            <Clock size={16} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-gray-900">{item.user_name || '익명'}</span>
                                        {isUnread && (
                                            <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full font-bold animate-pulse leading-none">N</span>
                                        )}
                                        <span className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-xs truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {item.notes || '문의 내용 없음'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-gray-400 flex-shrink-0">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-3 pb-3 border-t pt-3 bg-gray-50/50 rounded-b-xl">
                                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                    <div className="bg-white rounded-lg p-2 border">
                                        <span className="text-[10px] text-gray-400 block">연락처</span>
                                        <span className="font-medium text-gray-900">{item.user_phone || '미입력'}</span>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 border">
                                        <span className="text-[10px] text-gray-400 block">긴급도</span>
                                        <span className={`font-medium ${item.urgency === 'immediate' ? 'text-red-600' : item.urgency === 'within_week' ? 'text-amber-600' : 'text-gray-900'}`}>
                                            {item.urgency === 'immediate' ? '긴급(즉시)' :
                                             item.urgency === 'within_week' ? '1주 이내' :
                                             item.urgency === 'planning' ? '사전 준비' : item.urgency || '일반'}
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 border">
                                        <span className="text-[10px] text-gray-400 block">접수일</span>
                                        <span className="font-medium text-gray-900">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 border">
                                        <span className="text-[10px] text-gray-400 block">상태</span>
                                        <span className={`font-medium ${
                                            item.status === 'pending' ? 'text-amber-600' :
                                            item.status === 'accepted' || item.status === 'completed' ? 'text-green-600' :
                                            'text-gray-400'
                                        }`}>
                                            {item.status === 'pending' ? '대기중' :
                                             item.status === 'accepted' ? '답변완료' :
                                             item.status === 'completed' ? '완료' : '취소'}
                                        </span>
                                    </div>
                                    {item.scale && (
                                        <div className="bg-white rounded-lg p-2 border">
                                            <span className="text-[10px] text-gray-400 block">규모</span>
                                            <span className="font-medium text-gray-900">{item.scale}</span>
                                        </div>
                                    )}
                                    {item.religion && (
                                        <div className="bg-white rounded-lg p-2 border">
                                            <span className="text-[10px] text-gray-400 block">종교</span>
                                            <span className="font-medium text-gray-900">{item.religion}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white p-2.5 rounded-lg border mb-3">
                                    <span className="text-[10px] text-gray-400 block mb-1">문의 내용</span>
                                    <p className="text-gray-800 text-xs whitespace-pre-wrap leading-relaxed break-words">{item.notes}</p>
                                </div>

                                {/* Answer Section */}
                                {item.answer ? (
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="font-bold text-blue-800 text-xs">보낸 답변</span>
                                            <span className="text-[10px] text-blue-400">
                                                {item.answered_at ? new Date(item.answered_at).toLocaleString() : ''}
                                            </span>
                                        </div>
                                        <p className="text-blue-900 text-xs whitespace-pre-wrap break-words">{item.answer}</p>
                                    </div>
                                ) : item.status === 'cancelled' ? (
                                    <div className="text-center py-2 text-gray-400 text-xs">
                                        취소된 상담입니다.
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">답변 작성</label>
                                        <textarea
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="답변을 입력해주세요..."
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px] text-xs"
                                        />
                                        <div className="flex justify-end mt-1.5">
                                            <button
                                                onClick={() => handleSubmit(item.id)}
                                                disabled={isSubmitting || !answerText.trim()}
                                                className="bg-primary text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? <Clock size={14} className="animate-spin" /> : <Send size={14} />}
                                                전송
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
