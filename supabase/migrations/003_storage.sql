-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Profile images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Portfolio images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Avatars: public read
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Avatars: authenticated upload own folder
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Portfolio: public read
create policy "portfolio_select_public"
  on storage.objects for select
  using (bucket_id = 'portfolio');

-- Portfolio: authenticated upload own folder
create policy "portfolio_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "portfolio_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );