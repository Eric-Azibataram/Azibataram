// Owner-only admin screens. Needs a row in the admins table.
window.EXT=window.EXT||{};
const trk=(k,s)=>{try{const key='t:'+k+s;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,1)}catch(e){}sb.rpc('track',{p_kind:k,p_slug:s||''})};
const adminOnly=()=>{if(!window.IS_ADMIN){location.hash='#/';return false}return true};
EXT.admin=async()=>{
 if(!adminOnly())return;
 const [s,v]=await Promise.all([sb.rpc('admin_stats'),sb.rpc('admin_vendors')]);
 if(s.error)return app.innerHTML='<p class=empty>'+E(s.error.message)+'</p>';
 const d=s.data,vs=v.data||[],k=(l,x,sub)=>`<div class=stat2><b>${x}</b><span>${l}</span>${sub?`<small>${sub}</small>`:''}</div>`;
 const est=d.starter*2000+d.pro*4500,vl={none:'Not verified',pending:'Verification pending',verified:'Verified',rejected:'Rejected'};
 app.innerHTML=`<h2>🛡️ Admin dashboard</h2><div class=chips><a class=chip href="#/adminpolicies">Policies</a><a class=chip href="#/adminflags">Flags (${d.open_flags})</a><a class=chip href="#/adminlog">Audit log</a></div><div class=stats>${k('Vendors',d.vendors,'+'+d.vendors_7d+' this week · +'+d.vendors_30d+' this month')}${k('Awaiting verification',d.pending_verification,d.verified+' verified')}${k('Active vendors (7 days)',d.active_7d,'got at least 1 order')}${k('Orders',d.orders,d.orders_7d+' this week · '+d.orders_30d+' this month')}${k('Order value',N(d.order_value),'all vendors, not cancelled')}${k('Products',d.products)}${k('Customers',d.customers)}${k('Landing visits',d.landing_7d,'7 days · '+d.landing_30d+' in 30 days')}${k('Shop page visits',d.shop_7d,'7 days · '+d.shop_30d+' in 30 days')}${k('Paying vendors',d.starter+d.pro,d.starter+' Starter · '+d.pro+' Pro')}${k('Plan value / month',N(est),'estimate from active plans')}${k('Paid to you (30 days)',N(d.income_30d),'plans, setup, SMS')}${k('Payment fees (30 days)',N(d.fees_30d),'from customer payments')}</div><h3>Vendors (${vs.length}) · ${d.suspended} suspended</h3>`+
 vs.map(x=>`<div class=card><b>${E(x.business_name)}</b>${x.suspended?' <span class="badge cancelled">suspended</span>':''}${x.open_flags>0?' <span class="badge">'+x.open_flags+' flag(s)</span>':''}<br><small>${E(x.email||'')}<br>Joined ${new Date(x.created_at).toLocaleDateString()} · ${x.orders} orders · ${x.products} products<br>Plan: ${x.plan}${x.plan_expires_at&&x.plan!=='free'?' until '+new Date(x.plan_expires_at).toLocaleDateString():''} · ${vl[x.verification]||''}${x.suspended&&x.suspend_reason?'<br>Reason: '+E(x.suspend_reason):''}</small><div class=chips><button class=chip data-v="${x.id}" data-s="verified">Verify</button><button class=chip data-v="${x.id}" data-s="rejected">Reject</button><button class=chip data-pro="${x.id}">Pro 30 days</button><button class=chip data-free="${x.id}">Free</button><button class=chip data-sus="${x.id}" data-on="${!x.suspended}">${x.suspended?'Unsuspend':'Suspend'}</button><button class=chip data-flag="${x.id}">Flag</button><a class=chip target=_blank rel=noopener href="${location.pathname}?v=${E(x.slug)}">View shop</a></div></div>`).join('');
 const act=(q,f,msg)=>app.querySelectorAll(q).forEach(b=>b.onclick=async()=>{if(msg&&!confirm(msg))return;const r=await f(b);if(r===null)return;if(r.error)return alert(r.error.message);toast('Done');EXT.admin()});
 act('[data-v]',b=>sb.rpc('admin_set_verification',{p_vendor:b.dataset.v,p_status:b.dataset.s}),'Change this vendor\'s verification status?');
 act('[data-pro]',b=>sb.rpc('admin_set_plan',{p_vendor:b.dataset.pro,p_plan:'pro',p_days:30}));
 act('[data-free]',b=>sb.rpc('admin_set_plan',{p_vendor:b.dataset.free,p_plan:'free',p_days:0}),'Move this vendor to the Free plan?');
 act('[data-sus]',b=>{const on=b.dataset.on==='true';let why=null;if(on){why=prompt('Reason for suspending this shop?');if(why===null)return null}return sb.rpc('admin_suspend',{p_vendor:b.dataset.sus,p_on:on,p_reason:why})});
 act('[data-flag]',b=>{const why=prompt('Why are you flagging this vendor?');if(!why)return null;return sb.rpc('admin_flag',{p_vendor:b.dataset.flag,p_reason:why})});
};
EXT.adminpolicies=async()=>{
 if(!adminOnly())return;
 const {data=[]}=await sb.from('policies').select('*').order('version',{ascending:false}),L={};data.forEach(x=>{if(!L[x.kind])L[x.kind]=x});
 app.innerHTML=`<p><a href="#/admin">← Admin</a></p><h2>Policies</h2><p><small>Publishing creates a new version. Every user must accept it the next time they open the app. Start a heading line with ##.</small></p><select id=pk>${['terms','privacy','guidelines'].map(k=>`<option value=${k}>${k}${L[k]?' (current version '+L[k].version+')':''}</option>`).join('')}</select><input id=pt placeholder="Title"><textarea id=pb rows=14></textarea><button class=btn id=pp>Publish new version</button>`;
 const fill=()=>{const c=L[$('pk').value];$('pt').value=c?c.title:'';$('pb').value=c?c.body:''};$('pk').onchange=fill;fill();
 $('pp').onclick=async()=>{if(!confirm('Publish a new version? All users must accept it.'))return;const r=await sb.rpc('admin_publish_policy',{p_kind:$('pk').value,p_title:$('pt').value,p_body:$('pb').value});if(r.error)return alert(r.error.message);toast('Published');EXT.adminpolicies()}};
