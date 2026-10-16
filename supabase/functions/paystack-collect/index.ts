// Vendor asks for a payment link for an order. Money goes to the vendor's bank; Shopa keeps PLATFORM_FEE_PCT (default 2%).
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info'};
const J=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')??''}}});
 const {data:{user}}=await sb.auth.getUser();if(!user)return J({error:'unauthorized'},401);
 const {order_id}=await req.json();
 const {data:o}:any=await sb.from('orders').select('total_amount,amount_paid,customers(phone)').eq('id',order_id).single();
 const {data:v}=await sb.from('vendors').select('subaccount_code,plan,plan_expires_at,verification').eq('id',user.id).single();
 if(!v||v.plan!=='pro'||!v.plan_expires_at||new Date(v.plan_expires_at)<new Date())return J({error:'In-app payments are a Pro feature. Upgrade to Pro.'},403);
 if(v.verification!=='verified')return J({error:'Verify your account first (Plan tab).'},403);
 if(!o||!v?.subaccount_code)return J({error:'Turn on payments first (Tools tab)'},400);
 const amount=Math.round((o.total_amount-o.amount_paid)*100);if(amount<10000)return J({error:'Nothing to pay'},400);
 const fee=Math.round(amount*Number(Deno.env.get('PLATFORM_FEE_PCT')??2)/100);
 const r=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:'Bearer '+Deno.env.get('PAYSTACK_SECRET_KEY'),'Content-Type':'application/json'},
  body:JSON.stringify({email:`pay+${o.customers.phone}@shopa.app`,amount,subaccount:v.subaccount_code,transaction_charge:fee,bearer:'subaccount',callback_url:Deno.env.get('SITE_URL'),metadata:{vendor_id:user.id,kind:'order',order_id,fee}})});
 const j=await r.json();return J({url:j.data?.authorization_url});
});
