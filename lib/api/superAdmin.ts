import type { SupabaseClient } from '@supabase/supabase-js';
import { PartnerInquiry, Payment, Subscription } from '@/types/db';

// --- 파트너 입점 요청 조회 API ---
export const fetchPendingInquiries = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_inquiries')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PartnerInquiry[];
};

// --- 사용자 관리 API ---
export interface UserProfile {
    id: string;
    clerk_id?: string | null;
    email: string | null;
    full_name: string | null;
    role: string;
    created_at: string;
}

export const isTestUserProfile = (profile: Pick<UserProfile, 'email' | 'full_name'>) => {
    const email = profile.email?.toLowerCase() || '';
    const fullName = profile.full_name?.toLowerCase() || '';

    return (
        email.endsWith('@example.com') ||
        email.includes('subscription-flow-') ||
        email.includes('core-flow-') ||
        email.includes('e2e') ||
        fullName.includes('subscription-flow-') ||
        fullName.includes('core-flow-') ||
        fullName.includes('fixture') ||
        fullName.includes('e2e')
    );
};

export interface PersonalSubscriptionAdminRow {
    user_id: string;
    email: string | null;
    full_name: string | null;
    plan_id: string;
    plan_name: string;
    status: string;
    ai_consult_used: number;
    sangjo_compare_used: number;
    favorites_count: number;
    sangjo_favorites_count: number;
    last_reset_at: string | null;
    started_at: string | null;
    expires_at: string | null;
    created_at: string | null;
}

export const fetchAllUsers = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data || []) as UserProfile[];
    const deduped = new Map<string, UserProfile>();

    for (const row of rows) {
        const key = (row.email || row.clerk_id || row.id).toLowerCase();
        const existing = deduped.get(key);

        if (!existing) {
            deduped.set(key, row);
            continue;
        }

        const rowHasLinkedIdentity = Boolean(row.clerk_id);
        const existingHasLinkedIdentity = Boolean(existing.clerk_id);

        if (rowHasLinkedIdentity && !existingHasLinkedIdentity) {
            deduped.set(key, row);
            continue;
        }

        if (rowHasLinkedIdentity === existingHasLinkedIdentity && row.created_at > existing.created_at) {
            deduped.set(key, row);
        }
    }

    return Array.from(deduped.values());
};

