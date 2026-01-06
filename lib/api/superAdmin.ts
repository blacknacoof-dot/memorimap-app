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
    // 1. 상태 변경
    const { error: inquiryError } = await supabase
        .from('partner_inquiries')
        .update({ status: 'approved' })
        .eq('id', inquiry.id);
    if (inquiryError) throw inquiryError;

    // 2. 권한 승격
    if (inquiry.user_id) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'facility_admin' })
            .eq('id', inquiry.user_id);
        if (profileError) throw profileError;
    }
};

export const rejectPartner = async (id: string) => {
    const { error } = await supabase
        .from('partner_inquiries')
        .update({ status: 'rejected' })
        .eq('id', id);
    if (error) throw error;
};

// --- 구독 관리 API ---
export const fetchSubscriptions = async () => {
    // memorial_spaces 정보를 Join해서 가져옴
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*, memorial_spaces(name)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // 데이터 평탄화 (Flatten)
    return data.map((item: any) => ({
        ...item,
        facility_name: item.memorial_spaces?.name || '(삭제된 시설)',
    })) as (Subscription & { facility_name: string })[];
};

// --- 매출/결제 API ---
export const fetchPayments = async () => {
    const { data, error } = await supabase
        .from('payments')
        .select('*, memorial_spaces(name)')
        .order('payment_date', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
        ...item,
        facility_name: item.memorial_spaces?.name || '(삭제된 시설)',
    })) as (Payment & { facility_name: string })[];
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
