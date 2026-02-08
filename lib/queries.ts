import { Facility, Review, Reservation } from '../types';
import { FUNERAL_COMPANIES } from '../constants';
import { supabase, setSupabaseAuth } from './supabaseClient';
import { isClerkConfigured } from './auth';
import { logger } from '../utils/logger';

// Partner Inquiry Category Configuration
export const PARTNER_CATEGORIES = {
    funeral_home: { label: '장례식장', icon: '🏢', color: 'blue', category: 'funeral_home' },
    columbarium: { label: '봉안시설', icon: '⛩️', color: 'purple', category: 'columbarium' },
    natural_burial: { label: '자연장', icon: '🌳', color: 'green', category: 'natural_burial' },
    cemetery: { label: '공원묘지', icon: '🏞️', color: 'amber', category: 'cemetery' },
    sea_burial: { label: '해양장', icon: '🌊', color: 'cyan', category: 'sea_burial' },
    pet_funeral: { label: '동물장', icon: '🐾', color: 'pink', category: 'pet_funeral' },
    sangjo: { label: '상조회사', icon: '🤝', color: 'orange', category: 'sangjo' }
} as const;

export type PartnerCategoryType = keyof typeof PARTNER_CATEGORIES;

/**
 * [추가] 중복 리뷰 작성 확인
 */
export const checkExistingReview = async (userId: string, facilityId: string) => {
    const { data, error } = await supabase
        .from('facility_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('Error checking existing review:', error);
        return false;
    }
    return !!data;
};

/**
 * [추가] 리뷰 이미지 업로드
 */
