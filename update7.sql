-- Admin dashboard, page-view counts, and shop suspension
create table if not exists admins(user_id uuid primary key references auth.users on delete cascade);
alter table admins enable row level security;
alter table vendors add column if not exists suspended boolean not null default false;
create table if not exists views(day date not null default current_date,kind text not null,slug text not null default '',n int not null default 0,primary key(day,kind,slug));
alter table views enable row level security;
create or replace function track(p_kind text,p_slug text default '') returns void language plpgsql security definer as $$
begin if p_kind not in ('landing','shop') then return; end if;
 insert into views(day,kind,slug,n) values(current_date,p_kind,left(coalesce(p_slug,''),80),1) on conflict(day,kind,slug) do update set n=views.n+1; end $$;
grant execute on function track(text,text) to anon,authenticated;
create or replace function is_admin() returns boolean language sql security definer as $$ select exists(select 1 from admins where user_id=auth.uid()) $$;
grant execute on function is_admin() to authenticated;
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
create or replace function admin_vendors() returns table(id uuid,business_name text,email text,slug text,plan text,plan_expires_at timestamptz,created_at timestamptz,orders bigint,products bigint,suspended boolean) language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 return query select v.id,v.business_name,u.email::text,v.slug,v.plan,v.plan_expires_at,v.created_at,
  (select count(*) from orders o where o.vendor_id=v.id),(select count(*) from products p where p.vendor_id=v.id),v.suspended
  from vendors v left join auth.users u on u.id=v.id order by v.created_at desc limit 200; end $$;
grant execute on function admin_vendors() to authenticated;
create or replace function admin_set_plan(p_vendor uuid,p_plan text,p_days int) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if;
 if p_plan='free' then update vendors set plan='free',plan_expires_at=null where id=p_vendor;
 else update vendors set plan=p_plan,plan_expires_at=now()+make_interval(days=>p_days) where id=p_vendor; end if; end $$;
grant execute on function admin_set_plan(uuid,text,int) to authenticated;
create or replace function admin_suspend(p_vendor uuid,p_on boolean) returns void language plpgsql security definer as $$
begin if not is_admin() then raise exception 'not allowed'; end if; update vendors set suspended=p_on where id=p_vendor; end $$;
grant execute on function admin_suspend(uuid,boolean) to authenticated;
-- suspended shops disappear from the public site and cannot receive orders
create or replace function get_public_vendor(p_slug text) returns table(business_name text,whatsapp_number text,logo_url text) language sql security definer as $$ select business_name,whatsapp_number,logo_url from vendors where slug=p_slug and not suspended $$;
create or replace function get_transfer_details(p_slug text) returns table(bank_name text,account_number text,account_name text,pay_note text) language sql security definer as $$ select bank_name,account_number,account_name,pay_note from vendors where slug=p_slug and account_number is not null and not suspended $$;
create or replace function block_suspended() returns trigger language plpgsql security definer as $$
begin if exists(select 1 from vendors where id=new.vendor_id and suspended) then raise exception 'This shop is suspended.'; end if; return new; end $$;
drop trigger if exists susp on orders;
create trigger susp before insert on orders for each row execute function block_suspended();
