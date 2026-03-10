import React, { useState, useMemo, useCallback } from 'react';
import { Check, X, Sparkles, Crown, Zap, ChevronDown, ChevronUp, MessageCircle, Mail, BarChart3, Star, ShieldCheck, ArrowLeft } from 'lucide-react';
import { requestPayment, verifyPayment, PORTONE_CONFIG } from '../lib/portone';
import { toast } from 'sonner';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { useSystemSettings } from '../hooks/useSystemSettings';

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
        name: '베이직',
        nameEn: 'BASIC',
        price: 99000,
        icon: <ShieldCheck className="w-6 h-6" />,
        color: 'from-blue-500 to-indigo-600',
        badge: '실속형',
        features: [
            { name: '시설 정보 등록/수정', included: true },
            { name: '월 100건 알림톡 발송', included: true },
            { name: '월 100회 AI 채팅 상담', included: true },
            { name: '사진 무제한 업로드', included: true },
            { name: '리뷰 조회', included: true },
            { name: '기본 통계 리포트', included: true },
            { name: '상위 노출 광고', included: false },
        ],
    },
    {
        id: 'premium',
        name: '프리미엄',
        nameEn: 'PREMIUM',
        price: 299000,
        icon: <Sparkles className="w-6 h-6" />,
        color: 'from-purple-500 to-fuchsia-600',
        badge: '가장 많이 찾는',
        popular: true,
        features: [
            { name: '전 기능 무제한 사용', included: true },
            { name: '알림톡/문자 무제한', included: true },
            { name: 'AI 상담 무제한', included: true },
            { name: '검색 상단 노출', included: true, description: '검색 우선 순위' },
            { name: '실버 인증 배지', included: true },
            { name: '리뷰 답글 권한', included: true },
            { name: '정기 방문 통계', included: true },
        ],
    },
    {
        id: 'enterprise',
        name: '엔터프라이즈',
        nameEn: 'ENTERPRISE',
        price: 499000,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-amber-500 to-orange-600',
        badge: 'VIP 파트너',
        features: [
            { name: '프리미엄 모든 기능', included: true },
            { name: '최상단 고정 노출', included: true, description: '지역별 독점' },
            { name: '골드 인증 배지', included: true },
            { name: '전담 계정 매니저', included: true },
            { name: 'AI 리뷰 분석/관리', included: true },
            { name: '맞춤 디자인 지원', included: true },
            { name: 'API 연동 지원', included: true },
        ],
    },
];

// badge는 DB system_settings에서 로드 (컴포넌트 내부에서 동적 적용)
const SANGJO_COMMISSION_KEYS = [
    'sj_starter_commission',
    'sj_professional_commission',
    'sj_enterprise_commission',
] as const;

const SANGJO_COMMISSION_DEFAULTS: Record<string, number> = {
    sj_starter_commission: 10,
    sj_professional_commission: 8,
    sj_enterprise_commission: 5,
};

