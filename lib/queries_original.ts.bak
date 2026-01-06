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
            visitorPhone: item.visitor_phone,
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

        return data.map((item: any) => {
            let visitorPhone = item.visitor_phone || item.phone || item.contact;

            // Fallback: Parse from special_requests if missing
            if (!visitorPhone && item.special_requests) {
                const match = item.special_requests.match(/(?:신청자연락처|보호자연락처|연락처|비상연락):\s*([\d\s-]+)/);
                if (match) {
                    visitorPhone = match[1].trim();
                } else {
                    // Look for any 010 or 02-070 number (heuristic)
                    const fallbackMatch = item.special_requests.match(/(0\d{1,2}[\d\s-]{7,12})/);
                    if (fallbackMatch) visitorPhone = fallbackMatch[1].trim();
                }
            }

            return {
                id: item.id,
                facilityId: item.facility_id || item.space_id,
                facilityName: item.facility_name,
                date: new Date(item.visit_date),
                timeSlot: item.time_slot,
                visitorName: item.visitor_name,
                visitorPhone: visitorPhone,
                visitorCount: item.visitor_count || 1,
                purpose: item.purpose || '방문',
                specialRequests: item.special_requests,
                status: item.status,
                paymentAmount: item.payment_amount || 0,
                paidAt: new Date(item.created_at),
                deceasedName: item.deceased_name,
                deceasedStatus: item.deceased_status,
                relationship: item.relationship
            };
        });
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
        operating_hours?: string;
        gallery_images?: string[];
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

