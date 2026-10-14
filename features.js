// Shopa Orders: extra vendor tools. Loaded before app.js; uses app.js globals at call time.
window.EXT={};let segSel='all';
const isPro=()=>plan(V)==='pro';
const needPro=n=>{toast(n+' is a Pro feature. Upgrade to unlock it.');location.hash='#/billing'};
const wrapT=(g,t,x,y,mw,lh)=>{let l='';for(const a of String(t).split(' ')){const n=l?l+' '+a:a;if(g.measureText(n).width>mw&&l){g.fillText(l,x,y);y+=lh;l=a}else l=n}g.fillText(l,x,y);return y+lh};
const shopLink=()=>location.origin+location.pathname+'?v='+V.slug;
const share=async(c,name,text)=>{const b=await new Promise(r=>c.toBlob(r,'image/png')),f=new File([b],name,{type:'image/png'});
 if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text});return}catch(e){if(e.name==='AbortError')return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();toast('Image saved. Attach it in WhatsApp.')};
// 1. Receipt / invoice image, shared straight to WhatsApp
EXT.receipt=o=>{if(!isPro())return needPro('Receipts and invoices');const c=document.createElement('canvas');c.width=800;c.height=1000;const g=c.getContext('2d'),bal=o.total_amount-o.amount_paid,G='#1F7A4D';let y=250;
 g.fillStyle='#fff';g.fillRect(0,0,800,1000);g.fillStyle=G;g.fillRect(0,0,800,170);g.fillStyle='#fff';g.font='bold 44px sans-serif';g.fillText(V.business_name.slice(0,26),50,80);g.font='28px sans-serif';g.fillText(bal>0?'INVOICE':'RECEIPT',50,130);
 const row=(a,b,bold)=>{g.font=(bold?'bold ':'')+'30px sans-serif';g.fillStyle='#555';g.fillText(a,50,y);g.fillStyle='#111';g.textAlign='right';g.fillText(b,750,y);g.textAlign='left';y+=64};
 row('Date',new Date(o.created_at).toLocaleDateString());row('Customer',o.customers.name);row('Order ref','#'+o.id.slice(0,6).toUpperCase());
 g.fillStyle='#ddd';g.fillRect(50,y-30,700,3);y+=20;g.fillStyle='#111';g.font='bold 32px sans-serif';y=wrapT(g,o.quantity+' x '+o.item,50,y,700,42)+20;
 row('Total',N(o.total_amount),1);row('Paid',N(o.amount_paid));row(bal>0?'Balance due':'Balance',N(bal),1);
 g.fillStyle=bal>0?'#b3261e':G;g.font='bold 40px sans-serif';g.fillText(bal>0?'PAYMENT PENDING':'PAID IN FULL',50,y+30);
 g.fillStyle='#777';g.font='26px sans-serif';g.fillText('Thank you for your order!',50,900);g.fillText('WhatsApp: +'+V.whatsapp_number,50,940);
 share(c,'Receipt-'+o.id.slice(0,6)+'.png',(bal>0?'Invoice':'Receipt')+' from '+V.business_name)};
// 2. Flyer / WhatsApp status poster for a product
EXT.flyer=p=>{if(!isPro())return needPro('The flyer maker');const c=document.createElement('canvas');c.width=1080;c.height=1920;const g=c.getContext('2d'),G='#1F7A4D',gr=g.createLinearGradient(0,0,0,1920);
 gr.addColorStop(0,G);gr.addColorStop(1,'#0e3d26');g.fillStyle=gr;g.fillRect(0,0,1080,1920);g.fillStyle='#fff';g.textAlign='center';g.font='bold 64px sans-serif';g.fillText(V.business_name.slice(0,28),540,150);
 const draw=img=>{g.save();g.beginPath();g.roundRect(90,230,900,900,48);g.clip();
  if(img){const k=Math.max(900/img.width,900/img.height),w=img.width*k,h=img.height*k;g.drawImage(img,90+(900-w)/2,230+(900-h)/2,w,h)}else{g.fillStyle='#fff';g.fillRect(90,230,900,900);g.fillStyle=G;g.font='bold 360px sans-serif';g.fillText(p.name[0].toUpperCase(),540,820)}
  g.restore();g.fillStyle='#fff';g.font='bold 84px sans-serif';const y=wrapT(g,p.name,540,1260,900,96);
  g.fillStyle='#ffd54f';g.font='bold 110px sans-serif';g.fillText(N(p.price),540,y+60);
  g.fillStyle='#fff';g.fillRect(140,1620,800,130);g.fillStyle=G;g.font='bold 52px sans-serif';g.fillText('Order on WhatsApp',540,1672);g.font='44px sans-serif';g.fillText('+'+V.whatsapp_number,540,1730);
  g.fillStyle='#cfe9da';g.font='32px sans-serif';g.fillText(shopLink().replace('https://','').slice(0,60),540,1810);
  share(c,'flyer-'+p.name.replace(/\W+/g,'-')+'.png',p.name+' - '+N(p.price)+'. Order: '+shopLink())};
 if(p.image_url){const i=new Image();i.crossOrigin='anonymous';i.onload=()=>draw(i);i.onerror=()=>draw(null);i.src=p.image_url}else draw(null)};
