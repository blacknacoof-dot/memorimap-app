import React, { useState, useRef, useEffect } from 'react';
import { Message, ConsultationTopic } from '../../types/consultation';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Sparkles, UserCheck, ShieldCheck, Bot, X, Phone, FileText, ChevronRight, Check, Star, Shield, Info, ArrowLeft, MessageSquare, BookOpen, Clock, Calendar, User, Smartphone, ChevronDown } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFacilityFaqs } from '../../lib/queries';

import { FuneralCompany } from '../../types';
import { FUNERAL_COMPANIES } from '../../constants';

interface Props {
    onClose: () => void;
    company?: FuneralCompany | null;
    onCompanySelect?: (company: FuneralCompany) => void;
}

const TOPICS: string[] = [
    "장례 비용 견적 문의",
    "상조 상품 비교 추천",
    "임종 전 긴급 상담",
    "장례 절차 및 부고 알림"
];

// 고객 니즈 파악을 위한 키워드 버튼 (Maum-i Mode)
const PREFERENCE_CHIPS = [
    { id: 'urgent', label: "⚡ 급해요 (후불제)", value: "급해요 (후불제)", isEmergency: true },
    { id: 'price', label: "💰 가성비가 중요해요", value: "가성비가 중요해요", isEmergency: false },
    { id: 'quality', label: "🏆 서비스 품질 최우선", value: "서비스 품질 최우선", isEmergency: false },
    { id: 'safety', label: "🛡️ 튼튼한 안전성", value: "튼튼한 안전성", isEmergency: false },
    { id: 'religion', label: "✝️ 기독교/천주교 전용", value: "기독교/천주교 전용", isEmergency: false }
];

type ConsultationStep = 'GUIDE' | 'INFO' | 'CONTRACT' | 'CONSULT' | 'COMPLETE';

interface ContractData {
    companyId?: string;
    companyName?: string;
    customerName?: string;
    customerPhone?: string;
    preferredCallTime?: string; // 추가
    budget?: string;
    period?: string;
    location?: string;
    religion?: string;
    options?: Array<{ name: string, price: number }>;
    totalPrice?: number;
    service_type?: string;
    application_type?: 'CONTRACT' | 'CONSULTATION'; // 추가: 가입계약 vs 전문가상담
}

