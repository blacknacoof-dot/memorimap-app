import React, { useState, useRef, useEffect } from 'react';
import { Message, ConsultationTopic } from '../../types/consultation';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface Props {
    messages: Message[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    streamingText: string;
    topic?: string;
    onTopicSelect?: (topic: ConsultationTopic) => void;
}

const TOPICS: ConsultationTopic[] = [
    "장묘 방식 상담",
    "이용 절차 안내",
    "가격 및 옵션",
    "방문 예약 상담"
];

export const ChatBot: React.FC<Props> = ({
    messages,
    onSendMessage,
    isLoading,
    streamingText,
    topic,
    onTopicSelect
}) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamingText]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        console.log("ChatBot: handleSubmit triggered", { input, isLoading, topic }); // DEBUG
        if (!input.trim() || isLoading) {
            console.log("ChatBot: Validations failed");
            return;
        }
        onSendMessage(input);
        setInput('');
    };

    const handleTopicClick = (t: ConsultationTopic) => {
        console.log("ChatBot: Topic clicked", t); // DEBUG
        if (onTopicSelect) onTopicSelect(t);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {/* Welcome / Topic Selection */}
                {messages.length === 0 && (
                    <div className="text-center py-8 space-y-6">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-primary ring-4 ring-primary/5">
                            <Sparkles size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">AI 추모 상담소</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                궁금하신 내용을 선택하거나 직접 물어보세요.<br />친절하게 안내해 드리겠습니다.
                            </p>
                        </div>

                        {!topic && onTopicSelect && (
                            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto px-4">
                                {TOPICS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => onTopicSelect(t)}
                                        className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm text-left"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Message List */}
                {messages.map((msg, idx) => (
                    <ChatMessage key={idx} message={msg} />
                ))}

                {/* Streaming Message (AI Thinking/Typing) */}
                {(isLoading || streamingText) && (
                    <ChatMessage
                        message={{
                            role: 'model',
                            text: streamingText,
                            timestamp: new Date()
                        }}
                        isStreaming={true}
                    />
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t relative">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="궁금한 내용을 입력해주세요..."
                        disabled={isLoading}
                        className="flex-1 bg-gray-100 text-gray-900 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-primary text-white p-3 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg active:scale-95"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
};
