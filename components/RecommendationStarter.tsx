import React, { useState } from 'react';
import { Bot, Building2, Trees, Dog, X } from 'lucide-react';

interface Props {
    onSelectIntent: (intent: 'funeral_home' | 'memorial_facility' | 'pet_funeral') => void;
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
    ] as const;

    return (
        <div className="fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom,0px))] right-3 z-[210] flex flex-col items-end gap-2 pointer-events-none" data-debug="ai-floating">
            {/* Menu Overlay */}
            {isOpen && (
                <div className="flex flex-col gap-2 mb-1 pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300" data-debug="ai-menu-overlay">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setIsOpen(false);
                                onSelectIntent(item.id);
                            }}
                            className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl shadow-lg border border-gray-100 hover:scale-105 active:scale-95 transition-all text-left w-56 group"
                            data-debug="ai-menu-card"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${item.color}`}>
                                <item.icon size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800 text-[13px] group-hover:text-primary transition-colors">
                                    {item.label}
                                </div>
                                <div className="text-[10px] text-gray-500">
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
                className={`pointer-events-auto relative group flex items-center justify-center w-11 h-11 rounded-xl shadow-xl transition-all duration-300 ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-[#fff9c4] hover:scale-110 border-2 border-orange-200'
                    }`}
                data-debug="ai-floating-button"
            >
                {isOpen ? (
                    <X size={18} className="text-white" />
                ) : (
                    <>
                        {/* Character Icon */}
                        <Bot size={22} className="text-orange-500" />

                        {/* Red Blinking Notification Dot */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                        </span>

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
