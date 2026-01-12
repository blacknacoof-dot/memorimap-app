// import { Database } from '../types/db'; // Database type missing, using default inference
import { supabase } from './supabaseClient';

export { supabase };

// --- [Phase 8] 지도 검색 기능 ---

export const searchFacilities = async (
    lat: number,
    lng: number,
    radius: number = 5000,
    category?: string
) => {
    const { data, error } = await supabase.rpc('search_facilities', {
        lat,
        lng,
        radius_meters: radius,
        filter_category: category || null,
    });

    if (error) {
        console.error('Error searching facilities:', error);
        throw error;
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
        p_radius_meters: radius,
        p_category: category || null,
        p_limit: limit
    });
    return { data, error };
};

/**
 * [Phase 3] 지능형 추천 엔진 (반경 확장 로직)
 */
/**
 * [Phase 3] 지능형 추천 엔진 (반경 확장 + 지역명 검색)
 */
const mapCategoryToCode = (category?: string) => {
    if (!category) return undefined;
    if (category === '장례식장' || category === 'funeral' || category === 'funeral_home') return 'funeral';
    // [FIX] Add 'memorial_facility' to mapping
    if (category === '봉안시설' || category === 'charnel' || category === 'memorial' || category === 'memorial_facility') return 'memorial';
    if (category === '해양장' || category === 'sea') return 'sea';
    if (category === '동물장례' || category === 'pet') return 'pet';
    return category; // Fallback
};

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
            return items.filter((i: any) => i.type === 'funeral_home' || i.type === 'funeral');
        }

        if (searchCategory === 'pet') {
            return items.filter((i: any) => i.type === 'pet');
        }

        if (searchCategory === 'sangjo') {
            return items.filter((i: any) => i.type === 'sangjo');
        }

        if (isMemorialGroup) {
            // [FIX] Use Whitelist instead of Blacklist to prevent 'funeral' or 'sangjo' leaking in
            const MEMORIAL_TYPES = ['charnel', 'natural', 'park', 'complex', 'sea', 'tree_burial'];
            return items.filter((i: any) => MEMORIAL_TYPES.includes(i.type));
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
            memorial_spaces (name)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    // Map memorial_spaces to facilities just in case frontend expects it, or just return data and let frontend adapt?
    // AdminLeadsView.tsx uses 'facilities' probably. Let's check AdminLeadsView.tsx again.
    // Wait, AdminLeadsView.tsx does not access facilities.name directly?
    // Let's check AdminLeadsView.tsx content I viewed earlier.
    // It calls getAllLeads() and just sets leads. It doesn't seem to display facility name in the table snippet I saw (it had Status, Contact, Category).
    // Ah, wait, checking the file viewing again.
    // Line 106: lead.context_data?.text ... 
    // It doesn't seem to clearly display 'facility name' column.
    // But the query request failed, so we fix the query.
    return data;
};

// --- [Phase 9] 시설 상세 조회 ---

