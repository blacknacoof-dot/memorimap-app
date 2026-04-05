create or replace function public.search_facilities_in_view(
  min_lat numeric,
  min_lng numeric,
  max_lat numeric,
  max_lng numeric,
  zoom_level integer default null
)
returns table(
  id uuid,
  name text,
  address text,
  latitude numeric,
  longitude numeric,
  type text,
  image_url text,
  rating numeric,
  review_count integer
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    f.id,
    f.name,
    f.address,
    f.latitude,
    f.longitude,
    f.type,
    f.image_url,
    f.rating,
    f.review_count
  from facilities f
  where
    f.latitude between min_lat and max_lat
    and f.longitude between min_lng and max_lng
  order by f.id
  limit
    case
      when zoom_level is null then 300
      when zoom_level <= 8 then 150
      when zoom_level <= 11 then 300
      else 600
    end;
$function$;
