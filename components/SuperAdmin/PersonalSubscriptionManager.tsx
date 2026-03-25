import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Search, User } from 'lucide-react';
import { usePersonalSubscriptions } from '../../hooks/useFinancials';

const PLAN_BADGE: Record<string, string> = {
    PERSONAL_FREE: 'bg-slate-100 text-slate-600 border-slate-200',
    PERSONAL_BASIC: 'bg-slate-100 text-slate-500 border-slate-200',
    PERSONAL_PREMIUM: 'bg-amber-50 text-amber-700 border-amber-100',
};

const PLAN_LABEL: Record<string, string> = {
    PERSONAL_FREE: '무료',
    PERSONAL_BASIC: '베이직 (단종)',
    PERSONAL_PREMIUM: '프리미엄',
};

const STATUS_BADGE: Record<string, string> = {
    active: 'bg-green-50 text-green-600 border-green-100',
    expired: 'bg-orange-50 text-orange-600 border-orange-100',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
    active: '활성',
    expired: '만료',
    cancelled: '해지',
};

export const PersonalSubscriptionManager: React.FC = () => {
    const { data: users, loading } = usePersonalSubscriptions();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

    const filteredUsers = useMemo(() => users.filter((user) => {
        if (statusFilter === 'active' && user.status !== 'active') return false;
        if (statusFilter === 'expired' && user.status === 'active') return false;

        if (!searchTerm) return true;

        const query = searchTerm.toLowerCase();
        return (user.email || '').toLowerCase().includes(query)
            || (user.full_name || '').toLowerCase().includes(query)
            || (PLAN_LABEL[user.plan_name] || user.plan_name).toLowerCase().includes(query);
    }), [searchTerm, statusFilter, users]);

    const activeCount = users.filter((user) => user.status === 'active').length;
    const inactiveCount = users.length - activeCount;

    if (loading) {
        return <div className="p-10 text-center">불러오는 중...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-black text-slate-900">개인 구독 관리</h2>
                <p className="mt-1 text-sm text-slate-500">
                    일반 사용자의 개인 플랜과 사용량 상태를 확인합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left ${statusFilter === 'all' ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-100'}`}
                >
                    <div className="p-2 md:p-3 bg-slate-50 rounded-xl">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{users.length}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">전체 개인 구독</p>
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('active')}
                    className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left ${statusFilter === 'active' ? 'border-green-300 ring-1 ring-green-200' : 'border-slate-100'}`}
                >
                    <div className="p-2 md:p-3 bg-green-50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{activeCount}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">활성 개인 구독</p>
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('expired')}
                    className={`bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex items-center gap-4 text-left ${statusFilter === 'expired' ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-100'}`}
                >
                    <div className="p-2 md:p-3 bg-orange-50 rounded-xl">
                        <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xl md:text-2xl font-black text-slate-800">{inactiveCount}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400">만료 또는 해지</p>
                    </div>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="text-sm font-bold text-slate-800">
                        개인 구독 목록 <span className="text-slate-400 font-normal">({filteredUsers.length}건)</span>
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input
                            id="personal-subs-search"
                            name="personal-subs-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="이름, 이메일, 플랜명 검색..."
                            className="bg-transparent text-xs outline-none w-40"
                        />
                    </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                    {filteredUsers.map((user) => (
                        <div key={user.user_id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-slate-800">{user.full_name || '이름 미입력'}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE[user.plan_name] || PLAN_BADGE.PERSONAL_FREE}`}>
                                        {PLAN_LABEL[user.plan_name] || user.plan_name}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_BADGE[user.status] || STATUS_BADGE.cancelled}`}>
                                        {STATUS_LABEL[user.status] || user.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">{user.email || '이메일 없음'}</div>
                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                                    <span>AI 상담 사용: {user.ai_consult_used}</span>
                                    <span>상조 비교 사용: {user.sangjo_compare_used}</span>
                                    <span>즐겨찾기: {user.favorites_count}</span>
                                    <span>상조 즐겨찾기: {user.sangjo_favorites_count}</span>
                                    <span>만료일: {user.expires_at ? new Date(user.expires_at).toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-slate-300">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="p-5 text-center text-xs text-slate-400">
                            조회 조건에 맞는 개인 구독이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
