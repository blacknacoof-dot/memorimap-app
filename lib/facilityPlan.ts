import { normalizeSubscriptionPlanId } from './subscriptionPlanIds';

export type FacilityPlanId = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type FacilityPlanPriority = 'normal' | 'high' | 'top';

export interface FacilityPlanMeta {
    id: FacilityPlanId;
    displayName: string;
    photoLimit: number; // -1 = unlimited
    aiChatQuota: number; // -1 = unlimited
    priority: FacilityPlanPriority;
    badge: 'silver' | 'gold' | null;
}

const FACILITY_PLAN_META: Record<FacilityPlanId, FacilityPlanMeta> = {
    FREE: {
        id: 'FREE',
        displayName: '무료체험',
        photoLimit: 3,
        aiChatQuota: 0,
        priority: 'normal',
        badge: null,
    },
    BASIC: {
        id: 'BASIC',
        displayName: '라이트',
        photoLimit: 20,
        aiChatQuota: 100,
        priority: 'normal',
        badge: null,
    },
    PREMIUM: {
        id: 'PREMIUM',
        displayName: '프리미엄',
        photoLimit: -1,
        aiChatQuota: -1,
        priority: 'high',
        badge: 'silver',
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        displayName: '엔터프라이즈',
        photoLimit: -1,
        aiChatQuota: -1,
        priority: 'top',
        badge: 'gold',
    },
};

const FACILITY_PLAN_PRIORITY_RANK: Record<FacilityPlanPriority, number> = {
    normal: 0,
    high: 1,
    top: 2,
};

export const getFacilityPlanId = (value?: string | null): FacilityPlanId => {
    const normalized = normalizeSubscriptionPlanId(value ?? '');
    if (normalized === 'BASIC' || normalized === 'PREMIUM' || normalized === 'ENTERPRISE') {
        return normalized;
    }
    return 'FREE';
};

export const getFacilityPlanMeta = (value?: string | null): FacilityPlanMeta => {
    return FACILITY_PLAN_META[getFacilityPlanId(value)];
};

export const compareFacilityPlanExposure = (left?: string | null, right?: string | null): number => {
    const leftRank = FACILITY_PLAN_PRIORITY_RANK[getFacilityPlanMeta(left).priority];
    const rightRank = FACILITY_PLAN_PRIORITY_RANK[getFacilityPlanMeta(right).priority];
    return rightRank - leftRank;
};

export const getFacilityPhotoLimitLabel = (value?: string | null): string => {
    const limit = getFacilityPlanMeta(value).photoLimit;
    return limit < 0 ? '무제한' : `${limit}장`;
};
