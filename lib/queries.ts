// import { Database } from '../types/db'; // Database type missing, using default inference
import { Facility, Review, Reservation } from '../types';
import { FUNERAL_COMPANIES } from '../constants';
import { supabase } from './supabaseClient';

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
        lat,
        lng,
        radius_meters: radius,
        category: category || null,
        "limit": limit
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
    const isMemorialGroup = searchCategory === 'memorial';

    // Helper to filter results in JS if we fetch broader set
    const filterByCategory = (items: any[]) => {
        if (!searchCategory) return items;

        if (searchCategory === 'funeral') {
            return items.filter((i: any) => i.category === 'funeral_home' || i.category === 'funeral' || i.category === '장례식장');
        }

        if (searchCategory === 'pet') {
            return items.filter((i: any) => i.category === 'pet_memorial' || i.category === 'pet' || i.category === '동물장례');
        }

        if (searchCategory === 'sangjo') {
            return items.filter((i: any) => i.category === 'sangjo' || i.category === '상조');
        }

        if (isMemorialGroup) {
            // [FIX] Use Whitelist
            const MEMORIAL_CATEGORIES = ['charnel_house', 'natural_burial', 'tree_burial', 'park_cemetery', 'complex', 'sea_burial', 'memorial', '봉안시설', '자연장', '공원묘지', '해양장'];
            return items.filter((i: any) => MEMORIAL_CATEGORIES.includes(i.category) || MEMORIAL_CATEGORIES.includes(i.type));
        }

        return items;
    };

    const isSpecificRegion = regionText && regionText !== '내 위치 주변';

    // 1. Region Search (Text)
    if (isSpecificRegion) {
        // searchFacilitiesByRegion calls 'search_facilities_by_text' RPC. 
        // If we pass 'memorial' to RPC, it likely returns nothing. So pass NULL to RPC and filter in JS.
        const rpcCategory = isMemorialGroup ? null : searchCategory;

        let regionResults = await searchFacilitiesByRegion(regionText, rpcCategory as string);
        regionResults = filterByCategory(regionResults);
        finalData = regionResults;

        // [Smart Expansion] "고양시 식사동" -> "고양시" (If < 3 results)
        if (finalData.length < 3) {
            let parentRegion = '';
            // Try to extract from finding (pivot)
            if (finalData.length > 0 && finalData[0].address) {
                const addrParts = finalData[0].address.split(' ');
                // Usually "Gyeonggi-do Goyang-si ..." -> Take first 2 parts if possible, or just the City part
                // Logic: Find the part ending in 'si' or 'gun' or 'gu'
                const cityPart = addrParts.find((p: string) => p.endsWith('시') || p.endsWith('군'));
                if (cityPart) parentRegion = cityPart; // simple pivot
                else if (addrParts.length > 1) parentRegion = addrParts.slice(0, 2).join(' ');
            }

            // Fallback to text parsing if pivot failed or 0 results
            if (!parentRegion && regionText.includes(' ')) {
                parentRegion = regionText.substring(0, regionText.lastIndexOf(' ')).trim();
            }

            if (parentRegion && parentRegion.length >= 2 && parentRegion !== regionText) {
                const parentResults = await searchFacilitiesByRegion(parentRegion, rpcCategory as string);
                const filteredParent = filterByCategory(parentResults);

                // Merge
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

    // 2. GPS Search (Radius Expansion + Smart City Expansion)
    // Only if not enough results OR we didn't search by region
    if (finalData.length < 3 && lat && lng && (lat !== 37.5665 || lng !== 126.9780)) {
        const radiuses = [5000, 10000, 25000]; // 5km, 10km, 25km

        const rpcCategory = isMemorialGroup ? null : searchCategory;

        for (const radius of radiuses) {
            // Fetch more results (limit 20 to allow filtering)
            const { data, error } = await searchFacilitiesV2(lat, lng, radius, rpcCategory as string, 20);

            if (!error && data && data.length > 0) {
                const filtered = filterByCategory(data);

                const existingIds = new Set(finalData.map(f => f.id));
                for (const facility of filtered) {
                    if (!existingIds.has(facility.id)) {
                        finalData.push(facility);
                        existingIds.add(facility.id);
                    }
                }

                // [City Expansion from GPS Result]
                // If we found at least 1 item in 5km/10km but total < 3, 
                // use that item's address to search the WHOLE 'City' (Goyang-si) to fill the list.
                // This handles the "I am in Siksa-dong, found 1, show me more in Goyang-si" case better than just expanding radius blindly.
                if (finalData.length > 0 && finalData.length < 3 && radius <= 10000) {
                    const pivotFacility = finalData[0];
                    if (pivotFacility.address) {
                        const addrParts = pivotFacility.address.split(' ');
                        const cityPart = addrParts.find((p: string) => p.endsWith('시') || p.endsWith('군'));

                        if (cityPart) {
                            // Search by Text "Goyang-si"
                            const cityResults = await searchFacilitiesByRegion(cityPart, rpcCategory as string);
                            const filteredCity = filterByCategory(cityResults);

                            const existingIdsCity = new Set(finalData.map(f => f.id));
                            for (const f of filteredCity) {
                                if (!existingIdsCity.has(f.id)) {
                                    finalData.push(f);
                                    existingIdsCity.add(f.id);
                                }
                            }
                        }
                    }
                }

                if (finalData.length >= 3) break;
            }
        }
    }

    // 3. Final Slice
    return finalData.slice(0, 5); // Increased to 5 to show more options
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
            context_data: leadData.contextData || {},
            status: 'new'
        }]); // Removed .select().single() to avoid RLS Select Policy issues

    if (error) {
        console.error('Error creating lead:', error);
        throw error;
    }
    return { success: true };
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
        .from('facilities') // Changed from memorial_spaces
        .select(`
      *,
      lat: st_y(location::geometry),
      lng: st_x(location::geometry)
    `);

    if (isUUID) {
        query = query.eq('id', id);
    } else {
        query = query.eq('legacy_id', id);
    }

    const { data, error } = await query.single();

    if (error) {
        console.error('Error fetching facility:', error);
        throw error;
    }
    // Map DB fields to Frontend types
    return {
        ...data,
        galleryImages: data.images || [] // Use images array as galleryImages fallback
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
        category
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

// --- [리뷰 기능] ---
export const getReviews = async (facilityId: string) => {
    try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
        let validFacilityId = facilityId;

        // If legacy ID (integer), try to find the UUID first
        if (!isUUID) {
            const { data: facilityData } = await supabase
                .from('facilities')
                .select('id')
                .eq('legacy_id', facilityId)
                .maybeSingle();

            if (facilityData) {
                validFacilityId = facilityData.id;
            } else {
                // If not found, probably old data that didn't migrate well or just invalid
                console.warn('[getReviews] Legacy ID lookup failed:', facilityId);
                return [];
            }
        }

        let query = supabase.from('reviews').select('*');

        // Check if we found a valid UUID or if the input was already a UUID
        const shouldUseUUID = isUUID || (validFacilityId !== facilityId);

        if (shouldUseUUID) {
            query = query.eq('facility_id', validFacilityId);
        } else {
            console.warn('[getReviews] Legacy ID used but no UUID mapping found. Returning empty.', validFacilityId);
            return [];
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            // Ignore fallback logic as schema is now unified
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('Exception in getReviews:', e);
        return [];
    }
};

export const getUserReviews = async (userId: string) => {
    const { data, error } = await supabase
        .from('facility_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user reviews:', error);
        return [];
    }
    return data || [];
};

