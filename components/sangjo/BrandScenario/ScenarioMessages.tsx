import React from 'react';
import { Bot, Check, ChevronRight } from 'lucide-react';
import { BotMessage } from './ScenarioData';

interface ScenarioMessagesProps {
    messages: BotMessage[];
    themeColor: string;
    onOptionClick: (action: string, label: string) => void;
    onProductConsult: (action: string, label: string) => void;
}

export const ScenarioMessages: React.FC<ScenarioMessagesProps> = ({ messages, themeColor, onOptionClick, onProductConsult }) => {
    return (
        <>
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    data-debug={msg.isUser ? 'sangjo-scenario-user-row' : 'sangjo-scenario-bot-row'}
                >
                    {!msg.isUser && (
                        <div
                            className={`w-8 h-8 ${themeColor} rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1 shadow-md border-2 border-white`}
                            data-debug="sangjo-scenario-bot-avatar"
                        >
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                    )}

                    <div className="max-w-[85%] space-y-2" data-debug="sangjo-scenario-message-content">
                        {/* Text Bubble */}
                        {msg.text && (
                            <div
                                className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm
                                    ${msg.isUser
                                        ? `${themeColor} text-white rounded-tr-none shadow-md`
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                    }`}
                                data-debug={msg.isUser ? 'sangjo-scenario-user-bubble' : 'sangjo-scenario-bot-bubble'}
                            >
                                {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                                    part.startsWith('**') && part.endsWith('**')
                                        ? <strong key={i}>{part.slice(2, -2)}</strong>
                                        : part
                                )}
                            </div>
                        )}

                        {/* Product Cards */}
                        {msg.products && (
                            <div className="flex gap-3 overflow-x-auto py-2 px-1 snap-x scrollbar-hide">
                                {msg.products.map((product) => (
                                    <div key={product.id} className="snap-center min-w-[250px] w-[250px] bg-white rounded-2xl border border-gray-200 shadow-md flex-shrink-0 overflow-hidden hover:border-[#005B50] transition-all relative">
                                        {product.badge && (
                                            <div className="absolute top-0 right-0 bg-[#005B50] text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl shadow-sm z-10">
                                                {product.badge}
                                            </div>
                                        )}
                                        <div className="h-1.5 bg-[#005B50]" />
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 text-base mb-1">{product.title}</h3>
                                            <p className="text-xs text-gray-500 mb-3 leading-tight">{product.desc}</p>

                                            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                                                {product.features.map((feat, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                                                        <Check className="w-3 h-3 text-[#005B50] flex-shrink-0 mt-0.5" />
                                                        {feat}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] text-gray-400 mb-0.5">총 납입금액</div>
                                                    <div className="font-bold text-lg text-[#005B50]">{product.totalPrice}</div>
                                                </div>
                                                <div className="text-xs text-gray-500 font-normal mb-1">({product.price})</div>
                                            </div>

                                            <button
                                                onClick={() => onProductConsult('FORM_CHAT', `${product.title} 가입 상담`)}
                                                className="w-full mt-3 py-2.5 rounded-lg border border-[#005B50] text-[#005B50] font-bold text-xs hover:bg-[#005B50] hover:text-white transition-all flex items-center justify-center gap-1"
                                            >
                                                가입 상담 <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Option Buttons */}
                        {msg.options && (
                            <div className="flex flex-wrap gap-2 mt-2" data-debug="sangjo-scenario-options">
                                {msg.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onOptionClick(opt.action, opt.label)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm
                                            ${opt.variant === 'primary'
                                                ? 'bg-[#005B50] text-white hover:bg-[#004a42]'
                                                : opt.variant === 'danger'
                                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#005B50] hover:text-[#005B50]'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
};
