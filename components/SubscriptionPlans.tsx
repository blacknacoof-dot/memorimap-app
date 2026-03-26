import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Sparkles, Crown, Zap, ChevronDown, ChevronUp, MessageCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { requestPayment, verifyPayment, PORTONE_CONFIG, getChannelKey, generatePaymentId } from '../lib/portone';
import { toast } from 'sonner';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { normalizeSubscriptionPlanId } from '../lib/subscriptionPlanIds';
import { LegalModal } from './LegalModal';

interface Plan {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    icon: React.ReactNode;
    color: string;
    badge?: string;
    features: {
        name: string;
        included: boolean;
        description?: string;
    }[];
    popular?: boolean;
}

const facilityPlans: Plan[] = [
    {
        id: 'free',
        name: '무료체험',
        nameEn: 'FREE',
        price: 0,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-slate-400 to-slate-500',
        features: [
            { name: '지도 및 리스트 노출', included: true, description: '기본 노출' },
            { name: '시설 정보 등록/수정', included: true },
            { name: '사진 업로드 (3장)', included: true },
            { name: '이메일 예약 알림', included: true },
            { name: '리뷰 조회', included: true },
            { name: 'AI 채팅 상담', included: false },
            { name: '문자/알림톡 발송', included: false },
        ],
    },
    {
        id: 'basic',
        name: '라이트',
        nameEn: 'BASIC',
        price: 49000,
        icon: <ShieldCheck className="w-6 h-6" />,
        color: 'from-blue-500 to-indigo-600',
        badge: '실속형',
        popular: true,
        features: [
            { name: '시설 정보 등록/수정', included: true },
            { name: '리뷰 답글 작성', included: true },
            { name: '기본 통계 리포트', included: true },
            { name: '알림 50건/월', included: true },
            { name: '사진 업로드 (20장)', included: true },
            { name: 'AI 채팅 상담 (50회/월)', included: true },
            { name: '상위 노출 광고', included: false },
        ],
    },
    {
        id: 'premium',
        name: '프리미엄',
        nameEn: 'PREMIUM',
        price: 199000,
        icon: <Sparkles className="w-6 h-6" />,
        color: 'from-purple-500 to-fuchsia-600',
        badge: '성장형',
        features: [
            { name: '전 기능 무제한 사용', included: true },
            { name: '알림톡/문자 무제한', included: true },
            { name: 'AI 상담 무제한', included: true },
            { name: '우선 노출', included: true, description: '검색 우선 순위' },
            { name: '실버 인증 배지', included: true },
            { name: '리뷰 답글 권한', included: true },
            { name: '상세 방문/예약 통계', included: true },
        ],
    },
];

/** 엔터프라이즈는 결제 불가 — 문의형 */
const enterprisePlan: Plan = {
    id: 'enterprise',
    name: '엔터프라이즈',
    nameEn: 'ENTERPRISE',
    price: 0,
    icon: <Crown className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-600',
    badge: '맞춤 견적',
    features: [
        { name: '프리미엄 모든 기능', included: true },
        { name: '최상단 고정 노출', included: true, description: '지역별 독점' },
        { name: '골드 인증 배지', included: true },
        { name: '전담 계정 매니저', included: true },
        { name: 'AI 리뷰 분석/관리', included: true },
        { name: '맞춤 디자인 지원', included: true },
        { name: 'API 연동 지원', included: true },
    ],
};

/**
 * 상조 v1: 파일럿 1개만 노출 (150만원/월, 3개월)
 * SJ_PROFESSIONAL, SJ_ENTERPRISE는 비활성 (파일럿 종료 후 협의)
 * 수수료형 로직은 넣지 않음
 */
const sangjoPlans: Plan[] = [
    {
        id: 'sj_starter',
        name: '파일럿',
        nameEn: 'SJ_STARTER',
        price: 1500000,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-emerald-500 to-teal-600',
        badge: '출시 한정',
        features: [
            { name: 'AI 24시간 자동 상담', included: true },
            { name: 'AI 계약 클로징 유도', included: true },
            { name: '리드 전달', included: true },
            { name: '실시간 매출/성과 리포트', included: true },
            { name: '우선 노출', included: true },
            { name: '파일럿 기간 3개월', included: true, description: '종료 후 SJ_STARTER 정가 전환 협의' },
        ],
    },
];

