alter table orders add column if not exists address text, add column if not exists area text, add column if not exists landmark text, add column if not exists delivery_type text;
alter table vendors add column if not exists bank_name text, add column if not exists account_number text, add column if not exists account_name text, add column if not exists pay_note text;
grant update(bank_name,account_number,account_name,pay_note) on vendors to authenticated;
drop function if exists submit_catalog_order(text,text,text,jsonb,text);
drop function if exists submit_public_order(text,text,text,text,int,text);
create function submit_catalog_order(p_slug text,p_name text,p_phone text,p_items jsonb,p_note text,p_delivery jsonb default '{}'::jsonb) returns text language plpgsql security definer as $$
declare v uuid; c uuid; r record; txt text:=''; tot numeric:=0; n int:=0;
begin select id into v from vendors where slug=p_slug; if v is null then raise exception 'not found'; end if;
 for r in select p.id pid,p.name,p.price,p.stock,(i->>'qty')::int q from jsonb_array_elements(p_items) i join products p on p.id=(i->>'id')::uuid where p.vendor_id=v and p.available loop
  if r.q>0 then
   if r.stock is not null and r.stock<r.q then raise exception 'Not enough stock for %',r.name; end if;
   txt:=txt||case when n>0 then ', ' else '' end||r.q||'× '||r.name; tot:=tot+r.price*r.q; n:=n+1;
   if r.stock is not null then update products set stock=stock-r.q,available=(stock-r.q>0) where id=r.pid; end if;
  end if;
 end loop;
 if n=0 then raise exception 'empty order'; end if;
 insert into customers(vendor_id,name,phone) values(v,p_name,p_phone) on conflict(vendor_id,phone) do update set name=customers.name returning id into c;
 insert into orders(vendor_id,customer_id,item,quantity,total_amount,source,notes,delivery_type,address,area,landmark) values(v,c,txt,1,tot,'shopa_page',left(p_note,300),p_delivery->>'type',left(p_delivery->>'address',200),left(p_delivery->>'area',100),left(p_delivery->>'landmark',100));
 return txt||'|'||tot; end $$;
create function submit_public_order(p_slug text,p_name text,p_phone text,p_item text,p_qty int,p_note text,p_delivery jsonb default '{}'::jsonb) returns void language plpgsql security definer as $$
declare v uuid; c uuid;
begin select id into v from vendors where slug=p_slug; if v is null then raise exception 'not found'; end if;
 insert into customers(vendor_id,name,phone) values(v,p_name,p_phone) on conflict(vendor_id,phone) do update set name=customers.name returning id into c;
 insert into orders(vendor_id,customer_id,item,quantity,source,notes,delivery_type,address,area,landmark) values(v,c,left(p_item,200),greatest(p_qty,1),'shopa_page',left(p_note,300),p_delivery->>'type',left(p_delivery->>'address',200),left(p_delivery->>'area',100),left(p_delivery->>'landmark',100)); end $$;
grant execute on function submit_catalog_order(text,text,text,jsonb,text,jsonb), submit_public_order(text,text,text,text,int,text,jsonb) to anon,authenticated;
create function get_transfer_details(p_slug text) returns table(bank_name text,account_number text,account_name text,pay_note text) language sql security definer as $$ select bank_name,account_number,account_name,pay_note from vendors where slug=p_slug and account_number is not null $$;
grant execute on function get_transfer_details to anon,authenticated;
