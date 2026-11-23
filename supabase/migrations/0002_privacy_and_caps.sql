-- Phase 1 fixes: app-wide usage caps and 30-day chat retention.

-- App-wide counters (e.g. setups per day across all visitors).
create table if not exists public.app_usage_daily (
  day         date primary key default current_date,
  extractions int not null default 0
);
alter table public.app_usage_daily enable row level security;
-- No policies: only the server (service role) reads or writes this table.

create or replace function public.bump_app_extractions()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into app_usage_daily (day, extractions) values (current_date, 1)
  on conflict (day) do update set extractions = app_usage_daily.extractions + 1
  returning extractions into n;
  return n;
end $$;
revoke all on function public.bump_app_extractions() from public, anon, authenticated;

-- Delete demo chats (and their messages, via cascade) after 30 days.
create or replace function public.purge_old_chats()
returns void language sql security definer set search_path = public as $$
  delete from chat_sessions where created_at < now() - interval '30 days';
  delete from app_usage_daily where day < current_date - 90;
  delete from usage_daily where day < current_date - 90;
$$;
revoke all on function public.purge_old_chats() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('purge-old-chats', '30 21 * * *', 'select public.purge_old_chats()'); -- 3:00 am IST daily