// 3. Products with stock tracking, flyer button
EXT.products=async()=>{
 const {data=[]}=await sb.from('products').select('*').order('created_at',{ascending:false}),pro=isPro();
 app.innerHTML=`<h2>My products</h2><p>Add what you sell. Customers see these on your order link.</p><form id=pf><input name=name placeholder="Product name" required><input name=price type=number min=0 placeholder="Price (₦)" required>${pro?'<input name=stock type=number min=0 placeholder="Stock quantity (empty = not tracked)">':''}<input name=desc placeholder="Short description (optional)"><input name=img type=file accept="image/*"><button class=btn>Add product</button></form>`+
 (data.map(p=>`<div class="card prod">${p.image_url?`<img src="${E(p.image_url)}" alt="">`:''}<div><b>${E(p.name)}</b><br>${N(p.price)}<br><small>${!pro?'':p.stock==null?'Stock not tracked':p.stock<=0?'SOLD OUT':p.stock<=p.low_at?'⚠️ Low: '+p.stock+' left':p.stock+' in stock'}${p.available?'':' · hidden'}</small></div><div style="display:flex;flex-wrap:wrap;gap:6px;max-width:150px"><button class=chip data-f="${p.id}">Flyer</button><button class=chip data-s="${p.id}">${pro?'':'🔒 '}Stock</button><button class=chip data-t="${p.id}" data-a="${p.available}">${p.available?'Hide':'Show'}</button><button class=chip data-d="${p.id}">Delete</button></div></div>`).join('')||'<p class=empty>No products yet.</p>');
 $('pf').onsubmit=async e=>{e.preventDefault();const bt=e.target.querySelector('button.btn'),fail=m=>{bt.disabled=false;bt.textContent='Add product';alert(m)};bt.disabled=true;bt.textContent='Adding…';
  const f=new FormData(e.target),file=f.get('img');let url=null;
  if(file&&file.size){const path=`${V.id}/${Date.now()}.jpg`,u=await sb.storage.from('product-images').upload(path,await shrink(file),{contentType:'image/jpeg'});if(u.error)return fail(u.error.message);url=sb.storage.from('product-images').getPublicUrl(path).data.publicUrl}
  const st=f.get('stock'),r=await sb.from('products').insert({vendor_id:V.id,name:f.get('name'),price:+f.get('price'),description:f.get('desc'),image_url:url,stock:st==null||st===''?null:+st});r.error?fail(r.error.message):EXT.products()};
 const q=k=>app.querySelectorAll('['+k+']');
 q('data-f').forEach(b=>b.onclick=()=>EXT.flyer(data.find(p=>p.id===b.dataset.f)));
 q('data-s').forEach(b=>b.onclick=async()=>{if(!pro)return needPro('Stock tracking');const n=prompt('New stock quantity? (leave empty to stop tracking)');if(n===null)return;const v=n===''?null:Math.max(0,+n);await sb.from('products').update({stock:v,available:v===null?true:v>0}).eq('id',b.dataset.s);EXT.products()});
 q('data-t').forEach(b=>b.onclick=async()=>{await sb.from('products').update({available:b.dataset.a!=='true'}).eq('id',b.dataset.t);EXT.products()});
 q('data-d').forEach(b=>b.onclick=async()=>{if(confirm('Delete this product?')){await sb.from('products').delete().eq('id',b.dataset.d);EXT.products()}})};
// 4. Today screen plus low-stock alert
EXT.today=async()=>{await today();if(!isPro())return;const {data=[]}=await sb.from('products').select('name,stock,low_at').not('stock','is',null),low=data.filter(p=>p.stock<=p.low_at);
 if(low.length)app.insertAdjacentHTML('afterbegin','<div class=card><b>⚠️ Low stock</b>'+low.map(p=>`<div>${E(p.name)}: ${p.stock<=0?'sold out':p.stock+' left'}</div>`).join('')+'<a href="#/products">Update stock</a></div>')};
