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
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x scrollbar-hide">
                        {message.recommendation.map((company: FuneralCompany) => (
                            <div key={company.id} className="snap-center min-w-[260px] w-[260px] bg-white rounded-xl border border-gray-200 shadow-lg flex-shrink-0 overflow-hidden flex flex-col">
                                {/* Representative Image */}
                                <div className="relative h-32 bg-gray-100">
                                    <img
                                        src={company.imageUrl || '/images/defaults/sangjo_default.jpg'}
                                        alt={company.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=No+Image';
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Star size={10} className="text-yellow-400 fill-current" />
                                        <span className="text-xs font-bold text-white">{company.rating}</span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{company.name}</h3>

                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2.5em]">
                                        {company.description}
                                    </p>

                                    <div className="mt-auto pt-3 border-t border-gray-100">
                                        {/* Tagline or Price Range */}
                                        <div className="mb-3">
                                            <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-sm">
                                                {company.priceRange}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const event = new CustomEvent('connectToPartner', { detail: company });
                                                window.dispatchEvent(event);
                                            }}
                                            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
                                        >
                                            상담 연결 <ChevronRight size={14} />
                                        </button>
                                    </div>
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
