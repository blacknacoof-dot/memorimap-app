import React from 'react';
import {
  Truck, Settings, LogOut, User,
  Menu, X, TrendingUp, Calendar, ClipboardList, Wallet,
} from 'lucide-react';
import { OperationsManagement } from './OperationsManagement';
import { FacilityInfoEditor } from './FacilityInfoEditor';
import { PartnerReservationsTab } from './PartnerReservationsTab';
import { PartnerRevenueTab } from './PartnerRevenueTab';
import { NotificationCenter } from '../NotificationCenter';
import { PartnerConsultationsTab } from './PartnerConsultationsTab';
import { useClerk } from '../../lib/auth';
import { usePartnerDashboard } from './usePartnerDashboard';
import { UpgradeBanner } from './UpgradeBanner';

interface PartnerDashboardProps {
  partnerId: string;
  onLogout: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partnerId, onLogout }) => {
  const { signOut } = useClerk();
  const {
    activeTab, setActiveTab,
    isSidebarOpen, setIsSidebarOpen,
    partnerName, facilityId,
    consultations, setConsultations,
    reservations, setReservations,
    subscription, payments,
    showPlanSelector, setShowPlanSelector,
    isSangjo,
    session,
    unreadConsultations, pendingReservations,
    monthlyConsultationCount,
  } = usePartnerDashboard(partnerId);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      onLogout();
    }
  };

  const menuItems: Array<{ id: string; label: string; icon: typeof ClipboardList; badge?: string }> = [
    { id: 'consultations', label: '상담 관리', icon: ClipboardList, badge: unreadConsultations > 0 ? `${unreadConsultations}` : undefined },
    { id: 'ops', label: '운영 현황', icon: Truck },
    { id: 'reservations', label: '예약 관리', icon: Calendar, badge: pendingReservations > 0 ? `${pendingReservations}` : undefined },
    { id: 'revenue', label: '요금제 관리', icon: Wallet },
    { id: 'settings', label: '회사 정보', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" data-debug="sangjo-admin-dashboard">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex-col z-50 hidden md:flex`}>
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
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              {isSidebarOpen && (
                <div className="flex-1 flex justify-between items-center text-sm font-bold">
                  {item.label}
                  {item.badge && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                      activeTab === item.id ? 'bg-white/20 text-white' : 'bg-blue-500 text-white animate-pulse'
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
            onClick={() => { void handleSignOut(); }}
            className="w-full mt-4 flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors text-sm font-bold"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] md:h-screen overflow-y-auto overflow-x-hidden" data-debug="sangjo-admin-content">
        {/* Mobile Tab Nav */}
        <div className="md:hidden flex overflow-x-auto scrollbar-hide bg-slate-900 px-2 py-2 gap-1" data-debug="sangjo-admin-topnav">
          <button
            onClick={onLogout}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap text-slate-400 hover:text-white"
          >
            ← 메인
          </button>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`flex-shrink-0 px-3 py-2 min-h-[44px] flex items-center rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              data-debug="sangjo-admin-tab"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { void handleSignOut(); }}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap text-red-400 hover:text-red-300"
          >
            로그아웃
          </button>
        </div>

        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between z-40" data-debug="sangjo-admin-header">
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

        {/* 업그레이드 배너 */}
        <UpgradeBanner
          subscription={subscription}
          monthlyConsultationCount={monthlyConsultationCount}
          onNavigate={() => {
            setActiveTab('revenue');
            setShowPlanSelector(true);
          }}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50" data-debug="sangjo-admin-scroll">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === 'consultations' && (
              <PartnerConsultationsTab
                consultations={consultations}
                setConsultations={setConsultations}
                session={session}
              />
            )}
            {activeTab === 'reservations' && (
              <PartnerReservationsTab
                reservations={reservations}
                setReservations={setReservations}
                session={session}
              />
            )}
            {activeTab === 'revenue' && facilityId && (
              <PartnerRevenueTab
                consultations={consultations}
                reservations={reservations}
                subscription={subscription}
                payments={payments}
                facilityId={facilityId}
                showPlanSelector={showPlanSelector}
                setShowPlanSelector={setShowPlanSelector}
              />
            )}
            {activeTab === 'ops' && facilityId && <OperationsManagement partnerId={facilityId} />}
            {activeTab === 'settings' && (
              facilityId ? (
                <FacilityInfoEditor facilityId={facilityId} isSangjo={isSangjo} />
              ) : (
                <div className="p-20 text-center text-slate-400">
                  <Settings className="mx-auto mb-3 opacity-50" size={48} />
                  <p className="text-sm font-medium">연결된 시설이 없습니다.</p>
                  <p className="text-xs mt-1">관리자에게 시설 연결을 요청해주세요.</p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
