import React from 'react';
import { Message } from '../../types/consultation';
import { Bot, User, Star, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FuneralCompany } from '../../types';

interface Props {
    message: Message;
    isStreaming?: boolean;
}

export const ChatMessage: React.FC<Props> = ({ message, isStreaming }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} className="text-primary" />
                </div>
            )}

            <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${isUser
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white border text-gray-800 rounded-tl-none'
                    }`}
            >
                <div className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-1 prose-li:my-0">
                    {isUser ? (
                        message.text
                    ) : (
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                    )}
                </div>
                {message.recommendation && (
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
                        {message.recommendation.map((company: FuneralCompany) => (
                            <div key={company.id} className="snap-center min-w-[220px] bg-white rounded-xl border border-gray-200 shadow-sm flex-shrink-0 overflow-hidden">
                                <div className="h-12 bg-gray-50 px-3 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{company.name}</h3>
                                    </div>
                                    <div className="flex items-center text-yellow-500 text-xs font-bold">
                                        <Star size={10} fill="currentColor" className="mr-0.5" />
                                        {company.rating}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">{company.description}</p>
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <span className="font-bold text-primary">{company.priceRange}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Dispatch native event to parent
                                            const event = new CustomEvent('connectToPartner', { detail: company });
                                            window.dispatchEvent(event);
                                        }}
                                        className="w-full bg-gray-900 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-black transition-colors"
                                    >
                                        상담 연결 <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse"></span>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-1">
                    <User size={16} className="text-gray-500" />
                </div>
            )}
        </div>
    );
};
