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
  <div className="mb-3 flex items-center gap-3">
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200">
      {user.imageUrl ? (
        <img src={user.imageUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-300">
          <User size={24} className="text-gray-500" />
        </div>
      )}

      {(userRole === 'facility_admin' || userRole === 'facility_manager') && (
        <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
          업체
        </div>
      )}

      {(userRole === 'sangjo_hq_admin' || userRole === 'sangjo_branch_admin') && (
        <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
          상조
        </div>
      )}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <h2 className="min-w-0 truncate break-keep whitespace-nowrap font-bold text-base">
          {user.name || '이름 없음'}님
        </h2>
        <button
          type="button"
          onClick={onEditProfile}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 transition-colors hover:text-primary"
          title="프로필 수정"
        >
          <Settings2 size={16} />
        </button>
      </div>

      <p className="truncate text-xs leading-tight text-gray-500">{user.email}</p>
      {userPhone ? (
        <p className="truncate text-xs leading-tight text-gray-500">{userPhone}</p>
      ) : (
        <p className="text-[11px] text-gray-400">등록된 전화번호가 없습니다</p>
      )}

      {pendingCount > 0 && (
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          일정 예약 {pendingCount}건
        </span>
      )}
    </div>

    {(userRole === 'facility_admin' || userRole === 'facility_manager') && onNavigate && (
      <button
        type="button"
        onClick={() => onNavigate(ViewState.FACILITY_ADMIN)}
        className="ml-auto whitespace-nowrap rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-amber-600"
      >
        시설 관리자
      </button>
    )}

    {(userRole === 'sangjo_hq_admin' || userRole === 'sangjo_branch_admin') && onNavigate && (
      <button
        type="button"
        onClick={() => onNavigate(ViewState.SANGJO_DASHBOARD)}
        className="ml-auto whitespace-nowrap rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-600"
      >
        상조 대시보드
      </button>
    )}
  </div>
);
