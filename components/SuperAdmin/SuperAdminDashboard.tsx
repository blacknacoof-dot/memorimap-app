import React, { useState } from 'react';
import { useUser } from '../../lib/auth';
import {
    Building2, TrendingUp, Users,
    ArrowLeft, Menu, X, FileText,
    Settings, ShieldCheck,
    MonitorStop, MessageSquare,
    CreditCard, History, UserCog
} from 'lucide-react';
import { useConfirmModal } from '../../src/components/common/ConfirmModal';
import { PartnerManagement } from './PartnerManagement';
import { PartnerAdmissions } from './PartnerAdmissions';
import { ContractMonitoring } from './ContractMonitoring';
import { RevenueManagement } from './RevenueManagement';
import { NoticeManagement } from './NoticeManagement';
import { AdminLeadsView } from './AdminLeadsView';
import { UserManagement } from './UserManagement';
import { FacilityManagement } from './FacilityManagement';
import { NotificationCenter } from '../NotificationCenter';
import { AdminLogsView } from './AdminLogsView';
import { AdminCommunication } from '../admin/AdminCommunication';
import { AdminSettings } from './AdminSettings';
import { SystemSettings } from './SystemSettings';
import { SubscriptionManager } from './SubscriptionManager';
import { PersonalSubscriptionManager } from './PersonalSubscriptionManager';
import { SuperAdminGuard } from './SuperAdminGuard';
import { useLocation, useNavigate } from 'react-router-dom';

// MOCK_DATA removed. Using real hooks.

/** [Component] Side Menu Drawer (숨겨진 메뉴들) */
const SideMenuDrawer = ({ isOpen, onClose, onNavigate }: { isOpen: boolean; onClose: () => void, onNavigate: (tab: string) => void }) => {
    if (!isOpen) return null;

    const handleNavigation = (tab: string) => {
        onNavigate(tab);
        onClose();
    };
    const resolveTabSearch = () => {
        if (location.search) return location.search;
        if (typeof window === 'undefined') return '';
        const hashQueryIndex = window.location.hash.indexOf('?');
        return hashQueryIndex >= 0 ? window.location.hash.slice(hashQueryIndex) : '';
    };

    return (
        <div className="fixed inset-0 z-[150] flex">
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
                            { icon: CreditCard, label: '사업자 구독', id: 'subs' },
                            { icon: UserCog, label: '개인 구독', id: 'personal_subs' },
                            { icon: Users, label: '회원/권한 관리', id: 'users' },
                            { icon: FileText, label: '공지사항 관리', id: 'notices' },
                            { icon: History, label: '시스템 활동 로그', id: 'logs' },
                            { icon: MessageSquare, label: '소통 센터', id: 'communication' },
                        ].map((item) => (
                        <button
                            key={item.id}
                            data-testid={`super-admin-menu-${item.id}`}
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
                            data-testid="super-admin-menu-admin_settings"
                            onClick={() => handleNavigation('admin_settings')}
                            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            <UserCog className="w-5 h-5" />
                            <span>관리자 설정</span>
                        </button>
                        <button
                            data-testid="super-admin-menu-system_settings"
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

/** [Main Container] */
export default function SuperAdminDashboard({ onBack }: { onBack?: () => void }) {
    return (
        <SuperAdminGuard onBack={onBack}>
            <SuperAdminDashboardInner onBack={onBack} />
        </SuperAdminGuard>
    );
}

function SuperAdminDashboardInner({ onBack }: { onBack?: () => void }) {
    const { user } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    type TabId =
        | 'subs'
        | 'personal_subs'
        | 'revenue'
        | 'leads'
        | 'admissions'
        | 'facilities'
        | 'users'
        | 'notices'
        | 'logs'
        | 'communication'
        | 'admin_settings'
        | 'system_settings'
        | 'monitoring';
    const parseTabFromSearch = (search: string): TabId | null => {
        const tab = new URLSearchParams(search).get('tab');
        if (tab === 'subs') return 'subs';
        if (tab === 'personal_subs') return 'personal_subs';
        if (tab === 'revenue') return 'revenue';
        if (tab === 'leads') return 'leads';
        if (tab === 'admissions') return 'admissions';
        if (tab === 'facilities') return 'facilities';
        if (tab === 'users') return 'users';
        if (tab === 'notices') return 'notices';
        if (tab === 'logs') return 'logs';
        if (tab === 'communication') return 'communication';
        if (tab === 'admin_settings') return 'admin_settings';
        if (tab === 'system_settings') return 'system_settings';
        if (tab === 'monitoring') return 'monitoring';
        return null;
    };
    // Derive activeTab purely from URL — URL is the single source of truth.
    // This eliminates the need for useEffect+setState (react-hooks/set-state-in-effect)
    // and avoids ref access during render (react-hooks/refs).
    // Tab switching updates the URL via navigate(), which triggers a re-render automatically.
    const resolveTabSearch = () => {
        if (location.search) return location.search;
        if (typeof window === 'undefined') return '';
        const hashQueryIndex = window.location.hash.indexOf('?');
        return hashQueryIndex >= 0 ? window.location.hash.slice(hashQueryIndex) : '';
    };
    const resolvedTabSearch = resolveTabSearch();
    const activeTab: TabId = parseTabFromSearch(resolvedTabSearch) ?? 'monitoring';

    /** Switch the active tab by updating the URL search param (replace in history). */
    const switchTab = (tab: TabId) => {
        navigate({ search: tab !== 'monitoring' ? `?tab=${tab}` : '' }, { replace: true });
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
    const [communicationFilter, setCommunicationFilter] = useState('');

    const handleNavigateCommunication = (partnerName: string) => {
        setCommunicationFilter(partnerName);
        switchTab('communication');
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 pb-20 font-sans relative">
            {/* Side Menu Drawer Component */}
            <SideMenuDrawer
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(tab) => {
                    if (tab === 'communication') setCommunicationFilter('');
                    switchTab(tab as TabId);
                }}
            />

            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Menu Button (Trigger Drawer) */}
                        <button
                            data-testid="super-admin-open-menu"
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
                            onClick={() => {
                                useConfirmModal.getState().close();
                                onBack?.();
                            }}
                            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all text-xs font-bold"
                        >
                            <ArrowLeft className="w-4 h-4" />
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
                            { id: 'leads', label: '상담 리드', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id as TabId)}
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
                            switchTab('facilities');
                        }}
                    />
                )}
                {activeTab === 'personal_subs' && <PersonalSubscriptionManager />}
                {activeTab === 'monitoring' && <ContractMonitoring onNavigateCommunication={handleNavigateCommunication} />}
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
                {activeTab === 'communication' && <AdminCommunication initialFilter={communicationFilter} />}
                {activeTab === 'admin_settings' && <AdminSettings />}
                {activeTab === 'system_settings' && <SystemSettings />}
            </main>
        </div>
    );
}