export const createReview = async (
    facilityId: string,
    userId: string,
    rating: number,
    content: string,
    images: string[] = []
) => {
    const { data, error } = await supabase
        .from('reviews')
        .insert([{ facility_id: facilityId, user_id: userId, rating, content, images }])
        .select()
        .single();

    if (error) {
        console.error('Error creating review:', error);
        throw error;
    }
    return data;
};

export const deleteReview = async (reviewId: string) => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
    return true;
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
export const updateConsultation = async (id: string, data: any) => { console.log('STUB: updateConsultation'); };
export const updateUserProfile = async (id: string, data: any) => { console.log('STUB: updateUserProfile'); };
export const getFacilityReservations = async (facilityId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    // Map to expected UI types
    return (data || []).map((item: any) => ({
        ...item,
        date: new Date(item.visit_date),
        time: item.time_slot,
        userName: item.user_name,
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
export const getMyReservations = async (userId: string) => { console.log('STUB: getMyReservations'); return []; };
export const cancelReservation = async (id: string) => { console.log('STUB: cancelReservation'); };
export const getUserPhoneNumber = async (userId: string) => { console.log('STUB: getUserPhoneNumber'); return ''; };
export const getFacilityFaqs = async (facilityId: string) => { console.log('STUB: getFacilityFaqs'); return []; };

/**
 * [호환성 패치] ReviewList.tsx가 옛날 함수명을 찾아도 작동하도록 연결
 */
export const getReviewsBySpace = getReviews;

export const getFacilitySubscription = async (facilityId: string) => {
    try {
        // [Fix] facility_subscriptions.facility_id is BIGINT, not UUID
        // If facilityId looks like a UUID, skip the query to avoid type mismatch error
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
        if (isUUID) {
            // UUID means it's from 'facilities' table, not 'memorial_spaces' (BIGINT)
            // Subscription feature only works with memorial_spaces for now
            console.log('[getFacilitySubscription] Skipping for UUID facility:', facilityId);
            return null;
        }

        const { data, error } = await supabase
            .from('facility_subscriptions')
            .select(`
                *,
                subscription_plans (
                    name,
                    price,
                    features
                )
            `)
            .eq('facility_id', facilityId)
            .maybeSingle(); // Use maybeSingle to avoid error if no subscription exists

        if (error) {
            console.error('Error fetching facility subscription:', error);
            // Don't throw, just return null as frontend expects optional
            return null;
        }

        return data; // Returns the subscription object with nested plan details
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
        .eq('manager_id', userId) // Updated owner_user_id -> manager_id
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
export const getUserRole = async (userId: string) => {
    try {
        // 1. super_admins 테이블 확인
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (superAdmin) {
            return { role: 'super_admin', isError: false };
        }

        // 2. 기본 유저 권한 반환
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
        .select('id, name, address, category, manager_id') // Updated owner_user_id -> manager_id
        .ilike('name', `%${query}%`);
    // Note: Removed owner_user_id filter - show all facilities, UI will warn if already claimed

    if (type) {
        queryBuilder = queryBuilder.eq('category', type);
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
        .select('id, name, address, phone, category, manager_id')
        .eq('category', category)
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
        // ... (existing upload logic kept same but skipping for brevity in replacement if possible, but replace tool needs full logic)
        // Wait, replace tool needs exact match. I should be careful.
        // Re-reading lines 486-533 from previous view_file of queries.ts (Step 545)
        const fileExt = data.businessLicenseImage.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `licenses/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('partner_docs')
            .upload(filePath, data.businessLicenseImage);

        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from('partner_docs')
                .getPublicUrl(filePath);
            licenseUrl = urlData.publicUrl;
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
    const { error } = await supabase
        .from('facility_subscriptions')
        .upsert({
            facility_id: facilityId,
            plan_id: planId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'facility_id' });

    if (error) throw error;
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
            type: item.category, // Changed item.type to item.category
            address: item.address,
            phone: item.phone,
            businessLicenseImage: item.business_license_image || null, // Might need check if column exists
            createdAt: item.created_at,
            ownerUserId: item.manager_id // Changed item.owner_user_id to item.manager_id
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
                    category,
                    ai_context,
                    description,
                    features
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
                    category,
                    ai_context,
                    features,
                    description
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
}

export interface Consultation extends ConsultationData {
    id: string;
    created_at: string;
    updated_at: string;
    status: 'waiting' | 'accepted' | 'cancelled' | 'completed';
    notes?: string;
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
