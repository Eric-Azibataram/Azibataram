// Header bar with the shop name, plan badge and a night/day switch.
(function(){
 const top=document.createElement('header');top.id='top';top.hidden=true;
 top.innerHTML='<img src="icons/icon-192.png" alt=""><div><b>Shopa Orders</b><small id=tb></small></div><span id=tp class=pill></span><button id=tt aria-label="Switch theme">🌓</button>';
 document.body.prepend(top);
 const th=()=>document.documentElement.dataset.theme||'night';
 document.getElementById('tt').onclick=()=>{const n=th()==='night'?'day':'night';document.documentElement.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}};
 const sync=()=>{const on=nav.innerHTML.trim()!=='';top.hidden=!on;
  if(on&&typeof V!=='undefined'&&V){document.getElementById('tb').textContent=V.business_name||'';const p=plan(V),t=document.getElementById('tp');t.textContent=p;t.className='pill '+p}};
 new MutationObserver(sync).observe(nav,{childList:true});sync();
})();
