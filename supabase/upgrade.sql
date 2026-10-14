-- Run AFTER schema.sql. Adds referrals, groups, partners, payment log, SMS credits, per-payment fees.
alter table vendors add column referred_by_slug text, add column referral_rewarded boolean default false, add column group_id uuid, add column subaccount_code text, add column sms_credits int not null default 0;
grant insert(referred_by_slug) on vendors to authenticated;
create table payments(id uuid primary key default gen_random_uuid(),reference text unique not null,vendor_id uuid references vendors on delete set null,kind text not null,amount numeric not null,fee numeric default 0,created_at timestamptz default now());
alter table payments enable row level security;
create policy p_sel on payments for select using(vendor_id=auth.uid());
-- Groups (markets/associations): you add rows in Supabase > Table editor. Store code in UPPERCASE.
create table groups(id uuid primary key default gen_random_uuid(),code text unique not null,name text not null,plan text not null default 'starter',expires_at timestamptz not null,seats int not null default 20);
alter table groups enable row level security;
-- Partners (riders, packaging, POS agents): you add rows in the Table editor.
create table partners(id uuid primary key default gen_random_uuid(),name text not null,category text,description text,whatsapp text not null,active boolean default true);
alter table partners enable row level security;
create policy pt_sel on partners for select to authenticated using(active);
create function redeem_group(p_code text) returns text language plpgsql security definer as $$
declare g groups;
begin
 if exists(select 1 from vendors where id=auth.uid() and group_id is not null) then raise exception 'You already joined a group'; end if;
 select * into g from groups where code=upper(trim(p_code));
 if g.id is null or g.expires_at<now() then raise exception 'Invalid or expired code'; end if;
 if (select count(*) from vendors where group_id=g.id)>=g.seats then raise exception 'This group is full'; end if;
 update vendors set plan=g.plan,plan_expires_at=g.expires_at,group_id=g.id where id=auth.uid();
 return g.name; end $$;
grant execute on function redeem_group to authenticated;
create function add_sms(p_vendor uuid,p_n int) returns void language sql security definer as $$ update vendors set sms_credits=sms_credits+p_n where id=p_vendor $$;
revoke execute on function add_sms from public,anon,authenticated;
