/**
 * Memorimap (추모맵) Database Types
 * Supabase DB 스키마와 100% 일치해야 합니다.
 */

// ==========================================
// 1. 공통 Enum & Types
// ==========================================
export type UserRole = 'user' | 'facility_admin' | 'sangjo_hq_admin' | 'super_admin';
export type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show' | 'urgent'; // Added 'urgent' to support existing logic
// export type FacilityType = 'charnel_house' | 'natural_burial' | 'funeral_home' | 'complex' | 'pet'; // DEPRECATED
// FacilityCategoryType → facility.ts에서 Single Source of Truth로 관리
import type { FacilityCategoryType } from './facility';
export type { FacilityCategoryType };

// --- [Phase 4 New Types] ---
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type TargetAudience = 'all' | 'facility_admin' | 'user';

export interface Favorite {
    id: string;
    user_id: string;
    facility_id: string; // UUID
    created_at: string;
}

export interface SangjoFavorite {
    id: string;
    user_id: string;
    company_id: string;
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
    facility_id: string; // UUID
    facility_name?: string; // Joined field (UI compatibility)
    user_id: string;
    status: ReservationStatus;
    rejection_reason?: string | null;
    manager_note?: string | null;
    payment_amount?: number; // Re-added for logic
    payment_id?: string; // PortOne Payment ID (UI compatibility)
    payment_verified?: boolean; // Edge Function verify-payment에서 설정
    paid_at?: string; // ISO String (UI compatibility)
    funeral_company_id?: string; // (UI compatibility)
    funeral_company_name?: string; // (UI compatibility)
    created_at?: string;
}

export interface MemorialSpace {
    id: number; // [Fixed] BigInt in DB -> number in TS
    owner_user_id: string | null; // DB Column (was manager_id)
    manager_id?: string | null; // Alias/Legacy
    name: string;
    address: string;
    category: FacilityCategoryType; // Changed from type to category for consistency
    // type: FacilityType; // DEPRECATED
    description?: string | null;
    image_urls?: string[];
    ai_context?: string | null;
    ai_features?: string[]; // Kept for logic
    verified: boolean;
    subscription_tier?: SubscriptionPlan; // Updated type
    facilities_id?: string | null; // [Added] Link to facilities table (UUID)
}

export interface PartnerInquiry {
    id: string; // If partner inquiry is UUID, keep string. Usually it is.
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
    target_facility_id?: number | null; // [Fixed] BigInt in DB -> number in TS
}

// --- [Phase 4 New Interfaces] ---

/**
 * [Subscriptions] 업체 구독 정보
 */
export interface Subscription {
    id: string;
    facility_id: number | string;
    facility?: { name: string }; // Joined property
    plan_name: 'Free' | 'Basic' | 'Premium' | 'Enterprise' | string;
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
    description?: string; // Added for compatibility
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

export interface ConsultationLead {
    id: string;
    user_id: string | null;
    user_name: string;
    phone_number: string;
    facility_id: number | null;
    facility_name?: string;
    type: 'visit' | 'counsel' | 'price' | 'other';
    status: 'new' | 'read' | 'contacted' | 'completed';
    created_at: string;
}

/**
 * [Notifications] 유저 알림
 */
export interface UserNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    link?: string;
    created_at: string;
}

// ==========================================
// 3. DB 전용 테이블 (코드에서 직접 매핑 안 되던 테이블)
// ==========================================

/** consultations 테이블 (DB 매핑) */
export interface DBConsultation {
    id: string;
    facility_id: string;
    user_id: string | null;
    user_name: string | null;
    user_phone: string | null;
    urgency: string | null;
    location: string | null;
    needs_ambulance: boolean;
    scale: string | null;
    religion: string | null;
    schedule: string | null;
    status: 'pending' | 'waiting' | 'accepted' | 'cancelled' | 'completed';
    notes: string | null;
    category: string | null;
    created_at: string;
    updated_at: string;
}

/** bot_data 테이블 */
export interface BotData {
    id: string;
    facility_id: number;
    welcome_message: string | null;
    faq_items: Array<{ question: string; answer: string }>;
    ai_context: string | null;
    ai_features: string[];
    price_info: Record<string, unknown>;
    bot_last_updated_at: string;
    created_at: string;
    updated_at: string;
}

/** timeline_events 테이블 */
export interface TimelineEvent {
    id: string;
    facility_id: number;
    reservation_id: string | null;
    user_id: string | null;
    event_type: string;
    event_title: string;
    scheduled_at: string;
    completed_at: string | null;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// ==========================================
// 4. Supabase Database 타입 (제네릭용)
// ==========================================
export type Database = Record<string, unknown>;
