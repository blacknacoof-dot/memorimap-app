import React from 'react';

export interface ServiceDetail {
  category: string;
  items: string[];
  notes?: string;
}

export interface SangjoProduct {
  id: string;
  name: string;
  price: number;
  tagline: string; // 추가: 짧은 홍보 문구
  description: string;
  serviceDetails: ServiceDetail[]; // 추가: 카테고리별 상세 서비스 내역
  includedServices: string[];
  optionalServices: string[];
  distinguishingFeatures?: string[];
  faq?: Array<{ q: string; a: string }>; // 추가: 상품별 전문 FAQ
}

export interface FuneralCompany {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  features: string[];
  phone: string;
  priceRange: string;
  benefits: string[];
  galleryImages?: string[];
  reviews?: Review[];
  products?: SangjoProduct[]; // 추가: 상조 상품 목록
  specialties?: string[]; // 추가: 업체 특화 서비스
  supportPrograms?: string[]; // 추가: 정부 지원/할인 프로그램
  ai_tone?: AiTone; // AI 말투 설정
  ai_welcome_message?: string; // AI 첫인사 메시지
  ai_context?: string; // AI 상담용 추가 지식
  ai_price_summary?: Record<string, string | number>; // AI 학습용 가격 요약
}

export interface Review {
  id: string;
  userId?: string; // Optional for backward compatibility
  user_id?: string; // Keeps compatibility with DB snake_case if used raw
  userName: string;
  userImage?: string;
  facility_id?: number | string;
  space_id?: string; // Legacy compatibility
  rating: number;
  content: string;
  images?: string[];
  created_at?: string;
  date: string; // Keep for compatibility, map from created_at
}

export type AiTone = 'polite' | 'warm' | 'factual';
export type FacilityType = 'FUNERAL_HOME' | 'MEMORIAL_PARK' | 'SANGJO';
export type ActionType = 'NONE' | 'RESERVE' | 'MAP' | 'CALL_MANAGER' | 'RECOMMEND' | 'SWITCH_TO_CONSULT' | 'SHOW_FORM_A' | 'SHOW_FORM_B' | 'SHOW_FORM_C' | 'SHOW_FORM_D' | 'SHOW_PRODUCTS' | 'URGENT_DISPATCH' | 'URGENT_CHECK' | 'URGENT_RESERVATION_CONFIRM' | 'SHOW_PROCESS' | 'GO_MY_PAGE';
export type AiActionType = ActionType; // Backward compatibility

export enum AiConsultationStatus {
  IDLE = 'idle',
  AI_HANDLING = 'ai_handling',
  AGENT_REQUESTED = 'agent_requested',
  AGENT_CONNECTED = 'agent_connected',
  CONSULTATION_CONFIRMED = 'consultation_confirmed',
  COMPLETED = 'completed'
}

export interface AiConsultation {
  id: string;
  conversation_id: string;
  user_id: string | null;
  facility_id: number | string | null;
  facility_name: string;
  category: 'funeral' | 'pet' | 'memorial' | 'general';
  status: AiConsultationStatus;
  messages: any[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: 'user' | 'model' | 'system';
  text: string | React.JSX.Element;
  timestamp: Date;
  action?: ActionType;
  options?: { label: string; value: string }[];
}

export type { FacilityCategoryType } from './facility';
// ============================================================
// RE-EXPORT FROM FACILITY TYPES (Single Source of Truth)
// ============================================================
export type {
  Facility,
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

export type { Reservation } from './db';

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
}

export interface Partner {
  id: string;
  name: string; // Display name
  company_name: string;
  company_logo_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  subscription_plan: 'basic' | 'pro' | 'enterprise';
  subscription_expires_at?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  funeral_location?: string; // Physical location
  ai_context?: {
    prices?: string;
    tone?: string;
    emphasis?: string[];
    forbidden?: string[];
    welcome_message?: string;
    description?: string;
    benefits?: string[];
  };
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface PartnerConversation {
  id: string;
  partner_id: string;
  user_id?: string;
  user_name?: string;
  user_phone?: string;
  conversation_status: 'ai_handling' | 'agent_requested' | 'agent_connected' | 'closed';
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    buttons?: Array<{ label: string; action: string }>;
  }>;
  tags: string[];
  priority: 'normal' | 'high' | 'critical';
  assigned_agent?: string;
  created_at: string;
  last_message_at: string;
}

export interface PartnerOperation {
  id: string;
  partner_id: string;
  conversation_id?: string;
  contract_id?: string;
  operation_stage: 'pending' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';
  deceased_name?: string;
  funeral_director?: string;
  funeral_location?: string;
  estimated_cost?: number;
  actual_cost?: number;
  dispatch_time?: string;
  completion_time?: string;
  field_photos?: string[];
  notes?: string;
  created_at: string;
}

export interface PlatformNotice {
  id: string;
  title: string;
  content: string;
  notice_type: 'info' | 'warning' | 'urgent';
  target_partner_ids?: string[];
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface SangjoContract {
  id: string; // Add id for referencing
  contract_number: string;
  sangjo_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  service_type?: string;
  religion?: string;
  region?: string;
  total_price: number;
  status: "상담신청" | "예약대기" | "임종발생" | "현장도착" | "염습중" | "장례식진행" | "완료";
  emergency_level?: 'normal' | 'urgent' | 'critical';
  platform_fee?: number;
  assigned_counselor?: string;
  created_at: string;
  death_time?: string;
  current_location?: string;
  application_type?: 'CONTRACT' | 'CONSULTATION';
  preferred_call_time?: string;
  timeline?: Array<{
    time: string;
    event: string;
    notes?: string;
    photo_url?: string;
  }>;
}