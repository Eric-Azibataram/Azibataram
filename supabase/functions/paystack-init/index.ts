import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const PL:Record<string,number>={starter:200000,pro:450000,starter_year:2000000,pro_year:4500000,setup:1000000,sms50:150000,sms200:500000}; // kobo
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')??''}}});
 const {data:{user}}=await sb.auth.getUser();
 if(!user)return new Response('unauthorized',{status:401,headers:cors});
 const {kind}=await req.json();if(!PL[kind])return new Response('bad kind',{status:400,headers:cors});
 const r=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:'Bearer '+Deno.env.get('PAYSTACK_SECRET_KEY'),'Content-Type':'application/json'},
  body:JSON.stringify({email:user.email,amount:PL[kind],callback_url:Deno.env.get('SITE_URL')+'#/billing',metadata:{vendor_id:user.id,kind}})});
 const j=await r.json();
 return new Response(JSON.stringify({url:j.data?.authorization_url}),{headers:{...cors,'Content-Type':'application/json'}});
});
