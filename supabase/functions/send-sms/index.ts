// Sends SMS reminders (via Termii) for orders unpaid 2+ days, using the vendor's SMS credits. 1 credit = 1 SMS.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info'};
const J=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')??''}}});
 const {data:{user}}=await sb.auth.getUser();if(!user)return J({error:'unauthorized'},401);
 const {data:v}=await sb.from('vendors').select('business_name,sms_credits,plan,plan_expires_at').eq('id',user.id).single();
 if(!v||v.plan!=='pro'||!v.plan_expires_at||new Date(v.plan_expires_at)<new Date())return J({error:'SMS reminders are a Pro feature. Upgrade to Pro.'},403);
 if(!v||v.sms_credits<1)return J({error:'No SMS credits. Buy a pack first.'},400);
 const {data:os=[]}:any=await sb.from('orders').select('item,total_amount,amount_paid,created_at,customers(name,phone)').neq('status','cancelled');
 const due=os.filter((o:any)=>o.total_amount>o.amount_paid&&new Date(o.created_at).getTime()<Date.now()-2*864e5).slice(0,v.sms_credits);
 let sent=0;
 for(const o of due){const r=await fetch((Deno.env.get('TERMII_URL')??'https://api.ng.termii.com')+'/api/sms/send',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({to:o.customers.phone,from:Deno.env.get('TERMII_SENDER'),sms:`Hi ${o.customers.name}, reminder: you owe N${o.total_amount-o.amount_paid} to ${v.business_name} for ${o.item}. Thank you.`,type:'plain',channel:'generic',api_key:Deno.env.get('TERMII_API_KEY')})});
  if(r.ok)sent++}
 await createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).from('vendors').update({sms_credits:v.sms_credits-sent}).eq('id',user.id);
 return J({sent});
});
