-- 0. 확장 기능 활성화 (UUID 생성용)
create extension if not exists "uuid-ossp";

-- 1. 상조 계약 정보를 담을 테이블
create table if not exists sangjo_contracts (
    contract_number text primary key, -- AMI-2025-XXXX
    sangjo_id text, -- 업체 ID (예: a-sangjo, b-sangjo 등)
    customer_name text not null,
    customer_phone text not null,
    customer_address text,
    service_type text, -- 3일장, 1일장 등
    religion text,
    region text,
    total_price bigint default 0,
    status text default '상담신청', -- 상담신청, 예약대기, 임종발생, 현장도착, 완료 등
    application_type text, -- CONTRACT(가입), CONSULTATION(상담)
    preferred_call_time text, -- 희망 통화 시간
    death_time timestamp with time zone,
    current_location text,
    created_at timestamp with time zone default now()
);

-- 2. 상조사 대시보드 사용자 및 권한 관리 테이블
create table if not exists sangjo_dashboard_users (
    id uuid primary key references auth.users(id) on delete cascade,
    sangjo_id text not null,
    role text not null default 'staff', -- admin, manager, staff, sangjo_hq_admin 등
    name text,
    phone text,
    created_at timestamp with time zone default now()
);

-- 3. 실시간 장례 진행 타임라인 기록 테이블
create table if not exists sangjo_contract_timeline (
    id uuid default uuid_generate_v4() primary key,
    contract_number text references sangjo_contracts(contract_number) on delete cascade,
    event text not null,
    notes text,
    photo_url text,
    created_at timestamp with time zone default now()
);

-- Enable RLS (RLS 활성화)
alter table sangjo_contracts enable row level security;
alter table sangjo_dashboard_users enable row level security;
alter table sangjo_contract_timeline enable row level security;

-- 정책 (Policies)

-- 1. 상조 계약 정보
-- 읽기: 누구나 가능 (추후 권한 조정 필요 시 수정)
create policy "Public Read Contracts" on sangjo_contracts for select using (true);
-- 쓰기: 누구나 가능 (임시)
create policy "Public Write Contracts" on sangjo_contracts for insert with check (true);
create policy "Public Update Contracts" on sangjo_contracts for update using (true);

-- 2. 상조 대시보드 유저 (중요: 관리자만 제어 가능하도록 변경)
-- 조회: 관리자 + 본인(추후 추가)
create policy "Super Admin Manage Dashboard Users" on sangjo_dashboard_users 
    for all using (public.is_super_admin());

-- 3. 타임라인
create policy "Public Read Timeline" on sangjo_contract_timeline for select using (true);
create policy "Public Write Timeline" on sangjo_contract_timeline for insert with check (true);