export const getFacility = async (id: string) => {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select(`
      *,
      lat: st_y(location::geometry),
      lng: st_x(location::geometry)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching facility:', error);
        throw error;
    }
    // Map DB fields to Frontend types
    return {
        ...data,
        galleryImages: data.gallery_images || data.galleryImages || []
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
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('space_id', facilityId) // Script populated 'space_id'
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            // Try fallback to memorial_space_id just in case schema is mixed
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('reviews')
                .select('*')
                .eq('memorial_space_id', facilityId)
                .order('created_at', { ascending: false });

            if (!fallbackError && fallbackData) return fallbackData;
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
        .from('reviews')
        .select(`
            *,
            facilities:memorial_spaces(name)
        `) // Join with facility name if possible
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
    // 리뷰 기능 구현 시 주석 해제
    /*
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ facility_id: facilityId, user_id: userId, rating, content, images }])
      .select()
      .single();
    */
    return null;
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
        .from('memorial_spaces')
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
export const approveReservation = async (id: string) => { console.log('STUB: approveReservation'); };
export const rejectReservation = async (id: string) => { console.log('STUB: rejectReservation'); };
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
        .from('memorial_spaces')
        .select('id')
        .eq('owner_user_id', userId)
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
 * [추가] 파트너 신청용: 기존 시설 검색
 */
/**
 * [추가] 파트너 신청용: 기존 시설 검색 (주인 없는 시설만 검색)
 */
export const searchKnownFacilities = async (query: string, type?: string) => {
    // memorial_spaces 테이블 사용
    let queryBuilder = supabase
        .from('memorial_spaces')
        .select('id, name, address, type, owner_user_id') // Use correct column name
        .ilike('name', `%${query}%`)
        .is('owner_user_id', null); // Only unclaimed facilities

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
 * [추가] 파트너 입점 신청 제출
 */
export const submitPartnerApplication = async (data: any) => {
    // 1. 파일 업로드
    let licenseUrl = '';
    if (data.businessLicenseImage) {
        // ... (existing upload logic kept same but skipping for brevity in replacement if possible, but replace tool needs full logic)
        // Wait, replace tool needs exact match. I should be careful.
        // Let's use the existing code I read to ensure I don't break upload.
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
            business_type: data.type,
            contact_person: data.managerName,
            contact_number: data.phone,
            manager_mobile: data.managerMobile,
            company_email: data.companyEmail,
            email: data.email,
            address: data.address,
            business_license_url: licenseUrl,
            message: '',
            status: 'pending',
            target_facility_id: (data.targetFacilityId && !isNaN(Number(data.targetFacilityId)))
                ? Number(data.targetFacilityId)
                : null // [Fix] Only use numeric IDs, skip string IDs like "fc_new_1"
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
    // facilities 테이블의 images 컬럼이 아닌 facility_images 테이블 사용
    try {
        const { data, error } = await supabase
            .from('facility_images')
            .select('*')
            .eq('facility_id', facilityId)
            .order('order_index', { ascending: true }); // Assuming order_index exists

        if (error || !data || data.length === 0) {
            // Fallback: Use 'facilities' table 'images' column (Array)
            // This is crucial for legacy data or migrated data in 'facilities' table
            const { data: fallback, error: fallbackError } = await supabase
                .from('facilities')
                .select('images, gallery_images')
                .eq('id', facilityId)
                .maybeSingle();

            if (!fallbackError && fallback) {
                if (fallback.gallery_images && Array.isArray(fallback.gallery_images) && fallback.gallery_images.length > 0) {
                    return fallback.gallery_images;
                }
                if (fallback.images && Array.isArray(fallback.images)) {
                    return fallback.images;
                }
            }

            // If fallback also empty or fails
            return [];
        }

        if (data && data.length > 0) {
            // Map objects to strings (handling { facility_id, image_url, ... })
            return data.map((item: any) => item.image_url).filter((url: string) => !!url);
        }

        return [];

    } catch (e) {
        console.error('Exception in getFacilityImages:', e);
        return [];
    }
};

// --- [Missing Exports Implementation] ---

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
                facilities:memorial_spaces(name),
                plan:subscription_plans(name, price)
            `);

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
            .from('memorial_spaces')
            .select('*')
            .eq('is_verified', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id?.toString(),
            name: item.name,
            type: item.type,
            address: item.address,
            phone: item.phone,
            businessLicenseImage: item.business_license_image || null,
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

export const rejectFacility = async (facilityId: string, rejectionReason: string = "운영팀 문의 요망") => {
    try {
        // Update status to rejected with reason instead of deleting
        const { error } = await supabase
            .from('memorial_spaces')
            .update({
                status: 'rejected',
                rejection_reason: rejectionReason
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
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select(`
                id,
                name,
                address,
                phone,
                type,
                prices,
                operating_hours,
                ai_context,
                ai_features,
                ai_welcome_message,
                description
            `)
            .eq('id', facilityId)
            .single();

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
