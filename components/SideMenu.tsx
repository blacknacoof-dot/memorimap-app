import React from 'react';
import { X, User, Calendar, Heart, Settings, HelpCircle, LogOut, ChevronRight, Bell, BookOpen, LogIn } from 'lucide-react';
import { ViewState } from '../types';

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
  onLogout
}) => {

  const handleProtectedAction = (action: () => void) => {
    if (!isLoggedIn) {
      if (confirm('로그인이 필요한 서비스입니다. 로그인 하시겠습니까?')) {
        onLogin();
      }
    } else {
      action();
      onClose();
    }
  };

  const handleNav = (view: ViewState) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className={`fixed inset-y-0 left-0 w-[280px] bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* User Profile / Login Header */}
        <div className="bg-primary px-6 pt-12 pb-12 text-white relative transition-all">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>

          {isLoggedIn && user ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                  <User size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl">{user.name} 님</h2>
                  <p className="text-xs text-blue-100">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => { onNavigate(ViewState.MY_PAGE); onClose(); }}
                className="text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
              >
                내 정보 관리 <ChevronRight size={12} />
              </button>

              {userRole === 'facility_admin' && (
                <button
                  onClick={() => { onNavigate(ViewState.FACILITY_ADMIN); onClose(); }}
                  className="mt-2 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-lg"
                >
                  내 추모 시설 관리 <ChevronRight size={12} />
                </button>
              )}

              {user?.email === 'blacknacoof@gmail.com' && (
                <button
                  onClick={() => { onNavigate(ViewState.SUPER_ADMIN); onClose(); }}
                  className="mt-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-lg"
                >
                  슈퍼 관리 컨트롤 센터 <ChevronRight size={12} />
                </button>
              )}
            </>
          ) : (
            <div className="py-2">
              <h2 className="font-bold text-xl mb-2">환영합니다!</h2>
              <p className="text-xs text-blue-100 mb-6">
                로그인하고 예약 내역과<br />관심 시설을 확인해보세요.
              </p>
              <button
                onClick={onLogin}
                className="w-full bg-white text-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <LogIn size={18} />
                로그인 / 회원가입
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Dashboard */}
        <div className="px-4 -mt-8 mb-6 relative z-10">
          <div className="bg-white rounded-xl shadow-lg border p-4 flex justify-around items-center">
            <button
              onClick={() => handleProtectedAction(() => onNavigate(ViewState.MY_PAGE))}
              className="flex flex-col items-center gap-1 flex-1 border-r border-gray-100 relative group"
            >
              <div className="relative">
                <Calendar className={`transition-transform group-hover:scale-110 ${isLoggedIn ? 'text-primary' : 'text-gray-400'}`} size={24} />
                {isLoggedIn && reservationCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {reservationCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600 mt-1">예약현황</span>
            </button>

            <button
              onClick={() => handleProtectedAction(() => onNavigate(ViewState.MY_PAGE))}
              className="flex flex-col items-center gap-1 flex-1 group"
            >
              <Heart className={`transition-all group-hover:scale-110 ${isLoggedIn ? 'text-gray-400 group-hover:text-pink-500' : 'text-gray-300'}`} size={24} />
              <span className="text-xs font-medium text-gray-600 mt-1">찜한목록</span>
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
          <div className="text-xs font-bold text-gray-400 mb-2 px-3 mt-2">서비스 안내</div>
          <MenuItem icon={BookOpen} label="장례/추모 가이드" onClick={() => handleNav(ViewState.GUIDE)} />
          <MenuItem icon={Bell} label="공지사항 & 이벤트" onClick={() => handleNav(ViewState.NOTICES)} />

          <div className="text-xs font-bold text-gray-400 mb-2 px-3 mt-6">고객 지원</div>
          <MenuItem icon={HelpCircle} label="고객센터 / 자주 묻는 질문" onClick={() => handleNav(ViewState.SUPPORT)} />
          <MenuItem icon={Settings} label="앱 설정" onClick={() => handleNav(ViewState.SETTINGS)} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {isLoggedIn && (
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="flex items-center gap-2 text-gray-500 text-sm hover:text-red-500 transition-colors w-full mb-4"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          )}
          <div className="flex justify-between items-end relative">
            <div className="text-[10px] text-gray-300 w-full flex flex-col items-start p-2 -ml-2">
              <span>버전 1.0.0</span>
              <span>(주)아톰케어</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const MenuItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left group">
    <Icon size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
    <span className="text-sm font-medium group-hover:text-gray-900">{label}</span>
    <ChevronRight size={16} className="ml-auto text-gray-300" />
  </button>
);