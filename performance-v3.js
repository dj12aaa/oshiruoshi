(() => {
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  const liveCache=new Map();
  const TTL=22000;

  function absolute(input){
    try{return new URL(typeof input==='string'?input:input.url,location.href)}catch{return null}
  }
  function liveKey(url){return `${url.pathname}?q=${url.searchParams.get('q')||''}`}
  async function snapshotResponse(response){
    const body=await response.arrayBuffer();
    const headers=[...response.headers.entries()];
    return{body,status:response.status,statusText:response.statusText,headers,ok:response.ok};
  }
  function restore(s){return new Response(s.body.slice(0),{status:s.status,statusText:s.statusText,headers:s.headers})}
  function warmLive(q){
    if(!q)return;
    const u=new URL('/api/live-search',location.href);u.searchParams.set('q',q);
    const key=liveKey(u);const old=liveCache.get(key);
    if(old&&Date.now()-old.at<TTL)return;
    const entry={at:Date.now(),promise:null};
    entry.promise=nativeFetch(u.href,{headers:{accept:'application/json'}}).then(snapshotResponse).then(s=>{if(!s.ok)liveCache.delete(key);return s}).catch(e=>{liveCache.delete(key);throw e});
    liveCache.set(key,entry);
  }
  window.fetch=(input,init={})=>{
    const u=absolute(input);
    const method=String(init?.method||((typeof input!=='string'&&input?.method)||'GET')).toUpperCase();
    if(!u||u.origin!==location.origin||method!=='GET')return nativeFetch(input,init);
    if(u.pathname==='/api/search'){
      const q=u.searchParams.get('q')||'';
      warmLive(q);
      return nativeFetch(input,init);
    }
    if(u.pathname==='/api/live-search'){
      const key=liveKey(u);const hit=liveCache.get(key);
      if(hit&&Date.now()-hit.at<TTL)return hit.promise.then(restore);
      const entry={at:Date.now(),promise:null};
      entry.promise=nativeFetch(input,init).then(snapshotResponse).then(s=>{if(!s.ok)liveCache.delete(key);return s}).catch(e=>{liveCache.delete(key);throw e});
      liveCache.set(key,entry);
      return entry.promise.then(restore);
    }
    return nativeFetch(input,init);
  };

  // Keep repeat searches instant without keeping stale marketplace data for long.
  window.addEventListener('pageshow',()=>{
    for(const [k,v] of liveCache)if(Date.now()-v.at>TTL)liveCache.delete(k);
  });
})();
