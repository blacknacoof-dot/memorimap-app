import React, { useState, useEffect } from 'react';
import { getAllSubscriptions } from '../../lib/queries';
import { Search, Zap, Calendar, TrendingUp } from 'lucide-react';

interface Subscription {
    id: string;
    facilityName: string;
    planName: string;
    expiresAt: string;
    price: number;
}

export const SubscriptionStatus: React.FC = () => {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        setIsLoading(true);
        try {
            const data = await getAllSubscriptions();
            setSubs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = subs.filter(s =>
        s.facilityName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = filtered.reduce((acc, curr) => acc + (curr.price || 0), 0);

    return (
        <div className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <Zap size={20} />
                            <span className="text-sm font-bold">활성 구독 수</span>
                        </div>
                        <p className="text-3xl font-extrabold">{filtered.length} <span className="text-lg font-normal opacity-70">건</span></p>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 border shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-gray-500">
                            <TrendingUp size={20} />
                            <span className="text-sm font-bold">예상 월 매출</span>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900">₩ {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-2">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="업체명 검색..."
                    className="flex-1 outline-none text-sm"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-hidden">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-2 py-3 w-[30%]">업체명</th>
                                <th className="px-2 py-3 w-[20%] text-center">이용 플랜</th>
                                <th className="px-2 py-3 w-[20%] text-center">만료일</th>
                                <th className="px-2 py-3 text-right w-[30%]">금액</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        구독 중인 업체가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(s => {
                                    const formatPrice = (price: number) => {
                                        if (price === 0) return '무료';
                                        const man = Math.floor(price / 10000);
                                        const remainder = price % 10000;
                                        const chun = Math.floor(remainder / 1000);

                                        let res = '';
                                        if (man > 0) res += `${man}만`;
                                        if (chun > 0) res += `${chun}천`;
                                        return res + '원';
                                    };

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-2 py-3 font-medium text-gray-900 break-keep leading-tight">
                                                {s.facilityName}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100 whitespace-nowrap">
                                                    {s.planName}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-gray-500 text-center">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    {/* <Calendar size={10} className="text-gray-400 shrink-0"/> Space saving */}
                                                    <span className="whitespace-nowrap text-[11px]">{s.expiresAt}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-right font-bold text-gray-900 whitespace-nowrap text-[11px]">
                                                {formatPrice(s.price)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
