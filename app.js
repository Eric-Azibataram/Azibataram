const sb=supabase.createClient(CFG.url,CFG.key),app=document.getElementById('app'),nav=document.getElementById('nav');
const $=i=>document.getElementById(i),N=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const E=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const ph=p=>{p=String(p).replace(/\D/g,'');return p.startsWith('0')?'234'+p.slice(1):p};
const wa=(p,t)=>`https://wa.me/${ph(p)}?text=${encodeURIComponent(t)}`;
const inApp=document.referrer.startsWith('android-app://'); // inside the Play Store (TWA) app
try{const r=new URLSearchParams(location.search).get('ref');if(r)localStorage.setItem('ref',r)}catch(e){}
let ip=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();ip=e;document.querySelectorAll('.inst').forEach(x=>x.hidden=false)});
document.addEventListener('click',async e=>{if(e.target.classList.contains('inst')&&ip){ip.prompt();await ip.userChoice;ip=null;e.target.hidden=true}});
const instBtn=()=>`<button class="btn alt inst" ${ip?'':'hidden'}>Install app on your phone</button>`;
const ST=['new','confirmed','paid','delivered','cancelled'];let V=null,filter='all';
const toast=m=>{const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),3000)};
const plan=v=>v&&v.plan!=='free'&&new Date(v.plan_expires_at)>new Date()?v.plan:'free';

async function route(){if(window.recovering)return;
 const [,a,b]=(location.hash.slice(1)||'/').split('/');
 const sv=new URLSearchParams(location.search).get('v');if(sv||a==='v'){nav.innerHTML='';return pub(sv||b)}
 const {data:{session}}=await sb.auth.getSession();
 if(!session){nav.innerHTML='';return /^#\/(login|signup)/.test(location.hash)?auth():landing()}
 if(!V)V=(await sb.from('vendors').select('*').eq('id',session.user.id).maybeSingle()).data;
 if(!V){nav.innerHTML='';return onboard(session.user)}
 nav.innerHTML=[['','📦<br>Orders'],['products','🛍️<br>Products'],['customers','👥<br>Customers'],['today','📊<br>Today'],['tools','🧰<br>Tools'],['billing','⭐<br>Plan']].map(([k,t])=>`<a href="#/${k}" class="${(a||'')===k?'on':''}">${t}</a>`).join('');
 ((window.EXT||{})[a]||{'':orders,products,new:newOrder,o:()=>detail(b),customers,today,tools,billing}[a]||orders)(b);
}
function auth(){const up=location.hash==='#/signup';
 app.innerHTML=`<div><h1>${up?'Create your account':'Log in'}</h1><p>${up?'Free to start.':'Welcome back.'}</p><input id=em type=email autocomplete=email autocapitalize=none placeholder="Email"><input id=pw type=password autocomplete="${up?'new-password':'current-password'}" placeholder="Password (min 6)"><button class=btn id=go>${up?'Create free account':'Log in'}</button><p>${up?'Already have an account? <a href="#/login">Log in</a>':'New here? <a href="#/signup">Create an account</a>'}</p>${up?'':'<button class="btn alt" id=fp>Forgot password?</button>'}<p><a href="#/">← Back</a></p></div>`;
 $('go').onclick=async()=>{const c={email:$('em').value.trim().toLowerCase(),password:$('pw').value},r=up?await sb.auth.signUp(c):await sb.auth.signInWithPassword(c);if(r.error)return toast(r.error.message);if(up&&!r.data.session)return toast('Check your email to confirm, then log in.');V=null;location.hash='#/';route()};
 if($('fp'))$('fp').onclick=async()=>{const e=$('em').value.trim().toLowerCase();if(!e)return toast('Type your email first');const r=await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});toast(r.error?r.error.message:'Check your email for a reset link')}}
function onboard(u){app.innerHTML=`<form id=f><h2>Set up your business</h2><input name=b placeholder="Business name" required><input name=w type=tel placeholder="WhatsApp number" required><button class=btn>Continue</button></form>`;
 $('f').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
  const slug=f.b.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,5);
  const r=await sb.from('vendors').insert({id:u.id,business_name:f.b,whatsapp_number:ph(f.w),slug,referred_by_slug:localStorage.getItem('ref')});r.error?toast(r.error.message):(V=null,route())}}
