import React, { useState, useMemo } from 'react';
import { Calculator, TrendingDown, Lightbulb } from 'lucide-react';
import type { Subscription } from '../../types/db';
import { useSystemSettings } from '../../hooks/useSystemSettings';

const COMMISSION_KEYS = [
    'sj_starter_commission',
    'sj_professional_commission',
    'sj_enterprise_commission',
] as const;

const COMMISSION_DEFAULTS: Record<string, number> = {
    sj_starter_commission: 10,
    sj_professional_commission: 8,
    sj_enterprise_commission: 5,
};

interface PlanCost {
    name: string;
    commission: number;
    subscriptionFee: number;
    monthlyCommission: number;
    totalCost: number;
}

const PLAN_FEES: Record<string, { name: string; fee: number; settingsKey: string }> = {
    sj_starter: { name: 'STARTER', fee: 3000000, settingsKey: 'sj_starter_commission' },
    sj_professional: { name: 'PROFESSIONAL', fee: 8000000, settingsKey: 'sj_professional_commission' },
    sj_enterprise: { name: 'ENTERPRISE', fee: 15000000, settingsKey: 'sj_enterprise_commission' },
};

const CONTRACT_AMOUNT_OPTIONS = [
    { label: '300만원', value: 3000000 },
    { label: '500만원', value: 5000000 },
    { label: '700만원', value: 7000000 },
    { label: '1,000만원', value: 10000000 },
];

interface Props {
    subscription: Subscription | null;
}

export const CommissionSimulator: React.FC<Props> = ({ subscription }) => {
    const currentPlanId = subscription?.plan_id ?? '';
    const isVisible = !!currentPlanId && !!PLAN_FEES[currentPlanId] && currentPlanId !== 'sj_enterprise';

    const { getNumber } = useSystemSettings([...COMMISSION_KEYS]);
    const [monthlyContracts, setMonthlyContracts] = useState(30);
    const [contractAmount, setContractAmount] = useState(5000000);

    const currentPlan = PLAN_FEES[currentPlanId] ?? PLAN_FEES['sj_starter'];
    const nextPlanId = currentPlanId === 'sj_starter' ? 'sj_professional' : 'sj_enterprise';
    const nextPlan = PLAN_FEES[nextPlanId] ?? PLAN_FEES['sj_professional'];

    const results = useMemo((): { current: PlanCost; next: PlanCost; saving: number; breakEven: number } => {
        const currentCommRate = getNumber(currentPlan.settingsKey, COMMISSION_DEFAULTS[currentPlan.settingsKey]);
        const nextCommRate = getNumber(nextPlan.settingsKey, COMMISSION_DEFAULTS[nextPlan.settingsKey]);

        const currentMonthlyComm = monthlyContracts * contractAmount * (currentCommRate / 100);
        const nextMonthlyComm = monthlyContracts * contractAmount * (nextCommRate / 100);

        const currentTotal = currentMonthlyComm + currentPlan.fee;
        const nextTotal = nextMonthlyComm + nextPlan.fee;
        const saving = currentTotal - nextTotal;

        // 손익분기점: (nextFee - currentFee) / (contractAmount * (currentRate - nextRate) / 100)
        const rateDiff = (currentCommRate - nextCommRate) / 100;
        const feeDiff = nextPlan.fee - currentPlan.fee;
        const breakEven = rateDiff > 0 ? Math.ceil(feeDiff / (contractAmount * rateDiff)) : 0;

        return {
            current: {
                name: currentPlan.name,
                commission: currentCommRate,
                subscriptionFee: currentPlan.fee,
                monthlyCommission: currentMonthlyComm,
                totalCost: currentTotal,
            },
            next: {
                name: nextPlan.name,
                commission: nextCommRate,
                subscriptionFee: nextPlan.fee,
                monthlyCommission: nextMonthlyComm,
                totalCost: nextTotal,
            },
            saving,
            breakEven,
        };
    }, [monthlyContracts, contractAmount, getNumber, currentPlan, nextPlan]);

    if (!isVisible) return null;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
                <Calculator size={18} className="text-indigo-600" />
                수수료 절감 시뮬레이터
            </h3>

            {/* 입력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">
                        월 평균 계약 건수
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={5}
                            max={100}
                            step={5}
                            value={monthlyContracts}
                            onChange={(e) => setMonthlyContracts(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-sm font-black text-slate-800 min-w-[50px] text-right">
                            {monthlyContracts}건
                        </span>
                    </div>
                </div>
                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">
                        건당 평균 계약금
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CONTRACT_AMOUNT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setContractAmount(opt.value)}
                                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-colors ${
                                    contractAmount === opt.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 비교 테이블 */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[340px]">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left py-2.5 px-2 text-[11px] font-bold text-slate-400 uppercase"></th>
                            <th className="text-right py-2.5 px-2 text-[11px] font-bold text-slate-500 uppercase">
                                현재 ({results.current.name})
                            </th>
                            <th className="text-right py-2.5 px-2 text-[11px] font-bold text-indigo-600 uppercase">
                                {results.next.name}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        <tr>
                            <td className="py-2.5 px-2 text-xs text-slate-600">수수료율</td>
                            <td className="py-2.5 px-2 text-xs text-right text-slate-700">{results.current.commission}%</td>
                            <td className="py-2.5 px-2 text-xs text-right font-bold text-indigo-600">{results.next.commission}%</td>
                        </tr>
                        <tr>
                            <td className="py-2.5 px-2 text-xs text-slate-600">월 수수료</td>
                            <td className="py-2.5 px-2 text-xs text-right text-slate-700">
                                {results.current.monthlyCommission.toLocaleString()}원
                            </td>
                            <td className="py-2.5 px-2 text-xs text-right font-bold text-indigo-600">
                                {results.next.monthlyCommission.toLocaleString()}원
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2.5 px-2 text-xs text-slate-600">구독료</td>
                            <td className="py-2.5 px-2 text-xs text-right text-slate-700">
                                {results.current.subscriptionFee.toLocaleString()}원
                            </td>
                            <td className="py-2.5 px-2 text-xs text-right text-slate-700">
                                {results.next.subscriptionFee.toLocaleString()}원
                            </td>
                        </tr>
                        <tr className="bg-slate-50/50">
                            <td className="py-2.5 px-2 text-xs font-bold text-slate-800">총 비용</td>
                            <td className="py-2.5 px-2 text-xs text-right font-black text-slate-800">
                                {results.current.totalCost.toLocaleString()}원
                            </td>
                            <td className="py-2.5 px-2 text-xs text-right font-black text-indigo-600">
                                {results.next.totalCost.toLocaleString()}원
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 결과 메시지 */}
            <div className="mt-5 space-y-3">
                {results.saving > 0 ? (
                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <TrendingDown size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-800 font-medium">
                            {results.next.name} 전환 시 월 <strong>{results.saving.toLocaleString()}원</strong> 절감 가능
                        </p>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <Lightbulb size={16} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800 font-medium">
                            현재 계약 규모에서는 {results.current.name}이 유리합니다.
                            월 <strong>{results.breakEven}건</strong> 이상부터 {results.next.name}이 유리합니다.
                        </p>
                    </div>
                )}
                {results.breakEven > 0 && (
                    <p className="text-[11px] text-slate-500 text-center">
                        손익분기점: 월 {results.breakEven}건 (건당 {(contractAmount / 10000).toLocaleString()}만원 기준)
                    </p>
                )}
            </div>
        </div>
    );
};
