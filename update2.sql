alter table products add column stock int, add column low_at int not null default 3;
alter table orders add column delivery_fee numeric default 0, add column rider_name text, add column rider_phone text, add column tracking text, add column address text;
create or replace function submit_catalog_order(p_slug text,p_name text,p_phone text,p_items jsonb,p_note text) returns text language plpgsql security definer as $$
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
 insert into orders(vendor_id,customer_id,item,quantity,total_amount,source,notes) values(v,c,txt,1,tot,'shopa_page',p_note);
 return txt||'|'||tot; end $$;
