s=open('app.js').read();c=open('styles.css').read()
if 'payBox' in s: raise SystemExit('Already updated')
def rep(a,b):
    global s
    assert a in s,'Not found: '+a[:60]
    s=s.replace(a,b,1)
# 1. delivery fields on the customer order page
rep('placeholder="Your WhatsApp number" required>','placeholder="Your WhatsApp number" required><label>How do you want to receive it?</label><select name=dt><option value=delivery>Deliver to me</option><option value=pickup>I will pick it up</option></select><div id=dl><input name=ad placeholder="House address or street"><input name=ar placeholder="Area or community (e.g. Yenagoa, Otuoke)"><input name=lm placeholder="Nearest landmark (optional)"></div>')
rep("app.querySelectorAll('[data-p],[data-m]').forEach(","app.querySelector('[name=dt]').onchange=e=>{$('dl').hidden=e.target.value==='pickup'};app.querySelectorAll('[data-p],[data-m]').forEach(")
rep("const fail=m=>{btn.disabled=false;btn.textContent='Send my order';toast(m)};","const fail=m=>{btn.disabled=false;btn.textContent='Send my order';toast(m)};const dv={type:f.dt,address:f.ad||'',area:f.ar||'',landmark:f.lm||''};if(f.dt==='delivery'&&!(f.ad&&f.ar))return fail('Please add your address and area for delivery');")
rep("p_items:items,p_note:f.t}","p_items:items,p_note:f.t,p_delivery:dv}")
rep("p_qty:+f.q,p_note:f.t}","p_qty:+f.q,p_note:f.t,p_delivery:dv}")
# 2. confirmation screen: delivery summary, transfer details, no forced WhatsApp jump
rep("${t?`<br>Total: ${N(t)}`:''}</div>","${t?`<br>Total: ${N(t)}`:''}${f.dt==='delivery'?`<br><small>Delivery to: ${E(f.ad)}, ${E(f.ar)}</small>`:f.dt==='pickup'?'<br><small>Pickup</small>':''}</div>")
rep("${t?` Total ${N(t)}.`:''} ${f.t||''}`","${t?` Total ${N(t)}.`:''}${f.dt==='delivery'?' Delivery to: '+f.ad+', '+f.ar+'.':''} ${f.t||''}`")
rep("window.scrollTo(0,0);try{open(link,'_blank')}catch(e){}}","window.scrollTo(0,0);payBox(slug,v,t,f,link)}")
# 3. vendor sees delivery info on the order
rep("<p>Status</p>","${o.delivery_type?`<div class=card><b>${o.delivery_type==='pickup'?'Pickup':'Delivery'}</b>${o.address?`<br>${E(o.address)}`:''}${o.area?`<br>${E(o.area)}`:''}${o.landmark?`<br><small>Near: ${E(o.landmark)}</small>`:''}</div>`:''}<p>Status</p>")
# 4. vendor bank-transfer form on the Plan tab
rep("<h3>Group code</h3>","${payForm()}<h3>Group code</h3>")
rep("logoBind();","logoBind();payBind();")
block=r"""const payForm=()=>`<h3>Bank transfer details</h3><p><small>Customers see these after they place an order, so they can pay you by transfer. Use your business account.</small></p><form id=bf><input name=bn placeholder="Bank name" value="${E(V.bank_name||'')}"><input name=an type=tel maxlength=10 placeholder="Account number (10 digits)" value="${E(V.account_number||'')}"><input name=nm placeholder="Account name" value="${E(V.account_name||'')}"><input name=pn placeholder="Note for customers (optional)" value="${E(V.pay_note||'')}"><button class="btn alt">Save payment details</button></form>`;
const payBind=()=>{const f=$('bf');if(!f)return;f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));if(d.an.trim()&&!/^\d{10}$/.test(d.an.trim()))return toast('Account number must be 10 digits');const r=await sb.from('vendors').update({bank_name:d.bn.trim()||null,account_number:d.an.trim()||null,account_name:d.nm.trim()||null,pay_note:d.pn.trim()||null}).eq('id',V.id);if(r.error)return alert(r.error.message);V=null;toast('Saved');route()}};
async function payBox(slug,v,t,f,link){const {data}=await sb.rpc('get_transfer_details',{p_slug:slug}),d=data?.[0];
 if(!d){try{open(link,'_blank')}catch(e){}return}
 const el=document.createElement('div');el.className='card paybox';
 el.innerHTML=`<b>Pay by bank transfer</b><p>${t?'Amount: <b>'+N(t)+'</b><br>':''}Bank: <b>${E(d.bank_name)}</b><br>Account number: <b>${E(d.account_number)}</b><br>Account name: <b>${E(d.account_name)}</b>${d.pay_note?'<br><small>'+E(d.pay_note)+'</small>':''}</p><button class="btn alt" id=cp>Copy account number</button><a class=btn target=_blank rel=noopener href="${wa(v.whatsapp_number,'Hi '+v.business_name+', I have paid '+(t?N(t):'for my order')+'. My name is '+f.n+'.')}">I have paid: send proof on WhatsApp</a><small class=center>Check that the account name matches ${E(v.business_name)} before you send money.</small>`;
 document.querySelector('.success .card').after(el);$('cp').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(d.account_number);toast('Account number copied')}}
"""
rep("addEventListener('hashchange'",block+"addEventListener('hashchange'")
c+=".paybox{text-align:left;border:2px solid var(--g);margin:14px 0}.paybox p{line-height:1.7}\nselect{width:100%;padding:14px;margin:6px 0;border:1px solid var(--l);border-radius:12px;font:inherit;background:var(--bg);color:var(--t)}\n"
open('app.js','w').write(s);open('styles.css','w').write(c)
print('Done')
