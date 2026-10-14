alter table vendors add column logo_url text;
grant update(logo_url) on vendors to authenticated;
drop function get_public_vendor(text);
create function get_public_vendor(p_slug text) returns table(business_name text,whatsapp_number text,logo_url text) language sql security definer as $$ select business_name,whatsapp_number,logo_url from vendors where slug=p_slug $$;
grant execute on function get_public_vendor to anon,authenticated;
