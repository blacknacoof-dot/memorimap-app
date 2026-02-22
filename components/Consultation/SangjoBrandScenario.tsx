import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X, Bot, Check, ChevronRight, Shield, Star, Phone, FileText, Clock, Siren, Home } from 'lucide-react';
import { FuneralCompany } from '../../types';
import { ConsultationForm } from './BrandChatHelpers';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onBack: () => void;
}

interface Product {
    id: number;
    title: string;
    price: string;
    totalPrice: string;
    desc: string;
    features: string[];
    badge?: string;
}

type ScenarioStep =
    | 'MAIN_MENU'
    | 'PRODUCTS'
    | 'BUDGET_SELECT'
    | 'SCALE_SELECT'
    | 'RECOMMEND'
    | 'FORM'
    | 'COMPLETE';

interface BotMessage {
    id: number;
    text: string;
    options?: { label: string; action: string; variant?: 'primary' | 'danger' | 'default' }[];
    products?: Product[];
    isUser?: boolean;
}

const PRODUCTS: Product[] = [
    {
        id: 1,
        title: '실속형',
        price: '월 30,000원',
        totalPrice: '3,600,000원',
        desc: '꼭 필요한 서비스만 담은 합리적인 선택',
        features: ['전문 장례지도사 2명', '접객 도우미 4명', '관내 리무진', '오동나무 관'],
    },
    {
        id: 2,
        title: '베스트',
        price: '월 39,000원',
        totalPrice: '4,680,000원',
        desc: '가장 많은 고객이 선택한 대표 상품',
        features: ['전국 무료 이송', '리무진 왕복', '고급 수의', '도우미 6명'],
        badge: 'BEST',
    },
    {
        id: 3,
        title: 'VIP',
        price: '월 55,000원',
        totalPrice: '6,600,000원',
        desc: '최고의 예우를 위한 고품격 서비스',
        features: ['VIP 의전 팀장', '솔송나무 관', '전국 리무진 무제한', '추모 영상 제작'],
    },
];

const BUDGET_OPTIONS = [
    { label: '~300만원', value: '300', recommend: 1 },
    { label: '~500만원', value: '500', recommend: 2 },
    { label: '~700만원', value: '700', recommend: 2 },
    { label: '700만원 이상', value: '700+', recommend: 3 },
];

const SCALE_OPTIONS = [
    { label: '소규모 (30명 이하)', value: 'small' },
    { label: '중규모 (30~100명)', value: 'medium' },
    { label: '대규모 (100명 이상)', value: 'large' },
];

