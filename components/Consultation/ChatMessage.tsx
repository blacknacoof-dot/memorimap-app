import React from 'react';
import { Message } from '../../types/consultation';
import { Bot, User, Star, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
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
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.text}</ReactMarkdown>
                    )}
                </div>
                {message.recommendation && (
                    <div className="mt-3 space-y-2">
                        {message.recommendation.map((company: FuneralCompany) => (
                            <div key={company.id} className="flex bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                                {/* Thumbnail */}
                                <div className="relative w-20 h-20 shrink-0 bg-gray-200">
                                    <img
                                        src={company.imageUrl || '/images/defaults/sangjo_default.jpg'}
                                        alt={company.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image';
                                        }}
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 p-2.5 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="font-bold text-gray-900 text-[13px] truncate">{company.name}</h4>
                                            <div className="flex items-center gap-0.5 text-yellow-500 shrink-0">
                                                <Star size={10} fill="currentColor" />
                                                <span className="text-[11px] font-bold">{company.rating}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-amber-600 font-medium">{company.priceRange}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const event = new CustomEvent('connectToPartner', { detail: company });
                                            window.dispatchEvent(event);
                                        }}
                                        className="self-end py-1 px-2.5 bg-gray-900 text-white rounded-lg text-[11px] font-bold hover:bg-black transition-colors flex items-center gap-0.5"
                                    >
                                        상담 연결 <ChevronRight size={11} />
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
