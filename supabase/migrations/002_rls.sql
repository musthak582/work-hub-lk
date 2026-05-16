-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
alter table users              enable row level security;
alter table categories         enable row level security;
alter table worker_profiles    enable row level security;
alter table worker_portfolio   enable row level security;
alter table payments           enable row level security;
alter table chats              enable row level security;
alter table messages           enable row level security;
alter table reviews            enable row level security;
alter table admin_logs         enable row level security;

-- ============================================
-- HELPER: get current user's id from users table
-- ============================================
create or replace function get_current_user_id()
returns uuid as $$
  select id from users where auth_id = auth.uid()
$$ language sql security definer stable;

-- ============================================
-- POLICIES: users
-- ============================================

-- Anyone can read basic user info (needed for chat display)
create policy "users_select_public"
  on users for select
  using (true);

-- Users can only update their own record
create policy "users_update_own"
  on users for update
  using (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- Insert handled by server action (service role)
-- No direct insert from client

-- ============================================
-- POLICIES: categories
-- ============================================

-- Anyone can read categories
create policy "categories_select_all"
  on categories for select
  using (is_active = true);

-- ============================================
-- POLICIES: worker_profiles
-- ============================================

-- Public can see active worker profiles
create policy "worker_profiles_select_active"
  on worker_profiles for select
  using (is_active = true);

-- Workers can see their own profile even if inactive
create policy "worker_profiles_select_own"
  on worker_profiles for select
  using (user_id = get_current_user_id());

-- Workers can update their own profile
create policy "worker_profiles_update_own"
  on worker_profiles for update
  using (user_id = get_current_user_id())
  with check (user_id = get_current_user_id());

-- Insert via server action (service role) only

-- ============================================
-- POLICIES: worker_portfolio
-- ============================================

-- Anyone can view portfolio of active workers
create policy "portfolio_select_public"
  on worker_portfolio for select
  using (
    exists (
      select 1 from worker_profiles wp
      where wp.id = worker_portfolio.worker_id
        and wp.is_active = true
    )
  );

-- Workers manage their own portfolio
create policy "portfolio_insert_own"
  on worker_portfolio for insert
  with check (
    exists (
      select 1 from worker_profiles wp
      where wp.id = worker_portfolio.worker_id
        and wp.user_id = get_current_user_id()
    )
  );

create policy "portfolio_update_own"
  on worker_portfolio for update
  using (
    exists (
      select 1 from worker_profiles wp
      where wp.id = worker_portfolio.worker_id
        and wp.user_id = get_current_user_id()
    )
  );

create policy "portfolio_delete_own"
  on worker_portfolio for delete
  using (
    exists (
      select 1 from worker_profiles wp
      where wp.id = worker_portfolio.worker_id
        and wp.user_id = get_current_user_id()
    )
  );

-- ============================================
-- POLICIES: payments
-- ============================================

-- Users can only see their own payments
create policy "payments_select_own"
  on payments for select
  using (user_id = get_current_user_id());

-- No client-side insert/update — all via server actions + service role

-- ============================================
-- POLICIES: chats
-- ============================================

-- Hirers and workers can see their own chats
create policy "chats_select_participants"
  on chats for select
  using (
    hirer_id = get_current_user_id()
    or worker_id = get_current_user_id()
  );

-- ============================================
-- POLICIES: messages
-- ============================================

-- Only chat participants can read messages
create policy "messages_select_participants"
  on messages for select
  using (
    exists (
      select 1 from chats c
      where c.id = messages.chat_id
        and (c.hirer_id = get_current_user_id() or c.worker_id = get_current_user_id())
    )
  );

-- Only participants can send messages
create policy "messages_insert_participants"
  on messages for insert
  with check (
    sender_id = get_current_user_id()
    and exists (
      select 1 from chats c
      where c.id = messages.chat_id
        and (c.hirer_id = get_current_user_id() or c.worker_id = get_current_user_id())
        and c.is_active = true
    )
  );

-- Participants can mark messages as read
create policy "messages_update_read"
  on messages for update
  using (
    exists (
      select 1 from chats c
      where c.id = messages.chat_id
        and (c.hirer_id = get_current_user_id() or c.worker_id = get_current_user_id())
    )
  )
  with check (true);

-- ============================================
-- POLICIES: reviews
-- ============================================

-- Anyone can read reviews
create policy "reviews_select_public"
  on reviews for select
  using (is_flagged = false);

-- Hirers can only insert their own reviews
create policy "reviews_insert_own"
  on reviews for insert
  with check (hirer_id = get_current_user_id());

-- Hirers can update their own reviews
create policy "reviews_update_own"
  on reviews for update
  using (hirer_id = get_current_user_id())
  with check (hirer_id = get_current_user_id());

-- ============================================
-- POLICIES: admin_logs
-- ============================================

-- No RLS access from client — service role only
create policy "admin_logs_no_access"
  on admin_logs for all
  using (false);

-- ============================================
-- REALTIME: enable for chat tables
-- ============================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table chats;