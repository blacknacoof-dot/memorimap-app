import React, { useEffect, useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { ViewState } from '../../types';
import { useSession } from '../../lib/auth';
import { getAuthClient } from '../../lib/supabaseClient';

const PLAN_LABELS: Record<string, string> = {
  PERSONAL_FREE: '무료 플랜 이용 중',
  PERSONAL_BASIC: '베이직 이용 중',
  PERSONAL_PREMIUM: '프리미엄 이용 중',
};

interface SubInfo {
  planId: string;
  status: string;
  expiresAt: string | null;
}

function getLabel(info: SubInfo): string {
  if (info.status === 'cancelling' && info.expiresAt) {
    const expDate = new Date(info.expiresAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const planName = PLAN_LABELS[info.planId]?.replace(' 이용 중', '') || info.planId;
    return `${planName} 해지 예정 (${expDate}까지)`;
  }
  return PLAN_LABELS[info.planId] ?? PLAN_LABELS['PERSONAL_FREE'];
}

interface Props {
  userRole?: string;
  onNavigate: (view: ViewState) => void;
}

export const SubscriptionCard: React.FC<Props> = ({ userRole, onNavigate }) => {
  const isBusinessRole = ['facility_admin', 'facility_manager', 'sangjo_hq_admin', 'sangjo_branch_admin'].includes(userRole || '');
  const { session } = useSession();
  const [planLabel, setPlanLabel] = useState('요금제 확인');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!session) return;

    const userId = session.user?.id;
    if (!userId) return;

    getAuthClient(session, { strict: true })
      .then((client) =>
        client
          .from('user_subscriptions')
          .select('plan_id, status, expires_at')
          .eq('user_id', userId)
          .in('status', ['active', 'cancelling'])
          .maybeSingle(),
      )
      .then(({ data }) => {
        if (!mounted) return;
        const info: SubInfo = {
          planId: data?.plan_id ?? 'PERSONAL_FREE',
          status: data?.status ?? 'active',
          expiresAt: data?.expires_at ?? null,
        };
        setPlanLabel(getLabel(info));
        setIsCancelling(info.status === 'cancelling');
      })
      .catch(() => {
        if (mounted) setPlanLabel(PLAN_LABELS['PERSONAL_FREE']);
      });

    return () => { mounted = false; };
  }, [session]);

  if (isBusinessRole) return null;

  return (
    <button
      onClick={() => onNavigate(ViewState.PERSONAL_SUBSCRIPTION)}
      className={`w-full mb-6 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${
        isCancelling
          ? 'bg-gradient-to-r from-amber-500 to-orange-600'
          : 'bg-gradient-to-r from-purple-500 to-fuchsia-600'
      }`}
    >
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
        <Star size={20} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-white/80">나의 요금제</p>
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