// System prompt function for dynamic persona
const getSystemPrompt = (step: ConsultationStep, data: ContractData, companyName?: string) => {
    // 1. Integrated Comparison Mode (Maum-i)
    if (!companyName) {
        const companiesInfo = FUNERAL_COMPANIES.map(c =>
            `- ${c.name}: [가격] ${c.priceRange} [평점] ${c.rating} [특징] ${c.features.join(', ')} [혜택] ${c.benefits[0]}`
        ).join('\n');

        return `당신은 상조 통합 비교 상담사 **'마음이'**입니다.
특정 업체의 소속이 아니며, 고객의 상황(예산, 지역, 종교, 선호도)을 듣고 가장 적합한 상조 회사를 **객관적으로 비교하고 추천**해주는 역할입니다.

【보유 업체 데이터】
${companiesInfo}

【상담 원칙】
1. **중립성**: 무조건 특정 업체를 미는 것이 아니라, 고객의 니즈에 가장 잘 맞는 곳을 1~2곳 간추려 추천하세요.
2. **비교 분석**: 추천 시, "A사는 가격이 저렴한 대신 실속형이고, B사는 프리미엄 서비스가 강점입니다"와 같이 장단점을 비교해주세요.
3. **추모맵 혜택 강조**: 모든 제휴 업체는 추모맵을 통해 가입 시 **최대 100만원 상당의 할인 및 지원 혜택**이 있다는 점을 상기시키세요.
4. **연결 유도**: 고객이 특정 업체에 관심을 보이면, "해당 업체의 AI 상담사로 연결해 드릴까요?" 또는 "상세 견적을 위해 해당 업체 페이지로 이동하시겠습니까?"라고 물어보세요.

답변은 친절하고 전문적인 '해요체'를 사용하세요.`;
    }

    // 2. Individual Company Sales Mode
    const aiName = `${companyName} AI 상담사`;
    const base = `당신은 ${aiName}입니다. 타 상조 업체와의 비교는 절대로 하지 않으며, 오직 ${companyName}의 서비스 안내와 고객 지원에만 집중합니다.
당신의 궁극적인 목표는 고객의 궁금증을 해소하고 **본 업체의 상조 상품에 가입(계약)하도록 유도하는 것(Closing)**입니다.
추모맵을 통해 가입할 때만 제공되는 **단독 혜택(할인권, 사은품 등)**을 대화 중간에 자연스럽게 언급하여 가입 의사를 높이십시오.`;

    const stepPrompts = {
        GUIDE: `
【1단계: 서비스 안내 및 혜택 강조】
- 목적: ${companyName}의 주요 상품과 **추모맵 단독 가입 혜택**을 짧고 명확하게 안내합니다.
- 혜택 안내: "지금 추모맵을 통해 ${companyName}에 가입하시면, 오직 여기서만 제공되는 **'30만원 상당의 독점 할인권'** 또는 **'추모 바우처'** 혜택을 즉시 받을 수 있습니다."
- 규칙: 6줄 이내 답변. 마지막에 "이 독점 혜택을 놓치지 않고 지금 바로 가입을 진행하시겠습니까, 아니면 상담원과 더 상세히 통화하시겠습니까?"라고 물으십시오.
- 단계 전환: 가입/계약을 원하면 [NEXT_STEP:CONTRACT], 상담원 연결을 원하면 [NEXT_STEP:CONSULT] 태그를 붙이세요.`,

        INFO: `
【단계: 기초 정보 파악】
- 목적: 고객의 예산, 지역, 종교, 긴급 여부 등을 파악하여 맞춤 안내를 준비합니다.`,

        CONTRACT: `
【가입 계약 단계】
- 목적: 직접 가입을 원하는 고객의 정보를 수집합니다.
- 규칙: 성함, 연락처, 희망 상품(3일장 등)을 순차적으로 물어보세요.
- 완료 시: [NEXT_STEP:COMPLETE] 태그와 함께 [DATA:{"type":"CONTRACT","name":"이름","phone":"번호","service":"상품"}] 를 포함하세요.`,

        CONSULT: `
【전문가 상담 예약 단계】
- 목적: 전문 상담원과의 전화 상담을 예약합니다.
- 규칙: 성함, 연락처, **통화 가능한 시간**을 반드시 물어보세요.
- 완료 시: [NEXT_STEP:COMPLETE] 태그와 함께 [DATA:{"type":"CONSULT","name":"이름","phone":"번호","callTime":"희망시간"}] 를 포함하세요.`,

        COMPLETE: `가입 및 상담 신청이 성공적으로 접수되었습니다. 담당자가 확인 후 즉시 연락드릴 예정임을 알리세요.`
    };

    return `${base}\n${stepPrompts[step] || stepPrompts.GUIDE}\n\n【중요 규칙】\n- 답변 끝에 반드시 [NEXT_STEP:단계명]을 포함하여 흐름을 제어하세요.\n- 데이터 수집 완료 시 [DATA:{...}] 형식을 지키세요.\n- 친절하고 전문적인 말투 유지.`;
};

import { BrandChatInterface } from './BrandChatInterface';
import { PetChatInterface } from './PetChatInterface';

