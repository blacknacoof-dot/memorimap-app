const PLAN_ID_ALIASES: Record<string, string> = {
    free: 'free',
    personal_free: 'free',
    basic: 'basic',
    personal_basic: 'basic',
    premium: 'premium',
    personal_premium: 'premium',
    enterprise: 'enterprise',
    sj_starter: 'sj_starter',
    sj_professional: 'sj_professional',
    sj_enterprise: 'sj_enterprise',
    sjstarter: 'sj_starter',
    sjprofessional: 'sj_professional',
    sjenterprise: 'sj_enterprise',
};

function normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizeSubscriptionPlanId(planId?: string | null): string | null {
    if (!planId) return null;

    const normalized = normalizeKey(planId);
    return PLAN_ID_ALIASES[normalized] ?? normalized;
}
