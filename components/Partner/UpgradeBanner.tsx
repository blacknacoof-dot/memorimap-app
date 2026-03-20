import React, { useState } from 'react';
import { Crown, X, ArrowRight } from 'lucide-react';
import type { Subscription } from '../../types/db';

const DISMISS_KEY = 'upgrade_banner_dismissed_at';
const DISMISS_DAYS = 7;

interface Props {
    subscription: Subscription | null;
    monthlyConsultationCount: number;
    onNavigate: () => void;
}

type Recommendation = {
    targetPlan: string;
    commissionSave: string;
    benefits: string;
} | null;

function getRecommendation(planId: string | undefined, monthlyCount: number): Recommendation {
    if (planId === 'sj_starter' && monthlyCount >= 20) {
        return {
            targetPlan: 'PROFESSIONAL',
            commissionSave: '2%p 절감',
            benefits: '우선 노출 + 전담 CS + 고급 CRM',
        };
    }
    if (planId === 'sj_professional' && monthlyCount >= 50) {
        return {
            targetPlan: 'ENTERPRISE',
            commissionSave: '3%p 절감',
            benefits: '메인 배너 독점 + 자동 계약 + 전담 매니저',
        };
    }
    return null;
}

function isDismissed(): boolean {
    try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (!dismissed) return false;
        const dismissedAt = new Date(dismissed);
        const now = new Date();
        const diffDays = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays < DISMISS_DAYS;
    } catch {
        return false;
    }
}

export const UpgradeBanner: React.FC<Props> = ({ subscription, monthlyConsultationCount, onNavigate }) => {
    const recommendation = getRecommendation(subscription?.plan_id, monthlyConsultationCount);
    const [dismissed, setDismissed] = useState(() => isDismissed());

    if (dismissed || !recommendation) return null;

    const handleDismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, new Date().toISOString());
        } catch { /* noop */ }
        setDismissed(true);
    };

    return (
        <div className="mx-4 md:mx-10 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 md:p-5 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl" />
            <div className="flex items-start md:items-center justify-between gap-3 relative z-10">
                <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                        <Crown size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold">
                            {recommendation.targetPlan}로 업그레이드하면
                        </p>
                        <p className="text-xs text-white/80 mt-0.5">
                            수수료 {recommendation.commissionSave} + {recommendation.benefits}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onNavigate}
                        className="px-3 py-2 min-h-[44px] bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                        자세히 보기 <ArrowRight size={14} />
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
