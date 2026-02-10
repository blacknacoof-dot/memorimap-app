import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, CheckCircle, AlertCircle, Building, Zap } from 'lucide-react';

// MOCK DATA (High Density)
const MOCK_SUBSCRIPTIONS = [
    { id: 1, name: '하늘공원 추모관', tier: 'Enterprise', status: 'active', expiry: '2026.01.20', autoRenew: true },
    { id: 2, name: '평화의 숲', tier: 'Pro', status: 'active', expiry: '2026.02.15', autoRenew: true },
    { id: 3, name: '영원한 안식처', tier: 'Pro', status: 'pending', expiry: '-', autoRenew: false },
    { id: 4, name: '서울 시립 승화원', tier: 'Starter', status: 'active', expiry: '2025.12.31', autoRenew: false },
    { id: 5, name: '부산 추모 공원', tier: 'Enterprise', status: 'active', expiry: '2026.03.10', autoRenew: true },
    { id: 6, name: '분당 메모리얼 파크', tier: 'Pro', status: 'expired', expiry: '2025.01.01', autoRenew: false },
    { id: 7, name: '인천 가족 공원', tier: 'Starter', status: 'active', expiry: '2026.01.25', autoRenew: true },
];

export const SubscriptionManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            {/* 1. KPI Grid (Square Cards) */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center aspect-[2/1] md:aspect-auto md:h-28 hover:border-blue-500 transition-colors cursor-pointer group">
                    <div className="bg-blue-50 p-2 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                        <Building className="text-blue-600" size={20} />
                    </div>
                    <span className="text-2xl font-bold text-slate-900">152</span>
                    <span className="text-xs text-slate-500 font-medium">Total Places</span>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center aspect-[2/1] md:aspect-auto md:h-28 hover:border-emerald-500 transition-colors cursor-pointer group">
                    <div className="bg-emerald-50 p-2 rounded-full mb-2 group-hover:bg-emerald-100 transition-colors">
                        <CheckCircle className="text-emerald-600" size={20} />
                    </div>
                    <span className="text-2xl font-bold text-slate-900">140</span>
                    <span className="text-xs text-slate-500 font-medium">Active Subs</span>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center aspect-[2/1] md:aspect-auto md:h-28 hover:border-orange-500 transition-colors cursor-pointer group">
                    <div className="bg-orange-50 p-2 rounded-full mb-2 group-hover:bg-orange-100 transition-colors">
                        <AlertCircle className="text-orange-600" size={20} />
                    </div>
                    <span className="text-2xl font-bold text-slate-900">12</span>
                    <span className="text-xs text-slate-500 font-medium">Pending/Expiring</span>
                </div>
            </div>

            {/* 2. Main List Section */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-3 border-b flex items-center gap-2 bg-slate-50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="시설명 또는 등급 검색..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                        <Filter size={16} />
                    </button>
                </div>

                {/* Dense List */}
                <div className="divide-y divide-slate-100">
                    {MOCK_SUBSCRIPTIONS.map((sub) => (
                        <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                {/* Icon / Avatar Placeholder */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${sub.tier === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                        sub.tier === 'Pro' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {sub.tier[0]}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        {sub.name}
                                        {sub.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                    </h4>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${sub.tier === 'Enterprise' ? 'bg-purple-50 text-purple-600' :
                                                sub.tier === 'Pro' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {sub.tier}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        {sub.autoRenew ? (
                                            <span className="flex items-center gap-0.5 text-emerald-600">
                                                <Zap size={10} className="fill-emerald-600" /> Auto-Renew
                                            </span>
                                        ) : (
                                            <span>Manual</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                                <div>
                                    <p className="text-xs font-medium text-slate-900">
                                        {sub.status === 'expired' ? <span className="text-red-500">Expired</span> : sub.expiry}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Next Billing</p>
                                </div>
                                <button className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