const sangjoPlansBase: Omit<Plan, 'badge'>[] = [
    {
        id: 'sj_starter',
        name: '상조 STARTER',
        nameEn: 'SJ_STARTER',
        price: 3000000,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-emerald-500 to-teal-600',
        features: [
            { name: 'AI 24시간 자동 상담', included: true },
            { name: 'AI 계약 클로징 유도', included: true },
            { name: '소비자 독점 혜택권 발행', included: true, description: '30만원 할인권' },
            { name: '실시간 매출/성과 리포트', included: true },
            { name: '일반 노출', included: true },
        ],
    },
    {
        id: 'sj_professional',
        name: '상조 PROFESSIONAL',
        nameEn: 'SJ_PROFESSIONAL',
        price: 8000000,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-blue-600 to-indigo-700',
        popular: true,
        features: [
            { name: '데이터 기반 우선 노출', included: true },
            { name: '고급 CRM 관리툴', included: true },
            { name: '실시간 전환 대시보드', included: true },
            { name: '전담 CS 지원', included: true },
            { name: '상용 사은품 패키지 제공', included: true, description: '장지 할인권 등' },
            { name: '주간 상세 리포트', included: true },
        ],
    },
    {
        id: 'sj_enterprise',
        name: '상조 ENTERPRISE',
        nameEn: 'SJ_ENTERPRISE',
        price: 15000000,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-amber-600 to-orange-700',
        features: [
            { name: '메인 배너 독점 광고', included: true },
            { name: '완전 자동 계약 시스템', included: true },
            { name: '전담 매니저 1:1 배정', included: true },
            { name: '커스텀 브랜딩 페이지', included: true },
            { name: 'API 연동 무제한', included: true },
            { name: '최적화 컨설팅 리포트', included: true },
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
    const { getNumber: getSettingNum } = useSystemSettings([...SANGJO_COMMISSION_KEYS]);

    // 상조 플랜: DB에서 수수료율 로드 → badge 동적 생성
    const sangjoPlans: Plan[] = useMemo(() => {
        const commissionMap: Record<string, number> = {
            sj_starter: getSettingNum('sj_starter_commission', SANGJO_COMMISSION_DEFAULTS.sj_starter_commission),
            sj_professional: getSettingNum('sj_professional_commission', SANGJO_COMMISSION_DEFAULTS.sj_professional_commission),
            sj_enterprise: getSettingNum('sj_enterprise_commission', SANGJO_COMMISSION_DEFAULTS.sj_enterprise_commission),
        };
        return sangjoPlansBase.map(plan => ({
            ...plan,
            badge: `수수료 ${commissionMap[plan.id] ?? 10}%`,
        }));
    }, [getSettingNum]);

    const plans = type === 'sangjo' ? sangjoPlans : facilityPlans;
    const [selectedPlan, setSelectedPlan] = useState<string | null>(currentPlan || null);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(type === 'sangjo' ? 'sj_professional' : 'premium');
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

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
                        setSelectedPlan(sub.plan_id);
                    }
                } catch (e) {
                    // silent
                }
            }
        };
        loadSub();
    }, [facilityId]);

    const handleSelectPlan = async (plan: Plan) => {
        if (isProcessing) return;
        if (plan.id === 'free') {
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
            const paymentId = `sub_${Date.now()}`;
            const response = await requestPayment({
                storeId: PORTONE_CONFIG.STORE_ID,
                channelKey: PORTONE_CONFIG.CHANNEL_KEY,
                paymentId,
                orderName: `[추모맵] ${plan.name} 플랜`,
                totalAmount: plan.price,
                currency: "CURRENCY_KRW",
                payMethod: "CARD",
                customer: {
                    fullName: user?.fullName || user?.firstName || "업체 관리자",
                    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || "",
                    email: user?.primaryEmailAddress?.emailAddress || "",
                }
            });

            if (response.code !== undefined) {
                toast.error(`결제 실패: ${response.message}`);
                return;
            }

            // 서버사이드 결제 검증
            const verification = await verifyPayment({
                paymentId: response.paymentId || paymentId,
                expectedAmount: plan.price,
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
                } catch (e) {
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

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isSelected || isProcessing}
                                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isSelected || isProcessing
                                            ? 'bg-slate-100 text-slate-400 cursor-default'
                                            : `bg-gradient-to-r ${plan.color} text-white shadow-lg shadow-blue-500/20`
                                            }`}
                                    >
                                        {isProcessing ? '결제 처리 중...' : isSelected ? '현재 적용 중인 플랜' : `${plan.name} 시작하기`}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* FAQ Section */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" /> 자주 묻는 질문
                    </h2>
                    <div className="space-y-6">
                        <FAQItem
                            question="결제는 어떻게 진행되나요?"
                            answer="국내 모든 신용카드 및 간편결제를 지원합니다. PortOne의 안전한 결제 시스템을 통해 매월 정기적으로 결제됩니다."
                        />
                        <FAQItem
                            question="플랜 변경이나 해지는 언제든 가능한가요?"
                            answer="네, 가능합니다. 대시보드 설정에서 언제든 해지하실 수 있습니다. 환불 관련 문의는 고객센터(1:1 문의)로 연락 주시면 안내해 드립니다."
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
