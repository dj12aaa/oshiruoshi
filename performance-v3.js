(() => {
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  const liveCache=new Map();
  const TTL=22000;
  const PRECISION_ENDPOINT='/api/live-search-v8';

  function absolute(input){
    try{return new URL(typeof input==='string'?input:input.url,location.href)}catch{return null}
  }
  function liveKeyFromQuery(q=''){return `/api/live-search?q=${String(q||'').trim()}`}
  async function snapshotResponse(response){
    const body=await response.arrayBuffer();
    const headers=[...response.headers.entries()];
    return{body,status:response.status,statusText:response.statusText,headers,ok:response.ok};
  }
  function restore(s){return new Response(s.body.slice(0),{status:s.status,statusText:s.statusText,headers:s.headers})}
  function idleResponse(){
    return new Response(JSON.stringify({query:'',items:[],providers:{},idle:true}),{
      status:200,
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-oshiru-idle':'1'}
    });
  }
  function precisionUrl(q){const u=new URL(PRECISION_ENDPOINT,location.href);u.searchParams.set('q',q);return u}
  function initialUrl(q){const u=new URL('/api/search',location.href);u.searchParams.set('q',q);u.searchParams.set('initial','1');return u}

  const idleUi={active:false,hint:null};
  function ensureIdleUi(){
    if(document.getElementById('oshiruIdleStyle'))return;
    const style=document.createElement('style');style.id='oshiruIdleStyle';
    style.textContent=`
      body.search-idle #results{display:none!important}
      .search-idle-hint{display:none;max-width:1384px;margin:0 auto 26px;padding:0 28px}
      body.search-idle .search-idle-hint{display:block}
      .search-idle-hint-inner{background:#fff;border:1px solid #d8dee7;border-radius:16px;padding:18px 20px;box-shadow:0 10px 28px rgba(30,33,40,.05)}
      .search-idle-hint strong{display:block;color:#111827;font-size:16px;font-weight:850;line-height:1.45}
      .search-idle-hint span{display:block;margin-top:5px;color:#64748b;font-size:13px;font-weight:600;line-height:1.65}
      @media(max-width:900px){.search-idle-hint{margin:0 auto 18px;padding:0 20px}.search-idle-hint-inner{padding:15px 16px;border-radius:14px}.search-idle-hint strong{font-size:15px}.search-idle-hint span{font-size:12.5px}}
    `;
    document.head.append(style);
    const hero=document.querySelector('.search-hero');
    if(hero&&!document.getElementById('searchIdleHint')){
      const hint=document.createElement('section');hint.id='searchIdleHint';hint.className='search-idle-hint';hint.setAttribute('aria-live','polite');
      hint.innerHTML='<div class="search-idle-hint-inner"><strong>検索語を入力すると商品を表示します</strong><span>キャラ・作品・グッズ名を入力して横断検索してください。検索前は商品データを読み込まないため、軽い状態で待機します。</span></div>';
      hero.insertAdjacentElement('afterend',hint);idleUi.hint=hint;
    }
  }
  function enterIdle(){
    ensureIdleUi();idleUi.active=true;document.body.classList.add('search-idle');
    const grid=document.getElementById('productGrid');if(grid)grid.innerHTML='';
    const stats=document.getElementById('stats');if(stats)stats.innerHTML='';
    const empty=document.getElementById('emptyState');if(empty)empty.classList.add('hidden');
    const notice=document.getElementById('providerNotice');if(notice)notice.classList.add('hidden');
    const badge=document.getElementById('queryBadge');if(badge)badge.textContent='';
  }
  function leaveIdle(){if(!idleUi.active&&!document.body.classList.contains('search-idle'))return;idleUi.active=false;document.body.classList.remove('search-idle')}

  function precisionResponse(q,init={}){
    const key=liveKeyFromQuery(q),hit=liveCache.get(key);
    if(hit&&Date.now()-hit.at<TTL)return hit.promise.then(restore);
    const target=precisionUrl(q),entry={at:Date.now(),promise:null};
    entry.promise=nativeFetch(target.href,{...init,headers:{accept:'application/json',...(init?.headers||{})}}).then(snapshotResponse).then(s=>{if(!s.ok)liveCache.delete(key);return s}).catch(e=>{liveCache.delete(key);throw e});
    liveCache.set(key,entry);return entry.promise.then(restore);
  }

  window.fetch=(input,init={})=>{
    const u=absolute(input),method=String(init?.method||((typeof input!=='string'&&input?.method)||'GET')).toUpperCase();
    if(!u||u.origin!==location.origin||method!=='GET')return nativeFetch(input,init);
    if(u.pathname==='/api/search'){
      const q=(u.searchParams.get('q')||'').trim();if(!q){enterIdle();return Promise.resolve(idleResponse())}
      leaveIdle();return nativeFetch(initialUrl(q).href,init);
    }
    if(u.pathname==='/api/live-search'){
      const q=(u.searchParams.get('q')||'').trim();if(!q)return Promise.resolve(idleResponse());
      leaveIdle();return precisionResponse(q,init);
    }
    return nativeFetch(input,init);
  };

  ensureIdleUi();const q=document.getElementById('q');if(!q||!q.value.trim())enterIdle();
  window.addEventListener('pageshow',()=>{for(const [k,v] of liveCache)if(Date.now()-v.at>TTL)liveCache.delete(k);const input=document.getElementById('q');if(input&&!input.value.trim())enterIdle()});
})();
