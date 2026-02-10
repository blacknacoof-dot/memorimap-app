import React, { useState } from 'react';
import {
    Wallet, TrendingUp, CreditCard, ArrowUpRight,
    ArrowDownRight, BarChart3, Download, Settings,
    Building2, DollarSign
} from 'lucide-react';
import { useRevenue } from '../../hooks/useFinancials';

export const RevenueManagement: React.FC = () => {
    const { payments, totalRevenue, loading } = useRevenue();
    const [viewType, setViewType] = useState<'total' | 'partner'>('total');

    if (loading) return <div className="py-20 text-center text-slate-400">금융 데이터를 분석 중...</div>;

    // 가상의 정산 데이터
    const settlements = [
        { id: 1, company: '프리드라이프', amount: 4500000, fee: 225000, status: 'pending' },
        { id: 2, company: '보람상조', amount: 3200000, fee: 160000, status: 'completed' },
        { id: 3, company: '더피플라이프', amount: 2800000, fee: 140000, status: 'completed' },
    ];

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
                        <span className="flex items-center text-[10px] font-bold bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.5%
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
                    <h2 className="text-2xl font-black text-slate-800">₩ 2,450,000</h2>
                    <p className="text-[10px] text-slate-400 mt-2">전월 대비 <span className="text-blue-600 font-bold">₩ 450,000 증가</span></p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <Settings className="w-4 h-4 text-slate-200" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">중개 수수료 수익</p>
                    <h2 className="text-2xl font-black text-slate-800">₩ 1,185,000</h2>
                    <p className="text-[10px] text-slate-400 mt-2">평균 요율 <span className="text-emerald-600 font-bold">3.5% 적용 중</span></p>
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100">
                        <Download className="w-4 h-4" /> 리포트 다운로드
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {viewType === 'total' ? (
                        payments.slice(0, 10).map((p) => (
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
                                    <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${s.status === 'pending' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-slate-100 text-slate-400'
                                        }`}>
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
