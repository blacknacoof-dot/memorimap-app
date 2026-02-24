import React, { useState, useEffect } from 'react';
import { useSession } from '../lib/auth';
import { useConfirmModal } from '../src/components/common/ConfirmModal';
import { Plus, Edit, Trash, Save, Loader2 } from 'lucide-react';
import { getFacilityFaqs } from '../lib/queries';
import { getAuthClient } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order_index?: number;
}

interface Props {
    facilityId?: string;
}

export const FacilityFAQManager: React.FC<Props> = ({ facilityId }) => {
    const { session } = useSession();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ question: string; answer: string }>({ question: '', answer: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const confirmModal = useConfirmModal();

    useEffect(() => {
        loadFaqs();
    }, [facilityId]);

    const loadFaqs = async () => {
        if (!facilityId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const client = await getAuthClient(session);
            const { data, error } = await client
                .from('facility_faqs')
                .select('*')
                .eq('facility_id', facilityId)
                .eq('is_active', true)
                .order('order_index', { ascending: true });
            if (error) {
                console.warn('[FAQ] loadFaqs error:', error);
            }
            setFaqs((data || []).map((d: { id: string; question: string; answer: string; order_index?: number }) => ({ id: d.id, question: d.question, answer: d.answer, order_index: d.order_index })));
        } catch {
            toast.error('FAQ 로딩 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (faq: FAQ) => {
        setEditingId(faq.id);
        setEditForm({ question: faq.question, answer: faq.answer });
    };

    const handleSave = () => {
        if (!editForm.question.trim() || !editForm.answer.trim()) {
            toast.error('질문과 답변을 모두 입력해주세요.');
            return;
        }
        confirmModal.open({
            title: 'FAQ 저장',
            message: '변경사항을 저장하시겠습니까?',
            requireCheckbox: false,
            onConfirm: async () => {
                if (!facilityId) return;
                setIsSaving(true);
                try {
                    const client = await getAuthClient(session);
                    let result: FAQ | null = null;
                    let error: { message: string } | null = null;

                    if (editingId === 'new') {
                        // INSERT 새 FAQ
                        const { data, error: insertErr } = await client
                            .from('facility_faqs')
                            .insert({
                                facility_id: facilityId,
                                question: editForm.question,
                                answer: editForm.answer,
                                order_index: faqs.length,
                                is_active: true,
                            })
                            .select()
                            .single();
                        result = data;
                        error = insertErr;
                    } else {
                        // UPDATE 기존 FAQ
                        const { data, error: updateErr } = await client
                            .from('facility_faqs')
                            .update({
                                question: editForm.question,
                                answer: editForm.answer,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', editingId)
                            .select()
                            .single();
                        result = data;
                        error = updateErr;
                    }

                    if (error) {
                        console.error('[FAQ] save error:', error);
                        toast.error(`FAQ 저장 실패: ${error.message}`);
                    } else if (result) {
                        toast.success('FAQ가 저장되었습니다.');
                        await loadFaqs();
                    } else {
                        toast.error('FAQ 저장 실패: 응답 없음');
                    }
                } catch {
                    toast.error('FAQ 저장 중 오류 발생');
                } finally {
                    setIsSaving(false);
                    setEditingId(null);
                    setEditForm({ question: '', answer: '' });
                }
            }
        });
    };

    const handleDelete = (id: string) => {
        confirmModal.open({
            title: 'FAQ 삭제',
            message: '정말로 삭제하시겠습니까?',
            requireCheckbox: false,
            onConfirm: async () => {
                const client = await getAuthClient(session);
                const { error } = await client
                    .from('facility_faqs')
                    .update({ is_active: false })
                    .eq('id', id);
                const success = !error;
                if (error) console.error('[FAQ] delete error:', error);
                if (success) {
                    toast.success('FAQ가 삭제되었습니다.');
                    setFaqs(prev => prev.filter(f => f.id !== id));
                } else {
                    toast.error('FAQ 삭제 실패');
                }
            }
        });
    };

    const handleAdd = () => {
        setEditingId('new');
        setEditForm({ question: '', answer: '' });
    };

    if (isLoading) {
        return (
            <div className="text-center py-10">
                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                <p className="text-gray-400 text-sm mt-3">FAQ 로딩 중...</p>
            </div>
        );
    }

    if (!facilityId) {
        return (
            <div className="text-center py-8 text-gray-500">
                시설 정보를 불러올 수 없습니다.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">FAQ 관리</h2>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> 새 질문 추가
                </button>
            </div>

            <div className="space-y-4" data-testid="faq-list">
                {editingId === 'new' && (
                    <div className="border rounded-xl p-4 bg-blue-50 space-y-3">
                        <input
                            type="text"
                            placeholder="질문 입력"
                            className="w-full p-2 border rounded-lg"
                            value={editForm.question}
                            onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                            data-testid="faq-input"
                        />
                        <textarea
                            placeholder="답변 입력"
                            className="w-full p-2 border rounded-lg h-24"
                            value={editForm.answer}
                            onChange={e => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1 disabled:opacity-50"
                                data-testid="save-button"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
                            </button>
                        </div>
                    </div>
                )}

                {faqs.map(faq => (
                    <div key={faq.id} className="border rounded-xl p-4 hover:border-blue-300 transition-colors">
                        {editingId === faq.id ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg font-bold"
                                    value={editForm.question}
                                    onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                                    data-testid="faq-input"
                                />
                                <textarea
                                    className="w-full p-2 border rounded-lg h-24"
                                    value={editForm.answer}
                                    onChange={e => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1 disabled:opacity-50"
                                        data-testid="save-button"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">Q. {faq.question}</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(faq)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            data-testid="edit-button"
                                            title="수정"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(faq.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="삭제"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm whitespace-pre-wrap">A. {faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}

                {faqs.length === 0 && editingId !== 'new' && (
                    <div className="text-center py-8 text-gray-500">
                        등록된 FAQ가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};
