import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, Phone, FileText, ChevronRight, Check, Star, Shield, Info, ArrowLeft, MessageSquare, BookOpen, Clock, Calendar, User, Smartphone, ChevronDown } from 'lucide-react';
import { FuneralCompany } from '../../types';
import { ConsultationForm, QuickMenuBtn } from './BrandChatHelpers';
import { PetChatInterface } from './PetChatInterface';
import { sendMessageToGemini, ChatMessage as GeminiMessage } from '../../services/geminiService';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onBack: () => void; // To return to Maum-i
}

export const BrandChatInterface: React.FC<Props> = ({ company, onClose, onBack }) => {
    // Check if company is for Pet Funeral
    const isPetCompany = company.id.startsWith('pet_');

    if (isPetCompany) {
        return <PetChatInterface company={company} onClose={onClose} onBack={onBack} />;
    }

    const BRAND_CONFIG = {
        name: company.name,
        themeColor: isPetCompany ? "bg-[#78350F]" : "bg-[#005B50]", // Amber-900 (Brown) for Pets
        subColor: isPetCompany ? "bg-[#FFFBEB]" : "bg-[#E6F2F1]", // Amber-50
        accentColor: isPetCompany ? "text-[#78350F]" : "text-[#005B50]",
        logo: company.imageUrl || (isPetCompany ? "🐾" : "💎"),
        agentName: isPetCompany ? `${company.name} 펫 마스터` : `${company.name} AI`,
        description: company.description,
        emergencyContact: "1588-0000",
        products: isPetCompany ? [
            {
                id: 1,
                title: `${company.name} 베이직`,
                price: "200,000원",
                totalPrice: "200,000원",
                desc: "소중한 아이를 위한 기본 장례",
                features: ["개별 화장", "기본 유골함", "추모실 이용", "장례확인서 발급"]
            },
            {
                id: 2,
                title: `${company.name} 스탠다드`,
                price: "400,000원",
                totalPrice: "400,000원",
                desc: "가장 많이 선택하는 표준 장례",
                features: ["개별 화장", "고급 수의", "오동나무 관", "염습/입관식 진행"],
                badge: "BEST"
            },
            {
                id: 3,
                title: `${company.name} 프리미엄`,
                price: "800,000원",
                totalPrice: "800,000원",
                desc: "최고의 예우를 갖춘 VIP 장례",
                features: ["VIP 추모실", "최고급 수의/관", "장례 스냅 촬영", "메모리얼 스톤 할인"]
            }
        ] : [
            {
                id: 1,
                title: `${company.name} 실속형`,
                price: "월 30,000원",
                totalPrice: "3,600,000원",
                desc: "꼭 필요한 서비스만 담은 합리적인 선택",
                features: ["전문 장례지도사 2명", "접객 도우미 4명", "관내 리무진", "오동나무 관"]
            },
            {
                id: 2,
                title: `${company.name} 베스트`,
                price: "월 39,000원",
                totalPrice: "4,680,000원",
                desc: "가장 많은 고객이 선택한 대표 상품",
                features: ["전국 무료 이송", "리무진 왕복", "고급 수의", "도우미 6명"],
                badge: "BEST"
            },
            {
                id: 3,
                title: `${company.name} VIP`,
                price: "월 55,000원",
                totalPrice: "6,600,000원",
                desc: "최고의 예우를 위한 고품격 서비스",
                features: ["VIP 의전 팀장", "솔송나무 관", "전국 리무진 무제한", "추모 영상 제작"]
            }
        ]
    };

    const [messages, setMessages] = useState<any[]>([
        {
            id: 1,
            sender: 'ai',
            text: isPetCompany
                ? company.ai_welcome_message || `반갑습니다. 반려동물과의 아름다운 이별을 돕는 **${BRAND_CONFIG.name}**입니다.\n\n무엇을 도와드릴까요? 아이의 장례 절차나 비용 등 궁금한 점을 말씀해 주세요.`
                : company.ai_welcome_message || `반갑습니다. 품격 있는 이별을 준비하는 곳, **${BRAND_CONFIG.name} 공식 상담 채널**입니다.\n\n무엇을 도와드릴까요? 아래 메뉴를 선택하시거나 궁금한 점을 말씀해 주세요.`,
            type: 'text'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'phone' | 'chat'>('phone');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Integrated Gemini AI Response
    const handleAiResponse = async (userText: string) => {
        setIsTyping(true);
        setIsLoading(true);

        try {
            // Context history for Gemini
            const history: GeminiMessage[] = messages
                .filter(m => m.sender === 'user' || m.sender === 'ai')
                .map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    text: m.text,
                    timestamp: new Date()
                }));

            const response = await sendMessageToGemini(userText, history, company);

            setIsTyping(false);
            setIsLoading(false);

            // Add AI Text Response
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                text: response.text,
                type: 'text'
            }]);

            // Handle AI Actions
            if (response.action === 'RESERVE') {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'ai',
                        text: "상담 예약을 위해 간단한 정보를 입력해 주세요.",
                        type: 'action_request'
                    }]);
                    setIsFormOpen(true);
                    setFormMode('chat');
                }, 500);
            } else if (response.action === 'MAP') {
                // Simple Map Action Feedback
                // Assuming map view is handled externally or just text info
            } else if (response.action === 'CALL_MANAGER') {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'ai',
                        text: "담당자와 바로 연결해 드릴까요?",
                        type: 'action_request'
                    }]);
                }, 500);
            }

        } catch (error) {
            console.error(error);
            setIsTyping(false);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                text: "죄송합니다. 잠시 후 다시 시도해 주세요.",
                type: 'text'
            }]);
        }
    };

    const handleSend = (msgText?: string) => {
        const textToSend = msgText || input;
        if (!textToSend.trim()) return;

        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text: textToSend,
            type: 'text'
        }]);

        setInput('');
        handleAiResponse(textToSend);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            handleSend();
        }
    };

    const handleFormSubmit = (formData: any) => {
        setIsFormOpen(false);

        if (formMode === 'phone') {
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'system',
                text: `✅ [${isPetCompany ? '장례 상담 예약 완료' : '전화 상담 예약 완료'}] ${formData.name}님, 요청하신 시간에 연락드리겠습니다.`,
                type: 'text'
            }]);

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'ai',
                    text: isPetCompany
                        ? `접수가 완료되었습니다. 전문 반려동물 장례지도사에게 내용을 전달했습니다.\n요청 시간(**${formData.time}**)에 **${formData.phone}** 번호로 연락드리겠습니다.`
                        : `접수가 완료되었습니다. 담당 팀장님께 내용을 전달했습니다.\n요청 시간(**${formData.time}**)에 **${formData.phone}** 번호로 연락드리겠습니다.`,
                    type: 'text'
                }]);
            }, 1000);

        } else {
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'system',
                text: `✅ [정보 등록 완료] ${formData.name}님, 잠시만 기다려주세요.`,
                type: 'text'
            }]);

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'ai',
                    text: isPetCompany
                        ? `반갑습니다, **${formData.name}**님.\n**${formData.type}**에 대해 궁금하신 점을 말씀해 주세요.\n\n안내해 주신 번호(${formData.phone})로 상세 절차 안내문을 발송해 드렸습니다.`
                        : `반갑습니다, **${formData.name}**님.\n**${formData.type}**에 대해 궁금하신 점을 말씀해 주세요.\n\n입력해주신 연락처(${formData.phone})로 상품 안내서를 문자 발송해 드렸습니다.`,
                    type: 'text'
                }]);
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative font-sans">
            {/* Header */}
            <div className={`${BRAND_CONFIG.themeColor} p-4 flex items-center justify-between shadow-lg z-20 shrink-0`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-white/80 hover:text-white mr-1 active:scale-90 transition-transform">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner overflow-hidden">
                        {(BRAND_CONFIG.logo.startsWith('/') || BRAND_CONFIG.logo.startsWith('http')) ? (
                            <img src={BRAND_CONFIG.logo} alt="brand logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg">{BRAND_CONFIG.logo}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-bold text-white text-base tracking-tight">{BRAND_CONFIG.name}</h1>
                            <Check className="w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <p className="text-[10px] text-white/80 font-medium tracking-wide opacity-90">
                            공식 프리미엄 상담실
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onClose()}
                        className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
                    >
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
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>

                        {msg.sender === 'ai' && (
                            <div className={`w-8 h-8 ${BRAND_CONFIG.themeColor} rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1 shadow-md border-2 border-white`}>
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div className={`max-w-[85%] space-y-2`}>
                            {/* Text Bubble */}
                            {msg.text && (
                                <div
                                    className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm
                                        ${msg.sender === 'user'
                                            ? `${BRAND_CONFIG.themeColor} text-white rounded-tr-none shadow-md`
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
                                    {msg.data.map((product: any) => (
                                        <div key={product.id} className="snap-center min-w-[260px] w-[260px] bg-white rounded-2xl border border-gray-200 shadow-md flex-shrink-0 overflow-hidden group hover:border-[#005B50] transition-all relative">
                                            {product.badge && (
                                                <div className="absolute top-0 right-0 bg-[#005B50] text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl shadow-sm z-10">
                                                    {product.badge}
                                                </div>
                                            )}
                                            <div className={`h-1.5 ${BRAND_CONFIG.themeColor}`}></div>
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
                                                <div className={`w-6 h-6 rounded-full ${BRAND_CONFIG.themeColor} text-white flex items-center justify-center font-bold text-[10px]`}>1</div>
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
                                            onClick={() => {
                                                setFormMode('phone');
                                                setIsFormOpen(true);
                                            }}
                                            className={`flex items-center justify-center gap-2 ${BRAND_CONFIG.themeColor} text-white py-3 rounded-xl font-bold text-xs shadow-sm hover:brightness-110 transition-all`}
                                        >
                                            <Phone className="w-3.5 h-3.5" /> {isPetCompany ? '전화 상담' : '전화 상담'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFormMode('chat');
                                                setIsFormOpen(true);
                                            }}
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
                        <div className={`w-8 h-8 ${BRAND_CONFIG.themeColor} rounded-full flex-shrink-0 flex items-center justify-center mr-2 shadow-sm`}>
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Menu */}
            <div className="bg-white border-t border-gray-100 p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0 relative">
                <div className="grid grid-cols-4 gap-2 mb-2">
                    <QuickMenuBtn icon={<FileText className="w-5 h-5" />} label="상품 안내" onClick={() => handleSend("상품 종류 보여줘")} />
                    <QuickMenuBtn icon={<Star className="w-5 h-5" />} label="멤버십" onClick={() => handleSend("멤버십 혜택이 뭐야?")} />
                    <QuickMenuBtn icon={<BookOpen className="w-5 h-5" />} label="장례 절차" onClick={() => handleSend("장례 절차는 어떻게 돼?")} />
                    <QuickMenuBtn icon={<Clock className="w-5 h-5" />} label="상담 예약" onClick={() => handleSend("상담원 연결해줘")} active />
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-[#005B50]/30 focus-within:border-[#005B50] transition-all">
                    <input
                        type="text"
                        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                        placeholder="궁금한 내용을 입력하세요..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        className={`p-2 rounded-full transition-colors ${input.trim() ? `${BRAND_CONFIG.themeColor} text-white` : 'bg-gray-200 text-gray-400'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <ConsultationForm
                    company={company}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    mode={formMode}
                />
            )}
        </div>
    );
};
