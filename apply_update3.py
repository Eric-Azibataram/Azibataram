import re,os
for f in ('app.js','styles.css','features.js'):
    if not os.path.exists(f): raise SystemExit('Missing '+f+'. Run this in the main folder.')
s=open('app.js').read();c=open('styles.css').read()
if 'planCard' in s: raise SystemExit('Already updated')
block=r"""const FEATS={free:['15 orders a month','Your own order link','Customer list'],starter:['Unlimited orders','Product catalog with photos','Payment tracking and balances','One-tap WhatsApp reminders'],pro:['Everything in Starter','Your business logo on your shop page','Flyer and WhatsApp status maker','Receipts and invoices to WhatsApp','Stock tracking and low-stock alerts','Customer groups and broadcast messages','Delivery and waybill details','SMS reminders and in-app payment links']};
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
"""
s,n=re.subn(r"function landing\(\)\{.*?\n(?=const shrink)",lambda m:block,s,count=1,flags=re.S);assert n==1,'landing not found'
a="app.innerHTML=`<h2>Plan: ${p}</h2>"
assert a in s;s=s.replace(a,"app.innerHTML=profileCard()+`<h2>Plan: ${p}</h2>",1)
a=s[s.index("(inApp?'':b('starter'"):s.index("b('setup','Done-for-you setup · ₦10,000','alt'))+")+len("b('setup','Done-for-you setup · ₦10,000','alt'))+")]
s=s.replace(a,"(inApp?'':planCard('starter','Starter','₦2,000/month','',b('starter','Choose Starter')+b('starter_year','Yearly ₦20,000 (2 months free)','alt'))+planCard('pro','Pro','₦4,500/month','Most popular',b('pro','Choose Pro')+b('pro_year','Yearly ₦45,000 (2 months free)','alt'))+b('setup','Done-for-you setup · ₦10,000','alt'))+",1)
a="$('gb').onclick=";assert a in s;s=s.replace(a,"logoBind();"+a,1)
a="app.innerHTML=`<h1>${E(v.business_name)}</h1>`+(pr.length";assert a in s
s=s.replace(a,"app.innerHTML=(v.logo_url?`<img class=shoplogo src=\"${E(v.logo_url)}\" alt=\"\">`:'')+`<h1>${E(v.business_name)}</h1>`+(pr.length",1)
open('app.js','w').write(s)
c+="""
@media(prefers-color-scheme:light){body{background:#f1f7f3}.card,.step,.plan{background:#fff}}
@media(prefers-color-scheme:dark){.step,.plan{background:#1b211e}}
.card{border:0;box-shadow:0 2px 8px #0000000f}
.btn{background:linear-gradient(135deg,#1F7A4D,#2fa36b);box-shadow:0 3px 10px #1f7a4d44}.btn.alt{background:none;box-shadow:none}.btn.red{background:#b3261e;box-shadow:none}
.hero2{text-align:center;color:#fff;background:linear-gradient(160deg,#1F7A4D,#0e3d26);border-radius:24px;padding:26px 16px;margin:6px 0 10px}
.hero2 h1{color:#fff;font-size:30px;line-height:1.15;margin:.3em 0}.hero2 p{color:#d6efe1}.hero2 small{color:#cfe9da;display:block;margin-top:6px}
.hero2 .btn.cta{background:#ffd54f;color:#3b2f00;box-shadow:none}.hero2 .btn.ghost{background:#ffffff22;color:#fff;border:1px solid #ffffff66;box-shadow:none}.hero2 .btn.alt{color:#fff;border-color:#fff}
.sec{margin:28px 0 10px}.steps{display:grid;gap:10px}.step{display:flex;gap:12px;align-items:center;padding:14px;border-radius:16px;box-shadow:0 2px 8px #0000000f}.step p{margin:2px 0 0;color:var(--m)}
.n{flex:none;width:36px;height:36px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center;font-weight:800}
.feats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.feat{border-radius:16px;padding:14px;color:#1b1f1d}.feat span{font-size:28px}.feat p{margin:4px 0 0;font-size:13px;color:#4a524e}
.c1{background:#e3f4ea}.c2{background:#fff1cc}.c3{background:#e2edff}.c4{background:#fde6ee}.c5{background:#ece3ff}.c6{background:#dcf5f1}
.plan{position:relative;border:2px solid var(--l);border-radius:18px;padding:16px;margin:14px 0}.plan.pro{border-color:#1F7A4D;box-shadow:0 6px 18px #1f7a4d33}.plan h3{margin:0}.plan .price{font-size:28px;font-weight:800;color:var(--g)}.plan .price small{font-size:14px;color:var(--m);font-weight:400}
.plan ul{list-style:none;padding:0;margin:10px 0}.plan li{padding:5px 0 5px 26px;position:relative}.plan li:before{content:'✓';position:absolute;left:0;color:var(--g);font-weight:800}
.ribbon{position:absolute;top:-12px;right:14px;background:#f59e0b;color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px}
.profile{display:flex;gap:14px;align-items:center;margin:6px 0 14px}.avatar{position:relative;flex:none;width:76px;height:76px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center;font-size:32px;font-weight:700;cursor:pointer}
.avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover}.avatar i{position:absolute;right:-2px;bottom:-2px;width:28px;height:28px;border-radius:50%;background:#fff;border:1px solid var(--l);display:grid;place-items:center;font-size:13px;font-style:normal;color:#333}
.shoplogo{width:76px;height:76px;border-radius:50%;object-fit:cover;display:block;margin:6px auto}
"""
open('styles.css','w').write(c)
print('Done')
