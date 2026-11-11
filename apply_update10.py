import os,re
for f in ('app.js','features.js','index.html','theme.css','theme.js'):
    if not os.path.exists(f): raise SystemExit('Missing '+f+'. Run this in the main folder.')
f_=open('features.js').read();h=open('index.html').read()
if 'FLY=' in f_ and 'theme.css' in h: raise SystemExit('Already updated')
did=0
if 'theme.css' not in h:
    a='<link rel="stylesheet" href="styles.css">';assert a in h
    h=h.replace(a,a+'<link rel="stylesheet" href="theme.css"><script>try{document.documentElement.dataset.theme=localStorage.getItem("theme")||"night"}catch(e){document.documentElement.dataset.theme="night"}</script>',1)
    a='<script src="app.js"></script>';assert a in h
    h=h.replace(a,a+'<script src="theme.js"></script>',1);did+=1
if 'FLY=' not in f_:
    new=r"""const FLY={emerald:{bg:['#0B3D2E','#04140F'],glow:'#1F9E6A',acc:'#FFC94A',tx:'#FFFFFF',sub:'#BFEBD6',btn:'#FFC94A',btnTx:'#2B2100'},sunset:{bg:['#FF6B57','#7A1F5C'],glow:'#FFB36B',acc:'#FFE082',tx:'#FFFFFF',sub:'#FFE3D6',btn:'#FFFFFF',btnTx:'#7A1F5C'},royal:{bg:['#1B2A6B','#0A0F2C'],glow:'#4F6BFF',acc:'#F5C451',tx:'#FFFFFF',sub:'#C9D3FF',btn:'#F5C451',btnTx:'#1B1B3A'}};
const loadImg=u=>new Promise(r=>{if(!u)return r(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
EXT.flyer=p=>{if(!isPro())return needPro('The flyer maker');
 const o=document.createElement('div');o.className='vmodal';
 o.innerHTML='<div class="vbox pick"><h3>Choose a flyer style</h3>'+Object.keys(FLY).map(k=>`<button class=sty data-k=${k} style="background:linear-gradient(135deg,${FLY[k].bg[0]},${FLY[k].bg[1]});color:${FLY[k].acc}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')+'<button class=vx>✕</button></div>';
 o.onclick=e=>{const k=e.target.dataset&&e.target.dataset.k;if(k){o.remove();EXT.flyerDraw(p,k)}else if(e.target===o||e.target.className==='vx')o.remove()};document.body.append(o)};
EXT.flyerDraw=async(p,k)=>{const S=FLY[k],c=document.createElement('canvas');c.width=1080;c.height=1920;const g=c.getContext('2d');
 const [img,logo]=await Promise.all([loadImg(p.image_url),loadImg(V.logo_url)]);
 const gr=g.createLinearGradient(0,0,0,1920);gr.addColorStop(0,S.bg[0]);gr.addColorStop(1,S.bg[1]);g.fillStyle=gr;g.fillRect(0,0,1080,1920);
 const glow=(x,y,r,a)=>{const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,S.glow+a);q.addColorStop(1,S.glow+'00');g.fillStyle=q;g.fillRect(0,0,1080,1920)};
 glow(960,220,720,'99');glow(60,1560,820,'66');
 g.textAlign='left';
 g.save();g.beginPath();g.arc(140,140,64,0,7);g.clip();
 if(logo){g.drawImage(logo,76,76,128,128)}else{g.fillStyle=S.acc;g.fillRect(76,76,128,128);g.fillStyle=S.bg[1];g.font='bold 72px sans-serif';g.textAlign='center';g.fillText((V.business_name||'S')[0].toUpperCase(),140,168)}
 g.restore();g.textAlign='left';g.fillStyle=S.tx;g.font='bold 54px sans-serif';g.fillText((V.business_name||'').slice(0,24),230,138);
 if(V.verification==='verified'){g.fillStyle=S.acc;g.font='34px sans-serif';g.fillText('✓ Verified seller',230,188)}
 g.fillStyle=S.acc;g.beginPath();g.roundRect(90,270,300,70,35);g.fill();g.fillStyle=S.btnTx;g.font='bold 34px sans-serif';g.textAlign='center';g.fillText('ORDER NOW',240,317);g.textAlign='left';
 g.save();g.shadowColor='#000b';g.shadowBlur=60;g.shadowOffsetY=30;g.fillStyle=S.acc;g.beginPath();g.roundRect(78,368,924,924,64);g.fill();g.restore();
 g.save();g.beginPath();g.roundRect(90,380,900,900,54);g.clip();
 if(img){const kk=Math.max(900/img.width,900/img.height),w=img.width*kk,h=img.height*kk;g.drawImage(img,90+(900-w)/2,380+(900-h)/2,w,h)}else{g.fillStyle=S.glow;g.fillRect(90,380,900,900);g.fillStyle=S.tx;g.font='bold 380px sans-serif';g.textAlign='center';g.fillText(p.name[0].toUpperCase(),540,900)}
 g.restore();g.textAlign='left';
 let fs=78;g.font='bold '+fs+'px sans-serif';const ps=N(p.price);while(g.measureText(ps).width>470&&fs>40){fs-=4;g.font='bold '+fs+'px sans-serif'}
 g.save();g.shadowColor='#0008';g.shadowBlur=30;g.shadowOffsetY=12;g.fillStyle=S.acc;g.beginPath();g.roundRect(90,1220,560,128,64);g.fill();g.restore();
 g.fillStyle=S.btnTx;g.font='bold '+fs+'px sans-serif';g.fillText(ps,130,1220+64+fs*0.35);
 g.fillStyle=S.tx;g.font='bold 78px sans-serif';let y=wrapT(g,p.name,90,1448,900,90);
 if(p.description){g.fillStyle=S.sub;g.font='40px sans-serif';wrapT(g,String(p.description).slice(0,90),90,y,900,52)}
 g.fillStyle=S.btn;g.beginPath();g.roundRect(90,1650,900,136,68);g.fill();
 g.fillStyle=S.btnTx;g.textAlign='center';g.font='bold 54px sans-serif';g.fillText('Order on WhatsApp',540,1712);g.font='40px sans-serif';g.fillText('+'+V.whatsapp_number,540,1762);
 g.fillStyle=S.sub;g.font='30px sans-serif';g.fillText(shopLink().replace('https://','').slice(0,60),540,1850);
 share(c,'flyer-'+p.name.replace(/\W+/g,'-')+'.png',p.name+' - '+N(p.price)+'. Order: '+shopLink())};
"""
    f_,n=re.subn(r"EXT\.flyer=p=>\{.*?\n(?=// 3\. Products)",lambda m:new,f_,count=1,flags=re.S);assert n==1,'flyer block not found';did+=1
open('features.js','w').write(f_);open('index.html','w').write(h)
print('Done:',did,'changes')
