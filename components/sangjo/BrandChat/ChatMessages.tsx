import React from 'react';
import { Bot, Check, ChevronRight, BookOpen, Phone, MessageSquare } from 'lucide-react';

export interface ProductData {
    id: number;
    title: string;
    price: string;
    totalPrice: string;
    desc: string;
    features: string[];
    badge?: string;
}

export interface MessageType {
    id: number;
    sender: string;
    text: string;
    type?: string;
    data?: ProductData[];
}

interface ChatMessagesProps {
    messages: MessageType[];
    isTyping: boolean;
    themeColor: string;
    isPetCompany: boolean;
    onFormOpen: (mode: 'phone' | 'chat') => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isTyping, themeColor, isPetCompany, onFormOpen }) => {
    return (
        <>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>

                    {msg.sender === 'ai' && (
                        <div className={`w-8 h-8 ${themeColor} rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1 shadow-md border-2 border-white`}>
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                    )}

                    <div className={`max-w-[85%] space-y-2`}>
                        {/* Text Bubble */}
                        {msg.text && (
                            <div
                                className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm
                                    ${msg.sender === 'user'
                                        ? `${themeColor} text-white rounded-tr-none shadow-md`
                                        : msg.sender === 'system'
                                            ? 'bg-gray-100 text-gray-600 border border-gray-200 w-full text-center py-2 text-xs font-medium'
                                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        )}

                        {/* Product Carousel */}
                        {msg.type === 'product_carousel' && (
                            <div className="flex gap-3 overflow-x-auto py-2 px-1 snap-x scrollbar-hide -ml-10 w-[120%] sm:w-[110%] sm:ml-0 pr-4">
                                {msg.data?.map((product) => (
                                    <div key={product.id} className="snap-center min-w-[260px] w-[260px] bg-white rounded-2xl border border-gray-200 shadow-md flex-shrink-0 overflow-hidden group hover:border-[#005B50] transition-all relative">
                                        {product.badge && (
                                            <div className="absolute top-0 right-0 bg-[#005B50] text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl shadow-sm z-10">
                                                {product.badge}
                                            </div>
                                        )}
                                        <div className={`h-1.5 ${themeColor}`}></div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 text-lg mb-1">{product.title}</h3>
                                            <p className="text-xs text-gray-500 mb-3 h-4 leading-tight">{product.desc}</p>

                                            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                                                {product.features.map((feat: string, i: number) => (
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

                                            <button className={`w-full mt-3 py-2.5 rounded-lg border border-[#005B50] text-[#005B50] font-bold text-xs hover:bg-[#005B50] hover:text-white transition-all flex items-center justify-center gap-1`}>
                                                자세히 보기 <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Process Guide */}
                        {msg.type === 'process_guide' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-[280px]">
                                <div className="bg-gray-50 p-3 border-b border-gray-100 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-bold text-gray-700">3일장 절차 안내</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-6 h-6 rounded-full ${themeColor} text-white flex items-center justify-center font-bold text-[10px]`}>1</div>
                                            <div className="w-0.5 h-full bg-gray-200"></div>
                                        </div>
                                        <div className="pb-2">
                                            <div className="font-bold text-sm text-gray-800">임종 및 운구</div>
                                            <div className="text-xs text-gray-500 mt-0.5">고인 이송, 빈소 설치</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-6 h-6 rounded-full bg-white border border-[#005B50] text-[#005B50] flex items-center justify-center font-bold text-[10px]`}>2</div>
                                            <div className="w-0.5 h-full bg-gray-200"></div>
                                        </div>
                                        <div className="pb-2">
                                            <div className="font-bold text-sm text-gray-800">입관 및 성복</div>
                                            <div className="text-xs text-gray-500 mt-0.5">염습, 입관식 진행</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">3</div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-800">발인 및 장지</div>
                                            <div className="text-xs text-gray-500 mt-0.5">발인식, 화장/매장</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Request Card */}
                        {msg.type === 'action_request' && (
                            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${isPetCompany ? 'bg-purple-50' : 'bg-green-50'}`}>
                                        <Phone className={`w-5 h-5 ${isPetCompany ? 'text-purple-600' : 'text-green-600'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">상담 예약 센터</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {isPetCompany
                                                ? <>반려동물 장례지도사가 10분 내로<br />직접 전화를 드립니다.</>
                                                : <>전문 장례지도사가 10분 내로<br />직접 전화를 드립니다.</>
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => onFormOpen('phone')}
                                        className={`flex items-center justify-center gap-2 ${themeColor} text-white py-3 rounded-xl font-bold text-xs shadow-sm hover:brightness-110 transition-all`}
                                    >
                                        <Phone className="w-3.5 h-3.5" /> 전화 상담
                                    </button>
                                    <button
                                        onClick={() => onFormOpen('chat')}
                                        className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" /> 채팅 상담
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex justify-start animate-pulse">
                    <div className={`w-8 h-8 ${themeColor} rounded-full flex-shrink-0 flex items-center justify-center mr-2 shadow-sm`}>
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            )}
        </>
    );
};
