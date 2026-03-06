import type { SupabaseClient } from '@supabase/supabase-js';
import { PartnerInquiry, Payment, Subscription } from '@/types/db';

// --- 파트너 입점 신청 조회 API ---
export const fetchPendingInquiries = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_inquiries')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PartnerInquiry[];
};

// --- 유저 관리 API ---
export interface UserProfile {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
    created_at: string;
}

export const fetchAllUsers = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserProfile[];
};

export const updateUserRole = async (userId: string, newRole: string, client: SupabaseClient, actorId?: string) => {
    const { error } = await client
        .from('profiles')
        .update({ role: newRole })
        .eq('clerk_id', userId);

    if (error) throw error;

    const { error: auditError } = await client.from('audit_logs').insert([{
        action: 'UPDATE_ROLE',
        resource_type: 'profiles',
        resource_id: userId,
        metadata: { new_role: newRole },
        user_id: actorId || 'system'
    }]);
    if (auditError) console.error('[updateUserRole] audit_log insert failed:', auditError.message);
};

// --- 시설 통합 관리 API ---
export const updateFacilityManager = async (facilityId: string, newManagerId: string | null, client: SupabaseClient) => {
    const { error } = await client
        .from('facilities')
        .update({ user_id: newManagerId })
        .eq('id', facilityId);

    if (error) throw error;
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
        facility_id?: number | string;
        facility_name?: string;
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

    return data.map((item: SubscriptionRow) => {
        let pName = item.plan?.name;

        if (!pName && item.plan_id) {
            const idLower = String(item.plan_id).toLowerCase();
            if (idLower.includes('enterprise')) pName = '엔터프라이즈';
            else if (idLower.includes('premium')) pName = '프리미엄';
            else if (idLower.includes('basic')) pName = '베이직';
            else if (idLower.includes('free')) pName = '무료체험';
            else pName = '베이직';
        }

        return {
            ...item,
            facility_name: item.facility_name || '(삭제된 시설)',
            plan_name: pName || '베이직',
            next_billing_date: item.next_billing_date
        };
    }) as (Subscription & { facility_name: string, next_billing_date?: string })[];
};

export const updateSubscriptionBillingDate = async (facilityId: string, nextDate: string, client: SupabaseClient) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

    let query = client.from('facility_subscriptions').update({
        next_billing_date: nextDate,
        updated_at: new Date().toISOString()
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
export const fetchPayments = async (client: SupabaseClient) => {
    const { data: payments, error: pError } = await client
        .from('subscription_payments')
        .select('*')
        .order('paid_at', { ascending: false });

    if (pError) throw pError;

    try {
        const { data: subs, error: sError } = await client
            .from('admin_subscriptions_with_facility')
            .select('id, facility_name');

        if (!sError && subs) {
            const subMap = new Map(subs.map(s => [s.id, s.facility_name]));
            return payments.map((item: Payment) => ({
                ...item,
                facility_name: subMap.get(item.subscription_id ?? '') || '(시설 정보 유실)',
            })) as (Payment & { facility_name: string })[];
        }
    } catch {
        // facility name resolution failed — non-blocking
    }

    return payments.map(p => ({ ...p, facility_name: '(알 수 없음)' })) as (Payment & { facility_name: string })[];
};

// --- 관리 활동 로그 API ---
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

export const updateSystemSetting = async (key: string, value: string | number | boolean | Record<string, unknown>, client: SupabaseClient) => {
    const { error } = await client
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
};
