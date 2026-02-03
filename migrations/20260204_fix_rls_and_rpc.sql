-- 0. Drop existing function to clean up signature mismatches
drop function if exists public.search_facilities_v2(double precision, double precision, int, text, int);

-- 1. Create search_facilities_v2 RPC (GPS Search)
-- Note: 'category' parameter matches the object key in queries.ts
create or replace function public.search_facilities_v2(
    p_lat double precision,
    p_lng double precision,
    radius_meters int,
    category text default null,
    result_limit int default 10
)
returns setof public.facilities
language sql
as $$
    select *
    from public.facilities
    where (
        search_facilities_v2.category is null 
        or type = search_facilities_v2.category 
    )
    and (
        -- Haversine Formula for Distance Calculation
        (6371000 * acos(
            cos(radians(p_lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(p_lng)) +
            sin(radians(p_lat)) * sin(radians(latitude))
        )) <= radius_meters
    )
    limit result_limit;
$$;


-- 2. Fix system_logs RLS for Anonymous users
drop policy if exists "Anonymous users can insert logs" on public.system_logs;
create policy "Anonymous users can insert logs"
    on public.system_logs for insert to anon
    with check (true);

grant insert on public.system_logs to anon;


-- 3. Create search_facilities_by_text RPC (Region Search)
-- Renaming second parameter to p_category to prevent ambiguity, verifying logic against 'type' column
create or replace function public.search_facilities_by_text(
    p_text text,
    p_category text default null
)
returns setof public.facilities
language plpgsql
as $$
begin
    return query
    select *
    from public.facilities
    where (
        p_category is null 
        or type = p_category 
    )
    and (
        name ilike '%' || p_text || '%'
        or address ilike '%' || p_text || '%'
    )
    order by 
        case when name ilike '%' || p_text || '%' then 0 else 1 end,
        rating desc nulls last
    limit 20;
end;
$$;
