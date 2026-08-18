(() => {
  'use strict';

  const style=document.createElement('style');
  style.id='oshiru-polish-v5';
  style.textContent=`
    :root{--oshiru-ink:#090d14;--oshiru-sub:#556071;--oshiru-line:rgba(15,23,42,.105);--oshiru-soft:#f6f7f9;--oshiru-red:#d91f48}
    body{font-size:16px;line-height:1.6;text-rendering:optimizeLegibility}
    .search-box{gap:8px!important;padding-right:8px!important}
    .search-box input{font-size:clamp(15px,1.1vw,17px)!important;line-height:1.45}
    .clear-q{width:auto!important;min-width:42px!important;height:38px!important;display:inline-flex!important;align-items:center;justify-content:center;gap:5px;padding:0 9px!important;border-radius:9px!important;color:#536071!important;font-size:12px!important;font-weight:800!important;white-space:nowrap}
    .clear-q:hover{background:#f1f3f6!important;color:#111827!important}
    .clear-q .clear-icon{font-size:18px;line-height:1;font-weight:500}
    .clear-q .clear-label{font-size:11px;letter-spacing:.01em}

    .product-card{container-type:inline-size;overflow:hidden!important}
    .product-title{font-size:clamp(16px,1.15vw,19px)!important;line-height:1.55!important;font-weight:850!important;letter-spacing:-.022em!important;overflow-wrap:anywhere}
    .meta-line{font-size:12px!important;line-height:1.55!important;color:var(--oshiru-sub)!important}
    .main-price{font-size:clamp(27px,2vw,36px)!important;line-height:1.1!important}
    .ship{font-size:12px!important;line-height:1.55!important}
    .source-pill{max-width:calc(100% - 62px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex!important;align-items:center;gap:6px}
    .heart{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;min-width:40px;border-radius:50%!important;font-size:19px!important;line-height:1!important;padding:0!important;z-index:3}
    .heart.on{background:#fff1f4!important;color:var(--oshiru-red)!important;border-color:rgba(217,31,72,.16)!important}

    .card-actions{display:grid!important;grid-template-columns:minmax(138px,.82fr) minmax(150px,1.18fr)!important;gap:9px!important;margin-top:12px!important;align-items:stretch}
    .card-actions [data-compare]{min-height:46px!important;border:1px solid #cfd7e1!important;background:#fff!important;color:#172033!important;border-radius:12px!important;padding:9px 12px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:12.5px!important;font-weight:900!important;line-height:1.2!important;white-space:nowrap;transition:.16s}
    .card-actions [data-compare]:hover{border-color:#9ba8b8!important;background:#f8fafc!important}
    .card-actions [data-compare].is-selected{background:#fff0f3!important;border-color:rgba(217,31,72,.3)!important;color:#a81637!important;box-shadow:inset 0 0 0 1px rgba(217,31,72,.06)}
    .card-actions .compare-action-icon{font-size:16px;line-height:1}
    .card-actions a{min-height:46px!important;border-radius:12px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:10px 14px!important;font-size:13px!important;line-height:1.25!important}
    @container (max-width:370px){.card-actions{grid-template-columns:1fr!important}.card-actions [data-compare],.card-actions a{width:100%!important}}

    .compare-tray{gap:14px!important;padding:12px 14px!important;overflow:visible!important}
    .compare-tray>div{min-width:0!important;display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap}
    .compare-tray>div:first-child{flex:1 1 auto}
    .compare-tray>div:last-child{flex:0 0 auto}
    .compare-tray b{display:flex!important;align-items:center!important;gap:4px!important;min-width:0;font-size:13.5px!important;white-space:nowrap}
    #compareCount{display:inline-grid!important;place-items:center!important;min-width:24px!important;height:24px!important;padding:0 7px!important;border-radius:999px!important;background:#fff!important;color:#17181c!important;font-size:12px!important;line-height:1!important;flex:none}
    .compare-tray small{white-space:nowrap}
    .compare-tray button{white-space:nowrap;min-height:36px;padding:8px 11px!important}

    .favorite-view-head{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:start!important;gap:18px!important;padding-right:44px!important}
    .favorite-view-head>div:first-child{min-width:0}
    .favorite-view-head h2{font-size:clamp(25px,3vw,32px)!important;line-height:1.15!important}
    .favorite-view-head p{font-size:13px!important;max-width:560px}
    .favorite-total{display:flex!important;align-items:center!important;gap:5px!important;align-self:start;padding:8px 11px;border-radius:13px;background:#f5f6f8;border:1px solid #e3e7ec;white-space:nowrap}
    .favorite-total b{font-size:26px!important;line-height:1!important}
    .favorite-total span{font-size:11px!important;margin:0!important}
    .favorite-item{min-width:0!important;box-shadow:0 7px 24px rgba(15,23,42,.035)}
    .favorite-info h3{overflow-wrap:anywhere}
    .favorite-price-row{min-width:0}
    .favorite-price-row span{overflow-wrap:anywhere}
    .favorite-actions a,.favorite-actions button{min-height:40px;display:flex;align-items:center;justify-content:center;line-height:1.35}

    .dock-item{min-width:0}
    .dock-item>span{min-width:0}
    .dock-count{position:static!important;flex:none!important;inset:auto!important;margin-left:2px!important;transform:none!important}

    .affiliate-widget-card{overflow:hidden}
    .rakuten-pict-ad-shell{margin:0 0 14px;padding:12px;border:1px solid rgba(15,23,42,.09);border-radius:16px;background:#fff;box-shadow:0 8px 28px rgba(15,23,42,.045)}
    .rakuten-pict-ad-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
    .rakuten-pict-ad-head b{font-size:10px;letter-spacing:.08em;background:#fff0f3;color:#b31739;border-radius:999px;padding:5px 7px}
    .rakuten-pict-ad-head span{font-size:11px;color:#64748b;font-weight:800}
    .rakuten-pict-ad{display:grid;place-items:center;width:100%;min-height:80px;border-radius:12px;overflow:hidden;background:#f7f8fa;text-decoration:none}
    .rakuten-pict-ad img{display:block;max-width:100%;height:auto!important;margin:0!important;border:0!important;object-fit:contain}
    .rakuten-pict-fallback{display:none;padding:16px;text-align:center;font-size:12px;font-weight:850;color:#1f2937}
    .rakuten-pict-ad.is-fallback img{display:none}.rakuten-pict-ad.is-fallback .rakuten-pict-fallback{display:block}

    @media(max-width:900px){
      .product-title{font-size:17px!important}.main-price{font-size:29px!important}
      .favorite-view-head{grid-template-columns:1fr auto!important;gap:12px!important;padding-right:34px!important}
      .compare-tray{width:calc(100% - 18px)!important;padding:10px 11px!important}
      .compare-tray>div:last-child{gap:6px!important}.compare-tray button{font-size:11px!important;padding:7px 9px!important}
    }
    @media(max-width:640px){
      .workspace{padding-left:10px!important;padding-right:10px!important}
      .product-grid{grid-template-columns:1fr!important;gap:16px!important}
      .product-card{border-radius:22px!important}
      .visual{aspect-ratio:1.08/1!important}
      .market-img{padding:12px!important}
      .card-body{padding:16px!important}
      .product-title{font-size:17px!important;line-height:1.5!important;-webkit-line-clamp:3!important}
      .main-price{font-size:30px!important}
      .card-actions{grid-template-columns:minmax(128px,.88fr) minmax(150px,1.12fr)!important}
      .favorite-view-head{grid-template-columns:1fr!important;padding-right:34px!important}.favorite-total{justify-self:start}
      .favorite-grid{grid-template-columns:1fr!important}
      .favorite-item{grid-template-columns:104px minmax(0,1fr)!important}
      .compare-tray{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important}
      .compare-tray small{display:none}
      .clear-q .clear-label{display:none}.clear-q{min-width:38px!important;padding:0 7px!important}
      .rakuten-pict-ad-shell{padding:9px;border-radius:14px}.rakuten-pict-ad{min-height:54px}
    }
    @media(max-width:400px){
      .card-actions{grid-template-columns:1fr!important}
      .favorite-item{grid-template-columns:1fr!important}.favorite-media{min-height:200px!important}
      .compare-tray{grid-template-columns:1fr!important;gap:8px!important}.compare-tray>div:last-child{justify-content:stretch}.compare-tray button{flex:1}
    }
    @media(prefers-reduced-motion:reduce){.card-actions [data-compare]{transition:none!important}}
  `;
  document.head.appendChild(style);

  const frame=document.getElementById('rakutenAffiliateFrame');
  const input=document.getElementById('q');
  let last='';
  let timer;
  function refreshAffiliateFrame(){
    if(!frame||!input)return;
    const q=input.value.trim().replace(/\s+/g,' ').slice(0,80);
    if(q===last)return;
    last=q;
    const url=new URL('/rakuten-widget.html',location.origin);
    if(q)url.searchParams.set('q',q);
    frame.src=url.pathname+url.search;
  }
  function scheduleAffiliate(){clearTimeout(timer);timer=setTimeout(refreshAffiliateFrame,650)}
  document.getElementById('searchBtn')?.addEventListener('click',scheduleAffiliate);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter')scheduleAffiliate()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-query],[data-suggest],[data-history-query]'))scheduleAffiliate()});

  const affiliateHref='https://hb.afl.rakuten.co.jp/hsc/56a9a834.c6453a62.56a9a835.92ad2e3e/?link_type=pict&ut=eyJwYWdlIjoic2hvcCIsInR5cGUiOiJwaWN0IiwiY29sIjoxLCJjYXQiOiI0NCIsImJhbiI6Mjc5NDg1OCwiYW1wIjpmYWxzZX0%3D';
  const affiliateImage='https://hbb.afl.rakuten.co.jp/hsb/56a9a834.c6453a62.56a9a835.92ad2e3e/?me_id=1&me_adv_id=2794858&t=pict';
  function installReliableAffiliateAd(){
    const wrap=document.querySelector('.affiliate-widget-frame-wrap');
    if(!wrap||document.querySelector('.rakuten-pict-ad-shell'))return;
    const shell=document.createElement('div');
    shell.className='rakuten-pict-ad-shell';
    shell.innerHTML=`<div class="rakuten-pict-ad-head"><b>PR</b><span>楽天アフィリエイト広告</span></div><a class="rakuten-pict-ad" href="${affiliateHref}" target="_blank" rel="nofollow sponsored noopener"><img src="${affiliateImage}" alt="楽天市場のおすすめ商品（PR）" loading="lazy" decoding="async"><span class="rakuten-pict-fallback">楽天市場のおすすめを見る ↗</span></a>`;
    wrap.insertAdjacentElement('beforebegin',shell);
    const img=shell.querySelector('img');
    img?.addEventListener('error',()=>shell.querySelector('.rakuten-pict-ad')?.classList.add('is-fallback'),{once:true});
  }

  const compareIds=new Set();
  function decorateClearButton(){
    const clear=document.getElementById('clearQ');
    if(!clear||clear.dataset.polished==='1')return;
    clear.dataset.polished='1';
    clear.title='検索欄の入力を消す';
    clear.setAttribute('aria-label','検索欄の入力を消す');
    clear.innerHTML='<span class="clear-icon" aria-hidden="true">×</span><span class="clear-label">入力を消す</span>';
  }
  function decorateCompareButtons(){
    document.querySelectorAll('[data-compare]').forEach(btn=>{
      const id=String(btn.dataset.compare||'');
      const selected=compareIds.has(id);
      btn.classList.toggle('is-selected',selected);
      btn.setAttribute('aria-pressed',String(selected));
      btn.setAttribute('aria-label',selected?'比較から外す':'比較に追加する');
      btn.title=selected?'比較から外す':'比較に追加';
      btn.innerHTML=`<span class="compare-action-icon" aria-hidden="true">${selected?'✓':'＋'}</span><span>${selected?'比較中':'比較に追加'}</span>`;
    });
    const open=document.getElementById('openCompare');if(open)open.textContent='比較内容を見る';
    const clear=document.getElementById('clearCompare');if(clear)clear.textContent='選択解除';
  }
  function decorateFavoriteButtons(){
    document.querySelectorAll('.heart[data-fav]').forEach(btn=>{
      const on=btn.classList.contains('on');
      btn.setAttribute('aria-label',on?'お気に入りから外す':'お気に入りに追加');
      btn.title=on?'お気に入りから外す':'お気に入りに追加';
    });
  }
  function polishAll(){decorateClearButton();decorateCompareButtons();decorateFavoriteButtons();installReliableAffiliateAd()}

  document.addEventListener('click',event=>{
    const compare=event.target.closest('[data-compare]');
    if(compare){
      const id=String(compare.dataset.compare||'');
      if(compareIds.has(id))compareIds.delete(id);
      else{
        if(compareIds.size>=4)compareIds.delete(compareIds.values().next().value);
        compareIds.add(id);
      }
      queueMicrotask(decorateCompareButtons);
      return;
    }
    if(event.target.closest('#clearCompare')){
      compareIds.clear();queueMicrotask(decorateCompareButtons);return;
    }
    if(event.target.closest('.heart[data-fav]'))queueMicrotask(decorateFavoriteButtons);
  });

  const grid=document.getElementById('productGrid');
  if(grid)new MutationObserver(()=>queueMicrotask(polishAll)).observe(grid,{childList:true,subtree:true});
  const modal=document.getElementById('modalContent');
  if(modal)new MutationObserver(()=>queueMicrotask(polishAll)).observe(modal,{childList:true,subtree:true});
  polishAll();
})();
