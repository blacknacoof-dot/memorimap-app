
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🏗️ Memorimap Final Migration Plan (2026-01-15)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- [1. 철거] 기존 테이블 초기화
DROP TABLE IF EXISTS public.staging_db_backup CASCADE; 
DROP TABLE IF EXISTS public.staging_local_file CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.funeral_contracts CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE; 
DROP TABLE IF EXISTS public.users CASCADE;
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
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.partner_inquiries CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
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

-- [2. 기초 공사] PostGIS 및 ENUM 설정
CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
    CREATE TYPE facility_type AS ENUM ('charnel_house', 'natural_burial', 'tree_burial', 'funeral_home', 'pet_memorial', 'sangjo', 'sea_burial', 'park_cemetery', 'complex');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'rejected', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'facility_manager', 'sangjo_manager', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- [3. 본관 건축] 핵심 테이블 생성

-- (1) Profiles: Auth 연동 유저 정보
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  role user_role DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 트리거: Auth 유저 생성 시 자동으로 Profile 생성 (필수)
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

-- (2) Facilities: 시설 통합 테이블
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  category facility_type DEFAULT 'charnel_house',
  
  -- 위치 정보 (지리좌표)
  location GEOGRAPHY(POINT, 4326),
  
  -- 데이터 관리용 필드
  legacy_id TEXT, -- 기존 DB의 ID 보존
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- 상세 정보
  description TEXT,
  ai_context TEXT,
  features JSONB DEFAULT '{}',
  images TEXT[],
  price_min BIGINT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX facilities_location_idx ON public.facilities USING GIST (location);
CREATE INDEX facilities_name_idx ON public.facilities (name);

-- (3) 기타 필수 테이블
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  facility_id UUID REFERENCES public.facilities(id),
  visit_date TIMESTAMPTZ,
  time_slot TEXT,
  status reservation_status DEFAULT 'pending',
  message TEXT,
  ai_chat_log JSONB,
  visitor_name TEXT,
  visitor_count INTEGER DEFAULT 1,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  facility_id UUID REFERENCES public.facilities(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.funeral_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES public.profiles(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  deceased_name TEXT,
  current_step TEXT,
  timeline_logs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- [4. 자동화] 날짜 갱신 트리거
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

-- [5. 보안] RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funeral_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public facilities are viewable by everyone" ON public.facilities FOR SELECT USING (true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- [Step 2] 임시 보관소 (Staging Tables)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 기존 DB 백업본 (4,390개) 담을 테이블
-- memorial_spaces.csv의 헤더에 맞춰 텍스트 컬러머로 준비
CREATE TABLE public.staging_db_backup (
    id TEXT, -- CSV의 id 
    name TEXT,
    category TEXT, 
    type TEXT,
    address TEXT,
    road_address TEXT,
    lat TEXT, -- CSV import시 텍스트로 들어올 수 있음
    lng TEXT,
    description TEXT,
    image_url TEXT,
    full_jibun_address TEXT,
    is_verified TEXT,
    
    -- 기타 CSV 컬럼들 유연하게 받기 위해 일부 생략하거나 필요시 추가
    -- 핵심 컬럼만 정의하고 나머지는 무시하거나 JSONB로 받아도 됨. 
    -- Supabase CSV import는 컬럼명이 일치하면 됨.
    created_at TEXT
);

-- 2. 로컬 파일 (1,110개) 담을 테이블
-- 우리가 만든 merge_local_csvs.ts가 생성할 포맷에 맞춤
CREATE TABLE public.staging_local_file (
    name TEXT,
    address TEXT,
    phone TEXT,
    region TEXT, -- 파일명에서 추출한 지역 (예: 경기, 서울)
    lat TEXT, -- 필요시 지오코딩 결과
    lng TEXT
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- [Step 3] 중복 제거 및 통합 쿼리 (데이터 Import 후 실행)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
-- [3-1] DB 백업본 넣기
INSERT INTO public.facilities (
    legacy_id, name, address, location, 
    category, description, images, is_verified
)
SELECT 
    id, name, address, 
    CASE 
        WHEN lng != '' AND lat != '' AND lng IS NOT NULL AND lat IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(lng::float, lat::float), 4326) 
        ELSE NULL 
    END,
    CASE 
        WHEN category LIKE '%장례식장%' THEN 'funeral_home'::facility_type
        WHEN category LIKE '%봉안%' THEN 'charnel_house'::facility_type
        WHEN category LIKE '%자연장%' THEN 'natural_burial'::facility_type
        WHEN category LIKE '%수목장%' THEN 'tree_burial'::facility_type
        WHEN category LIKE '%반려동물%' THEN 'pet_memorial'::facility_type
        WHEN category LIKE '%상조%' THEN 'sangjo'::facility_type
        ELSE 'charnel_house'::facility_type -- Default
    END,
    description,
    CASE WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url] ELSE NULL END,
    TRUE -- 백업 데이터는 검증된 것으로 간주?
FROM public.staging_db_backup;


-- [3-2] 로컬 파일 합치기 (중복 제거)
INSERT INTO public.facilities (
    name, address, location, 
    category, features
)
SELECT 
    local.name, 
    local.address,
    NULL, -- 로컬 파일엔 좌표가 없는 경우가 많음 (있다면 변환)
    'funeral_home'::facility_type,
    jsonb_build_object('phone', local.phone, 'region', local.region)
FROM public.staging_local_file AS local
WHERE NOT EXISTS (
    SELECT 1 FROM public.facilities AS existing 
    WHERE existing.name = local.name
);

-- Clean up
-- DROP TABLE public.staging_db_backup;
-- DROP TABLE public.staging_local_file;
*/
