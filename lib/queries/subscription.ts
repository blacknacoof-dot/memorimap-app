import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizeSubscriptionPlanId } from '../subscriptionPlanIds';

export {
    getAllSubscriptions,
    getFacilitySubscription,
} from './subscriptions';

interface SubscriptionUpsertData {
    plan_id: string;
    status: string;
    next_billing_date: string;
    updated_at: string;
    facility_id_uuid?: string;
    facility_id_bigint?: number;
    facility_id?: number | null;
}

export const updateFacilitySubscription = async (facilityId: string, planId: string, client: SupabaseClient) => {
    const db = client;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
    const normalizedPlanId = normalizeSubscriptionPlanId(planId) ?? planId;

    let { data: planData } = await db
        .from('subscription_plans')
        .select('*')
        .eq('name_en', planId)
        .maybeSingle();

    if (!planData) {
        const nameMap: Record<string, string> = {
            FREE: '무료',
            BASIC: '베이직',
            PREMIUM: '프리미엄',
            ENTERPRISE: '엔터프라이즈',
            SJ_STARTER: '상조 STARTER',
            SJ_PROFESSIONAL: '상조 PROFESSIONAL',
            SJ_ENTERPRISE: '상조 ENTERPRISE',
        };
        const korName = nameMap[planId.toUpperCase()];
        if (korName) {
            const { data: fallback } = await db
                .from('subscription_plans')
                .select('*')
                .eq('name', korName)
                .maybeSingle();
            planData = fallback;
        }
    }

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);

    const upsertData: SubscriptionUpsertData = {
        plan_id: normalizedPlanId,
        status: 'active',
        next_billing_date: nextDate.toISOString(),
        updated_at: new Date().toISOString(),
    };

    const conflictTarget = isUUID ? 'facility_id_uuid' : 'facility_id_bigint';

    if (isUUID) {
        upsertData.facility_id_uuid = facilityId;
        upsertData.facility_id = null;
    } else {
        upsertData.facility_id_bigint = Number(facilityId);
        upsertData.facility_id = Number(facilityId);
    }

    const { data: subData, error: subError } = await db
        .from('facility_subscriptions')
        .upsert(
            {
                ...upsertData,
                plan_id: normalizedPlanId,
            },
            {
                onConflict: conflictTarget,
            },
        )
        .select()
        .single();

    if (subError) {
        throw subError;
    }

    if (planData && planData.price > 0 && subData) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { error: payError } = await db
            .from('subscription_payments')
            .insert([
                {
                    subscription_id: subData.id,
                    payment_context: 'facility',
                    amount: planData.price,
                    final_amount: planData.price,
                    status: 'completed',
                    payment_method: 'card',
                    paid_at: now.toISOString(),
                    billing_period_start: now.toISOString().split('T')[0],
                    billing_period_end: periodEnd.toISOString().split('T')[0],
                },
            ]);

        if (payError) {
            throw new Error(`결제 기록 생성 실패: ${payError.message}`);
        }
    }

    try {
        const { data: superAdmins } = await db
            .from('profiles')
            .select('clerk_id')
            .eq('role', 'super_admin');

        if (superAdmins && superAdmins.length > 0) {
            const notifications = superAdmins.map((admin) => ({
                user_id: admin.clerk_id,
                title: '신규 구독 발생',
                message: `${planData?.name || normalizedPlanId} 플랜 결제가 완료되었습니다.`,
                type: 'success',
                link: '/admin?tab=subs',
            }));

            await db
                .from('user_notifications')
                .insert(notifications);
        }
    } catch {
        // non-fatal
    }
};
