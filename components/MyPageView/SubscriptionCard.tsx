import React from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { ViewState } from '../../types';
import { useUserPlan } from '../../hooks/useUserPlan';

const PLAN_LABELS: Record<string, string> = {
  PERSONAL_FREE: '무료 플랜 이용 중',
  PERSONAL_BASIC: '베이직 이용 중',
  PERSONAL_PREMIUM: '프리미엄 이용 중',
};

interface Props {
  userRole?: string;
  onNavigate: (view: ViewState) => void;
}

export const SubscriptionCard: React.FC<Props> = ({ userRole, onNavigate }) => {
  const isBusinessRole = ['facility_admin', 'facility_manager', 'sangjo_hq_admin', 'sangjo_branch_admin'].includes(userRole || '');
  const { data } = useUserPlan();

  if (isBusinessRole) return null;

  const planName = data?.plan_name || 'PERSONAL_FREE';
  const expiresAt = data?.expires_at || null;
  const isBetaPremium = data?.is_beta_premium === true;
  const isCancelling = data?.status === 'cancelling';

  const planLabel = (() => {
    if (isBetaPremium && expiresAt) {
      const expDate = new Date(expiresAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
      return `베타 프리미엄 사용 중 (${expDate}까지)`;
    }

    if (isCancelling && expiresAt) {
      const expDate = new Date(expiresAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
      return `해지 예정 (${expDate}까지)`;
    }

    return PLAN_LABELS[planName] ?? PLAN_LABELS.PERSONAL_FREE;
  })();

  return (
    <button
      onClick={() => onNavigate(ViewState.PERSONAL_SUBSCRIPTION)}
      className={`w-full mb-6 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${
        isBetaPremium
          ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
          : isCancelling
            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
            : 'bg-gradient-to-r from-purple-500 to-fuchsia-600'
      }`}
    >
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
        <Star size={20} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-white/80">나의 구독</p>
        <p className="text-sm font-black">{planLabel}</p>
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
      <span className="bg-amber-100 p-1 rounded">📄</span> 업체 계정 전환 안내
    </h3>
    <p className="text-sm text-amber-900 leading-relaxed">
      관리자 확인을 위해 <b>사업자 등록증</b>을 아래 메일로 보내주세요.<br />
      <span className="font-mono bg-amber-100 px-1 rounded">support@atomcare.co.kr</span>
    </p>
    <p className="text-xs text-amber-700 mt-2">
      * 서류 검토 후 24시간 이내에 업체 관리자(Facility Admin) 권한이 부여됩니다.
    </p>
  </div>
);
