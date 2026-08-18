(() => {
  'use strict';
  const frame=document.getElementById('rakutenAffiliateFrame');
  const input=document.getElementById('q');
  if(!frame||!input)return;
  let last='';
  let timer;
  function refresh(){
    const q=input.value.trim().replace(/\s+/g,' ').slice(0,80);
    if(q===last)return;
    last=q;
    const url=new URL('/rakuten-widget.html',location.origin);
    if(q)url.searchParams.set('q',q);
    frame.src=url.pathname+url.search;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,650)}
  document.getElementById('searchBtn')?.addEventListener('click',schedule);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')schedule()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-query],[data-suggest],[data-history-query]'))schedule()});
})();
