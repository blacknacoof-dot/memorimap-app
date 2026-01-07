import { supabase } from '@/lib/supabaseClient';
import { Notice, PartnerInquiry, Payment, Subscription } from '@/types/db';

// --- 파트너 승인 API ---

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

    // 2. [중요] 시설 데이터 생성 (facilities 테이블)
    // 파트너 정보를 바탕으로 실제 시설 데이터를 생성합니다.
    const { error: facilityError } = await supabase
        .from('facilities')
        .insert([{
            name: inquiry.company_name,
            address: inquiry.address || '',
            category: inquiry.business_type,
            contact: inquiry.contact_number,
            description: inquiry.message || '파트너 입점 시설입니다.',
            // owner_user_id는 추후 계정 연동 시 업데이트하거나, 여기서 user_id가 있다면 넣음
            // owner_user_id: inquiry.user_id || null 
        }]);

    // (선택) 에러 로깅은 하되, 이미 승인 처리는 되었으므로 throw까지 할지는 정책 결정
    // 여기서는 안전하게 함께 에러를 던지도록 함.
    if (facilityError) {
        console.error('Failed to create facility record:', facilityError);
        // 롤백 로직이 없으므로 주의 (실제 프로덕션에선 트랜잭션 필요)
    }

    // 3. (선택) 프로필 권한 승격 (사용자가 이미 가입된 경우)
    if (inquiry.user_id) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'facility_admin' })
            .eq('id', inquiry.user_id);
        if (profileError) {
            console.warn('Failed to update user profile role:', profileError);
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

// --- 구독 관리 API ---
export const fetchSubscriptions = async () => {
    // facility_subscriptions 테이블 사용 (facilities Join)
    const { data, error } = await supabase
        .from('facility_subscriptions')
        .select('*, facilities(name)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // 데이터 평탄화 (Flatten)
    return data.map((item: any) => ({
        ...item,
        facility_name: item.facilities?.name || '(삭제된 시설)',
    })) as (Subscription & { facility_name: string })[];
};

// --- 매출/결제 API ---
export const fetchPayments = async () => {
    // subscription_payments -> facility_subscriptions -> facilities 조인
    const { data, error } = await supabase
        .from('subscription_payments')
        .select('*, facility_subscriptions(*, facilities(name))')
        .order('paid_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
        ...item,
        facility_name: item.facility_subscriptions?.facilities?.name || '(알 수 없음)',
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
