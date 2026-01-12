import React, { useState, useEffect } from 'react';
import { useConfirmModal } from '../src/components/common/ConfirmModal';
import { Plus, Edit, Trash, Save, X } from 'lucide-react';

interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export const FacilityFAQManager: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ question: string; answer: string }>({ question: '', answer: '' });
    const confirmModal = useConfirmModal();

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('facility_faqs');
        if (saved) {
            setFaqs(JSON.parse(saved));
        } else {
            // Initial Seed Data if empty
            const seeds = [
                { id: '1', question: '주차는 가능한가요?', answer: '네, 50대까지 가능합니다.' },
                { id: '2', question: '방문 시간은 언제인가요?', answer: '오전 9시부터 오후 6시까지입니다.' }
            ];
            setFaqs(seeds);
            localStorage.setItem('facility_faqs', JSON.stringify(seeds));
        }
    }, []);

    const saveToStorage = (newFaqs: FAQ[]) => {
        localStorage.setItem('facility_faqs', JSON.stringify(newFaqs));
        setFaqs(newFaqs);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingId(faq.id);
        setEditForm({ question: faq.question, answer: faq.answer });
    };

    const handleSave = () => {
        confirmModal.open({
            title: 'FAQ 저장',
            message: '변경사항을 저장하시겠습니까?',
            requireCheckbox: false,
            onConfirm: () => {
                let newFaqs: FAQ[];
                if (editingId === 'new') {
                    const newFaq = {
                        id: Date.now().toString(),
                        ...editForm
                    };
                    newFaqs = [...faqs, newFaq];
                } else {
                    newFaqs = faqs.map(f => f.id === editingId ? { ...f, ...editForm } : f);
                }
                saveToStorage(newFaqs);
                setEditingId(null);
                setEditForm({ question: '', answer: '' });
            }
        });
    };

    const handleDelete = (id: string) => {
        confirmModal.open({
            title: 'FAQ 삭제',
            message: '정말로 삭제하시겠습니까?',
            requireCheckbox: false,
            onConfirm: () => {
                const newFaqs = faqs.filter(f => f.id !== id);
                saveToStorage(newFaqs);
            }
        });
    };

    const handleAdd = () => {
        setEditingId('new');
        setEditForm({ question: '', answer: '' });
    };

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
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                                data-testid="save-button"
                            >
                                <Save size={14} /> 저장
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
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                                        data-testid="save-button"
                                    >
                                        <Save size={14} /> 저장
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
