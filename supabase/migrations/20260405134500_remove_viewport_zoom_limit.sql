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
  /*
    Zoom-based row caps caused facilities to disappear when users zoomed out
    because the same viewport was truncated to 150/300 rows.

    The production dataset is small enough for the current app-level clustering,
    so return the full viewport result set and keep the zoom parameter only for
    backward-compatible callers.
  */
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
  order by f.id;
$function$;
