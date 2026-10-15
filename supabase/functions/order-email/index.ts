// Emails the vendor (new order) and, if an email was given, the customer (confirmation). Deploy with JWT verification OFF.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info'};
const J=(b:unknown)=>new Response(JSON.stringify(b),{headers:{...cors,'Content-Type':'application/json'}});
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const N=(n:number)=>'₦'+Number(n||0).toLocaleString('en-NG');
const send=(to:string,subject:string,html:string)=>fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+Deno.env.get('RESEND_API_KEY'),'Content-Type':'application/json'},body:JSON.stringify({from:Deno.env.get('EMAIL_FROM')??'Shopa Orders <onboarding@resend.dev>',to:[to],subject,html})});
const wrap=(title:string,body:string)=>`<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e3e8e5;border-radius:14px;overflow:hidden"><div style="background:#1F7A4D;color:#fff;padding:18px 20px;font-size:20px;font-weight:bold">${title}</div><div style="padding:20px;color:#222;line-height:1.5">${body}</div></div>`;
const btn=(href:string,t:string)=>`<p><a href="${esc(href)}" style="background:#1F7A4D;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${esc(t)}</a></p>`;
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const {slug,phone,email}=await req.json();
  const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:v}=await sb.from('vendors').select('id,business_name,whatsapp_number').eq('slug',slug).maybeSingle();if(!v)return J({ok:false});
  const {data:c}=await sb.from('customers').select('id,name,phone').eq('vendor_id',v.id).eq('phone',phone).maybeSingle();if(!c)return J({ok:false});
  const since=new Date(Date.now()-10*60*1000).toISOString();
  const {data:o}=await sb.from('orders').select('id').eq('customer_id',c.id).eq('source','shopa_page').eq('notified',false).gte('created_at',since).order('created_at',{ascending:false}).limit(1).maybeSingle();if(!o)return J({ok:false});
  // mark first, so each order sends emails only once
  const {data:u}=await sb.from('orders').update({notified:true}).eq('id',o.id).eq('notified',false).select('item,total_amount,notes,address,area,landmark,delivery_type').maybeSingle();if(!u)return J({ok:false});
  const site=Deno.env.get('SITE_URL')??'',items=esc(u.item),total=Number(u.total_amount)>0?`<p><b>Total: ${N(u.total_amount)}</b></p>`:'';
  const {data:au}=await sb.auth.admin.getUserById(v.id);const to=au?.user?.email;
  if(to)await send(to,`New order from ${c.name}`,wrap('New order',`<p><b>${esc(c.name)}</b> just ordered:</p><p style="font-size:18px">${items}</p>${total}<p>WhatsApp: ${esc(c.phone)}</p>${u.delivery_type==='delivery'?`<p>Deliver to: ${esc(u.address)}, ${esc(u.area)}${u.landmark?' (near '+esc(u.landmark)+')':''}</p>`:u.delivery_type==='pickup'?'<p>Pickup</p>':''}${u.notes?`<p>Note: ${esc(u.notes)}</p>`:''}${btn('https://wa.me/'+c.phone,'Reply on WhatsApp')}${site?btn(site,'Open Shopa Orders'):''}`));
  if(email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))await send(email,`Your order was sent to ${v.business_name}`,wrap('Order received',`<p>Hi ${esc(c.name)}, thank you!</p><p><b>${esc(v.business_name)}</b> has received your order:</p><p style="font-size:18px">${items}</p>${total}<p>They will get back to you on WhatsApp soon.</p>${btn('https://wa.me/'+v.whatsapp_number,'Chat with '+v.business_name)}`));
  return J({ok:true});
 }catch(e){return J({ok:false})}
});
