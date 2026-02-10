import React from 'react';
import { CreditCard, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Download, Calendar } from 'lucide-react';

// MOCK DATA
const MOCK_TRANSACTIONS = [
    { id: 1, facility: '하늘공원 추모관', amount: 154000, type: 'Subscription (Enterprise)', date: 'Today, 10:42 AM' },
    { id: 2, facility: '평화의 숲', amount: 55000, type: 'Subscription (Pro)', date: 'Yesterday, 14:20 PM' },
    { id: 3, facility: '영원한 안식처', amount: 33000, type: 'Commission', date: 'Jan 07, 09:15 AM' },
    { id: 4, facility: '부산 추모 공원', amount: 1200000, type: 'Ad Campaign', date: 'Jan 06, 11:30 AM' },
    { id: 5, facility: '인천 가족 공원', amount: 55000, type: 'Subscription (Pro)', date: 'Jan 05, 16:45 PM' },
];

export const RevenueAnalytics: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* 1. Hero Card (Horizontal Gradient) */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg text-white p-6">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <DollarSign size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-100 text-sm font-medium">Total Revenue (January)</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">+12.5%</span>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">₩ 12,500,000</h2>
                        <p className="text-blue-200 text-xs mt-1">vs ₩ 11,120,500 last month</p>
                    </div>

                    <div className="flex gap-2">
                        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                            <Download size={16} /> Reports
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Breakdown Cards (Side by Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Subscriptions</p>
                        <h3 className="text-xl font-bold text-gray-900">₩ 8,450,000</h3>
                        <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-medium">
                            <ArrowUpRight size={10} /> +8.2% Growth
                        </p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Commissions / Ads</p>
                        <h3 className="text-xl font-bold text-gray-900">₩ 4,050,000</h3>
                        <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-medium">
                            <ArrowUpRight size={10} /> +24.5% Growth
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Recent Transactions (Clean List) */}
            <div className="bg-white rounded-xl border shadow-sm">
                <div className="px-5 py-4 border-b flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        Recent Transactions
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {MOCK_TRANSACTIONS.map((tx) => (
                        <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                    {tx.facility[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{tx.facility}</p>
                                    <p className="text-xs text-gray-500">{tx.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">+{tx.amount.toLocaleString()}원</p>
                                <p className="text-[10px] text-gray-400">{tx.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
