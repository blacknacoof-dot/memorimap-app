-- AI 상담 내역 저장 테이블
create table ai_consultations (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  space_id text not null,
  facility_name text not null,
  topic text not null,
  messages jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정 (선택 사항: 보안을 위해 추천)
alter table ai_consultations enable row level security;

-- 자신의 데이터만 조회/수정 가능
create policy "Users can view own consultations"
  on ai_consultations for select
  using (auth.uid()::text = user_id);

create policy "Users can insert own consultations"
  on ai_consultations for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update own consultations"
  on ai_consultations for update
  using (auth.uid()::text = user_id);

create policy "Users can delete own consultations"
  on ai_consultations for delete
  using (auth.uid()::text = user_id);
