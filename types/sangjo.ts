/**
 * Sangjo (상조) Domain Types
 * 상조 서비스 전용 타입 정의 — Single Source of Truth
 */
import React from 'react';

// ==========================================
// 1. 서비스 상세 & 상품
// ==========================================

export interface ServiceDetail {
  category: string;
  items: string[];
  notes?: string;
}

export interface SangjoProduct {
  id: string;
  name: string;
  price: number;
  tagline: string;
  description: string;
  serviceDetails: ServiceDetail[];
  includedServices: string[];
  optionalServices: string[];
  distinguishingFeatures?: string[];
  faq?: Array<{ q: string; a: string }>;
}

// ==========================================
// 2. 업체 (FuneralCompany)
// ==========================================

export type AiTone = 'polite' | 'warm' | 'factual';

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
  products?: SangjoProduct[];
  specialties?: string[];
  supportPrograms?: string[];
  ai_tone?: AiTone;
  ai_welcome_message?: string;
  ai_context?: string;
  ai_price_summary?: Record<string, string | number>;
}

// ==========================================
// 3. 리뷰
// ==========================================

export interface Review {
  id: string;
  user_id?: string;
  userName: string;
  userImage?: string;
  facility_id?: number | string;
  space_id?: string;
  rating: number;
  content: string;
  images?: string[];
  created_at?: string;
  date: string;
}

// ==========================================
// 4. 계약 (SangjoContract)
// ==========================================

/** 계약 상태 — 한글 (DB 기존 호환) */
export type SangjoContractStatus =
  | '상담신청'
  | '예약대기'
  | '계약진행'
  | '임종발생'
  | '현장도착'
  | '염습중'
  | '장례식진행'
  | '완료';

/** 계약 상태 — 영문 코드 (신규 기능용) */
export type SangjoContractStatusCode =
  | 'consultation_requested'
  | 'reservation_pending'
  | 'contract_in_progress'
  | 'death_occurred'
  | 'arrived_on_site'
  | 'shrouding'
  | 'funeral_in_progress'
  | 'completed';

export const STATUS_KR_TO_CODE: Record<SangjoContractStatus, SangjoContractStatusCode> = {
  '상담신청': 'consultation_requested',
  '예약대기': 'reservation_pending',
  '계약진행': 'contract_in_progress',
  '임종발생': 'death_occurred',
  '현장도착': 'arrived_on_site',
  '염습중': 'shrouding',
  '장례식진행': 'funeral_in_progress',
  '완료': 'completed',
};

export interface SangjoContract {
  id: string;
  contract_number: string;
  sangjo_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  service_type?: string;
  religion?: string;
  region?: string;
  total_price: number;
  status: SangjoContractStatus;
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
  admin_memo?: string;
}

// ==========================================
// 5. 즐겨찾기
// ==========================================

export interface SangjoFavorite {
  id: string;
  user_id: string;
  company_id: string;
  company_name?: string;
  created_at: string;
}

// ==========================================
// 6. 파트너 & 운영
// ==========================================

export interface Partner {
  id: string;
  name: string;
  company_name: string;
  company_logo_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_expires_at?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  funeral_location?: string;
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

// ==========================================
// 7. 채팅 메시지 타입
// ==========================================

export type ActionType =
  | 'NONE' | 'RESERVE' | 'MAP' | 'CALL_MANAGER' | 'RECOMMEND'
  | 'SWITCH_TO_CONSULT' | 'SHOW_FORM_A' | 'SHOW_FORM_B' | 'SHOW_FORM_C'
  | 'SHOW_PRODUCTS' | 'URGENT_DISPATCH' | 'URGENT_CHECK'
  | 'URGENT_RESERVATION_CONFIRM' | 'SHOW_PROCESS' | 'GO_MY_PAGE';

export type AiActionType = ActionType;

export interface Message {
  role: 'user' | 'model' | 'system';
  text: string | React.JSX.Element;
  timestamp: Date;
  action?: ActionType;
  options?: { label: string; value: string }[];
}

// ==========================================
// 8. 기본 리뷰 생성 유틸
// ==========================================

const DEFAULT_REVIEW_TEMPLATES = [
  { content: '상담부터 진행까지 꼼꼼하게 안내해주셔서 감사했습니다. 어려운 시기에 큰 힘이 되었어요.', rating: 5 },
  { content: '가격 대비 서비스가 훌륭했습니다. 직원분들이 정말 친절하고 세심하게 신경 써주셨어요.', rating: 5 },
  { content: '급하게 진행해야 했는데 빠르게 대응해주셔서 감사합니다. 전체적으로 만족스러웠습니다.', rating: 4 },
  { content: '지인 추천으로 이용했는데 역시 믿을 만했습니다. 절차 안내도 친절하고 깔끔했어요.', rating: 5 },
  { content: '처음이라 막막했는데 하나하나 설명해주시고 부담 없이 진행해주셔서 좋았습니다.', rating: 4 },
];

const DEFAULT_NAMES = ['김민수', '이서연', '박지훈', '최영희', '정하늘'];

export function generateDefaultReviews(companyId: string): Review[] {
  let seed = 0;
  for (let i = 0; i < companyId.length; i++) {
    seed = ((seed << 5) - seed) + companyId.charCodeAt(i);
    seed |= 0;
  }
  const sr = (idx: number) => {
    const x = Math.sin(seed + idx * 9301) * 10000;
    return x - Math.floor(x);
  };
  const now = Date.now();
  return DEFAULT_REVIEW_TEMPLATES.map((tpl, i): Review => {
    const daysAgo = Math.floor(sr(i + 100) * 180) + 30;
    const date = new Date(now - daysAgo * 86400000);
    return {
      id: `default_${companyId}_${i}`,
      user_id: '',
      userName: DEFAULT_NAMES[i],
      facility_id: companyId,
      rating: tpl.rating,
      content: tpl.content,
      images: [],
      created_at: date.toISOString(),
      date: date.toISOString().split('T')[0],
    };
  });
}
