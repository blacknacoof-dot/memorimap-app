import React from 'react';
import { CalendarCheck, MapPin, Phone } from 'lucide-react';
import DOMPurify from 'dompurify';

export type AiActionType = 'NONE' | 'RESERVE' | 'MAP' | 'CALL_MANAGER';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
    action?: AiActionType;
}

interface PetChatMessagesProps {
    messages: ChatMessage[];
    isTyping: boolean;
    onActionClick: (action: AiActionType) => void;
}

const PetChatMessages: React.FC<PetChatMessagesProps> = ({ messages, isTyping, onActionClick }) => {
    return (
        <>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                        ? 'bg-amber-800 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-2xl rounded-tl-sm'
                        }`}>
                        <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }}
                        />

                        {msg.sender === 'ai' && msg.action !== 'NONE' && (
                            <button onClick={() => onActionClick(msg.action!)} className="mt-4 w-full bg-amber-50/50 border border-amber-100 hover:bg-amber-100/50 text-amber-900 text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition font-bold shadow-sm">
                                {msg.action === 'RESERVE' && <><CalendarCheck size={16} /> 바로 예약하기</>}
                                {msg.action === 'MAP' && <><MapPin size={16} /> 오시는 길</>}
                                {msg.action === 'CALL_MANAGER' && <><Phone size={16} /> 지도사 전화 연결</>}
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
        </>
    );
};

export { PetChatMessages };
