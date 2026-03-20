import React from 'react';
import { User, Settings2 } from 'lucide-react';
import { ViewState } from '../../types';

interface Props {
  user: { id: string; name: string; email: string; imageUrl?: string };
  userRole?: string;
  userPhone: string;
  pendingCount: number;
  onEditProfile: () => void;
  onNavigate?: (view: ViewState) => void;
}

export const ProfileSection: React.FC<Props> = ({
  user, userRole, userPhone, pendingCount, onEditProfile, onNavigate,
}) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center relative shrink-0">
      {user.imageUrl ? (
        <img src={user.imageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
          <User size={24} className="text-gray-500" />
        </div>
      )}
      {(userRole === 'facility_admin' || userRole === 'facility_manager') && (
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-white">
          업체
        </div>
      )}
      {(userRole === 'sangjo_hq_admin' || userRole === 'sangjo_branch_admin') && (
        <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-white">
          상조
        </div>
      )}
    </div>

    <div>
      <div className="flex items-center gap-1.5">
        <h2 className="font-bold text-base">{user.name || '이름 없음'}님</h2>
        <button
          onClick={onEditProfile}
          className="text-gray-400 hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="프로필 수정"
        >
          <Settings2 size={16} />
        </button>
      </div>
      <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
      {userPhone ? (
        <p className="text-xs text-gray-500 leading-tight">{userPhone}</p>
      ) : (
        <p className="text-[11px] text-gray-400">등록된 전화번호가 없습니다</p>
      )}
      {pendingCount > 0 && (
        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
          예정된 예약 {pendingCount}건
        </span>
      )}
    </div>

    {(userRole === 'facility_admin' || userRole === 'facility_manager') && onNavigate && (
      <button
        onClick={() => onNavigate(ViewState.FACILITY_ADMIN)}
        className="ml-auto bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-amber-600 transition-colors whitespace-nowrap"
      >
        시설 관리자
      </button>
    )}
    {(userRole === 'sangjo_hq_admin' || userRole === 'sangjo_branch_admin') && onNavigate && (
      <button
        onClick={() => onNavigate(ViewState.SANGJO_DASHBOARD)}
        className="ml-auto bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-600 transition-colors whitespace-nowrap"
      >
        상조 대시보드
      </button>
    )}
  </div>
);
