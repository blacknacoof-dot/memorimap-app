import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronUp,
    Crown,
    MessageCircle,
    Shield,
    Sparkles,
    X,
    Zap,
} from 'lucide-react';
import {
    verifyPayment,
    getChannelKey,
    generateIssueId,
    requestIssueBillingKey,
    issueBillingKeySubscription,
    isRecurringSubscriptionEnabled,
} from '../lib/portone';
import { toast } from 'sonner';
import { useUser, useSession } from '../lib/auth';
import { LegalModal } from './LegalModal';
import { useUserPlan } from '../hooks/useUserPlan';

const PERSONAL_BILLING_PENDING_KEY = 'pendingPersonalBillingActivation';
const PERSONAL_BILLING_INFLIGHT_KEY = 'pendingPersonalBillingActivationInFlight';

interface PersonalPlanFeature {
    name: string;
    included: boolean;
    limit?: string;
    description?: string;
}

interface PersonalPlan {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    icon: React.ReactNode;
    color: string;
    badge?: string;
    popular?: boolean;
    features: PersonalPlanFeature[];
}

const personalPlans: PersonalPlan[] = [
    {
        id: 'PERSONAL_FREE',
        name: '무료',
        nameEn: 'PERSONAL_FREE',
        price: 0,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-slate-400 to-slate-500',
        features: [
            { name: '시설 검색', included: true },
            { name: 'AI 상담', included: true, limit: '카테고리별 1회' },
            { name: '상조 AI 비교상담', included: true, limit: '5회' },
            { name: '즐겨찾기', included: true, limit: '최대 5개' },
            { name: '엔딩노트', included: true, limit: '기본 항목' },
            { name: '예약 및 리뷰', included: true },
            { name: '광고 제거', included: false },
            { name: '제휴 할인', included: false },
            { name: '가족 공유', included: false },
        ],
    },
    {
        id: 'PERSONAL_PREMIUM',
        name: '프리미엄',
        nameEn: 'PERSONAL_PREMIUM',
        price: 4900,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-purple-500 to-fuchsia-600',
        badge: '추천',
        popular: true,
        features: [
            { name: '시설 검색', included: true },
            { name: 'AI 상담', included: true, limit: '무제한' },
            { name: '상조 AI 비교상담', included: true, limit: '무제한' },
            { name: '즐겨찾기', included: true, limit: '무제한' },
            { name: '엔딩노트', included: true, limit: '전체 + PDF 저장' },
            { name: '예약 및 리뷰', included: true },
            { name: '광고 제거', included: true },
            { name: '제휴 할인', included: true, description: '장례 용품 5% 할인' },
            { name: '가족 공유', included: true, description: '최대 3명' },
            { name: 'VIP 배지', included: true },
        ],
    },
];

interface PersonalSubscriptionPlansProps {
    onBack?: () => void;
    onOpenLogin?: () => void;
}

