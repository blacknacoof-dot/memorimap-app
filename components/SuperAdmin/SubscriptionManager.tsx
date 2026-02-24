import React, { useState } from 'react';
import { useSession } from '../../lib/auth';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSubscriptions } from '../../hooks/useFinancials';
import { updateSubscriptionBillingDate } from '../../lib/api/superAdmin';
import { toast } from 'sonner';
import { Building2, CheckCircle2, AlertCircle, Search, Calendar } from 'lucide-react';

interface SubscriptionManagerProps {
  onManage: (facilityName: string) => void;
}

export const SubscriptionManager = ({ onManage }: { onManage: (facilityName: string) => void }) => {
    const { data: facilities, loading } = useSubscriptions();
    const { session } = useSession();
    const [subsSearch, setSubsSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    const handleUpdateBillingDate = async (facilityId: string, current: string) => {
        const newDate = prompt('새로운 재결제 예정일을 입력하세요 (YYYY-MM-DD):', current?.split('T')[0] || '');
        if (newDate) {
            try {
                const client = await getAuthClient(session, { strict: true });
                const isoDate = new Date(newDate).toISOString();
                await updateSubscriptionBillingDate(facilityId, isoDate, client);
                toast.success('재결제 예정일이 업데이트되었습니다.');
            } catch (e) {
                toast.error('날짜 형식이 올바르지 않거나 업데이트에 실패했습니다.');
            }
        }
    };

    const total = facilities.length;
    const active = facilities.filter(f => f.status === 'active').length;
    const pending = facilities.filter(f => f.status !== 'active').length;

    // 상태 필터 + 텍스트 검색 (시설명, 플랜명)
    const filteredFacilities = facilities.filter(f => {
        if (statusFilter === 'active' && f.status !== 'active') return false;
        if (statusFilter === 'inactive' && f.status === 'active') return false;
        if (subsSearch) {
            const q = subsSearch.toLowerCase();
            return (f.facility_name || '').toLowerCase().includes(q)
                || (f.plan_name || '').toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <button onClick={() => setStatusFilter('all')} className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md text-left ${statusFilter === 'all' ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-100'}`}>
                    <div className="p-2 md:p-3 bg-slate-50 rounded-xl">
                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{total}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">전체 시설</p>
                    </div>
                </button>
                <button onClick={() => setStatusFilter('active')} className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md text-left ${statusFilter === 'active' ? 'border-green-300 ring-1 ring-green-200' : 'border-slate-100'}`}>
                    <div className="p-2 md:p-3 bg-green-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{active}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">활성 구독</p>
                    </div>
                </button>
                <button onClick={() => setStatusFilter('inactive')} className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md text-left ${statusFilter === 'inactive' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-100'}`}>
                    <div className="p-2 md:p-3 bg-orange-50 rounded-xl">
                        <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{pending}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">대기/만료</p>
                    </div>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="text-sm font-bold text-slate-800">구독 시설 목록 <span className="text-slate-400 font-normal">({filteredFacilities.length}건)</span></h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input type="text" value={subsSearch} onChange={(e) => setSubsSearch(e.target.value)} placeholder="시설명, 플랜명 검색..." className="bg-transparent text-xs outline-none w-32" />
                    </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {filteredFacilities.map((fac) => (
                        <div key={fac.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{fac.facility_name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${fac.plan_name === 'Premium' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        fac.plan_name === 'Enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                        {fac.plan_name || 'Basic'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <span className="text-[11px] text-slate-400">만료: {fac.end_date ? new Date(fac.end_date).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateBillingDate(String(fac.facility_id_uuid || fac.facility_id_bigint || fac.id), fac.next_billing_date || '')}
                                        className="flex items-center gap-1.5 text-[11px] text-blue-600 font-black hover:text-blue-700 transition-colors"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        재결제일: {fac.next_billing_date ? new Date(fac.next_billing_date).toLocaleDateString() : '설정 필요'}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => onManage(fac.facility_name)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                관리하기
                            </button>
                        </div>
                    ))}
                    {filteredFacilities.length === 0 && (
                        <div className="p-5 text-center text-xs text-slate-400">구독 중인 시설이 없습니다.</div>
                    )}
                </div>
      </div>
    </div>
  );
};
