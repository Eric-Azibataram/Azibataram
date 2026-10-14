import re
s=open('app.js').read();c=open('styles.css').read()
if 'class=success' in s: raise SystemExit('Already updated')
new=r"""async function pub(slug){
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
"""
s,n=re.subn(r"async function pub\(slug\)\{.*?\n(?=addEventListener\('hashchange')",lambda m:new,s,count=1,flags=re.S);assert n==1,'pub not found'
open('app.js','w').write(s)
c+="""
#nav:empty{display:none}
.shophead{text-align:center;color:#fff;background:linear-gradient(160deg,#1F7A4D,#0e3d26);border-radius:24px;padding:22px 16px;margin:6px 0 4px}
.shophead h1{color:#fff;margin:.2em 0;font-size:28px}.shophead p{color:#d6efe1;margin:0}
.shoplogo{width:84px;height:84px;border-radius:50%;object-fit:cover;display:block;margin:0 auto;border:3px solid #fff}
.shoplogo.ph{display:grid;place-items:center;background:#fff;color:var(--g);font-size:36px;font-weight:800}
.pp{color:var(--g);font-weight:800}.card.sel{outline:3px solid var(--g);background:#e8f6ee}
.summary{background:#eef7f1;border-radius:14px;padding:12px;margin:10px 0}.summary .ln{display:flex;justify-content:space-between;padding:4px 0}.summary .tt{border-top:1px solid #cfe3d6;margin-top:6px;padding-top:8px;font-weight:800;font-size:18px;color:var(--g)}
.center{display:block;text-align:center;color:var(--m);margin:8px 0}
.success{text-align:center;padding:10px 0}.tick{width:84px;height:84px;margin:10px auto;border-radius:50%;background:var(--g);color:#fff;font-size:48px;display:grid;place-items:center;box-shadow:0 6px 18px #1f7a4d55}
"""
open('styles.css','w').write(c)
print('Done')
