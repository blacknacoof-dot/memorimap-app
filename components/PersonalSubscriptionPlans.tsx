import React, { useState, useCallback } from 'react';
import {
    Check, X, Sparkles, Crown, Zap, ChevronDown, ChevronUp,
    MessageCircle, Shield, ArrowLeft
} from 'lucide-react';
import { requestPayment, verifyPayment, PORTONE_CONFIG, getChannelKey, generatePaymentId } from '../lib/portone';
import { toast } from 'sonner';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { LegalModal } from './LegalModal';
import { useUserPlan } from '../hooks/useUserPlan';

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
    originalPrice?: number;
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
            { name: '시설 지도 검색', included: true },
            { name: 'AI 상담', included: true, limit: '카테고리당 1건' },
            { name: '상조 AI 비교상담', included: true, limit: '5회' },
            { name: '즐겨찾기', included: true, limit: '최대 5개' },
            { name: '엔딩노트', included: true, limit: '기본 항목만' },
            { name: '예약 / 리뷰', included: true },
            { name: '광고 표시', included: true, description: '배너 광고 포함' },
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
            { name: '시설 지도 검색', included: true },
            { name: 'AI 상담', included: true, limit: '무제한' },
            { name: '상조 AI 비교상담', included: true, limit: '무제한' },
            { name: '즐겨찾기', included: true, limit: '무제한' },
            { name: '엔딩노트', included: true, limit: '전체 + PDF 저장' },
            { name: '예약 / 리뷰', included: true },
            { name: '광고 제거', included: true },
            { name: '제휴 할인', included: true, description: '장례 용품 5% 할인' },
            { name: '가족 공유', included: true, description: '최대 3명' },
            { name: 'VIP 배지', included: true },
        ],
    },
    // PERSONAL_SIGNATURE는 DB 미정의 → 출시 후 Phase B에서 추가 예정
];

interface PersonalSubscriptionPlansProps {
    onBack?: () => void;
}

