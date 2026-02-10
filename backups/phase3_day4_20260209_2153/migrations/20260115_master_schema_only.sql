
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🏗️ Memorimap Master Schema (2026-01-15) - FINAL
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ⚠️ 실행 전 확인: 기존 데이터가 모두 삭제됩니다. 백업을 확인하세요.

-- [1. 철거] 기존 테이블 초기화
DROP TABLE IF EXISTS public.staging_db_backup CASCADE; 
DROP TABLE IF EXISTS public.staging_local_file CASCADE;
DROP TABLE IF EXISTS public.facilities_staging CASCADE; -- 혹시 모를 잔재
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.funeral_contracts CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE; 
DROP TABLE IF EXISTS public.users CASCADE;
-- 기타 테이블 삭제 (필요시 주석 해제하여 사용)
-- DROP TABLE IF EXISTS public.ai_consultations CASCADE;
-- DROP TABLE IF EXISTS public.bot_data CASCADE;

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
  
  -- CSV 매핑 컬럼 (파이썬 스크립트 출력과 1:1 매칭)
  name TEXT NOT NULL,
  category facility_type DEFAULT 'complex', -- Enum 타입
  address TEXT,
  lat FLOAT,       -- ★ 추가됨: CSV의 위도값
  lng FLOAT,       -- ★ 추가됨: CSV의 경도값
  phone TEXT,      -- ★ 추가됨: 전화번호
  description TEXT,
  images TEXT[],   -- {url} 형태의 배열
  
  -- 데이터 관리용
  legacy_id TEXT,  -- 기존 DB ID
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- 추가 정보
  ai_context TEXT,
  features JSONB DEFAULT '{}',
  price_min BIGINT DEFAULT 0,
  
  -- 위치 정보 (지리좌표 - 나중에 lat/lng로 업데이트)
  location GEOGRAPHY(POINT, 4326),
  
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
