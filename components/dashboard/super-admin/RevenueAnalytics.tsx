import React from 'react';
import { useRevenue } from '../../../hooks/useSuperAdmin';
import { TrendingUp, DollarSign, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export const RevenueAnalytics: React.FC = () => {
    const { payments, totalRevenue, loading } = useRevenue();
    const activeSubs = 45; // TODO: Fetch from subscription hook if needed
    const growthRate = 12.5; // Placeholder


    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign size={64} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">이번 달 총 매출</p>
                    <h3 className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString()}원</h3>
                    <div className="flex items-center mt-2 text-green-600 text-sm font-medium">
                        <ArrowUpRight size={16} className="mr-1" />
                        <span>전월 대비 +{growthRate}%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} className="text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">활성 구독 수</p>
                    <h3 className="text-3xl font-bold text-gray-900">{activeSubs}개</h3>
                    <div className="flex items-center mt-2 text-blue-600 text-sm font-medium">
                        <span>Pro: 30 / Enterprise: 15</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CreditCard size={64} className="text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">ARPPU (평균 결제액)</p>
                    <h3 className="text-3xl font-bold text-gray-900">{(totalRevenue / 5).toLocaleString()}원</h3>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-xl border shadow-sm">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-gray-500" />
                        최근 결제 내역
                    </h3>
                    <button className="text-sm text-blue-600 hover:underline">전체 보기</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {payments.map(pay => (
                        <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${pay.status === 'succeeded' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{pay.facility_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(pay.paid_at || new Date()), 'yyyy-MM-dd HH:mm')} • {pay.status === 'succeeded' ? '결제 성공' : '환불/실패'}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-bold ${pay.status === 'succeeded' ? 'text-gray-900' : 'text-red-500 line-through'}`}>
                                {pay.amount.toLocaleString()}원
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
