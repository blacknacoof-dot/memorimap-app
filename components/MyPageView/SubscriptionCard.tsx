import React from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { ViewState } from '../../types';

interface Props {
  userRole?: string;
  onNavigate: (view: ViewState) => void;
}

export const SubscriptionCard: React.FC<Props> = ({ userRole, onNavigate }) => {
  const isBusinessRole = ['facility_admin', 'facility_manager', 'sangjo_hq_admin', 'sangjo_branch_admin'].includes(userRole || '');
  if (isBusinessRole) return null;

  return (
    <button
      onClick={() => onNavigate(ViewState.PERSONAL_SUBSCRIPTION)}
      className="w-full mb-6 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
    >
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
        <Star size={20} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-white/80">나의 요금제</p>
        <p className="text-sm font-black">무료 플랜 이용 중</p>
      </div>
      <div className="text-white/60">
        <ChevronDown size={18} className="rotate-[-90deg]" />
      </div>
    </button>
  );
};

export const PendingAdminNotice: React.FC = () => (
  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-2">
    <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
      <span className="bg-amber-100 p-1 rounded">📢</span> 업체 계정 전환 안내
    </h3>
    <p className="text-sm text-amber-900 leading-relaxed">
      관리자 승인을 위해 <b>사업자 등록증</b>을 아래 메일로 보내주세요.<br />
      <span className="font-mono bg-amber-100 px-1 rounded">support@atomcare.co.kr</span>
    </p>
    <p className="text-xs text-amber-700 mt-2">
      * 서류 검토 후 24시간 이내에 업체 관리자(Facility Admin) 권한이 부여됩니다.
    </p>
  </div>
);