export const fetchPersonalSubscriptions = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('user_subscriptions')
        .select(`
            user_id,
            plan_id,
            plan_name,
            status,
            ai_consult_used,
            sangjo_compare_used,
            favorites_count,
            sangjo_favorites_count,
            last_reset_at,
            started_at,
            expires_at,
            created_at
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data || []) as Array<{
        user_id: string;
        plan_id?: string | null;
        plan_name?: string | null;
        status?: string | null;
        ai_consult_used?: number | null;
        sangjo_compare_used?: number | null;
        favorites_count?: number | null;
        sangjo_favorites_count?: number | null;
        last_reset_at?: string | null;
        started_at?: string | null;
        expires_at?: string | null;
        created_at?: string | null;
    }>;

    const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));
    const profileMap = new Map<string, { email: string | null; full_name: string | null }>();

    if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await client
            .from('profiles')
            .select('clerk_id, email, full_name')
            .in('clerk_id', userIds);

        if (profileError) throw profileError;

        (profiles || []).forEach((profile) => {
            profileMap.set(profile.clerk_id, {
                email: profile.email,
                full_name: profile.full_name,
            });
        });
    }

    return rows.map((row) => ({
        user_id: row.user_id,
        email: profileMap.get(row.user_id)?.email || null,
        full_name: profileMap.get(row.user_id)?.full_name || null,
        plan_id: row.plan_id || 'personal_free',
        plan_name: row.plan_name || 'PERSONAL_FREE',
        status: row.status || 'active',
        ai_consult_used: row.ai_consult_used || 0,
        sangjo_compare_used: row.sangjo_compare_used || 0,
        favorites_count: row.favorites_count || 0,
        sangjo_favorites_count: row.sangjo_favorites_count || 0,
        last_reset_at: row.last_reset_at || null,
        started_at: row.started_at || null,
        expires_at: row.expires_at || null,
        created_at: row.created_at || null,
    })) as PersonalSubscriptionAdminRow[];
};

export const updateUserRole = async (userId: string, newRole: string, client: SupabaseClient, actorId?: string) => {
    const { error } = await client
        .from('profiles')
        .update({ role: newRole })
        .eq('clerk_id', userId);

    if (error) throw error;

    const { error: _auditError } = await client.from('audit_logs').insert([{
        action: 'UPDATE_ROLE',
        resource_type: 'profiles',
        resource_id: userId,
        metadata: { new_role: newRole },
        user_id: actorId || 'system',
    }]);
    // audit log failure is non-blocking for the primary action
};

// --- 시설 통합 관리 API ---
export const updateFacilityManager = async (facilityId: string, newManagerId: string | null, client: SupabaseClient) => {
    const { error } = await client
        .from('facilities')
        .update({ user_id: newManagerId })
        .eq('id', facilityId);

    if (error) throw error;
};

const isUuidLike = (value?: string | number | null) => typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const normalizeSubscriptionPlanName = (planId?: string | null, existingName?: string | null) => {
    if (existingName) return existingName;
    if (!planId) return 'Basic';

    const idLower = String(planId).toLowerCase();
    if (idLower.includes('enterprise')) return 'Enterprise';
    if (idLower.includes('premium')) return 'Premium';
    if (idLower.includes('basic')) return 'Basic';
    if (idLower.includes('free')) return 'Free';
    return 'Basic';
};

const resolveFacilityNameMap = async (
    client: SupabaseClient,
    rows: Array<{ facility_id?: string | number | null; facility_id_uuid?: string | null; facility_id_bigint?: string | number | null }>,
) => {
    const facilityNameMap = new Map<string, string>();

    const uuidIds = Array.from(new Set(
        rows
            .map((item) => item.facility_id_uuid || item.facility_id)
            .filter((value): value is string => isUuidLike(value))
    ));

    const legacyIds = Array.from(new Set(
        rows
            .map((item) => item.facility_id_bigint)
            .filter((value): value is string | number => value !== null && value !== undefined)
            .map((value) => Number(value))
            .filter((value) => !Number.isNaN(value))
    ));

    if (uuidIds.length > 0) {
        const { data: facilitiesById, error: facilitiesByIdError } = await client
            .from('facilities')
            .select('id, legacy_id, name')
            .in('id', uuidIds);

        if (!facilitiesByIdError && facilitiesById) {
            facilitiesById.forEach((facility) => {
                facilityNameMap.set(String(facility.id), facility.name);
                if (facility.legacy_id !== null && facility.legacy_id !== undefined) {
                    facilityNameMap.set(String(facility.legacy_id), facility.name);
                }
            });
        }
    }

    if (legacyIds.length > 0) {
        const { data: facilitiesByLegacyId, error: facilitiesByLegacyIdError } = await client
            .from('facilities')
            .select('id, legacy_id, name')
            .in('legacy_id', legacyIds);

        if (!facilitiesByLegacyIdError && facilitiesByLegacyId) {
            facilitiesByLegacyId.forEach((facility) => {
                facilityNameMap.set(String(facility.id), facility.name);
                if (facility.legacy_id !== null && facility.legacy_id !== undefined) {
                    facilityNameMap.set(String(facility.legacy_id), facility.name);
                }
            });
        }
    }

    return facilityNameMap;
};

// --- 구독 관리 API ---
export const fetchSubscriptions = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('admin_subscriptions_with_facility')
        .select(`
            *,
            plan:subscription_plans(name, name_en, price)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    interface SubscriptionRow {
        id: string;
        facility_id?: number | string | null;
        facility_id_uuid?: string | null;
        facility_id_bigint?: number | string | null;
        facility_name?: string | null;
        plan_id?: string;
        plan?: { name?: string; name_en?: string; price?: number } | null;
        plan_name?: string;
        status?: string;
        start_date?: string;
        end_date?: string | null;
        auto_renew?: boolean;
        created_at?: string;
        next_billing_date?: string;
        [key: string]: unknown;
    }

    const rows = (data || []) as SubscriptionRow[];
    let facilityNameMap = new Map<string, string>();

    if (rows.some((item) => !item.facility_name)) {
        try {
            facilityNameMap = await resolveFacilityNameMap(client, rows);
        } catch {
            // best-effort fallback only
        }
    }

    return rows.map((item: SubscriptionRow) => {
        const resolvedFacilityName = item.facility_name
            || facilityNameMap.get(String(item.facility_id_uuid || item.facility_id || ''))
            || facilityNameMap.get(String(item.facility_id_bigint || ''));

        return {
            ...item,
            facility_name: resolvedFacilityName || '(사업자명 확인 필요)',
            plan_name: normalizeSubscriptionPlanName(item.plan_id, item.plan?.name || item.plan_name),
            next_billing_date: item.next_billing_date,
        };
    }) as (Subscription & { facility_name: string; next_billing_date?: string })[];
};

