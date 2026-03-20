import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { Consultation } from '../../lib/queries';
import { Reservation } from '../../types';

interface Props {
    consultations: Consultation[];
    reservations: Reservation[];
}

interface MonthData {
    label: string;
    cons: number;
    res: number;
    completed: number;
}

export const ActivityStats: React.FC<Props> = ({ consultations, reservations }) => {
    const months: MonthData[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const label = `${m + 1}월`;
        const monthCons = consultations.filter(c => {
            const cd = new Date(c.created_at);
            return cd.getFullYear() === y && cd.getMonth() === m;
        });
        const res = reservations.filter(r => {
            const rd = new Date(r.visit_date);
            return rd.getFullYear() === y && rd.getMonth() === m;
        }).length;
        const completed = monthCons.filter(c => c.status === 'completed' || c.status === 'accepted').length;
        months.push({ label, cons: monthCons.length, res, completed });
    }

    const maxVal = Math.max(1, ...months.map(m => m.cons + m.res));
    const currentMonth = months[months.length - 1];
    const conversionRate = currentMonth.cons > 0
        ? Math.round((currentMonth.completed / currentMonth.cons) * 100)
        : 0;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    활동 통계 (최근 6개월)
                </h3>
                {currentMonth.cons > 0 && (
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        <ArrowUpRight size={14} className="text-emerald-600" />
                        <span className="text-[11px] font-bold text-emerald-700">
                            전환율 {conversionRate}%
                        </span>
                    </div>
                )}
            </div>

            {/* 바 차트 */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {months.map((m, i) => (
                    <div key={i} className="text-center">
                        <div className="h-32 flex flex-col items-center justify-end gap-0.5 mb-2">
                            <div
                                className="w-8 bg-blue-500 rounded-t-lg transition-all"
                                style={{ height: `${(m.cons / maxVal) * 100}%`, minHeight: m.cons > 0 ? 4 : 0 }}
                                title={`상담 ${m.cons}건`}
                            />
                            <div
                                className="w-8 bg-amber-400 rounded-b-lg transition-all"
                                style={{ height: `${(m.res / maxVal) * 100}%`, minHeight: m.res > 0 ? 4 : 0 }}
                                title={`예약 ${m.res}건`}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{m.label}</span>
                        <div className="text-[9px] text-slate-400 mt-0.5">{m.cons + m.res}건</div>
                    </div>
                ))}
            </div>

            {/* 범례 + 전환율 요약 */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-3 h-3 bg-blue-500 rounded" /> 상담
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-3 h-3 bg-amber-400 rounded" /> 예약
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-3 h-3 bg-emerald-500 rounded" /> 계약체결/완료
                </div>
            </div>

            {/* 이번 달 상세 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">상담 접수</p>
                    <p className="text-lg font-black text-slate-800">{currentMonth.cons}건</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">계약 체결</p>
                    <p className="text-lg font-black text-emerald-600">{currentMonth.completed}건</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">예약</p>
                    <p className="text-lg font-black text-slate-800">{currentMonth.res}건</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">전환율</p>
                    <p className="text-lg font-black text-indigo-600">{conversionRate}%</p>
                </div>
            </div>
        </div>
    );
};