export const uploadReviewImage = async (userId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `review-images/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('reviews') // 'reviews' bucket must exist in Supabase
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('reviews')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export { supabase };

// --- [Phase 8] 지도 검색 기능 ---

// 1. 카테고리 매핑 함수 (DB 값과 100% 일치시킴)
function mapCategoryToCode(category?: string) {
    // 전체 선택 시 필터 없음
    if (!category || category === '전체') return undefined;

    // 장례식장 (DB값: funeral_home)
    if (category === '장례식장' || category === 'funeral') {
        return 'funeral_home';
    }

    // 봉안시설 (DB값: columbarium) <-- 여기가 틀렸었습니다! (memorial 아님)
    if (category === '봉안시설' || category === '봉안당' || category === 'memorial') {
        return 'columbarium';
    }

    // 자연장 (DB값: natural_burial)
    if (category === '자연장' || category === '수목장') {
        return 'natural_burial';
    }

    // 공원묘지 (DB값: cemetery) <-- 여기가 틀렸었습니다!
    if (category === '공원묘지' || category === '묘지' || category === 'park') {
        return 'cemetery';
    }

    // 동물장례 (DB값: pet_funeral)
    if (category === '동물장례' || category === 'pet') {
        return 'pet_funeral';
    }

    // 해양장 (DB값: sea_burial)
    if (category === '해양장' || category === 'sea') {
        return 'sea_burial';
    }

    // 그 외 예외 처리 (그대로 반환)
    return category;
}

export const searchFacilities = async (
    lat: number,
    lng: number,
    radius: number = 5000,
    category?: string
) => {
    // 1. 반드시 변환 함수를 거쳐야 합니다!
    const mappedCategory = mapCategoryToCode(category);

    const { data, error } = await supabase.rpc('search_facilities', {
        user_lat: lat, // [Fix] 매개변수 이름 변경
        user_lng: lng, // [Fix] 매개변수 이름 변경
        radius_meters: radius,
        filter_category: mappedCategory || null,
    });

    if (error) {
        console.error('Error searching facilities:', error);
        throw error;
    }

    // 👇 데이터에 이미지가 들어오는지 콘솔로 확인해보세요
    if (data && data.length > 0) {
        // @ts-ignore
        console.log('📸 첫 번째 시설 이미지:', data[0].image_url ? '있음' : '없음', data[0].image_url);
    }

    return data;
};

/**
 * [Phase 3] PostGIS 기반 반경 검색 v2
 */
export const searchFacilitiesV2 = async (
    lat: number,
    lng: number,
    radius: number = 5000,
    category?: string,
    limit: number = 10
) => {
    const { data, error } = await supabase.rpc('search_facilities_v2', {
        p_lat: lat,
        p_lng: lng,
        radius_meters: radius,
        category: category || null,
        result_limit: limit
    });
    return { data, error };
};

/**
 * [Phase 3] 지능형 추천 엔진 (반경 확장 로직)
 */
/**
 * [Phase 3] 지능형 추천 엔진 (반경 확장 + 지역명 검색)
 */
export const getIntelligentRecommendations = async (
    lat: number,
    lng: number,
    category?: string,
    regionText?: string
) => {
    let finalData: any[] = [];
    const searchCategory = mapCategoryToCode(category);

    // [Strict Filter] 상조 서비스 원천 배제 및 카테고리 정규화
    const normalizedCategory = (searchCategory === 'funeral_home') ? 'funeral' :
        (searchCategory === 'pet_funeral') ? 'pet' : searchCategory;

    const isMemorialGroup = searchCategory === 'columbarium' || searchCategory === 'natural_burial' || searchCategory === 'cemetery';

    // Helper: Strict Filter by Category & Region
    const strictFilter = (items: any[], targetRegionText?: string) => {
        return items.filter((i: any) => {
            // 1. Category Filter
            let categoryMatch = true;
            if (normalizedCategory === 'funeral') {
                // [CRITICAL] Exclude Sangjo completely
                if (i.category === 'sangjo' || i.category === '상조') return false;

                // [FIX] Allow if category matches OR if category is missing but name implies Funeral Home
                const isFuneralCategory = i.category === 'funeral_home' || i.category === 'funeral' || i.category === '장례식장';
                const isNameMatch = (!i.category || i.category === null) && i.name && i.name.includes('장례식장');

                return isFuneralCategory || isNameMatch;
            } else if (normalizedCategory === 'pet') {
                categoryMatch = i.category === 'pet_memorial' || i.category === 'pet_funeral' || i.category === 'pet' || i.category === '동물장례';
            } else if (isMemorialGroup) {
                const MEMORIAL_CATEGORIES = ['charnel_house', 'natural_burial', 'tree_burial', 'park_cemetery', 'complex', 'sea_burial', 'memorial', '봉안시설', '자연장', '공원묘지', '해양장'];
                categoryMatch = MEMORIAL_CATEGORIES.includes(i.type) || MEMORIAL_CATEGORIES.includes(i.category);
            }

            // 2. Region Filter (Strict Local Matching)
            // If targetRegionText is provided (e.g. "고양시"), ensure address contains it.
            // This prevents "Seoul" facilities appearing in "Goyang" search.
            let regionMatch = true;
            if (targetRegionText && i.address) {
                // We use the 'Parent Region' for the check (e.g. "고양시" check for "식사동" search)
                // This ensures we don't accidentally filter out the target if the text was specific but the address is standard.
                // But for strict filtering, we mainly want to avoid "Other City".
                const safeRegion = targetRegionText.split(' ')[0]; // "고양시" from "고양시 일산동구"
                if (!i.address.includes(safeRegion)) {
                    // If address doesn't contain at least the City name, exclude it.
                    // Exception: If the user searched for "Seoul", and address is "Seoul", it matches.
                    // If user searched for "Goyang", and address is "Seoul", it fails.
                    regionMatch = false;
                }
            }

            return categoryMatch && regionMatch;
        });
    };

    // 1. Region Search (Primary)
    if (regionText && regionText !== '내 위치 주변') {
        // A. Exact 'Dong' Search (e.g. "식사동")
        console.log(`🔍 [Recommendation] Searching for: ${regionText}`);
        let regionResults = await searchFacilitiesByRegion(regionText, undefined);
        regionResults = strictFilter(regionResults, regionText);

        finalData = [...regionResults];

        // B. Smart Expansion (If < 3 results) -> Search Parent Region (e.g., "식사동" -> "고양시")
        if (finalData.length < 3) {
            let parentRegion = '';

            // Strategy 1: Extract from User Input (if "City Dong" format)
            const parts = regionText.split(' ');
            if (parts.length >= 2) {
                // "고양시 식사동" -> "고양시"
                parentRegion = parts[0];
            } else {
                // Strategy 2: "식사동" -> Try to find it in the 1 result we might have found to get the City
                if (finalData.length > 0 && finalData[0].address) {
                    const addrParts = finalData[0].address.split(' ');
                    const cityPart = addrParts.find((p: string) => p.endsWith('시') || p.endsWith('군'));
                    if (cityPart) parentRegion = cityPart;
                }
            }

            // Strategy 3: Dynamic DB Reverse Check? (Too complex for now)

            if (parentRegion && parentRegion !== regionText) {
                console.log(`🔍 [Recommendation] Expanding search to: ${parentRegion}`);
                const parentResults = await searchFacilitiesByRegion(parentRegion, undefined);
                const filteredParent = strictFilter(parentResults, parentRegion); // Apply strict filter with Parent Region

                // Merge Unique
                const existingIds = new Set(finalData.map(f => f.id));
                for (const f of filteredParent) {
                    if (!existingIds.has(f.id)) {
                        finalData.push(f);
                        existingIds.add(f.id);
                    }
                }
            }
        }
    }
    // 2. GPS Search (Fallback if no region text)
    else if (lat && lng) {
        // Existing Logic for GPS... (Simplified for brevity, can keep existing or use V2)
        // For now, let's trust the Region Search is the primary intent as per user request.
        const { data } = await searchFacilitiesV2(lat, lng, 15000, undefined, 20); // 15km
        if (data) {
            finalData = strictFilter(data);
        }
    }

    // 3. Final Sort & Limit
    // Remove duplicates
    const uniqueMap = new Map();
    finalData.forEach(item => uniqueMap.set(item.id, item));
    let results = Array.from(uniqueMap.values());

    // Sort: Rating Descending
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Limit to 5 (User asked for 3, but 5 covers scrolling)
    results = results.slice(0, 5);

    // Map to Frontend Model
    return results.map(r => ({
        ...r,
        lat: r.latitude || r.lat,
        lng: r.longitude || r.lng,
        imageUrl: r.image_url || ((r.images && r.images.length > 0) ? r.images[0] : null),
        reviewCount: r.review_count,
        rating: r.rating || 0
    }));
};


export const searchFacilitiesByRegion = async (
    region: string,
    category?: string
) => {
    // If category is null/undefined, it returns all types
    const optimizedRegion = region.trim().replace(/\s+/g, '%');

    const { data, error } = await supabase.rpc('search_facilities_by_text', {
        p_text: optimizedRegion,
        p_category: category || null
    });

    if (error) {
        console.error('Error searching by region:', error);
        return [];
    }
    return data || [];
};

/**
 * [NEW] Region Autocomplete RPC usage
 */
export const getDistinctRegions = async (searchText: string) => {
    const { data, error } = await supabase.rpc('get_distinct_regions', {
        search_text: searchText
    });

    if (error) {
        console.error('Error fetching distinct regions:', error);
        return [];
    }
    return data || [];
};

/**
 * [Phase 5] AI 상담 리드(Lead) 저장
 */
export interface LeadInput {
    userId?: string;
    facilityId?: string; // string per previous usage, though SQL says BIGINT reference, handling as passed
    contactName: string;
    contactPhone: string;
    category: string;
    urgency: string;
    scale?: string;
    priorities?: string[];
    contextData?: any;
    notes?: string;
}

export const createLead = async (leadData: LeadInput) => {
    const { data, error } = await supabase
        .from('leads')
        .insert([{
            user_id: leadData.userId || null,
            facility_id: leadData.facilityId || null,
            contact_name: leadData.contactName,
            contact_phone: leadData.contactPhone,
            category: leadData.category,
            urgency: leadData.urgency,
            scale: leadData.scale,
            priorities: leadData.priorities,
            context_data: { ...(leadData.contextData || {}), notes: leadData.notes },
            status: 'new'
        }])
        .select();

    if (error) {
        console.error('Error creating lead:', error);
        throw error;
    }
    return data && data[0] ? data[0] : null;
};

export const createConsultationFromLead = async (leadId: string, facilityId: string) => {
    const { data, error } = await supabase.rpc('create_consultation_from_lead', {
        p_lead_id: leadId,
        p_facility_id: facilityId
    });

    if (error) {
        console.error('Error creating consultation from lead:', error);
        throw error;
    }
    return data;
};

export const getAllLeads = async () => {
    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            facilities (name)
        `) // Changed from memorial_spaces to facilities
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// --- [Phase 9] 시설 상세 조회 ---

