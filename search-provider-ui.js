(() => {
  'use strict';
  let installed=false;

  function enableAmazon(){
    if(!retailSources.includes('Amazon'))retailSources.push('Amazon');
    if(!sourceOrder.includes('Amazon')){
      const xIndex=sourceOrder.indexOf('X');
      if(xIndex>=0)sourceOrder.splice(xIndex,0,'Amazon');else sourceOrder.push('Amazon');
    }
    hydrateFilters();
    const amazon=document.querySelector('.source-check[value="Amazon"]');
    if(amazon)amazon.checked=true;
  }

  function install(){
    if(installed)return;
    if(typeof refreshLive!=='function'||typeof hydrateFilters!=='function'||typeof sourceSearchUrl!=='function'||typeof sourceMode!=='function'||typeof renderProviderNotice!=='function'||typeof retailSources==='undefined'||typeof sourceOrder==='undefined'||typeof state==='undefined'){
      setTimeout(install,40);return;
    }
    installed=true;

    const baseSearchUrl=sourceSearchUrl;
    sourceSearchUrl=function(source,q){
      if(source==='Amazon')return`https://www.amazon.co.jp/s?k=${encodeURIComponent(q||'推し活 グッズ')}`;
      return baseSearchUrl(source,q);
    };
    const baseSourceMode=sourceMode;
    sourceMode=function(source){return source==='Amazon'?'公式API':baseSourceMode(source)};

    const baseRefreshLive=refreshLive;
    refreshLive=async function(q,seq){
      if(!q)return;
      window.__oshiruLivePhase='fast';
      await baseRefreshLive(q,seq);
      if(seq!==state.searchSeq)return;
      window.__oshiruLivePhase='discovery';
      try{await baseRefreshLive(q,seq)}finally{window.__oshiruLivePhase='all'}
    };

    const baseRenderProviderNotice=renderProviderNotice;
    renderProviderNotice=function(loading=false){
      baseRenderProviderNotice(loading);
      const p=state.providers||{},row=document.querySelector('#providerNotice .provider-row');
      if(row&&p.amazon&&!row.querySelector('[data-provider-amazon]')){
        const pill=document.createElement('span');pill.className=`provider-pill ${p.amazon.ok?'ok':'bad'}`;pill.dataset.providerAmazon='1';pill.textContent=`Amazon: ${Number(p.amazon.count||0)}件`;row.append(pill);
      }
    };

    fetch('/api/status',{headers:{accept:'application/json'}}).then(r=>r.ok?r.json():null).then(s=>{if(s?.amazon)enableAmazon()}).catch(()=>{});
  }

  install();
})();
