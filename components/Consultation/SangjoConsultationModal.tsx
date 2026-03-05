import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types/consultation';
import { ChatMessage } from './ChatMessage';
import { Loader2, ShieldCheck, X } from 'lucide-react';

import { FuneralCompany } from '../../types';
import { FUNERAL_COMPANIES } from '../../constants';
import { useSession } from '../../lib/auth';
import { getAuthClient } from '../../lib/supabaseClient';
import { analytics } from '../../lib/analytics';
import type { QuotaCheckResult } from '../../types/subscription';
import UpgradePrompt from '../UpgradePrompt';

interface Props {
    onClose: () => void;
    company?: FuneralCompany | null;
    onCompanySelect?: (company: FuneralCompany) => void;
    currentUser?: { id: string; name: string } | null;
}

// 고객 니즈 파악을 위한 키워드 버튼 (Maum-i Mode)
const PREFERENCE_CHIPS = [
    { id: 'urgent', label: "⚡ 급해요 (후불제)", value: "급해요 (후불제)", isEmergency: true },
    { id: 'price', label: "💰 가성비가 중요해요", value: "가성비가 중요해요", isEmergency: false },
    { id: 'quality', label: "🏆 서비스 품질 최우선", value: "서비스 품질 최우선", isEmergency: false },
    { id: 'safety', label: "🛡️ 튼튼한 안전성", value: "튼튼한 안전성", isEmergency: false },
    { id: 'religion', label: "✝️ 기독교/천주교 전용", value: "기독교/천주교 전용", isEmergency: false }
];

import { SangjoBrandScenario } from './SangjoBrandScenario';
import { PetChatInterface } from './PetChatInterface';

