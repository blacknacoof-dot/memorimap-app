import React, { useState } from 'react';
import { useUser } from '../../lib/auth';
import {
    Building2, TrendingUp, Users,
    ChevronRight, LogOut, Menu, X,
    FileText, Settings, ShieldCheck,
    MonitorStop, MessageSquare,
    CreditCard, History, UserCog
} from 'lucide-react';
import { PartnerManagement } from './PartnerManagement';
import { PartnerAdmissions } from './PartnerAdmissions';
import { ContractMonitoring } from './ContractMonitoring';
import { RevenueManagement } from './RevenueManagement';
import { NoticeManagement } from './NoticeManagement';
import { useLeads } from '../../hooks/useLeads';
import { UserManagement } from './UserManagement';
import { FacilityManagement } from './FacilityManagement';
import { NotificationCenter } from '../NotificationCenter';
import { AdminLogsView } from './AdminLogsView';
import { AdminCommunication } from '../admin/AdminCommunication';
import { AdminSettings } from './AdminSettings';
import { SystemSettings } from './SystemSettings';
import { SubscriptionManager } from './SubscriptionManager';

// MOCK_DATA removed. Using real hooks.

/** [Component] Side Menu Drawer (숨겨진 메뉴들) */
const SideMenuDrawer = ({ isOpen, onClose, onNavigate }: { isOpen: boolean; onClose: () => void, onNavigate: (tab: string) => void }) => {
    if (!isOpen) return null;

    const handleNavigation = (tab: string) => {
        onNavigate(tab);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Background Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 text-lg">전체 메뉴</h2>
                    <button onClick={onClose} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase">운영 관리</div>
                    <nav className="space-y-1 px-2">
                        {[
                            { icon: ShieldCheck, label: '상조 파트너 관리', id: 'admissions' },
                            { icon: MonitorStop, label: '실시간 통합 관제', id: 'monitoring' },
                            { icon: Building2, label: '시설 통합 관리', id: 'facilities' },
                            { icon: CreditCard, label: '구독 현황', id: 'subs' },
                            { icon: Users, label: '회원/권한 관리', id: 'users' },
                            { icon: FileText, label: '공지사항 관리', id: 'notices' },
                            { icon: History, label: '시스템 활동 로그', id: 'logs' },
                            { icon: MessageSquare, label: '소통 센터', id: 'communication' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase">시스템</div>
                    <nav className="space-y-1 px-2">
                        <button
                            onClick={() => handleNavigation('admin_settings')}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <UserCog className="w-5 h-5" />
                            <span>관리자 설정</span>
                        </button>
                        <button
                            onClick={() => handleNavigation('system_settings')}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                            <span>환경 설정</span>
                        </button>
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-400 text-center">Memorimap Admin v1.0</p>
                </div>
            </div>
        </div>
    );
};

// AdminSettings, SystemSettings, SubscriptionManager → extracted to separate files

/** [Tab C] Consultation Leads */
const AdminLeadsView = () => {
    const { leads, loading } = useLeads();

    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    const newLeadsCount = leads.filter(l => l.status === 'new').length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">상담 신청 관리</h3>
                </div>
                {newLeadsCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                        {newLeadsCount} New
                    </span>
                )}
            </div>

            <div className="divide-y divide-slate-100 h-96 overflow-y-auto">
                {leads.map((lead) => (
                    <div key={lead.id} className="group p-3 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${lead.status === 'new' ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-300'}`} />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${lead.status === 'new' ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {lead.contact_name || '고객'}
                                    </span>
                                    <span className="text-xs text-slate-400 tracking-tight">
                                        {lead.contact_phone}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    {lead.category}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                    </div>
                ))}
                {leads.length === 0 && (
                    <div className="p-10 text-center text-gray-400 text-sm">접수된 상담이 없습니다.</div>
                )}
            </div>
        </div>
    );
};

/** [Main Container] */
export default function SuperAdminDashboard({ onBack }: { onBack?: () => void }) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'subs' | 'revenue' | 'leads' | 'admissions' | 'facilities' | 'users' | 'notices' | 'logs' | 'communication' | 'admin_settings' | 'system_settings' | 'monitoring'>('monitoring');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [facilitySearchTerm, setFacilitySearchTerm] = useState('');

    return (
        <div className="min-h-[100dvh] bg-slate-50 pb-20 font-sans relative">
            {/* Side Menu Drawer Component */}
            <SideMenuDrawer
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(tab) => setActiveTab(tab as typeof activeTab)}
            />

            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Menu Button (Trigger Drawer) */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1.5 md:p-2 -ml-1 md:-ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <Menu className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        <div className="flex flex-col">
                            <h1 className="text-sm md:text-base font-black text-slate-900 leading-none tracking-tight">Admin</h1>
                            <p className="hidden md:block text-[11px] font-medium text-slate-400 mt-1">{user?.primaryEmailAddress?.emailAddress || 'User'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <NotificationCenter />
                        <div className="h-5 w-[1px] bg-slate-200 mx-0.5 md:mx-1"></div>
                        <button
                            onClick={() => onBack?.()}
                            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">나가기</span>
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-5xl mx-auto px-2 md:px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-4 md:gap-6 min-w-max">
                        {[
                            { id: 'monitoring', label: '통합 관제', icon: MonitorStop },
                            { id: 'admissions', label: '파트너 관리', icon: ShieldCheck },
                            { id: 'revenue', label: '매출 분석', icon: TrendingUp },
                            { id: 'leads', label: '상담 관리', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex items-center gap-1.5 md:gap-2 py-3 md:py-4 px-1 md:px-2 text-[13px] md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 2. Main Content Area */}
            <main className="max-w-5xl mx-auto p-4 md:p-6">
                {activeTab === 'subs' && (
                    <SubscriptionManager
                        onManage={(name) => {
                            setFacilitySearchTerm(name);
                            setActiveTab('facilities');
                        }}
                    />
                )}
                {activeTab === 'monitoring' && <ContractMonitoring />}
                {activeTab === 'revenue' && <RevenueManagement />}
                {activeTab === 'leads' && <AdminLeadsView />}

                {/* Render Management Components */}
                {activeTab === 'admissions' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-amber-500" size={22} />
                                신규 입점 신청
                            </h2>
                            <PartnerAdmissions />
                        </div>
                        <div className="border-t border-slate-200 pt-8">
                            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                                <Building2 className="text-blue-500" size={22} />
                                기존 파트너 관리
                            </h2>
                            <PartnerManagement />
                        </div>
                    </div>
                )}
                {activeTab === 'facilities' && (
                    <FacilityManagement
                        initialSearch={facilitySearchTerm}
                        onClearSearch={() => setFacilitySearchTerm('')}
                    />
                )}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'notices' && <NoticeManagement />}
                {activeTab === 'logs' && <AdminLogsView />}
                {activeTab === 'communication' && <AdminCommunication />}
                {activeTab === 'admin_settings' && <AdminSettings />}
                {activeTab === 'system_settings' && <SystemSettings />}
            </main>
        </div>
    );
}
