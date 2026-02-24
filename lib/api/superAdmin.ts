import type { SupabaseClient } from '@supabase/supabase-js';
import { Notice, PartnerInquiry, Payment, Subscription } from '@/types/db';
import type { Facility } from '@/types/facility';

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
        target_resource: 'profiles',
        target_id: userId,
        details: { new_role: newRole },
        actor_id: actorId || 'system'
    }]);
    if (auditError) console.warn('[updateUserRole] audit_log insert failed:', auditError.message);
};

// --- 시설 통합 관리 API ---
export interface MemorialSpace {
    id: string;
    name: string;
    address: string;
    type: string;
    manager_id: string | null;
}

export const fetchAllFacilities = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('facilities')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Facility[];
};

export const searchFacilities = async (query: string, client: SupabaseClient) => {
    const sanitized = query.trim().replace(/[%_\\]/g, '\\$&');
    const { data, error } = await client
        .from('facilities')
        .select('*')
        .ilike('name', `%${sanitized}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Facility[];
};

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

// --- 공지사항 API ---
export const fetchNotices = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notice[];
};

export const createNotice = async (notice: Partial<Notice>, client: SupabaseClient) => {
    const { data, error } = await client
        .from('notices')
        .insert([notice])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteNotice = async (id: string, client: SupabaseClient) => {
    const { error } = await client
        .from('notices')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- 상담 신청 관리 API ---
export const fetchLeads = async (client: SupabaseClient) => {
    const { data: leads, error } = await client
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Failed to fetch leads:', error);
        return [];
    }

    interface ConsultationRow {
        id: string;
        user_name?: string | null;
        visitor_name?: string | null;
        contact_name?: string | null;
        phone_number?: string | null;
        contact_number?: string | null;
        contact_phone?: string | null;
        consultation_type?: string | null;
        type?: string | null;
        category?: string | null;
        status?: string | null;
        created_at: string;
        facility_name?: string | null;
        [key: string]: unknown;
    }

    return leads.map((lead: ConsultationRow) => ({
        id: lead.id,
        user_name: lead.user_name || lead.visitor_name || lead.contact_name || '익명 고객',
        phone_number: lead.phone_number || lead.contact_number || lead.contact_phone,
        type: lead.consultation_type || lead.type || lead.category || 'consultation',
        status: lead.status || 'new',
        created_at: lead.created_at,
        customer_name: lead.user_name || lead.visitor_name || lead.contact_name || '익명 고객',
        customer_phone: lead.phone_number || lead.contact_number || lead.contact_phone,
        facility_name: lead.facility_name || '(시설 미지정)',
        category: lead.category || '기타'
    }));
};

// --- 관리 활동 로그 API ---
export interface AuditLog {
    id: string;
    actor_id: string;
    actor_email: string | null;
    action: string;
    target_resource: string;
    target_id: string;
    details: Record<string, unknown> | null;
    status: string;
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
