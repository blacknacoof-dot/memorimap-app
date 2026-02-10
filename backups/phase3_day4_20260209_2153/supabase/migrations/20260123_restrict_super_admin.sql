-- 1. 유저 역할 확인 (디버깅용)
SELECT id, email, raw_user_meta_data->>'role' as role FROM auth.users WHERE email IN ('blacknacoof@gmail.com', 'master@memormap.com');

-- 2. blacknacoof@gmail.com에게만 super_admin 권한 부여
UPDATE auth.users
SET raw_user_meta_data = 
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"super_admin"'
  )
WHERE email = 'blacknacoof@gmail.com';

-- 3. admin_users 테이블에 등록 (Clerk 호환성을 위해 user_id TEXT 변경)
-- 기존 테이블이 있다면 호환성 확보를 위해 삭제 후 재생성 (UUID -> TEXT 변경)
DROP TABLE IF EXISTS public.admin_users;

CREATE TABLE public.admin_users (
    user_id TEXT PRIMARY KEY, -- Clerk User ID (string) or UUID
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화 (선택사항, 보안 강화)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 데이터 삽입 (auth.users에 의존하지 않고 직접 등록)
-- 만약 auth.users에 매칭되는 이메일이 있다면 그 ID를 사용하고, 없다면 admin으로 시작하는 임의 ID 사용
INSERT INTO public.admin_users (user_id, email, role, created_at)
VALUES (
    COALESCE(
        (SELECT id::text FROM auth.users WHERE email = 'blacknacoof@gmail.com' LIMIT 1), 
        'admin-manual-id-blacknacoof'
    ),
    'blacknacoof@gmail.com',
    'super_admin',
    NOW()
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'super_admin', updated_at = NOW();

-- 이메일 중복 방지를 위한 별도 처리 (user_id가 다르고 이메일이 같은 경우 방지)
INSERT INTO public.admin_users (user_id, email, role, created_at)
VALUES ('admin-manual-id-blacknacoof', 'blacknacoof@gmail.com', 'super_admin', NOW())
ON CONFLICT (email) DO UPDATE
SET role = 'super_admin', updated_at = NOW();

-- 4. master@memormap.com 권한 제거
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data - 'role'
WHERE email = 'master@memormap.com';

-- 5. RLS 정책 (partner_inquiries)
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can update partner inquiries" ON public.partner_inquiries;
CREATE POLICY "Super admin can update partner inquiries"
ON public.partner_inquiries
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'blacknacoof@gmail.com'
);

DROP POLICY IF EXISTS "Super admin can view partner inquiries" ON public.partner_inquiries;
CREATE POLICY "Super admin can view partner inquiries"
ON public.partner_inquiries
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'blacknacoof@gmail.com'
);
