import { describe, expect, it } from 'vitest';

import {
    compareFacilityPlanExposure,
    getFacilityPhotoLimitLabel,
    getFacilityPlanId,
    getFacilityPlanMeta,
} from './facilityPlan';

describe('facilityPlan', () => {
    it('normalizes facility plan ids to canonical values', () => {
        expect(getFacilityPlanId('basic')).toBe('BASIC');
        expect(getFacilityPlanId('PREMIUM')).toBe('PREMIUM');
        expect(getFacilityPlanId('enterprise')).toBe('ENTERPRISE');
        expect(getFacilityPlanId('unknown')).toBe('FREE');
    });

    it('returns the enforced limits used by facility plan gating', () => {
        expect(getFacilityPlanMeta('FREE')).toMatchObject({ photoLimit: 3, aiChatQuota: 0 });
        expect(getFacilityPlanMeta('BASIC')).toMatchObject({ photoLimit: 20, aiChatQuota: 100 });
        expect(getFacilityPlanMeta('PREMIUM')).toMatchObject({ photoLimit: -1, aiChatQuota: -1 });
    });

    it('orders enterprise above premium above basic and free for exposure', () => {
        expect(compareFacilityPlanExposure('ENTERPRISE', 'PREMIUM')).toBeLessThan(0);
        expect(compareFacilityPlanExposure('PREMIUM', 'BASIC')).toBeLessThan(0);
        expect(compareFacilityPlanExposure('BASIC', 'FREE')).toBe(0);
    });

    it('formats photo limit labels for UI', () => {
        expect(getFacilityPhotoLimitLabel('FREE')).toBe('3장');
        expect(getFacilityPhotoLimitLabel('BASIC')).toBe('20장');
        expect(getFacilityPhotoLimitLabel('PREMIUM')).toBe('무제한');
    });
});
