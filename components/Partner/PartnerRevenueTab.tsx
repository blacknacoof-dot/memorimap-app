import React, { lazy, Suspense } from 'react';
import {
    Crown, Wallet, CreditCard, BarChart3, X
} from 'lucide-react';
import { Consultation } from '../../lib/queries';
import { Reservation } from '../../types';
import type { Subscription, Payment } from '../../types/db';
import { toast } from 'sonner';
import { UpgradeBenefitComparison } from './UpgradeBenefitComparison';
import { CommissionSimulator } from './CommissionSimulator';
import { ActivityStats } from './ActivityStats';
import { normalizeSubscriptionPlanId } from '../../lib/subscriptionPlanIds';

const SubscriptionPlans = lazy(() => import('../SubscriptionPlans'));

const PLAN_DISPLAY_NAMES: Record<string, string> = {
    sj_starter: '파일럿',
    SJ_STARTER: '파일럿',
    sj_professional: '프로페셔널',
    SJ_PROFESSIONAL: '프로페셔널',
    sj_enterprise: '엔터프라이즈',
    SJ_ENTERPRISE: '엔터프라이즈',
    free: '무료체험',
    basic: '라이트',
    premium: '프리미엄',
    enterprise: '엔터프라이즈',
};

function getPlanDisplayName(subscription: Subscription | null): string {
    if (!subscription) return '미구독';
    const key = subscription.plan_id || subscription.plan_name || '';
    return PLAN_DISPLAY_NAMES[key] || key || '미구독';
}

interface Props {
    consultations: Consultation[];
    reservations: Reservation[];
    subscription: Subscription | null;
    payments: Payment[];
    facilityId: string; // facilities.id UUID
    showPlanSelector: boolean;
    setShowPlanSelector: (v: boolean) => void;
}

export const PartnerRevenueTab: React.FC<Props> = ({
    consultations, reservations, subscription, payments,
    facilityId, showPlanSelector, setShowPlanSelector
}) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthlyConsultations = consultations.filter(c => {
        const d = new Date(c.created_at);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    });
    const monthlyReservations = reservations.filter(r => {
        const d = new Date(r.visit_date);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    });

    return (
        <div className="space-y-6">
            {/* 요금제 선택 패널 */}
            {showPlanSelector && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                            <Crown size={18} className="text-purple-600" />
                            상조 요금제 선택
                        </h3>
                        <button onClick={() => setShowPlanSelector(false)} className="text-slate-400 hover:text-slate-600 p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <Suspense fallback={<div className="text-center py-8 text-slate-400 text-sm">로딩중...</div>}>
                        <SubscriptionPlans
                            type="sangjo"
                            currentPlan={normalizeSubscriptionPlanId(subscription?.plan_id ?? subscription?.plan_name) ?? undefined}
                            facilityId={facilityId}
                            onSelectPlan={(planId) => {
                                toast.success(`${planId} 플랜 신청이 접수되었습니다.`);
                                setShowPlanSelector(false);
                            }}
                        />
                    </Suspense>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={`p-6 rounded-3xl text-white shadow-xl relative overflow-hidden ${
                    subscription?.status === 'cancelling'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : subscription
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Crown className="w-6 h-6" />
                        </div>
                        <button
                            onClick={() => setShowPlanSelector(!showPlanSelector)}
                            className="text-[11px] font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {subscription ? '요금제 변경' : '요금제 선택'}
                        </button>
                    </div>
                    <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1">나의 요금제</p>
                    <h2 className="text-2xl font-black tracking-tight">
                        {getPlanDisplayName(subscription)}
                        {subscription && (
                            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full align-middle ${
                                subscription.status === 'cancelling' ? 'bg-white/30' : 'bg-white/20'
                            }`}>
                                {subscription.status === 'cancelling' ? '해지 예정' : '구독중'}
                            </span>
                        )}
                    </h2>
                    {subscription?.status === 'cancelling' && subscription?.next_billing_date && (
                        <p className="text-[10px] text-white/80 mt-2">
                            {new Date(subscription.next_billing_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 이용 가능
                        </p>
                    )}
                    {subscription?.status !== 'cancelling' && subscription?.next_billing_date && (
                        <p className="text-[10px] text-white/70 mt-2">
                            다음 결제: {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">이번 달 상담</p>
                    <h2 className="text-2xl font-black text-slate-800">{monthlyConsultations.length}건</h2>
                    <p className="text-[10px] text-slate-400 mt-2">
                        답변 완료 <span className="text-emerald-600 font-bold">
                            {monthlyConsultations.filter(c => c.status === 'accepted' || c.status === 'completed').length}건
                        </span>
                    </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">이번 달 예약</p>
                    <h2 className="text-2xl font-black text-slate-800">{monthlyReservations.length}건</h2>
                    <p className="text-[10px] text-slate-400 mt-2">
                        확정 <span className="text-green-600 font-bold">
                            {monthlyReservations.filter(r => r.status === 'confirmed').length}건
                        </span>
                    </p>
                </div>
            </div>

            {/* 활동 통계 (최근 6개월 + 전환율) */}
            <ActivityStats consultations={consultations} reservations={reservations} />

            {/* 수수료 절감 시뮬레이터 */}
            <CommissionSimulator subscription={subscription} />

            {/* 결제 내역 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Wallet size={18} className="text-blue-600" />
                        구독 결제 내역
                    </h3>
                </div>
                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[400px]">
                        <thead className="bg-slate-50 text-slate-500 text-xs">
                            <tr>
                                <th className="text-left px-3 md:px-6 py-3 font-bold">결제일</th>
                                <th className="text-left px-3 md:px-6 py-3 font-bold">내용</th>
                                <th className="text-right px-3 md:px-6 py-3 font-bold">금액</th>
                                <th className="text-right px-3 md:px-6 py-3 font-bold">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 md:px-6 py-3.5 text-slate-600 text-xs">
                                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-3 md:px-6 py-3.5 text-slate-800 font-medium text-xs">
                                        {p.billing_period_start && p.billing_period_end
                                            ? `${new Date(p.billing_period_start).toLocaleDateString()} ~ ${new Date(p.billing_period_end).toLocaleDateString()}`
                                            : '구독 결제'}
                                    </td>
                                    <td className="px-3 md:px-6 py-3.5 text-right font-black text-slate-800 text-xs">
                                        {(p.final_amount || p.amount || 0).toLocaleString()}원
                                    </td>
                                    <td className="px-3 md:px-6 py-3.5 text-right">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            p.status === 'succeeded' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {p.status === 'succeeded' ? '완료' : p.status === 'failed' ? '실패' : '대기'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-400 text-sm">
                        구독 결제 내역이 없습니다.
                    </div>
                )}
            </div>

            {/* 업그레이드 혜택 비교 */}
            <UpgradeBenefitComparison
                subscription={subscription}
                onUpgrade={() => setShowPlanSelector(true)}
            />

            {/* 구독 플랜 상세 */}
            {subscription && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Crown size={18} className="text-purple-600" />
                        현재 요금제
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">플랜</p>
                            <p className="font-black text-slate-800">{subscription.plan_name || '-'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">월 요금</p>
                            <p className="font-black text-slate-800">
                                {subscription.plan_price ? `${Number(subscription.plan_price).toLocaleString()}원` : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">시작일</p>
                            <p className="font-black text-slate-800">
                                {(subscription.started_at || subscription.start_date) ? new Date(subscription.started_at || subscription.start_date || '').toLocaleDateString() : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">다음 결제일</p>
                            <p className="font-black text-slate-800">
                                {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
