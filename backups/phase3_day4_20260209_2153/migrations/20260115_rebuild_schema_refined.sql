
-- [1. 철거 작업] 기존 테이블 모두 삭제 (CASCADE로 연관된 데이터까지 깔끔하게 삭제)
-- 기존 스크립트 유지
DROP TABLE IF EXISTS public.ai_consultations CASCADE;
DROP TABLE IF EXISTS public.bot_data CASCADE;
DROP TABLE IF EXISTS public.consultations CASCADE;
DROP TABLE IF EXISTS public.facility_admins CASCADE;
DROP TABLE IF EXISTS public.facility_faqs CASCADE;
DROP TABLE IF EXISTS public.facility_images CASCADE;
DROP TABLE IF EXISTS public.facility_reviews CASCADE;
DROP TABLE IF EXISTS public.facility_submissions CASCADE;
DROP TABLE IF EXISTS public.facility_subscriptions CASCADE;
DROP TABLE IF EXISTS public.faq_view_logs CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.funeral_companies CASCADE;
DROP TABLE IF EXISTS public.funeral_progress CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.memorial_consultations CASCADE;
DROP TABLE IF EXISTS public.memorial_spaces CASCADE;
DROP TABLE IF EXISTS public.memorial_spaces_backup_202512 CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.partner_inquiries CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.review_helpful_logs CASCADE;
DROP TABLE IF EXISTS public.sangjo_contract_timeline CASCADE;
DROP TABLE IF EXISTS public.sangjo_contracts CASCADE;
DROP TABLE IF EXISTS public.sangjo_dashboard_users CASCADE;
DROP TABLE IF EXISTS public.sms_logs CASCADE;
DROP TABLE IF EXISTS public.sms_templates CASCADE;
DROP TABLE IF EXISTS public.subscription_history CASCADE;
DROP TABLE IF EXISTS public.subscription_payments CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.super_admins CASCADE;
DROP TABLE IF EXISTS public.timeline_events CASCADE;
DROP TABLE IF EXISTS public.user_likes CASCADE;

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.funeral_contracts CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- NOTICE: We will use 'profiles' instead to link with auth.users

-- [2. 기초 공사] 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- [3. 타입 정의] ENUM 설정 (프론트엔드와 일치하도록 한글 사용 권장 또는 매핑 명확화)
-- 여기서는 프론트엔드의 FacilityCategoryType ('장례식장', '봉안시설' 등)과 일치시키는 것을 제안합니다.
-- 하지만 영어 ENUM을 원하신다면 코드 매핑이 필요합니다. 안전을 위해 'text'로 하거나, 사용자가 제안한 영문을 사용하되 주석을 답니다.
-- 사용자의 의도가 '새 집'이므로 제안해주신 구조를 최대한 존중하되, category는 한글/영문 혼용 문제를 막기 위해 TEXT CHECK 제약조건이나 수정된 ENUM을 씁니다.
-- 사용자가 'charnel_house' 등을 제안했으므로 이를 따르되, App.tsx의 매핑 로직과 호환되도록 합니다.

DROP TYPE IF EXISTS facility_type CASCADE;
CREATE TYPE facility_type AS ENUM ('charnel_house', 'natural_burial', 'tree_burial', 'funeral_home', 'pet_memorial', 'sangjo', 'sea_burial', 'park_cemetery', 'complex');
-- 추가된 타입: sangjo(상조), sea_burial(해양장), park_cemetery(공원묘지), complex(복합) (기존 데이터 호환성 위해 확장)

DROP TYPE IF EXISTS reservation_status CASCADE;
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'rejected', 'urgent');
-- 추가된 타입: rejected, urgent (기존 로직 호환)

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('user', 'facility_manager', 'sangjo_manager', 'super_admin');

-- [4. 신축 공사] 마스터 테이블 생성

-- (1) Profiles: 통합 사용자 정보 (auth.users 확장)
-- CRITICAL FIX: public.users 대신 public.profiles 사용. Supabase Auth와 연동 필수.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- auth.users의 ID와 1:1 매핑
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role user_role DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Supabase Auth와 연동된 사용자 프로필';

-- Auth 회원가입 시 자동으로 public.profiles를 생성하는 트리거 (필수)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- (2) Facilities: 추모 시설 (구 memorial_spaces)
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES public.profiles(id), -- profiles 참조로 변경
  name TEXT NOT NULL,
  description TEXT,
  
  -- Category: ENUM 사용 (프론트엔드 매핑 필요)
  category facility_type DEFAULT 'charnel_house', 
  
  -- 위치 정보
  location GEOGRAPHY(POINT, 4326), 
  address TEXT NOT NULL,
  
  -- 메타 데이터
  ai_context TEXT, 
  features JSONB DEFAULT '{}', 
  images TEXT[], 
  price_min BIGINT, 
  
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 레거시/백업 호환용 필드 (선택사항, 데이터 복구 시 유용)
  legacy_id TEXT -- 구 ID (BigInt 등) 저장용
);
CREATE INDEX facilities_location_idx ON public.facilities USING GIST (location);


-- (3) Reservations: 예약 및 상담 통합
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),  -- profiles 참조
  facility_id UUID REFERENCES public.facilities(id),
  
  visit_date TIMESTAMPTZ,
  time_slot TEXT, -- 시간 슬롯 추가 (기존 데이터 호환)
  status reservation_status DEFAULT 'pending',
  
  message TEXT, 
  ai_chat_log JSONB, 
  visitor_name TEXT, -- 비회원/대리인 예약용 이름 추가
  visitor_count INTEGER DEFAULT 1, -- 방문 인원 추가
  contact_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- (4) Reviews: 후기
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id), -- profiles 참조
  facility_id UUID REFERENCES public.facilities(id),
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- (5) Funeral Contracts: 상조 계약
CREATE TABLE public.funeral_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES public.profiles(id), -- profiles 참조
  client_name TEXT NOT NULL,
  client_phone TEXT, -- 연락처 추가
  deceased_name TEXT,
  current_step TEXT, 
  timeline_logs JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- [5. 전기 배선] 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_modtime BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_modtime BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funeral_contracts_modtime BEFORE UPDATE ON public.funeral_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- [6. 보안 설정] RLS (Row Level Security) 활성화 (기본)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funeral_contracts ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (시설 정보)
CREATE POLICY "Public facilities are viewable by everyone" ON public.facilities FOR SELECT USING (true);
