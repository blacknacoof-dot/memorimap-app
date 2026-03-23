import React, { useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscriptions } from '../../hooks/useFinancials';
import { updateSubscriptionBillingDate } from '../../lib/api/superAdmin';
import { promptAsync } from '../../src/components/common/ConfirmModal';
import { useSuperAdminClient } from './SuperAdminGuard';

export const SubscriptionManager = ({ onManage }: { onManage: (facilityName: string) => void }) => {
    const { data: businesses, loading } = useSubscriptions();
    const client = useSuperAdminClient();
    const [subsSearch, setSubsSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isUpdating, setIsUpdating] = useState(false);

    if (loading) {
        return <div className="p-10 text-center">불러오는 중...</div>;
    }

    const handleUpdateBillingDate = async (facilityId: string, current: string) => {
        const newDate = await promptAsync(
            '새 결제 예정일을 입력해 주세요.',
            '결제 예정일 변경',
            {
                defaultValue: current?.split('T')[0] || '',
                placeholder: 'YYYY-MM-DD',
            },
        );

        if (!newDate) return;
        if (isUpdating) return;

        setIsUpdating(true);
        try {
            const isoDate = new Date(newDate).toISOString();
            await updateSubscriptionBillingDate(facilityId, isoDate, client);
            toast.success('결제 예정일을 업데이트했습니다.');
        } catch {
            toast.error('날짜 형식을 확인한 뒤 다시 시도해 주세요.');
        } finally {
            setIsUpdating(false);
        }
    };

    const total = businesses.length;
    const active = businesses.filter((business) => business.status === 'active').length;
    const inactive = businesses.filter((business) => business.status !== 'active').length;

    const filteredBusinesses = businesses.filter((business) => {
        if (statusFilter === 'active' && business.status !== 'active') return false;
        if (statusFilter === 'inactive' && business.status === 'active') return false;

        if (subsSearch) {
            const q = subsSearch.toLowerCase();
            return (business.facility_name || '').toLowerCase().includes(q)
                || (business.plan_name || '').toLowerCase().includes(q);
        }

        return true;
    });

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-black text-slate-900">사업자 구독 관리</h2>
                <p className="mt-1 text-sm text-slate-500">
                    시설과 상조 사업자의 구독 상태, 플랜, 결제 예정일을 관리합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md text-left ${statusFilter === 'all' ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-100'}`}
                >
                    <div className="p-2 md:p-3 bg-slate-50 rounded-xl">
                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{total}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">전체 사업자</p>
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('active')}
                    className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md text-left ${statusFilter === 'active' ? 'border-green-300 ring-1 ring-green-200' : 'border-slate-100'}`}
                >
                    <div className="p-2 md:p-3 bg-green-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{active}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">활성 구독</p>
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md text-left ${statusFilter === 'inactive' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-100'}`}
                >
                    <div className="p-2 md:p-3 bg-orange-50 rounded-xl">
                        <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{inactive}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">만료 또는 비활성</p>
                    </div>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="text-sm font-bold text-slate-800">
                        사업자 구독 목록 <span className="text-slate-400 font-normal">({filteredBusinesses.length}건)</span>
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            id="subs-search"
                            name="subs-search"
                            type="text"
                            value={subsSearch}
                            onChange={(e) => setSubsSearch(e.target.value)}
                            placeholder="사업자명, 플랜명 검색..."
                            className="bg-transparent text-xs outline-none w-36"
                        />
                    </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {filteredBusinesses.map((business) => (
                        <div key={business.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {business.facility_name || '사업자명 확인 필요'}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${(business.plan_name || '').toLowerCase() === 'premium'
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : (business.plan_name || '').toLowerCase() === 'enterprise'
                                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                        {business.plan_name || 'Basic'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <span className="text-[11px] text-slate-400">
                                            만료일: {business.end_date ? new Date(business.end_date).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateBillingDate(String(business.facility_id_uuid || business.facility_id_bigint || business.id), business.next_billing_date || '')}
                                        className="flex items-center gap-1.5 text-[11px] text-blue-600 font-black hover:text-blue-700 transition-colors"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        결제 예정일: {business.next_billing_date ? new Date(business.next_billing_date).toLocaleDateString() : '설정 필요'}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => onManage(business.facility_name || '')}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                사업자 관리
                            </button>
                        </div>
                    ))}
                    {filteredBusinesses.length === 0 && (
                        <div className="p-5 text-center text-xs text-slate-400">
                            조회 조건에 맞는 사업자 구독이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