interface SubscriptionPlansProps {
    onSelectPlan?: (planId: string) => void;
    currentPlan?: string;
    facilityId?: string;
    type?: 'facility' | 'sangjo'; // 추가: 업체 유형
}

export default function SubscriptionPlans({ onSelectPlan, currentPlan, facilityId, type = 'facility' }: SubscriptionPlansProps) {
    const { user } = useUser();
    const { session } = useSession();

    const plans = type === 'sangjo' ? sangjoPlans : facilityPlans;
    const [selectedPlan, setSelectedPlan] = useState<string | null>(normalizeSubscriptionPlanId(currentPlan) || null);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(type === 'sangjo' ? 'sj_professional' : 'premium');
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund' | 'business' | 'license'>('business');

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
        toRemove.forEach(el => el.remove());
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        setIsPaymentOpen(false);
        setIsProcessing(false);
        toast('결제가 취소되었습니다.');
    }, []);

    React.useEffect(() => {
        const loadSub = async () => {
            if (facilityId) {
                try {
                    const authClient = await getAuthClient(session);
                    const { getFacilitySubscription } = await import('../lib/queries');
                    const sub = await getFacilitySubscription(facilityId, authClient);
                    if (sub && sub.plan_id) {
                        setSelectedPlan(normalizeSubscriptionPlanId(sub.plan_id) || sub.plan_id);
                    }
                } catch (_e) {
                    // silent
                }
            }
        };
        loadSub();
    }, [facilityId]);

    const handleSelectPlan = async (plan: Plan) => {
        if (isProcessing) return;
        if (plan.id === 'free') {
            if (facilityId) {
                try {
                    const subClient = await getAuthClient(session, { strict: true });
                    const { updateFacilitySubscription } = await import('../lib/queries');
                    await updateFacilitySubscription(facilityId, plan.nameEn, subClient);
                } catch (_e) {
                    toast.error('무료 플랜 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                    return;
                }
            }

            setSelectedPlan(plan.id);
            onSelectPlan?.(plan.id);
            toast.success('무료 플랜으로 설정되었습니다.');
            return;
        }

        if (!window.PortOne) {
            toast.error('결제 모듈을 불러오지 못했습니다.');
            return;
        }

        setIsProcessing(true);
        setIsPaymentOpen(true);
        try {
            const paymentId = generatePaymentId('sub');
            const response = await requestPayment({
                storeId: PORTONE_CONFIG.STORE_ID,
                channelKey: getChannelKey('general'),  // Phase C 전까지 일반결제 채널 사용
                paymentId,
                orderName: `[추모맵] ${plan.name} 플랜`,
                totalAmount: plan.price,
                currency: "KRW",
                payMethod: "CARD",
                customer: {
                    fullName: user?.fullName || user?.firstName || "업체 관리자",
                    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || "01000000000",
                    email: user?.primaryEmailAddress?.emailAddress || session?.user?.email || "partner@memorimap.kr",
                },
            });

            if (response.code !== undefined) {
                toast.error(`결제 실패: ${response.message}`);
                return;
            }

            // 서버사이드 결제 검증
            const verification = await verifyPayment({
                paymentId: response.paymentId || paymentId,
                expectedAmount: plan.price,
                paymentContext: 'facility_subscription',
                facilityId,
                planId: plan.nameEn,
            });
            if (!verification.verified) {
                toast.error(verification.error || '결제 검증에 실패했습니다. 고객센터에 문의해주세요.');
                return;
            }

            // 결제 성공 → DB 구독 업데이트
            if (facilityId) {
                try {
                    const subClient = await getAuthClient(session, { strict: true });
                    const { updateFacilitySubscription } = await import('../lib/queries');
                    await updateFacilitySubscription(facilityId, plan.nameEn, subClient);
                } catch (_e) {
                    toast.error('결제는 완료되었으나 구독 정보 업데이트에 실패했습니다. 고객센터에 문의해주세요.');
                }
            }

            setSelectedPlan(plan.id);
            onSelectPlan?.(plan.id);
            toast.success(`${plan.name} 구독이 시작되었습니다!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : '';
            if (!msg.includes('취소')) {
                toast.error('결제 중 오류가 발생했습니다.');
            }
        } finally {
            setIsProcessing(false);
            setIsPaymentOpen(false);
        }
    };

    return (
        <div className="min-h-full bg-slate-50 flex flex-col pt-4 relative">
            {/* 결제 진행 중 취소 버튼 — Portal로 body 끝에 렌더하여 PortOne overlay 위에 표시 */}
            {isPaymentOpen && createPortal(
                <button
                    onClick={cancelPayment}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483647] bg-white text-slate-700 px-6 py-3.5 min-h-[44px] rounded-full shadow-2xl border border-slate-200 font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform"
                    style={{ pointerEvents: 'auto' }}
                >
                    <ArrowLeft size={18} />
                    결제 취소하고 돌아가기
                </button>,
                document.body
            )}
            {/* Header Area */}
            <div className="px-6 py-8 text-center bg-white border-b">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3">
                    PARTNERSHIP
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                    {type === 'sangjo' ? '상조 본사를 위한\n비즈니스 스케일업' : '비즈니스를 위한\n최적의 플랜'}
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                    {type === 'sangjo'
                        ? '전국 단위의 고객을 만나고,\nAI로 자동 계약까지 완성하세요.'
                        : '전국의 고객님들이 귀사의 시설을\n더 쉽고 가깝게 만날 수 있습니다.'}
                </p>
            </div>

            {/* Plan List Area */}
            <div className="flex-1 px-4 py-6 space-y-4 pb-24">
                {plans.map((plan) => {
                    const isExpanded = expandedPlan === plan.id;
                    const isSelected = selectedPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 ${isExpanded ? 'border-primary shadow-lg ring-1 ring-primary/10' : 'border-slate-100 shadow-sm'
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-3 left-6 z-10 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                    <Sparkles size={10} /> BEST
                                </div>
                            )}

                            {/* Plan Header Card */}
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
                                        <span className="text-xl font-black text-slate-900">
                                            {plan.price.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-slate-500 font-medium">원 / 월</span>
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
                                                    <p className={`text-xs ${feature.included ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                                                        {feature.name}
                                                    </p>
                                                    {feature.description && (
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{feature.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 결제 안내 블록 — 유료 플랜만 */}
                                    {plan.price > 0 && !isSelected && (
                                        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-600 mb-1">구독 결제 안내</p>
                                            <ul className="text-[10px] text-slate-500 space-y-0.5">
                                                <li>• 결제 완료 후 30일간 이용 가능</li>
                                                <li>• 해지 시 다음 결제일부터 중단</li>
                                                <li>• 이미 결제된 당월 금액은 환불되지 않습니다</li>
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isSelected || isProcessing}
                                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isSelected || isProcessing
                                            ? 'bg-slate-100 text-slate-400 cursor-default'
                                            : `bg-gradient-to-r ${plan.color} text-white shadow-lg shadow-blue-500/20`
                                            }`}
                                    >
                                        {isProcessing ? '결제 처리 중...' : isSelected ? '현재 적용 중인 플랜' : '구독 시작하기'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 엔터프라이즈 문의형 카드 — 시설만 노출 */}
                {type === 'facility' && (
                    <div className="group relative bg-white rounded-2xl border-2 border-amber-200 shadow-sm">
                        <div className="p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${enterprisePlan.color} flex items-center justify-center text-white shadow-inner`}>
                                {enterprisePlan.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900">{enterprisePlan.name}</h3>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                        {enterprisePlan.badge}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">대형 시설 맞춤 플랜</p>
                            </div>
                        </div>
                        <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                            <div className="space-y-3 mb-6">
                                {enterprisePlan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-0.5 text-green-500">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-700 font-medium">{feature.name}</p>
                                            {feature.description && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">{feature.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowInquiryModal(true)}
                                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                            >
                                <MessageCircle size={16} /> 맞춤 견적 문의하기
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                    <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" /> 결제 전 확인 정보
                    </h2>
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
                        결제 진행 전 사업자 정보, 약관, 환불/해지 정책을 확인할 수 있습니다.
                    </p>
                </div>

                {/* FAQ Section */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" /> 자주 묻는 질문
                    </h2>
                    <div className="space-y-6">
                        <FAQItem
                            question="결제는 어떻게 진행되나요?"
                            answer="국내 모든 신용카드를 지원하며, 안전한 결제 시스템을 통해 처리됩니다. 결제 완료 후 30일간 이용 가능합니다."
                        />
                        <FAQItem
                            question="플랜 변경이나 해지는 언제든 가능한가요?"
                            answer="네, 대시보드에서 언제든 해지할 수 있습니다. 해지 시 다음 결제일부터 중단되며, 이미 결제된 당월 금액은 환불되지 않습니다."
                        />
                        <FAQItem
                            question="AI 상담 데이터는 어떻게 학습되나요?"
                            answer="업체에서 등록하신 FAQ와 시설 정보를 기반으로 학습합니다. 부족한 정보는 AI가 정중하게 직접 문의를 유도합니다."
                        />
                    </div>
                </div>

                {/* Bottom Contact */}
                <div className="mt-12 py-8 bg-slate-900 rounded-3xl text-center px-6">
                    <p className="text-slate-400 text-xs mb-2">도움이 필요하신가요?</p>
                    <h3 className="text-white font-bold mb-6">전문 상담사가 파트너님의<br />시설에 맞는 플랜을 추천해드립니다.</h3>
                    <button
                        onClick={() => setShowInquiryModal(true)}
                        className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                    >
                        1:1 도입 문의하기
                    </button>
                </div>
            </div>

            {/* 문의 폼 모달 */}
            {showInquiryModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50"
                    onClick={(e) => e.target === e.currentTarget && setShowInquiryModal(false)}
                >
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom-4">
                        <div className="flex justify-center pt-2 sm:hidden">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">1:1 도입 문의</h2>
                                <p className="text-xs text-slate-500 mt-1">전문 상담사가 빠르게 연락드리겠습니다.</p>
                            </div>
                            <button
                                onClick={() => setShowInquiryModal(false)}
                                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 block">담당자명 *</label>
                                <input
                                    type="text"
                                    value={inquiryForm.name}
                                    onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="홍길동"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 block">연락처 *</label>
                                <input
                                    type="tel"
                                    value={inquiryForm.phone}
                                    onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="010-0000-0000"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 block">이메일</label>
                                <input
                                    type="email"
                                    value={inquiryForm.email}
                                    onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="example@company.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 mb-1 block">문의 내용</label>
                                <textarea
                                    value={inquiryForm.message}
                                    onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="관심 있는 플랜이나 궁금한 점을 적어주세요."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-6">
                            <button
                                onClick={async () => {
                                    if (!inquiryForm.name.trim() || !inquiryForm.phone.trim()) {
                                        toast.error('담당자명과 연락처는 필수입니다.');
                                        return;
                                    }
                                    setIsSubmitting(true);
                                    try {
                                        const client = await getAuthClient(session, { strict: true });
                                        await client.from('partner_inquiries').insert({
                                            user_id: user?.id || 'anonymous',
                                            contact_person: inquiryForm.name,
                                            phone: inquiryForm.phone,
                                            email: inquiryForm.email || null,
                                            message: inquiryForm.message || null,
                                            type: 'subscription',
                                            target_facility_id: facilityId || null,
                                            status: 'pending',
                                        });
                                        toast.success('문의가 접수되었습니다. 빠른 시일 내 연락드리겠습니다.');
                                        setShowInquiryModal(false);
                                        setInquiryForm({ name: '', phone: '', email: '', message: '' });
                                    } catch {
                                        toast.error('문의 접수 중 오류가 발생했습니다.');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 접수 중...</>
                                ) : (
                                    <><MessageCircle size={18} /> 문의 접수하기</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLegalModal && <LegalModal initialTab={legalTab} onClose={() => setShowLegalModal(false)} />}
        </div>
    );
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <div>
        <h3 className="text-[13px] font-bold text-slate-800 mb-1.5 flex items-start gap-1">
            <span className="text-primary">Q.</span> {question}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed px-4">
            {answer}
        </p>
    </div>
);
