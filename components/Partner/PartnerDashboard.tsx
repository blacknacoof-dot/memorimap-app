import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, MessageSquare, Truck,
    Settings, LogOut, Bell, User,
    Menu, X, Sparkles, TrendingUp, ChevronRight
} from 'lucide-react';
import { LiveConsultation } from './LiveConsultation';
import { OperationsManagement } from './OperationsManagement';
import { AIConfiguration } from './AIConfiguration';
import { NotificationCenter } from '../NotificationCenter';
import { supabase } from '../../lib/supabaseClient';

interface PartnerDashboardProps {
    partnerId: string;
    onLogout: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partnerId, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'ops' | 'ai_config' | 'settings'>('chat');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [partnerName, setPartnerName] = useState('상조 파트너');

    useEffect(() => {
        const fetchPartner = async () => {
            const { data } = await supabase.from('partners').select('name').eq('id', partnerId).single();
            if (data) setPartnerName(data.name);
        };
        fetchPartner();
    }, [partnerId]);

    const menuItems = [
        { id: 'chat', label: '실시간 상담', icon: MessageSquare, badge: 'LIVE' },
        { id: 'ops', label: '운영 현황', icon: Truck },
        { id: 'ai_config', label: 'AI 시나리오', icon: Sparkles },
        { id: 'settings', label: '회사 정보', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-50`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                        <TrendingUp className="text-white w-5 h-5" />
                    </div>
                    {isSidebarOpen && <span className="font-black text-white text-lg tracking-tighter">Memorimap</span>}
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                            {isSidebarOpen && (
                                <div className="flex-1 flex justify-between items-center text-sm font-bold">
                                    {item.label}
                                    {item.badge && (
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-blue-500 text-white animate-pulse'
                                            }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    {isSidebarOpen ? (
                        <div className="bg-slate-800/50 p-4 rounded-3xl flex items-center gap-3 border border-slate-700/50">
                            <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center">
                                <User className="text-slate-400" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white truncate">{partnerName}</p>
                                <p className="text-[10px] text-slate-500 font-bold">Premium Partner</p>
                            </div>
                        </div>
                    ) : (
                        <button className="w-full flex justify-center py-2 text-slate-500 hover:text-white"><User size={20} /></button>
                    )}
                    <button
                        onClick={onLogout}
                        className="w-full mt-4 flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors text-sm font-bold"
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span>로그아웃</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="font-black text-slate-800 tracking-tight">
                            {menuItems.find(i => i.id === activeTab)?.label || '파트너 센터'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-blue-100 shadow-sm shadow-blue-500/5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            System Online
                        </div>
                        <NotificationCenter />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
                    <div className="max-w-[1400px] mx-auto">
                        {activeTab === 'chat' && <LiveConsultation partnerId={partnerId} />}
                        {activeTab === 'ops' && <OperationsManagement partnerId={partnerId} />}
                        {activeTab === 'ai_config' && <AIConfiguration partnerId={partnerId} />}
                        {activeTab === 'settings' && (
                            <div className="p-20 text-center text-slate-400 italic">회사 기본 정보 설정 (추후 구현)</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