export const updateSubscriptionBillingDate = async (facilityId: string, nextDate: string, client: SupabaseClient) => {
    const isUUID = isUuidLike(facilityId);

    let query = client.from('facility_subscriptions').update({
        next_billing_date: nextDate,
        updated_at: new Date().toISOString(),
    });

    if (isUUID) {
        query = query.eq('facility_id_uuid', facilityId);
    } else {
        query = query.eq('facility_id_bigint', Number(facilityId));
    }

    const { error } = await query;
    if (error) throw error;
    return true;
};

// --- 매출/결제 API ---
export interface PaymentWithFacility extends Payment {
    facility_name: string;
}

export interface FetchPaymentsResult {
    payments: PaymentWithFacility[];
    facilityNameFailed: boolean;
}

const normalizePaymentStatus = (status?: string | null) => {
    if (status === 'completed') return 'succeeded';
    return status || 'pending';
};

export const fetchPayments = async (client: SupabaseClient): Promise<FetchPaymentsResult> => {
    const { data: payments, error: pError } = await client
        .from('subscription_payments')
        .select('*')
        .order('paid_at', { ascending: false });

    if (pError) throw pError;

    const normalizedPayments = payments.map((item: Payment) => ({
        ...item,
        status: normalizePaymentStatus(item.status),
    })) as Payment[];

    try {
        const { data: subs, error: sError } = await client
            .from('facility_subscriptions')
            .select('id, facility_id, facility_id_uuid, facility_id_bigint')
            .in('id', normalizedPayments.map((payment) => payment.subscription_id).filter(Boolean));

        if (!sError && subs) {
            const facilityMap = await resolveFacilityNameMap(client, subs);

            const subMap = new Map(subs.map((sub) => {
                const resolvedFacilityName = facilityMap.get(String(sub.facility_id_uuid || sub.facility_id || ''))
                    || facilityMap.get(String(sub.facility_id_bigint || ''));
                return [sub.id, resolvedFacilityName];
            }));

            const resolvedPayments = normalizedPayments.map((item: Payment) => ({
                ...item,
                facility_name: subMap.get(item.subscription_id ?? '') || '(시설 정보 유실)',
            })) as PaymentWithFacility[];

            return {
                payments: resolvedPayments,
                facilityNameFailed: resolvedPayments.some((payment) => payment.facility_name === '(시설 정보 유실)'),
            };
        }
    } catch {
        // facility name resolution failed; continue with fallback labels
    }

    return {
        payments: normalizedPayments.map((payment) => ({ ...payment, facility_name: '(시설명 확인 불가)' })) as PaymentWithFacility[],
        facilityNameFailed: true,
    };
};

// --- 관리자 행동 로그 API ---
export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export const fetchAuditLogs = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw error;

    return data as AuditLog[];
};

// --- 시스템 설정 API ---
export const fetchSystemSettings = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('system_settings')
        .select('*');

    if (error) {
        return [];
    }

    return data;
};

export const updateSystemSetting = async (
    key: string,
    value: string | number | boolean | Record<string, unknown>,
    client: SupabaseClient,
) => {
    const { error } = await client
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
};
