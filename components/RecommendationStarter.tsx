import React, { useState } from 'react';
import { Bot, MapPin, Building2, Trees, Dog, MessageCircle, X, ChevronUp } from 'lucide-react';

interface Props {
    onSelectIntent: (intent: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general') => void;
}

export const RecommendationStarter: React.FC<Props> = ({ onSelectIntent }) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            id: 'funeral_home',
            label: '장례식장 찾기',
            icon: Building2,
            color: 'bg-slate-900',
            desc: '위치/비용 맞춤 추천'
        },
        {
            id: 'memorial_facility',
            label: '추모시설 찾기',
            icon: Trees,
            color: 'bg-emerald-600',
            desc: '봉안당/수목장 비교'
        },
        {
            id: 'pet_funeral',
            label: '동물장례',
            icon: Dog,
            color: 'bg-amber-500',
            desc: '반려동물 장례 상담'
        },
        {
            id: 'general',
            label: '기타/상담',
            icon: MessageCircle,
            color: 'bg-blue-500',
            desc: '무엇이든 물어보세요'
        }
    ] as const;

    return (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-4 pointer-events-none">
            {/* Menu Overlay */}
            {isOpen && (
                <div className="flex flex-col gap-3 mb-2 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setIsOpen(false);
                                onSelectIntent(item.id);
                            }}
                            className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 hover:scale-105 active:scale-95 transition-all text-left w-64 group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">
                                    {item.label}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                    {item.desc}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto relative group flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-primary hover:scale-110'
                    }`}
            >
                {isOpen ? (
                    <X size={28} className="text-white" />
                ) : (
                    <>
                        <Bot size={32} className="text-white animate-bounce-subtle" />
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />

                        {/* Tooltip Label */}
                        <div className="absolute right-20 bg-white px-4 py-2 rounded-xl shadow-lg border border-primary/20 whitespace-nowrap hidden group-hover:flex items-center gap-2 animate-in slide-in-from-right-2">
                            <span className="text-sm font-bold text-primary">AI 마음이</span>
                            <span className="text-xs text-gray-400">| 무엇을 도와드릴까요?</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
};
