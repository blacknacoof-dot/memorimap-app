import React, { useState, useEffect } from 'react';
import {
    Settings2, MessageSquare, DollarSign,
    Sparkles, Save, ShieldCheck,
    Type, Globe, Plus, Trash2, Bot
} from 'lucide-react';
import { toast } from 'sonner'; // [Phase 2] Error Handler
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { Partner } from '../../types';

interface AIConfigurationProps {
    partnerId: string;
}

export const AIConfiguration: React.FC<AIConfigurationProps> = ({ partnerId }) => {
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { session } = useSession();

    useEffect(() => {
        loadPartner();
    }, [partnerId]);

    const loadPartner = async () => {
        const client = await getAuthClient(session);
        const { data } = await client
            .from('partners')
            .select('*')
            .eq('id', partnerId)
            .single();
        if (data) setPartner(data as Partner);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!partner) return;
        setSaving(true);
        const client = await getAuthClient(session);
        const { error } = await client
            .from('partners')
            .update({ ai_context: partner.ai_context })
            .eq('id', partnerId);

        if (!error) toast.success('AI 설정이 저장되었습니다.');
        setSaving(false);
    };

    const updateContext = (key: string, value: string | string[]) => {
        if (!partner) return;
        setPartner({
            ...partner,
            ai_context: {
                ...partner.ai_context,
                [key]: value
            }
        });
    };

    if (loading) return <div className="py-20 text-center text-slate-400">AI 컨텍스트 로딩 중...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-blue-600" />
                        AI 버튼 시나리오 설정
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">우리 회사만의 톤앤매너와 서비스 정보를 AI에게 학습시킵니다.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} /> {saving ? '저장 중...' : '설정 저장'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tone & Welcome */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm border-b border-slate-50 pb-4">
                        <Type className="text-blue-500" size={18} />
                        기본 페르소나
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">AI 첫인사 메시지</label>
                            <textarea
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="고객이 챗봇을 열었을 때 가장 먼저 보게 될 메시지입니다."
                                value={partner?.ai_context?.welcome_message || ''}
                                onChange={(e) => updateContext('welcome_message', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">상담 말투 (Tone)</label>
                            <select
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={partner?.ai_context?.tone || 'polite'}
                                onChange={(e) => updateContext('tone', e.target.value)}
                            >
                                <option value="polite">정중하고 격식 있는 (Standard)</option>
                                <option value="warm">따뜻하고 공감하는 (Empathetic)</option>
                                <option value="factual">핵심 위주의 신속한 (Concise)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing & Benefits */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm border-b border-slate-50 pb-4">
                        <DollarSign className="text-emerald-500" size={18} />
                        가격 및 서비스 요약
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">주요 상품 가격표 (AI 참고용)</label>
                            <textarea
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                                placeholder="예: 무궁화 3호: 390만원, 백합 1호: 450만원"
                                value={partner?.ai_context?.prices || ''}
                                onChange={(e) => updateContext('prices', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">핵심 강조 혜택 (Bullet points)</label>
                            <div className="space-y-2">
                                {(partner?.ai_context?.emphasis || []).map((emp, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs outline-none"
                                            value={emp}
                                            onChange={(e) => {
                                                const newEmp = [...(partner?.ai_context?.emphasis || [])];
                                                newEmp[i] = e.target.value;
                                                updateContext('emphasis', newEmp);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newEmp = (partner?.ai_context?.emphasis || []).filter((_, idx) => idx !== i);
                                                updateContext('emphasis', newEmp);
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500"
                                        ><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => updateContext('emphasis', [...(partner?.ai_context?.emphasis || []), ''])}
                                    className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    + 강조 사항 추가
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Critical Rules */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2 space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm border-b border-slate-50 pb-4">
                        <ShieldCheck className="text-red-500" size={18} />
                        보안 및 금기 사항
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">AI 금지 발언</label>
                            <p className="text-[10px] text-slate-400 mb-2">AI가 고객에게 절대 언급해서는 안 되는 내용입니다.</p>
                            <textarea
                                className="w-full bg-red-50/30 border-none rounded-2xl p-4 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-red-500/10 placeholder:text-red-200"
                                placeholder="예: 타사 비방 금지, 현금 결제 유도 금지"
                                value={partner?.ai_context?.forbidden ? partner.ai_context.forbidden.join(', ') : ''}
                                onChange={(e) => updateContext('forbidden', e.target.value.split(',').map(s => s.trim()))}
                            />
                        </div>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <h4 className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-2">
                                <Plus size={14} /> AI 고도화 팁
                            </h4>
                            <p className="text-[11px] text-blue-600 leading-relaxed">
                                AI 버튼 시나리오는 정적입니다. 하지만 여기서 설정된 <b>가격표</b>와 <b>혜택</b>은 AI가 버튼 이외의 텍스트 답변을 할 때 실시간으로 참조하여 신뢰도 높은 답변을 생성하는 기준이 됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
