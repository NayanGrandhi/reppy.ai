-- Phase 4 groundwork: customers + appointments with database-enforced
-- "no double booking". Two people booking the same staff member at the
-- same time can't both succeed: an exclusion constraint rejects the second.

create extension if not exists btree_gist with schema extensions;

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name        text not null default '',
  phone       text not null,           -- E.164, e.g. +919820041177
  language    text,
  opted_in    boolean not null default true,  -- false after STOP
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  unique (business_id, phone)
);

create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  customer_id  uuid not null references public.customers (id) on delete cascade,
  service_id   uuid not null references public.services (id) on delete restrict,
  staff_id     uuid not null references public.staff (id) on delete restrict,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  -- the time the staff member is busy: the service plus the buffer after it
  busy         tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  status       text not null default 'confirmed'
               check (status in ('confirmed','awaiting-deposit','completed','cancelled','no-show')),
  source       text not null default 'dashboard' check (source in ('whatsapp','call','dashboard','web-demo')),
  deposit_inr  int,
  deposit_paid boolean not null default false,
  created_at   timestamptz not null default now(),
  check (ends_at > starts_at),
  -- THE double-booking guard: no two live appointments for one staff member may overlap.
  constraint no_double_booking exclude using gist (staff_id with =, busy with &&)
    where (status in ('confirmed','awaiting-deposit'))
);

create index if not exists idx_customers_business on public.customers (business_id);
create index if not exists idx_appts_business_start on public.appointments (business_id, starts_at);
create index if not exists idx_appts_customer on public.appointments (customer_id);
create index if not exists idx_appts_service on public.appointments (service_id);

alter table public.customers    enable row level security;
alter table public.appointments enable row level security;
create policy "owner access" on public.customers for all
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));
create policy "owner access" on public.appointments for all
  using (business_id in (select id from public.businesses where owner_id = (select auth.uid())))
  with check (business_id in (select id from public.businesses where owner_id = (select auth.uid())));

-- Books a slot after checking the business rules. Returns a json result:
--   {"ok":true,"id":"…","starts_at":"…","ends_at":"…"}  or  {"ok":false,"reason":"…"}
-- Reasons: unknown_service, staff_cannot_do_service, closed_day, staff_off,
--          outside_hours, in_the_past, slot_taken
-- Times are interpreted in India time (Asia/Kolkata).
create or replace function public.book_slot(
  p_business uuid, p_customer uuid, p_service uuid, p_staff uuid,
  p_start timestamptz, p_source text default 'dashboard', p_deposit_inr int default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  svc   record;
  st    record;
  biz   record;
  hrs   record;
  local_start timestamp := p_start at time zone 'Asia/Kolkata';
  dname text := trim(to_char(local_start, 'FMDay'));
  dur   int;
  buf   int;
  new_id uuid;
  ends  timestamptz;
begin
  select * into svc from services where id = p_service and business_id = p_business;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown_service'); end if;
  select * into st from staff where id = p_staff and business_id = p_business;
  if not found or (cardinality(svc.staff_names) > 0 and not st.name = any(svc.staff_names)) then
    return jsonb_build_object('ok', false, 'reason', 'staff_cannot_do_service');
  end if;
  select * into biz from businesses where id = p_business;
  if p_start < now() then return jsonb_build_object('ok', false, 'reason', 'in_the_past'); end if;

  select * into hrs from opening_hours where business_id = p_business and day = dname;
  if not found or hrs.closed or hrs.open_time = '' then return jsonb_build_object('ok', false, 'reason', 'closed_day'); end if;
  if dname = any(st.off_days) then return jsonb_build_object('ok', false, 'reason', 'staff_off'); end if;

  dur := coalesce(svc.duration_min, 30);
  buf := coalesce(biz.buffer_min, 0);
  if local_start::time < hrs.open_time::time or (local_start + make_interval(mins => dur))::time > hrs.close_time::time
     or (local_start + make_interval(mins => dur))::date <> local_start::date then
    return jsonb_build_object('ok', false, 'reason', 'outside_hours');
  end if;

  ends := p_start + make_interval(mins => dur + buf);
  begin
    insert into appointments (business_id, customer_id, service_id, staff_id, starts_at, ends_at, status, source, deposit_inr)
    values (p_business, p_customer, p_service, p_staff, p_start, ends,
            case when coalesce(p_deposit_inr, 0) > 0 then 'awaiting-deposit' else 'confirmed' end,
            p_source, p_deposit_inr)
    returning id into new_id;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'reason', 'slot_taken');
  end;
  return jsonb_build_object('ok', true, 'id', new_id, 'starts_at', p_start, 'ends_at', ends);
end $$;

revoke all on function public.book_slot(uuid, uuid, uuid, uuid, timestamptz, text, int) from public, anon, authenticated;