// 5. Customers with automatic segments and message templates
EXT.customers=async()=>{
 if(!isPro()){await customers();app.insertAdjacentHTML('afterbegin','<div class=card><b>🔒 Customer groups and broadcasts</b><div>Sort customers into frequent buyers, pending payments and more, and send personal messages. Available on Pro.</div><a href="#/billing">See Pro</a></div>');return}
 const {data=[]}=await sb.from('orders').select('total_amount,amount_paid,created_at,customers(id,name,phone)').neq('status','cancelled'),m={},now=Date.now();
 data.forEach(o=>{const c=o.customers;if(!c)return;const x=m[c.id]??={...c,n:0,t:0,owed:0,last:0};x.n++;x.t+=+o.total_amount;x.owed+=o.total_amount-o.amount_paid;x.last=Math.max(x.last,+new Date(o.created_at))});
 const all=Object.values(m).sort((a,b)=>b.t-a.t),S={all:['All',()=>1,'Hi {name}, this is {shop}. '],freq:['Frequent buyers',c=>c.n>=3,'Hi {name}, thank you for always buying from {shop}! Here is something special for you: '],owe:['Pending payment',c=>c.owed>0,'Hi {name}, a gentle reminder of your balance of {owed} at {shop}. Thank you!'],newc:['New buyers',c=>c.n===1,'Hi {name}, thanks for your first order at {shop}! Order again anytime: {link}'],cold:['Not ordered in 30 days',c=>now-c.last>30*864e5,'Hi {name}, we miss you at {shop}! See what is new: {link}']};
 const l=all.filter(S[segSel][1]),fill=(t,c)=>t.split('{name}').join(c.name).split('{shop}').join(V.business_name).split('{owed}').join(N(c.owed)).split('{link}').join(shopLink());
 app.innerHTML=`<h2>Customers</h2><div class=chips>${Object.keys(S).map(k=>`<button class="chip ${k===segSel?'on':''}" data-k=${k}>${S[k][0]} (${all.filter(S[k][1]).length})</button>`).join('')}</div><p><small>Edit the message, then tap Send beside each customer. Use {name}, {shop}, {owed}, {link}.</small></p><textarea id=tpl rows=3>${E(S[segSel][2])}</textarea>`+
 (l.map((c,i)=>`<div class="card prod"><div><b>${E(c.name)}</b><br><small>${c.n} order(s) · ${N(c.t)}${c.owed>0?' · owes '+N(c.owed):''}</small></div><button class=chip data-i=${i}>Send</button></div>`).join('')||'<p class=empty>No customers in this group.</p>');
 app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{segSel=b.dataset.k;EXT.customers()});
 app.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const c=l[b.dataset.i];open(wa(c.phone,fill($('tpl').value,c)),'_blank')})};
// 6. Delivery and waybill details for an order
EXT.delivery=async id=>{
 if(!isPro())return needPro('Delivery and waybill details');
 const {data:o}=await sb.from('orders').select('*,customers(name,phone)').eq('id',id).single();if(!o)return orders();
 app.innerHTML=`<h2>Delivery: ${E(o.customers.name)}</h2><p>${o.quantity}× ${E(o.item)}</p><form id=df><label>Delivery address</label><input name=address value="${E(o.address||'')}"><label>Rider or dispatch company</label><input name=rider_name value="${E(o.rider_name||'')}"><label>Rider phone</label><input name=rider_phone type=tel value="${E(o.rider_phone||'')}"><label>Delivery fee (₦)</label><input name=delivery_fee type=number min=0 value="${o.delivery_fee||0}"><label>Tracking link or note</label><input name=tracking value="${E(o.tracking||'')}"><button class=btn>Save</button></form><button class="btn alt" id=ds>Send delivery details on WhatsApp</button><a class="btn alt" href="#/tools">Find a dispatch partner</a><a href="#/o/${id}">← Back to order</a>`;
 const get=()=>Object.fromEntries(new FormData($('df')));
 $('df').onsubmit=async e=>{e.preventDefault();const f=get();const r=await sb.from('orders').update({...f,delivery_fee:+f.delivery_fee||0}).eq('id',id);toast(r.error?r.error.message:'Saved')};
 $('ds').onclick=()=>{const f=get();open(wa(o.customers.phone,`Hi ${o.customers.name}, your order (${o.item}) from ${V.business_name} is on its way.${f.address?' Address: '+f.address+'.':''}${f.rider_name?' Rider: '+f.rider_name+(f.rider_phone?' ('+f.rider_phone+')':'')+'.':''}${+f.delivery_fee?' Delivery fee: '+N(f.delivery_fee)+'.':''}${f.tracking?' Track: '+f.tracking:''}`),'_blank')}};
