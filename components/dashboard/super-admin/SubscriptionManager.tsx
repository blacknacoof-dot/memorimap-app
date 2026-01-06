import React, { useState } from 'react';
import { useSubscriptions } from '../../../hooks/useSuperAdmin';
import { BadgeCheck, AlertCircle, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';

export const SubscriptionManager: React.FC = () => {
    const { data: subscriptions, loading } = useSubscriptions();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSubs = subscriptions.filter(sub =>
        sub.facility_name.includes(searchTerm) || sub.plan_type.includes(searchTerm)
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'expired': return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'enterprise': return 'text-purple-600 font-bold';
            case 'pro': return 'text-blue-600 font-bold';
            default: return 'text-gray-600 font-bold';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <BadgeCheck className="text-blue-600" />
                    구독 관리
                </h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="시설명 또는 등급 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                        <tr>
                            <th className="px-6 py-4">시설명</th>
                            <th className="px-6 py-4">구독 등급</th>
                            <th className="px-6 py-4">월 결제액</th>
                            <th className="px-6 py-4">기간</th>
                            <th className="px-6 py-4 text-center">상태</th>
                            <th className="px-6 py-4 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSubs.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{sub.facility_name}</td>
                                <td className={`px-6 py-4 uppercase ${getPlanColor(sub.plan_type)}`}>{sub.plan_type}</td>
                                <td className="px-6 py-4 text-gray-600">{sub.monthly_price.toLocaleString()}원</td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div className="flex flex-col text-xs">
                                        <span>시작: {sub.start_date}</span>
                                        <span>만료: {sub.end_date}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                                        {sub.status === 'active' && <Clock size={12} className="mr-1" />}
                                        {sub.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-blue-600 font-medium text-xs">수정</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSubs.length === 0 && (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <AlertCircle className="text-gray-300" size={32} />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
