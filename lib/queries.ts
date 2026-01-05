import { supabase } from './supabaseClient';
import { Review, Reservation, Facility } from '../types';
import { Consultation, Message } from '../types/consultation';

export const getReviewsBySpace = async (spaceId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('facility_reviews')
        .select('*')
        .eq('facility_id', spaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        userName: item.author_name || '익명',
        userImage: undefined, // Add mapping if needed
        space_id: item.facility_id,
        rating: Number(item.rating),
        content: item.content,
        images: item.photos || [],
        created_at: item.created_at,
        date: new Date(item.created_at).toLocaleDateString()
    }));
};

export const getFacilityImages = async (facilityId: string) => {
    const { data, error } = await supabase
        .from('facility_images')
        .select('image_url, category, order_index')
        .eq('facility_id', facilityId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching facility images:', error);
        return [];
    }

    return data.map(img => img.image_url);
};

export const createReview = async (
    userId: string,
    spaceId: string,
    rating: number,
    content: string,
    userName: string,
    images: File[] = []
) => {
    // 1. Upload Images
    const imageUrls: string[] = [];
    for (const file of images) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('review-images')
            .upload(fileName, file);

        if (error) {
            console.error('Image upload error:', error);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('review-images')
            .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
    }

    // 2. Insert Review (Triggers handle memorial_spaces rating updates)
    const { data, error } = await supabase
        .from('facility_reviews')
        .insert({
            user_id: userId,
            facility_id: spaceId,
            rating,
            content,
            author_name: userName,
            photos: imageUrls,
            source: 'user'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteReview = async (reviewId: string, spaceId: string) => {
    const { error } = await supabase
        .from('facility_reviews')
        .delete()
        .eq('id', reviewId);

    if (error) throw error;
    // Rating updates are handled by DB triggers
};

export const checkExistingReview = async (userId: string, facilityId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('facility_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .eq('source', 'user')
        .maybeSingle();

    if (error) {
        console.error('Error checking existing review:', error);
        return false;
    }

    return !!data;
};

export const getUserReviews = async (userId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('facility_reviews')
        .select('*, facility:memorial_spaces(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user reviews:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        userName: item.author_name || '익명',
        userImage: undefined,
        space_id: item.facility_id,
        rating: Number(item.rating),
        content: item.content,
        images: item.photos || [],
        created_at: item.created_at,
        date: new Date(item.created_at).toLocaleDateString(),
        facilityName: item.facility?.name || '시설 정보 로딩 불가'
    }));
};

// 새로운 함수: 전화번호 저장
export const updateUserPhoneNumber = async (clerkId: string, phoneNumber: string) => {
    const { error } = await supabase
        .from('users')
        .update({ phone_number: phoneNumber })
        .eq('clerk_id', clerkId);

    if (error) throw error;
};

// 새로운 함수: 전화번호 조회
export const getUserPhoneNumber = async (clerkId: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('phone_number')
        .eq('clerk_id', clerkId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching phone number:', error);
        return null;
    }

    return data?.phone_number || null;
};

// --- 상담 관련 쿼리 ---

export const createConsultation = async (
    userId: string,
    spaceId: string,
    topic: string,
    facilityName: string,
    messages: Message[]
): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('ai_consultations')
            .insert({
                user_id: userId,
                space_id: spaceId,
                facility_name: facilityName,
                topic,
                messages: messages, // Automatically stringified if column is JSONB
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating consultation:', error);
            // If table doesn't exist or other error, return null to handle gracefully
            // In a real app, we might fallback to local storage or just error out.
            return null;
        }
        return data.id;
    } catch (e) {
        console.error('Create consultation exception:', e);
        return null;
    }
};

export const updateConsultation = async (
    consultationId: string,
    messages: Message[]
) => {
    try {
        const { error } = await supabase
            .from('ai_consultations')
            .update({
                messages: messages,
                updated_at: new Date().toISOString()
            })
            .eq('id', consultationId);

        if (error) console.error('Error updating consultation:', error);
    } catch (e) {
        console.error('Update consultation exception:', e);
    }
};

export const getConsultationHistory = async (userId: string): Promise<Consultation[]> => {
    try {
        const { data, error } = await supabase
            .from('ai_consultations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching consultation history:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            spaceId: item.space_id,
            facilityName: item.facility_name,
            topic: item.topic,
            messages: item.messages || [],
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at)
        }));
    } catch (e) {
        console.error('Get history exception:', e);
        return [];
    }
};

