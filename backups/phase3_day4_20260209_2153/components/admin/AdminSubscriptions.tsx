import React, { useEffect, useState } from 'react';
import { getAllSubscriptions } from '../../lib/queries';
import { Loader2, Crown, TrendingUp } from 'lucide-react';

export const AdminSubscriptions: React.FC = () => {
    const [subs, setSubs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getAllSubscriptions();
            setSubs(data);
            setIsLoading(false);
        };
        load();
    }, []);

    // Simple Revenue Calculation (Mock Price)
    const totalRevenue = subs.length * 99000; // Assuming 99,000 KRW avg

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Crown className="text-purple-600" /> 구독 및 매출 현황
            </h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">총 구독 업체</div>
                    <div className="text-3xl font-bold text-gray-900">{subs.length}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">예상 월 매출</div>
                    <div className="text-3xl font-bold text-purple-600">₩{totalRevenue.toLocaleString()}</div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-4">업체명</th>
                            <th className="p-4">구독 플랜</th>
                            <th className="p-4">만료일</th>
                            <th className="p-4 text-right">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {subs.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{s.facilityName}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.planName === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {s.planName}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">{s.expiresAt}</td>
                                <td className="p-4 text-right">
                                    <span className="text-green-600 font-bold text-xs">● Active</span>
                                </td>
                            </tr>
                        ))}
                        {subs.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">구독 중인 업체가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
