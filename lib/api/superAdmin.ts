import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Notice, PartnerInquiry, Payment, Subscription } from '@/types/db';

// --- 파트너 승인 API ---
export const fetchPendingInquiries = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('partner_inquiries')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PartnerInquiry[];
};

/**
 * @deprecated Edge Function 경로 사용 (useAdminActions.ts > useApprovePartner)
 * PartnerAdmissions.tsx에서 이미 Edge Function을 호출하므로 이 함수는 fallback용
 */
export const approvePartner = async (inquiry: PartnerInquiry) => {
    // Edge Function approve-partner를 통한 승인이 메인 경로입니다.
    // 이 함수는 Edge Function 접근 불가 시 직접 RPC 호출 fallback입니다.
    const { data, error: rpcError } = await supabase
        .rpc('approve_partner_transaction', {
            p_inquiry_id: inquiry.id,
            p_admin_id: 'system-fallback'
        });

    if (rpcError) {
        console.error('RPC Error during approval:', rpcError);
        throw rpcError;
    }

    if (data && data.success === false) {
        throw new Error(data.error || 'Transaction failed');
    }

    return data;
};

export const rejectPartner = async (id: string, client?: SupabaseClient) => {
    const db = client || supabase;
    const { error } = await db
        .from('partner_inquiries')
        .update({ status: 'rejected' })
        .eq('id', id);
    if (error) throw error;
};

// --- 유저 관리 API [NEW] ---
export interface UserProfile {
    id: string;
    email: string | null; // profiles 테이블에 email이 없다면 auth JOIN 필요하지만, 현재 스키마 가정
    full_name: string | null;
    role: string;
    created_at: string;
}

export const fetchAllUsers = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserProfile[];
};

export const updateUserRole = async (userId: string, newRole: string, client?: SupabaseClient, actorId?: string) => {
    const db = client || supabase;
    const { error } = await db
        .from('profiles')
        .update({ role: newRole })
        .eq('clerk_id', userId);

    if (error) throw error;

    const { error: auditError } = await db.from('audit_logs').insert([{
        action: 'UPDATE_ROLE',
        target_resource: 'profiles',
        target_id: userId,
        details: { new_role: newRole },
        actor_id: actorId || 'system'
    }]);
    if (auditError) console.warn('[updateUserRole] audit_log insert failed:', auditError.message);
};

// --- 시설 통합 관리 API [NEW] ---
export interface MemorialSpace {
    id: string;
    name: string;
    address: string;
    type: string;
    manager_id: string | null;
}

export const fetchAllFacilities = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('facilities')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
};

export const searchFacilities = async (query: string, client?: SupabaseClient) => {
    const db = client || supabase;
    const sanitized = query.trim().replace(/[%_\\]/g, '\\$&');
    const { data, error } = await db
        .from('facilities')
        .select('*')
        .ilike('name', `%${sanitized}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
};

export const updateFacilityManager = async (facilityId: string, newManagerId: string | null, client?: SupabaseClient) => {
    const db = client || supabase;
    const { error } = await db
        .from('facilities')
        .update({ user_id: newManagerId })
        .eq('id', facilityId);

    if (error) throw error;
};


// --- 구독 관리 API ---
export const fetchSubscriptions = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('admin_subscriptions_with_facility')
        .select(`
            *,
            plan:subscription_plans(name, name_en, price)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => {
        // [Resolve Plan Name]
        let pName = item.plan?.name;

        // Fallback for cases where join failed but plan_id exists
        if (!pName && item.plan_id) {
            const idLower = String(item.plan_id).toLowerCase();
            if (idLower.includes('enterprise')) pName = '엔터프라이즈';
            else if (idLower.includes('premium')) pName = '프리미엄';
            else if (idLower.includes('basic')) pName = '베이직';
            else if (idLower.includes('free')) pName = '무료체험';
            else pName = '베이직'; // Default fallback
        }

        return {
            ...item,
            facility_name: item.facility_name || '(삭제된 시설)',
            plan_name: pName || '베이직',
            next_billing_date: item.next_billing_date
        };
    }) as (Subscription & { facility_name: string, next_billing_date?: string })[];
};

export const updateSubscriptionBillingDate = async (facilityId: string, nextDate: string, client?: SupabaseClient) => {
    const db = client || supabase;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

    let query = db.from('facility_subscriptions').update({
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
export const fetchPayments = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data: payments, error: pError } = await db
        .from('subscription_payments')
        .select('*')
        .order('paid_at', { ascending: false });

    if (pError) {
        console.error('Fetch payments error:', pError);
        throw pError;
    }

    // Try to get facility names for display, but don't let it crash the revenue total
    try {
        const { data: subs, error: sError } = await db
            .from('admin_subscriptions_with_facility')
            .select('id, facility_name');

        if (!sError && subs) {
            const subMap = new Map(subs.map(s => [s.id, s.facility_name]));
            return payments.map((item: any) => ({
                ...item,
                facility_name: subMap.get(item.subscription_id) || '(시설 정보 유실)',
            })) as (Payment & { facility_name: string })[];
        }
    } catch (e) {
        console.warn('Facility name resolution failed:', e);
    }

    // Fallback: Return payments with placeholder names if join fails
    return payments.map(p => ({ ...p, facility_name: '(알 수 없음)' })) as (Payment & { facility_name: string })[];
};

// --- 공지사항 API ---
export const fetchNotices = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notice[];
};

export const createNotice = async (notice: Partial<Notice>, client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('notices')
        .insert([notice])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteNotice = async (id: string, client?: SupabaseClient) => {
    const db = client || supabase;
    const { error } = await db
        .from('notices')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- 상담 신청 관리 API ---
export const fetchLeads = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data: leads, error } = await db
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Failed to fetch leads:', error);
        return [];
    }

    return leads.map((lead: any) => ({
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

// --- 관리 활동 로그 API [NEW] ---
export interface AuditLog {
    id: string;
    actor_id: string;
    actor_email: string | null;
    action: string;
    target_resource: string;
    target_id: string;
    details: any;
    status: string;
    created_at: string;
}

export const fetchAuditLogs = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Failed to fetch audit logs:', error);
        throw error;
    }

    return data as AuditLog[];
};

// --- 시스템 설정 API [NEW] ---
export const fetchSystemSettings = async (client?: SupabaseClient) => {
    const db = client || supabase;
    const { data, error } = await db
        .from('system_settings')
        .select('*');

    if (error) {
        return [];
    }
    return data;
};

export const updateSystemSetting = async (key: string, value: any, client?: SupabaseClient) => {
    const db = client || supabase;
    const { error } = await db
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
};
