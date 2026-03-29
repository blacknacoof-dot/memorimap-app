/**
 * 요금제 Feature Gating 타입 정의
 */

/** 엔딩노트 접근 레벨 */
export type EndingNoteLevel = 'basic' | 'full' | 'full_pdf';

/** 유저 쿼터 타입 */
export type UserQuotaType = 'ai_consult' | 'sangjo_compare' | 'favorite';

/** 시설 쿼터 타입 */
export type FacilityQuotaType = 'ai_chat' | 'sms';

/** AI 상담 카테고리 */
export type AiConsultCategory = 'funeral_home' | 'memorial_facility' | 'pet_funeral';

/** 유저 플랜별 한도 (subscription_plans.features JSONB 매핑) */
export interface UserPlanLimits {
  ai_consult_per_category: number; // -1 = 무제한
  sangjo_compare: number;
  favorites: number;
  ending_note: EndingNoteLevel;
  ads: boolean;
  discount_pct: number;
  family_sharing: number;
}

/** get_user_plan_info RPC 반환 타입 */
export interface UserPlanInfo {
  plan_id: string;
  plan_name: string;
  ai_consult_by_category: Record<AiConsultCategory, number>;
  sangjo_compare_used: number;
  favorites_count: number;
  sangjo_favorites_count: number;
  limits: UserPlanLimits;
  expires_at: string | null;
  status?: 'active' | 'cancelling' | 'cancelled' | 'expired' | 'pending';
}

/** 쿼터 체크 결과 (check_and_increment RPC 반환) */
export interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  limit: number; // -1 = 무제한
  reason?: 'user_limit' | 'facility_limit' | string | null;
}