EXT.adminflags=async()=>{
 if(!adminOnly())return;
 const {data=[],error}=await sb.rpc('admin_flags');
 app.innerHTML='<p><a href="#/admin">← Admin</a></p><h2>Open flags</h2>'+(error?'<p class=empty>'+E(error.message)+'</p>':data.map(f=>`<div class=card><b>${E(f.business_name)}</b><br>${E(f.reason)}<br><small>${new Date(f.created_at).toLocaleString()}</small><div class=chips><button class=chip data-r="${f.id}">Mark resolved</button></div></div>`).join('')||'<p class=empty>No open flags.</p>');
 app.querySelectorAll('[data-r]').forEach(b=>b.onclick=async()=>{const r=await sb.rpc('admin_resolve_flag',{p_id:b.dataset.r});if(r.error)return alert(r.error.message);EXT.adminflags()})};
EXT.adminlog=async()=>{
 if(!adminOnly())return;
 const {data=[],error}=await sb.rpc('admin_audit');
 app.innerHTML='<p><a href="#/admin">← Admin</a></p><h2>Audit log</h2><p><small>The last 100 admin actions.</small></p>'+(error?'<p class=empty>'+E(error.message)+'</p>':data.map(a=>`<div class=card><b>${E(a.action)}</b> · ${E(a.target||'')}<br><small>${E(a.detail||'')}<br>${new Date(a.logged_at).toLocaleString()} · ${E(a.admin_email||'')}</small></div>`).join('')||'<p class=empty>Nothing yet.</p>')};