export const deleteConsultation = async (consultationId: string) => {
    const { error } = await supabase
        .from('ai_consultations')
        .delete()
        .eq('id', consultationId);
    if (error) throw error;
};

// --- 예약 관련 쿼리 ---

export const getMyReservations = async (userId: string): Promise<Reservation[]> => {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reservations:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            facilityId: item.facility_id || item.space_id,
            facilityName: item.facility_name,
            date: new Date(item.visit_date),
            timeSlot: item.time_slot,
            visitorName: item.visitor_name,
            visitorCount: item.visitor_count || 1,
            purpose: item.purpose || '방문',
            specialRequests: item.special_requests,
            status: item.status,
            paymentAmount: item.payment_amount || 0,
            paidAt: new Date(item.created_at)
        }));
    } catch (e) {
        console.error('Get reservations exception:', e);
        return [];
    }
};

export const cancelReservation = async (reservationId: string) => {
    try {
        const { error } = await supabase
            .from('reservations')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', reservationId);

        if (error) throw error;
    } catch (e) {
        console.error('Cancel reservation exception:', e);
        throw e;
    }
};

export const updateUserProfile = async (userId: string, data: { name?: string; phone_number?: string; profile_image?: string }) => {
    try {
        const { error } = await supabase
            .from('users')
            .update(data)
            .eq('clerk_id', userId);

        if (error) throw error;
    } catch (e) {
        console.error('Update profile exception:', e);
        throw e;
    }
};

// --- 업체 관리자 관련 쿼리 ---

export const getFacilityReservations = async (facilityId: string): Promise<Reservation[]> => {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('facility_id', facilityId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching facility reservations:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            facilityId: item.facility_id || item.space_id,
            facilityName: item.facility_name,
            date: new Date(item.visit_date),
            timeSlot: item.time_slot,
            visitorName: item.visitor_name,
            visitorCount: item.visitor_count || 1,
            purpose: item.purpose || '방문',
            specialRequests: item.special_requests,
            status: item.status,
            paymentAmount: item.payment_amount || 0,
            paidAt: new Date(item.created_at)
        }));
    } catch (e) {
        console.error('Get facility reservations exception:', e);
        return [];
    }
};

export const approveReservation = async (reservationId: string) => {
    try {
        const { error } = await supabase
            .from('reservations')
            .update({ status: 'confirmed', updated_at: new Date().toISOString() })
            .eq('id', reservationId);

        if (error) throw error;
    } catch (e) {
        console.error('Approve reservation exception:', e);
        throw e;
    }
};

export const rejectReservation = async (reservationId: string, reason?: string) => {
    try {
        const { error } = await supabase
            .from('reservations')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                special_requests: reason ? `거절 사유: ${reason}` : undefined
            })
            .eq('id', reservationId);

        if (error) throw error;
    } catch (e) {
        console.error('Reject reservation exception:', e);
        throw e;
    }
};

export interface UserRoleResult {
    role: string;
    error?: string;
    isError: boolean;
}

/**
 * 사용자 역할 조회
 * @param userId - Clerk User ID 또는 Supabase Auth UUID
 * @returns UserRoleResult 객체 (항상 role 문자열 포함)
 */
