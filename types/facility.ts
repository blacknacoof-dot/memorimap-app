/**
 * Facility Type Definitions
 * Standardized to English codes for internal use
 */

// ============================================================
// CORE TYPES
// ============================================================

/**
 * Standardized facility category codes (English)
 * These match the database enum values
 */
export type FacilityCategoryType =
    | 'funeral_home'    // 장례식장
    | 'columbarium'     // 봉안시설
    | 'natural_burial'  // 자연장
    | 'cemetery'        // 공원묘지
    | 'pet_funeral'     // 동물장례
    | 'sea_burial';     // 해양장

/**
 * Display labels for categories (Korean)
 */
export type FacilityCategoryLabel =
    | '전체'
    | '장례식장'
    | '봉안시설'
    | '자연장'
    | '공원묘지'
    | '동물장례'
    | '해양장';

/**
 * Main Facility interface
 */
export interface Facility {
    id: string;
    name: string;
    facility_type?: FacilityCategoryType; // DB standard (optional for backward compatibility)
    category?: FacilityCategoryType; // Legacy support

    // Location
    lat?: number; // Legacy
    lng?: number; // Legacy
    latitude?: number; // For backward compatibility
    longitude?: number; // For backward compatibility
    address: string;
    address_detail?: string;

    // Contact
    phone?: string;
    email?: string;
    website?: string;

    // Details
    description?: string;
    features?: string[];
    operating_hours?: string;
    priceRange?: string; // Legacy/Display
    rating?: number;
    reviewCount?: number;
    imageUrl?: string;
    galleryImages?: string[];
    reviews?: any[]; // Keep flexible for now

    // Management
    manager_id?: string;
    is_verified?: boolean;
    isVerified?: boolean; // Legacy
    is_public?: boolean;

    // Timestamps
    created_at?: string; // Optional for compatibility
    updated_at?: string; // Optional for compatibility

    // Extra fields for compatibility with existing code
    type?: string; // Legacy
    religion?: string;
    prices?: any[];
    naverBookingUrl?: string;
    isDetailLoaded?: boolean;
    dataSource?: string;
    priceInfo?: any;
    aiContext?: string;
    ai_tone?: string;
    ai_welcome_message?: string;
    ai_price_summary?: Record<string, string | number>;
    subscription?: any;
    products?: any[];
}

// ============================================================
// CATEGORY MAPPINGS
// ============================================================

/**
 * Category configuration with English code and Korean label
 */
export interface CategoryConfig {
    code: FacilityCategoryType | 'all';
    label: FacilityCategoryLabel;
    icon?: string;
    color?: string;
    description?: string;
}

/**
 * Standard category list for filters
 */
export const FACILITY_CATEGORIES: CategoryConfig[] = [
    {
        code: 'all',
        label: '전체',
        icon: '🏢',
        color: '#6B7280',
        description: '모든 시설'
    },
    {
        code: 'funeral_home',
        label: '장례식장',
        icon: '🏛️',
        color: '#3B82F6',
        description: '장례식 및 추모 서비스'
    },
    {
        code: 'columbarium',
        label: '봉안시설',
        icon: '🕯️',
        color: '#8B5CF6',
        description: '유골 안치 시설'
    },
    {
        code: 'natural_burial',
        label: '자연장',
        icon: '🌳',
        color: '#10B981',
        description: '자연 친화적 안장'
    },
    {
        code: 'cemetery',
        label: '공원묘지',
        icon: '⛰️',
        color: '#059669',
        description: '공원형 묘지'
    },
    {
        code: 'pet_funeral',
        label: '동물장례',
        icon: '🐾',
        color: '#F59E0B',
        description: '반려동물 장례'
    },
    {
        code: 'sea_burial',
        label: '해양장',
        icon: '🌊',
        color: '#0EA5E9',
        description: '해양 산골'
    }
];

/**
 * Map English code to Korean label
 */
export const CATEGORY_CODE_TO_LABEL: Record<FacilityCategoryType, FacilityCategoryLabel> = {
    funeral_home: '장례식장',
    columbarium: '봉안시설',
    natural_burial: '자연장',
    cemetery: '공원묘지',
    pet_funeral: '동물장례',
    sea_burial: '해양장'
};

/**
 * Map Korean label to English code
 */
export const CATEGORY_LABEL_TO_CODE: Record<FacilityCategoryLabel, FacilityCategoryType | 'all'> = {
    '전체': 'all',
    '장례식장': 'funeral_home',
    '봉안시설': 'columbarium',
    '자연장': 'natural_burial',
    '공원묘지': 'cemetery',
    '동물장례': 'pet_funeral',
    '해양장': 'sea_burial'
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get category label from code
 */
export function getCategoryLabel(code: FacilityCategoryType): FacilityCategoryLabel {
    return CATEGORY_CODE_TO_LABEL[code];
}

/**
 * Get category code from label
 */
export function getCategoryCode(label: FacilityCategoryLabel): FacilityCategoryType | 'all' {
    return CATEGORY_LABEL_TO_CODE[label];
}

/**
 * Get category config by code
 */
export function getCategoryConfig(code: FacilityCategoryType | 'all'): CategoryConfig | undefined {
    return FACILITY_CATEGORIES.find(c => c.code === code);
}

/**
 * Validate if a string is a valid facility category
 */
export function isValidCategory(value: string): value is FacilityCategoryType {
    return [
        'funeral_home',
        'columbarium',
        'natural_burial',
        'cemetery',
        'pet_funeral',
        'sea_burial'
    ].includes(value);
}

/**
 * Normalize legacy Korean categories to English codes
 * For migration period compatibility
 */
export function normalizeCategoryValue(value: string | null | undefined): FacilityCategoryType {
    if (!value) return 'funeral_home'; // Default fallback

    const normalized = value.toLowerCase().trim();

    // Already standardized
    if (isValidCategory(normalized)) {
        return normalized;
    }

    // Legacy Korean mappings
    const legacyMap: Record<string, FacilityCategoryType> = {
        '장례식장': 'funeral_home',
        '장례': 'funeral_home',
        'funeral': 'funeral_home',

        '봉안시설': 'columbarium',
        '봉안': 'columbarium',
        'charnel': 'columbarium',

        '자연장': 'natural_burial',
        '수목장': 'natural_burial',
        'natural': 'natural_burial',

        '공원묘지': 'cemetery',
        '묘지': 'cemetery',
        'graveyard': 'cemetery',

        '동물장례': 'pet_funeral',
        '반려동물': 'pet_funeral',
        'pet': 'pet_funeral',

        '해양장': 'sea_burial',
        '해양': 'sea_burial',
        'sea': 'sea_burial'
    };

    return legacyMap[normalized] || 'funeral_home';
}

// ============================================================
// FILTER TYPES
// ============================================================

export interface FacilityFilter {
    category?: FacilityCategoryType | 'all';
    searchQuery?: string;
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    isVerified?: boolean;
}

export interface FacilitySearchParams extends FacilityFilter {
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'created_at' | 'distance';
    sortOrder?: 'asc' | 'desc';
}
