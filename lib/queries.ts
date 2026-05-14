import { FUNERAL_COMPANIES } from '../constants';
import { supabase, setSupabaseAuth } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requestRefund } from './portone';
import { normalizeSubscriptionPlanId } from './subscriptionPlanIds';
import { z } from 'zod';
import { logger } from '../utils/logger';
import type { Review } from '../types';

import {
    buildSafeObjectName,
    validateFacilityImageFile,
    validateImageFile,
    validatePartnerDocumentFile,
} from './security/fileValidation';
import { sanitizeImageFile } from './security/imageSanitize';
import {
    createSignedStorageImageUrl,
    createSignedStorageImageUrls,
    SIGNED_IMAGE_URL_TTL_SECONDS,
} from './security/storageImage';
import { buildSafeOrFilter, normalizeSearchInput } from './security/sqlSanitize';
import { isZodIssueCode } from './validation/commonSchema';
import { facilityUpdateSchema } from './validation/facilitySchema';
import { reviewContentSchema } from './validation/reviewSchema';
import { resolveFacilityDetailImages } from './facilityImageResolver';
import { compareFacilityPlanExposure, getFacilityPlanId } from './facilityPlan';

function logValidationFailure(scope: string, error: z.ZodError) {
    const firstIssue = error.issues[0];
    logger.error('Validation failed', {
        scope,
        code: isZodIssueCode(firstIssue?.message || ''),
        field: firstIssue?.path?.join('.') || 'unknown',
        issueCount: error.issues.length,
    });
}

function validateReviewContent(content: string): string {
    const result = reviewContentSchema.safeParse(content);
    if (!result.success) {
        logValidationFailure('createReview', result.error);
        throw result.error;
    }
    return result.data;
}

function validateFacilityUpdateInput(updates: Record<string, unknown>): void {
    const result = facilityUpdateSchema.safeParse({
        name: updates.name as string | undefined,
        description: updates.description as string | null | undefined,
        website: updates.website as string | null | undefined,
    });
    if (!result.success) {
        logValidationFailure('updateFacility', result.error);
        throw result.error;
    }
}

async function signFacilityImageValue(value: string | null | undefined, client: SupabaseClient = supabase): Promise<string> {
    if (!value) return '';
    return createSignedStorageImageUrl(client, 'facility-images', value, SIGNED_IMAGE_URL_TTL_SECONDS);
}

async function signFacilityImageList(values: string[] | null | undefined, client: SupabaseClient = supabase): Promise<string[]> {
    if (!values || values.length === 0) return [];
    return createSignedStorageImageUrls(client, 'facility-images', values, SIGNED_IMAGE_URL_TTL_SECONDS);
}

async function signReviewImageList(values: string[], client: SupabaseClient = supabase): Promise<string[]> {
    if (values.length === 0) return [];
    const resolved = await Promise.allSettled(
        values.map((value) => createSignedStorageImageUrl(client, 'review-images', value, SIGNED_IMAGE_URL_TTL_SECONDS)),
    );

    return resolved
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter(Boolean);
}

function extractReviewPhotoPaths(row: Record<string, unknown>): string[] {
    if (Array.isArray(row.images)) {
        return row.images.filter((value): value is string => typeof value === 'string');
    }

    if (Array.isArray(row.photos)) {
        return row.photos
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') {
                    return item.url;
                }
                return null;
            })
            .filter((value): value is string => Boolean(value));
    }

    return [];
}

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

interface FacilitySubscriptionSummary {
    plan_id?: string | null;
    status?: string | null;
    subscription_plans?: {
        name?: string | null;
        name_en?: string | null;
        features?: unknown;
    } | null;
}

const buildFacilitySubscriptionView = (subscription: FacilitySubscriptionSummary | null | undefined) => {
    if (!subscription) return undefined;

    const canonicalPlanId = getFacilityPlanId(subscription.subscription_plans?.name_en || subscription.plan_id);

    return {
        plan_name: subscription.subscription_plans?.name || canonicalPlanId,
        plan: {
            name_en: canonicalPlanId.toLowerCase(),
            features: subscription.subscription_plans?.features,
        },
        status: subscription.status || undefined,
    };
};

