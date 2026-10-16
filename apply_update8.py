import os
for f in ('app.js','index.html','styles.css','admin.js','legal.js'):
    if not os.path.exists(f): raise SystemExit('Missing '+f+'. Run this in the main folder.')
s=open('app.js').read();h=open('index.html').read();c=open('styles.css').read()
if 'needsConsent' in s: raise SystemExit('Already updated')
def rep(a,b):
    global s
    assert a in s,'Not found: '+a[:70]
    s=s.replace(a,b,1)
# 1. sign-up: warning banner, agreement checkbox, remember consent
rep("<p>${up?'Free to start.':'Welcome back.'}</p>","<p>${up?'Free to start.':'Welcome back.'}</p>${up?'<div class=warn>⚠️ Identity checks are enforced to protect everyone from fraud. Fake or fraudulent accounts will be suspended.</div>':''}")
rep('placeholder="Password (min 6)"><button class=btn id=go>','placeholder="Password (min 6)">${up?\'<label class=chk><input type=checkbox id=ag> I agree to the <a href="#/policy/terms">Terms of Service</a> and <a href="#/policy/privacy">Privacy Policy</a>, and I understand that fraud or illegal activity may be reported to law enforcement authorities.</label>\':\'\'}<button class=btn id=go>')
rep("$('go').onclick=async()=>{","$('go').onclick=async()=>{if(up&&!$('ag').checked)return toast('Please tick the box to agree to the Terms and Privacy Policy');")
rep("if(up&&!r.data.session)return toast(","if(up)localStorage.setItem('agreed','1');if(up&&!r.data.session)return toast(")
# 2. public policy pages, consent check on login
rep("const sv=new URLSearchParams(location.search).get('v');","if(a==='policy'){nav.innerHTML='';return EXT.policy(b)}\n const sv=new URLSearchParams(location.search).get('v');")
rep("if(window.IS_ADMIN===undefined)","if(localStorage.getItem('agreed')){await sb.rpc('accept_policies');localStorage.removeItem('agreed')}\n if(await needsConsent())return EXT.consent();\n if(window.IS_ADMIN===undefined)")
# 3. footer links, verified badge, verification card
rep('<a href="privacy.html">Privacy policy</a> · <a href="#/login">Log in</a>','<a href="#/policy/terms">Terms</a> · <a href="#/policy/privacy">Privacy</a> · <a href="#/policy/guidelines">Guidelines</a> · <a href="#/login">Log in</a>')
rep("<h1>${E(v.business_name)}</h1><p>${pr.length","<h1>${E(v.business_name)}${v.verified?' <span class=vbadge>✓ Verified</span>':''}</h1><p>${pr.length")
rep("${payForm()}<h3>Group code</h3>","${verifyCard()}${payForm()}<h3>Group code</h3>")
open('app.js','w').write(s)
if 'legal.js' not in h:
    a='<script src="admin.js"></script>'
    assert a in h,'index.html is missing admin.js (apply update 7 first)'
    h=h.replace(a,'<script src="legal.js"></script>'+a,1)
open('index.html','w').write(h)
c+=".warn{background:#fff4d6;color:#5b4300;border-radius:12px;padding:10px 12px;margin:8px 0;font-size:14px}.chk{display:block;margin:10px 0;font-size:14px;line-height:1.4;color:var(--t)}.chk input{width:auto;margin-right:6px}.vbadge{font-size:12px;background:#ffd54f;color:#3b2f00;border-radius:99px;padding:2px 8px;vertical-align:middle}\ndetails.card summary{cursor:pointer}\n"
open('styles.css','w').write(c)
print('Done')
