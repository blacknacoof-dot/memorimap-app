import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSafeOrFilter } from '../security/sqlSanitize';
import { getFacilityPlanId } from '../facilityPlan';

interface SubscriptionRow {
    id: string;
    status: string;
    end_date?: string | null;
    plan_id?: string | null;
    next_billing_date?: string | null;
    facilities?: { name?: string | null } | null;
    plan?: { name?: string | null; price?: number | null } | null;
    subscription_plans?: {
        id?: string | null;
        name?: string | null;
        name_en?: string | null;
        price?: number | null;
        features?: unknown;
    } | null;
    [key: string]: unknown;
}

export const getFacilitySubscription = async (facilityId: string, client: SupabaseClient) => {
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

        let query = client
            .from('facility_subscriptions')
            .select(`
                *,
                subscription_plans (
                    id,
                    name,
                    name_en,
                    price,
                    features
                )
            `);

        if (isUUID) {
            query = query.eq('facility_id_uuid', facilityId);
        } else {
            const numericId = facilityId.replace(/[^0-9]/g, '');
            if (!numericId) return null;
            query = query.or(buildSafeOrFilter([`facility_id.eq.${numericId}`, `facility_id_bigint.eq.${numericId}`]));
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            return null;
        }

        if (!data) {
            return null;
        }

        return {
            ...data,
            plan_name: data.subscription_plans?.name || data.plan_id,
            plan_price: data.subscription_plans?.price,
            next_billing_date: data.next_billing_date,
            plan: data.subscription_plans?.name_en
                ? {
                    name_en: getFacilityPlanId(data.subscription_plans.name_en).toLowerCase(),
                    features: data.subscription_plans.features,
                }
                : undefined,
        };
    } catch (_error) {
        return null;
    }
};

export const getAllSubscriptions = async (client: SupabaseClient) => {
    try {
        const { data, error } = await client
            .from('facility_subscriptions')
            .select(`
                *,
                facilities (name),
                plan:subscription_plans(name, price)
            `);

        if (error) throw error;

        return (data || []).map((item: SubscriptionRow) => ({
            id: item.id,
            facilityName: item.facilities?.name || 'Unknown',
            planName: item.plan?.name || 'Unknown',
            expiresAt: item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A',
            price: item.plan?.price || 0,
            status: item.status || 'active',
        }));
    } catch (_error) {
        return [];
    }
};
