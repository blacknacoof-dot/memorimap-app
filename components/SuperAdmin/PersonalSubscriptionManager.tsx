import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { usePersonalSubscriptions } from '../../hooks/useFinancials';
import { useSession, useUser } from '../../lib/auth';
import { getAuthClient } from '../../lib/supabaseClient';
import {
    extendPremium,
    getUserPremiumStatus,
    grantPremium,
    revokePremium,
    type UserPremiumStatus,
} from '../../lib/api/superAdmin';

const PLAN_BADGE: Record<string, string> = {
    PERSONAL_FREE: 'bg-slate-100 text-slate-600 border-slate-200',
    PERSONAL_BASIC: 'bg-slate-100 text-slate-500 border-slate-200',
    PERSONAL_PREMIUM: 'bg-amber-50 text-amber-700 border-amber-100',
};

const PLAN_LABEL: Record<string, string> = {
    PERSONAL_FREE: '무료',
    PERSONAL_BASIC: '베이직(구형)',
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

const PREMIUM_SOURCE_OPTIONS = [
    { value: 'beta_manual', label: 'beta_manual' },
    { value: 'cs_comp', label: 'cs_comp' },
    { value: 'partner_test', label: 'partner_test' },
] as const;

type PremiumSourceValue = (typeof PREMIUM_SOURCE_OPTIONS)[number]['value'];

const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('ko-KR');
};

