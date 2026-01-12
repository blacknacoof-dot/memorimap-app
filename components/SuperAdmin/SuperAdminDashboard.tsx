import React, { useState } from 'react';
import {
    Building2, CheckCircle2, AlertCircle, Search,
    TrendingUp, Wallet, CreditCard, Users,
    Phone, ChevronRight, Bell, LogOut, Menu, X,
    FileText, UserCog, Settings, ShieldCheck,
    Lock, BellRing, MonitorStop, Percent
} from 'lucide-react';
import { PartnerAdmissions } from './PartnerAdmissions';
import { UserManagement } from './UserManagement';
import { FacilityManagement } from './FacilityManagement';
import { NoticeManager } from '../dashboard/super-admin/NoticeManager';
import { ConfirmModal } from '../../src/components/common/ConfirmModal';

/** [MOCK DATA] */
const MOCK_DATA = {
    kpi: {
        totalFacilities: 152,
        activeSubscriptions: 140,
        pendingRequests: 12,
        totalRevenue: "12,500,000",
        growth: 12.5,
    },
    facilities: [
        { id: 1, name: "하늘공원 추모관", tier: "Pro", status: "Active", expiry: "2026.12.31" },
        { id: 2, name: "그리움 수목장", tier: "Starter", status: "Active", expiry: "2026.06.30" },
        { id: 3, name: "평안 봉안당", tier: "Enterprise", status: "Pending", expiry: "-" },
        { id: 4, name: "서울 추모공원", tier: "Pro", status: "Active", expiry: "2026.09.15" },
        { id: 5, name: "경기 남부 장례식장", tier: "Starter", status: "Expiring", expiry: "2026.02.01" },
    ],
    transactions: [
        { id: 1, facility: "하늘공원", type: "구독 결제", amount: "55,000", time: "방금 전" },
        { id: 2, facility: "그리움 수목장", type: "예약 수수료", amount: "12,000", time: "1시간 전" },
        { id: 3, facility: "평안 봉안당", type: "구독 결제", amount: "55,000", time: "3시간 전" },
    ],
    leads: [
        { id: 1, name: "김태용", phone: "010-1234-5678", status: "new", time: "10분 전", type: "분양 문의" },
        { id: 2, name: "익명 고객", phone: "010-****-****", status: "new", time: "32분 전", type: "가격 문의" },
        { id: 3, name: "이영희", phone: "010-9876-5432", status: "read", time: "1시간 전", type: "방문 예약" },
        { id: 4, name: "박철수", phone: "010-5555-4444", status: "read", time: "어제", type: "상조 연계" },
        { id: 5, name: "최민수", phone: "010-1111-2222", status: "read", time: "어제", type: "기타" },
    ]
};

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
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase">운영 관리</div>
                    <nav className="space-y-1 px-2">
                        {[
                            { icon: ShieldCheck, label: '입점 승인 관리', id: 'admissions', testId: 'admissions-tab' },
                            { icon: Building2, label: '시설 통합 관리', id: 'facilities' },
                            { icon: Users, label: '회원/권한 관리', id: 'users' },
                            { icon: FileText, label: '공지사항 관리', id: 'notices' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                data-testid={item.testId}
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

/** [Settings] Admin Settings View */
const AdminSettings = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-blue-600" />
                    내 정보 수정
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">관리자 이름</label>
                        <input type="text" defaultValue="Super Admin" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">연락처</label>
                        <input type="tel" defaultValue="010-1234-5678" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    보안 설정
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">현재 비밀번호</label>
                        <input type="password" placeholder="********" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">새 비밀번호</label>
                        <input type="password" placeholder="새 비밀번호 입력" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <button className="w-full mt-2 bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                        비밀번호 변경
                    </button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-blue-600" />
                    알림 설정
                </h3>
                <div className="space-y-4">
                    {[
                        { label: '새 상담 접수 알림', desc: '새로운 고객 상담이 접수되면 알림을 받습니다.' },
                        { label: '결제 발생 알림', desc: '구독 또는 수수료 결제가 발생하면 알림을 받습니다.' },
                        { label: '입점 신청 알림', desc: '새로운 시설 입점 신청이 들어오면 알림을 받습니다.' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                                <p className="text-[10px] text-slate-400">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/** [Settings] System Settings View */
const SystemSettings = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Maintenance Mode */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MonitorStop className="w-5 h-5 text-red-500" />
                    서비스 운영 모드
                </h3>
                <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                    <div>
                        <p className="text-sm font-bold text-red-800">점검 모드 (Maintenance)</p>
                        <p className="text-[10px] text-red-600 mt-0.5">활성화 시 일반 사용자의 접속이 차단됩니다.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>
            </div>

            {/* Commission Settings */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-blue-600" />
                    수수료 및 정산 설정
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">기본 중개 수수료율 (%)</label>
                        <div className="relative">
                            <input type="number" defaultValue="3.5" className="w-full text-sm p-2 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                            <span className="absolute right-3 top-2 text-sm text-slate-400">%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">모든 예약 및 결제 건에 적용되는 기본 수수료입니다.</p>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        설정 저장
                    </button>
                </div>
            </div>
        </div>
    );
};

/** [Tab A] Subscription Manager */
const SubscriptionManager = () => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <Building2 className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-lg font-bold text-slate-800">{MOCK_DATA.kpi.totalFacilities}</span>
                    <span className="text-[10px] text-slate-500">전체 시설</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                    <span className="text-lg font-bold text-slate-800">{MOCK_DATA.kpi.activeSubscriptions}</span>
                    <span className="text-[10px] text-slate-500">활성 구독</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-5 h-5 text-orange-500 mb-1" />
                    <span className="text-lg font-bold text-slate-800">{MOCK_DATA.kpi.pendingRequests}</span>
                    <span className="text-[10px] text-slate-500">승인 대기</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-semibold text-slate-700">구독 시설 목록</h3>
                    <Search className="w-4 h-4 text-slate-400" />
                </div>
                <div className="divide-y divide-slate-100">
                    {MOCK_DATA.facilities.map((fac) => (
                        <div key={fac.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-800">{fac.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${fac.tier === 'Pro' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        fac.tier === 'Enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                        {fac.tier}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-0.5">만료: {fac.expiry}</span>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 px-3 py-1 text-xs border border-slate-100 rounded bg-white">
                                관리
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/** [Tab B] Revenue Analytics */
const RevenueAnalytics = () => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-blue-100 text-xs font-medium mb-1">1월 총 매출</p>
                    <h2 className="text-2xl font-bold tracking-tight">₩ {MOCK_DATA.kpi.totalRevenue}</h2>
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center backdrop-blur-sm">
                            <TrendingUp className="w-3 h-3 mr-1" /> +{MOCK_DATA.kpi.growth}%
                        </span>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full relative z-10 hidden sm:block">
                    <Wallet className="w-6 h-6 text-white" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="text-[10px] text-slate-400">구독료</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">₩ 8.0M</p>
                </div>

                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] text-slate-400">수수료</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">₩ 4.5M</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">최근 거래 내역</h3>
                <div className="space-y-3">
                    {MOCK_DATA.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-xs">{tx.facility}</p>
                                    <p className="text-[10px] text-slate-400">{tx.time}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-800 text-sm">+{tx.amount}</p>
                                <p className="text-[10px] text-slate-400">{tx.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/** [Tab C] Consultation Leads */
const AdminLeadsView = () => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">상담 신청 관리</h3>
                </div>
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                    2 New
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {MOCK_DATA.leads.map((lead) => (
                    <div key={lead.id} className="group p-3 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${lead.status === 'new' ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-300'}`} />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${lead.status === 'new' ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {lead.name}
                                    </span>
                                    <span className="text-xs text-slate-400 tracking-tight">
                                        {lead.phone}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                    {lead.type}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {lead.time}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/** [Main Container] */
export default function SuperAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'subs' | 'revenue' | 'leads' | 'admissions' | 'facilities' | 'users' | 'notices'>('leads');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
            {/* Side Menu Drawer Component */}
            <SideMenuDrawer
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(tab) => setActiveTab(tab as any)}
            />

            {/* 1. Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Menu Button (Trigger Drawer) */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-slate-900 leading-none">Super Admin</h1>
                            <p className="text-[10px] text-slate-500 mt-0.5">master@memorimap.com</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-md mx-auto px-0">
                    <div className="w-full grid grid-cols-3 border-b border-slate-100">
                        {[
                            { id: 'subs', label: '구독 관리', icon: Building2 },
                            { id: 'revenue', label: '매출 통계', icon: TrendingUp },
                            { id: 'leads', label: '상담 관리', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium border-b-2 transition-all ${activeTab === tab.id || (activeTab !== 'subs' && activeTab !== 'revenue' && activeTab !== 'leads' && tab.id === 'leads') // Keep leads active visibly if in sub-menu? No, maybe just standard.
                                    ? activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 2. Main Content Area */}
            <main className="max-w-md mx-auto p-4">
                {activeTab === 'subs' && <SubscriptionManager />}
                {activeTab === 'revenue' && <RevenueAnalytics />}
                {activeTab === 'leads' && <AdminLeadsView />}

                {/* Render Management Components */}
                {activeTab === 'admissions' && <PartnerAdmissions />}
                {activeTab === 'facilities' && <FacilityManagement />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'notices' && <NoticeManager />}
                <ConfirmModal />
            </main>
        </div>
    );
}
