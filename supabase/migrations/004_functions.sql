-- ============================================
-- WORKER SEARCH FUNCTION
-- Called from server actions for full-text search
-- ============================================
create or replace function search_workers(
  search_query  text    default null,
  p_category    text    default null,
  p_district    text    default null,
  p_availability text   default null,
  p_min_rating  numeric default null,
  p_min_price   numeric default null,
  p_max_price   numeric default null,
  p_limit       int     default 12,
  p_offset      int     default 0
)
returns table (
  id                  uuid,
  title               text,
  district            text,
  avg_rating          numeric,
  total_reviews       int,
  starting_price      numeric,
  profile_image_url   text,
  experience_years    int,
  availability        availability_status,
  is_verified         boolean,
  created_at          timestamptz,
  rank                real
) as $$
begin
  return query
  select
    wp.id,
    wp.title,
    wp.district,
    wp.avg_rating,
    wp.total_reviews,
    wp.starting_price,
    wp.profile_image_url,
    wp.experience_years,
    wp.availability,
    wp.is_verified,
    wp.created_at,
    case
      when search_query is not null and search_query != ''
      then ts_rank(wp.search_vector, websearch_to_tsquery('english', search_query))
      else 1.0
    end as rank
  from worker_profiles wp
  join categories c on c.id = wp.category_id
  where
    wp.is_active = true
    and (
      search_query is null or search_query = '' or
      wp.search_vector @@ websearch_to_tsquery('english', search_query) or
      wp.title    ilike '%' || search_query || '%' or
      wp.district ilike '%' || search_query || '%'
    )
    and (p_category    is null or c.slug = p_category)
    and (p_district    is null or wp.district ilike p_district)
    and (p_availability is null or wp.availability::text = p_availability)
    and (p_min_rating  is null or wp.avg_rating   >= p_min_rating)
    and (p_min_price   is null or wp.starting_price >= p_min_price)
    and (p_max_price   is null or wp.starting_price <= p_max_price)
  order by
    case when search_query is not null and search_query != ''
      then ts_rank(wp.search_vector, websearch_to_tsquery('english', search_query))
      else wp.avg_rating
    end desc,
    wp.total_reviews desc
  limit  p_limit
  offset p_offset;
end;
$$ language plpgsql security definer;