export const getUserRole = async (userId: string): Promise<UserRoleResult> => {
    // 입력 검증
    if (!userId || typeof userId !== 'string') {
        console.error('[getUserRole] Invalid userId:', userId);
        return { role: 'user', error: 'Invalid user ID', isError: true };
    }

    try {
        // Supabase 연결 확인
        if (!supabase) {
            console.error('[getUserRole] Supabase client not initialized');
            return { role: 'user', error: 'Database connection failed', isError: true };
        }

        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('clerk_id', userId)
            .maybeSingle(); // single() 대신 maybeSingle() 사용 (null 허용)

        // 에러 타입별 처리
        if (error) {
            console.error('[getUserRole] Database error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
            });

            // CORS 에러 감지
            if (error.message?.includes('CORS') || error.message?.includes('fetch')) {
                console.error('🚨 CORS Error detected - Check Supabase project settings');
                return {
                    role: 'user',
                    error: 'CORS error - please check Supabase configuration',
                    isError: true
                };
            }

            // 사용자 없음 (정상 케이스)
            if (error.code === 'PGRST116') {
                console.warn('[getUserRole] User not found, returning default role');
                return { role: 'user', isError: false };
            }

            // RLS 권한 에러
            if (error.code === '42501' || error.message?.includes('permission')) {
                console.error('🚨 Row Level Security error - Check RLS policies');
                return {
                    role: 'user',
                    error: 'Permission denied - RLS policy issue',
                    isError: true
                };
            }

            // 기타 데이터베이스 에러
            return {
                role: 'user',
                error: `Database error: ${error.message}`,
                isError: true
            };
        }

        // 데이터 없음 (사용자 미등록)
        if (!data) {
            console.warn('[getUserRole] No user data found for ID:', userId);
            return { role: 'user', isError: false };
        }

        // 역할 검증
        const validRoles = [
            'user', 'facility_admin', 'pending_facility_admin',
            'sangjo_hq_admin', 'sangjo_branch_manager', 'sangjo_staff',
            'super_admin'
        ];

        if (!validRoles.includes(data.role)) {
            console.error('[getUserRole] Invalid role detected:', data.role);
            return {
                role: 'user',
                error: `Invalid role: ${data.role}`,
                isError: true
            };
        }

        // 성공
        console.log('[getUserRole] Success:', { userId, role: data.role });
        return { role: data.role, isError: false };

    } catch (e) {
        // 예상치 못한 예외 처리
        console.error('[getUserRole] Unexpected exception:', e);

        // 네트워크 에러 감지
        if (e instanceof TypeError && e.message.includes('fetch')) {
            console.error('🚨 Network error - Check internet connection');
            return {
                role: 'user',
                error: 'Network error - please check connection',
                isError: true
            };
        }

        return {
            role: 'user',
            error: e instanceof Error ? e.message : 'Unknown error',
            isError: true
        };
    }
};

/**
 * 간단한 역할 조회 (호환성 유지)
 */
export const getUserRoleSimple = async (userId: string): Promise<string> => {
    const result = await getUserRole(userId);
    return result.role;
};

export const getUserFacility = async (userId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id')
            .eq('owner_user_id', userId);

        if (error) {
            console.error('Error fetching user facility:', error);
            return null;
        }

        return data && data.length > 0 ? data[0].id : null;
    } catch (e) {
        console.error('Get user facility exception:', e);
        return null;
    }
};

// --- 시설 정보 수정 ---

export const updateFacility = async (
    facilityId: string,
    updates: {
        name?: string;
        address?: string;
        phone?: string;
        description?: string;
        price_range?: string;
        prices?: Array<{ type: string; price: string }>;
        features?: string[];
        type?: string;
        religion?: string;
        price_info?: any; // B2B: 업체 직접 입력 가격 데이터
        ai_context?: string; // B2B: AI 상담용 추가 지식
    }
) => {
    try {
        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                ...updates,
                is_verified: true,
                data_source: 'partner'
            })
            .eq('id', facilityId);

        if (error) throw error;
    } catch (e) {
        console.error('Update facility exception:', e);
        throw e;
    }
};

// --- 구독 및 수익화 관련 쿼리 ---

