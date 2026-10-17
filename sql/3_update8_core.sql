-- Update 8: policies and consent, verification status, flags, audit log, bans
alter table vendors add column if not exists suspend_reason text;
alter table vendors add column if not exists verification text not null default 'none' check (verification in ('none','pending','verified','rejected'));
alter table vendors add column if not exists verified_at timestamptz;

create table if not exists policies(id uuid primary key default gen_random_uuid(),kind text not null check (kind in ('terms','privacy','guidelines')),version int not null,title text not null,body text not null,published_at timestamptz default now(),unique(kind,version));
alter table policies enable row level security;
drop policy if exists pol_read on policies;
create policy pol_read on policies for select using (true);
create table if not exists consents(user_id uuid not null references auth.users on delete cascade,kind text not null,version int not null,accepted_at timestamptz default now(),primary key(user_id,kind,version));
alter table consents enable row level security;
drop policy if exists con_read on consents;
create policy con_read on consents for select using (user_id=auth.uid());
create table if not exists audit_log(id bigserial primary key,logged_at timestamptz default now(),admin_id uuid,action text,target text,detail text);
alter table audit_log enable row level security;
create table if not exists flags(id uuid primary key default gen_random_uuid(),vendor_id uuid not null references vendors on delete cascade,reason text not null,created_at timestamptz default now(),resolved boolean default false);
alter table flags enable row level security;

create or replace function accept_policies() returns void language sql security definer as $$
 insert into consents(user_id,kind,version) select auth.uid(),kind,max(version) from policies where auth.uid() is not null group by kind on conflict do nothing $$;
grant execute on function accept_policies() to authenticated;

create or replace function log_admin(p_action text,p_target text,p_detail text default '') returns void language sql security definer as $$
 insert into audit_log(admin_id,action,target,detail) values(auth.uid(),p_action,p_target,p_detail) $$;
revoke execute on function log_admin(text,text,text) from public,anon,authenticated;

create or replace function request_verification() returns void language sql security definer as $$
 update vendors set verification='pending' where id=auth.uid() and verification in ('none','rejected') $$;
grant execute on function request_verification() to authenticated;

create or replace function admin_publish_policy(p_kind text,p_title text,p_body text) returns void language plpgsql security definer as $$
declare nv int;
begin if not is_admin() then raise exception 'not allowed'; end if;
 select coalesce(max(version),0)+1 into nv from policies where kind=p_kind;
 insert into policies(kind,version,title,body) values(p_kind,nv,p_title,p_body);
 perform log_admin('publish_policy',p_kind,'version '||nv); end $$;
grant execute on function admin_publish_policy(text,text,text) to authenticated;

create or replace function admin_set_verification(p_vendor uuid,p_status text) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 if p_status not in ('none','pending','verified','rejected') then raise exception 'bad status'; end if;
 update vendors set verification=p_status,verified_at=case when p_status='verified' then now() else null end where id=p_vendor;
 perform log_admin('verification',p_vendor::text,p_status); end $$;
grant execute on function admin_set_verification(uuid,text) to authenticated;

create or replace function admin_flag(p_vendor uuid,p_reason text) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 insert into flags(vendor_id,reason) values(p_vendor,left(p_reason,500));
 perform log_admin('flag',p_vendor::text,left(p_reason,200)); end $$;
grant execute on function admin_flag(uuid,text) to authenticated;

create or replace function admin_resolve_flag(p_id uuid) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 update flags set resolved=true where id=p_id;
 perform log_admin('resolve_flag',p_id::text,''); end $$;
grant execute on function admin_resolve_flag(uuid) to authenticated;

drop function if exists admin_suspend(uuid,boolean);
create or replace function admin_suspend(p_vendor uuid,p_on boolean,p_reason text default null) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 update vendors set suspended=p_on,suspend_reason=case when p_on then left(p_reason,300) else null end where id=p_vendor;
 perform log_admin(case when p_on then 'suspend' else 'unsuspend' end,p_vendor::text,coalesce(p_reason,'')); end $$;
grant execute on function admin_suspend(uuid,boolean,text) to authenticated;

create or replace function admin_set_plan(p_vendor uuid,p_plan text,p_days int) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 if p_plan='free' then update vendors set plan='free',plan_expires_at=null where id=p_vendor;
 else update vendors set plan=p_plan,plan_expires_at=now()+make_interval(days=>p_days) where id=p_vendor; end if;
 perform log_admin('set_plan',p_vendor::text,p_plan||' '||p_days||' days'); end $$;
