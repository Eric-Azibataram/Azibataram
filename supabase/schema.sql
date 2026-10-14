-- Run in Supabase > SQL Editor
create table vendors(id uuid primary key references auth.users on delete cascade,business_name text not null,whatsapp_number text not null,slug text unique not null,plan text not null default 'free',plan_expires_at timestamptz,created_at timestamptz default now());
create table customers(id uuid primary key default gen_random_uuid(),vendor_id uuid not null references vendors on delete cascade,name text not null,phone text not null,notes text,created_at timestamptz default now(),unique(vendor_id,phone));
create table orders(id uuid primary key default gen_random_uuid(),vendor_id uuid not null references vendors on delete cascade,customer_id uuid references customers on delete set null,item text not null,quantity int not null default 1,total_amount numeric not null default 0,amount_paid numeric not null default 0,status text not null default 'new' check(status in('new','confirmed','paid','delivered','cancelled')),source text default 'whatsapp',notes text,created_at timestamptz default now());
alter table vendors enable row level security;alter table customers enable row level security;alter table orders enable row level security;
-- vendors can never edit their own plan (only the payment webhook can)
revoke insert,update on vendors from anon,authenticated;
grant insert(id,business_name,whatsapp_number,slug),update(business_name,whatsapp_number) on vendors to authenticated;
create policy v_sel on vendors for select using(id=auth.uid());
create policy v_ins on vendors for insert with check(id=auth.uid());
create policy v_upd on vendors for update using(id=auth.uid());
create policy c_all on customers for all using(vendor_id=auth.uid()) with check(vendor_id=auth.uid());
create policy o_all on orders for all using(vendor_id=auth.uid()) with check(vendor_id=auth.uid());
-- Free plan: 15 orders per month
create function check_limit() returns trigger language plpgsql security definer as $$
declare v vendors; n int;
begin select * into v from vendors where id=new.vendor_id;
 if v.plan='free' or v.plan_expires_at is null or v.plan_expires_at<now() then
   select count(*) into n from orders where vendor_id=new.vendor_id and created_at>=date_trunc('month',now());
     if n>=15 then raise exception 'Free plan limit of 15 orders/month reached. Please upgrade.'; end if;
      end if; return new; end $$;
      create trigger lim before insert on orders for each row execute function check_limit();
      -- Public order page
      create function get_public_vendor(p_slug text) returns table(business_name text,whatsapp_number text) language sql security definer as $$ select business_name,whatsapp_number from vendors where slug=p_slug $$;
      create function submit_public_order(p_slug text,p_name text,p_phone text,p_item text,p_qty int,p_note text) returns void language plpgsql security definer as $$
      declare v uuid; c uuid;
      begin select id into v from vendors where slug=p_slug; if v is null then raise exception 'not found'; end if;
       insert into customers(vendor_id,name,phone) values(v,p_name,p_phone) on conflict(vendor_id,phone) do update set name=customers.name returning id into c;
        insert into orders(vendor_id,customer_id,item,quantity,source,notes) values(v,c,p_item,greatest(p_qty,1),'shopa_page',p_note); end $$;
        grant execute on function get_public_vendor,submit_public_order to anon,authenticated;
        -- Account deletion (required by Google Play)
        create function delete_my_account() returns void language sql security definer as $$ delete from auth.users where id=auth.uid() $$;
        grant execute on function delete_my_account to authenticated;
        