export default function PersonalSubscriptionPlans({ onBack: _onBack, onOpenLogin }: PersonalSubscriptionPlansProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('PERSONAL_FREE');
    const [expandedPlan, setExpandedPlan] = useState<string | null>('PERSONAL_PREMIUM');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund' | 'business' | 'license'>('business');
    const { user } = useUser();
    const { session, isLoaded } = useSession();
    const { data: userPlanData, isLoading: isUserPlanLoading, refetch: refetchUserPlan } = useUserPlan();

    const currentPlan = (userPlanData?.plan_name || 'PERSONAL_FREE').toUpperCase();
    const isGuestCheckout = !session?.access_token;
    const recurringEnabled = isRecurringSubscriptionEnabled();
    const isCancelling = userPlanData?.status === 'cancelling';
    const cancelExpiresAt = userPlanData?.expires_at ?? '';
    const isBetaPremium = userPlanData?.is_beta_premium === true;
    const isLoading = !isLoaded || isUserPlanLoading;
    const effectiveCurrentPlan = isGuestCheckout ? null : (currentPlan || selectedPlan).toUpperCase();
    const effectiveIsCancelling = isGuestCheckout ? false : isCancelling;
    const effectiveCancelExpiresAt = isGuestCheckout ? null : cancelExpiresAt;
    const effectiveIsBetaPremium = isGuestCheckout ? false : isBetaPremium;
    const userId = session?.user?.id;

    const clearBillingRedirectParams = useCallback(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('billingKey');
        url.searchParams.delete('transactionType');
        url.searchParams.delete('code');
        url.searchParams.delete('message');
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }, []);

    const redirectToBillingActivation = useCallback((billingKey: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('billingKey', billingKey);
        url.searchParams.set('transactionType', 'ISSUE_BILLING_KEY');
        url.searchParams.delete('code');
        url.searchParams.delete('message');
        window.location.replace(`${url.pathname}${url.search}${url.hash}`);
    }, []);

    useEffect(() => {
        if (!isGuestCheckout && currentPlan) {
            setSelectedPlan(currentPlan);
        }
    }, [currentPlan, isGuestCheckout]);

    useEffect(() => {
        if (!isLoaded || !session?.access_token || !userId) return;

        const params = new URLSearchParams(window.location.search);
        const billingKey = params.get('billingKey');
        const transactionType = params.get('transactionType');
        const code = params.get('code');
        const message = params.get('message');

        if (code) {
            toast.error(message ? decodeURIComponent(message) : '카드 등록에 실패했습니다.');
            sessionStorage.removeItem(PERSONAL_BILLING_PENDING_KEY);
            clearBillingRedirectParams();
            return;
        }

        if (!billingKey || transactionType !== 'ISSUE_BILLING_KEY') return;
        if (sessionStorage.getItem(PERSONAL_BILLING_INFLIGHT_KEY) === billingKey) return;

        const pendingRaw = sessionStorage.getItem(PERSONAL_BILLING_PENDING_KEY);
        if (!pendingRaw) return;

        const pending = JSON.parse(pendingRaw) as {
            userId: string;
            planId: string;
            orderName: string;
            customerName: string;
            customerEmail: string;
            customerPhoneNumber: string;
        };

        if (pending.userId !== userId) return;

        let cancelled = false;
        const activate = async () => {
            sessionStorage.setItem(PERSONAL_BILLING_INFLIGHT_KEY, billingKey);
            sessionStorage.removeItem(PERSONAL_BILLING_PENDING_KEY);
            setIsPaymentOpen(true);
            try {
                const activation = await issueBillingKeySubscription({
                    billingKey,
                    paymentContext: 'personal_subscription',
                    planId: pending.planId,
                    targetUserId: userId,
                    authToken: session.access_token,
                    orderName: pending.orderName,
                    customerName: pending.customerName,
                    customerEmail: pending.customerEmail,
                    customerPhoneNumber: pending.customerPhoneNumber,
                });

                if (cancelled) return;
                if (!activation.success) {
                    toast.error(activation.error || '정기결제 시작에 실패했습니다. 결제 상태를 확인해 주세요.');
                    return;
                }

                setSelectedPlan(pending.planId);
                await refetchUserPlan();
                toast.success('정기결제가 시작되었습니다.');
            } finally {
                sessionStorage.removeItem(PERSONAL_BILLING_INFLIGHT_KEY);
                clearBillingRedirectParams();
                if (!cancelled) {
                    setIsPaymentOpen(false);
                }
            }
        };

        void activate();

        return () => {
            cancelled = true;
        };
    }, [clearBillingRedirectParams, isLoaded, refetchUserPlan, session, userId]);

    const cancelPayment = useCallback(() => {
        const bodyChildren = document.body.children;
        const appRoot = document.getElementById('root');
        const toRemove: Element[] = [];
        for (let i = 0; i < bodyChildren.length; i++) {
            const el = bodyChildren[i];
            if (el === appRoot || ['SCRIPT', 'LINK', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
            if (el.tagName === 'IFRAME' || (el.tagName === 'DIV' && el !== appRoot)) {
                toRemove.push(el);
            }
        }
        toRemove.forEach((el) => el.remove());
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        setIsPaymentOpen(false);
        toast('결제가 취소되었습니다.');
    }, []);

    const handleSelectPlan = async (plan: PersonalPlan) => {
        if (plan.id === effectiveCurrentPlan) return;

        if (isGuestCheckout) {
            toast('로그인 후 정기결제를 시작할 수 있습니다.');
            onOpenLogin?.();
            return;
        }

        if (!isLoaded || !session?.access_token || !userId) {
            toast.error('로그인 세션을 확인하는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        if (plan.id === 'PERSONAL_FREE') {
            if (!confirm('구독을 해지하시겠습니까?\n\n현재 이용 기간이 끝날 때까지 유료 기능을 계속 사용할 수 있습니다.\n만료 후 자동으로 무료 플랜으로 전환됩니다.')) {
                return;
            }

            try {
                const result = await verifyPayment({
                    paymentContext: 'personal_free_downgrade',
                    authToken: session.access_token,
                });
                if (!result.persisted) {
                    toast.error(result.error || '구독 해지에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                    return;
                }
            } catch {
                toast.error('구독 해지에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }

            await refetchUserPlan();
            toast.success('구독 해지가 예약되었습니다. 이용 기간 만료까지 유료 기능을 사용할 수 있습니다.');
            return;
        }

        if (!window.PortOne) {
            toast.error('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        if (!recurringEnabled) {
            toast.error('정기결제 준비 중입니다. 확인 완료 후 다시 시도해 주세요.');
            return;
        }

        try {
            setIsPaymentOpen(true);
            const issueId = generateIssueId('psub');
            sessionStorage.setItem(PERSONAL_BILLING_PENDING_KEY, JSON.stringify({
                userId,
                planId: plan.nameEn,
                orderName: `[추모맵] 개인 ${plan.name} 정기결제`,
                customerName: user?.fullName || user?.firstName || '개인 사용자',
                customerEmail: user?.primaryEmailAddress?.emailAddress || session.user?.email || '',
                customerPhoneNumber: user?.primaryPhoneNumber?.phoneNumber || '',
            }));

            const billingKeyResponse = await requestIssueBillingKey({
                channelKey: getChannelKey('billing'),
                issueId,
                issueName: `[추모맵] 개인 ${plan.name} 정기결제 카드 등록`,
                customerName: user?.fullName || user?.firstName || '개인 사용자',
                customerPhoneNumber: user?.primaryPhoneNumber?.phoneNumber || '',
                customerEmail: user?.primaryEmailAddress?.emailAddress || session.user?.email || '',
            });

            if (billingKeyResponse.code !== undefined || !billingKeyResponse.billingKey) {
                console.error('[PortOne billing key issuance failed]', {
                    issueId,
                    planId: plan.nameEn,
                    paymentContext: 'personal_subscription',
                    response: billingKeyResponse,
                });
                sessionStorage.removeItem(PERSONAL_BILLING_PENDING_KEY);
                toast.error(billingKeyResponse.message || '카드 등록에 실패했습니다.');
                return;
            }

            redirectToBillingActivation(billingKeyResponse.billingKey);
        } catch (error) {
            sessionStorage.removeItem(PERSONAL_BILLING_PENDING_KEY);
            const msg = error instanceof Error ? error.message : '';
            if (!msg.includes('취소')) {
                toast.error('결제 중 오류가 발생했습니다.');
            }
        } finally {
            setIsPaymentOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 flex flex-col relative">
            {isPaymentOpen && (
                <button
                    onClick={cancelPayment}
                    className="fixed bottom-6 left-1/2 z-[2147483646] flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xl transition-transform active:scale-95"
                >
                    <ArrowLeft size={18} />
                    결제 취소하고 돌아가기
                </button>
            )}

            <div className="border-b bg-white px-6 py-8 text-center">
                <div className="mb-3 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    FOR YOU
                </div>
                <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900">
                    나와 가족을 위한
                    <br />
                    미리 준비하는 기록
                </h1>
                <p className="text-sm leading-relaxed text-slate-500">
                    AI 상담부터 엔딩노트까지,
                    <br />
                    필요한 준비를 차분하게 이어가세요.
                </p>
            </div>

            {isGuestCheckout && (
                <div className="px-4 pt-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900">로그인 후 이용 안내</h2>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            개인 유료 플랜은 로그인한 계정에서 카드 등록 후 정기결제로 시작됩니다.
                            결제 이력과 구독 상태도 같은 계정에서만 확인할 수 있습니다.
                        </p>
                    </div>
                </div>
            )}

            <div className="px-4 py-4">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="grid grid-cols-3 border-b border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 md:p-3">
                            <p className="text-[10px] font-bold text-slate-400">기능</p>
                        </div>
                        {personalPlans.map((plan) => (
                            <div key={plan.id} className={`p-2 md:p-3 ${plan.id === effectiveCurrentPlan ? 'bg-primary/5' : ''}`}>
                                <p className="text-[10px] font-bold text-slate-600">{plan.name}</p>
                                <p className="text-xs font-black text-slate-900">{plan.price === 0 ? '무료' : `${plan.price.toLocaleString()}원`}</p>
                            </div>
                        ))}
                    </div>
                    {[
                        { label: 'AI 상담', values: ['1회', '무제한'] },
                        { label: '상조 비교', values: ['5회', '무제한'] },
                        { label: '즐겨찾기', values: ['5개', '무제한'] },
                        { label: '엔딩노트', values: ['기본', 'PDF + 저장'] },
                        { label: '광고 제거', values: ['X', 'O'] },
                        { label: '제휴 할인', values: ['X', '5%'] },
                        { label: '가족 공유', values: ['X', '3명'] },
                    ].map((row) => (
                        <div key={row.label} className="grid grid-cols-3 border-b border-slate-50 text-center last:border-0">
                            <div className="bg-slate-50 p-1.5 text-left md:p-2.5">
                                <p className="text-[10px] font-medium text-slate-500">{row.label}</p>
                            </div>
                            {row.values.map((value, index) => (
                                <div key={`${row.label}-${value}`} className={`p-1.5 md:p-2.5 ${personalPlans[index].id === effectiveCurrentPlan ? 'bg-primary/5' : ''}`}>
                                    <p className={`text-[10px] font-bold ${value === 'X' ? 'text-slate-300' : value === '무제한' || value === 'PDF + 저장' ? 'text-purple-600' : 'text-slate-700'}`}>
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {effectiveIsBetaPremium && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">
                        베타 프리미엄 사용 중
                        {effectiveCancelExpiresAt ? ` (${new Date(effectiveCancelExpiresAt).toLocaleDateString('ko-KR')}까지)` : ''}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-4 px-4 py-2 pb-24">
                {personalPlans.map((plan) => {
                    const isExpanded = expandedPlan === plan.id;
                    const isCurrent = effectiveCurrentPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`group relative rounded-2xl border-2 bg-white transition-all duration-300 ${isExpanded ? 'border-primary shadow-lg ring-1 ring-primary/10' : isCurrent ? 'border-green-300 shadow-sm' : 'border-slate-100 shadow-sm'}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-6 z-10 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white shadow-md">
                                    <Sparkles size={10} /> BEST
                                </div>
                            )}

                            {isCurrent && (
                                <div className={`absolute -top-3 right-6 z-10 rounded-full px-3 py-1 text-[10px] font-bold text-white shadow-md ${effectiveIsBetaPremium ? 'bg-blue-500' : effectiveIsCancelling ? 'bg-amber-500' : 'bg-green-500'}`}>
                                    {effectiveIsCancelling ? '해지 예정' : '현재 플랜'}
                                </div>
                            )}

                            <div className="flex cursor-pointer items-center gap-4 p-5" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.color} text-white shadow-inner`}>
                                    {plan.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                        {plan.badge && (
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-0.5 flex items-baseline gap-1">
                                        <span className="text-xl font-black text-slate-900">
                                            {plan.price === 0 ? '무료' : plan.price.toLocaleString()}
                                        </span>
                                        {plan.price > 0 && <span className="text-xs font-medium text-slate-500">원 / 월</span>}
                                    </div>
                                </div>
                                <div className="text-slate-300 transition-colors group-hover:text-slate-400">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="animate-in slide-in-from-top-2 border-t border-slate-50 px-5 pb-5 pt-4 fade-in">
                                    <div className="mb-6 space-y-3">
                                        {plan.features.map((feature) => (
                                            <div key={`${plan.id}-${feature.name}`} className="flex items-start gap-3">
                                                <div className={`mt-0.5 ${feature.included ? 'text-green-500' : 'text-slate-200'}`}>
                                                    {feature.included ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-xs ${feature.included ? 'font-medium text-slate-700' : 'text-slate-300'}`}>
                                                            {feature.name}
                                                        </p>
                                                        {feature.limit && (
                                                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${feature.limit === '무제한' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-500'}`}>
                                                                {feature.limit}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {feature.description && <p className="mt-0.5 text-[10px] text-slate-400">{feature.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {plan.price > 0 && !isCurrent && (
                                        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                            <p className="mb-1 text-[10px] font-bold text-slate-600">
                                                {isGuestCheckout ? '로그인 안내' : '정기결제 안내'}
                                            </p>
                                            <ul className="space-y-0.5 text-[10px] text-slate-500">
                                                {isGuestCheckout ? (
                                                    <>
                                                        <li>로그인한 계정에서만 개인 유료 플랜을 시작할 수 있습니다.</li>
                                                        <li>카드 등록과 구독 관리도 로그인 후에만 가능합니다.</li>
                                                        <li>결제 이력은 로그인한 계정에서만 확인할 수 있습니다.</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>첫 카드 등록과 초회 결제 완료 후 매월 자동으로 결제됩니다.</li>
                                                        <li>해지 요청 시 다음 결제일부터 자동청구가 중단됩니다.</li>
                                                        <li>이미 결제된 당월 금액은 환불되지 않습니다.</li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {isCurrent && effectiveIsCancelling && effectiveCancelExpiresAt && (
                                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-[11px] font-bold text-amber-800">
                                                {new Date(effectiveCancelExpiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 이용 가능
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-amber-600">
                                                만료 후 자동으로 무료 플랜으로 전환됩니다.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isCurrent || isPaymentOpen}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all active:scale-[0.98] ${isCurrent || isPaymentOpen ? 'cursor-default bg-slate-100 text-slate-400' : `bg-gradient-to-r ${plan.color} text-white shadow-lg shadow-blue-500/20`}`}
                                    >
                                        {isPaymentOpen
                                            ? '정기결제 등록 중...'
                                            : isCurrent
                                                ? effectiveIsCancelling
                                                    ? '해지 예약됨'
                                                    : '현재 이용 중'
                                                : plan.price === 0
                                                    ? '구독 해지하기'
                                                    : isGuestCheckout
                                                        ? '로그인 후 이용하기'
                                                        : recurringEnabled
                                                            ? '정기결제 시작하기'
                                                            : '정기결제 준비 중'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Shield size={16} className="text-primary" /> 안내 사항
                    </h3>
                    <div className="space-y-3 text-[11px] leading-relaxed text-slate-500">
                        {isGuestCheckout ? (
                            <>
                                <p>개인 유료 플랜은 로그인 후 카드 등록과 정기결제로만 시작할 수 있습니다.</p>
                                <p>무료 플랜은 시설 검색과 기본 AI 상담, 엔딩노트 기본 항목을 제공합니다.</p>
                            </>
                        ) : (
                            <>
                                <p>유료 플랜은 첫 카드 등록과 초회 결제 완료 후 매월 자동으로 결제됩니다.</p>
                                <p>해지 요청 시 다음 결제일부터 자동청구가 중단되며 현재 이용 기간은 유지됩니다.</p>
                                <p>이미 결제된 당월 금액은 환불되지 않습니다.</p>
                            </>
                        )}
                        <p>결제 관련 문의: <strong className="text-slate-700">atomcare@naver.com</strong></p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Shield size={16} className="text-primary" /> 결제 전 확인 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { setLegalTab('business'); setShowLegalModal(true); }}
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            사업자 정보
                        </button>
                        <button
                            onClick={() => { setLegalTab('refund'); setShowLegalModal(true); }}
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            환불/해지 정책
                        </button>
                        <button
                            onClick={() => { setLegalTab('terms'); setShowLegalModal(true); }}
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            이용약관
                        </button>
                        <button
                            onClick={() => { setLegalTab('privacy'); setShowLegalModal(true); }}
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            개인정보처리방침
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <MessageCircle size={16} className="text-primary" /> 자주 묻는 질문
                    </h3>
                    <div className="space-y-5">
                        <FAQItem
                            question="무료 플랜으로도 충분히 이용할 수 있나요?"
                            answer="네. 기본적인 시설 검색과 AI 상담, 예약 기능은 무료로 이용할 수 있습니다. 더 많은 AI 상담과 엔딩노트 기능이 필요하다면 프리미엄을 이용해 주세요."
                        />
                        <FAQItem
                            question="가족 공유는 어떻게 사용하나요?"
                            answer="프리미엄 플랜에서 최대 3명까지 초대할 수 있습니다. 초대한 가족은 함께 준비 내용을 확인할 수 있습니다."
                        />
                        <FAQItem
                            question="해지 후에도 데이터가 유지되나요?"
                            answer="네. 저장된 데이터는 유지되지만 프리미엄 전용 기능은 무료 플랜 기준으로 제한됩니다."
                        />
                        <FAQItem
                            question="결제는 어떻게 진행되나요?"
                            answer={isGuestCheckout
                                ? '개인 유료 플랜은 로그인 후 카드 등록과 정기결제로만 시작할 수 있습니다.'
                                : '국내 신용카드를 지원하며 카드 등록 후 초회 결제가 완료되면 이후에는 매월 자동 결제가 진행됩니다.'}
                        />
                    </div>
                </div>
            </div>

            {showLegalModal && <LegalModal initialTab={legalTab} onClose={() => setShowLegalModal(false)} />}
        </div>
    );
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <div>
        <h4 className="mb-1 flex items-start gap-1 text-[12px] font-bold text-slate-800">
            <span className="text-primary">Q.</span> {question}
        </h4>
        <p className="pl-4 text-[11px] leading-relaxed text-slate-500">{answer}</p>
    </div>
);