export const uploadFacilityImage = async (file: File) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('facility-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('facility-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
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
        // Hardcoded plan UUIDs from DB to bypass query issues
        const planUuidMap: Record<string, string> = {
            'free': 'cef38952-4010-4720-951c-192a154006dc',
            'basic': '300d644d-0d43-4b18-acc9-b2a8429e6aa6',
            'premium': '06ef1688-38ff-41fc-917e-47a5879da51a',
            'enterprise': '92f50732-b5eb-4e3e-9ea8-d3117b92a9e7'
        };

        // Get UUID from map or use planId directly if it's already a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
        const actualPlanId = isUuid ? planId : (planUuidMap[planId] || planId);

        if (!actualPlanId || (!isUuid && !planUuidMap[planId])) {
            throw new Error(`Plan not found: ${planId}`);
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);  // Default 30 days

        const { error } = await supabase
            .from('facility_subscriptions')
            .upsert({
                facility_id: facilityId,
                plan_id: actualPlanId,
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

export const updateSangjoSubscription = async (clerkId: string, planId: string) => {
    try {
        const { error } = await supabase
            .from('sangjo_dashboard_users')
            .update({
                plan_id: planId
                // created_at or updated_at handling if schema allows
            })
            .eq('id', clerkId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Update Sangjo subscription error:', e);
        throw e;
    }
};

export const getSangjoSubscription = async (clerkId: string) => {
    try {
        const { data, error } = await supabase
            .from('sangjo_dashboard_users')
            .select('plan_id')
            .eq('id', clerkId)
            .single();

        if (error) return null;
        return data;
    } catch (e) {
        console.error('Get Sangjo sub error:', e);
        return null;
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
 
 / /   - - -   ? J�A�  ?a� 1uJ�  rnլ��  ( ? ���,   ? ��;�,   �cIƸ)   - - -  
  
 / /   1 .   ? ���  ?a� 1u? ( A p p r o v a l s )  
 e x p o r t   c o n s t   g e t P e n d i n g F a c i l i t i e s   =   a s y n c   ( )   = >   {  
         t r y   {  
                 c o n s t   {   d a t a ,   e r r o r   }   =   a w a i t   s u p a b a s e  
                         . f r o m ( ' m e m o r i a l _ s p a c e s ' )  
                         . s e l e c t ( ' * ' )  
                         . e q ( ' i s _ v e r i f i e d ' ,   f a l s e )  
                         . o r d e r ( ' c r e a t e d _ a t ' ,   {   a s c e n d i n g :   f a l s e   } ) ;  
  
                 i f   ( e r r o r )   t h r o w   e r r o r ;  
                  
                 / /   M a p   t o   F a c i l i t y   t y p e   ( s i m p l i f i e d )  
                 r e t u r n   ( d a t a   | |   [ ] ) . m a p ( ( i t e m :   a n y )   = >   ( {  
                           i d :   i t e m . i d ? . t o S t r i n g ( ) ,  
                           n a m e :   i t e m . n a m e ,  
                           t y p e :   i t e m . t y p e ,  
                           a d d r e s s :   i t e m . a d d r e s s ,  
                           p h o n e :   i t e m . p h o n e ,  
                           b u s i n e s s L i c e n s e I m a g e :   i t e m . b u s i n e s s _ l i c e n s e _ i m a g e   | |   n u l l ,   / /   ? J��? ? ? E�	���?  
                           c r e a t e d A t :   i t e m . c r e a t e d _ a t ,  
                           o w n e r U s e r I d :   i t e m . o w n e r _ u s e r _ i d  
                 } ) ) ;  
         }   c a t c h   ( e )   {  
                 c o n s o l e . e r r o r ( ' g e t P e n d i n g F a c i l i t i e s   e r r o r : ' ,   e ) ;  
                 r e t u r n   [ ] ;  
         }  
 } ;  
  
 e x p o r t   c o n s t   a p p r o v e F a c i l i t y   =   a s y n c   ( f a c i l i t y I d :   s t r i n g )   = >   {  
         t r y   {  
                 c o n s t   {   e r r o r   }   =   a w a i t   s u p a b a s e  
                         . f r o m ( ' m e m o r i a l _ s p a c e s ' )  
                         . u p d a t e ( {    
                                 i s _ v e r i f i e d :   t r u e ,  
                                 v e r i f i e d _ a t :   n e w   D a t e ( ) . t o I S O S t r i n g ( )  
                         } )  
                         . e q ( ' i d ' ,   f a c i l i t y I d ) ;  
                 i f   ( e r r o r )   t h r o w   e r r o r ;  
         }   c a t c h   ( e )   {  
                 c o n s o l e . e r r o r ( ' a p p r o v e F a c i l i t y   e r r o r : ' ,   e ) ;  
                 t h r o w   e ;  
         }  
 } ;  
  
 e x p o r t   c o n s t   r e j e c t F a c i l i t y   =   a s y n c   ( f a c i l i t y I d :   s t r i n g )   = >   {  
         t r y   {  
                 / /   ? |1#�  ? ? #�  ? .���  s t a t u s = ' r e j e c t e d '   ? ��2�? �ô.   ? H��? ? ? ? #��o? �Z� ? ?  
                 c o n s t   {   e r r o r   }   =   a w a i t   s u p a b a s e  
                         . f r o m ( ' m e m o r i a l _ s p a c e s ' )  
                         . d e l e t e ( )  
                         . e q ( ' i d ' ,   f a c i l i t y I d ) ;  
                 i f   ( e r r o r )   t h r o w   e r r o r ;  
         }   c a t c h   ( e )   {  
                 c o n s o l e . e r r o r ( ' r e j e c t F a c i l i t y   e r r o r : ' ,   e ) ;  
                 t h r o w   e ;  
         }  
 } ;  
  
 / /   2 .   ? ��;�  ? ��c�  ( C o m m u n i c a t i o n )   -   (`��? ? KF� 
 e x p o r t   c o n s t   c r e a t e N o t i c e   =   a s y n c   ( t i t l e :   s t r i n g ,   c o n t e n t :   s t r i n g ,   c a t e g o r y   =   ' g e n e r a l ' )   = >   {  
         t r y   {  
                 c o n s t   {   e r r o r   }   =   a w a i t   s u p a b a s e  
                         . f r o m ( ' a d m i n _ n o t i c e s ' )  
                         . i n s e r t ( {  
                                 t i t l e ,  
                                 c o n t e n t ,  
                                 c a t e g o r y ,  
                                 a u t h o r _ i d :   ( a w a i t   s u p a b a s e . a u t h . g e t U s e r ( ) ) . d a t a . u s e r ? . i d  
                         } ) ;  
                 i f   ( e r r o r )   t h r o w   e r r o r ;  
         }   c a t c h   ( e )   {  
                 c o n s o l e . e r r o r ( ' c r e a t e N o t i c e   e r r o r : ' ,   e ) ;  
                 t h r o w   e ;  
         }  
 } ;  
  
 e x p o r t   c o n s t   g e t N o t i c e s   =   a s y n c   ( )   = >   {  
         t r y   {  
                 c o n s t   {   d a t a ,   e r r o r   }   =   a w a i t   s u p a b a s e  
                         . f r o m ( ' a d m i n _ n o t i c e s ' )  
                         . s e l e c t ( ' * ' )  
                         . o r d e r ( ' c r e a t e d _ a t ' ,   {   a s c e n d i n g :   f a l s e   } ) ;  
                 i f   ( e r r o r )   r e t u r n   [ ] ;   / /   T a b l e   a b s e n c e   s a f e t y  
                 r e t u r n   d a t a . m a p ( ( n :   a n y )   = >   ( {  
                         i d :   n . i d ,  
                         t i t l e :   n . t i t l e ,  
                         c o n t e n t :   n . c o n t e n t ,  
                         c a t e g o r y :   n . c a t e g o r y ,  
                         d a t e :   n e w   D a t e ( n . c r e a t e d _ a t ) . t o L o c a l e D a t e S t r i n g ( )  
                 } ) ) ;  
         }   c a t c h   ( e )   {  
                 r e t u r n   [ ] ;  
         }  
 } ;  
  
 / /   2 .   ? ��;�  ? ��c�  ( C o m m u n i c a t i o n )   -   1 : 1   ������ 
 e x p o r t   i n t e r f a c e   I n q u i r y   {  
         i d :   s t r i n g ;  
         c o m p a n y N a m e :   s t r i n g ;  
         t y p e :   s t r i n g ;  
         s t a t u s :   s t r i n g ;  
         m e s s a g e ? :   s t r i n g ;   / /   C o n t e n t   i f   a v a i l a b l e  
         c r e a t e d A t :   s t r i n g ;  
 }  
  
 e x p o r t   c o n s t   g e t I n q u i r i e s   =   a s y n c   ( s t a t u s F i l t e r ? :   s t r i n g ) :   P r o m i s e < I n q u i r y [ ] >   = >   {  
         t r y   {  
                 l e t   q u e r y   =   s u p a b a s e  
                         . f r o m ( ' p a r t n e r _ i n q u i r i e s ' )  
                         . s e l e c t ( ' * ' )  
                         . o r d e r ( ' c r e a t e d _ a t ' ,   {   a s c e n d i n g :   f a l s e   } ) ;  
                          
                 i f   ( s t a t u s F i l t e r   & &   s t a t u s F i l t e r   ! = =   ' a l l ' )   {  
                         q u e r y   =   q u e r y . e q ( ' s t a t u s ' ,   s t a t u s F i l t e r ) ;  
                 }  
  
                 c o n s t   {   d a t a ,   e r r o r   }   =   a w a i t   q u e r y ;  
                 i f   ( e r r o r )   t h r o w   e r r o r ;  
  
                 r e t u r n   d a t a . m a p ( ( i :   a n y )   = >   ( {  
                         i d :   i . i d ,  
                         c o m p a n y N a m e :   i . c o m p a n y _ n a m e ,  
                         t y p e :   i . t y p e ,  
                         s t a t u s :   i . s t a t u s ,  
                         c r e a t e d A t :   n e w   D a t e ( i . c r e a t e d _ a t ) . t o L o c a l e D a t e S t r i n g ( )  
                 } ) ) ;  
         }   c a t c h   ( e )   {  
                 c o n s o l e . e r r o r ( ' g e t I n q u i r i e s   e r r o r : ' ,   e ) ;  
                 r e t u r n   [ ] ;  
         }  
 } ;  
  
 / /   3 .   �cIƸ/ ��|1g�  ( S u b s c r i p t i o n s )  
 e x p o r t   c o n s t   g e t A l l S u b s c r i p t i o n s   =   a s y n c   ( )   = >   {  
         t r y   {  
                 c o n s t   {   d a t a ,   e r r o r   }   =   a w a i t   s u p a b a s e  
                         . f r o m ( ' f a c i l i t y _ s u b s c r i p t i o n s ' )  
                         . s e l e c t ( `  
                                 * ,  
                                 p l a n : s u b s c r i p t i o n _ p l a n s ( n a m e ) ,  
                                 f a c i l i t y : m e m o r i a l _ s p a c e s ( n a m e )  
                         ` )  
                         . e q ( ' s t a t u s ' ,   ' a c t i v e ' ) ;  
                          
                 i f   ( e r r o r )   t h r o w   e r r o r ;  
  
                 r e t u r n   d a t a . m a p ( ( s :   a n y )   = >   ( {  
                         i d :   s . i d ,  
                         f a c i l i t y N a m e :   s . f a c i l i t y ? . n a m e   | |   ' U n k n o w n ' ,  
                         p l a n N a m e :   s . p l a n ? . n a m e   | |   ' U n k n o w n ' ,  
                         e x p i r e s A t :   n e w   D a t e ( s . e n d _ d a t e ) . t o L o c a l e D a t e S t r i n g ( ) ,  
                         p r i c e :   0   / /   M o c k   o r   j o i n   f r o m   p l a n   p r i c e  
                 } ) ) ;  
         }   c a t c h   ( e )   {  
                 c o n s o l e . e r r o r ( ' g e t A l l S u b s c r i p t i o n s   e r r o r : ' ,   e ) ;  
                 r e t u r n   [ ] ;  
         }  
 } ;  
 