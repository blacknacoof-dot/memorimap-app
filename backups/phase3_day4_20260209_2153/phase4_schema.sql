-- ==============================================================================
-- [Phase 4] 슈퍼 관리자 전용 테이블 구축 스크립트
-- 포함 내용: 구독(Subscriptions), 매출(Payments), 공지사항(Notices) 및 보안 정책
-- ==============================================================================

-- [Prerequisite] 사용자 프로필 (Profiles) 테이블 생성
-- auth.users와 1:1 매핑되는 사용자 정보
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'facility_admin', 'sangjo_hq_admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 1. 구독 (Subscriptions) 테이블 생성
-- 시설별 구독 상태와 기간을 관리합니다.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id BIGINT REFERENCES public.memorial_spaces(id) ON DELETE CASCADE, -- 시설 삭제 시 구독 정보도 삭제
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  monthly_price INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 매출/결제 (Payments) 테이블 생성
-- 플랫폼 전체의 결제 이력을 기록합니다.
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id BIGINT REFERENCES public.memorial_spaces(id) ON DELETE SET NULL, -- 시설이 삭제되어도 결제 이력은 보존
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'refunded', 'failed')),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT -- 예: "Enterprise 1개월 구독료"
);

-- 3. 공지사항 (Notices) 테이블 생성
-- 전체 공지 또는 특정 대상(업체/유저) 공지를 관리합니다.
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'facility_admin', 'user')),
  is_important BOOLEAN DEFAULT false, -- 상단 고정 여부
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. RLS (Row Level Security) 보안 정책 설정
-- 슈퍼 관리자는 모든 권한을 갖고, 그 외 사용자는 제한된 접근만 허용합니다.
-- ==============================================================================

-- [A] 구독 정보 보안 정책
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 슈퍼 관리자: 모든 권한 (생성/수정/삭제/조회)
CREATE POLICY "Super Admin Full Access Subscriptions" ON public.subscriptions
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 시설 관리자: 본인 시설의 구독 정보만 '조회' 가능
CREATE POLICY "Facility Admin View Own Subscription" ON public.subscriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.memorial_spaces 
    WHERE id = subscriptions.facility_id AND owner_user_id = auth.uid()::text
  )
);

-- [B] 매출 정보 보안 정책
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 슈퍼 관리자: 모든 권한
CREATE POLICY "Super Admin Full Access Payments" ON public.payments
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 시설 관리자: 본인 시설의 결제 내역만 '조회' 가능
CREATE POLICY "Facility Admin View Own Payments" ON public.payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.memorial_spaces 
    WHERE id = payments.facility_id AND owner_user_id = auth.uid()::text
  )
);

-- [C] 공지사항 보안 정책
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 슈퍼 관리자: 모든 권한 (작성/수정/삭제)
CREATE POLICY "Super Admin Manage Notices" ON public.notices
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 모든 유저: 타겟에 맞는 공지사항 '조회'만 가능
CREATE POLICY "View Notices Based on Audience" ON public.notices
FOR SELECT USING (
  target_audience = 'all' OR
  (auth.role() = 'authenticated' AND (
      (target_audience = 'user' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'user') OR
      (target_audience = 'facility_admin' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('facility_admin', 'super_admin'))
  ))
);
