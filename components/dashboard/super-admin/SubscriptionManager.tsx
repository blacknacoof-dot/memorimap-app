import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, AlertCircle, Building, Zap, Loader2 } from 'lucide-react';
import { fetchSubscriptions } from '../../../lib/api/superAdmin';

interface Subscription {
    id: string;
    facility_id: string | number;
    facility_name?: string;
    plan_name: string;
    status: string;
    start_date: string;
    end_date: string | null;
    auto_renew: boolean;
}

export const SubscriptionManager: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchSubscriptions();
            setSubscriptions(data || []);
        } catch (err) {
            console.error('Failed to load subscriptions:', err);
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = subscriptions.filter(sub =>
        (sub.facility_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCount = subscriptions.length;
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const pendingCount = subscriptions.filter(s => s.status !== 'active').length;

    const getTierStyle = (plan: string) => {
        const p = plan.toLowerCase();
        if (p.includes('enterprise')) return { bg: 'bg-purple-100 text-purple-700', badge: 'bg-purple-50 text-purple-600' };
        if (p.includes('pro') || p.includes('premium')) return { bg: 'bg-blue-100 text-blue-700', badge: 'bg-blue-50 text-blue-600' };
        return { bg: 'bg-gray-100 text-gray-700', badge: 'bg-gray-100 text-gray-600' };
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        try { return new Date(dateStr).toLocaleDateString('ko-KR'); }
        catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center aspect-[2/1] md:aspect-auto md:h-28">
                    <div className="bg-blue-50 p-2 rounded-full mb-2"><Building className="text-blue-600" size={20} /></div>
                    <span className="text-2xl font-bold text-slate-900">{loading ? '...' : totalCount}</span>
                    <span className="text-xs text-slate-500 font-medium">전체</span>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center aspect-[2/1] md:aspect-auto md:h-28">
                    <div className="bg-emerald-50 p-2 rounded-full mb-2"><CheckCircle className="text-emerald-600" size={20} /></div>
                    <span className="text-2xl font-bold text-slate-900">{loading ? '...' : activeCount}</span>
                    <span className="text-xs text-slate-500 font-medium">활성</span>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center aspect-[2/1] md:aspect-auto md:h-28">
                    <div className="bg-orange-50 p-2 rounded-full mb-2"><AlertCircle className="text-orange-600" size={20} /></div>
                    <span className="text-2xl font-bold text-slate-900">{loading ? '...' : pendingCount}</span>
                    <span className="text-xs text-slate-500 font-medium">만료/대기</span>
                </div>
            </div>

            {/* Main List */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center gap-2 bg-slate-50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="시설명 또는 등급 검색..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                        <Filter size={16} />
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="animate-spin text-gray-400" size={24} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">구독 정보가 없습니다.</div>
                    ) : (
                        filtered.map((sub) => {
                            const style = getTierStyle(sub.plan_name);
                            return (
                                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${style.bg}`}>
                                            {sub.plan_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                {sub.facility_name || `시설 #${sub.facility_id}`}
                                                {sub.status !== 'active' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                            </h4>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.badge}`}>
                                                    {sub.plan_name}
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                {sub.auto_renew ? (
                                                    <span className="flex items-center gap-0.5 text-emerald-600">
                                                        <Zap size={10} className="fill-emerald-600" /> 자동갱신
                                                    </span>
                                                ) : (
                                                    <span>수동</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-900">
                                            {sub.status === 'expired' ? <span className="text-red-500">만료</span> : formatDate(sub.end_date)}
                                        </p>
                                        <p className="text-[10px] text-slate-400">만료일</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