const enrichFacilityRowsWithSubscriptions = async (rows: FacilityRow[]) => {
    if (rows.length === 0) return new Map<string, ReturnType<typeof buildFacilitySubscriptionView>>();

    const uuidIds = rows
        .map((row) => String(row.id))
        .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    if (uuidIds.length === 0) {
        return new Map<string, ReturnType<typeof buildFacilitySubscriptionView>>();
    }

    const { data } = await supabase
        .from('facility_subscriptions')
        .select(`
            facility_id_uuid,
            plan_id,
            status,
            subscription_plans (
                name,
                name_en,
                features
            )
        `)
        .in('facility_id_uuid', uuidIds);

    const map = new Map<string, ReturnType<typeof buildFacilitySubscriptionView>>();
    for (const row of (data || []) as Array<FacilitySubscriptionSummary & { facility_id_uuid?: string | null }>) {
        if (!row.facility_id_uuid) continue;
        map.set(row.facility_id_uuid, buildFacilitySubscriptionView(row));
    }

    return map;
};

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
        // error handled by return
        return false;
    }
    return !!data;
};

export const checkConfirmedReservationForReview = async (userId: string, facilityId: string, client: SupabaseClient) => {
    const db = client;
    const { data, error } = await db
        .from('reservations')
        .select('id')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .eq('status', 'confirmed')
        .limit(1)
        .maybeSingle();

    if (error) {
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
    const validation = await validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error || '파일 검증 실패');
    }

    const fileExt = validation.sanitizedExtension || 'jpg';
    const fileName = buildSafeObjectName(file, fileExt);
    const filePath = `review-images/${userId}/${fileName}`;
    const sanitizedFile = await sanitizeImageFile(file, fileExt);

    const { error: uploadError } = await db.storage
        .from('review-images')
        .upload(filePath, sanitizedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: sanitizedFile.type,
        });

    if (uploadError) throw uploadError;

    return filePath;
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
    const mappedCategory = mapCategoryToCode(category);
    const { data, error } = await supabase.rpc('search_facilities_v2', {
        p_lat: lat,
        p_lng: lng,
        radius_meters: radius,
        category: mappedCategory || null,
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
        // A. Exact 'Dong' Search (e.g. "식사동") — 카테고리 필터 적용
        let regionResults = await searchFacilitiesByRegion(regionText, searchCategory);
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
                    const { data: nearbyData } = await searchFacilitiesV2(baseLat, baseLng, radius, searchCategory, 10);
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

    const subscriptionByFacilityId = await enrichFacilityRowsWithSubscriptions(results);

    // Sort: 1) 지역 일치 우선  2) 플랜 노출 우선순위  3) Rating Descending
    if (regionText) {
        const safeRegion = regionText.split(' ')[0];
        results.sort((a, b) => {
            const addrA = a.address || a.full_address || '';
            const addrB = b.address || b.full_address || '';
            const matchA = addressContainsRegion(addrA, safeRegion) ? 1 : 0;
            const matchB = addressContainsRegion(addrB, safeRegion) ? 1 : 0;
            if (matchB !== matchA) return matchB - matchA; // 지역 일치 우선
            const exposureDiff = compareFacilityPlanExposure(
                subscriptionByFacilityId.get(String(a.id))?.plan?.name_en,
                subscriptionByFacilityId.get(String(b.id))?.plan?.name_en,
            );
            if (exposureDiff !== 0) return exposureDiff;
            return (b.rating || 0) - (a.rating || 0);
        });
    } else {
        results.sort((a, b) => {
            const exposureDiff = compareFacilityPlanExposure(
                subscriptionByFacilityId.get(String(a.id))?.plan?.name_en,
                subscriptionByFacilityId.get(String(b.id))?.plan?.name_en,
            );
            if (exposureDiff !== 0) return exposureDiff;
            return (b.rating || 0) - (a.rating || 0);
        });
    }

    // Limit to 5 (User asked for 3, but 5 covers scrolling)
    results = results.slice(0, 5);

    // Map to Frontend Model
    return Promise.all(results.map(async (r) => ({
        ...r,
        lat: r.latitude || r.lat,
        lng: r.longitude || r.lng,
        imageUrl: await signFacilityImageValue((r.image_url as string | undefined) || ((r.images && r.images.length > 0) ? r.images[0] : null)),
        subscription: subscriptionByFacilityId.get(String(r.id)),
        reviewCount: r.review_count,
        rating: r.rating || 0
    })));
};


export const searchFacilitiesByRegion = async (
    region: string,
    category?: string
) => {
    // [Security] Sanitize input to prevent SQL injection
    const sanitized = normalizeSearchInput(region);
    const optimizedRegion = sanitized.trim().replace(/\s+/g, '%');

    const { data, error } = await supabase.rpc('search_facilities_by_text', {
        p_text: optimizedRegion,
        p_category: category || null,
        p_max_results: 20
    });

    if (error) {
        // silent fallback
        return [];
    }
    return data || [];
};

/**
 * [NEW] Region Autocomplete RPC usage
 */
export const getDistinctRegions = async (searchText: string) => {
    // [Security] Sanitize input to prevent SQL injection
    const sanitized = normalizeSearchInput(searchText);

    const { data, error } = await supabase.rpc('get_distinct_regions', {
        search_text: sanitized
    });

    if (error) {
        // silent fallback
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
    const sanitized = normalizeSearchInput(searchText);
    if (!sanitized || sanitized.length < 2) return [];

    const { data, error } = await supabase
        .from('facilities')
        .select('address')
        .ilike('address', `%${sanitized}%`)
        .not('address', 'is', null)
        .limit(100);

    if (error || !data) {
        // silent fallback
        return [];
    }

    const SHORT_TO_FULL: Record<string, string> = {
        '서울': '서울특별시', '경기': '경기도', '부산': '부산광역시',
        '대구': '대구광역시', '인천': '인천광역시', '광주': '광주광역시',
        '대전': '대전광역시', '울산': '울산광역시', '세종': '세종특별자치시',
        '제주': '제주특별자치도', '강원': '강원특별자치도', '충북': '충청북도',
        '충남': '충청남도', '전북': '전북특별자치도', '전남': '전라남도',
        '경북': '경상북도', '경남': '경상남도',
    };
    const regions = new Set<string>();
    data.forEach((item: { address: string }) => {
        if (!item.address) return;
        const parts = item.address.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            const normalized = SHORT_TO_FULL[parts[0]] || parts[0];
            regions.add(`${normalized} ${parts[1]}`);
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
        // silent fallback

        // [Fix] 존재하지 않는 레거시 ID(fc6 등)인 경우 null 반환하여 UI 충돌 방지
        if (error.code === 'PGRST116') {
            return null;
        }

        throw error;
    }
    // Map DB fields to Frontend types (Normalize snake_case to camelCase for UI)
    const resolvedImages = await resolveFacilityDetailImages(data, {
        signImage: (value) => signFacilityImageValue(value),
    });
    const subscription = await getFacilitySubscription(String(data.id), supabase);

    return {
        ...data,
        lat: data.latitude,
        lng: data.longitude,
        imageUrl: resolvedImages.imageUrl,
        priceRange: data.price_range,
        galleryImages: resolvedImages.galleryImages,
        subscription: subscription ? {
            plan_name: subscription.plan_name,
            plan: subscription.plan,
            status: subscription.status,
        } : undefined,
    };
};

// --- [상담 기능] (Consultations) ---

export const createConsultation = async (
    facilityId: string,
    userId: string,
    userName: string,
    userPhone: string,
    notes: string,
    topic: string | undefined,
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
                topic: topic ?? null,
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
    const _leadResult = await createLead({
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
            // silent fallback
            return [];
        }

        const sortedRows = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const resolvedRows: Review[] = await Promise.all(sortedRows.map(async (row: Record<string, unknown>) => ({
            id: String(row.id || ''),
            user_id: typeof row.user_id === 'string' ? row.user_id : undefined,
            userName: String(row.author_name || row.userName || '익명'),
            rating: Number(row.rating || 0),
            content: String(row.content || ''),
            images: await signReviewImageList(extractReviewPhotoPaths(row)),
            created_at: row.created_at ? String(row.created_at) : undefined,
            date: row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : new Date().toLocaleDateString(),
        })));

        return resolvedRows;
    } catch (_e) {
        // silent fallback
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
        // silent fallback
        return [];
    }

    const sortedRows = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return Promise.all(sortedRows.map(async (row: Record<string, unknown>): Promise<Review> => ({
        id: String(row.id || ''),
        user_id: typeof row.user_id === 'string' ? row.user_id : undefined,
        userName: String(row.author_name || row.userName || '익명'),
        rating: Number(row.rating || 0),
        content: String(row.content || ''),
        images: await signReviewImageList(extractReviewPhotoPaths(row), db),
        created_at: row.created_at ? String(row.created_at) : undefined,
        date: row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : new Date().toLocaleDateString(),
    })));
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
    const validatedContent = validateReviewContent(content);
    const insertData = {
        facility_id: facilityId,
        user_id: userId,
        rating,
        content: validatedContent,
        author_name: userName || '익명',
        photos: images.map(url => ({ url })), // TEXT[] -> JSONB 형식 변환
        is_active: true,
        created_at: new Date().toISOString()
    };

    const { data, error } = await db
        .from('facility_reviews')
        .insert([insertData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteReview = async (reviewId: string, client: SupabaseClient) => {
    const db = client;
    const { error } = await db
        .from('facility_reviews')
        .update({
            is_active: false,
            deleted_at: new Date().toISOString()
        })
        .eq('id', reviewId);

    if (error) throw error;
    return true;
};

/**
 * [추가] 시설 정보 업데이트
 */
export const updateFacility = async (id: string, updates: Record<string, unknown>, client: SupabaseClient) => {
    const db = client;
    validateFacilityUpdateInput(updates);
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
            { id: userId, clerk_id: userId, ...data, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
        )
        .select()
        .single();

    if (error) {
        throw error;
    }
    return result;
};

/** @deprecated Dead code. Use facilityAdmin.fetchFacilityReservations with auth client instead. */
/**
 * 예약 상태 변경 시 유저에게 인앱 알림 전송
 */
const notifyReservationStatusChange = async (
    reservation: Record<string, unknown>,
    newStatus: 'confirmed' | 'cancelled' | 'rejected',
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
    } catch (_e) {
        // silent fail — 알림 실패가 예약 처리를 방해하지 않도록
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
    const updateData: Record<string, string> = { status: 'rejected' };
    if (reason) {
        updateData.rejection_reason = reason;
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

    await notifyReservationStatusChange(data, 'rejected', client, reason);

    // 결제된 예약이 거절되면 환불 요청 플래그 기록
    if (data?.payment_id) {
        try {
            await requestRefund({
                paymentId: data.payment_id,
                reason: reason || '시설 측 예약 거절',
                reservationId: id,
                client,
            });
        } catch (_e) {
            // 환불 플래그 실패 — 메인 흐름에 영향 없음
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
        // silent fallback
        return [];
    }

    return (data || [])
        .filter((item: ReservationRow) => !(
            item.status === 'pending'
            && Number(item.payment_amount ?? 0) > 0
            && item.payment_verified === false
        ))
        .map((item: ReservationRow) => ({
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
        payment_verified: item.payment_verified as boolean | undefined,
        contact_number: item.contact_number,
        special_requests: item.special_requests,
        purpose: item.purpose,
        payment_amount: item.payment_amount,
        paid_at: item.paid_at,
        rejection_reason: item.rejection_reason,
        manager_note: item.manager_note,
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
    } catch (_e) {
        return [];
    }
};

/**
 * 시설 FAQ 저장 (upsert)
 */
export const upsertFacilityFaq = async (faq: { id?: string; facility_id: string; question: string; answer: string; order_index?: number; category?: string }, client: SupabaseClient) => {
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
};

/**
 * 시설 FAQ 삭제 (soft delete)
 */
export const deleteFacilityFaq = async (faqId: string, client: SupabaseClient) => {
    const { error } = await client
        .from('facility_faqs')
        .update({ is_active: false })
        .eq('id', faqId);
    if (error) throw error;
    return true;
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
                    name_en,
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
            query = query.or(buildSafeOrFilter([`facility_id.eq.${numericId}`, `facility_id_bigint.eq.${numericId}`]));
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            // silent fallback
            return null;
        }

        // Return flattened object for easier UI handling
        if (data) {
            const subscriptionView = buildFacilitySubscriptionView(data as FacilitySubscriptionSummary);
            return {
                ...data,
                plan_name: data.subscription_plans?.name || data.plan_id,
                plan_price: data.subscription_plans?.price,
                next_billing_date: data.next_billing_date,
                plan: subscriptionView?.plan,
            };
        }

        return null;
    } catch (_e) {
        // silent fallback
        return null;
    }
};

/**
 * [추가] 사용자 할당 시설 조회
 */
/** @deprecated Dead code. Dashboard uses inline auth client query. */

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
            // RPC error — fallback to null
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
        .ilike('name', `%${normalizeSearchInput(query)}%`);
    // Note: Removed owner_user_id filter - show all facilities, UI will warn if already claimed

    if (type) {
        queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder.limit(10);

    if (error) {
        // silent fallback
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
        // silent fallback
        return [];
    }

    return data || [];
};

/**
 * [추가] 파트너 입점 신청 제출
 */
export const submitPartnerApplication = async (data: PartnerApplicationInput, client: SupabaseClient) => {
    // 1. 파일 업로드
    let licensePath = '';
    if (data.businessLicenseImage) {
        try {
            const validation = await validatePartnerDocumentFile(data.businessLicenseImage);
            if (!validation.valid) {
                throw new Error(validation.error || '파일 검증 실패');
            }

            const fileExt = validation.sanitizedExtension || 'pdf';
            const fileName = buildSafeObjectName(data.businessLicenseImage, fileExt);
            const ownerScope = (data.userId || 'authenticated-user').replace(/[^a-zA-Z0-9-]/g, '-');
            const filePath = `licenses/${ownerScope}/${fileName}`;
            const uploadFile = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)
                ? await sanitizeImageFile(data.businessLicenseImage, fileExt)
                : data.businessLicenseImage;

            const { error: uploadError, data: _uploadData } = await client.storage
                .from('partner_docs')
                .upload(filePath, uploadFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: uploadFile.type
                });

            if (uploadError) {
                throw new Error(`파일 업로드 실패: ${uploadError.message}`);
            }

            licensePath = filePath;
        } catch (uploadErr) {
            throw uploadErr instanceof Error ? uploadErr : new Error('파일 업로드 실패');
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
            business_license_url: licensePath,
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
export const uploadFacilityImage = async (facilityId: string, file: File, client: SupabaseClient) => {
    const validation = await validateFacilityImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error || '파일 검증 실패');
    }

    const fileExt = validation.sanitizedExtension || 'jpg';
    const fileName = buildSafeObjectName(file, fileExt);
    const filePath = `${facilityId}/${fileName}`;
    const sanitizedFile = await sanitizeImageFile(file, fileExt);

    const { error: uploadError } = await client.storage
        .from('facility-images')
        .upload(filePath, sanitizedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: sanitizedFile.type
        });

    if (uploadError) throw uploadError;

    return filePath;
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
                return await signFacilityImageList(data.images);
            }
        }
        return [];

    } catch (_e) {
        // silent fallback
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
    const normalizedPlanId = normalizeSubscriptionPlanId(planId) ?? planId;

    // 1. 플랜 정보 조회 (가격 등) - name_en 우선, name fallback
    let { data: planData } = await db
        .from('subscription_plans')
        .select('*')
        .eq('name_en', planId)
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
        plan_id: normalizedPlanId,
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
            plan_id: normalizedPlanId
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
                payment_context: 'facility',
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
            .select('clerk_id')
            .eq('role', 'super_admin');

        if (superAdmins && superAdmins.length > 0) {
            const notifications = superAdmins.map(admin => ({
                user_id: admin.clerk_id,
                title: '신규 구독 발생',
                message: `${planData?.name || normalizedPlanId} 플랜 결제가 완료되었습니다.`,
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
 * [추가] Personal 구독 업데이트 + 결제이력 기록
 * PersonalSubscriptionPlans에서 호출. subscription_payments에 personal 결제이력 저장.
 */
export const updatePersonalSubscription = async (
    userId: string,
    planId: string,
    planNameEn: string,
    price: number,
    portonePaymentId: string | null,
    client: SupabaseClient
) => {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // 1. user_subscriptions upsert (plan_id도 uppercase canonical로 저장)
    const { error: subError } = await client
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            plan_id: planNameEn,
            plan_name: planNameEn,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            billing_cycle: 'monthly',
        }, { onConflict: 'user_id' });

    if (subError) {
        throw new Error(`구독 업데이트 실패: ${subError.message}`);
    }

    // 2. 결제이력 기록 (유료 플랜만)
    if (price > 0) {
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { error: payError } = await client
            .from('subscription_payments')
            .insert([{
                user_id: userId,
                payment_context: 'personal',
                portone_payment_id: portonePaymentId,
                amount: price,
                final_amount: price,
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

    // 3. 슈퍼 관리자 알림
    try {
        const { data: superAdmins } = await client
            .from('profiles')
            .select('clerk_id')
            .eq('role', 'super_admin');

        if (superAdmins && superAdmins.length > 0) {
            const notifications = superAdmins.map(admin => ({
                user_id: admin.clerk_id,
                title: '개인 구독 결제',
                message: `${planNameEn} 플랜 결제가 완료되었습니다.`,
                type: 'success',
                link: '/admin?tab=subs'
            }));

            await client.from('user_notifications').insert(notifications);
        }
    } catch {
        // 알림 전송 실패 — non-fatal
    }
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
    return (data as unknown as Array<{ facility_id: string; facilities: Record<string, unknown> | null }>)
        .map(f => f.facilities)
        .filter((f): f is Record<string, unknown> => f !== null);
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
    } catch (_e) {
        // silent fallback
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
    } catch (_e) {
        // silent fallback
        return [];
    }
};

export const approveFacility = async (facilityId: string, client: SupabaseClient) => {
    const { error } = await client
        .from('facilities')
        .update({ verified: true })
        .eq('id', facilityId);
    if (error) throw error;
};

export const rejectFacility = async (facilityId: string, _rejectionReason: string = "운영팀 문의 요망", client: SupabaseClient) => {
    const { error } = await client
        .from('facilities')
        .update({ verified: false })
        .eq('id', facilityId);
    if (error) throw error;
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
                    price_range,
                    prices,
                    packages,
                    operating_hours,
                    ai_context,
                    ai_welcome_message,
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
                    price_range,
                    prices,
                    packages,
                    operating_hours,
                    ai_context,
                    ai_welcome_message,
                    image_url,
                    images
                `)
                .eq('legacy_id', facilityId)
                .single();
        }

        const { data, error } = await query;

        if (error) {
            // silent fallback
            return null;
        }

        return {
            ...data,
            priceRange: data.price_range,
            image_url: await signFacilityImageValue(data.image_url),
            images: await signFacilityImageList(data.images || [])
        };
    } catch (_e) {
        // silent fallback
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

export interface FuneralConsultation extends ConsultationData {
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

/** FuneralConsultation alias — 대부분의 컴포넌트가 Consultation으로 참조 */
export type Consultation = FuneralConsultation;

/**
 * Create a new funeral consultation (for AI chat form)
 */
export const createFuneralConsultation = async (data: ConsultationData, client: SupabaseClient): Promise<FuneralConsultation | null> => {
    try {
        const { data: result, error } = await client
            .from('consultations')
            .insert({
                ...data,
                status: 'waiting'
            })
            .select()
            .single();

        if (error) throw error;
        return result as FuneralConsultation;
    } catch {
        return null;
    }
};

export const createMemorialConsultation = async (data: {
    facility_id: string;
    user_id?: string;
    user_name?: string;
    user_phone?: string;
    mode: string; // 'urgent' | 'prepare'
    religion?: string;
    budget?: string;
    lighting?: string;
    tier?: string;
    preferences?: Record<string, unknown>;
}, client: SupabaseClient): Promise<FuneralConsultation | null> => {
    const { data: result, error } = await client
        .from('consultations')
        .insert({
            ...data,
            status: 'waiting'
        })
        .select()
        .single();
    if (error) throw error;
    return result as FuneralConsultation;
};
/**
 * Get consultations by facility ID (for facility dashboard)
 */
export const getConsultationsByFacility = async (
    facilityId: string,
    status: string | undefined,
    client: SupabaseClient
): Promise<FuneralConsultation[]> => {
    let query = client
        .from('consultations')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FuneralConsultation[];
};

/**
 * Get consultations by user ID (for My Page)
 */
export const getConsultationsByUser = async (userId: string, client: SupabaseClient): Promise<FuneralConsultation[]> => {
    const { data, error } = await client
        .from('consultations')
        .select('*')
        .eq('user_id', userId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FuneralConsultation[];
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

        if (error) throw error;
        return true;
    } catch {
        return false;
    }
};

/** @deprecated Use getConsultationsByFacility directly */
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

        if (error) throw error;
        return true;
    } catch {
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
    } catch {
        return false;
    }
};

// Remove Stub or Redirect
export const updateConsultation = async (id: string, data: Record<string, unknown> | unknown[], client: SupabaseClient) => {
    if (!Array.isArray(data) && typeof data.answer === 'string') {
        return answerConsultation(id, data.answer, client);
    }
    if (Array.isArray(data)) {
        const { error } = await client
            .from('consultations')
            .update({ messages: data, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    }
    return false;
};

/**
 * Get single consultation by ID
 */
export const getConsultationById = async (consultationId: string, client: SupabaseClient): Promise<FuneralConsultation | null> => {
    const { data, error } = await client
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

    if (error) throw error;
    return data as FuneralConsultation;
};

/**
 * Fetch facilities within the current map viewport
 * Uses RPC 'search_facilities_in_view'
 */
export const fetchFacilitiesInView = async (
    bounds: MapBounds,
    token?: string,
    _signal?: AbortSignal,
    options?: { zoomLevel?: number }
) => {
    try {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        // Legacy token arg is ignored because the shared Supabase client manages auth state.
        if (token) {
            setSupabaseAuth(token);
        }

        const { data, error } = await supabase.rpc('search_facilities_in_view', {
            min_lat: sw.lat,
            min_lng: sw.lng,
            max_lat: ne.lat,
            max_lng: ne.lng,
            zoom_level: options?.zoomLevel
        });

        if (error) throw error;
        return data;
    } catch (_e) {
        // Preserve the previous viewport set on transient RPC failures.
        // Returning [] here causes visible marker drop-outs during zoom/pan retries.
        return null;
    }
};

// --- [Phase 1] Fix Missing Exports for AdminCommunication.tsx ---

export interface Inquiry {
    id: string;
    companyName?: string;
    targetFacilityId?: string;
    managerName?: string;
    phone?: string;
    email?: string;
    message?: string;
    inquiryType?: string;
    type?: string;
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

export const getNotices = async (client: SupabaseClient = supabase) => {
    const db = client;
    const { data, error } = await db
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
        date: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Unknown date'
    }));
};

export const getInquiries = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        // silent fallback
        return [];
    }

      return data.map((i: InquiryRow) => ({
          id: i.id,
          companyName: i.company_name,
          targetFacilityId: typeof i.target_facility_id === 'string' ? i.target_facility_id : undefined,
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
