import React, { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, DollarSign, Download, Calendar, Loader2 } from 'lucide-react';
import { fetchPayments } from '../../../lib/api/superAdmin';

interface Transaction {
    id: string;
    facility_name?: string;
    amount: number;
    description?: string;
    status: string;
    paid_at: string;
}

export const RevenueAnalytics: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchPayments();
            setTransactions(data || []);
        } catch (err) {
            console.error('Failed to load payments:', err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = transactions
        .filter(t => t.status === 'succeeded')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const subscriptionRevenue = transactions
        .filter(t => t.status === 'succeeded' && t.description?.includes('구독'))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const otherRevenue = totalRevenue - subscriptionRevenue;

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            {/* 1. Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg text-white p-6">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <DollarSign size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-100 text-sm font-medium">총 매출</span>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">
                            {loading ? '...' : `₩ ${totalRevenue.toLocaleString()}`}
                        </h2>
                        <p className="text-blue-200 text-xs mt-1">결제 완료 기준</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                            <Download size={16} /> 리포트
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">구독 매출</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {loading ? '...' : `₩ ${subscriptionRevenue.toLocaleString()}`}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">기타 매출</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {loading ? '...' : `₩ ${otherRevenue.toLocaleString()}`}
                        </h3>
                    </div>
                </div>
            </div>

            {/* 3. Recent Transactions */}
            <div className="bg-white rounded-xl border shadow-sm">
                <div className="px-5 py-4 border-b flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        최근 거래 내역
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="animate-spin text-gray-400" size={24} />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">거래 내역이 없습니다.</div>
                    ) : (
                        transactions.slice(0, 10).map((tx) => (
                            <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                        {(tx.facility_name || '?')[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{tx.facility_name || '알 수 없음'}</p>
                                        <p className="text-xs text-gray-500">{tx.description || tx.status}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${tx.status === 'succeeded' ? 'text-gray-900' : 'text-red-500'}`}>
                                        {tx.status === 'succeeded' ? '+' : ''}{(tx.amount || 0).toLocaleString()}원
                                    </p>
                                    <p className="text-[10px] text-gray-400">{formatDate(tx.paid_at)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
