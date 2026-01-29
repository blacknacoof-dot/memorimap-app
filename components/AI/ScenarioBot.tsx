import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, X, Send, Bot,
    User, Phone, DollarSign, MapPin,
    Zap, ChevronRight, RefreshCw, AlertTriangle,
    Siren, ClipboardList, CreditCard, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Partner } from '../../types';

interface ScenarioBotProps {
    partnerId: string;
    onClose: () => void;
}

interface Message {
    role: 'assistant' | 'user';
    content: string;
    options?: { label: string, action: string, icon?: React.ReactNode }[];
    type?: 'text' | 'pricing' | 'location' | 'contact';
}

export const ScenarioBot: React.FC<ScenarioBotProps> = ({ partnerId, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isHijacked, setIsHijacked] = useState(false);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        initBot();
    }, [partnerId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const initBot = async () => {
        setLoading(true);
        const { data } = await supabase.from('partners').select('*').eq('id', partnerId).single();
        if (data) {
            setPartner(data as Partner);
            const welcomeMsg = data.ai_context?.welcome_message || `안녕하세요, ${data.name}입니다.\n\n소중한 시간에 방문해 주셔서 감사합니다.\n무엇을 도와드릴까요?`;
            const initialMessages: Message[] = [
                {
                    role: 'assistant',
                    content: welcomeMsg,
                    options: [
                        { label: '긴급 상황 (임종 발생)', action: 'agent_request', icon: <Siren className="text-red-500 w-5 h-5" /> },
                        { label: '비용 문의', action: 'show_pricing', icon: <DollarSign className="text-yellow-600 w-5 h-5" /> },
                        { label: '서비스 안내', action: 'show_info', icon: <ClipboardList className="text-slate-500 w-5 h-5" /> },
                        { label: '상담원 연결', action: 'agent_request', icon: <User className="text-slate-600 w-5 h-5" /> }
                    ]
                }
            ];
            setMessages(initialMessages);

            // Create session in DB
            const { data: session } = await supabase.from('partner_conversations').insert([{
                partner_id: partnerId,
                messages: initialMessages,
                conversation_status: 'ai_handling',
                last_message_at: new Date().toISOString()
            }]).select().single();

            if (session) {
                setConversationId(session.id);
                listenToHijack(session.id);
            }
        }
        setLoading(false);
    };

    const listenToHijack = (id: string) => {
        supabase.channel(`conv-${id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partner_conversations', filter: `id=eq.${id}` }, (payload) => {
                const updated = payload.new;
                if (updated.conversation_status === 'agent_connected') {
                    setIsHijacked(true);
                }
                setMessages(updated.messages);
            })
            .subscribe();
    };

    const handleAction = async (action: string, label: string) => {
        if (isHijacked) return;

        const newUserMsg: Message = { role: 'user', content: label };
        const updatedMsgs = [...messages, newUserMsg];
        setMessages(updatedMsgs);

        let assistantMsg: Message | null = null;

        switch (action) {
            case 'show_pricing':
                assistantMsg = {
                    role: 'assistant',
                    content: partner?.ai_context?.prices ? `현재 저희 서비스 가격 정보입니다:\n${partner.ai_context.prices}` : '현재 준비된 정찰 가격표가 없습니다. 상담사를 통해 자세한 견적을 받아보시겠어요?',
                    options: [
                        { label: '자세한 견적 요청', action: 'agent_request', icon: <Phone className="text-green-600 w-5 h-5" /> },
                        { label: '메인 메뉴로', action: 'restart' }
                    ]
                };
                break;
            case 'show_info':
                assistantMsg = {
                    role: 'assistant',
                    content: partner?.ai_context?.description || `${partner?.name}은 유가족분들의 마음을 다해 정직하고 품격 있는 장례 서비스를 제공합니다.`,
                    options: [
                        { label: '상세 서비스 보기', action: 'agent_request', icon: <ChevronRight className="w-5 h-5" /> },
                        { label: '메인 메뉴로', action: 'restart' }
                    ]
                };
                break;
            case 'agent_request':
                assistantMsg = {
                    role: 'assistant',
                    content: '전담 상담사에게 연결을 요청했습니다. 잠시만 기다려주시면 직접 답변해 드리겠습니다.',
                    type: 'contact'
                };
                // Update status in DB to alert partner
                if (conversationId) {
                    await supabase.from('partner_conversations').update({
                        conversation_status: 'agent_requested',
                        priority: 'high'
                    }).eq('id', conversationId);
                }
                break;
            case 'restart':
                assistantMsg = {
                    role: 'assistant',
                    content: '원하시는 메뉴를 선택해 주세요.',
                    options: [
                        { label: '긴급 상황 (임종 발생)', action: 'agent_request', icon: <Siren className="text-red-500 w-5 h-5" /> },
                        { label: '비용 문의', action: 'show_pricing', icon: <DollarSign className="text-yellow-600 w-5 h-5" /> },
                        { label: '서비스 안내', action: 'show_info', icon: <ClipboardList className="text-slate-500 w-5 h-5" /> },
                        { label: '상담원 연결', action: 'agent_request', icon: <User className="text-slate-600 w-5 h-5" /> }
                    ]
                };
                break;
            default:
                break;
        }

        if (assistantMsg) {
            const finalMsgs = [...updatedMsgs, assistantMsg];
            setMessages(finalMsgs);
            if (conversationId) {
                await supabase.from('partner_conversations').update({
                    messages: finalMsgs,
                    last_message_at: new Date().toISOString()
                }).eq('id', conversationId);
            }
        }
    };

    const handleSendInput = async () => {
        if (!input.trim() || !conversationId) return;

        const newUserMsg: Message = { role: 'user', content: input };
        const updatedMsgs = [...messages, newUserMsg];
        setMessages(updatedMsgs);
        setInput('');

        await supabase.from('partner_conversations').update({
            messages: updatedMsgs,
            last_message_at: new Date().toISOString()
        }).eq('id', conversationId);

        // If not hijacked, give a simple AI response
        if (!isHijacked) {
            setTimeout(async () => {
                const aiReply: Message = {
                    role: 'assistant',
                    content: '메시지가 전달되었습니다. 상담사가 확인 후 곧 답변을 드릴 예정입니다. 급하신 경우 하단 버튼을 눌러주세요.',
                    options: [{ label: '긴급 상담 요청', action: 'agent_request', icon: <Siren className="text-red-500 w-4 h-4" /> }]
                };
                const finalMsgs = [...updatedMsgs, aiReply];
                setMessages(finalMsgs);
                await supabase.from('partner_conversations').update({
                    messages: finalMsgs,
                    last_message_at: new Date().toISOString()
                }).eq('id', conversationId);
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md h-full sm:h-[90vh] bg-[#F7F8F9] rounded-none sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col border-x border-slate-200 animate-in zoom-in-95 duration-300">
                {/* Header: Forest Green */}
                <div className="p-4 bg-[#006442] text-white flex items-center justify-between shadow-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                            <Bot className="text-[#006442]" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base tracking-tight">{partner?.name || 'Loading...'}</h3>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-90">
                                <span className="text-[10px] font-medium tracking-wide">AI 상담 · 24시간 운영</span>
                                <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Phone size={24} className="text-white" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex transition-all animate-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                                    <Bot size={16} className="text-[#006442]" />
                                </div>
                            )}
                            <div className={`max-w-[85%] space-y-2`}>
                                <div className={`${msg.role === 'user' ? 'bg-[#006442] text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm' : 'bg-white text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 shadow-sm'}`}>
                                    <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
                                </div>

                                {/* Options (Assistant only) - UI in image */}
                                {msg.role === 'assistant' && msg.options && !isHijacked && (
                                    <div className="pt-2 flex flex-col gap-2 w-[calc(100vw-60px)] max-w-sm">
                                        {msg.options.map((opt, j) => (
                                            <button
                                                key={j}
                                                onClick={() => handleAction(opt.action, opt.label)}
                                                className="w-full bg-white hover:bg-slate-50 text-slate-700 px-4 py-4 rounded-xl border border-slate-200 transition-all flex items-center justify-start gap-4 shadow-sm active:scale-[0.98]"
                                            >
                                                <div className="shrink-0">{opt.icon}</div>
                                                <span className="text-[14px] font-bold flex-1 text-left">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isHijacked && (
                        <div className="flex justify-center py-4">
                            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                                <Zap size={12} className="animate-bounce" />
                                상담사가 실시간 대화에 개입했습니다
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Input */}
                <div className="bg-white border-t border-slate-100 p-4 shrink-0">
                    <div className="relative flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-[#006442]/10 transition-all">
                        <input
                            type="text"
                            placeholder="추가 질문을 입력하세요..."
                            className="flex-1 bg-transparent border-none py-1 text-[13px] outline-none font-medium placeholder:text-slate-400"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendInput()}
                        />
                        <button
                            onClick={handleSendInput}
                            disabled={!input.trim()}
                            className="text-[#006442] disabled:opacity-20 transition-all"
                        >
                            <Send size={20} />
                        </button>
                    </div>

                    {/* Bottom Nav Bar - UI in image */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-around items-center grayscale opacity-60">
                        <div className="flex flex-col items-center gap-1 cursor-not-allowed">
                            <MapPin size={20} />
                            <span className="text-[10px] font-bold">위치</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-not-allowed">
                            <Phone size={20} />
                            <span className="text-[10px] font-bold">전화</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-not-allowed">
                            <Calendar size={20} />
                            <span className="text-[10px] font-bold">예약</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-not-allowed">
                            <CreditCard size={20} />
                            <span className="text-[10px] font-bold">결제</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