async function orders(){
 const {data=[]}=await sb.from('orders').select('*,customers(name,phone)').order('created_at',{ascending:false}).limit(200);
 const l=data.filter(o=>filter==='all'||o.status===filter);
 app.innerHTML=`<div class=chips>${['all',...ST].map(s=>`<button class="chip ${s===filter?'on':''}" data-s=${s}>${s}</button>`).join('')}</div>`+
 (l.map(o=>`<a class=card href="#/o/${o.id}"><b>${E(o.customers?.name||'Customer')}</b><span class="badge ${o.status}">${o.status}</span><div>${o.quantity}× ${E(o.item)}</div><small>${N(o.total_amount)} · owes ${N(o.total_amount-o.amount_paid)} · ${new Date(o.created_at).toLocaleDateString()}</small></a>`).join('')||'<p class=empty>No orders yet. Tap + to add one, or share your order link (Plan tab).</p>')+'<a class=fab href="#/new">+</a>';
 app.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{filter=c.dataset.s;orders()})}
function newOrder(){app.innerHTML=`<form id=f><h2>New order</h2><input name=name placeholder="Customer name" required><input name=phone type=tel placeholder="Customer WhatsApp number" required><input name=item placeholder="Item" required><label>Quantity</label><input name=qty type=number min=1 value=1><input name=price type=number min=0 placeholder="Price each (₦)" required><label>Amount already paid (₦)</label><input name=paid type=number min=0 value=0><select name=source><option value=whatsapp>WhatsApp</option><option value=instagram>Instagram</option><option value=call>Call</option><option value=walk_in>Walk-in</option></select><button class=btn>Save order</button></form>`;
 $('f').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),p=ph(f.phone);
  let {data:c}=await sb.from('customers').select('id').eq('phone',p).maybeSingle();
  if(!c)c=(await sb.from('customers').insert({vendor_id:V.id,name:f.name,phone:p}).select().single()).data;
  const r=await sb.from('orders').insert({vendor_id:V.id,customer_id:c.id,item:f.item,quantity:+f.qty,total_amount:f.qty*f.price,amount_paid:+f.paid,source:f.source});
  r.error?toast(r.error.message):location.hash='#/'}}
async function detail(id){
 const {data:o}=await sb.from('orders').select('*,customers(name,phone)').eq('id',id).single();if(!o)return orders();
 const bal=o.total_amount-o.amount_paid,msg=`Hi ${o.customers.name}, about your order (${o.quantity}× ${o.item}): total ${N(o.total_amount)}${bal>0?`, balance ${N(bal)}`:' (fully paid)'}. Thank you! – ${V.business_name}`;
 app.innerHTML=`<h2>${E(o.customers.name)}</h2><div class=stat><span>${o.quantity}× ${E(o.item)}</span><b>${N(o.total_amount)}</b></div><div class=stat><span>Paid</span><b>${N(o.amount_paid)}</b></div><div class=stat><span>Balance</span><b>${N(bal)}</b></div>
 <a class=btn href="${wa(o.customers.phone,msg)}" target=_blank rel=noopener>Reply on WhatsApp</a><button class="btn alt" id=rc>Send receipt / invoice</button><a class="btn alt" href="#/delivery/${id}">Delivery & waybill</a>
 ${V.subaccount_code&&bal>0?'<button class="btn alt" id=pl>Get payment link</button>':''}<p>Status</p><div class=chips>${ST.map(s=>`<button class="chip ${s===o.status?'on':''}" data-s=${s}>${s}</button>`).join('')}</div>
 <input id=pay type=number min=1 placeholder="Record a payment (₦)"><button class="btn alt" id=pb>Add payment</button><button class="btn red" id=del>Delete order</button>`;
 app.querySelectorAll('.chip').forEach(c=>c.onclick=async()=>{await sb.from('orders').update({status:c.dataset.s}).eq('id',id);detail(id)});
 if($('pl'))$('pl').onclick=async()=>{const r=await sb.functions.invoke('paystack-collect',{body:{order_id:id}});r.data?.url?open(wa(o.customers.phone,`Hi ${o.customers.name}, you can pay ${N(bal)} for your order here: ${r.data.url}`),'_blank'):toast(r.data?.error||'Could not create link')};
 $('rc').onclick=()=>EXT.receipt(o);$('pb').onclick=async()=>{const n=+$('pay').value;if(n>0){await sb.from('orders').update({amount_paid:Math.min(o.total_amount,o.amount_paid+n)}).eq('id',id);detail(id)}};
 $('del').onclick=async()=>{if(confirm('Delete this order?')){await sb.from('orders').delete().eq('id',id);location.hash='#/'}}}
