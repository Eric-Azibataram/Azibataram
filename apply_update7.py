import os
for f in ('app.js','index.html','styles.css','admin.js'):
    if not os.path.exists(f): raise SystemExit('Missing '+f+'. Run this in the main folder.')
s=open('app.js').read();h=open('index.html').read();c=open('styles.css').read()
if 'IS_ADMIN' in s: raise SystemExit('Already updated')
def rep(a,b):
    global s
    assert a in s,'Not found: '+a[:60]
    s=s.replace(a,b,1)
rep("nav.innerHTML=[[","if(window.IS_ADMIN===undefined)window.IS_ADMIN=!!(await sb.rpc('is_admin')).data;\n nav.innerHTML=[[")
rep("<h3>Account</h3>","${window.IS_ADMIN?'<a class=btn href=\"#/admin\">🛡️ Admin dashboard</a>':''}<h3>Account</h3>")
rep("function landing(){","function landing(){trk('landing','');")
rep("async function pub(slug){","async function pub(slug){trk('shop',slug);")
open('app.js','w').write(s)
if 'admin.js' not in h:
    assert '<script src="app.js"></script>' in h
    h=h.replace('<script src="app.js"></script>','<script src="admin.js"></script><script src="app.js"></script>',1)
open('index.html','w').write(h)
c+=".stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.stat2{background:#fff;border-radius:14px;padding:12px;box-shadow:0 2px 8px #0000000f;color:#1b1f1d}.stat2 b{display:block;font-size:22px;color:var(--g)}.stat2 span{font-size:13px}.stat2 small{display:block;color:#6b7570;font-size:11px;margin-top:2px}\n"
open('styles.css','w').write(c)
if os.path.exists('privacy.html'):
    p=open('privacy.html').read()
    if 'count visits' not in p and '</body>' in p:
        p=p.replace('</body>','<p>We count visits to our pages (a simple total per day) to understand how the service is used. We do not store your IP address or use tracking cookies for this.</p></body>',1)
        open('privacy.html','w').write(p)
print('Done')