export default function PersonalSubscriptionPlans({ onBack: _onBack }: PersonalSubscriptionPlansProps) {
    const [_selectedPlan, setSelectedPlan] = useState<string>('PERSONAL_FREE');
    const [expandedPlan, setExpandedPlan] = useState<string | null>('PERSONAL_PREMIUM');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund' | 'business' | 'license'>('business');
    const { user } = useUser();
    const { session, isLoaded } = useSession();
    const { data: userPlanData, isLoading: isUserPlanLoading, refetch: refetchUserPlan } = useUserPlan();

    const currentPlan = (userPlanData?.plan_name || 'PERSONAL_FREE').toUpperCase();
    const isCancelling = userPlanData?.status === 'cancelling';
    const cancelExpiresAt = userPlanData?.expires_at ?? null;
    const isBetaPremium = userPlanData?.is_beta_premium === true;
    const isLoading = !isLoaded || isUserPlanLoading;
    const setCurrentPlan = (_value: string) => {};
    const setIsCancelling = (_value: boolean) => {};
    const setCancelExpiresAt = (_value: string | null) => {};
    const setIsLoading = (_value: boolean) => {};

    const cancelPayment = useCallback(() => {
        // PortOne이 body에 직접 추가한 모든 overlay/iframe 제거
        const bodyChildren = document.body.children;
        const appRoot = document.getElementById('root');
        const toRemove: Element[] = [];
        for (let i = 0; i < bodyChildren.length; i++) {
            const el = bodyChildren[i];
            // React root, script, link, style 태그는 보존
            if (el === appRoot || ['SCRIPT', 'LINK', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
            // PortOne이 생성한 div/iframe 제거
            if (el.tagName === 'IFRAME' || (el.tagName === 'DIV' && el !== appRoot)) {
                toRemove.push(el);
            }
        }
        toRemove.forEach(el => el.remove());
        // body 스크롤 복원
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        setIsPaymentOpen(false);
        toast('결제가 취소되었습니다.');
    }, []);

    const loadCurrentPlan = async () => {
        if (!session) {
            setIsLoading(false);
            return;
        }
        try {
            const userId = session.user?.id;
            if (!userId) { setIsLoading(false); return; }
            const client = await getAuthClient(session, { strict: true });
            const { data } = await client
                .from('user_subscriptions')
                .select('plan_id, status, expires_at')
                .eq('user_id', userId)
                .in('status', ['active', 'cancelling'])
                .maybeSingle();
            if (data?.plan_id) {
                setCurrentPlan(data.plan_id);
                setSelectedPlan(data.plan_id);
                setCancelExpiresAt(data.expires_at ?? null);
                if (data.status === 'cancelling') {
                    setIsCancelling(true);
                } else {
                    setIsCancelling(false);
                }
            }
        } catch {
            // 테이블 없으면 무료 기본값 유지
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPlan = async (plan: PersonalPlan) => {
        if (plan.id === currentPlan) return;
        const userId = session?.user?.id;

        if (plan.id === 'PERSONAL_FREE') {
            // 구독 해지 예약 — 갱신 중단, 만료까지 유료 유지
            if (!confirm('구독을 해지하시겠습니까?\n\n현재 이용 기간이 끝날 때까지 유료 기능을 계속 사용할 수 있습니다.\n만료 후 자동으로 무료 플랜으로 전환됩니다.')) {
                return;
            }
            try {
                const result = await verifyPayment({
                    paymentContext: 'personal_free_downgrade',
                });
                if (!result.persisted) {
                    toast.error(result.error || '구독 해지에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                    return;
                }
            } catch (_e) {
                toast.error('구독 해지에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }
            await refetchUserPlan();
            toast.success('구독 해지가 예약되었습니다. 이용 기간 만료까지 유료 기능을 사용할 수 있습니다.');
            return;
        }

        if (!window.PortOne) {
            toast.error('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        try {
            setIsPaymentOpen(true);
            const paymentId = generatePaymentId('psub');
            const response = await requestPayment({
                storeId: PORTONE_CONFIG.STORE_ID,
                channelKey: getChannelKey('general'),  // Phase C 전까지 일반결제 채널 사용
                paymentId,
                orderName: `[추모맵] 개인 ${plan.name} 플랜`,
                totalAmount: plan.price,
                currency: "KRW",
                payMethod: "CARD",
                customer: {
                    fullName: user?.fullName || user?.firstName || "개인 사용자",
                    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || "",
                    email: user?.primaryEmailAddress?.emailAddress || session?.user?.email || "",
                },
            });

            if (response.code !== undefined) {
                toast.error(`결제 실패: ${response.message}`);
                return;
            }

            // 서버사이드 결제 검증
            if (!userId) {
                toast.error('사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.');
                return;
            }

            const verification = await verifyPayment({
                paymentId: response.paymentId || paymentId,
                expectedAmount: plan.price,
                paymentContext: 'personal_subscription',
                planId: plan.nameEn,
                targetUserId: userId,
            });
            if (!verification.verified) {
                toast.error(verification.error || '결제 검증에 실패했습니다. 고객센터에 문의해주세요.');
                return;
            }

            // DB 영속화는 verify-payment EF (service_role)에서 처리
            if (verification.persisted === false) {
                toast.error(verification.error || '결제는 완료되었으나 구독 정보 저장에 실패했습니다. 고객센터에 문의해주세요.');
                return;
            }

            setSelectedPlan(plan.id);
            await refetchUserPlan();
            toast.success(`${plan.name} 구독이 시작되었습니다!`);
        } catch (error) {
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
            {/* 결제 진행 중 취소 버튼 */}
            {isPaymentOpen && (
                <button
                    onClick={cancelPayment}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483646] bg-white text-slate-700 px-6 py-3.5 rounded-full shadow-2xl border border-slate-200 font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={18} />
                    결제 취소하고 돌아가기
                </button>
            )}
            {/* Header */}
            <div className="px-6 py-8 text-center bg-white border-b">
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full mb-3">
                    FOR YOU
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                    나와 가족을 위한<br />든든한 준비
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                    AI 상담부터 엔딩노트까지,<br />소중한 순간을 미리 준비하세요.
                </p>
            </div>

            {/* 요금 비교 요약 */}
            <div className="px-4 py-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-3 text-center border-b border-slate-100">
                        <div className="p-2 md:p-3 bg-slate-50">
                            <p className="text-[10px] font-bold text-slate-400">기능</p>
                        </div>
                        {personalPlans.map(plan => (
                            <div key={plan.id} className={`p-2 md:p-3 ${plan.id === currentPlan ? 'bg-primary/5' : ''}`}>
                                <p className="text-[10px] font-bold text-slate-600">{plan.name}</p>
                                <p className="text-xs font-black text-slate-900">
                                    {plan.price === 0 ? '무료' : `${plan.price.toLocaleString()}원`}
                                </p>
                            </div>
                        ))}
                    </div>
                    {[
                        { label: 'AI 상담', values: ['1건', '무제한'] },
                        { label: '상조 비교', values: ['5회', '무제한'] },
                        { label: '즐겨찾기', values: ['5개', '무제한'] },
                        { label: '엔딩노트', values: ['기본', 'PDF + 공유'] },
                        { label: '광고 제거', values: ['X', 'O'] },
                        { label: '제휴 할인', values: ['X', '5%'] },
                        { label: '가족 공유', values: ['X', '3명'] },
                    ].map((row, idx) => (
                        <div key={idx} className="grid grid-cols-3 text-center border-b border-slate-50 last:border-0">
                            <div className="p-1.5 md:p-2.5 bg-slate-50 text-left">
                                <p className="text-[10px] font-medium text-slate-500">{row.label}</p>
                            </div>
                            {row.values.map((val, vi) => (
                                <div key={vi} className={`p-1.5 md:p-2.5 ${personalPlans[vi].id === currentPlan ? 'bg-primary/5' : ''}`}>
                                    <p className={`text-[10px] font-bold ${val === 'X' ? 'text-slate-300' : val === '무제한' || val === 'PDF + 공유' ? 'text-purple-600' : 'text-slate-700'}`}>
                                        {val}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {isBetaPremium && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">
                        베타 프리미엄 사용 중
                        {cancelExpiresAt ? ` (${new Date(cancelExpiresAt).toLocaleDateString('ko-KR')}까지)` : ''}
                    </div>
                )}
            </div>

            {/* Plan Cards */}
            <div className="flex-1 px-4 py-2 space-y-4 pb-24">
                {personalPlans.map((plan) => {
                    const isExpanded = expandedPlan === plan.id;
                    const isCurrent = currentPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 ${isExpanded ? 'border-primary shadow-lg ring-1 ring-primary/10' : isCurrent ? 'border-green-300 shadow-sm' : 'border-slate-100 shadow-sm'}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-6 z-10 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                    <Sparkles size={10} /> BEST
                                </div>
                            )}

                            {isCurrent && (
                                <div className={`absolute -top-3 right-6 z-10 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md ${
                                    isBetaPremium ? 'bg-blue-500' : isCancelling ? 'bg-amber-500' : 'bg-green-500'
                                }`}>
                                    {isCancelling ? '해지 예정' : '현재 플랜'}
                                </div>
                            )}

                            {/* Plan Header */}
                            <div
                                className="p-5 flex items-center gap-4 cursor-pointer"
                                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white shadow-inner`}>
                                    {plan.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                        {plan.badge && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        {plan.originalPrice && (
                                            <span className="text-xs text-slate-400 line-through mr-1">
                                                {plan.originalPrice.toLocaleString()}원
                                            </span>
                                        )}
                                        <span className="text-xl font-black text-slate-900">
                                            {plan.price === 0 ? '무료' : plan.price.toLocaleString()}
                                        </span>
                                        {plan.price > 0 && (
                                            <span className="text-xs text-slate-500 font-medium">원 / 월</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {/* Feature List (Accordion) */}
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-slate-50 pt-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className={`mt-0.5 ${feature.included ? 'text-green-500' : 'text-slate-200'}`}>
                                                    {feature.included ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-xs ${feature.included ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                                                            {feature.name}
                                                        </p>
                                                        {feature.limit && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${feature.limit === '무제한' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-500'}`}>
                                                                {feature.limit}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {feature.description && (
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{feature.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 결제 안내 블록 — 유료 플랜만 */}
                                    {plan.price > 0 && !isCurrent && (
                                        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-600 mb-1">구독 결제 안내</p>
                                            <ul className="text-[10px] text-slate-500 space-y-0.5">
                                                <li>• 결제 완료 후 30일간 이용 가능</li>
                                                <li>• 해지 시 다음 결제일부터 중단</li>
                                                <li>• 이미 결제된 당월 금액은 환불되지 않습니다</li>
                                            </ul>
                                        </div>
                                    )}

                                    {isCurrent && isCancelling && cancelExpiresAt && (
                                        <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                            <p className="text-[11px] font-bold text-amber-800">
                                                {new Date(cancelExpiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 이용 가능
                                            </p>
                                            <p className="text-[10px] text-amber-600 mt-0.5">
                                                만료 후 자동으로 무료 플랜으로 전환됩니다.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isCurrent && !isCancelling}
                                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                            isCurrent && !isCancelling
                                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                                : isCurrent && isCancelling
                                                    ? 'bg-slate-100 text-slate-400 cursor-default'
                                                    : `bg-gradient-to-r ${plan.color} text-white shadow-lg shadow-blue-500/20`
                                        }`}
                                    >
                                        {isCurrent && isCancelling
                                            ? '해지 예약됨'
                                            : isCurrent
                                                ? '현재 이용 중'
                                                : plan.price === 0
                                                    ? isCancelling ? '이미 해지 예약됨' : '구독 해지하기'
                                                    : '구독 시작하기'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 안내 사항 */}
                <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-primary" /> 안내 사항
                    </h3>
                    <div className="space-y-3 text-[11px] text-slate-500 leading-relaxed">
                        <p>• 유료 플랜은 <strong className="text-slate-700">월 구독 결제</strong>로 진행됩니다.</p>
                        <p>• 결제 완료 후 30일간 이용 가능합니다.</p>
                        <p>• <strong className="text-slate-700">해지 시 다음 결제일부터 중단</strong>되며, 이미 결제된 당월은 환불되지 않습니다.</p>
                        <p>• 해지 후에도 남은 이용 기간까지 서비스를 이용하실 수 있습니다.</p>
                        <p>• 결제 관련 문의: <strong className="text-slate-700">support@memorimap.kr</strong></p>
                    </div>
                </div>

                <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
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
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                        결제 전에 사업자 정보와 이용약관, 개인정보처리방침, 환불/해지 정책을 확인할 수 있습니다.
                    </p>
                </div>

                {/* FAQ */}
                <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageCircle size={16} className="text-primary" /> 자주 묻는 질문
                    </h3>
                    <div className="space-y-5">
                        <FAQItem
                            question="무료 플랜으로도 충분히 이용할 수 있나요?"
                            answer="네, 기본적인 시설 검색과 AI 상담, 예약 기능은 무료로 이용하실 수 있습니다. 더 많은 AI 상담과 엔딩노트, 할인 혜택이 필요하시다면 유료 플랜을 추천드립니다."
                        />
                        <FAQItem
                            question="가족 공유는 어떻게 사용하나요?"
                            answer="프리미엄 플랜에서 최대 3명의 가족을 초대할 수 있습니다. 초대된 가족은 엔딩노트와 즐겨찾기를 함께 확인하고 관리할 수 있습니다."
                        />
                        <FAQItem
                            question="해지 후에도 데이터가 보존되나요?"
                            answer="네, 해지 후에도 기존 데이터(즐겨찾기, 엔딩노트, 예약 내역 등)는 무료 플랜 한도 내에서 유지됩니다. 한도 초과분은 조회만 가능하며 새로 추가할 수 없습니다."
                        />
                        <FAQItem
                            question="제휴 할인은 어디에서 사용하나요?"
                            answer="추모맵과 제휴된 장례 용품점, 꽃배달 서비스 등에서 사용 가능합니다. 결제 시 추모맵 회원 인증 후 자동 적용됩니다."
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
        <h4 className="text-[12px] font-bold text-slate-800 mb-1 flex items-start gap-1">
            <span className="text-primary">Q.</span> {question}
        </h4>
        <p className="text-[11px] text-slate-500 leading-relaxed pl-4">
            {answer}
        </p>
    </div>
);
