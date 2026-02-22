import React, { useState } from 'react';
import {
    Wallet, TrendingUp, CreditCard, ArrowUpRight,
    ArrowDownRight, BarChart3, Download, Settings,
    Building2, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useRevenue } from '../../hooks/useFinancials';

export const RevenueManagement: React.FC = () => {
    const { payments, totalRevenue, loading } = useRevenue();
    const [viewType, setViewType] = useState<'total' | 'partner'>('total');

    if (loading) return <div className="py-20 text-center text-slate-400">금융 데이터를 분석 중...</div>;

    // 이번 달 결제 필터링
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = payments.filter(p => new Date(p.paid_at) >= monthStart);
    const monthlyRevenue = monthlyPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const monthlyCommission = Math.round(monthlyRevenue * 0.1); // 10% 수수료

    // 정산 데이터 — 실 결제 데이터 기반으로 추후 구현 예정
    const settlements: { id: number; company: string; amount: number; fee: number; status: string }[] = [];

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
                    <p className="text-[10px] text-slate-400 mt-2">매출의 10% 기준</p>
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
                        onClick={() => toast.info('리포트 다운로드 기능은 준비 중입니다.')}
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
                            <p className="text-sm font-bold">정산 데이터 준비 중</p>
                            <p className="text-xs mt-1">결제 시스템 연동 후 정산 현황이 표시됩니다.</p>
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
                                        <p className="text-[10px] text-slate-400">정산 대상금액: ₩ {s.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">수수료 수익</p>
                                        <p className="text-sm font-black text-blue-600">₩ {s.fee.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => s.status === 'pending' && toast.info('정산 승인 기능은 준비 중입니다.')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${s.status === 'pending' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-default'
                                        }`}
                                    >
                                        {s.status === 'pending' ? '정산 승인' : '정산 완료'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
