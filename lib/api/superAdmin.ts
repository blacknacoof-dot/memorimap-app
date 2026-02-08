import { supabase } from '@/lib/supabaseClient';
import { Notice, PartnerInquiry, Payment, Subscription } from '@/types/db';

// --- 파트너 승인 API ---
export const fetchPendingInquiries = async () => {
    const { data, error } = await supabase
        .from('partner_inquiries')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PartnerInquiry[];
};

export const approvePartner = async (inquiry: PartnerInquiry) => {
    // 1. [Transaction] RPC를 호출하여 상태 변경 + 역할 승격을 동시에 수행
    const { error: rpcError } = await supabase
        .rpc('approve_partner_and_grant_role', {
            inquiry_id: inquiry.id,
            target_user_id: inquiry.user_id
        });

    if (rpcError) {
        console.error('RPC Error during approval:', rpcError);
        throw rpcError;
    }

    // 2. [Facility Logic] 기존 시설 매핑(Claim) 또는 신규 생성
    if (inquiry.target_facility_id) {
        // [Case A] 기존 시설 승계 (Claim)
        const { error: linkError } = await supabase
            .from('memorial_spaces')
            .update({ owner_user_id: inquiry.user_id })
            .eq('id', inquiry.target_facility_id);

        if (linkError) {
            console.error('Failed to link facility:', linkError);
            // Critical error: User approved but facility not linked. 
            // Should prompt admin to check manually or retry? 
            // For now, logging error.
        }
    } else {
        // [Case B] 신규 시설 생성 (Create)
        // RPC 성공 후 수행. 실패하더라도 유저는 시설관리자 권한을 가짐(대시보드 접근 가능).
        const { error: facilityError } = await supabase
            .from('memorial_spaces') // Use memorial_spaces table directly
            .insert([{
                name: inquiry.company_name,
                address: inquiry.address || '',
                category: inquiry.business_type,
                contact: inquiry.contact_number,
                description: inquiry.message || '파트너 입점 시설입니다.',
                owner_user_id: inquiry.user_id || null
            }]);

        if (facilityError) {
            console.error('Failed to create facility record:', facilityError);
        }
    }
};

export const rejectPartner = async (id: string) => {
    const { error } = await supabase
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

export const fetchAllUsers = async () => {
    // profiles 테이블 조회 (Super Admin RLS 정책 적용됨)
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserProfile[];
};

export const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) throw error;

    // 활동 로그 기록
    await supabase.from('audit_logs').insert([{
        action: 'UPDATE_ROLE',
        target_resource: 'profiles',
        target_id: userId,
        details: { new_role: newRole },
        status: 'success'
    }]);
};

// --- 시설 통합 관리 API [NEW] ---
export interface MemorialSpace {
    id: string;
    name: string;
    address: string;
    type: string;
    manager_id: string | null;
}

export const fetchAllFacilities = async () => {
    // memorial_spaces 테이블 조회 (Super Admin RLS 정책 적용됨)
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
};

export const searchFacilities = async (query: string) => {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
};

export const updateFacilityManager = async (facilityId: number, newManagerId: string | null) => {
    // manager_id assumed to be the owner column
    const { error } = await supabase
        .from('memorial_spaces')
        .update({ owner_user_id: newManagerId })
        .eq('id', facilityId);

    if (error) throw error;
};


// --- 구독 관리 API ---
export const fetchSubscriptions = async () => {
    const { data, error } = await supabase
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

export const updateSubscriptionBillingDate = async (facilityId: string, nextDate: string) => {
    // Import from queries to avoid duplication or use direct supabase if preferred
    // For Super Admin API, direct supabase is often cleaner if it's high-level
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

    let query = supabase.from('facility_subscriptions').update({
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
export const fetchPayments = async () => {
    // [Crucial] Fetch all payments regardless of joins to ensure Revenue count is correct
    const { data: payments, error: pError } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('paid_at', { ascending: false });

    if (pError) {
        console.error('Fetch payments error:', pError);
        throw pError;
    }

    // Try to get facility names for display, but don't let it crash the revenue total
    try {
        const { data: subs, error: sError } = await supabase
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
export const fetchNotices = async () => {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notice[];
};

export const createNotice = async (notice: Partial<Notice>) => {
    const { data, error } = await supabase
        .from('notices')
        .insert([notice])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteNotice = async (id: string) => {
    const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- 상담 신청 관리 API ---
export const fetchLeads = async () => {
    // [Fix] consultation_leads 테이블이 없으므로 consultations 테이블 사용
    // Error hint suggests 'consultations' table exists.
    const { data: leads, error } = await supabase
        .from('consultations')
        .select(`
            *,
            facilities (name, category),
            profiles:user_id (full_name, phone)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Failed to fetch leads:', error);
        return [];
    }

    return leads.map((lead: any) => ({
        id: lead.id,
        user_name: lead.user_name || lead.visitor_name || lead.profiles?.full_name || '익명 고객',
        phone_number: lead.phone_number || lead.contact_number || lead.profiles?.phone,
        type: lead.consultation_type || lead.type || 'consultation',
        status: lead.status || 'new',
        created_at: lead.created_at,
        // Map to frontend expected props if needed
        customer_name: lead.user_name || lead.visitor_name || lead.profiles?.full_name || '익명 고객',
        customer_phone: lead.phone_number || lead.contact_number || lead.profiles?.phone,
        facility_name: lead.facilities?.name || '(삭제된 시설)',
        category: lead.facilities?.category || '기타'
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

export const fetchAuditLogs = async () => {
    const { data, error } = await supabase
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
export const fetchSystemSettings = async () => {
    const { data, error } = await supabase
        .from('system_settings')
        .select('*');

    if (error) {
        console.warn('system_settings table might not exist, using defaults');
        return [];
    }
    return data;
};

export const updateSystemSetting = async (key: string, value: any) => {
    const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;
};
