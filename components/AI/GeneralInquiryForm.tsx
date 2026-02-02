import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface FormProps {
    onSubmit: (data: { text: string, data: any }) => void;
    onClose?: () => void;
    currentUser?: any;
}

const GeneralInquiryForm: React.FC<FormProps> = ({ onSubmit, onClose, currentUser }) => {
    const [category, setCategory] = useState<'consult' | 'partnership' | 'error' | ''>('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!category) return setError('문의 유형을 선택해 주세요.');
        if (!content.trim()) return setError('문의 내용을 입력해 주세요.');

        setIsSaving(true);

        try {
            const categoryLabel = {
                consult: '일반 상담',
                partnership: '제휴 문의',
                error: '오류 신고'
            }[category];

            const finalText = `[📞 일반 문의 접수]\n유형: ${categoryLabel}\n내용: ${content}`;
            const searchData = {
                category: 'general',
                inquiry_type: category,
                inquiry_text: content,
                urgency: 'inquiry'
            };

            // 1. AI 채팅에 메시지 전송 (기존)
            onSubmit({ text: finalText, data: searchData });

            // 2. 슈퍼관리자에게 저장 (신규) - AI 분석 없음
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);

                const { error: dbError } = await supabase
                    .from('admin_notifications')
                    .insert([{
                        type: 'general_inquiry',
                        user_id: currentUser?.id || null,
                        inquiry_type: category,
                        inquiry_text: content,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    }]);

                if (dbError) {
                    console.error('Failed to save notification:', dbError);
                }
            }
        } catch (err) {
            console.error('Submit error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 w-full">
            {/* Header / Intro */}
            <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs shrink-0">
                    AI
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 max-w-[85%] shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed">
                        <strong>무엇을 도와드릴까요?</strong><br />
                        문의 유형을 선택하시고 내용을 남겨주시면 담당자가 확인 후 연락드립니다.
                    </p>
                </div>
            </div>

            <div className="pl-10 space-y-3">
                {/* Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => { setCategory('consult'); setError(''); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${category === 'consult' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <MessageSquare size={18} />
                        <span className="text-xs font-bold">일반 상담</span>
                    </button>
                    <button
                        onClick={() => { setCategory('partnership'); setError(''); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${category === 'partnership' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <Phone size={18} />
                        <span className="text-xs font-bold">제휴 문의</span>
                    </button>
                    <button
                        onClick={() => { setCategory('error'); setError(''); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${category === 'error' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <AlertCircle size={18} />
                        <span className="text-xs font-bold">오류 신고</span>
                    </button>
                </div>

                {/* Text Area */}
                <div className="relative">
                    <textarea
                        value={content}
                        onChange={(e) => { setContent(e.target.value); setError(''); }}
                        placeholder="문의 내용을 자유롭게 입력해 주세요."
                        className="w-full h-24 bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-600 focus:outline-none resize-none"
                    />
                </div>

                {error && <div className="flex items-center gap-1.5 text-red-500 text-[10px] animate-pulse"><AlertCircle size={10} /><span>{error}</span></div>}

                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <Check size={16} /> {isSaving ? '전송 중...' : '문의 접수하기'}
                </button>
            </div>
        </div>
    );
};

export default GeneralInquiryForm;
