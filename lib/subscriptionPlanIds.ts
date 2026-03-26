const PLAN_ID_ALIASES: Record<string, string> = {
    free: 'free',
    personal_free: 'free',
    무료체험: 'free',
    basic: 'basic',
    personal_basic: 'basic',
    베이직: 'basic',
    premium: 'premium',
    personal_premium: 'premium',
    프리미엄: 'premium',
    signature: 'signature',
    personal_signature: 'signature',
    시그니처: 'signature',
    enterprise: 'enterprise',
    엔터프라이즈: 'enterprise',
    sj_starter: 'sj_starter',
    sj_professional: 'sj_professional',
    sj_enterprise: 'sj_enterprise',
    sjstarter: 'sj_starter',
    sjprofessional: 'sj_professional',
    sjenterprise: 'sj_enterprise',
    상조_starter: 'sj_starter',
    상조_professional: 'sj_professional',
    상조_enterprise: 'sj_enterprise',
};

function normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizeSubscriptionPlanId(planId?: string | null): string | null {
    if (!planId) return null;

    const normalized = normalizeKey(planId);
    return PLAN_ID_ALIASES[normalized] ?? normalized;
}