async function customers(){
 const {data=[]}=await sb.from('orders').select('total_amount,customers(id,name,phone)');const m={};
 data.forEach(o=>{const c=o.customers;if(c){m[c.id]??={...c,n:0,t:0};m[c.id].n++;m[c.id].t+=+o.total_amount}});
 app.innerHTML='<h2>Customers</h2>'+(Object.values(m).sort((a,b)=>b.t-a.t).map(c=>`<a class=card href="${wa(c.phone,'Hi '+c.name)}" target=_blank rel=noopener><b>${E(c.name)}</b><div>${c.n} order(s) · ${N(c.t)}</div><small>${E(c.phone)}</small></a>`).join('')||'<p class=empty>No customers yet.</p>')}
async function today(){
 const {data=[]}=await sb.from('orders').select('*,customers(name,phone)').neq('status','cancelled'),t=new Date().toDateString(),old=Date.now()-2*864e5;
 const td=data.filter(o=>new Date(o.created_at).toDateString()===t),owed=data.reduce((s,o)=>s+o.total_amount-o.amount_paid,0);
 const fu=data.filter(o=>o.total_amount>o.amount_paid&&new Date(o.created_at)<old);
 app.innerHTML=`<h2>Today</h2><div class=stat><span>Orders today</span><b>${td.length}</b></div><div class=stat><span>Collected (today's orders)</span><b>${N(td.reduce((s,o)=>s+ +o.amount_paid,0))}</b></div><div class=stat><span>Total still owed</span><b>${N(owed)}</b></div><h3>Follow up</h3>`+
 (fu.map(o=>`<a class=card target=_blank rel=noopener href="${wa(o.customers.phone,`Hi ${o.customers.name}, a gentle reminder of your balance of ${N(o.total_amount-o.amount_paid)} for ${o.item}. Thank you! – ${V.business_name}`)}"><b>${E(o.customers.name)}</b> owes ${N(o.total_amount-o.amount_paid)}<br><small>Tap to remind on WhatsApp</small></a>`).join('')||'<p class=empty>Nobody to chase. 🎉</p>')}
function billing(){
 const p=plan(V),base=location.origin+location.pathname,link=base+'?v='+V.slug,ref=base+'?ref='+V.slug;
 const b=(k,t,c='')=>`<button class="btn ${c}" data-p=${k}>${t}</button>`;
 app.innerHTML=profileCard()+`<h2>Plan: ${p}</h2>${V.plan_expires_at&&p!=='free'?`<p>Active until ${new Date(V.plan_expires_at).toLocaleDateString()}</p>`:'<p>Free plan: 15 orders per month.</p>'}`+
 (inApp?'':planCard('starter','Starter','₦2,000/month','',b('starter','Choose Starter')+b('starter_year','Yearly ₦20,000 (2 months free)','alt'))+planCard('pro','Pro','₦4,500/month','Most popular',b('pro','Choose Pro')+b('pro_year','Yearly ₦45,000 (2 months free)','alt'))+b('setup','Done-for-you setup · ₦10,000','alt'))+
 `${instBtn()}<h3>Group code</h3><input id=gc placeholder="Code from your market or association"><button class="btn alt" id=gb>Apply code</button>
 <h3>Refer a vendor</h3><p>When a vendor you refer pays for a plan, you get 30 free days.</p><input readonly value="${ref}" onclick="this.select()"><a class="btn alt" target=_blank rel=noopener href="https://wa.me/?text=${encodeURIComponent('Track your orders with Shopa Orders: '+ref)}">Share on WhatsApp</a>
 <h3>Your order link</h3><input readonly value="${link}" onclick="this.select()"><a class="btn alt" target=_blank rel=noopener href="https://wa.me/?text=${encodeURIComponent('Order from '+V.business_name+': '+link)}">Share on WhatsApp</a>
 <h3>Need help?</h3><a class="btn alt" target=_blank rel=noopener href="${wa(CFG.adminWhatsapp,'Hi, I need help with Shopa Orders.')}">Chat with us</a>
 <h3>Account</h3><a class="btn alt" href="privacy.html">Privacy policy</a><button class="btn alt" id=lo>Log out</button><button class="btn red" id=da>Delete my account and data</button>`;
 pay(app);
 logoBind();$('gb').onclick=async()=>{const r=await sb.rpc('redeem_group',{p_code:$('gc').value});r.error?toast(r.error.message):(toast('Joined '+r.data),V=null,route())};
 $('lo').onclick=async()=>{await sb.auth.signOut();V=null;route()};
 $('da').onclick=async()=>{if(confirm('This permanently deletes your account, orders and customers.')){await sb.rpc('delete_my_account');await sb.auth.signOut();V=null;route()}}}
