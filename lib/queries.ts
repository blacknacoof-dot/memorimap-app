import { Facility, Review, Reservation } from '../types';
import { FUNERAL_COMPANIES } from '../constants';
import { supabase, setSupabaseAuth } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

import { logger } from '../utils/logger';
import { validateImageFile } from './security/fileValidation';
import { sanitizeSearchInput } from './security/sqlSanitize';

// --- Internal helper types (replacing `any`) ---

/** DB facility row returned from RPC / select queries */
interface FacilityRow {
    id: string | number;
    name?: string;
    type?: string;
    category?: string;
    address?: string;
    full_address?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    [key: string]: unknown;
}

/** DB reservation row from select('*') */
interface ReservationRow {
    id: string;
    facility_id: string;
    facility_name?: string;
    visit_date: string;
    time_slot: string;
    status: string;
    visitor_count?: number;
    message?: string;
    created_at: string;
    payment_id?: string;
    visitor_name?: string;
    user_name?: string;
    visitorName?: string;
    user_phone?: string;
    user_id?: string;
    [key: string]: unknown;
}

/** DB subscription row with joined relations */
interface SubscriptionRow {
    id: string;
    facilities?: { name: string } | null;
    plan?: { name: string; price: number } | null;
    end_date?: string | null;
    status?: string;
    [key: string]: unknown;
}

/** DB pending facility row */
interface PendingFacilityRow {
    id?: string | number;
    name?: string;
    type?: string;
    category?: string;
    address?: string;
    phone?: string;
    business_license_image?: string;
    created_at?: string;
    user_id?: string;
    [key: string]: unknown;
}

/** DB notice row */
interface NoticeRow {
    id: string;
    title: string;
    content: string;
    created_at?: string;
    [key: string]: unknown;
}

/** DB partner inquiry row */
interface InquiryRow {
    id: string;
    company_name?: string;
    manager_name?: string;
    phone?: string;
    email?: string;
    message?: string;
    inquiry_type?: string;
    business_type?: string;
    type?: string;
    created_at?: string;
    status?: string;
    [key: string]: unknown;
}

/** Partner application input data */
interface PartnerApplicationInput {
    userId?: string;
    name: string;
    companyPhone?: string;
    type?: string;
    managerName?: string;
    managerPosition?: string;
    phone?: string;
    managerMobile?: string;
    companyEmail?: string;
    email?: string;
    address?: string;
    privacyConsent?: boolean;
    targetFacilityId?: string | number | null;
    businessLicenseImage?: File;
}

/** Map bounds with getSouthWest/getNorthEast methods (Kakao Maps LatLngBounds) */
interface MapBounds {
    getSouthWest(): { lat: number; lng: number };
    getNorthEast(): { lat: number; lng: number };
}

/** Facility subscription upsert data */
interface SubscriptionUpsertData {
    plan_id: string;
    status: string;
    next_billing_date: string;
    updated_at: string;
    facility_id_uuid?: string;
    facility_id_bigint?: number;
    facility_id?: number | null;
}

