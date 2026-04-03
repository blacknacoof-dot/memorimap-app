import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { FuneralCompany } from '../../../types';
import { ConsultationForm } from '../../Consultation/BrandChatHelpers';
import { PetChatInterface } from '../../Consultation/PetChatInterface';
import { sendMessageToGemini, ChatMessage as GeminiMessage } from '../../../services/geminiService';
import { ChatMessages, MessageType } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { buildBrandConfig } from './BrandConfig';
import { generateSangjoContractNumber } from '../../../lib/sangjo/contractNumber';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onBack: () => void;
}

export const BrandChatInterface: React.FC<Props> = ({ company, onClose, onBack }) => {
    const isPetCompany = company.id.startsWith('pet_');
    const config = buildBrandConfig(company, isPetCompany);

    const [messages, setMessages] = useState<MessageType[]>([{
        id: 1, sender: 'ai', type: 'text',
        text: isPetCompany
            ? company.ai_welcome_message || `반갑습니다. 반려동물과의 아름다운 이별을 돕는 **${config.name}**입니다.\n\n무엇을 도와드릴까요? 아이의 장례 절차나 비용 등 궁금한 점을 말씀해 주세요.`
            : company.ai_welcome_message || `반갑습니다. 품격 있는 이별을 준비하는 곳, **${config.name} 공식 상담 채널**입니다.\n\n무엇을 도와드릴까요? 아래 메뉴를 선택하시거나 궁금한 점을 말씀해 주세요.`,
    }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'phone' | 'chat' | 'urgent'>('phone');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    if (isPetCompany) {
        return <PetChatInterface company={company} onClose={onClose} onBack={onBack} />;
    }

    const handleAiResponse = async (userText: string) => {
        setIsTyping(true);
        try {
            const history: GeminiMessage[] = messages
                .filter(m => m.sender === 'user' || m.sender === 'ai')
                .map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text, timestamp: new Date() }));
            const response = await sendMessageToGemini(userText, history, company);
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: response.text, type: 'text' }]);

            if (response.action === 'RESERVE') {
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "상담 예약을 위해 간단한 정보를 입력해 주세요.", type: 'action_request' }]);
                    setIsFormOpen(true);
                    setFormMode('chat');
                }, 500);
            } else if (response.action === 'URGENT_DISPATCH') {
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "가장 가까운 의전 팀을 즉시 배정하겠습니다. 현재 위치를 접수해주세요.", type: 'text' }]);
                    setFormMode('urgent');
                    setIsFormOpen(true);
                }, 500);
            } else if (response.action === 'SHOW_PRODUCTS') {
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "원하시는 상품이 없다면 상담을 통해 맞춤 설계를 도와드릴 수 있습니다.", type: 'product_carousel', data: config.products }]);
                }, 500);
            } else if (response.action === 'CALL_MANAGER') {
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "담당자와 바로 연결해 드릴까요?", type: 'action_request' }]);
                }, 500);
            }
        } catch (_error) {
            toast.error('AI 응답 중 오류가 발생했습니다.');
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: "죄송합니다. 잠시 후 다시 시도해 주세요.", type: 'text' }]);
        }
    };

    const handleSend = (msgText?: string) => {
        const textToSend = msgText || input;
        if (!textToSend.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: textToSend, type: 'text' }]);
        setInput('');
        handleAiResponse(textToSend);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend();
    };

    const handleFormOpen = (mode: 'phone' | 'chat') => {
        setFormMode(mode);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (formData: Record<string, unknown>) => {
        setIsFormOpen(false);
        const isUrgent = formMode === 'urgent';
        const isPhone = formMode === 'phone';
        const contractNumber = generateSangjoContractNumber(isUrgent);

        try {
            const { saveSangjoContract, resolveSangjoDbId, addTimelineEvent } = await import('../../../lib/sangjoQueries');
            const { supabase, getAuthClient } = await import('../../../lib/supabaseClient');
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const client = await getAuthClient(currentSession, { strict: true });
            const customerName = (formData.name as string) || '익명 고객';
            const customerPhone = (formData.phone as string) || '';
            const serviceType = isUrgent ? '긴급 출동' : (isPhone ? '전화 상담' : ((formData.type as string) || '채팅 상담'));
            const dbSangjoId = await resolveSangjoDbId(company.id, company.name, client);
            await saveSangjoContract({
                id: crypto.randomUUID(), contract_number: contractNumber, sangjo_id: dbSangjoId,
                customer_name: customerName, customer_phone: customerPhone, service_type: serviceType,
                status: '상담신청', application_type: 'CONSULTATION',
                preferred_call_time: (formData.time as string) || '', total_price: 0,
                emergency_level: isUrgent ? 'critical' : 'normal', created_at: new Date().toISOString()
            }, client);
            // 타임라인 기록
            await addTimelineEvent(
                contractNumber,
                isUrgent ? '긴급 상담 접수' : '상담 신청',
                `${customerName} (${serviceType}) - AI 브랜드 채팅 경유`,
                undefined,
                client
            ).catch(() => { /* 타임라인 실패는 상담 저장에 영향 없음 */ });
        } catch (_e) {
            toast.error('상담 접수 저장에 실패했습니다.');
            return;
        }

        if (isPhone) {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `✅ [전화 상담 예약 완료] ${formData.name}님, 요청하신 시간에 연락드리겠습니다.`, type: 'text' }]);
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `접수가 완료되었습니다. 담당 팀장님께 내용을 전달했습니다.\n요청 시간(**${formData.time}**)에 **${formData.phone}** 번호로 연락드리겠습니다.`, type: 'text' }]);
            }, 1000);
        } else if (isUrgent) {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `🚨 [긴급 접수 완료] ${formData.name}님, 접수번호 ${contractNumber}`, type: 'text' }]);
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `긴급 접수가 확정되었습니다. (접수번호: ${contractNumber})\n담당 팀장이 **3분 이내**에 ${formData.phone}으로 전화를 드려 안내해 드립니다.`, type: 'text' }]);
            }, 1000);
        } else {
            setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `✅ [정보 등록 완료] ${formData.name}님, 잠시만 기다려주세요.`, type: 'text' }]);
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: `반갑습니다, **${formData.name}**님.\n**${formData.type}**에 대해 궁금하신 점을 말씀해 주세요.\n\n입력해주신 연락처(${formData.phone})로 상품 안내서를 문자 발송해 드렸습니다.`, type: 'text' }]);
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative font-sans">
            {/* Header */}
            <div className={`${config.themeColor} p-4 flex items-center justify-between shadow-lg z-20 shrink-0`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-white/80 hover:text-white mr-1 active:scale-90 transition-transform">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner overflow-hidden">
                        {(config.logo.startsWith('/') || config.logo.startsWith('http')) ? (
                            <img src={config.logo} alt="brand logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg">{config.logo}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-white text-base tracking-tight">{config.name}</h1>
                            <Check className="w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <p className="text-[10px] text-white/80 font-medium tracking-wide opacity-90">공식 프리미엄 상담실</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onClose()} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Notice Bar */}
            <div className="bg-[#F0FDF4] border-b border-green-100 px-4 py-2 flex items-center gap-2 text-xs text-green-800 font-medium shrink-0">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span>공정위 등록업체 • 선수금 100% 안전 보장</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F8F9FA] scrollbar-thin scrollbar-thumb-gray-200 pb-20">
                <ChatMessages messages={messages} isTyping={isTyping} themeColor={config.themeColor} isPetCompany={isPetCompany} onFormOpen={handleFormOpen} />
                <div ref={messagesEndRef} />
            </div>

            <ChatInput input={input} onInputChange={setInput} onSend={handleSend} onKeyDown={handleKeyDown} themeColor={config.themeColor} />

            {isFormOpen && (
                <ConsultationForm company={company} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} mode={formMode} />
            )}
        </div>
    );
};
