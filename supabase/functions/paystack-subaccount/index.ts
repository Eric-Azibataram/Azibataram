// Lists banks and creates the vendor's Paystack subaccount. Bank details go straight to Paystack and are NOT stored by us.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type, apikey, x-client-info'};
const J=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')??''}}});
 const {data:{user}}=await sb.auth.getUser();if(!user)return J({error:'unauthorized'},401);
 const {action,bank_code,account_number}=await req.json(),H={Authorization:'Bearer '+Deno.env.get('PAYSTACK_SECRET_KEY')};
 if(action==='banks'){const j=await (await fetch('https://api.paystack.co/bank?country=nigeria&perPage=100',{headers:H})).json();return J((j.data??[]).map((b:any)=>({name:b.name,code:b.code})))}
 const {data:v}=await sb.from('vendors').select('business_name').eq('id',user.id).single();
 const j=await (await fetch('https://api.paystack.co/subaccount',{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify({business_name:v?.business_name,settlement_bank:bank_code,account_number,percentage_charge:0})})).json();
 if(!j.status)return J({error:j.message},400);
 await createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!).from('vendors').update({subaccount_code:j.data.subaccount_code}).eq('id',user.id);
 return J({ok:true});
});