/** DB review row */
interface ReviewRow {
    id: string;
    user_id?: string;
    facility_id?: string;
    rating?: number;
    content?: string;
    author_name?: string;
    photos?: Array<{ url: string }>;
    is_active?: boolean;
    created_at: string;
    [key: string]: unknown;
}

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
export const checkExistingReview = async (userId: string, facilityId: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
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
export const uploadReviewImage = async (userId: string, file: File, client: SupabaseClient) => {
    const db = client;
    // [Security] 파일 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error || '파일 검증 실패');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `review-images/${userId}/${fileName}`;

    const { error: uploadError } = await db.storage
        .from('reviews') // 'reviews' bucket must exist in Supabase
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = db.storage
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
    let finalData: FacilityRow[] = [];
    const searchCategory = mapCategoryToCode(category);

    // [Strict Filter] 상조 서비스 원천 배제 및 카테고리 정규화
    const normalizedCategory = (searchCategory === 'funeral_home') ? 'funeral' :
        (searchCategory === 'pet_funeral') ? 'pet' : searchCategory;

    const isMemorialGroup = searchCategory === 'columbarium' || searchCategory === 'natural_burial' || searchCategory === 'cemetery';

    // Helper: Strict Filter by Category & Region
    // 주소 정규화: 축약형↔정식명 매핑
    const REGION_ALIASES: Record<string, string[]> = {
        '서울': ['서울특별시'], '서울특별시': ['서울'],
        '경기': ['경기도'], '경기도': ['경기'],
        '부산': ['부산광역시'], '부산광역시': ['부산'],
        '대구': ['대구광역시'], '대구광역시': ['대구'],
        '인천': ['인천광역시'], '인천광역시': ['인천'],
        '광주': ['광주광역시'], '광주광역시': ['광주'],
        '대전': ['대전광역시'], '대전광역시': ['대전'],
        '울산': ['울산광역시'], '울산광역시': ['울산'],
        '세종': ['세종특별자치시'], '세종특별자치시': ['세종'],
        '제주': ['제주특별자치도'], '제주특별자치도': ['제주'],
        '강원': ['강원특별자치도', '강원도'], '강원특별자치도': ['강원', '강원도'], '강원도': ['강원', '강원특별자치도'],
        '충북': ['충청북도'], '충청북도': ['충북'],
        '충남': ['충청남도'], '충청남도': ['충남'],
        '전북': ['전북특별자치도', '전라북도'], '전북특별자치도': ['전북', '전라북도'], '전라북도': ['전북', '전북특별자치도'],
        '전남': ['전라남도'], '전라남도': ['전남'],
        '경북': ['경상북도'], '경상북도': ['경북'],
        '경남': ['경상남도'], '경상남도': ['경남'],
    };

    const addressContainsRegion = (address: string, region: string): boolean => {
        if (address.includes(region)) return true;
        const aliases = REGION_ALIASES[region];
        if (aliases) {
            return aliases.some(alias => address.includes(alias));
        }
        return false;
    };

    const strictFilter = (items: FacilityRow[], targetRegionText?: string) => {
        return items.filter((i: FacilityRow) => {
            // 1. Category Filter — DB 필드는 `type` (category 컬럼 없음)
            const itemType = i.type || i.category;
            let categoryMatch = true;
            if (normalizedCategory === 'funeral') {
                if (itemType === 'sangjo' || itemType === '상조') return false;
                const isFuneralType = itemType === 'funeral_home' || itemType === 'funeral' || itemType === '장례식장';
                const isNameMatch = !itemType && !!i.name && i.name.includes('장례식장');
                categoryMatch = isFuneralType || isNameMatch;
            } else if (normalizedCategory === 'pet') {
                const PET_CATEGORIES = ['pet_memorial', 'pet_funeral', 'pet', '동물장례', '반려동물'];
                categoryMatch = PET_CATEGORIES.includes(itemType || '') || PET_CATEGORIES.includes(i.type || '');
            } else if (isMemorialGroup) {
                const MEMORIAL_CATEGORIES = ['columbarium', 'charnel_house', 'natural_burial', 'tree_burial', 'park_cemetery', 'cemetery', 'complex', 'sea_burial', 'memorial', '봉안시설', '자연장', '공원묘지', '해양장'];
                categoryMatch = MEMORIAL_CATEGORIES.includes(i.type || '') || MEMORIAL_CATEGORIES.includes(itemType || '');
            }

            // 2. Region Filter — 주소 정규화 매핑 적용
            let regionMatch = true;
            if (targetRegionText) {
                const addr = i.address || i.full_address || '';
                if (!addr) {
                    regionMatch = false; // 주소 없으면 제외
                } else {
                    const safeRegion = targetRegionText.split(' ')[0];
                    regionMatch = addressContainsRegion(addr, safeRegion);
                }
            }

            return categoryMatch && regionMatch;
        });
    };

    // 1. Region Search (Primary)
    if (regionText && regionText !== '내 위치 주변') {
        // A. Exact 'Dong' Search (e.g. "식사동")
        let regionResults = await searchFacilitiesByRegion(regionText, undefined);
        regionResults = strictFilter(regionResults, regionText);

        finalData = [...regionResults];

        // B-0. Pet fallback: 지역 검색 결과가 없으면 이름 키워드로 재검색
        if (finalData.length === 0 && normalizedCategory === 'pet') {
            const petKeywords = ['동물장례', '펫', '반려동물', 'pet'];
            for (const keyword of petKeywords) {
                if (finalData.length >= 3) break;
                const keywordResults = await searchFacilitiesByRegion(keyword, undefined);
                const filtered = strictFilter(keywordResults, regionText);
                const existingIds = new Set(finalData.map(f => f.id));
                for (const f of filtered) {
                    if (!existingIds.has(f.id)) {
                        finalData.push(f);
                        existingIds.add(f.id);
                    }
                }
            }
        }

        // B. 3개 미만이면 좌표 기반 반경 확장 (5km → 10km → 20km)
        if (finalData.length < 3) {
            // 기존 결과에서 좌표 추출
            let baseLat = 0, baseLng = 0;
            const firstWithCoords = finalData.find((f: FacilityRow) => (f.latitude || f.lat) && (f.longitude || f.lng));
            if (firstWithCoords) {
                baseLat = firstWithCoords.latitude || firstWithCoords.lat || 0;
                baseLng = firstWithCoords.longitude || firstWithCoords.lng || 0;
            } else {
                // 좌표 없으면 DB에서 해당 지역 아무 시설이라도 찾아서 좌표 확보
                const anyResults = await searchFacilitiesByRegion(regionText, undefined);
                const anyWithCoords = anyResults.find((f: FacilityRow) => (f.latitude || f.lat) && (f.longitude || f.lng));
                if (anyWithCoords) {
                    baseLat = anyWithCoords.latitude || anyWithCoords.lat || 0;
                    baseLng = anyWithCoords.longitude || anyWithCoords.lng || 0;
                }
            }

            if (baseLat && baseLng) {
                const existingIds = new Set(finalData.map(f => f.id));
                const radiusList = [5000, 10000, 20000]; // 5km, 10km, 20km

                for (const radius of radiusList) {
                    if (finalData.length >= 3) break;
                    const { data: nearbyData } = await searchFacilitiesV2(baseLat, baseLng, radius, undefined, 10);
                    if (nearbyData) {
                        const filtered = strictFilter(nearbyData, regionText);
                        for (const f of filtered) {
                            if (!existingIds.has(f.id)) {
                                finalData.push(f);
                                existingIds.add(f.id);
                            }
                        }
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

    // 2-b. Pet 최종 fallback: 지역 무관 pet 시설 검색 (결과가 0이면)
    if (finalData.length === 0 && normalizedCategory === 'pet') {
        const petKeywords = ['동물장례', '펫', '반려동물'];
        for (const keyword of petKeywords) {
            if (finalData.length >= 3) break;
            const allPet = await searchFacilitiesByRegion(keyword, undefined);
            const filtered = strictFilter(allPet); // region filter 없이
            const existingIds = new Set(finalData.map(f => f.id));
            for (const f of filtered) {
                if (!existingIds.has(f.id)) {
                    finalData.push(f);
                    existingIds.add(f.id);
                }
            }
        }
    }

    // 3. Final Sort & Limit
    // Remove duplicates
    const uniqueMap = new Map();
    finalData.forEach(item => uniqueMap.set(item.id, item));
    let results = Array.from(uniqueMap.values());

    // Sort: 1) 지역 일치 우선  2) Rating Descending
    if (regionText) {
        const safeRegion = regionText.split(' ')[0];
        results.sort((a, b) => {
            const addrA = a.address || a.full_address || '';
            const addrB = b.address || b.full_address || '';
            const matchA = addressContainsRegion(addrA, safeRegion) ? 1 : 0;
            const matchB = addressContainsRegion(addrB, safeRegion) ? 1 : 0;
            if (matchB !== matchA) return matchB - matchA; // 지역 일치 우선
            return (b.rating || 0) - (a.rating || 0);
        });
    } else {
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

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
    // [Security] Sanitize input to prevent SQL injection
    const sanitized = sanitizeSearchInput(region);
    const optimizedRegion = sanitized.trim().replace(/\s+/g, '%');

    const { data, error } = await supabase.rpc('search_facilities_by_text', {
        p_text: optimizedRegion,
        p_category: category || null,
        p_max_results: 20
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
    // [Security] Sanitize input to prevent SQL injection
    const sanitized = sanitizeSearchInput(searchText);

    const { data, error } = await supabase.rpc('get_distinct_regions', {
        search_text: sanitized
    });

    if (error) {
        console.error('Error fetching distinct regions:', error);
        return [];
    }
    return data || [];
};

/**
 * facilities 테이블 기반 지역 자동완성 (memorial_spaces만 조회하는 RPC 대체)
 * - 모든 시설 타입에서 주소 검색
 * - 시/도 + 시/군/구 단위로 추출
 */
export const getDistinctRegionsFromFacilities = async (searchText: string) => {
    const sanitized = sanitizeSearchInput(searchText);
    if (!sanitized || sanitized.length < 2) return [];

    const { data, error } = await supabase
        .from('facilities')
        .select('address')
        .ilike('address', `%${sanitized}%`)
        .not('address', 'is', null)
        .limit(100);

    if (error || !data) {
        console.error('Error fetching regions from facilities:', error);
        return [];
    }

    const regions = new Set<string>();
    data.forEach((item: { address: string }) => {
        if (!item.address) return;
        const addr = item.address
            .replace(/^경기\s/, '경기도 ')
            .replace(/^서울\s/, '서울특별시 ')
            .replace(/^부산\s/, '부산광역시 ');
        const parts = addr.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            regions.add(`${parts[0]} ${parts[1]}`);
        }
    });

    return Array.from(regions).sort();
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
    contextData?: Record<string, unknown>;
    notes?: string;
}

export const createLead = async (leadData: LeadInput, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
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
        throw error;
    }
    return data && data[0] ? data[0] : null;
};

export const createConsultationFromLead = async (leadId: string, facilityId: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db.rpc('create_consultation_from_lead', {
        p_lead_id: leadId,
        p_facility_id: facilityId
    });

    if (error) {
        throw error;
    }
    return data;
};

export const getAllLeads = async (client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
        .from('leads')
        .select('*')
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
    notes: string,
    client: SupabaseClient
) => {
    const db = client;
    const { data, error } = await db
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
    notes: string,
    client: SupabaseClient
) => {
    const db = client;
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
    }, db);

    // if (leadError) throw leadError; // createLead throws internally if error

    // Additionally create a reservation record if table exists
    const { data, error } = await db
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
        throw error;
    }
    return data;
};

export const getConsultationHistory = async (userId: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
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
        throw error;
    }
    return data;
};

export const deleteConsultation = async (id: string, userId: string | undefined, client: SupabaseClient) => {
    const db = client;
    let query = db
        .from('consultations')
        .delete()
        .eq('id', id);

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
        throw error;
    }
    return true;
};



// --- [리뷰 기능] ---
export const getReviews = async (facilityId: string) => {
    try {
        // [통합] facility_reviews 테이블 사용, facility_id가 TEXT이므로 ID 매핑 로직 단순화
        const { data, error } = await supabase
            .from('facility_reviews')
            .select('*')
            .eq('facility_id', facilityId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }

        return (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (e) {
        console.error('Exception in getReviews:', e);
        return [];
    }
};

export const getUserReviews = async (userId: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
        .from('facility_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user reviews:', error);
        return [];
    }

    return (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const createReview = async (
    facilityId: string,
    userId: string,
    rating: number,
    content: string,
    userName: string | undefined,
    images: string[],
    client: SupabaseClient
): Promise<Record<string, unknown> | null> => {
    const db = client;
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

    try {
        const { data, error } = await db
            .from('facility_reviews')
            .insert([insertData])
            .select()
            .single();

        if (error) {

            throw error;
        }
        return data;
    } catch (e: unknown) {

        throw e;
    }
};

export const deleteReview = async (reviewId: string, client: SupabaseClient) => {
    const db = client;
    try {
        const { error } = await db
            .from('facility_reviews')
            .update({
                is_active: false,
                deleted_at: new Date().toISOString()
            })
            .eq('id', reviewId);

        if (error) {
            throw error;
        }
        return true;
    } catch (e: unknown) {
        throw e;
    }
};

/**
 * [추가] 시설 정보 업데이트
 */
export const updateFacility = async (id: string, updates: Record<string, unknown>, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
        .from('facilities') // Changed from memorial_spaces
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (userId: string, data: Partial<{
    full_name: string;
    phone_number: string;
    avatar_url: string;
}>, client: SupabaseClient) => {
    const db = client;
    // upsert: clerk_id 행이 없으면 INSERT, 있으면 UPDATE (406 방지)
    const { data: result, error } = await db
        .from('profiles')
        .upsert(
            { clerk_id: userId, ...data, updated_at: new Date().toISOString() },
            { onConflict: 'clerk_id' }
        )
        .select()
        .single();

    if (error) {
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
    return (data || []).map((item: ReservationRow) => ({
        ...item,
        facilityId: item.facility_id,
        facilityName: item.facility_name,
        date: new Date(item.visit_date),
        timeSlot: item.time_slot,
        visitorName: item.user_name || item.visitorName,
        visitorCount: item.visitor_count || 1,
        userPhone: item.user_phone,
        status: item.status as Reservation['status']
    }));
};
/**
 * 예약 상태 변경 시 유저에게 인앱 알림 전송
 */
const notifyReservationStatusChange = async (
    reservation: Record<string, unknown>,
    newStatus: 'confirmed' | 'cancelled',
    client: SupabaseClient,
    reason?: string
) => {
    if (!reservation?.user_id) return;

    const facilityName = (reservation.facility_name as string) || '시설';
    const visitDate = (reservation.visit_date as string) || '미정';

    const title = newStatus === 'confirmed'
        ? '예약이 승인되었습니다'
        : '예약이 거절되었습니다';

    const message = newStatus === 'confirmed'
        ? `${facilityName} 예약이 승인되었습니다. 방문일: ${visitDate}`
        : `${facilityName} 예약이 거절되었습니다.${reason ? ` 사유: ${reason}` : ''}`;

    const type = newStatus === 'confirmed' ? 'success' : 'warning';

    try {
        await client.from('user_notifications').insert([{
            user_id: reservation.user_id,
            title,
            message,
            type,
        }]);
    } catch (e) {
        // 알림 실패는 예약 처리를 블록하지 않음
    }
};

export const approveReservation = async (id: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    await notifyReservationStatusChange(data, 'confirmed', client);
    return data;
};

export const rejectReservation = async (id: string, reason: string | undefined, client: SupabaseClient) => {
    const updateData: Record<string, string> = { status: 'cancelled' };
    if (reason) {
        updateData.notes = `[거절 사유] ${reason}`;
    }

    const { data, error } = await client
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    await notifyReservationStatusChange(data, 'cancelled', client, reason);

    // 결제된 예약이 거절되면 환불 요청 플래그 기록
    if (data?.payment_id) {
        try {
            const { requestRefund } = await import('./portone');
            await requestRefund({
                paymentId: data.payment_id,
                reason: reason || '시설 측 예약 거절',
                reservationId: id,
                client,
            });
        } catch (e) {
            console.error('환불 요청 플래그 기록 실패:', e);
        }
    }

    return data;
};

/**
 * 사용자 본인의 예약 목록 조회
 */
export const getMyReservations = async (userId: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my reservations:', error);
        return [];
    }

    return (data || []).map((item: ReservationRow) => ({
        id: item.id,
        facility_id: item.facility_id,
        facility_name: item.facility_name || '시설',
        visit_date: item.visit_date,
        time_slot: item.time_slot,
        status: item.status,
        visitor_count: item.visitor_count || 1,
        message: item.message,
        created_at: item.created_at,
        payment_id: item.payment_id,
        visitor_name: item.visitor_name,
    }));
};

/**
 * 예약 취소
 */
export const cancelReservation = async (id: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

/**
 * 사용자 전화번호 조회
 */
export const getUserPhoneNumber = async (userId: string, client: SupabaseClient): Promise<string> => {
    const db = client;
    const { data, error } = await db
        .from('profiles')
        .select('phone_number')
        .eq('clerk_id', userId)
        .single();

    if (error) {
        return '';
    }
    return data?.phone_number || '';
};

/**
 * 시설 FAQ 조회 (실제 테이블이 없으면 빈 배열 반환)
 */
export const getFacilityFaqs = async (facilityId: string) => {
    // facility_id가 UUID가 아니면 (정적 ID인 경우) DB 쿼리 스킵
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!facilityId || !UUID_RE.test(facilityId)) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('facility_faqs')
            .select('*')
            .eq('facility_id', facilityId)
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) {
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
};

/**
 * 시설 FAQ 저장 (upsert)
 */
export const upsertFacilityFaq = async (faq: { id?: string; facility_id: string; question: string; answer: string; order_index?: number; category?: string }, client: SupabaseClient) => {
    try {
        const { order, ...rest } = faq as typeof faq & { order?: number };
        const { data, error } = await client
            .from('facility_faqs')
            .upsert({
                ...rest,
                order_index: faq.order_index ?? order ?? 0,
                is_active: true,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('upsertFacilityFaq error:', e);
        return null;
    }
};

/**
 * 시설 FAQ 삭제 (soft delete)
 */
export const deleteFacilityFaq = async (faqId: string, client: SupabaseClient) => {
    try {
        const { error } = await client
            .from('facility_faqs')
            .update({ is_active: false })
            .eq('id', faqId);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('deleteFacilityFaq error:', e);
        return false;
    }
};

/**
 * [호환성 패치] ReviewList.tsx가 옛날 함수명을 찾아도 작동하도록 연결
 */
export const getReviewsBySpace = getReviews;

export const getFacilitySubscription = async (facilityId: string, client: SupabaseClient) => {
    try {
        const db = client;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

        // [New Strategy] Query both potential columns based on ID type
        let query = db
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
            // Legacy/BIGINT — 숫자만 허용 (PostgREST 필터 주입 방어)
            const numericId = facilityId.replace(/[^0-9]/g, '');
            if (!numericId) return null;
            query = query.or(`facility_id.eq.${numericId},facility_id_bigint.eq.${numericId}`);
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
        .from('facilities')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    if (error) {
        console.error('Error in getUserFacility:', error);
        return null;
    }
    return data?.[0]?.id || null;
};

/**
 * [추가] 사용자 역할(Role) 조회 함수
 */
/**
 * [추가] 사용자 역할(Role) 조회 함수 — get_user_role RPC 사용
 * SECURITY DEFINER이므로 RLS 우회, 인증 클라이언트 필수
 */
export const getUserRole = async (userId: string, client: SupabaseClient) => {
    try {
        const { data, error } = await client.rpc('get_user_role', { p_clerk_id: userId });

        if (error) {
            console.error('get_user_role RPC error:', error.message);
            return { role: 'user', isError: true, error: error.message, facilityId: null };
        }

        if (data && data.length > 0) {
            const row = data[0] as { role: string; facility_id: string | null };
            return { role: row.role, isError: false, facilityId: row.facility_id };
        }

        return { role: 'user', isError: false, facilityId: null };
    } catch (error: unknown) {
        return { role: 'user', isError: true, error: error instanceof Error ? error.message : String(error), facilityId: null };
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
        .ilike('name', `%${sanitizeSearchInput(query)}%`);
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
export const submitPartnerApplication = async (data: PartnerApplicationInput, client: SupabaseClient) => {
    // 1. 파일 업로드
    let licenseUrl = '';
    if (data.businessLicenseImage) {
        try {
            const fileExt = data.businessLicenseImage.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `licenses/${fileName}`;

            const { error: uploadError, data: uploadData } = await client.storage
                .from('partner_docs')
                .upload(filePath, data.businessLicenseImage, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`파일 업로드 실패: ${uploadError.message}`);
            }

            const { data: urlData } = client.storage
                .from('partner_docs')
                .getPublicUrl(filePath);
            licenseUrl = urlData.publicUrl;
        } catch (uploadErr: unknown) {
            console.error('[PartnerUpload] Upload exception:', uploadErr);
        }
    }

    // 2. DB Insert
    const { data: result, error } = await client
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

export const incrementAiUsage = async (facilityId: string, client: SupabaseClient) => {
    try {
        const { error } = await client.rpc('increment_ai_usage', { facility_id: facilityId });
        if (error) {
            // increment_ai_usage RPC가 아직 없을 수 있음 — 무시
        }
    } catch {
        // non-fatal
    }
};

export const updateFacilitySubscription = async (facilityId: string, planId: string, client: SupabaseClient) => {
    const db = client;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

    // 1. 플랜 정보 조회 (가격 등) - name_en 우선, name fallback
    let { data: planData } = await db
        .from('subscription_plans')
        .select('*')
        .ilike('name_en', planId)
        .maybeSingle();

    // name_en이 비어있으면 한글 name으로 재시도
    if (!planData) {
        const nameMap: Record<string, string> = {
            'FREE': '무료', 'BASIC': '베이직', 'PREMIUM': '프리미엄', 'ENTERPRISE': '엔터프라이즈',
            'SJ_STARTER': '상조 STARTER', 'SJ_PROFESSIONAL': '상조 PROFESSIONAL', 'SJ_ENTERPRISE': '상조 ENTERPRISE',
        };
        const korName = nameMap[planId.toUpperCase()];
        if (korName) {
            const { data: fallback } = await db
                .from('subscription_plans')
                .select('*')
                .eq('name', korName)
                .maybeSingle();
            planData = fallback;
        }
    }

    // 다음 결제일 계산 (기본 1개월 뒤)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);

    const upsertData: SubscriptionUpsertData = {
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
    const { data: subData, error: subError } = await db
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
        throw subError;
    }

    // 3. 결제 내역 기록 (매출 통계용)
    if (planData && planData.price > 0 && subData) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { error: payError } = await db
            .from('subscription_payments')
            .insert([{
                subscription_id: subData.id,
                amount: planData.price,
                final_amount: planData.price,
                status: 'completed',
                payment_method: 'card',
                paid_at: now.toISOString(),
                billing_period_start: now.toISOString().split('T')[0],
                billing_period_end: periodEnd.toISOString().split('T')[0],
            }]);

        if (payError) {
            throw new Error(`결제 기록 생성 실패: ${payError.message}`);
        }
    }

    // 4. 슈퍼 관리자 알림 생성
    try {
        const { data: superAdmins } = await db
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

            await db
                .from('user_notifications')
                .insert(notifications);
        }
    } catch {
        // 알림 전송 실패 — non-fatal
    }
};

/**
 * [추가] 구독 재결제 예정일 수동 업데이트 (관리자용)
 */
export const updateSubscriptionBillingDate = async (facilityId: string, nextDate: string, client: SupabaseClient) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

    let query = client.from('facility_subscriptions').update({
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
export const toggleFavorite = async (userId: string, facilityId: string, isFavorite: boolean, client: SupabaseClient) => {
    if (isFavorite) {
        // 찜 해제
        return await client
            .from('favorites')
            .delete()
            .match({ user_id: userId, facility_id: facilityId });
    } else {
        // 찜 등록
        return await client
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
export const getAllSubscriptions = async (client: SupabaseClient) => {
    try {
        const db = client;
        const { data, error } = await db
            .from('facility_subscriptions')
            .select(`
                *,
                facilities (name),
                plan:subscription_plans(name, price)
            `); // Changed facilities:memorial_spaces(name) to facilities (name)

        if (error) throw error;

        return (data || []).map((item: SubscriptionRow) => ({
            id: item.id,
            facilityName: item.facilities?.name || 'Unknown',
            planName: item.plan?.name || 'Unknown',
            expiresAt: item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A',
            price: item.plan?.price || 0,
            status: item.status || 'active'
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
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: PendingFacilityRow) => ({
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
                verified: true,
                // verified_at: new Date().toISOString() // verified_at might not be in new schema, check if needed
            })
            .eq('id', facilityId);
        if (error) throw error;
    } catch (e) {
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
                verified: false, // Just keep it unverified for now
                // rejection_reason: rejectionReason // Check if column exists
            })
            .eq('id', facilityId);
        if (error) throw error;
    } catch (e) {
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
    status: 'pending' | 'waiting' | 'accepted' | 'cancelled' | 'completed';
    notes?: string;
    answer?: string; // Admin's response
    answered_at?: string; // ISO timestamp
    is_read?: boolean; // Admin read status
    // New AI Fields
    is_ai_response: boolean;
    metadata: Record<string, unknown>;
    responder_id?: string | null;
    source: string;
}

/**
 * Create a new funeral consultation (for AI chat form)
 */
export const createFuneralConsultation = async (data: ConsultationData, client: SupabaseClient): Promise<Consultation | null> => {
    try {
        const { data: result, error } = await client
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
    preferences?: Record<string, unknown>;
}): Promise<Consultation | null> => {
    try {
        // [Fix] This seems to rely on 'memorial_consultations' which might be legacy.
        // Assuming 'consultations' is the unified table now.
        const { data: result, error } = await supabase
            .from('consultations') // Changed from memorial_consultations
            .insert({
                ...data,
                status: 'waiting'
            })
            .select()
            .single();
        if (error) {
            console.error('createMemorialConsultation error:', error);
            return null;
        }
        return result as Consultation;
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
            .not('status', 'eq', 'cancelled')
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
    status: 'pending' | 'waiting' | 'accepted' | 'cancelled' | 'completed',
    notes: string | undefined,
    client: SupabaseClient
): Promise<boolean> => {
    try {
        const updateData: { status: string; notes?: string } = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const { error } = await client
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
    answer: string,
    client: SupabaseClient
): Promise<boolean> => {
    try {
        const { error } = await client
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
export const markConsultationAsRead = async (consultationId: string, client: SupabaseClient): Promise<boolean> => {
    try {
        const { error } = await client
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
export const updateConsultation = async (id: string, data: Record<string, unknown> | unknown[], client?: SupabaseClient) => {
    // If data has answer, route to answerConsultation logic?
    // But better to deprecate this stub.
    // Deprecated: answerConsultation 또는 updateConsultationStatus 사용 권장
    if (!Array.isArray(data) && typeof data.answer === 'string' && client) {
        return answerConsultation(id, data.answer, client);
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
export const fetchFacilitiesInView = async (bounds: MapBounds, token?: string) => {
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

export const createNotice = async (title: string, content: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('platform_notices')
        .insert([{
            title,
            content,
            is_active: true,
        }])
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const getNotices = async () => {
    const { data, error } = await supabase
        .from('platform_notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        return [];
    }

    return data.map((n: NoticeRow) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        // Assuming 'created_at' exists
        date: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Unknown date'
    }));
};

export const getInquiries = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inquiries:', error);
        return [];
    }

    return data.map((i: InquiryRow) => ({
        id: i.id,
        companyName: i.company_name,
        managerName: i.manager_name,
        phone: i.phone,
        email: i.email,
        message: i.message,
        inquiryType: i.inquiry_type,
        type: i.business_type || i.type,
        createdAt: i.created_at ? new Date(i.created_at).toLocaleDateString() : 'Unknown date',
        status: (i.status === 'completed' || i.status === 'approved') ? 'resolved' as const : 'pending' as const
    }));
};
