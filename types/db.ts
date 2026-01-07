/**
 * Memorimap (추모맵) Database Types
 * Supabase DB 스키마와 100% 일치해야 합니다.
 */

// ==========================================
// 1. 공통 Enum & Types
// ==========================================
export type UserRole = 'user' | 'facility_admin' | 'sangjo_hq_admin' | 'super_admin';
export type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show' | 'urgent'; // Added 'urgent' to support existing logic
export type FacilityType = 'charnel_house' | 'natural_burial' | 'funeral_home' | 'complex' | 'pet'; // Added 'pet' to support Pet features

// --- [Phase 4 New Types] ---
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type TargetAudience = 'all' | 'facility_admin' | 'user';

export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string;
    created_at: string;
}

// ==========================================
// 2. 테이블 인터페이스
// ==========================================

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    phone_number: string | null;
    role: UserRole;
    created_at: string;
}

export interface Reservation {
    id?: string;
    visit_date: string;
    visit_time?: string; // Legacy/Display
    time_slot: string; // DB Column
    visitor_name: string;
    visitor_count: number;
    contact_number: string;
    special_requests?: string; // DB Column (was request_note)
    request_note?: string; // Alias/Legacy
    purpose?: string;
    facility_id: string;
    user_id: string;
    status: ReservationStatus;
    rejection_reason?: string | null;
    manager_note?: string | null;
    payment_amount?: number; // Re-added for logic
    created_at?: string;
}

export interface MemorialSpace {
    id: string;
    owner_user_id: string | null; // DB Column (was manager_id)
    manager_id?: string | null; // Alias/Legacy
    name: string;
    address: string;
    type: FacilityType;
    description?: string | null;
    image_urls?: string[];
    ai_context?: string | null;
    ai_features?: string[]; // Kept for logic
    is_verified: boolean;
    subscription_tier?: SubscriptionPlan; // Updated type
}

export interface PartnerInquiry {
    id: string;
    user_id: string;
    company_name: string;
    contact_person: string;
    contact_number: string;
    manager_mobile?: string; // New field
    company_email?: string; // New field (Login ID)
    email?: string;
    address?: string; // New field
    business_license_url?: string; // New field
    business_type?: 'funeral_home' | 'sangjo' | 'memorial_park' | 'pet_funeral';
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

// --- [Phase 4 New Interfaces] ---

/**
 * [Subscriptions] 업체 구독 정보
 */
export interface Subscription {
    id: string;
    facility_id: string;
    facility?: { name: string }; // Joined property
    plan_name: 'Basic' | 'Premium' | 'Enterprise';
    status: 'active' | 'expired' | 'cancelled';
    start_date: string;
    end_date: string | null;
    auto_renew: boolean;
    created_at: string;
}

/**
 * [Payments] 매출/결제 이력
 */
export interface Payment {
    id: string;
    subscription_id: string | null;
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending' | 'refunded';
    payment_method: string | null;
    paid_at: string;
}

/**
 * [Notices] 공지사항
 */
export interface Notice {
    id: string;
    title: string;
    content: string;
    target_audience: TargetAudience;
    is_published: boolean;
    author_id?: string;
    created_at: string;
}

export type Database = any;
