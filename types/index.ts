// ============================================================
// RE-EXPORT FROM SANGJO TYPES (Single Source of Truth)
// ============================================================
export type {
  ServiceDetail,
  SangjoProduct,
  FuneralCompany,
  Review,
  AiTone,
  SangjoContract,
  SangjoContractStatus,
  SangjoContractStatusCode,
  Partner,
  PartnerConversation,
  PartnerOperation,
  PlatformNotice,
  ActionType,
  AiActionType,
  Message,
} from './sangjo';

export {
  STATUS_KR_TO_CODE,
  generateDefaultReviews,
} from './sangjo';

export type FacilityType = 'FUNERAL_HOME' | 'MEMORIAL_PARK' | 'SANGJO';

export enum AiConsultationStatus {
  IDLE = 'idle',
  AI_HANDLING = 'ai_handling',
  AGENT_REQUESTED = 'agent_requested',
  AGENT_CONNECTED = 'agent_connected',
  CONSULTATION_CONFIRMED = 'consultation_confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DELETED = 'deleted'
}

export interface AiConsultation {
  id: string;
  conversation_id: string;
  user_id: string | null;
  facility_id: number | string | null;
  facility_name: string;
  category: 'funeral' | 'pet' | 'memorial';
  status: AiConsultationStatus;
  messages: Array<{ role: string; text?: string; content?: string; timestamp?: string | Date; [key: string]: unknown }>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type { FacilityCategoryType, PhysicalFacilityType, SangjoServiceType, StandardFacilityCategoryType } from './facility';
// ============================================================
// RE-EXPORT FROM FACILITY TYPES (Single Source of Truth)
// ============================================================
export type {
  Facility,
  FacilityPackage,
  FacilityManager,
  FacilityFilter,
  FacilitySearchParams,
  CategoryConfig
} from './facility';

export {
  FACILITY_CATEGORIES,
  CATEGORY_CODE_TO_LABEL,
  CATEGORY_LABEL_TO_CODE,
  getCategoryLabel,
  getCategoryCode,
  getCategoryConfig,
  isValidCategory,
  normalizeCategoryValue
} from './facility';

export type {
  Reservation,
  DBConsultation,
  BotData,
  TimelineEvent,
  SangjoFavorite,
  Favorite,
} from './db';

export enum ViewState {
  MAP = 'MAP',
  LIST = 'LIST',
  MY_PAGE = 'MY_PAGE',
  GUIDE = 'GUIDE',
  NOTICES = 'NOTICES',
  SUPPORT = 'SUPPORT',
  SETTINGS = 'SETTINGS',
  ADMIN = 'ADMIN',
  FACILITY_ADMIN = 'FACILITY_ADMIN',
  SUBSCRIPTION_PLANS = 'SUBSCRIPTION_PLANS',
  CONSULTATION = 'CONSULTATION',
  CONSULTATION_HISTORY = 'CONSULTATION_HISTORY',
  SUPER_ADMIN = 'SUPER_ADMIN',
  FUNERAL_COMPANIES = 'FUNERAL_COMPANIES',
  SANGJO_DASHBOARD = 'SANGJO_DASHBOARD',
  PARTNER_INQUIRY = 'PARTNER_INQUIRY',
  PERSONAL_SUBSCRIPTION = 'PERSONAL_SUBSCRIPTION',
  ADMIN_CHECKLIST = 'ADMIN_CHECKLIST',
}

// Partner, PartnerConversation, PartnerOperation, PlatformNotice, SangjoContract
// → re-exported from './sangjo' above