export interface FacilitySubscription {
    id: string;
    facility_id: string;
    plan_id: string;
    status: 'active' | 'cancelled' | 'expired';
    starts_at: string;
    expires_at: string;
    sms_used: number;
    ai_chat_used: number;
    plan?: {
        name: string;
        name_en: string;
        sms_quota: number | null;
        ai_chat_quota: number | null;
        features: any;
    };
}

export const getFacilitySubscription = async (facilityId: string): Promise<FacilitySubscription | null> => {
    try {
        const { data, error } = await supabase
            .from('facility_subscriptions')
            .select(`
                *,
                plan:subscription_plans(*)
            `)
            .eq('facility_id', facilityId)
            .eq('status', 'active')
            .maybeSingle();

        if (error) {
            console.error('Error fetching subscription:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Get subscription exception:', e);
        return null;
    }
};

export const checkAiQuota = async (facilityId: string): Promise<{ allowed: boolean; remaining?: number }> => {
    const subscription = await getFacilitySubscription(facilityId);

    // 구독 정보가 없으면 무료(Free)로 간주 (Free는 계획에 따라 다름)
    if (!subscription || !subscription.plan) {
        return { allowed: false }; // 기본적으로 구독 없으면 AI 상담 불가 (또는 무료 정책 적용)
    }

    const quota = subscription.plan.ai_chat_quota;
    if (quota === null) return { allowed: true }; // 무제한

    const used = subscription.ai_chat_used || 0;
    return {
        allowed: used < quota,
        remaining: Math.max(0, quota - used)
    };
};

export const incrementAiUsage = async (facilityId: string) => {
    try {
        const { data: sub } = await supabase
            .from('facility_subscriptions')
            .select('id, ai_chat_used')
            .eq('facility_id', facilityId)
            .single();

        if (sub) {
            await supabase
                .from('facility_subscriptions')
                .update({
                    ai_chat_used: (sub.ai_chat_used || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sub.id);
        }
    } catch (e) {
        console.error('Increment usage error:', e);
    }
};

export const updateFacilitySubscription = async (facilityId: string, planId: string) => {
    try {
        // Get plan info from subscription_plans table
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('id, duration_days')
            .eq('id', planId)
            .single();

        if (!plan) throw new Error('Plan not found');

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (plan.duration_days || 30));

        const { error } = await supabase
            .from('facility_subscriptions')
            .upsert({
                facility_id: facilityId,
                plan_id: planId,
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                ai_chat_used: 0,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'facility_id'
            });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Update subscription error:', e);
        throw e;
    }
};

export const getFacilityFaqs = async (facilityId: string) => {
    try {
        // ID가 숫자인지 확인하여 Supabase BIGINT 캐스팅 오류 방지
        const isNumeric = /^\d+$/.test(facilityId);

        if (!isNumeric) {
            // 상조업체 등 문자열 ID를 사용하는 경우를 위해 company_id 컬럼 조회 시도
            const { data, error } = await supabase
                .from('facility_faqs')
                .select('*')
                .eq('company_id', facilityId)
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) {
                // company_id 컬럼이 아직 없거나 오류가 발생하면 빈 배열 반환
                console.warn('FAQ fetch skip (non-numeric ID and no company_id):', error.message);
                return [];
            }
            return data || [];
        }

        const { data, error } = await supabase
            .from('facility_faqs')
            .select('*')
            .eq('facility_id', parseInt(facilityId))
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Fetch FAQs error:', e);
        return [];
    }
};

// --- 슈퍼 관리자 기능 (입점, 소통, 구독) ---

// 1. 입점 관리 (Approvals)
export const getPendingFacilities = async () => {
    try {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, address, phone, created_at, owner_user_id')
            .eq('is_verified', false)
            .order('created_at', { ascending: false })
            .limit(50); // Prevent massive load

        if (error) throw error;

        // Map to Facility type (simplified)
        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            name: item.name,
            type: item.type,
            address: item.address,
            phone: item.phone,
            businessLicenseImage: null, // 사업자 등록증 컬럼 없음
            createdAt: item.created_at,
            ownerUserId: item.owner_user_id
        }));
    } catch (e) {
        console.error('getPendingFacilities error:', e);
        return [];
    }
};

