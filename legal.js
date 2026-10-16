// Policies, consent, and vendor verification. Loaded before app.js.
window.EXT=window.EXT||{};
const polHtml=b=>String(b).split(/\n\s*\n/).map(x=>{const L=x.split('\n');let h='';if(L[0].startsWith('## ')){h='<h3>'+E(L.shift().slice(3))+'</h3>'}return h+(L.length?'<p>'+L.map(l=>E(l)).join('<br>')+'</p>':'')}).join('');
async function needsConsent(){
 if(window.CONSENT_OK)return false;
 const [p,c]=await Promise.all([sb.from('policies').select('kind,version'),sb.from('consents').select('kind,version')]);
 if(!p.data||!p.data.length){window.CONSENT_OK=true;return false}
 const have=new Set((c.data||[]).map(x=>x.kind+':'+x.version)),latest={};
 p.data.forEach(x=>{if(!latest[x.kind]||x.version>latest[x.kind])latest[x.kind]=x.version});
 const need=Object.keys(latest).some(k=>!have.has(k+':'+latest[k]));
 if(!need)window.CONSENT_OK=true;return need}
EXT.policy=async kind=>{
 const {data}=await sb.from('policies').select('*').eq('kind',kind).order('version',{ascending:false}).limit(1),p=data&&data[0];
 app.innerHTML='<p><a href="#/">← Back</a></p>'+(p?`<h1>${E(p.title)}</h1><small>Version ${p.version} · ${new Date(p.published_at).toLocaleDateString()}</small>${polHtml(p.body)}`:'<p class=empty>Not available yet.</p>')};
EXT.consent=async()=>{
 nav.innerHTML='';const {data=[]}=await sb.from('policies').select('*').order('version',{ascending:false}),L={};data.forEach(x=>{if(!L[x.kind])L[x.kind]=x});
 app.innerHTML='<h2>Please review our terms</h2><p>Our terms or policies were updated. Read them and accept to continue.</p>'+Object.values(L).map(p=>`<details class=card><summary><b>${E(p.title)}</b> (version ${p.version})</summary>${polHtml(p.body)}</details>`).join('')+'<label class=chk><input type=checkbox id=ag> I agree to the Terms of Service, Privacy Policy and Community Guidelines, and I understand that fraud or illegal activity may be reported to law enforcement authorities.</label><button class=btn id=ok>I agree and continue</button><button class="btn alt" id=lo2>Log out</button>';
 $('ok').onclick=async()=>{if(!$('ag').checked)return toast('Please tick the box to continue');const r=await sb.rpc('accept_policies');if(r.error)return alert(r.error.message);window.CONSENT_OK=true;route()};
 $('lo2').onclick=async()=>{await sb.auth.signOut();V=null;window.CONSENT_OK=false;route()}};
const verifyCard=()=>{const s=V.verification||'none',t={none:['Not verified','Verify your business so customers can trust you. Your bank details are shown to customers only after you are verified.'],pending:['Review in progress','We will contact you on WhatsApp to check your details.'],verified:['Verified ✓','Customers see a Verified badge and your bank transfer details.'],rejected:['Not approved','Please contact support to try again.']}[s]||['',''];
 return `<div class=card><b>Verification: ${t[0]}</b><p><small>${t[1]}</small></p>${s==='none'||s==='rejected'?'<button class=btn id=vr>Request verification</button>':''}</div>`};
document.addEventListener('click',async e=>{if(e.target&&e.target.id==='vr'){const r=await sb.rpc('request_verification');if(r.error)return alert(r.error.message);V=null;toast('Request sent. We will contact you.');route()}});