function pay(root){root.querySelectorAll('[data-p]').forEach(b=>b.onclick=async()=>{const r=await sb.functions.invoke('paystack-init',{body:{kind:b.dataset.p}});r.data?.url?location.href=r.data.url:toast('Payment could not start')})}
async function tools(){
 const {data:pt=[]}=await sb.from('partners').select('*').order('name');
 app.innerHTML=`<h2>Get paid in the app</h2>`+(V.subaccount_code?`<p>✅ Payments are on. Open an unpaid order and tap "Get payment link". Money goes to your bank; Shopa keeps 2% plus Paystack's fee.</p>`:`<p>Let customers pay by card or transfer. Money goes straight to your bank. Shopa keeps 2% plus Paystack's fee.</p><div id=bank><select id=bk><option>Loading banks…</option></select><input id=ac type=tel maxlength=10 placeholder="10-digit account number"><button class=btn id=sa>Turn on payments</button></div>`)+
 `<h2>SMS reminders</h2><p>Credits: <b>${V.sms_credits}</b>. One credit sends one SMS to a customer who owes you (unpaid 2+ days).</p><button class=btn id=sm>Send SMS reminders</button>`+(inApp?'':`<button class="btn alt" data-p=sms50>Buy 50 credits · ₦1,500</button><button class="btn alt" data-p=sms200>Buy 200 credits · ₦5,000</button>`)+
 `<h2>Partners</h2>`+(pt.map(x=>`<a class=card target=_blank rel=noopener href="${wa(x.whatsapp,'Hi, I found you on Shopa Orders.')}"><b>${E(x.name)}</b><br><small>${E(x.category||'')}</small><div>${E(x.description||'')}</div></a>`).join('')||'<p class=empty>No partners yet.</p>');
 pay(app);
 if(!V.subaccount_code){const r=await sb.functions.invoke('paystack-subaccount',{body:{action:'banks'}});if(!Array.isArray(r.data)||!r.data.length){$('bank').innerHTML='<p><b>Online payments are not switched on yet.</b> This will work once Paystack is connected.</p>'}else{$('bk').innerHTML=(r.data||[]).map(x=>`<option value="${E(x.code)}">${E(x.name)}</option>`).join('');
  $('sa').onclick=async()=>{const r=await sb.functions.invoke('paystack-subaccount',{body:{action:'create',bank_code:$('bk').value,account_number:$('ac').value}});r.data?.ok?(toast('Payments turned on'),V=null,route()):toast(r.data?.error||'Could not set up. Check the account number.')}}}
 $('sm').onclick=async()=>{const r=await sb.functions.invoke('send-sms');toast(r.data?.error||`Sent ${r.data?.sent??0} SMS`);V=null;setTimeout(route,1500)}}
