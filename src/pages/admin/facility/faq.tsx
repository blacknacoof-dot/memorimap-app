import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useConfirmModal } from '../../../../components/common/ConfirmModal';

interface FAQItem {
    id: number;
    question: string;
    answer: string;
}

const FAQPage: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [editing, setEditing] = useState<FAQItem | null>(null);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const { open, close, isOpen, title, message, onConfirm } = useConfirmModal();

    // Load FAQs on mount
    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        const { data, error } = await supabase.from('bot_data').select('id, faq').maybeSingle();
        if (error) {
            console.error('Failed to fetch FAQs', error);
            return;
        }
        // Assume bot_data.faq is an array of {question, answer}
        const list = (data?.faq as any[]) || [];
        const mapped = list.map((item, idx) => ({ id: idx + 1, question: item.question, answer: item.answer }));
        setFaqs(mapped);
    };

    const handleSave = async () => {
        // Prepare payload
        const newFaq = { question, answer };
        const updated = editing ? faqs.map(f => (f.id === editing.id ? { ...f, ...newFaq } : f)) : [...faqs, { id: faqs.length + 1, ...newFaq }];
        // Save to supabase (replace whole faq array)
        const payload = { faq: updated.map(f => ({ question: f.question, answer: f.answer })) };
        const { error } = await supabase.from('bot_data').upsert(payload, { onConflict: 'id' });
        if (error) {
            console.error('Save failed', error);
        } else {
            setFaqs(updated);
            setQuestion('');
            setAnswer('');
            setEditing(null);
        }
    };

    const handleDelete = (id: number) => {
        open({
            title: 'FAQ 삭제 확인',
            message: '선택한 FAQ를 삭제하시겠습니까?',
            onConfirm: async () => {
                const filtered = faqs.filter(f => f.id !== id);
                const payload = { faq: filtered.map(f => ({ question: f.question, answer: f.answer })) };
                const { error } = await supabase.from('bot_data').upsert(payload, { onConflict: 'id' });
                if (!error) setFaqs(filtered);
                close();
            },
        });
    };

    const startEdit = (item: FAQItem) => {
        setEditing(item);
        setQuestion(item.question);
        setAnswer(item.answer);
    };

    const confirmSave = () => {
        open({
            title: editing ? 'FAQ 수정 확인' : 'FAQ 추가 확인',
            message: editing ? '수정 내용을 저장하시겠습니까?' : '새 FAQ를 저장하시겠습니까?',
            onConfirm: async () => {
                await handleSave();
                close();
            },
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">FAQ 관리</h2>
            <div className="space-y-4">
                {faqs.map(faq => (
                    <div key={faq.id} className="border p-3 rounded">
                        <p className="font-medium">Q: {faq.question}</p>
                        <p className="text-gray-600">A: {faq.answer}</p>
                        <div className="mt-2 flex gap-2">
                            <button onClick={() => startEdit(faq)} className="px-3 py-1 bg-blue-600 text-white rounded">수정</button>
                            <button onClick={() => handleDelete(faq.id)} className="px-3 py-1 bg-red-600 text-white rounded">삭제</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">{editing ? 'FAQ 수정' : '새 FAQ 추가'}</h3>
                <input
                    type="text"
                    placeholder="질문"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />
                <textarea
                    placeholder="답변"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={confirmSave} className="px-4 py-2 bg-green-600 text-white rounded">
                    {editing ? '수정 저장' : '추가 저장'}
                </button>
            </div>
            {/* ConfirmModal is rendered globally via its own component import elsewhere */}
        </div>
    );
};

export default FAQPage;
