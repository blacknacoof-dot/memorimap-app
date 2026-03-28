const PLAN_ID_ALIASES: Record<string, string> = {
    free: 'FREE',
    personal_free: 'FREE',
    무료체험: 'FREE',
    basic: 'BASIC',
    personal_basic: 'BASIC',
    베이직: 'BASIC',
    premium: 'PREMIUM',
    personal_premium: 'PREMIUM',
    프리미엄: 'PREMIUM',
    signature: 'SIGNATURE',
    personal_signature: 'SIGNATURE',
    시그니처: 'SIGNATURE',
    enterprise: 'ENTERPRISE',
    엔터프라이즈: 'ENTERPRISE',
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