const FEATS={free:['15 orders a month','Your own order link','Customer list'],starter:['Unlimited orders','Product catalog with photos','Payment tracking and balances','One-tap WhatsApp reminders'],pro:['Everything in Starter','Your business logo on your shop page','Flyer and WhatsApp status maker','Receipts and invoices to WhatsApp','Stock tracking and low-stock alerts','Customer groups and broadcast messages','Delivery and waybill details','SMS reminders and in-app payment links']};
const planCard=(k,name,price,tag,cta)=>`<div class="plan ${k}">${tag?`<span class=ribbon>${tag}</span>`:''}<h3>${name}</h3><div class=price>${price}</div><ul>${FEATS[k].map(f=>`<li>${f}</li>`).join('')}</ul>${cta||''}</div>`;
const profileCard=()=>{const pro=plan(V)==='pro';return `<div class=profile><label class=avatar ${pro?'':`onclick="toast('Your logo is a Pro feature. Upgrade to unlock it.')"`}>${V.logo_url?`<img src="${E(V.logo_url)}" alt="">`:`<span>${E((V.business_name||'S')[0]).toUpperCase()}</span>`}${pro?'<input id=lg type=file accept="image/*" hidden>':''}<i>${pro?'✎':'🔒'}</i></label><div><b>${E(V.business_name)}</b><br><small>${pro?'Tap the circle to add or change your logo':'Upgrade to Pro to add your business logo'}</small></div></div>`};
const logoBind=()=>{const i=$('lg');if(!i)return;i.onchange=async()=>{const f=i.files[0];if(!f)return;const path=`${V.id}/logo-${Date.now()}.jpg`,u=await sb.storage.from('product-images').upload(path,await shrink(f),{contentType:'image/jpeg'});if(u.error)return alert(u.error.message);const url=sb.storage.from('product-images').getPublicUrl(path).data.publicUrl,r=await sb.from('vendors').update({logo_url:url}).eq('id',V.id);if(r.error)return alert(r.error.message);V=null;toast('Logo saved');route()}};
function landing(){
 const W=wa(CFG.adminWhatsapp,'Hi, I have a question about Shopa Orders'),t=(c,i,h,p)=>`<div class="feat ${c}"><span>${i}</span><b>${h}</b><p>${p}</p></div>`,st=(n,h,p)=>`<div class=step><span class=n>${n}</span><div><b>${h}</b><p>${p}</p></div></div>`;
 app.innerHTML=`<section class=hero2><img class=logo src="icons/icon-192.png" alt="Shopa Orders"><h1>Your shop, online in 10 minutes.</h1><p>Take orders on WhatsApp, track payments, and look professional. Built for small businesses in Nigeria.</p><a class="btn cta" href="#/signup">Get started free</a><a class="btn ghost" href="${W}" target=_blank rel=noopener>💬 Chat with us on WhatsApp</a>${instBtn()}<small>Free to start · No card needed<br>iPhone: tap Share, then Add to Home Screen</small></section>
 ${CFG.demoVideo?`<div class=vid><iframe src="https://www.youtube.com/embed/${CFG.demoVideo}" title="Shopa Orders demo" allowfullscreen loading=lazy></iframe></div>`:''}
 <h2 class=sec>How it works</h2><div class=steps>${st(1,'Sign up','Add your business name and WhatsApp number.')}${st(2,'Add your products','Upload photos and prices. Share your shop link.')}${st(3,'Get orders on WhatsApp','Customers pick items and the order lands in your app.')}</div>
 <h2 class=sec>Everything you need to sell</h2><div class=feats>${t('c1','🛍️','Your own shop link','Customers see your products and order in a few taps.')}${t('c2','📦','Order tracking','See who ordered, who paid, and who owes you.')}${t('c3','🧾','Receipts and invoices','Send a neat receipt to your buyer on WhatsApp.')}${t('c4','📣','Flyers in one tap','Turn any product into a poster for your status.')}${t('c5','📊','Stock alerts','Know when items run low. Sold-out items hide themselves.')}${t('c6','🚚','Delivery details','Send rider and tracking details to customers.')}</div>
 <h2 class=sec>Simple pricing</h2>${planCard('free','Free','₦0','','<a class="btn alt" href="#/signup">Start free</a>')}${planCard('starter','Starter','₦2,000<small>/month</small>','','<a class="btn alt" href="#/signup">Choose Starter</a>')}${planCard('pro','Pro','₦4,500<small>/month</small>','Most popular','<a class=btn href="#/signup">Choose Pro</a>')}<p class=foot>Pay yearly and get 2 months free.</p>
 <h2 class=sec>Have a question?</h2><a class="btn alt" href="${W}" target=_blank rel=noopener>💬 Chat with us on WhatsApp</a><a class=btn href="#/signup">Create my free shop</a>
 <p class=foot><a href="privacy.html">Privacy policy</a> · <a href="#/login">Log in</a></p>`}
