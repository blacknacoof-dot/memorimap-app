import React, { useState } from 'react';
import {
    Wallet, TrendingUp, CreditCard,
    BarChart3, Download, Settings,
    Building2, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useRevenue } from '../../hooks/useFinancials';
import { useSystemSettings } from '../../hooks/useSystemSettings';

export const RevenueManagement: React.FC = () => {
    const { payments, totalRevenue, loading } = useRevenue();
    const [viewType, setViewType] = useState<'total' | 'partner'>('total');
    const { getNumber } = useSystemSettings(['commission_rate']);
    const commissionRate = getNumber('commission_rate', 10) / 100;

    if (loading) return <div className="py-20 text-center text-slate-400">금융 데이터를 분석 중...</div>;

    const handleDownload = () => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        if (viewType === 'total') {
            if (payments.length === 0) {
                toast.warning('다운로드할 데이터가 없습니다.');
                return;
            }
            const header = '결제일시,시설명,금액(원),설명,상태';
            const rows = payments.map(p => [
                new Date(p.paid_at).toLocaleString('ko-KR'),
                p.facility_name ?? '',
                p.amount,
                p.description ?? '',
                '결제완료',
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = '\uFEFF' + [header, ...rows].join('\n');
            triggerDownload(csv, `memorimap_revenue_${dateStr}.csv`);
        } else {
            if (settlements.length === 0) {
                toast.warning('다운로드할 데이터가 없습니다.');
                return;
            }
            const header = '시설명,누적결제(원),수수료수익(원),마지막결제일';
            const rows = settlements.map(s => [
                s.company,
                s.amount,
                s.fee,
                new Date(s.lastPaidAt).toLocaleDateString('ko-KR'),
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = '\uFEFF' + [header, ...rows].join('\n');
            triggerDownload(csv, `memorimap_settlement_${dateStr}.csv`);
        }
    };

    function triggerDownload(csv: string, filename: string) {
        try {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('다운로드에 실패했습니다.');
        }
    }

    // 이번 달 결제 필터링
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = payments.filter(p => new Date(p.paid_at) >= monthStart);
    const monthlyRevenue = monthlyPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const monthlyCommission = Math.round(monthlyRevenue * commissionRate);

    // 정산 데이터 — 결제 데이터를 시설별로 그룹핑
    const settlements = Object.values(
        payments.reduce<Record<string, { id: string; company: string; amount: number; fee: number; status: string; lastPaidAt: string }>>((acc, p) => {
            const key = p.facility_name || 'unknown';
            if (!acc[key]) {
                acc[key] = { id: key, company: key, amount: 0, fee: 0, status: 'settled', lastPaidAt: p.paid_at };
            }
            acc[key].amount += p.amount || 0;
            acc[key].fee += Math.round((p.amount || 0) * commissionRate);
            if (new Date(p.paid_at) > new Date(acc[key].lastPaidAt)) {
                acc[key].lastPaidAt = p.paid_at;
            }
            return acc;
        }, {})
    ).sort((a, b) => b.amount - a.amount);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-[10px] font-bold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                            누적
                        </span>
                    </div>
                    <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest opacity-80 mb-1">총 플랫폼 매출 (누적)</p>
                    <h2 className="text-3xl font-black tracking-tight">₩ {totalRevenue.toLocaleString()}</h2>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <BarChart3 className="w-4 h-4 text-slate-200" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">이번 달 구독 수익</p>
                    <h2 className="text-2xl font-black text-slate-800">₩ {monthlyRevenue.toLocaleString()}</h2>
                    <p className="text-[10px] text-slate-400 mt-2">{monthlyPayments.length}건 결제</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <Settings className="w-4 h-4 text-slate-200" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">중개 수수료 수익</p>
                    <h2 className="text-2xl font-black text-slate-800">₩ {monthlyCommission.toLocaleString()}</h2>
                    <p className="text-[10px] text-slate-400 mt-2">매출의 {Math.round(commissionRate * 100)}% 기준</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
                        <button
                            onClick={() => setViewType('total')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'total' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                                }`}
                        >
                            매출 내역
                        </button>
                        <button
                            onClick={() => setViewType('partner')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'partner' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                                }`}
                        >
                            정산 현황
                        </button>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
                    >
                        <Download className="w-4 h-4" /> 리포트 다운로드
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {viewType === 'total' ? (
                        payments.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-bold">매출 내역 없음</p>
                                <p className="text-xs mt-1">결제가 발생하면 여기에 표시됩니다.</p>
                            </div>
                        ) : payments.slice(0, 10).map((p) => (
                            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                        {p.description?.includes('구독') ? <CreditCard size={18} /> : <TrendingUp size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{p.facility_name}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(p.paid_at).toLocaleDateString()} · {p.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">₩ {p.amount.toLocaleString()}</p>
                                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">결제완료</span>
                                </div>
                            </div>
                        ))
                    ) : settlements.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-bold">정산 내역 없음</p>
                            <p className="text-xs mt-1">결제가 발생하면 시설별 정산 현황이 표시됩니다.</p>
                        </div>
                    ) : (
                        settlements.map((s) => (
                            <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{s.company}</p>
                                        <p className="text-[10px] text-slate-400">누적 결제: ₩ {s.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">수수료 수익</p>
                                        <p className="text-sm font-black text-blue-600">₩ {s.fee.toLocaleString()}</p>
                                    </div>
                                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400">
                                        정산 완료
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
