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
  user_id: string;
  userName: string;
  userImage?: string;
  space_id: string;
  rating: number;
  content: string;
  images?: string[];
  created_at?: string;
  date: string; // Keep for compatibility, map from created_at
}

export type AiTone = 'polite' | 'warm' | 'factual';
export type FacilityType = 'FUNERAL_HOME' | 'MEMORIAL_PARK' | 'SANGJO';
export type AiActionType = 'NONE' | 'RESERVE' | 'MAP' | 'CALL_MANAGER';

export interface Facility {
  id: string;
  name: string;
  type: 'charnel' | 'natural' | 'park' | 'complex' | 'sea' | 'pet' | 'funeral'; // 납골당, 자연장, 공원, 복합, 바다장, 동물장, 장례식장
  religion: 'buddhism' | 'christian' | 'catholic' | 'none';
  address: string;
  lat: number;
  lng: number;
  priceRange: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  features: string[];
  phone: string;
  prices: {
    type: string;
    price: string;
  }[];
  galleryImages: string[];
  reviews: Review[];
  naverBookingUrl?: string;
  isDetailLoaded?: boolean;
  isVerified?: boolean; // 업체 직접 관리 여부
  dataSource?: 'ai' | 'admin' | 'partner'; // 데이터 출처
  priceInfo?: any; // 업체 직접 입력 가격 데이터 (JSONB)
  aiContext?: string; // AI 상담용 추가 지식
  ai_tone?: AiTone; // AI 말투 설정
  ai_welcome_message?: string; // AI 첫인사 메시지
  ai_price_summary?: Record<string, string | number>; // AI 학습용 가격 요약 (JSON)
  subscription?: any; // FacilitySubscription interface type
}

export interface Reservation {
  id: string;
  facilityId: string;
  facilityName: string;
  date: Date;
  timeSlot: string;
  visitorName: string;
  visitorCount: number;
  purpose: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'urgent';
  paymentAmount: number; // 100,000 KRW
  paidAt: Date;
  paymentId?: string; // PortOne Payment ID
  funeralCompanyId?: string;
  funeralCompanyName?: string;
}

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
}

export interface SangjoContract {
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
  created_at: string;
  death_time?: string;
  current_location?: string;
  application_type?: 'CONTRACT' | 'CONSULTATION'; // 추가
  preferred_call_time?: string; // 추가
  timeline?: Array<{
    time: string;
    event: string;
    notes?: string;
    photo_url?: string;
  }>;
}