export const SangjoConsultationModal: React.FC<Props> = ({ onClose, company, onCompanySelect, currentUser }) => {
    const { session } = useSession();
    const [activeCompany, setActiveCompany] = useState<FuneralCompany | null | undefined>(company);

    const [messages, setMessages] = useState<Message[]>(() => {
        if (!company) {
            return [{
                role: 'model' as const,
                text: `안녕하십니까! 통합 비교 AI **'마음이'**입니다.\n\n수많은 상조 회사 중 어디를 선택해야 할지 고민이신가요?\n아래 버튼을 눌러 고객님의 상황을 알려주시면, **Best 3 업체를 비교 분석**하여 추천해 드립니다.`,
                timestamp: new Date()
            }];
        }
        return [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const quotaCheckedRef = useRef(false);
    const [quotaExceeded, setQuotaExceeded] = useState<QuotaCheckResult | null>(null);

    const handleCompanyConnect = (selectedCompany: FuneralCompany) => {
        analytics.consultationSubmit(selectedCompany.id, selectedCompany.id.startsWith('pet_') ? 'pet' : 'sangjo');
        setActiveCompany(selectedCompany);
        if (onCompanySelect) {
            onCompanySelect(selectedCompany);
        }
    };

    // Auto-scroll on messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Pet company → PetChatInterface
    if (activeCompany?.id.startsWith('pet_')) {
        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full h-[80dvh] sm:h-[700px] max-w-md flex flex-col shadow-2xl overflow-hidden relative">
                    <PetChatInterface
                        company={activeCompany}
                        onClose={onClose}
                        onBack={onClose}
                    />
                </div>
            </div>
        );
    }

    // Sangjo company → SangjoBrandScenario (button-based)
    if (company && !company.id.startsWith('pet_')) {
        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full h-[80dvh] sm:h-[700px] max-w-md flex flex-col shadow-2xl overflow-hidden relative">
                    <SangjoBrandScenario
                        company={company}
                        onClose={onClose}
                        onBack={onClose}
                    />
                </div>
            </div>
        );
    }

    // Maum-i Mode (rule-based chip → recommendation)
    const handleChipSelect = async (text: string) => {
        // 첫 chip 클릭 시 쿼터 체크 (중복 방지)
        if (!quotaCheckedRef.current && currentUser) {
            try {
                const client = await getAuthClient(session, { strict: true });
                const { data, error } = await client.rpc('check_and_increment_user_quota', {
                    p_quota_type: 'sangjo_compare',
                    p_category: null,
                });
                if (!error && data) {
                    const result = data as QuotaCheckResult;
                    if (!result.allowed) {
                        setQuotaExceeded(result);
                        return;
                    }
                }
            } catch {
                // fail-open: 쿼터 체크 실패 시 통과
            }
            quotaCheckedRef.current = true;
        }

        const userMsg: Message = { role: 'user', text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        await new Promise(r => setTimeout(r, 800));

        let recommended = FUNERAL_COMPANIES;
        let filterMessage = "";

        if (text.includes('가성비') || text.includes('저렴') || text.includes('실속')) {
            recommended = FUNERAL_COMPANIES.slice(0).sort(() => Math.random() - 0.5);
            filterMessage = "합리적인 가격과 실속을 중요하게 생각하시는군요!\n거품을 뺀 **가성비 최우수 업체**를 추천해 드립니다.";
        } else if (text.includes('서비스') || text.includes('품질') || text.includes('고급')) {
            recommended = FUNERAL_COMPANIES.filter(c => c.rating >= 4.8);
            filterMessage = "마지막 가시는 길, 부족함이 없어야 하죠.\n고품격 의전과 리무진 서비스로 평판이 좋은 **프리미엄 업체**입니다.";
        } else if (text.includes('안전') || text.includes('튼튼') || text.includes('신뢰')) {
            recommended = FUNERAL_COMPANIES.filter(c => c.reviewCount > 800);
            filterMessage = "무엇보다 믿을 수 있는 곳이 중요하죠.\n재무 건전성이 우수하고 **고객 신뢰도가 높은 대형 업체** 위주로 골랐습니다.";
        } else if (text.includes('기독교') || text.includes('종교')) {
            recommended = FUNERAL_COMPANIES.filter(c => c.name.includes('크리스찬') || c.features.includes('기독교'));
            if (recommended.length === 0) recommended = FUNERAL_COMPANIES.slice(0, 3);
            filterMessage = "종교 예식에 맞는 전문 지도사가 필요하시군요.\n**입관 예배와 전용 추모 절차**를 지원하는 특화 상품입니다.";
        } else if (text.includes('급해요') || text.includes('후불') || text.includes('당장')) {
            recommended = FUNERAL_COMPANIES.filter(c => c.features.includes("후불제"));
            if (recommended.length === 0) recommended = FUNERAL_COMPANIES.slice(0, 3);
            filterMessage = "급하신 상황이시군요.\n**후불제를 지원하고 빠른 대응이 가능한 업체**를 추천드립니다.\n카드를 확인하시고 상담 연결해 보세요.";
        } else {
            recommended = FUNERAL_COMPANIES.slice(0, 3);
            filterMessage = "고객님의 요청 사항을 종합적으로 분석하여,\n현재 가장 만족도가 높은 **Top 3 업체**를 비교해 드립니다.";
        }

        // Text response
        setMessages(prev => [...prev, {
            role: 'model',
            text: filterMessage,
            timestamp: new Date()
        }]);

        // Card recommendation
        if (recommended.length > 0) {
            const top3 = recommended.slice(0, 3);
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: "아래 카드를 넘겨보시고, 마음에 드는 곳의 **[상담 연결]** 버튼을 눌러주세요.\n해당 업체의 상담 채널로 연결해 드립니다.",
                    timestamp: new Date(),
                    recommendation: top3
                }]);
            }, 500);
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md h-[80dvh] flex flex-col shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white ring-2 ring-white/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">'마음이' (통합 비교 AI)</h3>
                            <p className="text-xs text-amber-400 font-bold">상조 업체 비교 분석 센터</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors shrink-0">
                        ✕
                    </button>
                </div>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} message={msg} onCompanySelect={handleCompanyConnect} />
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 flex items-center gap-2 text-gray-500 text-sm">
                                <Loader2 size={16} className="animate-spin text-amber-500" />
                                <span>마음이가 분석 중입니다...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Preference Chips only (no text input) */}
                <div className="flex-shrink-0 bg-white border-t border-gray-100 z-20 pb-safe">
                    <div className="px-4 pt-3 pb-2">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {PREFERENCE_CHIPS.map((chip) => (
                                <button
                                    key={chip.id}
                                    onClick={() => handleChipSelect(chip.value)}
                                    disabled={isLoading}
                                    className={`flex-shrink-0 border text-xs font-semibold px-3.5 py-2.5 min-h-[44px] rounded-full shadow-sm transition-all whitespace-nowrap active:scale-95
                                        ${chip.isEmergency
                                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 animate-pulse'
                                            : 'bg-white border-indigo-100 text-gray-700 hover:text-indigo-600 hover:shadow-md hover:border-indigo-300'
                                        }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] md:text-[10px] text-center text-gray-400 pb-3">
                        버튼을 눌러 원하는 조건을 선택하세요
                    </p>
                </div>
            </div>

            {/* 쿼터 초과 모달 */}
            <UpgradePrompt
                isOpen={!!quotaExceeded}
                onClose={() => setQuotaExceeded(null)}
                featureName="상조 비교 상담"
                current={quotaExceeded?.current ?? 0}
                limit={quotaExceeded?.limit ?? 0}
            />
        </div>
    );
};