export const approveFacility = async (facilityId: string) => {
    try {
        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString()
            })
            .eq('id', facilityId);
        if (error) throw error;
    } catch (e) {
        console.error('approveFacility error:', e);
        throw e;
    }
};

export const rejectFacility = async (facilityId: string) => {
    try {
        // 실제 삭제 또는 status='rejected' 업데이트. 여기선 삭제로 가정
        const { error } = await supabase
            .from('memorial_spaces')
            .delete()
            .eq('id', facilityId);
        if (error) throw error;
    } catch (e) {
        console.error('rejectFacility error:', e);
        throw e;
    }
};

// 2. 소통 센터 (Communication) - 공지사항
export const createNotice = async (title: string, content: string, category = 'general') => {
    try {
        const { error } = await supabase
            .from('admin_notices')
            .insert({
                title,
                content,
                category,
                author_id: (await supabase.auth.getUser()).data.user?.id
            });
        if (error) throw error;
    } catch (e) {
        console.error('createNotice error:', e);
        throw e;
    }
};

export const getNotices = async () => {
    try {
        const { data, error } = await supabase
            .from('admin_notices')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return []; // Table absence safety
        return data.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            category: n.category,
            date: new Date(n.created_at).toLocaleDateString()
        }));
    } catch (e) {
        return [];
    }
};

// 2. 소통 센터 (Communication) - 1:1 문의
export interface Inquiry {
    id: string;
    companyName: string;
    type: string;
    status: string;
    message?: string; // Content if available
    createdAt: string;
}

export const getInquiries = async (statusFilter?: string): Promise<Inquiry[]> => {
    try {
        let query = supabase
            .from('partner_inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((i: any) => ({
            id: i.id,
            companyName: i.company_name,
            type: i.type,
            status: i.status,
            createdAt: new Date(i.created_at).toLocaleDateString()
        }));
    } catch (e) {
        console.error('getInquiries error:', e);
        return [];
    }
};

// 3. 구독/매출 (Subscriptions)
export const getAllSubscriptions = async () => {
    try {
        const { data, error } = await supabase
            .from('facility_subscriptions')
            .select(`
                *,
                plan:subscription_plans(name, price),
                facility:memorial_spaces(name)
            `)
            .eq('status', 'active');

        if (error) throw error;

        return data.map((s: any) => ({
            id: s.id,
            facilityName: s.facility?.name || 'Unknown',
            planName: s.plan?.name || 'Unknown',
            expiresAt: new Date(s.end_date).toLocaleDateString(),
            price: s.plan?.price || 0
        }));
    } catch (e) {
        console.error('getAllSubscriptions error:', e);
        return [];
    }
};

// 4. Partner Inquiry Submission
export const submitPartnerApplication = async (data: {
    name: string;
    type: string;
    address: string;
    phone: string;
    managerName: string;
    email?: string;
    businessLicenseImage?: File | null;
    userId?: string;
}) => {
    try {
        // 1. Upload Image if exists (Skip for now or mock URL)
        let businessLicenseUrl = null;
        if (data.businessLicenseImage) {
            // Mock upload - in real app, use supabase.storage
            businessLicenseUrl = `https://mock-storage.com/${Date.now()}_${data.businessLicenseImage.name}`;
        }

        // 2. Insert into memorial_spaces (as unverified)
        const { error } = await supabase
            .from('memorial_spaces')
            .insert({
                name: data.name,
                type: data.type, // Ensure type matches DB enum or constraint
                address: data.address, // Required
                phone: data.phone,
                is_verified: false, // Critical for Pending list
                owner_user_id: data.userId || 'anon', // Use 'anon' if userId is undefined
                // meta info stored in description or creating separate columns if needed
                description: `담당자: ${data.managerName} (${data.email || 'No Email'})`,
                // business_license_image: businessLicenseUrl // Column removed from schema
            });

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('submitPartnerApplication error:', e);
        throw e;
    }
};
