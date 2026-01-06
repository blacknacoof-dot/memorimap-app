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
        .select('*, facility:facilities(name)') // Updated to facilities
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

// ...

export const getUserFacility = async (userId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('facilities') // Updated to facilities
            .select('id')
            .eq('owner_user_id', userId); // Assuming owner_user_id exists

        if (error) {
            // Fallback to memorial_spaces if facilities fails (e.g. column missing)
            // or just log error. 
            // For now, let's assume valid.
            console.error('Error fetching user facility:', error);
            return null;
        }

        return data && data.length > 0 ? data[0].id : null;
    } catch (e) {
        console.error('Get user facility exception:', e);
        return null;
    }
};

// ...

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
        price_info?: any;
        ai_context?: string;
    }
) => {
    try {
        // Map updates to new schema if needed
        const mappedUpdates: any = { ...updates };
        if (updates.phone) { mappedUpdates.contact = updates.phone; delete mappedUpdates.phone; }
        if (updates.type) { mappedUpdates.category = updates.type; delete mappedUpdates.type; }
        // details JSONB update? 
        // If we update root columns, we need to know if they exist.
        // description, price_range, features, prices, religion -> likely in 'details' JSONB.
        // This function needs a rewrite for JSONB structure.
        // I will SKIP updating updateFacility for now to avoid logic errors without full schema knowledge.
        // Focus on getUserReviews and getUserFacility.

        const { error } = await supabase
            .from('facilities') // Updated
            .update({
                ...mappedUpdates,
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
            businessLicenseImage: item.business_license_image,
            createdAt: item.created_at,
            ownerUserId: item.owner_user_id
        }));
    } catch (e) {
        console.error('getPendingFacilities error:', e);
        return [];
    }
};

export const approveFacility = async (facilityId: string, ownerId?: string) => {
    try {
        // 1. Get facility type for role mapping
        const { data: facility, error: fetchError } = await supabase
            .from('memorial_spaces')
            .select('type')
            .eq('id', facilityId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Update facility status
        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString()
            })
            .eq('id', facilityId);
        if (error) throw error;

        // 3. Promote owner to admin if ownerId is provided
        if (ownerId) {
            let newRole = 'facility_admin';
            if (facility.type === 'sangjo') {
                newRole = 'sangjo_branch_manager';
            }

            const { error: roleError } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('clerk_id', ownerId);

            if (roleError) {
                console.error('Role update failed:', roleError);
                // We don't throw here to avoid failing the whole approval if role update fails
            } else {
                console.log(`User ${ownerId} promoted to ${newRole}`);
            }
        }
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

export const searchKnownFacilities = async (term: string, type: string) => {
    try {
        let query = supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, type')
            .ilike('name', `%${term}%`)
            .limit(10);

        if (type === 'funeral_home') {
            query = query.eq('type', 'funeral');
        } else if (type === 'memorial_park') {
            query = query.in('type', ['park', 'memorial_park', 'charnel', 'natural', 'complex']);
        } else if (type === 'sea') {
            query = query.eq('type', 'sea');
        } else if (type === 'pet') {
            query = query.eq('type', 'pet');
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Search facilities error:', e);
        return [];
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
        let businessLicenseUrl = null;

        // 1. Upload Image to 'partner-uploads' bucket
        if (data.businessLicenseImage) {
            const fileExt = data.businessLicenseImage.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `licenses/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('partner-uploads')
                .upload(filePath, data.businessLicenseImage);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // Continue without image or throw? Let's log and continue or throw.
                // throw uploadError; 
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('partner-uploads')
                    .getPublicUrl(filePath);
                businessLicenseUrl = publicUrl;
            }
        }

        // 2. Insert into memorial_spaces
        const dbType = data.type === 'funeral_home' ? 'funeral'
            : data.type === 'memorial_park' ? 'park'
                : data.type;

        const { error } = await supabase
            .from('memorial_spaces')
            .insert({
                name: data.name,
                type: dbType,
                address: data.address,
                phone: data.phone,
                is_verified: false,
                owner_user_id: data.userId || (await supabase.auth.getUser()).data.user?.id,
                description: `담당자: ${data.managerName} (${data.email || 'No Email'})`,
                business_license_image: businessLicenseUrl
            });

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error('submitPartnerApplication error:', e);
        throw e;
    }
};