export const SangjoConsultationModal: React.FC<Props> = ({ onClose, company, onCompanySelect }) => {
    const [activeCompany, setActiveCompany] = useState<FuneralCompany | null | undefined>(company);

    // If specific pet company is active, use the dedicated Pet UI
    if (activeCompany?.id.startsWith('pet_')) {
        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full h-[85vh] sm:h-[700px] max-w-md flex flex-col shadow-2xl overflow-hidden relative">
                    <PetChatInterface
                        company={activeCompany}
                        onClose={onClose}
                        onBack={onClose}
                    />
                </div>
            </div>
        );
    }

    // Existing prop-based redirect for Human companies
    if (company && !company.id.startsWith('pet_')) {
        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full h-[85vh] sm:h-[700px] max-w-md flex flex-col shadow-2xl overflow-hidden relative">
                    <BrandChatInterface
                        company={company}
                        onClose={onClose}
                        onBack={onClose}
                    />
                </div>
            </div>
        );
    }

    const [step, setStep] = useState<ConsultationStep>('GUIDE');
    const [contractData, setContractData] = useState<ContractData>({});

    const [faqs, setFaqs] = useState<any[]>([]);
    // ... activeCompany로 변경
    const systemPrompt = getSystemPrompt(step, contractData, activeCompany?.name);
    const aiName = activeCompany ? `${activeCompany.name} AI 상담사` : "마음이";

    const [messages, setMessages] = useState<Message[]>([]);

    // Initialize/Reset Chat when activeCompany changes
    useEffect(() => {
        const initialMsg: Message = {
            role: 'model',
            text: activeCompany?.name
                ? `안녕하십니까. ${activeCompany.name} AI 상담사입니다. \n\n실시간 상담을 통해 **추모맵 단독 가입 혜택(상조비 할인 및 사은품)**을 확인하시고, ${activeCompany.name} 상품 가입까지 원스톱으로 도와드리겠습니다.\n\n어떤 도움이 필요하십니까?`
                : `안녕하십니까! 통합 비교 AI **'마음이'**입니다. 🤖\n\n수많은 상조 회사 중 어디를 선택해야 할지 고민이신가요?\n고객님의 상황(종교, 예산, 선호도)을 알려주시면, 가장 적합한 **Best 3 업체를 비교 분석**하여 추천해 드립니다.\n\n"어떤 점을 중점적으로 비교해 드릴까요?"`,
            timestamp: new Date()
        };
        setMessages([initialMsg]);
        setContractData({ companyName: activeCompany?.name });
        setStep('GUIDE'); // Reset step
    }, [activeCompany]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [topic, setTopic] = useState<string | null>(null);

    // Event Listener for 'connectToPartner' from ChatMessage
    useEffect(() => {
        const handleConnect = (e: CustomEvent<FuneralCompany>) => {
            if (e.detail) {
                // Switch to the selected partner (Maum-i -> Specific Company)
                setActiveCompany(e.detail);

                // Notify parent if handler exists (For Room Switching)
                if (onCompanySelect) {
                    onCompanySelect(e.detail);
                }
            }
        };
        window.addEventListener('connectToPartner', handleConnect as any);
        return () => window.removeEventListener('connectToPartner', handleConnect as any);
    }, [onCompanySelect]);

    // Load FAQs
    useEffect(() => {
        const loadFaqs = async () => {
            // Only load FAQs if specific company selected
            if (activeCompany?.id) {
                const data = await getFacilityFaqs(activeCompany.id);
                setFaqs(data);
            }
        };
        loadFaqs();
    }, [activeCompany]);

    // Auto-scroll on messages or streaming change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamingText]);

    const handleSendMessage = async (text: string) => {
        const userMsg: Message = { role: 'user', text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // --- MAUM-I LOGIC (Rule-based Filter) ---
            if (!activeCompany) {
                // Simulate thinking time
                await new Promise(r => setTimeout(r, 1000));

                let recommended = FUNERAL_COMPANIES;
                let filterMessage = "";

                if (text.includes('가성비') || text.includes('저렴') || text.includes('실속')) {
                    // Simple price logic: Assuming '문의' or check priceRange string length/content
                    // For demo, shuffling and picking first 3
                    recommended = FUNERAL_COMPANIES.slice(0).sort(() => Math.random() - 0.5);
                    filterMessage = "합리적인 가격과 실속을 중요하게 생각하시는군요! 💰\n거품을 뺀 **가성비 최우수 업체**를 메인으로 추천해 드립니다.";
                } else if (text.includes('서비스') || text.includes('품질') || text.includes('고급')) {
                    recommended = FUNERAL_COMPANIES.filter(c => c.rating >= 4.8);
                    filterMessage = "마지막 가시는 길, 부족함이 없어야 하죠. 🏆\n고품격 의전과 리무진 서비스로 평판이 좋은 **프리미엄 업체**입니다.";
                } else if (text.includes('안전') || text.includes('튼튼') || text.includes('신뢰')) {
                    recommended = FUNERAL_COMPANIES.filter(c => c.reviewCount > 800);
                    filterMessage = "무엇보다 믿을 수 있는 곳이 중요하죠. 🛡️\n재무 건전성이 우수하고 **고객 신뢰도가 높은 대형 업체** 위주로 골랐습니다.";
                } else if (text.includes('기독교') || text.includes('종교')) {
                    // Filter by name or features
                    recommended = FUNERAL_COMPANIES.filter(c => c.name.includes('크리스찬') || c.features.includes('기독교'));
                    // Fallback if none
                    if (recommended.length === 0) recommended = FUNERAL_COMPANIES.slice(0, 3);
                    filterMessage = "종교 예식에 맞는 전문 지도사가 필요하시군요. ✝️\n**입관 예배와 전용 추모 절차**를 지원하는 특화 상품입니다.";
                } else if (text.includes('급해요') || text.includes('후불') || text.includes('당장')) {
                    // [Fast-Track Logic]
                    // Skip regular comparison, go straight to dispatch mode
                    filterMessage = "🚨 **긴급 출동 상황**으로 접수되었습니다.\n\n경황이 없으시겠지만, 가장 빨리 도착할 수 있는 팀을 배정하기 위해 **현재 계신 위치(장례식장 또는 자택)**를 알려주세요.\n\n(예: 서울 강남세브란스 / 부산 자택)";

                    // Recommend Post-Payment companies
                    recommended = FUNERAL_COMPANIES.filter(c => c.features.includes("후불제"));
                } else {
                    // General AI fallback for Maum-i if not a keyword match? 
                    // Or just generic recommendation
                    recommended = FUNERAL_COMPANIES.slice(0, 3);
                    filterMessage = "고객님의 요청 사항을 종합적으로 분석하여,\n현재 가장 만족도가 높은 **Top 3 업체**를 비교해 드립니다.";
                }

                // 1. Text Response
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: filterMessage,
                    timestamp: new Date()
                }]);

                // 2. Card Recommendation (Skipped if recommended is empty - Fast Track)
                if (recommended.length > 0) {
                    const top3 = recommended.slice(0, 3);
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            role: 'model',
                            text: "아래 카드를 넘겨보시고, 마음에 드는 곳의 **[상담 연결]** 버튼을 눌러주세요.\n해당 업체의 AI 상담사가 구체적인 견적과 절차를 안내해 드립니다.",
                            timestamp: new Date(),
                            recommendation: top3
                        }]);
                    }, 500);
                }

                setIsLoading(false);
                return; // Exit function, don't use Gemini for this flow
            }

            // --- EXISTING GEMINI LOGIC (Specific Company) ---
            const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;

            let aiText = "";

            if (apiKey) {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

                const chat = model.startChat({
                    history: messages
                        .filter((m, i) => !(i === 0 && m.role === 'model'))
                        .map(m => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.text }]
                        })),
                    generationConfig: {
                        maxOutputTokens: 1000,
                    },
                });

                const prompt = `${systemPrompt}\n\n사용자: ${text}`;
                const result = await chat.sendMessage(prompt);
                const response = await result.response;
                aiText = response.text();

                // 단계 전환 태그 파싱 ([NEXT_STEP:COMPARE] 등) - 전역 매칭 및 유연한 파싱
                const nextStepMatch = aiText.match(/\[NEXT_STEP:\s*(\w+)\s*\]/i);
                if (nextStepMatch) {
                    const nextStep = nextStepMatch[1].toUpperCase() as ConsultationStep;
                    setStep(nextStep);

                    // 데이터 추출 및 저장 ([DATA:{...}])
                    const dataMatch = aiText.match(/\[DATA:\s*(\{.*\})\s*\]/i);
                    if (dataMatch && nextStep === 'COMPLETE') {
                        try {
                            const d = JSON.parse(dataMatch[1]);
                            const isConsult = d.type === 'CONSULT';
                            const contractNumber = `${isConsult ? 'REQ' : 'AMI'}-2025-${Math.floor(Math.random() * 900000 + 100000)}`;

                            const { saveSangjoContract } = await import('../../lib/sangjoQueries');
                            await saveSangjoContract({
                                contract_number: contractNumber,
                                sangjo_id: activeCompany?.id || 'unknown',
                                customer_name: d.name || '익명 고객',
                                customer_phone: d.phone || '010-0000-0000',
                                service_type: d.service || (isConsult ? '전문가 상담 요청' : '3일 표준장'),
                                status: isConsult ? '상담신청' : '예약대기',
                                application_type: isConsult ? 'CONSULTATION' : 'CONTRACT',
                                preferred_call_time: d.callTime || '',
                                total_price: d.price || 0, // 필수로 추가
                                created_at: new Date().toISOString()
                            });

                            console.log(`✅ ${isConsult ? '상담 신청' : '가입 신청'} 완료:`, contractNumber);
                        } catch (e) {
                            console.error('데이터 파싱 또는 저장 실패:', e);
                        }
                    }

                    // 태그 제거 (답변 텍스트에서 깔끔하게 제거)
                    aiText = aiText.replace(/\[NEXT_STEP:\s*\w+\s*\]/gi, '').trim();
                    aiText = aiText.replace(/\[DATA:\s*\{.*\}\s*\]/gi, '').trim();
                }
            } else {
                // Fallback Mock
                await new Promise(r => setTimeout(r, 1500));
                aiText = "죄송합니다. 현재 설정된 AI API 키가 없거나 인식되지 않았습니다. 관리자에게 문의해주세요.";
            }

            setMessages(prev => [...prev, {
                role: 'model',
                text: aiText,
                timestamp: new Date()
            }]);
        } catch (error: any) {
            console.error("AI Error Details:", {
                message: error.message,
                name: error.name,
                stack: error.stack,
                model: "gemini-2.0-flash-exp",
                apiKeyExists: !!import.meta.env.VITE_GOOGLE_GENAI_API_KEY
            });

            let errorMessage = "AI 연결 중 오류가 발생했습니다.";
            if (error.message?.includes("API key")) {
                errorMessage = "API 키가 유효하지 않거나 설정되지 않았습니다.";
            } else if (error.message?.includes("User location is not supported")) {
                errorMessage = "현재 국가에서는 이 AI 모델을 사용할 수 없습니다.";
            } else if (error.message?.includes("404") || error.message?.includes("not found")) {
                errorMessage = "요청한 AI 모델(gemini-2.0-flash-exp)을 찾을 수 없습니다. API 설정을 확인해주세요.";
            }

            setMessages(prev => [...prev, {
                role: 'model',
                text: `${errorMessage}\n(개발자 도구 콘솔을 확인해주세요)`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopicSelect = (t: string) => {
        setTopic(t);
        handleSendMessage(`${t}에 대해 상담받고 싶습니다.`);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white ring-2 ring-white/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{activeCompany ? aiName : "'마음이' (통합 비교 AI)"}</h3>
                            <p className="text-xs text-amber-400 font-bold">{activeCompany ? '공식 브랜드 상담 채널' : '상조 업체 비교 분석 센터'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.length === 1 && activeCompany && (
                        <div className="grid grid-cols-1 gap-2 mb-4">
                            {TOPICS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleTopicSelect(t)}
                                    className="p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-amber-500 hover:bg-amber-50 text-left transition-all shadow-sm"
                                >
                                    💬 {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <ChatMessage key={idx} message={msg} />
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 flex items-center gap-2 text-gray-500 text-sm">
                                <Loader2 size={16} className="animate-spin text-amber-500" />
                                <span>전문가가 답변을 작성 중입니다...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 bg-white border-t border-gray-100 z-20">
                    {/* Preference Chips (Maum-i Mode) - Fixed Buffer Area */}
                    {!activeCompany && (
                        <div className="px-4 pt-3 pb-2">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {PREFERENCE_CHIPS.map((chip) => (
                                    <button
                                        key={chip.id}
                                        onClick={() => handleSendMessage(chip.value)}
                                        disabled={isLoading}
                                        className={`flex-shrink-0 border text-xs font-semibold px-3.5 py-2.5 rounded-full shadow-sm transition-all whitespace-nowrap active:scale-95
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
                    )}

                    <div className="p-4 pt-0 relative mt-2">
                        <div className="relative flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(input)}
                                placeholder="궁금한 내용을 입력하세요..."
                                disabled={isLoading}
                                className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
                            />
                            <button
                                onClick={() => handleSendMessage(input)}
                                disabled={!input.trim() || isLoading}
                                className="bg-gray-900 text-amber-500 p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 mt-2">
                            상담 내용은 서비스 품질 향상을 위해 기록될 수 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

