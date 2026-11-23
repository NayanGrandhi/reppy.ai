-- Reppy AI: initial schema (Phase 1)
-- Every row belongs to a business. Row-level security (RLS) makes sure an
-- owner can only ever see their own business. The server uses the service
-- role key for demo writes until sign-up arrives in Phase 6.

create extension if not exists "pgcrypto";

-- ───────── businesses ─────────
create table if not exists public.businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  owner_id      uuid references auth.users (id) on delete cascade,
  name          text not null,
  type          text not null default 'Other',
  description   text not null default '',
  address       text not null default '',
  city          text not null default '',
  phone         text not null default '',
  website       text not null default '',
  upi_id        text not null default '',
  languages     text[] not null default array['English','Hindi','Hinglish'],
  buffer_min    int,
  deposit_inr   int,
  booking_notes text not null default '',
  custom_fields text[] not null default '{}',
  is_demo       boolean not null default false,
  daily_message_cap int not null default 200,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name        text not null,
  role        text not null default '',
  off_days    text[] not null default '{}',
  position    int not null default 0
);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null,
  category     text not null default '',
  price_inr    int,
  price_note   text not null default '',
  duration_min int,
  staff_names  text[] not null default '{}',
  position     int not null default 0
);

create table if not exists public.opening_hours (
  business_id uuid not null references public.businesses (id) on delete cascade,
  day         text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  open_time   text not null default '',
  close_time  text not null default '',
  closed      boolean not null default false,
  primary key (business_id, day)
);

create table if not exists public.policies (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  text        text not null,
  position    int not null default 0
);

create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  question    text not null,
  answer      text not null,
  learned     boolean not null default false, -- true when it came from "learns from gaps"
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- What the owner uploaded. Files themselves are not stored in Phase 1.
create table if not exists public.sources (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind        text not null check (kind in ('website','image','pdf','text')),
  label       text not null,
  created_at  timestamptz not null default now()
);

-- ───────── conversations ─────────
create table if not exists public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  channel     text not null default 'web-demo',
  created_at  timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  role        text not null check (role in ('customer','reppy','owner')),
  text        text not null,
  intent      text,
  language    text,
  created_at  timestamptz not null default now()
);

create table if not exists public.knowledge_gaps (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  session_id  uuid references public.chat_sessions (id) on delete set null,
  question    text not null,
  answer      text,
  status      text not null default 'waiting' check (status in ('waiting','answered')),
  created_at  timestamptz not null default now()
);

-- Usage counters so costs can't run away.
create table if not exists public.usage_daily (
  business_id uuid not null references public.businesses (id) on delete cascade,
  day         date not null default current_date,
  messages    int not null default 0,
  extractions int not null default 0,
  primary key (business_id, day)
);

create index if not exists idx_services_business on public.services (business_id);
create index if not exists idx_staff_business on public.staff (business_id);
create index if not exists idx_faqs_business on public.faqs (business_id);
create index if not exists idx_messages_session on public.chat_messages (session_id, created_at);
create index if not exists idx_gaps_business on public.knowledge_gaps (business_id, status);

-- Atomic usage increment, returns the new count for today.
create or replace function public.bump_usage(p_business uuid, p_kind text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into usage_daily (business_id, day, messages, extractions)
  values (p_business, current_date, case when p_kind = 'message' then 1 else 0 end, case when p_kind = 'extraction' then 1 else 0 end)
  on conflict (business_id, day) do update
    set messages = usage_daily.messages + case when p_kind = 'message' then 1 else 0 end,
        extractions = usage_daily.extractions + case when p_kind = 'extraction' then 1 else 0 end
  returning case when p_kind = 'message' then messages else extractions end into n;
  return n;
end $$;

revoke all on function public.bump_usage(uuid, text) from public, anon, authenticated;

-- ───────── row-level security ─────────
alter table public.businesses     enable row level security;
alter table public.staff          enable row level security;
alter table public.services       enable row level security;
alter table public.opening_hours  enable row level security;
alter table public.policies       enable row level security;
alter table public.faqs           enable row level security;
alter table public.sources        enable row level security;
alter table public.chat_sessions  enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.knowledge_gaps enable row level security;
alter table public.usage_daily    enable row level security;

-- Owners manage their own business row.
drop policy if exists "owner reads business" on public.businesses;
create policy "owner reads business" on public.businesses
  for select using (owner_id = auth.uid());
drop policy if exists "owner updates business" on public.businesses;
create policy "owner updates business" on public.businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Every child table: allowed only when the parent business belongs to you.
do $$
declare t text;
begin
  foreach t in array array['staff','services','opening_hours','policies','faqs','sources','chat_sessions','chat_messages','knowledge_gaps','usage_daily'] loop
    execute format('drop policy if exists "owner access" on public.%I', t);
    execute format(
      'create policy "owner access" on public.%I for all using (business_id in (select id from public.businesses where owner_id = auth.uid())) with check (business_id in (select id from public.businesses where owner_id = auth.uid()))',
      t
    );
  end loop;
end $$;