grant execute on function admin_set_plan(uuid,text,int) to authenticated;

drop function if exists admin_vendors();
create function admin_vendors() returns table(id uuid,business_name text,email text,slug text,plan text,plan_expires_at timestamptz,created_at timestamptz,orders bigint,products bigint,suspended boolean,verification text,suspend_reason text,open_flags bigint) language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 return query select v.id,v.business_name,u.email::text,v.slug,v.plan,v.plan_expires_at,v.created_at,
  (select count(*) from orders o where o.vendor_id=v.id),(select count(*) from products p where p.vendor_id=v.id),v.suspended,v.verification,v.suspend_reason,
  (select count(*) from flags f where f.vendor_id=v.id and not f.resolved)
  from vendors v left join auth.users u on u.id=v.id order by (v.verification='pending') desc,v.created_at desc limit 200; end $$;
grant execute on function admin_vendors() to authenticated;

create or replace function admin_flags() returns table(id uuid,vendor_id uuid,business_name text,reason text,created_at timestamptz) language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 return query select f.id,f.vendor_id,v.business_name,f.reason,f.created_at from flags f join vendors v on v.id=f.vendor_id where not f.resolved order by f.created_at desc; end $$;
grant execute on function admin_flags() to authenticated;

create or replace function admin_audit() returns table(logged_at timestamptz,admin_email text,action text,target text,detail text) language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 return query select a.logged_at,u.email::text,a.action,coalesce((select v.business_name from vendors v where v.id::text=a.target),a.target),a.detail
  from audit_log a left join auth.users u on u.id=a.admin_id order by a.logged_at desc limit 100; end $$;
grant execute on function admin_audit() to authenticated;

create or replace function admin_stats() returns jsonb language plpgsql security definer as $$
declare r jsonb;
begin if not is_admin() then raise exception 'not allowed'; end if;
 select jsonb_build_object(
  'vendors',(select count(*) from vendors),
  'vendors_7d',(select count(*) from vendors where created_at>now()-interval '7 days'),
  'vendors_30d',(select count(*) from vendors where created_at>now()-interval '30 days'),
  'starter',(select count(*) from vendors where plan='starter' and plan_expires_at>now()),
  'pro',(select count(*) from vendors where plan='pro' and plan_expires_at>now()),
  'suspended',(select count(*) from vendors where suspended),
  'verified',(select count(*) from vendors where verification='verified'),
  'pending_verification',(select count(*) from vendors where verification='pending'),
  'open_flags',(select count(*) from flags where not resolved),
  'orders',(select count(*) from orders),
  'orders_7d',(select count(*) from orders where created_at>now()-interval '7 days'),
  'orders_30d',(select count(*) from orders where created_at>now()-interval '30 days'),
  'order_value',(select coalesce(sum(total_amount),0) from orders where status<>'cancelled'),
  'products',(select count(*) from products),
  'customers',(select count(*) from customers),
  'active_7d',(select count(distinct vendor_id) from orders where created_at>now()-interval '7 days'),
  'landing_7d',(select coalesce(sum(n),0) from views where kind='landing' and day>current_date-7),
  'landing_30d',(select coalesce(sum(n),0) from views where kind='landing' and day>current_date-30),
  'shop_7d',(select coalesce(sum(n),0) from views where kind='shop' and day>current_date-7),
  'shop_30d',(select coalesce(sum(n),0) from views where kind='shop' and day>current_date-30),
  'income_30d',(select coalesce(sum(amount),0) from payments where kind<>'order' and created_at>now()-interval '30 days'),
  'fees_30d',(select coalesce(sum(fee),0) from payments where kind='order' and created_at>now()-interval '30 days')
 ) into r; return r; end $$;
grant execute on function admin_stats() to authenticated;

-- public shop page: verified badge; bank details only for verified shops
drop function if exists get_public_vendor(text);
create function get_public_vendor(p_slug text) returns table(business_name text,whatsapp_number text,logo_url text,verified boolean) language sql security definer as $$
 select business_name,whatsapp_number,logo_url,(verification='verified') from vendors where slug=p_slug and not suspended $$;
grant execute on function get_public_vendor(text) to anon,authenticated;
create or replace function get_transfer_details(p_slug text) returns table(bank_name text,account_number text,account_name text,pay_note text) language sql security definer as $$
 select bank_name,account_number,account_name,pay_note from vendors where slug=p_slug and account_number is not null and not suspended and verification='verified' $$;
grant execute on function get_transfer_details(text) to anon,authenticated;
