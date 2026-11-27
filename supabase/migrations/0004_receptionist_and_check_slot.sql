-- AI Receptionist settings saved per business, and a "would this booking
-- work?" check that doesn't save anything (used by the sample businesses,
-- so public demo chats never fill the real calendar).

alter table public.businesses
  add column if not exists receptionist jsonb not null default '{}'::jsonb;

-- Same rules as book_slot(), without inserting. Keep the two in step.
create or replace function public.check_slot(
  p_business uuid, p_service uuid, p_staff uuid, p_start timestamptz
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  svc   record;
  st    record;
  biz   record;
  hrs   record;
  local_start timestamp := p_start at time zone 'Asia/Kolkata';
  dname text := trim(to_char(local_start, 'FMDay'));
  dur   int;
  buf   int;
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
  if exists (
    select 1 from appointments
    where staff_id = p_staff and status in ('confirmed', 'awaiting-deposit')
      and busy && tstzrange(p_start, ends, '[)')
  ) then
    return jsonb_build_object('ok', false, 'reason', 'slot_taken');
  end if;
  return jsonb_build_object('ok', true, 'starts_at', p_start, 'ends_at', ends);
end $$;

revoke all on function public.check_slot(uuid, uuid, uuid, timestamptz) from public, anon, authenticated;