export const SangjoBrandScenario: React.FC<Props> = ({ company, onClose, onBack }) => {
    const [messages, setMessages] = useState<BotMessage[]>([]);
    const [step, setStep] = useState<ScenarioStep>('MAIN_MENU');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'phone' | 'chat' | 'urgent'>('chat');
    const [selectedBudget, setSelectedBudget] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const themeColor = 'bg-[#005B50]';
    const logo = company.imageUrl || '💎';

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Initialize
    useEffect(() => {
        setMessages([
            {
                id: 1,
                text: `안녕하세요! **${company.name}** 공식 상담 채널입니다.\n\n추모맵을 통해 가입하시면 **최대 100만원 상당의 독점 혜택**을 받으실 수 있습니다.\n\n아래 메뉴를 선택해 주세요.`,
                options: getMainMenuOptions(),
            },
        ]);
    }, [company.name]);

    function getMainMenuOptions() {
        return [
            { label: '📋 상품 안내', action: 'SHOW_PRODUCTS', variant: 'default' as const },
            { label: '💰 비용 견적', action: 'BUDGET', variant: 'default' as const },
            { label: '🚨 긴급 장례', action: 'URGENT', variant: 'danger' as const },
            { label: '📞 전문가 상담', action: 'EXPERT', variant: 'default' as const },
        ];
    }

    const addMessages = (msgs: Omit<BotMessage, 'id'>[]) => {
        setMessages(prev => {
            let nextId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) + 1 : 1;
            return [...prev, ...msgs.map(m => ({ ...m, id: nextId++ }))];
        });
    };

    const handleAction = (action: string, label?: string) => {
        // Add user selection as message
        if (label) {
            addMessages([{ text: label, isUser: true }]);
        }

        // Small delay for natural feel
        setTimeout(() => {
            switch (action) {
                case 'SHOW_PRODUCTS':
                    setStep('PRODUCTS');
                    addMessages([
                        {
                            text: `**${company.name}**의 대표 상품 3종을 안내해 드립니다.\n\n관심 있는 상품의 **"가입 상담"** 버튼을 눌러주세요.`,
                            products: PRODUCTS.map(p => ({ ...p, title: `${company.name} ${p.title}` })),
                        },
                        {
                            text: '다른 메뉴를 원하시면 아래 버튼을 눌러주세요.',
                            options: [
                                { label: '💰 비용 견적 받기', action: 'BUDGET', variant: 'default' },
                                { label: '🏠 메인 메뉴', action: 'MAIN', variant: 'default' },
                            ],
                        },
                    ]);
                    break;

                case 'BUDGET':
                    setStep('BUDGET_SELECT');
                    addMessages([{
                        text: '예산 범위를 선택해 주세요.\n\n고객님의 예산에 맞는 최적의 상품을 추천해 드리겠습니다.',
                        options: BUDGET_OPTIONS.map(b => ({
                            label: b.label,
                            action: `BUDGET_${b.value}`,
                            variant: 'default' as const,
                        })),
                    }]);
                    break;

                case 'BUDGET_300':
                case 'BUDGET_500':
                case 'BUDGET_700':
                case 'BUDGET_700+': {
                    const budgetVal = action.replace('BUDGET_', '');
                    setSelectedBudget(budgetVal);
                    setStep('SCALE_SELECT');
                    addMessages([{
                        text: '예상 조문객 규모를 선택해 주세요.',
                        options: SCALE_OPTIONS.map(s => ({
                            label: s.label,
                            action: `SCALE_${s.value}_${budgetVal}`,
                            variant: 'default' as const,
                        })),
                    }]);
                    break;
                }

                case action.match(/^SCALE_/)?.input: {
                    const parts = action.split('_');
                    const budget = parts[parts.length - 1];
                    const budgetOpt = BUDGET_OPTIONS.find(b => b.value === budget);
                    const recommendedId = budgetOpt?.recommend || 2;
                    const recommended = PRODUCTS.find(p => p.id === recommendedId) || PRODUCTS[1];
                    setStep('RECOMMEND');
                    addMessages([
                        {
                            text: `고객님의 조건을 분석한 결과,\n\n**${company.name} ${recommended.title}** 상품을 추천드립니다.\n\n✅ ${recommended.desc}\n💰 총 납입금: ${recommended.totalPrice} (${recommended.price})`,
                            products: [{ ...recommended, title: `${company.name} ${recommended.title}` }],
                        },
                        {
                            text: '이 상품으로 상담을 진행하시겠습니까?',
                            options: [
                                { label: '✅ 가입 상담 신청', action: 'FORM_CHAT', variant: 'primary' },
                                { label: '📋 다른 상품 보기', action: 'SHOW_PRODUCTS', variant: 'default' },
                                { label: '🏠 메인 메뉴', action: 'MAIN', variant: 'default' },
                            ],
                        },
                    ]);
                    break;
                }

                case 'URGENT':
                    setFormMode('urgent');
                    setIsFormOpen(true);
                    setStep('FORM');
                    break;

                case 'EXPERT':
                    setFormMode('phone');
                    setIsFormOpen(true);
                    setStep('FORM');
                    break;

                case 'FORM_CHAT':
                    setFormMode('chat');
                    setIsFormOpen(true);
                    setStep('FORM');
                    break;

                case 'MAIN':
                    setStep('MAIN_MENU');
                    addMessages([{
                        text: '메인 메뉴로 돌아왔습니다. 원하시는 항목을 선택해 주세요.',
                        options: getMainMenuOptions(),
                    }]);
                    break;

                default:
                    break;
            }
        }, 300);
    };

    const handleFormSubmit = async (formData: any) => {
        setIsFormOpen(false);
        setStep('COMPLETE');

        const isUrgent = formMode === 'urgent';
        const isPhone = formMode === 'phone';
        const contractNumber = `${isUrgent ? 'URG' : 'REQ'}-2026-${Math.floor(Math.random() * 900000 + 100000)}`;

        // Save to DB
        try {
            const { saveSangjoContract } = await import('../../lib/sangjoQueries');
            await saveSangjoContract({
                id: `db-${Date.now()}`,
                contract_number: contractNumber,
                sangjo_id: company.id,
                customer_name: formData.name || '익명 고객',
                customer_phone: formData.phone || '',
                service_type: isUrgent ? '긴급 출동' : (isPhone ? '전화 상담' : (formData.type || '채팅 상담')),
                status: '상담신청',
                application_type: 'CONSULTATION',
                preferred_call_time: formData.time || '',
                total_price: 0,
                emergency_level: isUrgent ? 'critical' : 'normal',
                created_at: new Date().toISOString(),
            });
        } catch (e) {
            console.error('상담 접수 저장 실패:', e);
        }

        const completeText = isUrgent
            ? `🚨 **긴급 접수 완료** (접수번호: ${contractNumber})\n\n${formData.name}님, 담당 팀장이 **3분 이내**에 ${formData.phone}으로 연락드립니다.`
            : isPhone
                ? `✅ **전화 상담 예약 완료**\n\n${formData.name}님, 요청하신 시간(${formData.time})에 ${formData.phone}으로 연락드리겠습니다.`
                : `✅ **상담 접수 완료** (접수번호: ${contractNumber})\n\n${formData.name}님, 담당 상담사가 빠른 시일 내에 연락드리겠습니다.`;

        addMessages([
            {
                text: completeText,
                options: [
                    { label: '🏠 메인 메뉴', action: 'MAIN', variant: 'default' },
                    { label: '✕ 닫기', action: 'CLOSE', variant: 'default' },
                ],
            },
        ]);
    };

    const handleOptionClick = (action: string, label: string) => {
        if (action === 'CLOSE') {
            onClose();
            return;
        }
        handleAction(action, label);
    };

    return (
        <div className="flex flex-col h-full bg-white relative font-sans">
            {/* Header */}
            <div className={`${themeColor} p-4 flex items-center justify-between shadow-lg z-20 shrink-0`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-white/80 hover:text-white mr-1 active:scale-90 transition-transform">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner overflow-hidden">
                        {(logo.startsWith('/') || logo.startsWith('http')) ? (
                            <img src={logo} alt="brand logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg">{logo}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-white text-base tracking-tight">{company.name}</h1>
                            <Check className="w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <p className="text-[10px] text-white/80 font-medium tracking-wide opacity-90">
                            공식 프리미엄 상담실
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Notice Bar */}
            <div className="bg-[#F0FDF4] border-b border-green-100 px-4 py-2 flex items-center gap-2 text-xs text-green-800 font-medium shrink-0">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span>공정위 등록업체 &bull; 선수금 100% 안전 보장</span>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA] scrollbar-thin scrollbar-thumb-gray-200">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                        {!msg.isUser && (
                            <div className={`w-8 h-8 ${themeColor} rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1 shadow-md border-2 border-white`}>
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div className="max-w-[85%] space-y-2">
                            {/* Text Bubble */}
                            {msg.text && (
                                <div
                                    className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm
                                        ${msg.isUser
                                            ? `${themeColor} text-white rounded-tr-none shadow-md`
                                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                                        part.startsWith('**') && part.endsWith('**')
                                            ? <strong key={i}>{part.slice(2, -2)}</strong>
                                            : part
                                    )}
                                </div>
                            )}

                            {/* Product Cards */}
                            {msg.products && (
                                <div className="flex gap-3 overflow-x-auto py-2 px-1 snap-x scrollbar-hide">
                                    {msg.products.map((product) => (
                                        <div key={product.id} className="snap-center min-w-[250px] w-[250px] bg-white rounded-2xl border border-gray-200 shadow-md flex-shrink-0 overflow-hidden hover:border-[#005B50] transition-all relative">
                                            {product.badge && (
                                                <div className="absolute top-0 right-0 bg-[#005B50] text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl shadow-sm z-10">
                                                    {product.badge}
                                                </div>
                                            )}
                                            <div className="h-1.5 bg-[#005B50]" />
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 text-base mb-1">{product.title}</h3>
                                                <p className="text-xs text-gray-500 mb-3 leading-tight">{product.desc}</p>

                                                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                                                    {product.features.map((feat, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                                                            <Check className="w-3 h-3 text-[#005B50] flex-shrink-0 mt-0.5" />
                                                            {feat}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 mb-0.5">총 납입금액</div>
                                                        <div className="font-bold text-lg text-[#005B50]">{product.totalPrice}</div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-normal mb-1">({product.price})</div>
                                                </div>

                                                <button
                                                    onClick={() => handleAction('FORM_CHAT', `${product.title} 가입 상담`)}
                                                    className="w-full mt-3 py-2.5 rounded-lg border border-[#005B50] text-[#005B50] font-bold text-xs hover:bg-[#005B50] hover:text-white transition-all flex items-center justify-center gap-1"
                                                >
                                                    가입 상담 <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Option Buttons */}
                            {msg.options && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {msg.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionClick(opt.action, opt.label)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm
                                                ${opt.variant === 'primary'
                                                    ? 'bg-[#005B50] text-white hover:bg-[#004a42]'
                                                    : opt.variant === 'danger'
                                                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-[#005B50] hover:text-[#005B50]'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Guide (no text input) */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
                <p className="text-xs text-gray-400 text-center">
                    버튼을 눌러 상담을 진행하세요
                </p>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <ConsultationForm
                    company={company}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    mode={formMode}
                />
            )}
        </div>
    );
};
