import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { FuneralCompany } from '../../../types';
import { ConsultationForm } from '../../Consultation/BrandChatHelpers';
import { Product, BotMessage, ScenarioStep, PRODUCTS, BUDGET_OPTIONS, SCALE_OPTIONS, formatTotalPrice } from './ScenarioData';
import { ScenarioMessages } from './ScenarioMessages';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onBack: () => void;
}

export const SangjoBrandScenario: React.FC<Props> = ({ company, onClose, onBack }) => {
    const [messages, setMessages] = useState<BotMessage[]>([]);
    const [step, setStep] = useState<ScenarioStep>('MAIN_MENU');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'phone' | 'chat' | 'urgent'>('chat');
    const [selectedBudget, setSelectedBudget] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const themeColor = 'bg-[#005B50]';
    const logo = company.imageUrl || '💎';

    const products: Product[] = (company.products && company.products.length > 0)
        ? company.products.map((p, i) => ({
              id: i + 1, title: p.name, price: p.tagline,
              totalPrice: formatTotalPrice(p.tagline, p.price), desc: p.description,
              features: (p.includedServices || []).slice(0, 4), badge: i === 1 ? 'BEST' : undefined,
          }))
        : PRODUCTS;

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        setMessages([{
            id: 1,
            text: `안녕하세요! **${company.name}** 공식 상담 채널입니다.\n\n추모맵을 통해 가입하시면 **최대 100만원 상당의 독점 혜택**을 받으실 수 있습니다.\n\n아래 메뉴를 선택해 주세요.`,
            options: getMainMenuOptions(),
        }]);
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
        if (label) addMessages([{ text: label, isUser: true }]);

        setTimeout(() => {
            switch (action) {
                case 'SHOW_PRODUCTS':
                    setStep('PRODUCTS');
                    addMessages([
                        { text: `**${company.name}**의 대표 상품 3종을 안내해 드립니다.\n\n관심 있는 상품의 **"가입 상담"** 버튼을 눌러주세요.`, products: products.map(p => ({ ...p, title: `${company.name} ${p.title}` })) },
                        { text: '다른 메뉴를 원하시면 아래 버튼을 눌러주세요.', options: [{ label: '💰 비용 견적 받기', action: 'BUDGET', variant: 'default' }, { label: '🏠 메인 메뉴', action: 'MAIN', variant: 'default' }] },
                    ]);
                    break;
                case 'BUDGET':
                    setStep('BUDGET_SELECT');
                    addMessages([{ text: '예산 범위를 선택해 주세요.\n\n고객님의 예산에 맞는 최적의 상품을 추천해 드리겠습니다.', options: BUDGET_OPTIONS.map(b => ({ label: b.label, action: `BUDGET_${b.value}`, variant: 'default' as const })) }]);
                    break;
                case 'BUDGET_300': case 'BUDGET_500': case 'BUDGET_700': case 'BUDGET_700+': {
                    const budgetVal = action.replace('BUDGET_', '');
                    setSelectedBudget(budgetVal);
                    setStep('SCALE_SELECT');
                    addMessages([{ text: '예상 조문객 규모를 선택해 주세요.', options: SCALE_OPTIONS.map(s => ({ label: s.label, action: `SCALE_${s.value}_${budgetVal}`, variant: 'default' as const })) }]);
                    break;
                }
                case action.match(/^SCALE_/)?.input: {
                    const parts = action.split('_');
                    const budget = parts[parts.length - 1];
                    const budgetOpt = BUDGET_OPTIONS.find(b => b.value === budget);
                    const recommended = products.find(p => p.id === (budgetOpt?.recommend || 2)) || products[1];
                    setStep('RECOMMEND');
                    addMessages([
                        { text: `고객님의 조건을 분석한 결과,\n\n**${company.name} ${recommended.title}** 상품을 추천드립니다.\n\n✅ ${recommended.desc}\n💰 총 납입금: ${recommended.totalPrice} (${recommended.price})`, products: [{ ...recommended, title: `${company.name} ${recommended.title}` }] },
                        { text: '이 상품으로 상담을 진행하시겠습니까?', options: [{ label: '✅ 가입 상담 신청', action: 'FORM_CHAT', variant: 'primary' }, { label: '📋 다른 상품 보기', action: 'SHOW_PRODUCTS', variant: 'default' }, { label: '🏠 메인 메뉴', action: 'MAIN', variant: 'default' }] },
                    ]);
                    break;
                }
                case 'URGENT': setFormMode('urgent'); setIsFormOpen(true); setStep('FORM'); break;
                case 'EXPERT': setFormMode('phone'); setIsFormOpen(true); setStep('FORM'); break;
                case 'FORM_CHAT': setFormMode('chat'); setIsFormOpen(true); setStep('FORM'); break;
                case 'MAIN':
                    setStep('MAIN_MENU');
                    addMessages([{ text: '메인 메뉴로 돌아왔습니다. 원하시는 항목을 선택해 주세요.', options: getMainMenuOptions() }]);
                    break;
                default: break;
            }
        }, 300);
    };

    const handleFormSubmit = async (formData: Record<string, unknown>) => {
        setIsFormOpen(false);
        setStep('COMPLETE');
        const isUrgent = formMode === 'urgent';
        const isPhone = formMode === 'phone';
        const contractNumber = `${isUrgent ? 'URG' : 'REQ'}-2026-${Math.floor(Math.random() * 900000 + 100000)}`;

        try {
            const { saveSangjoContract, resolveSangjoDbId } = await import('../../../lib/sangjoQueries');
            const { supabase, getAuthClient } = await import('../../../lib/supabaseClient');
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const client = await getAuthClient(currentSession, { strict: true });
            const serviceType = isUrgent ? '긴급 출동' : (isPhone ? '전화 상담' : ((formData.type as string) || '채팅 상담'));
            const customerName = (formData.name as string) || '익명 고객';
            const customerPhone = (formData.phone as string) || '';
            const dbSangjoId = await resolveSangjoDbId(company.id, company.name, client);
            await saveSangjoContract({
                id: crypto.randomUUID(), contract_number: contractNumber, sangjo_id: dbSangjoId,
                customer_name: customerName, customer_phone: customerPhone, service_type: serviceType,
                status: '상담신청', application_type: 'CONSULTATION',
                preferred_call_time: (formData.time as string) || '', total_price: 0,
                emergency_level: isUrgent ? 'critical' : 'normal', created_at: new Date().toISOString(),
            }, client);
        } catch (e) {
            toast.error('상담 접수 저장에 실패했습니다.');
            return;
        }

        const completeText = isUrgent
            ? `🚨 **긴급 접수 완료** (접수번호: ${contractNumber})\n\n${formData.name}님, 담당 팀장이 **3분 이내**에 ${formData.phone}으로 연락드립니다.`
            : isPhone
                ? `✅ **전화 상담 예약 완료**\n\n${formData.name}님, 요청하신 시간(${formData.time})에 ${formData.phone}으로 연락드리겠습니다.`
                : `✅ **상담 접수 완료** (접수번호: ${contractNumber})\n\n${formData.name}님, 담당 상담사가 빠른 시일 내에 연락드리겠습니다.`;

        addMessages([{ text: completeText, options: [{ label: '🏠 메인 메뉴', action: 'MAIN', variant: 'default' }, { label: '✕ 닫기', action: 'CLOSE', variant: 'default' }] }]);
    };

    const handleOptionClick = (action: string, label: string) => {
        if (action === 'CLOSE') { onClose(); return; }
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
                        {(logo.startsWith('/') || logo.startsWith('http'))
                            ? <img src={logo} alt="brand logo" className="w-full h-full object-cover" />
                            : <span className="text-lg">{logo}</span>}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-white text-base tracking-tight">{company.name}</h1>
                            <Check className="w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <p className="text-[10px] text-white/80 font-medium tracking-wide opacity-90">공식 프리미엄 상담실</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10">
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
                <ScenarioMessages messages={messages} themeColor={themeColor} onOptionClick={handleOptionClick} onProductConsult={handleAction} />
            </div>

            {/* Bottom Guide */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
                <p className="text-xs text-gray-400 text-center">버튼을 눌러 상담을 진행하세요</p>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <ConsultationForm company={company} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} mode={formMode} />
            )}
        </div>
    );
};
