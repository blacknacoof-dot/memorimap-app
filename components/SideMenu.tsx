import React from 'react';
import {
  X,
  User,
  Calendar,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bell,
  BookOpen,
  LogIn,
  Building2,
  ClipboardCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ViewState } from '../types';
import { confirmAsync } from '../src/components/common/ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  reservationCount: number;
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  userRole?: string;
  onLogin: () => void;
  onLogout: () => void;
}

export const SideMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  reservationCount,
  isLoggedIn,
  user,
  userRole,
  onLogin,
  onLogout,
}) => {
  const handleProtectedAction = async (action: () => void) => {
    if (!isLoggedIn) {
      if (await confirmAsync('로그인이 필요한 서비스입니다. 로그인하시겠습니까?')) {
        onLogin();
      }
      return;
    }

    action();
    onClose();
  };

  const handleNav = (view: ViewState) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[320] bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 left-0 z-[330] flex w-[280px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative bg-primary px-6 pb-12 pt-12 text-white transition-all">
          <button
            type="button"
            onClick={onClose}
            data-testid="sidemenu-close-button"
            className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>

          {isLoggedIn && user ? (
            <>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm">
                  <User size={28} className="text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate break-keep whitespace-nowrap font-bold text-xl">
                    {user.name} 님
                  </h2>
                  <p className="truncate text-xs text-blue-100">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNavigate(ViewState.MY_PAGE);
                  onClose();
                }}
                data-testid="sidemenu-profile-button"
                className="flex items-center gap-1 rounded-full bg-black/20 px-4 py-2 text-sm transition-colors hover:bg-black/30"
              >
                내 정보 관리
                <ChevronRight size={12} />
              </button>

              {(userRole === 'facility_admin' || userRole === 'facility_manager' || userRole === 'super_admin') && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(ViewState.FACILITY_ADMIN);
                    onClose();
                  }}
                  className="mt-2 flex items-center gap-1 rounded-full bg-amber-500 px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-amber-600"
                >
                  시설 관리자
                  <ChevronRight size={12} />
                </button>
              )}

              {(userRole === 'sangjo_hq_admin' || userRole === 'sangjo_branch_admin' || userRole === 'super_admin') && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(ViewState.SANGJO_DASHBOARD);
                    onClose();
                  }}
                  className="mt-2 flex items-center gap-1 rounded-full bg-indigo-500 px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-indigo-600"
                >
                  상조 대시보드
                  <ChevronRight size={12} />
                </button>
              )}

              {userRole === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(ViewState.SUPER_ADMIN);
                    onClose();
                  }}
                  data-testid="sidemenu-superadmin-button"
                  className="mt-2 flex items-center gap-1 rounded-full bg-purple-600 px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-purple-700"
                >
                  슈퍼 관리자 콘트롤 센터
                  <ChevronRight size={12} />
                </button>
              )}
            </>
          ) : (
            <div className="py-2">
              <h2 className="mb-2 font-bold text-xl">환영합니다</h2>
              <p className="mb-6 text-xs text-blue-100">
                로그인하고 예약 내역과
                <br />
                관심 시설을 확인해보세요.
              </p>
              <button
                type="button"
                onClick={onLogin}
                data-testid="sidemenu-login-button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 font-bold text-primary shadow-lg transition-transform active:scale-95"
              >
                <LogIn size={18} />
                로그인 / 회원가입
              </button>
            </div>
          )}
        </div>

        <div className="relative z-10 -mt-8 mb-6 px-4">
          <div className="flex items-center justify-around rounded-xl border bg-white p-4 shadow-lg">
            <button
              type="button"
              onClick={() => handleProtectedAction(() => onNavigate(ViewState.MY_PAGE))}
              className="group relative flex flex-1 flex-col items-center gap-1 border-r border-gray-100"
            >
              <div className="relative">
                <Calendar
                  className={`transition-transform group-hover:scale-110 ${
                    isLoggedIn ? 'text-primary' : 'text-gray-400'
                  }`}
                  size={24}
                />
                {isLoggedIn && reservationCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                    {reservationCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-xs font-medium text-gray-600">예약현황</span>
            </button>

            <button
              type="button"
              onClick={() => handleProtectedAction(() => onNavigate(ViewState.MY_PAGE))}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              <Heart
                className={`transition-all group-hover:scale-110 ${
                  isLoggedIn ? 'text-gray-400 group-hover:text-pink-500' : 'text-gray-300'
                }`}
                size={24}
              />
              <span className="mt-1 text-xs font-medium text-gray-600">찜한목록</span>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
          <div className="mb-2 mt-2 px-3 text-xs font-bold text-gray-400">서비스 안내</div>
          <MenuItem icon={BookOpen} label="장례/추모 가이드" onClick={() => handleNav(ViewState.GUIDE)} />
          <MenuItem icon={Calendar} label="구독 / 결제 안내" onClick={() => handleNav(ViewState.PERSONAL_SUBSCRIPTION)} />
          <MenuItem
            icon={ClipboardCheck}
            label="장례 후 행정 체크리스트"
            onClick={() => handleNav(ViewState.ADMIN_CHECKLIST)}
          />
          <MenuItem icon={Bell} label="공지사항 & 이벤트" onClick={() => handleNav(ViewState.NOTICES)} />

          <div className="mb-2 mt-6 px-3 text-xs font-bold text-gray-400">고객 지원</div>
          <MenuItem icon={HelpCircle} label="고객센터 / 자주 묻는 질문" onClick={() => handleNav(ViewState.SUPPORT)} />
          <MenuItem icon={Settings} label="앱 설정" onClick={() => handleNav(ViewState.SETTINGS)} />

          <div className="mx-4 my-2 border-t" />
          <MenuItem icon={Building2} label="업체 입점/제휴 문의" onClick={() => handleNav(ViewState.PARTNER_INQUIRY)} />
        </div>

        <div className="bg-gray-50 px-6 py-3 pb-safe border-t">
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              data-testid="sidemenu-logout-button"
              className="mb-2 flex min-h-[44px] w-full items-center gap-2 text-sm text-gray-500 transition-colors hover:text-red-500"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          )}

          <div className="flex flex-col items-start text-[10px] text-gray-500">
            <span>버전 1.0.0</span>
            <span>(주)아톰케어</span>
          </div>
        </div>
      </div>
    </>
  );
};

const MenuItem = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-lg p-3 text-left text-gray-700 transition-colors hover:bg-gray-50"
  >
    <Icon size={20} className="text-gray-400 transition-colors group-hover:text-primary" />
    <span className="text-sm font-medium group-hover:text-gray-900">{label}</span>
    <ChevronRight size={16} className="ml-auto text-gray-300" />
  </button>
);
