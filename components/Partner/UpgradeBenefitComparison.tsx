import React from 'react';
import { ArrowRight, Check, X, Sparkles } from 'lucide-react';
import type { Subscription } from '../../types/db';

interface BenefitRow {
    label: string;
    current: string | boolean;
    next: string | boolean;
}

interface PlanInfo {
    id: string;
    name: string;
    price: number;
    commission: number;
    features: string[];
}

const SANGJO_PLANS: PlanInfo[] = [
    {
        id: 'sj_starter', name: 'STARTER', price: 3000000, commission: 10,
        features: ['AI 24시간 자동 상담', 'AI 계약 클로징 유도', '독점 혜택권 발행', '기본 리포트', '일반 노출'],
    },
    {
        id: 'sj_professional', name: 'PROFESSIONAL', price: 8000000, commission: 8,
        features: ['우선 노출', '고급 CRM 관리툴', '실시간 전환 대시보드', '전담 CS 지원', '주간 상세 리포트', '사은품 패키지'],
    },
    {
        id: 'sj_enterprise', name: 'ENTERPRISE', price: 15000000, commission: 5,
        features: ['메인 배너 독점 광고', '완전 자동 계약', '전담 매니저 1:1', '커스텀 브랜딩', 'API 연동 무제한', '최적화 컨설팅'],
    },
];

function getCurrentPlanIndex(subscription: Subscription | null): number {
    if (!subscription?.plan_id) return -1;
    return SANGJO_PLANS.findIndex(p => p.id === subscription.plan_id);
}

function buildBenefitRows(current: PlanInfo, next: PlanInfo): BenefitRow[] {
    const rows: BenefitRow[] = [
        { label: '수수료율', current: `${current.commission}%`, next: `${next.commission}% (${current.commission - next.commission}%p 절감)` },
        { label: '월 구독료', current: `${current.price.toLocaleString()}원`, next: `${next.price.toLocaleString()}원` },
    ];
    const allFeatures = [...new Set([...current.features, ...next.features])];
    for (const feat of allFeatures) {
        rows.push({
            label: feat,
            current: current.features.includes(feat),
            next: next.features.includes(feat),
        });
    }
    return rows;
}

interface Props {
    subscription: Subscription | null;
    onUpgrade: () => void;
}

export const UpgradeBenefitComparison: React.FC<Props> = ({ subscription, onUpgrade }) => {
    const currentIdx = getCurrentPlanIndex(subscription);
    if (currentIdx < 0 || currentIdx >= SANGJO_PLANS.length - 1) return null;

    const current = SANGJO_PLANS[currentIdx];
    const next = SANGJO_PLANS[currentIdx + 1];
    const rows = buildBenefitRows(current, next);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                업그레이드 혜택 비교
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[360px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left py-3 px-2 text-[11px] font-bold text-slate-400 uppercase w-1/3"></th>
                            <th className="text-center py-3 px-2 text-[11px] font-bold text-slate-500 uppercase">
                                현재 ({current.name})
                            </th>
                            <th className="text-center py-3 px-2">
                                <ArrowRight size={14} className="mx-auto text-slate-300" />
                            </th>
                            <th className="text-center py-3 px-2 text-[11px] font-bold text-blue-600 uppercase">
                                {next.name}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2.5 px-2 text-xs font-medium text-slate-700">{row.label}</td>
                                <td className="py-2.5 px-2 text-center">
                                    {typeof row.current === 'boolean' ? (
                                        row.current
                                            ? <Check size={16} className="mx-auto text-emerald-500" />
                                            : <X size={16} className="mx-auto text-slate-300" />
                                    ) : (
                                        <span className="text-xs text-slate-600">{row.current}</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-2" />
                                <td className="py-2.5 px-2 text-center">
                                    {typeof row.next === 'boolean' ? (
                                        row.next
                                            ? <Check size={16} className="mx-auto text-emerald-500" />
                                            : <X size={16} className="mx-auto text-slate-300" />
                                    ) : (
                                        <span className="text-xs font-bold text-blue-600">{row.next}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-5 text-center">
                <button
                    onClick={onUpgrade}
                    className="px-6 py-3 min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                    {next.name} 시작하기
                </button>
            </div>
        </div>
    );
};
