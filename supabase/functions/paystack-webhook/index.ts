import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const PL:Record<string,{a:number,d?:number,sms?:number}>={starter:{a:200000,d:30},pro:{a:450000,d:30},starter_year:{a:2000000,d:365},pro_year:{a:4500000,d:365},setup:{a:1000000},sms50:{a:150000,sms:50},sms200:{a:500000,sms:200}};
Deno.serve(async req=>{
 const raw=await req.text(),enc=new TextEncoder();
 const k=await crypto.subtle.importKey('raw',enc.encode(Deno.env.get('PAYSTACK_SECRET_KEY')!),{name:'HMAC',hash:'SHA-512'},false,['sign']);
 const sig=[...new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(raw)))].map(b=>b.toString(16).padStart(2,'0')).join('');
 if(sig!==req.headers.get('x-paystack-signature'))return new Response('bad signature',{status:401});
 const ev=JSON.parse(raw);if(ev.event!=='charge.success')return new Response('ok');
 const d=ev.data,m=d.metadata??{},amt=d.amount/100;if(!m.vendor_id)return new Response('ok');
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 // log first; the unique reference stops Paystack retries from being processed twice
 const ins=await sb.from('payments').insert({reference:d.reference,vendor_id:m.vendor_id,kind:m.kind,amount:amt,fee:(m.fee??0)/100});
 if(ins.error)return new Response('ok');
 const extend=async(id:string,plan:string|null,days:number)=>{
  const {data:v}=await sb.from('vendors').select('plan,plan_expires_at').eq('id',id).single();if(!v)return;
  const act=v.plan_expires_at&&new Date(v.plan_expires_at)>new Date(),b=act?new Date(v.plan_expires_at):new Date();b.setDate(b.getDate()+days);
  await sb.from('vendors').update({plan:plan??(act?v.plan:'starter'),plan_expires_at:b.toISOString()}).eq('id',id)};
 if(m.kind==='order'){ // customer paid a vendor's order
  const {data:o}=await sb.from('orders').select('total_amount,amount_paid').eq('id',m.order_id).eq('vendor_id',m.vendor_id).single();
  if(o)await sb.from('orders').update({amount_paid:Math.min(o.total_amount,+o.amount_paid+amt)}).eq('id',m.order_id);
 }else{const p=PL[m.kind];
  if(p&&d.amount>=p.a){
   if(p.sms)await sb.rpc('add_sms',{p_vendor:m.vendor_id,p_n:p.sms});
   if(p.d){await extend(m.vendor_id,m.kind.replace('_year',''),p.d);
    const {data:v}=await sb.from('vendors').select('referred_by_slug,referral_rewarded').eq('id',m.vendor_id).single();
    if(v?.referred_by_slug&&!v.referral_rewarded){ // referrer gets +30 days on the referred vendor's first paid plan
     const {data:r}=await sb.from('vendors').select('id').eq('slug',v.referred_by_slug).maybeSingle();
     if(r){await extend(r.id,null,30);await sb.from('vendors').update({referral_rewarded:true}).eq('id',m.vendor_id)}}}}}
 return new Response('ok');
});
