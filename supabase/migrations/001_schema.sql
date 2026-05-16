-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";      -- trigram search
create extension if not exists "unaccent";      -- accent-insensitive search

-- ============================================
-- ENUMS
-- ============================================
create type user_role as enum ('worker', 'hirer', 'admin');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type payment_type as enum ('worker_registration', 'chat_unlock');
create type availability_status as enum ('available', 'busy', 'unavailable');
create type report_reason as enum (
  'spam', 'fake_profile', 'inappropriate', 'fraud', 'other'
);

-- ============================================
-- TABLE: users
-- ============================================
create table users (
  id             uuid primary key default uuid_generate_v4(),
  auth_id        uuid unique not null,          -- maps to auth.users.id
  email          text unique not null,
  full_name      text not null,
  phone          text unique not null,
  role           user_role,                      -- null until role selected
  phone_verified boolean not null default false,
  is_active      boolean not null default true,
  is_banned      boolean not null default false,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table users is 'Platform users — both workers and hirers';
comment on column users.auth_id is 'References Supabase auth.users(id)';

-- ============================================
-- TABLE: categories
-- ============================================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  slug        text unique not null,
  icon        text,                             -- lucide icon name
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table categories is 'Service categories (electrician, plumber, etc.)';

-- ============================================
-- TABLE: worker_profiles
-- ============================================
create table worker_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null unique references users(id) on delete cascade,
  category_id       uuid not null references categories(id) on delete restrict,
  title             text not null,
  description       text not null,
  experience_years  int not null default 0 check (experience_years >= 0),
  district          text not null,
  starting_price    numeric(10,2),              -- optional, in LKR
  availability      availability_status not null default 'available',
  profile_image_url text,
  is_verified       boolean not null default false,  -- admin can verify
  is_active         boolean not null default true,
  avg_rating        numeric(3,2) default 0 check (avg_rating >= 0 and avg_rating <= 5),
  total_reviews     int not null default 0,
  total_jobs        int not null default 0,
  search_vector     tsvector,                   -- full-text search
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table worker_profiles is 'Worker service profiles — created after payment';
comment on column worker_profiles.starting_price is 'Optional starting price in LKR';
comment on column worker_profiles.search_vector is 'Precomputed tsvector for full-text search';

-- ============================================
-- TABLE: worker_portfolio
-- ============================================
create table worker_portfolio (
  id          uuid primary key default uuid_generate_v4(),
  worker_id   uuid not null references worker_profiles(id) on delete cascade,
  image_url   text not null,
  caption     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

comment on table worker_portfolio is 'Portfolio images for worker profiles';

-- ============================================
-- TABLE: payments
-- ============================================
create table payments (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  payment_type    payment_type not null,
  amount          numeric(10,2) not null default 1000.00,
  currency        text not null default 'LKR',
  status          payment_status not null default 'pending',
  payhere_order_id    text unique,              -- our order id sent to payhere
  payhere_payment_id  text,                    -- payhere's internal id
  payhere_md5_hash    text,                    -- for verification
  metadata        jsonb default '{}',           -- extra data (e.g. worker_id for chat)
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table payments is 'All payment records — worker registration + chat unlock';
comment on column payments.payhere_order_id is 'Unique order ID we generate and send to PayHere';
comment on column payments.metadata is 'Flexible storage e.g. {target_worker_id} for chat unlock';

-- ============================================
-- TABLE: chats
-- ============================================
create table chats (
  id          uuid primary key default uuid_generate_v4(),
  hirer_id    uuid not null references users(id) on delete cascade,
  worker_id   uuid not null references users(id) on delete cascade,
  payment_id  uuid not null references payments(id) on delete restrict,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- one chat room per hirer-worker pair
  unique(hirer_id, worker_id)
);

comment on table chats is 'Chat rooms — created after hirer pays to unlock';

-- ============================================
-- TABLE: messages
-- ============================================
create table messages (
  id          uuid primary key default uuid_generate_v4(),
  chat_id     uuid not null references chats(id) on delete cascade,
  sender_id   uuid not null references users(id) on delete cascade,
  content     text not null check (char_length(content) > 0),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table messages is 'Chat messages inside chat rooms';

-- ============================================
-- TABLE: reviews
-- ============================================
create table reviews (
  id          uuid primary key default uuid_generate_v4(),
  worker_id   uuid not null references worker_profiles(id) on delete cascade,
  hirer_id    uuid not null references users(id) on delete cascade,
  chat_id     uuid not null references chats(id) on delete cascade,
  rating      int not null check (rating >= 1 and rating <= 5),
  comment     text,
  is_flagged  boolean not null default false,
  created_at  timestamptz not null default now(),
  -- one review per hirer per worker
  unique(worker_id, hirer_id)
);

comment on table reviews is 'Hirer reviews for workers — one per hirer-worker pair';

-- ============================================
-- TABLE: admin_logs
-- ============================================
create table admin_logs (
  id          uuid primary key default uuid_generate_v4(),
  admin_email text not null,
  action      text not null,
  target_type text,                             -- 'user' | 'worker' | 'payment' | 'review'
  target_id   uuid,
  details     jsonb default '{}',
  created_at  timestamptz not null default now()
);

comment on table admin_logs is 'Audit log for all admin actions';

-- ============================================
-- INDEXES
-- ============================================

-- users
create index idx_users_auth_id      on users(auth_id);
create index idx_users_email        on users(email);
create index idx_users_phone        on users(phone);
create index idx_users_role         on users(role);

-- worker_profiles
create index idx_worker_profiles_user_id     on worker_profiles(user_id);
create index idx_worker_profiles_category    on worker_profiles(category_id);
create index idx_worker_profiles_district    on worker_profiles(district);
create index idx_worker_profiles_availability on worker_profiles(availability);
create index idx_worker_profiles_rating      on worker_profiles(avg_rating desc);
create index idx_worker_profiles_active      on worker_profiles(is_active) where is_active = true;
create index idx_worker_profiles_search      on worker_profiles using gin(search_vector);
-- trigram index for partial match search
create index idx_worker_profiles_title_trgm  on worker_profiles using gin(title gin_trgm_ops);
create index idx_worker_profiles_district_trgm on worker_profiles using gin(district gin_trgm_ops);

-- portfolio
create index idx_portfolio_worker on worker_portfolio(worker_id);

-- payments
create index idx_payments_user_id         on payments(user_id);
create index idx_payments_status          on payments(status);
create index idx_payments_type            on payments(payment_type);
create index idx_payments_payhere_order   on payments(payhere_order_id);

-- chats
create index idx_chats_hirer   on chats(hirer_id);
create index idx_chats_worker  on chats(worker_id);

-- messages
create index idx_messages_chat      on messages(chat_id);
create index idx_messages_sender    on messages(sender_id);
create index idx_messages_unread    on messages(chat_id, is_read) where is_read = false;
create index idx_messages_created   on messages(chat_id, created_at desc);

-- reviews
create index idx_reviews_worker  on reviews(worker_id);
create index idx_reviews_hirer   on reviews(hirer_id);

-- ============================================
-- FULL-TEXT SEARCH: search_vector
-- ============================================
-- Function to build tsvector
create or replace function worker_search_vector(
  p_title text,
  p_description text,
  p_district text,
  p_category_name text
) returns tsvector as $$
begin
  return (
    setweight(to_tsvector('english', coalesce(p_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p_category_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p_district, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(p_description, '')), 'C')
  );
end;
$$ language plpgsql immutable;

-- Trigger to auto-update search_vector
create or replace function update_worker_search_vector()
returns trigger as $$
declare
  v_category_name text;
begin
  select name into v_category_name
  from categories
  where id = new.category_id;

  new.search_vector := worker_search_vector(
    new.title,
    new.description,
    new.district,
    v_category_name
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_worker_search_vector
  before insert or update on worker_profiles
  for each row execute function update_worker_search_vector();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger trg_worker_profiles_updated_at
  before update on worker_profiles
  for each row execute function set_updated_at();

create trigger trg_payments_updated_at
  before update on payments
  for each row execute function set_updated_at();

create trigger trg_chats_updated_at
  before update on chats
  for each row execute function set_updated_at();

-- ============================================
-- REVIEW RATING AGGREGATE TRIGGER
-- ============================================
create or replace function update_worker_rating()
returns trigger as $$
begin
  update worker_profiles
  set
    avg_rating    = (select round(avg(rating)::numeric, 2) from reviews where worker_id = coalesce(new.worker_id, old.worker_id)),
    total_reviews = (select count(*) from reviews where worker_id = coalesce(new.worker_id, old.worker_id))
  where id = coalesce(new.worker_id, old.worker_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_update_worker_rating
  after insert or update or delete on reviews
  for each row execute function update_worker_rating();

-- ============================================
-- SEED: CATEGORIES
-- ============================================
insert into categories (name, slug, icon, description, sort_order) values
  ('Electrician',        'electrician',      'Zap',          'Wiring, installations, repairs',             1),
  ('Plumber',            'plumber',          'Droplets',     'Pipe fitting, leak repairs, drainage',       2),
  ('Carpenter',          'carpenter',        'Hammer',       'Furniture, woodwork, fixtures',              3),
  ('Painter',            'painter',          'PaintBucket',  'Interior, exterior, waterproofing',          4),
  ('AC Technician',      'ac-technician',    'Wind',         'AC installation, service, repair',           5),
  ('Mason',              'mason',            'Building2',    'Brickwork, plastering, tiling',              6),
  ('Mechanic',           'mechanic',         'Wrench',       'Vehicle repair and maintenance',             7),
  ('CCTV Installer',     'cctv-installer',   'Camera',       'Security camera installation & setup',       8),
  ('Tutor',              'tutor',            'GraduationCap','Home tutoring, all subjects',                9),
  ('Cleaner',            'cleaner',          'Sparkles',     'Home, office, post-construction cleaning',  10),
  ('Gardener',           'gardener',         'Leaf',         'Landscaping, lawn care, pruning',           11),
  ('IT Support',         'it-support',       'Monitor',      'Computer repair, networking, software',     12),
  ('Welder',             'welder',           'Flame',        'Metal fabrication and welding',             13),
  ('Interior Designer',  'interior-designer','Palette',      'Home and office interior design',           14),
  ('Driver',             'driver',           'Car',          'Personal driver, delivery, transport',      15);