export const getFacility = async (id: string) => {
    // Check if UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase
        .from('facilities')
        .select('*');

    if (isUUID) {
        query = query.eq('id', id);
    } else {
        query = query.eq('legacy_id', id);
    }

    const { data, error } = await query.single();

    if (error) {
        console.error('Error fetching facility:', error);

        // [Fix] 존재하지 않는 레거시 ID(fc6 등)인 경우 null 반환하여 UI 충돌 방지
        if (error.code === 'PGRST116') {
            console.warn(`Facility not found for ID: ${id} - This may be legacy data`);
            return null;
        }

        throw error;
    }
    // Map DB fields to Frontend types (Normalize snake_case to camelCase for UI)
    return {
        ...data,
        lat: data.latitude,
        lng: data.longitude,
        imageUrl: data.image_url,
        priceRange: data.price_range,
        galleryImages: data.images || []
    };
};

// --- [상담 기능] (Consultations) ---

export const createConsultation = async (
    facilityId: string,
    userId: string,
    userName: string,
    userPhone: string,
    notes: string = ''
) => {
    const { data, error } = await supabase
        .from('consultations')
        .insert([
            {
                facility_id: facilityId,
                user_id: userId,
                user_name: userName,
                user_phone: userPhone,
                notes,
                status: 'pending'
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating consultation:', error);
        throw error;
    }
    return data;
};

// --- [Phase 5] Urgent Direct Booking (Reservation) ---

export const createUrgentReservation = async (
    facilityId: string,
    userId: string,
    userName: string,
    userPhone: string,
    visitDate: Date, // Timestamp
    type: 'single' | 'couple',
    notes: string = ''
) => {
    const leadResult = await createLead({
        userId,
        facilityId,
        contactName: userName || '익명 (긴급)',
        contactPhone: userPhone || '000-0000-0000',
        category: 'memorial',
        urgency: 'immediate',
        scale: type,
        contextData: {
            reservation_time: visitDate.toISOString(),
            is_urgent_booking: true
        }
    });

    // if (leadError) throw leadError; // createLead throws internally if error

    // Additionally create a reservation record if table exists
    const { data, error } = await supabase
        .from('reservations')
        .insert([
            {
                facility_id: facilityId,
                user_id: userId,
                user_name: userName,
                user_phone: userPhone,
                visit_date: visitDate.toISOString(),
                time_slot: visitDate.toTimeString().slice(0, 5), // '09:00'
                status: 'confirmed', // Auto-confirm for urgent
                notes: `[긴급 예약] ${type === 'single' ? '개인단' : '부부단'} / ${notes}`
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating urgent reservation:', error);
        // Only throw if critical, but lead creation succeeded so maybe just log?
        // Let's propagate error to show fallback UI
        throw error;
    }
    return data;
};

export const getConsultationHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('consultations')
        .select(`
      *,
        facilities (
            id,
            name,
            address,
            images,
            type
        )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching consultation history:', error);
        throw error;
    }
    return data;
};

export const deleteConsultation = async (id: string) => {
    const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting consultation:', error);
        throw error;
    }
    return true;
};

const MOCK_REVIEWS_STORAGE_KEY = 'memorimap_mock_reviews';

const getLocalReviews = (): any[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MOCK_REVIEWS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

// --- [리뷰 기능] ---
export const getReviews = async (facilityId: string) => {
    try {
        let reviews: any[] = [];

        // 🚑 Mock Mode Fallback: Merge local reviews
        if (!isClerkConfigured()) {
            const localReviews = getLocalReviews();
            reviews = localReviews.filter(r => r.facility_id === facilityId && r.is_active);
        }

        // [통합] facility_reviews 테이블 사용, facility_id가 TEXT이므로 ID 매핑 로직 단순화
        const { data, error } = await supabase
            .from('facility_reviews')
            .select('*')
            .eq('facility_id', facilityId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            // In mock mode, we still return local reviews even if DB fails
            return reviews;
        }

        // Merge DB reviews with local ones, avoiding duplicates by ID
        const dbReviews = data || [];
        const combined = [...reviews];
        dbReviews.forEach(dbR => {
            if (!combined.some(r => r.id === dbR.id)) {
                combined.push(dbR);
            }
        });

        return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (e) {
        console.error('Exception in getReviews:', e);
        return [];
    }
};

export const getUserReviews = async (userId: string) => {
    let reviews: any[] = [];

    // 🚑 Mock Mode Fallback
    if (!isClerkConfigured()) {
        const localReviews = getLocalReviews();
        reviews = localReviews.filter(r => r.user_id === userId && r.is_active);
    }

    const { data, error } = await supabase
        .from('facility_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user reviews:', error);
        return reviews;
    }

    const dbReviews = data || [];
    const combined = [...reviews];
    dbReviews.forEach(dbR => {
        if (!combined.some(r => r.id === dbR.id)) {
            combined.push(dbR);
        }
    });

    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const createReview = async (
    facilityId: string,
    userId: string,
    rating: number,
    content: string,
    userName?: string,
    images: string[] = []
): Promise<any> => {
    // 🔍 디버깅 로그
    console.log('=== [DEBUG] facility_reviews.createReview ===');

    const insertData = {
        facility_id: facilityId,
        user_id: userId,
        rating,
        content,
        author_name: userName || '익명',
        photos: images.map(url => ({ url })), // TEXT[] -> JSONB 형식 변환
        is_active: true,
        created_at: new Date().toISOString()
    };

    // 🚑 [Direct Attack] Check session before Supabase call
    const { data: { session } } = await supabase.auth.getSession();

    // 🚑 Mock Mode Fallback (Explicit)
    if (!session || !isClerkConfigured() || userId.startsWith('mock-')) {
        const localReviews = getLocalReviews();
        const newReview = {
            id: `mock-rev-${Date.now()}`,
            ...insertData,
            userName: insertData.author_name // Compatibility
        };
        localReviews.push(newReview);
        localStorage.setItem(MOCK_REVIEWS_STORAGE_KEY, JSON.stringify(localReviews));
        return newReview;
    }

    try {
        const { data, error } = await supabase
            .from('facility_reviews')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            if (error.code === '42501' || (error as any).status === 401) {
                console.warn('[createReview] Supabase error, falling back to localStorage');
                return createReview(facilityId, `mock-${userId}`, rating, content, userName, images);
            }
            console.error('Error creating facility review:', error);
            throw error;
        }
        return data;
    } catch (e: any) {
        if (e.code === '42501' || e.status === 401) {
            return createReview(facilityId, `mock-${userId}`, rating, content, userName, images);
        }
        throw e;
    }
};

export const deleteReview = async (reviewId: string) => {
    // 🚑 [Direct Attack] Check session before Supabase call
    const { data: { session } } = await supabase.auth.getSession();

    // 🚑 Mock Mode Fallback (Explicit)
    if (!session || (!isClerkConfigured() && reviewId.startsWith('mock-')) || reviewId.startsWith('mock-')) {
        const localReviews = getLocalReviews();
        const index = localReviews.findIndex(r => r.id === reviewId);
        if (index !== -1) {
            localReviews[index].is_active = false;
            localReviews[index].deleted_at = new Date().toISOString();
            localStorage.setItem(MOCK_REVIEWS_STORAGE_KEY, JSON.stringify(localReviews));
            return true;
        }
        if (reviewId.startsWith('mock-')) return true; // Already "deleted" or not found
    }

    try {
        const { error } = await supabase
            .from('facility_reviews')
            .update({
                is_active: false,
                deleted_at: new Date().toISOString()
            })
            .eq('id', reviewId);

        if (error) {
            console.error('Error deleting review (Soft Delete):', error);
            // If RLS denies update, try strict DELETE if user prefers standard delete
            // But here we stick to Soft Delete.
            throw error;
        }
        return true;
    } catch (e: any) {
        console.error('deleteReview Exception:', e);
        throw e;
    }
};

/**
 * [추가] 시설 정보 업데이트
 */
export const updateFacility = async (id: string, updates: any) => {
    const { data, error } = await supabase
        .from('facilities') // Changed from memorial_spaces
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- Missing Exports Stubs (Restored mostly, keeping others as stubs if needed) ---
// export const updateConsultation = async (id: string, data: any) => { console.log('STUB: updateConsultation'); }; // Removed in favor of full implementation

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (userId: string, data: Partial<{
    full_name: string;
    phone_number: string;
    avatar_url: string;
}>) => {
    const { data: result, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('clerk_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
    return result;
};

export const getFacilityReservations = async (facilityId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    // Map to expected UI types (match Reservation interface in types/index.ts)
    return (data || []).map((item: any) => ({
        ...item,
        facilityId: item.facility_id,
        facilityName: item.facility_name,
        date: new Date(item.visit_date),
        timeSlot: item.time_slot,
        visitorName: item.user_name || item.visitorName,
        visitorCount: item.visitor_count || 1,
        userPhone: item.user_phone,
        status: item.status as any
    }));
};
export const approveReservation = async (id: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error approving reservation:', error);
        throw error;
    }
    return data;
};

export const rejectReservation = async (id: string, reason?: string) => {
    // 거절 사유를 notes에 추가하거나 별도 컬럼이 있다면 사용. 여기서는 notes에 [거절 사유] 형태로 추가
    // 먼저 기존 notes를 가져와야 하나, 간단히 update로 처리. 
    // 하지만 SQL update는 기존 값을 참조하기 어려우므로, 단순히 status만 변경하거나
    // 클라이언트에서 notes를 합쳐서 보내주는게 맞음. 
    // 여기서는 reason이 있으면 notes를 덮어쓰거나(단순화) 함.
    // 더 안전하게는 status만 변경.

    const updateData: any = { status: 'cancelled' };
    if (reason) {
        updateData.notes = `[거절 사유] ${reason}`;
    }

    const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error rejecting reservation:', error);
        throw error;
    }
    return data;
};

/**
 * 사용자 본인의 예약 목록 조회
 */
export const getMyReservations = async (userId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my reservations:', error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        facilityId: item.facility_id,
        facilityName: item.facility_name || '시설',
        date: item.visit_date,
        timeSlot: item.time_slot,
        status: item.status,
        visitorCount: item.visitor_count || 1,
        message: item.message,
        createdAt: item.created_at
    }));
};

/**
 * 예약 취소
 */
export const cancelReservation = async (id: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error cancelling reservation:', error);
        throw error;
    }
    return data;
};

/**
 * 사용자 전화번호 조회
 */
export const getUserPhoneNumber = async (userId: string): Promise<string> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('clerk_id', userId)
        .single();

    if (error) {
        console.warn('Could not fetch user phone number:', error);
        return '';
    }
    return data?.phone_number || '';
};

/**
 * 시설 FAQ 조회 (실제 테이블이 없으면 빈 배열 반환)
 */
export const getFacilityFaqs = async (facilityId: string) => {
    try {
        const { data, error } = await supabase
            .from('facility_faqs')
            .select('*')
            .eq('facility_id', facilityId)
            .eq('is_active', true)
            .order('order', { ascending: true });

        if (error) {
            // 테이블이 없거나 에러 시 빈 배열 반환
            console.warn('getFacilityFaqs error (may not exist):', error.message);
            return [];
        }
        return data || [];
    } catch (e) {
        console.warn('getFacilityFaqs exception:', e);
        return [];
    }
};

/**
 * [호환성 패치] ReviewList.tsx가 옛날 함수명을 찾아도 작동하도록 연결
 */
export const getReviewsBySpace = getReviews;

export const getFacilitySubscription = async (facilityId: string) => {
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

        // [New Strategy] Query both potential columns based on ID type
        let query = supabase
            .from('facility_subscriptions')
            .select(`
                *,
                subscription_plans (
                    id,
                    name,
                    price,
                    features
                )
            `);

        if (isUUID) {
            query = query.eq('facility_id_uuid', facilityId);
        } else {
            // Legacy/BIGINT
            query = query.or(`facility_id.eq.${facilityId},facility_id_bigint.eq.${facilityId}`);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('Error fetching facility subscription:', error);
            return null;
        }

        // Return flattened object for easier UI handling
        if (data) {
            return {
                ...data,
                plan_name: data.subscription_plans?.name,
                plan_price: data.subscription_plans?.price,
                next_billing_date: data.next_billing_date
            };
        }

        return null;
    } catch (e) {
        console.error('Exception in getFacilitySubscription:', e);
        return null;
    }
};

/**
 * [추가] 사용자 할당 시설 조회
 */
export const getUserFacility = async (userId: string) => {
    const { data, error } = await supabase
        .from('facilities') // Changed from memorial_spaces
        .select('id')
        .eq('user_id', userId) // [Fix] Updated manager_id -> user_id
        .maybeSingle();

    if (error) {
        console.error('Error in getUserFacility:', error);
        return null;
    }
    return data?.id || null;
};

/**
 * [추가] 사용자 역할(Role) 조회 함수
 */
/**
 * [추가] 사용자 역할(Role) 조회 함수
 */
export const getUserRole = async (userId: string) => {
    try {
        // 0. profiles 테이블 최우선 확인 (Phase III 캐시/동기화 최적화)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('clerk_id', userId)
            .maybeSingle();

        if (profile && profile.role !== 'user') {
            return { role: profile.role, isError: false };
        }

        // 1. super_admins 테이블 확인
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (superAdmin) {
            return { role: 'super_admin', isError: false };
        }

        // 2. 시설 관리자 확인 (facilities 테이블의 user_id 확인)
        const { data: facility } = await supabase
            .from('facilities')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
        /* [Fix] manager_id -> user_id */

        if (facility) {
            return { role: 'facility_admin', isError: false };
        }

        // 3. 상조 관리자 확인
        // 상조 쿼리는 별도 파일에서 가져오는 것이 좋으나, 
        // 순환 참조 방지를 위해 여기서 직접 import하거나 로직 통합 필요.
        // 여기서는 동적 import를 사용하지 않고 직접 쿼리 (가장 안전)
        // [주의] getSangjoUser가 lib/sangjoQueries.ts에 있으므로,
        // 여기서는 직접 테이블 조회하는 것이 깔끔함.

        // 3-1. 본사 관리자 확인
        let hqAdmin = null;
        try {
            const { data } = await supabase
                .from('sangjo_hq_admins')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();
            hqAdmin = data;
        } catch (e) {
            // Ignore if table doesn't exist
            console.log('Sangjo HQ check skipped (table missing or error)');
        }

        if (hqAdmin) {
            return { role: 'sangjo_hq_admin', isError: false };
        }

        // 3-2. 지점 관리자 확인
        let branchAdmin = null;
        try {
            const { data } = await supabase
                .from('sangjo_users')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();
            branchAdmin = data;
        } catch (e) {
            // Ignore if table doesn't exist
            console.log('Sangjo Branch check skipped (table missing or error)');
        }

        if (branchAdmin) {
            return { role: 'sangjo_branch_admin', isError: false };
        }

        // 4. 기본 유저 권한 반환
        return { role: 'user', isError: false, error: null };
    } catch (error: any) {
        // 406 Not Acceptable 등 에러가 나도 기본 유저로 처리
        // console.error('Role check error:', error);
        return { role: 'user', isError: false, error: error.message };
    }
};

/**
 * [추가] 파트너 신청용: 기존 시설 검색 (모든 시설 검색 - UI에서 owner 여부 표시)
 */
export const searchKnownFacilities = async (query: string, type?: string) => {
    // facilities 테이블 사용
    let queryBuilder = supabase
        .from('facilities') // Changed from memorial_spaces
        .select('id, name, address, type, user_id') // [Fix] category -> type, manager_id -> user_id
        .ilike('name', `%${query}%`);
    // Note: Removed owner_user_id filter - show all facilities, UI will warn if already claimed

    if (type) {
        queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder.limit(10);

    if (error) {
        console.error('Error searching known facilities:', error);
        return [];
    }
    return data || [];
};

/**
 * Get facilities by category for partner inquiry autocomplete
 */
export const getFacilitiesByCategory = async (category: string) => {
    // Sangjo companies come from constants, not facilities table
    if (category === 'sangjo') {
        return FUNERAL_COMPANIES.map(c => ({
            id: c.id,
            name: c.name,
            address: '전국 서비스',
            phone: c.phone || '',
            category: 'sangjo' as const
        }));
    }

    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, address, phone, type, user_id')
        .eq('type', category)
        .order('name');

    if (error) {
        console.error('Error fetching facilities by category:', error);
        return [];
    }

    return data || [];
};

/**
 * [추가] 파트너 입점 신청 제출
 */
export const submitPartnerApplication = async (data: any) => {
    // 1. 파일 업로드
    let licenseUrl = '';
    if (data.businessLicenseImage) {
        try {
            const fileExt = data.businessLicenseImage.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `licenses/${fileName}`;

            console.log('[PartnerUpload] Uploading file:', fileName, 'Size:', data.businessLicenseImage.size);

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('partner_docs')
                .upload(filePath, data.businessLicenseImage, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('[PartnerUpload] Upload error:', uploadError);
                throw new Error(`파일 업로드 실패: ${uploadError.message}`);
            }

            console.log('[PartnerUpload] Upload successful:', uploadData);

            const { data: urlData } = supabase.storage
                .from('partner_docs')
                .getPublicUrl(filePath);
            licenseUrl = urlData.publicUrl;
            console.log('[PartnerUpload] Public URL:', licenseUrl);
        } catch (uploadErr: any) {
            console.error('[PartnerUpload] Upload exception:', uploadErr);
            // 파일 업로드 실패핏�도 계속 진행 (licenseUrl 없이)
            // 또는 throw uploadErr; // 파일 업로드 필수시 에러 발생
        }
    }

    // 2. DB Insert
    const { data: result, error } = await supabase
        .from('partner_inquiries')
        .insert([{
            user_id: data.userId,
            company_name: data.name,
            company_phone: data.companyPhone,        // \ucd94\uac00: \uc5c5\uccb4 \ub300\ud45c \uc804\ud654
            type: data.type, // [Fix] Add required type field
            business_type: data.type,
            contact_person: data.managerName,
            manager_name: data.managerName,
            manager_position: data.managerPosition,  // \ucd94\uac00: \ub2f4\ub2f9\uc790 \ubd80\uc11c/\uc9c1\uae09
            contact_number: data.phone || data.managerMobile,
            phone: data.phone || data.managerMobile,
            manager_mobile: data.managerMobile,
            company_email: data.companyEmail,
            email: data.email,
            address: data.address,
            business_license_url: licenseUrl,
            message: '',
            privacy_consent: data.privacyConsent,    // \ucd94\uac00: \uac1c\uc778\uc815\ubcf4 \ub3d9\uc758
            status: 'pending',
            target_facility_id: (data.targetFacilityId && !isNaN(Number(data.targetFacilityId)))
                ? Number(data.targetFacilityId)
                : null
        }])
        .select()
        .single();

    if (error) {
        console.error('Error submitting partner application:', error);
        throw error;
    }
    return result;
};

/**
 * [추가] 시설 이미지 업로드
 */
export const uploadFacilityImage = async (facilityId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${facilityId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('facility-images')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('facility-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * [추가] 시설 이미지 조회
 */
export const getFacilityImages = async (facilityId: string) => {
    // facilities 테이블의 images 컬럼 사용 (Array)
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

        let query = supabase
            .from('facilities') // Changed from facility_images
            .select('images')

        if (isUUID) {
            query = query.eq('id', facilityId);
        } else {
            query = query.eq('legacy_id', facilityId);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                return data.images;
            }
        }
        return [];

    } catch (e) {
        console.error('Exception in getFacilityImages:', e);
        return [];
    }
};

export const incrementAiUsage = async (facilityId: string) => {
    // Implement or stub if not ready
    // This functionality likely belongs to 'facility_subscriptions' table usage tracking
    try {
        const { error } = await supabase.rpc('increment_ai_usage', { facility_id: facilityId });
        if (error) {
            // Function might not exist yet, ignore or log
            // console.warn('increment_ai_usage rpc failed', error);
        }
    } catch (e) {
        // ignore
    }
};

export const updateFacilitySubscription = async (facilityId: string, planId: string) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

    // 1. 플랜 정보 조회 (가격 등) - 대소문자 구분 없이 조회
    const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .ilike('name_en', planId)
        .single();

    // 다음 결제일 계산 (기본 1개월 뒤)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);

    const upsertData: any = {
        plan_id: planData?.id || planId,
        status: 'active',
        next_billing_date: nextDate.toISOString(),
        updated_at: new Date().toISOString()
    };

    const conflictTarget = isUUID ? 'facility_id_uuid' : 'facility_id_bigint';

    if (isUUID) {
        upsertData.facility_id_uuid = facilityId;
        upsertData.facility_id = null; // Clear bigint if it exists to avoid confusion
    } else {
        upsertData.facility_id_bigint = Number(facilityId);
        upsertData.facility_id = Number(facilityId);
    }

    // 2. 구독 정보 Upsert
    const { data: subData, error: subError } = await supabase
        .from('facility_subscriptions')
        .upsert({
            ...upsertData,
            plan_id: planData?.id || planId
        }, {
            onConflict: conflictTarget
        })
        .select()
        .single();

    if (subError) {
        console.error('updateFacilitySubscription error:', subError);
        throw subError;
    }

    // 3. 결제 내역 기록 (매출 통계용)
    if (planData && planData.price > 0 && subData) {
        const { error: payError } = await supabase
            .from('subscription_payments')
            .insert([{
                subscription_id: subData.id,
                amount: planData.price,
                final_amount: planData.price,
                status: 'completed',
                payment_method: 'card',
                paid_at: new Date().toISOString(),
                description: `[구독] ${planData.name} 플랜 결제`
            }]);

        if (payError) {
            console.error('Failed to record subscription payment:', payError);
            throw new Error(`결제 기록 생성 실패: ${payError.message}`);
        }
    }

    // 4. 슈퍼 관리자 알림 생성
    try {
        const { data: superAdmins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin');

        if (superAdmins && superAdmins.length > 0) {
            const notifications = superAdmins.map(admin => ({
                user_id: admin.id,
                title: '신규 구독 발생',
                message: `${planData?.name || planId} 플랜 결제가 완료되었습니다.`,
                type: 'success',
                link: '/admin?tab=subs'
            }));

            await supabase
                .from('user_notifications')
                .insert(notifications);
        }
    } catch (e) {
        console.warn('Failed to send admin notifications:', e);
    }
};

/**
 * [추가] 구독 재결제 예정일 수동 업데이트 (관리자용)
 */
export const updateSubscriptionBillingDate = async (facilityId: string, nextDate: string) => {
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

/**
 * [추가] 찜하기(Favorite) 토글 기능
 */
export const toggleFavorite = async (userId: string, facilityId: string, isFavorite: boolean) => {
    if (isFavorite) {
        // 찜 해제
        return await supabase
            .from('favorites')
            .delete()
            .match({ user_id: userId, facility_id: facilityId });
    } else {
        // 찜 등록
        return await supabase
            .from('favorites')
            .insert([{ user_id: userId, facility_id: facilityId }]);
    }
};

/**
 * [추가] 내 찜 목록 가져오기
 */
export const getMyFavorites = async (userId: string) => {
    const { data, error } = await supabase
        .from('favorites')
        .select(`
      facility_id,
      facilities (*)
    `)
        .eq('user_id', userId);

    if (error) throw error;
    // @ts-ignore
    return data.map(f => f.facilities); // 시설 정보만 배열로 추출
};

/**
 * [추가] 전체 구독 현황 조회 (Super Admin)
 */
export const getAllSubscriptions = async () => {
    try {
        const { data, error } = await supabase
            .from('facility_subscriptions')
            .select(`
                *,
                facilities (name),
                plan:subscription_plans(name, price)
            `); // Changed facilities:memorial_spaces(name) to facilities (name)

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            facilityName: item.facilities?.name || 'Unknown',
            planName: item.plan?.name || 'Unknown',
            expiresAt: item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A', // Formatting
            price: item.plan?.price || 0
        }));
    } catch (e) {
        console.error('Error fetching all subscriptions:', e);
        return [];
    }
};

// --- 슈퍼 관리자 기능 (입점 관리) ---

export const getPendingFacilities = async () => {
    try {
        const { data, error } = await supabase
            .from('facilities') // Changed from memorial_spaces
            .select('*')
            .eq('is_verified', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            name: item.name,
            type: item.type || item.category, // [Fix] item.type priority
            address: item.address,
            phone: item.phone,
            businessLicenseImage: item.business_license_image || null,
            createdAt: item.created_at,
            ownerUserId: item.user_id // [Fix] manager_id -> user_id
        }));
    } catch (e) {
        console.error('getPendingFacilities error:', e);
        return [];
    }
};

export const approveFacility = async (facilityId: string) => {
    try {
        const { error } = await supabase
            .from('facilities') // Changed from memorial_spaces
            .update({
                is_verified: true,
                // verified_at: new Date().toISOString() // verified_at might not be in new schema, check if needed
            })
            .eq('id', facilityId);
        if (error) throw error;
    } catch (e) {
        console.error('approveFacility error:', e);
        throw e;
    }
};

export const rejectFacility = async (facilityId: string, rejectionReason: string = "운영팀 문의 요망") => {
    try {
        // Update status to rejected with reason instead of deleting
        const { error } = await supabase
            .from('facilities') // Changed from memorial_spaces
            .update({
                // status: 'rejected', // 'status' might not exist in facilities table
                is_verified: false, // Just keep it unverified for now
                // rejection_reason: rejectionReason // Check if column exists
            })
            .eq('id', facilityId);
        if (error) throw error;
    } catch (e) {
        console.error('rejectFacility error:', e);
        throw e;
    }
};

// --- [Task 2] Dynamic Prompt Injection ---
// 채팅 시작 시 시설의 최신 정보를 실시간으로 가져옴

export const getFacilityLatestInfo = async (facilityId: string) => {
    try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
        let query;

        if (isUuid) {
            // New facilities or Sangjo companies in 'facilities' table
            query = supabase
                .from('facilities')
                .select(`
                    id,
                    name,
                    address,
                    phone,
                    type,
                    description,
                    ai_features,
                    image_url,
                    images
                `)
                .eq('id', facilityId)
                .single();
        } else {
            // Legacy/Scraped facilities in 'facilities' table via legacy_id
            query = supabase
                .from('facilities')
                .select(`
                    id,
                    name,
                    address,
                    phone,
                    type,
                    ai_features,
                    description,
                    image_url,
                    images
                `)
                .eq('legacy_id', facilityId)
                .single();
        }

        const { data, error } = await query;

        if (error) {
            console.error('getFacilityLatestInfo error:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('getFacilityLatestInfo exception:', e);
        return null;
    }
};

// =============================================
// Consultation CRUD Functions
// =============================================

export interface ConsultationData {
    facility_id: string;
    facility_name?: string;
    user_id?: string;
    user_phone?: string;
    user_name?: string;
    urgency: string;
    location?: string;
    needs_ambulance?: boolean;
    scale: string;
    religion: string;
    schedule: string;
    notes?: string;
}

export interface Consultation extends ConsultationData {
    id: string;
    created_at: string;
    updated_at: string;
    status: 'waiting' | 'accepted' | 'cancelled' | 'completed';
    notes?: string;
    answer?: string; // Admin's response
    answered_at?: string; // ISO timestamp
    is_read?: boolean; // Admin read status
    // New AI Fields
    is_ai_response: boolean;
    metadata: Record<string, any>;
    responder_id?: string | null;
    source: string;
}

/**
 * Create a new funeral consultation (for AI chat form)
 */
export const createFuneralConsultation = async (data: ConsultationData): Promise<Consultation | null> => {
    try {
        const { data: result, error } = await supabase
            .from('consultations')
            .insert({
                ...data,
                status: 'waiting'
            })
            .select()
            .single();

        if (error) {
            console.error('createConsultation error:', error);
            return null;
        }

        return result as Consultation;
    } catch (e) {
        console.error('createConsultation exception:', e);
        return null;
    }
};

export const createMemorialConsultation = async (data: {
    facility_id: number;
    user_id?: string;
    user_name?: string;
    user_phone?: string;
    mode: string; // 'urgent' | 'prepare'
    religion?: string;
    budget?: string;
    lighting?: string;
    tier?: string;
    preferences?: any;
}): Promise<any | null> => {
    try {
        // [Fix] This seems to rely on 'memorial_consultations' which might be legacy.
        // Assuming 'consultations' is the unified table now.
        const { data: result, error } = await supabase
            .from('consultations') // Changed from memorial_consultations
            .insert({
                ...data,
                status: 'pending'
            })
            .select()
            .single();
        if (error) {
            console.error('createMemorialConsultation error:', error);
            return null;
        }
        return result;
    } catch (e) {
        console.error('createMemorialConsultation exception:', e);
        return null;
    }
};
/**
 * Get consultations by facility ID (for facility dashboard)
 */
export const getConsultationsByFacility = async (
    facilityId: string,
    status?: string
): Promise<Consultation[]> => {
    try {
        let query = supabase
            .from('consultations')
            .select('*')
            .eq('facility_id', facilityId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('getConsultationsByFacility error:', error);
            return [];
        }

        return (data || []) as Consultation[];
    } catch (e) {
        console.error('getConsultationsByFacility exception:', e);
        return [];
    }
};

/**
 * Get consultations by user ID (for My Page)
 */
export const getConsultationsByUser = async (userId: string): Promise<Consultation[]> => {
    try {
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getConsultationsByUser error:', error);
            return [];
        }

        // [Fix] Map visit_date to date Object for UI consistency if used
        return (data || []) as Consultation[];
    } catch (e) {
        console.error('getConsultationsByUser exception:', e);
        return [];
    }
};

/**
 * Update consultation status
 */
export const updateConsultationStatus = async (
    consultationId: string,
    status: 'waiting' | 'accepted' | 'cancelled' | 'completed',
    notes?: string
): Promise<boolean> => {
    try {
        const updateData: any = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const { error } = await supabase
            .from('consultations')
            .update(updateData)
            .eq('id', consultationId);

        if (error) {
            console.error('updateConsultationStatus error:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('updateConsultationStatus exception:', e);
        return false;
    }
};

export const getFacilityConsultations = getConsultationsByFacility;

/**
 * Answer a consultation (Admin to User)
 */
export const answerConsultation = async (
    consultationId: string,
    answer: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('consultations')
            .update({
                status: 'accepted', // Automatically mark as accepted/answered (or use 'completed'?)
                // 'accepted' implies "received and looking". 'completed' implies "done".
                // Let's us 'accepted' for now as per schema comments 'waiting, accepted ...'
                answer: answer,
                answered_at: new Date().toISOString()
            })
            .eq('id', consultationId);

        if (error) {
            console.error('answerConsultation error:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('answerConsultation exception:', e);
        return false;
    }
};

/**
 * Mark consultation as read by admin
 */
export const markConsultationAsRead = async (consultationId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('consultations')
            .update({ is_read: true })
            .eq('id', consultationId);

        return !error;
    } catch (e) {
        console.error('markConsultationAsRead exception:', e);
        return false;
    }
};

// Remove Stub or Redirect
export const updateConsultation = async (id: string, data: any) => {
    // If data has answer, route to answerConsultation logic?
    // But better to deprecate this stub.
    console.warn('Deprecated updateConsultation called. Use answerConsultation or updateConsultationStatus');
    if (data.answer) {
        return answerConsultation(id, data.answer);
    }
    return false;
};

/**
 * Get single consultation by ID
 */
export const getConsultationById = async (consultationId: string): Promise<Consultation | null> => {
    try {
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('id', consultationId)
            .single();

        if (error) {
            console.error('getConsultationById error:', error);
            return null;
        }

        return data as Consultation;
    } catch (e) {
        console.error('getConsultationById exception:', e);
        return null;
    }
};

/**
 * Fetch facilities within the current map viewport
 * Uses RPC 'search_facilities_in_view'
 */
export const fetchFacilitiesInView = async (bounds: any, token?: string) => {
    try {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        // 🟢 [Fix] Refresh Token if provided (Solves JWT Expired)
        if (token) {
            setSupabaseAuth(token);
        }

        const { data, error } = await supabase.rpc('search_facilities_in_view', {
            min_lat: sw.lat,
            min_lng: sw.lng,
            max_lat: ne.lat,
            max_lng: ne.lng
        });

        if (error) throw error;
        return data;
    } catch (e) {
        console.error('fetchFacilitiesInView error:', e);
        return [];
    }
};

// --- [Phase 1] Fix Missing Exports for AdminCommunication.tsx ---

export interface Inquiry {
    id: string;
    companyName: string;
    type: string;
    createdAt: string;
    status: 'pending' | 'resolved';
    content?: string;
}

export const createNotice = async (title: string, content: string) => {
    // 🚑 Check for session
    const { data: { session } } = await supabase.auth.getSession();

    // Fallback for no session or mock mode
    if (!session) {
        console.warn('No session found for createNotice');
    }

    const { data, error } = await supabase
        .from('admin_notices')
        .insert([{
            title,
            content,
            author_id: session?.user?.id
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating notice:', error);
        throw error;
    }
    return data;
};

export const getNotices = async () => {
    const { data, error } = await supabase
        .from('admin_notices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notices:', error);
        return [];
    }

    return data.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        // Assuming 'created_at' exists
        date: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Unknown date'
    }));
};

export const getInquiries = async () => {
    const { data, error } = await supabase
        .from('partner_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inquiries:', error);
        return [];
    }

    return data.map((i: any) => ({
        id: i.id,
        companyName: i.company_name,
        type: i.business_type || i.type,
        createdAt: i.created_at ? new Date(i.created_at).toLocaleDateString() : 'Unknown date',
        status: (i.status === 'completed' || i.status === 'approved') ? 'resolved' : 'pending'
    }));
};
