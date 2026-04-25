import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Type, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClient } from '../../../lib/supabaseClient';
import { useSession } from '../../../lib/auth';

interface AIContext {
    welcome_message?: string;
    tone?: string;
    emphasis?: string[];
    forbidden?: string[];
}

interface AISettingsSectionProps {
    facilityId: string;
    isSangjo?: boolean;
}

export const AISettingsSection: React.FC<AISettingsSectionProps> = ({ facilityId, isSangjo = false }) => {
    const [aiContext, setAiContext] = useState<AIContext>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { session } = useSession();

    useEffect(() => {
        const loadAiContext = async () => {
            const client = await getAuthClient(session, { strict: true });
            const { data } = await client
                .from('facilities')
                .select('ai_context, ai_welcome_message')
                .eq('id', facilityId)
                .single();
            if (data?.ai_context) {
                const ctx = typeof data.ai_context === 'string'
                    ? JSON.parse(data.ai_context)
                    : data.ai_context;
                setAiContext(ctx as AIContext);
            } else if (data?.ai_welcome_message) {
                setAiContext({ welcome_message: data.ai_welcome_message as string });
            }
            setLoading(false);
        };
        loadAiContext();
    }, [facilityId, session]);

    const updateField = (key: string, value: string | string[]) => {
        setAiContext(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        const client = await getAuthClient(session, { strict: true });
        const { error } = await client
            .from('facilities')
            .update({
                ai_context: aiContext,
                ...(isSangjo ? { ai_welcome_message: aiContext.welcome_message || null } : {}),
            })
            .eq('id', facilityId);

        if (error) {
            toast.error('AI 설정 저장에 실패했습니다.');
        } else {
            toast.success('AI 설정이 저장되었습니다.');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <p className="text-center text-slate-400 text-sm">AI 설정 로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-600" />
                    AI 챗봇 설정
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    <Save size={14} />
                    {saving ? '저장 중...' : 'AI 설정 저장'}
                </button>
            </div>
            <div className="p-6 space-y-6">
                <p className="text-xs text-slate-400 font-medium">
                    AI 챗봇의 톤앤매너와 응대 규칙을 설정합니다. 시설 기본 정보(소개, 가격)는 위 섹션에서 관리됩니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 첫인사 & 말투 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                            <Type size={16} className="text-blue-500" />
                            기본 페르소나
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">AI 첫인사 메시지</label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent"
                                placeholder="고객이 챗봇을 열었을 때 가장 먼저 보게 될 메시지입니다."
                                value={aiContext?.welcome_message || ''}
                                onChange={e => updateField('welcome_message', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">상담 말투 (Tone)</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent"
                                value={aiContext?.tone || 'polite'}
                                onChange={e => updateField('tone', e.target.value)}
                            >
                                <option value="polite">정중하고 격식 있는 (Standard)</option>
                                <option value="warm">따뜻하고 공감하는 (Empathetic)</option>
                                <option value="factual">핵심 위주의 신속한 (Concise)</option>
                            </select>
                        </div>
                    </div>

                    {/* 강조사항 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                            <Plus size={16} className="text-emerald-500" />
                            핵심 강조 혜택
                        </div>
                        <div className="space-y-2">
                            {(aiContext?.emphasis || []).map((emp, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-transparent"
                                        value={emp}
                                        onChange={e => {
                                            const newEmp = [...(aiContext?.emphasis || [])];
                                            newEmp[i] = e.target.value;
                                            updateField('emphasis', newEmp);
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newEmp = (aiContext?.emphasis || []).filter((_, idx) => idx !== i);
                                            updateField('emphasis', newEmp);
                                        }}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => updateField('emphasis', [...(aiContext?.emphasis || []), ''])}
                                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                + 강조 사항 추가
                            </button>
                        </div>
                    </div>
                </div>

                {/* 금지 발언 */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
                        <ShieldCheck size={16} className="text-red-500" />
                        AI 금지 발언
                    </div>
                    <p className="text-[10px] text-slate-400">AI가 고객에게 절대 언급해서는 안 되는 내용입니다.</p>
                    <textarea
                        className="w-full bg-red-50/30 border border-red-100 rounded-xl p-3 text-sm min-h-[60px] outline-none focus:ring-2 focus:ring-red-500/10 focus:border-transparent placeholder:text-red-200"
                        placeholder="예: 타사 비방 금지, 현금 결제 유도 금지 (쉼표로 구분)"
                        value={aiContext?.forbidden ? aiContext.forbidden.join(', ') : ''}
                        onChange={e => updateField('forbidden', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    />
                </div>
            </div>
        </div>
    );
};
