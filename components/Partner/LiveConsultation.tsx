import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, User, Bot, Zap,
    CheckCircle, Send,
    MoreHorizontal, Smartphone, Hash, MonitorDot, XCircle, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner'; // [Phase 2] Error Handler
import { supabase, getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { PartnerConversation } from '../../types';

interface LiveConsultationProps {
    partnerId: string;
}

export const LiveConsultation: React.FC<LiveConsultationProps> = ({ partnerId }) => {
    const [conversations, setConversations] = useState<PartnerConversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { session } = useSession();

    useEffect(() => {
        loadConversations();
        const sub = setupRealtime();
        return () => { sub(); };
    }, [partnerId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedId, conversations]);

    const loadConversations = async () => {
        const client = await getAuthClient(session);
        const { data } = await client
            .from('partner_conversations')
            .select('*')
            .eq('partner_id', partnerId)
            .order('last_message_at', { ascending: false });
        if (data) setConversations(data as PartnerConversation[]);
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel(`partner-live-${partnerId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'partner_conversations',
                filter: `partner_id=eq.${partnerId}`
            }, (payload) => {
                const updated = payload.new as PartnerConversation;
                setConversations(prev => {
                    const idx = prev.findIndex(c => c.id === updated.id);
                    if (idx > -1) {
                        const newArr = [...prev];
                        newArr[idx] = updated;
                        return newArr.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
                    }
                    return [updated, ...prev];
                });
            })
            .subscribe();
        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    };

    const handleHijack = async () => {
        if (!selectedId) return;
        const client = await getAuthClient(session);
        const { error } = await client
            .from('partner_conversations')
            .update({ conversation_status: 'agent_connected', priority: 'high' })
            .eq('id', selectedId);
        if (error) toast.error('개입 실패');
    };

    const handleSend = async () => {
        if (!input.trim() || !selectedId) return;

        const selected = conversations.find(c => c.id === selectedId);
        if (!selected) return;

        const newMessage = {
            role: 'assistant',
            content: input,
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...selected.messages, newMessage];

        const client = await getAuthClient(session);
        const { error } = await client
            .from('partner_conversations')
            .update({
                messages: updatedMessages,
                last_message_at: new Date().toISOString(),
                conversation_status: 'agent_connected'
            })
            .eq('id', selectedId);

        if (error) {
            toast.error('메시지 전송에 실패했습니다.');
            return;
        }
        setInput('');
    };

    const handleSelectConversation = (id: string) => {
        setSelectedId(id);
    };

    const handleBack = () => {
        setSelectedId(null);
    };

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="flex h-[calc(100dvh-180px)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Sidebar: Conversation List - hidden on mobile when chat is selected */}
            <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-100 flex-col bg-slate-50/30`}>
                <div className="p-4 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        실시간 대화
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            className={`p-4 cursor-pointer transition-all hover:bg-white min-h-[44px] ${selectedId === conv.id ? 'bg-white ring-2 ring-blue-500/10 z-10' : ''
                                } ${conv.conversation_status === 'agent_requested' ? 'bg-red-50/50' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-800 text-sm">{conv.user_name || '익명 고객'}</span>
                                <span className="text-[9px] text-slate-400 font-medium">
                                    {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mb-2">
                                {conv.messages[conv.messages.length - 1]?.content}
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${conv.conversation_status === 'ai_handling' ? 'bg-blue-100 text-blue-600' :
                                    conv.conversation_status === 'agent_requested' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                    {conv.conversation_status.replace('_', ' ')}
                                </span>
                                {conv.priority === 'critical' && (
                                    <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Emergency</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {conversations.length === 0 && (
                        <div className="p-10 text-center text-slate-400 text-xs italic">진행 중인 채팅이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* Chat Area - full width on mobile, flex-1 on desktop */}
            {selectedConv ? (
                <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white`}>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            {/* Mobile back button */}
                            <button
                                onClick={handleBack}
                                className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                <User className="text-slate-400" size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{selectedConv.user_name || '익명 고객'}</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Smartphone size={10} /> {selectedConv.user_phone || '연락처 미제공'}</span>
                                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hidden sm:flex"><Zap size={10} /> {selectedConv.conversation_status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selectedConv.conversation_status === 'ai_handling' && (
                                <button
                                    onClick={handleHijack}
                                    className="bg-blue-600 text-white px-3 md:px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 min-h-[44px]"
                                >
                                    <Bot size={14} /> <span className="hidden sm:inline">상담</span> 개입
                                </button>
                            )}
                            <button
                                onClick={() => toast.info('추가 기능은 준비 중입니다.')}
                                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30">
                        {selectedConv.messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.role === 'user'
                                    ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                    : 'bg-slate-800 text-white rounded-tr-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <p className={`text-[8px] mt-1.5 opacity-50 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-slate-100 pb-safe">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                placeholder={selectedConv.conversation_status === 'ai_handling' ? "상담 개입 후 메시지를 보낼 수 있습니다." : "고객에게 메시지 전송..."}
                                className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={selectedConv.conversation_status === 'ai_handling'}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || selectedConv.conversation_status === 'ai_handling'}
                                className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-30 shadow-lg shadow-blue-500/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-300 gap-4">
                    <MessageSquare size={64} className="opacity-10" />
                    <p className="font-bold text-slate-400 italic">왼쪽 목록에서 대화를 선택하세요.</p>
                </div>
            )}
        </div>
    );
};