export const PersonalSubscriptionManager: React.FC = () => {
    const { data: users, loading } = usePersonalSubscriptions();
    const { session } = useSession();
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedPremium, setSelectedPremium] = useState<UserPremiumStatus | null>(null);
    const [premiumLoading, setPremiumLoading] = useState(false);
    const [grantDays, setGrantDays] = useState(30);
    const [grantSource, setGrantSource] = useState<PremiumSourceValue>('beta_manual');
    const [notes, setNotes] = useState('');
    const [customExtendDate, setCustomExtendDate] = useState('');
    const [revokeReason, setRevokeReason] = useState('');

    const filteredUsers = useMemo(() => users.filter((userRow) => {
        if (statusFilter === 'active' && userRow.status !== 'active') return false;
        if (statusFilter === 'expired' && userRow.status === 'active') return false;

        if (!searchTerm) return true;

        const query = searchTerm.toLowerCase();
        return (userRow.email || '').toLowerCase().includes(query)
            || (userRow.full_name || '').toLowerCase().includes(query)
            || (PLAN_LABEL[userRow.plan_name] || userRow.plan_name).toLowerCase().includes(query);
    }), [searchTerm, statusFilter, users]);

    const activeCount = users.filter((userRow) => userRow.status === 'active').length;
    const inactiveCount = users.length - activeCount;
    const selectedUser = users.find((userRow) => userRow.user_id === selectedUserId) || null;

    const loadPremium = async (userId: string) => {
        if (!session) return;
        setPremiumLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const status = await getUserPremiumStatus(userId, client);
            setSelectedPremium(status);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '프리미엄 상태를 불러오지 못했습니다.');
            setSelectedPremium(null);
        } finally {
            setPremiumLoading(false);
        }
    };

    const handleSelectUser = async (userId: string) => {
        setSelectedUserId(userId);
        setNotes('');
        setRevokeReason('');
        setCustomExtendDate('');
        await loadPremium(userId);
    };

    const handleGrant = async () => {
        if (!session || !selectedUserId || !user?.id) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            const expiresAt = new Date(Date.now() + grantDays * 24 * 60 * 60 * 1000).toISOString();

            await grantPremium({
                userId: selectedUserId,
                premiumSource: grantSource,
                expiresAt,
                notes,
                grantedByAdminId: user.id,
            }, client);

            toast.success('베타 프리미엄이 부여되었습니다.');
            setNotes('');
            await loadPremium(selectedUserId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '프리미엄 부여에 실패했습니다.');
        }
    };

    const handleExtendByDays = async (days: number) => {
        if (!session || !selectedPremium?.activeGrant || !user?.id) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            await extendPremium(selectedPremium.activeGrant.id, user.id, client, { days });
            toast.success(`프리미엄이 ${days}일 연장되었습니다.`);
            await loadPremium(selectedPremium.activeGrant.user_id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '프리미엄 연장에 실패했습니다.');
        }
    };

    const handleExtendToDate = async () => {
        if (!session || !selectedPremium?.activeGrant || !user?.id || !customExtendDate) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            const isoDate = new Date(customExtendDate).toISOString();
            await extendPremium(selectedPremium.activeGrant.id, user.id, client, { newExpiresAt: isoDate });
            toast.success('프리미엄 만료일이 수정되었습니다.');
            setCustomExtendDate('');
            await loadPremium(selectedPremium.activeGrant.user_id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '프리미엄 날짜 수정에 실패했습니다.');
        }
    };

    const handleRevoke = async () => {
        if (!session || !selectedPremium?.activeGrant || !user?.id) return;

        try {
            const client = await getAuthClient(session, { strict: true });
            await revokePremium(selectedPremium.activeGrant.id, revokeReason, user.id, client);
            toast.success('프리미엄이 회수되었습니다.');
            setRevokeReason('');
            await loadPremium(selectedPremium.activeGrant.user_id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '프리미엄 회수에 실패했습니다.');
        }
    };

    if (loading) {
        return <div className="p-10 text-center">불러오는 중...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-black text-slate-900">개인 구독 / 베타 프리미엄 운영</h2>
                <p className="mt-1 text-sm text-slate-500">
                    기존 개인 구독 상태를 보면서, 슈퍼관리자만 베타 프리미엄 override를 부여/연장/회수할 수 있습니다.
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

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
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
                    <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
                        {filteredUsers.map((userRow) => (
                            <button
                                key={userRow.user_id}
                                onClick={() => handleSelectUser(userRow.user_id)}
                                className={`w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${selectedUserId === userRow.user_id ? 'bg-blue-50/70' : ''}`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="font-bold text-sm text-slate-800">{userRow.full_name || '이름 미입력'}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE[userRow.plan_name] || PLAN_BADGE.PERSONAL_FREE}`}>
                                            {PLAN_LABEL[userRow.plan_name] || userRow.plan_name}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_BADGE[userRow.status] || STATUS_BADGE.cancelled}`}>
                                            {STATUS_LABEL[userRow.status] || userRow.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500">{userRow.email || '이메일 없음'}</div>
                                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                                        <span>AI 상담: {userRow.ai_consult_used}</span>
                                        <span>상조 비교: {userRow.sangjo_compare_used}</span>
                                        <span>즐겨찾기: {userRow.favorites_count}</span>
                                        <span>상조 즐겨찾기: {userRow.sangjo_favorites_count}</span>
                                        <span>만료일: {userRow.expires_at ? new Date(userRow.expires_at).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2 text-slate-300">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                            </button>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="p-5 text-center text-xs text-slate-400">
                                조회 조건에 맞는 개인 구독자가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
                    {!selectedUser ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                            왼쪽 목록에서 사용자를 선택하면 베타 프리미엄 상태를 관리할 수 있습니다.
                        </div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-base font-black text-slate-900">{selectedUser.full_name || '이름 미입력'}</h3>
                                <p className="mt-1 text-xs text-slate-500">{selectedUser.email || '이메일 없음'}</p>
                                <p className="mt-1 text-[11px] text-slate-400 font-mono">{selectedUser.user_id}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-bold text-slate-500 mb-2">현재 베타 프리미엄 상태</div>
                                {premiumLoading ? (
                                    <div className="text-sm text-slate-400">상태 조회 중...</div>
                                ) : selectedPremium?.activeGrant ? (
                                    <div className="space-y-1 text-sm">
                                        <div className="font-bold text-green-700">Active override</div>
                                        <div className="text-slate-600">Source: {selectedPremium.activeGrant.premium_source}</div>
                                        <div className="text-slate-600">만료일: {formatDateTime(selectedPremium.activeGrant.premium_expires_at)}</div>
                                        <div className="text-slate-600">메모: {selectedPremium.activeGrant.notes || '-'}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm font-bold text-slate-500">Free / override 없음</div>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <div className="text-sm font-bold text-slate-800">베타 프리미엄 부여</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={grantSource}
                                        onChange={(e) => setGrantSource(e.target.value as PremiumSourceValue)}
                                        className="rounded-lg border px-3 py-2 text-sm"
                                    >
                                        {PREMIUM_SOURCE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={grantDays}
                                        onChange={(e) => setGrantDays(Number(e.target.value))}
                                        className="rounded-lg border px-3 py-2 text-sm"
                                    >
                                        <option value={7}>7일</option>
                                        <option value={14}>14일</option>
                                        <option value={30}>30일</option>
                                    </select>
                                </div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="부여 메모"
                                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                                />
                                <button
                                    onClick={handleGrant}
                                    disabled={!!selectedPremium?.activeGrant}
                                    className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    베타 프리미엄 부여
                                </button>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <div className="text-sm font-bold text-slate-800">연장</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleExtendByDays(7)}
                                        disabled={!selectedPremium?.activeGrant}
                                        className="rounded-lg bg-amber-500 text-white py-2 text-sm font-bold disabled:opacity-50"
                                    >
                                        +7일
                                    </button>
                                    <button
                                        onClick={() => handleExtendByDays(30)}
                                        disabled={!selectedPremium?.activeGrant}
                                        className="rounded-lg bg-amber-600 text-white py-2 text-sm font-bold disabled:opacity-50"
                                    >
                                        +30일
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="datetime-local"
                                        value={customExtendDate}
                                        onChange={(e) => setCustomExtendDate(e.target.value)}
                                        className="flex-1 rounded-lg border px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={handleExtendToDate}
                                        disabled={!selectedPremium?.activeGrant || !customExtendDate}
                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
                                    >
                                        날짜 수정
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-red-200 p-4 space-y-3">
                                <div className="text-sm font-bold text-red-700">회수</div>
                                <textarea
                                    value={revokeReason}
                                    onChange={(e) => setRevokeReason(e.target.value)}
                                    rows={2}
                                    placeholder="회수 사유"
                                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                                />
                                <button
                                    onClick={handleRevoke}
                                    disabled={!selectedPremium?.activeGrant || !revokeReason.trim()}
                                    className="w-full rounded-lg bg-red-600 text-white py-2 text-sm font-bold disabled:opacity-50"
                                >
                                    프리미엄 회수
                                </button>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="text-sm font-bold text-slate-800 mb-3">이력</div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {selectedPremium?.history.length ? selectedPremium.history.map((row) => (
                                        <div key={row.id} className="rounded-lg border border-slate-100 p-3 text-xs space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-slate-800">{row.premium_status}</span>
                                                <span className="text-slate-400">{formatDateTime(row.premium_granted_at)}</span>
                                            </div>
                                            <div className="text-slate-600">source: {row.premium_source}</div>
                                            <div className="text-slate-600">expires: {formatDateTime(row.premium_expires_at)}</div>
                                            <div className="text-slate-600">notes: {row.notes || '-'}</div>
                                            <div className="text-slate-600">revoke reason: {row.revoke_reason || '-'}</div>
                                        </div>
                                    )) : (
                                        <div className="text-xs text-slate-400">베타 프리미엄 이력이 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