const shrink=f=>new Promise(res=>{const i=new Image();i.onload=()=>{const k=Math.min(1,800/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);c.toBlob(res,'image/jpeg',.7)};i.onerror=()=>res(f);i.src=URL.createObjectURL(f)});
async function products(){
 const {data=[],error:le}=await sb.from('products').select('*').order('created_at',{ascending:false});
 app.innerHTML=`<h2>My products</h2><p>Add what you sell. Customers see these on your order link and tap what they want.</p><form id=pf><input name=name placeholder="Product name" required><input name=price type=number min=0 placeholder="Price (₦)" required><input name=desc placeholder="Short description (optional)"><input name=img type=file accept="image/*"><button class=btn>Add product</button></form>`+
 (data.map(p=>`<div class="card prod">${p.image_url?`<img src="${E(p.image_url)}" alt="">`:''}<div><b>${E(p.name)}</b><br>${N(p.price)}${p.available?'':' · hidden'}</div><div><button class=chip data-t="${p.id}" data-a="${p.available}">${p.available?'Hide':'Show'}</button> <button class=chip data-d="${p.id}">Delete</button></div></div>`).join('')||(le?'<p class=empty>The products table is not set up yet ('+E(le.message)+')</p>':'<p class=empty>No products yet.</p>'));
 $('pf').onsubmit=async e=>{e.preventDefault();const bt=e.target.querySelector('button.btn'),fail=m=>{bt.disabled=false;bt.textContent='Add product';alert(m)};bt.disabled=true;bt.textContent='Adding…';const f=new FormData(e.target),file=f.get('img');let url=null;
  if(file&&file.size){const path=`${V.id}/${Date.now()}.jpg`,u=await sb.storage.from('product-images').upload(path,await shrink(file),{contentType:'image/jpeg'});if(u.error)return fail(u.error.message);url=sb.storage.from('product-images').getPublicUrl(path).data.publicUrl}
  const r=await sb.from('products').insert({vendor_id:V.id,name:f.get('name'),price:+f.get('price'),description:f.get('desc'),image_url:url});r.error?fail(r.error.message):products()};
 app.querySelectorAll('[data-t]').forEach(b=>b.onclick=async()=>{await sb.from('products').update({available:b.dataset.a!=='true'}).eq('id',b.dataset.t);products()});
 app.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this product?')){await sb.from('products').delete().eq('id',b.dataset.d);products()}})}
async function pub(slug){
 const [a,b]=await Promise.all([sb.rpc('get_public_vendor',{p_slug:slug}),sb.rpc('get_public_products',{p_slug:slug})]),v=a.data?.[0],pr=b.data||[],q={};
 if(!v)return app.innerHTML='<div class=empty><h2>Shop not found</h2><p>Please check the link and try again.</p></div>';
 const head=`<header class=shophead>${v.logo_url?`<img class=shoplogo src="${E(v.logo_url)}" alt="">`:`<div class="shoplogo ph">${E((v.business_name||'S')[0]).toUpperCase()}</div>`}<h1>${E(v.business_name)}</h1><p>${pr.length?'Pick what you want, then send your order.':'Tell us what you want, then send your order.'}</p></header>`;
 app.innerHTML=head+(pr.length?`<h2 class=sec>1. Choose your items</h2><div class=grid>${pr.map(p=>`<div class=card id="c${p.id}">${p.image_url?`<img src="${E(p.image_url)}" alt="" loading=lazy>`:''}<b>${E(p.name)}</b><div class=pp>${N(p.price)}</div><small>${E(p.description||'')}</small><div class=qty><button type=button data-m="${p.id}">−</button><span id="q${p.id}">0</span><button type=button data-p="${p.id}">+</button></div></div>`).join('')}</div>`:'')+
 `<h2 class=sec>${pr.length?'2. Your details':'Your order'}</h2><form id=f><input name=n placeholder="Your name" required><input name=p type=tel placeholder="Your WhatsApp number" required>${pr.length?'':'<input name=i placeholder="What do you want?" required><label>How many?</label><input name=q type=number min=1 value=1>'}<input name=t placeholder="Note (optional)"><div id=sm class=summary></div><button class=btn>Send my order</button><small class=center>Your order goes straight to ${E(v.business_name)}. WhatsApp then opens so you can chat with them.</small></form>`;
 const lines=()=>pr.filter(p=>q[p.id]>0),tot=()=>lines().reduce((s,p)=>s+q[p.id]*p.price,0);
 const upd=()=>{pr.forEach(p=>$('c'+p.id).classList.toggle('sel',q[p.id]>0));$('sm').innerHTML=pr.length?(lines().length?`<b>Your order</b>${lines().map(p=>`<div class=ln><span>${q[p.id]} × ${E(p.name)}</span><span>${N(q[p.id]*p.price)}</span></div>`).join('')}<div class="ln tt"><span>Total</span><span>${N(tot())}</span></div>`:'<small>Tap + on an item to add it to your order.</small>'):''};
 app.querySelectorAll('[data-p],[data-m]').forEach(x=>x.onclick=()=>{const id=x.dataset.p||x.dataset.m;q[id]=Math.max(0,(q[id]||0)+(x.dataset.p?1:-1));$('q'+id).textContent=q[id];upd()});
 upd();
 const done=(txt,t,f)=>{const link=wa(v.whatsapp_number,`Hi ${v.business_name}, I'm ${f.n}. I've just placed an order: ${txt}.${t?` Total ${N(t)}.`:''} ${f.t||''}`);
  app.innerHTML=head+`<div class=success><div class=tick>✓</div><h2>Order sent!</h2><p>Thank you, ${E(f.n)}. <b>${E(v.business_name)}</b> has received your order and will get back to you on WhatsApp.</p><div class=card><b>${E(txt)}</b>${t?`<br>Total: ${N(t)}`:''}</div><a class=btn href="${link}" target=_blank rel=noopener>Open WhatsApp to chat with them</a><button class="btn alt" id=again>Place another order</button><small class=center>You don't need to do anything else. If WhatsApp did not open, tap the green button.</small></div>`;
  $('again').onclick=()=>pub(slug);window.scrollTo(0,0);try{open(link,'_blank')}catch(e){}};
 $('f').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button.btn'),f=Object.fromEntries(new FormData(e.target));let txt,t=0;btn.disabled=true;btn.textContent='Sending…';
  const fail=m=>{btn.disabled=false;btn.textContent='Send my order';toast(m)};
  if(pr.length){const items=lines().map(p=>({id:p.id,qty:q[p.id]}));if(!items.length)return fail('Choose at least one item');
   const r=await sb.rpc('submit_catalog_order',{p_slug:slug,p_name:f.n,p_phone:ph(f.p),p_items:items,p_note:f.t});
   if(r.error)return fail(/stock/i.test(r.error.message)?r.error.message:'Sorry, this shop cannot take orders right now.');[txt,t]=r.data.split('|')}
  else{const r=await sb.rpc('submit_public_order',{p_slug:slug,p_name:f.n,p_phone:ph(f.p),p_item:f.i,p_qty:+f.q,p_note:f.t});if(r.error)return fail('Sorry, this shop cannot take orders right now.');txt=`${f.q}× ${f.i}`}
  done(txt,+t,f)}}
addEventListener('hashchange',route);sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){window.recovering=true;nav.innerHTML='';app.innerHTML='<div><h1>Set a new password</h1><input id=np type=password autocomplete=new-password placeholder="New password (min 6)"><button class=btn id=sp>Save password</button></div>';$('sp').onclick=async()=>{const r=await sb.auth.updateUser({password:$('np').value});if(r.error)return toast(r.error.message);toast('Password updated');window.recovering=false;V=null;location.hash='#/';route()}}});route();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
