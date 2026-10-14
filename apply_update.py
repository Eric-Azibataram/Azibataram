import os
for f in ('app.js','index.html','styles.css','features.js'):
    if not os.path.exists(f): raise SystemExit('Missing '+f+'. Run this in the main folder.')
s=open('app.js').read();h=open('index.html').read();c=open('styles.css').read();n=0
if 'features.js' not in h:
    h=h.replace('<script src="app.js"></script>','<script src="features.js"></script><script src="app.js"></script>',1);n+=1
a="({'':orders,products,new:newOrder,o:()=>detail(b),customers,today,tools,billing}[a]||orders)();"
if a in s:
    s=s.replace(a,"((window.EXT||{})[a]||{'':orders,products,new:newOrder,o:()=>detail(b),customers,today,tools,billing}[a]||orders)(b);",1);n+=1
a="rel=noopener>Reply on WhatsApp</a>"
if a in s and 'id=rc' not in s:
    s=s.replace(a,a+'<button class="btn alt" id=rc>Send receipt / invoice</button><a class="btn alt" href="#/delivery/${id}">Delivery & waybill</a>',1)
    s=s.replace("$('pb').onclick=","$('rc').onclick=()=>EXT.receipt(o);$('pb').onclick=",1);n+=1
a="if(r.error)return toast('Sorry, this shop cannot take orders right now.');[txt,tot]"
if a in s:
    s=s.replace(a,"if(r.error)return toast(/stock/i.test(r.error.message)?r.error.message:'Sorry, this shop cannot take orders right now.');[txt,tot]",1);n+=1
if 'textarea{' not in c:
    c+="textarea{width:100%;padding:12px;border:1px solid var(--l);border-radius:12px;font:inherit;background:var(--bg);color:var(--t)}\n";n+=1
open('app.js','w').write(s);open('index.html','w').write(h);open('styles.css','w').write(c)
print('Done:',n,'changes')
