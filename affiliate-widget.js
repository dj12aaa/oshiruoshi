(() => {
  'use strict';

  // Desktop stability guard: Chromium/Edge can become unresponsive when many
  // product cards, sticky bars, backdrop blurs and forced GPU layers are
  // composited at the same time. Keep the mobile presentation unchanged.
  if(window.matchMedia?.('(min-width:901px)').matches){
    const desktopStability=document.createElement('style');
    desktopStability.id='oshiru-desktop-stability-v1';
    desktopStability.textContent=`
      @media(min-width:901px){
        .site-header,.utility-dock,.source-access-panel,.source-pill,.heart,
        .compare-filterbar,.compare-table tr:first-child th{
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
        }
        .site-header{background:#fff!important}
        .utility-dock{background:#f7f8fa!important}
        .source-access-panel{background:#fff!important}
        .source-pill,.heart{background:#fff!important}
        .market-img{
          transform:none!important;
          will-change:auto!important;
          transition:opacity .15s ease!important;
        }
        .product-card{
          box-shadow:0 5px 18px rgba(15,23,42,.065)!important;
          transition:border-color .12s ease,box-shadow .12s ease!important;
        }
        .product-card:hover{
          transform:none!important;
          box-shadow:0 7px 22px rgba(15,23,42,.085)!important;
        }
        .product-card:hover .market-img{transform:none!important}
      }
    `;
    document.head.appendChild(desktopStability);
  }

  const frame=document.getElementById('rakutenAffiliateFrame');
  const input=document.getElementById('q');
  const affiliateSection=document.querySelector('.affiliate-widget-section');
  let affiliateVisible=false;
  let lastAffiliateQuery='';
  let affiliateTimer=0;

  function currentQuery(){
    return (input?.value||'').trim().replace(/\s+/g,' ').slice(0,80);
  }

  function refreshAffiliateFrame(){
    if(!frame||!affiliateVisible)return;
    const q=currentQuery();
    if(q===lastAffiliateQuery)return;
    lastAffiliateQuery=q;
    const url=new URL('/rakuten-widget.html',location.origin);
    if(q)url.searchParams.set('q',q);
    frame.src=url.pathname+url.search;
  }

  function scheduleAffiliateRefresh(){
    clearTimeout(affiliateTimer);
    affiliateTimer=setTimeout(refreshAffiliateFrame,900);
  }

  if(affiliateSection&&'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      affiliateVisible=entries.some(entry=>entry.isIntersecting);
      if(affiliateVisible)refreshAffiliateFrame();
    },{rootMargin:'320px 0px'});
    io.observe(affiliateSection);
  }else{
    affiliateVisible=true;
  }

  document.getElementById('searchBtn')?.addEventListener('click',scheduleAffiliateRefresh,{passive:true});
  input?.addEventListener('keydown',event=>{if(event.key==='Enter')scheduleAffiliateRefresh()});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-query],[data-suggest],[data-history-query]'))scheduleAffiliateRefresh();
  },{passive:true});

  const compareIds=new Set();

  function decorateClearButton(){
    const clear=document.getElementById('clearQ');
    if(!clear||clear.dataset.polished==='1')return;
    clear.dataset.polished='1';
    clear.title='検索欄の入力を消す';
    clear.setAttribute('aria-label','検索欄の入力を消す');
    clear.innerHTML='<span class="clear-icon" aria-hidden="true">×</span><span class="clear-label">入力を消す</span>';
  }

  function updateCompareButton(btn){
    const id=String(btn.dataset.compare||'');
    const selected=compareIds.has(id);
    const state=selected?'selected':'idle';
    btn.classList.toggle('is-selected',selected);
    btn.setAttribute('aria-pressed',String(selected));
    btn.setAttribute('aria-label',selected?'比較から外す':'比較に追加する');
    btn.title=selected?'比較から外す':'比較に追加';
    if(btn.dataset.oshiruCompareState===state)return;
    btn.dataset.oshiruCompareState=state;
    btn.innerHTML=`<span class="compare-action-icon" aria-hidden="true">${selected?'✓':'＋'}</span><span>${selected?'比較中':'比較に追加'}</span>`;
  }

  function decorateCompareButtons(){
    document.querySelectorAll('[data-compare]').forEach(updateCompareButton);
    const open=document.getElementById('openCompare');
    if(open&&open.textContent!=='比較内容を見る')open.textContent='比較内容を見る';
    const clear=document.getElementById('clearCompare');
    if(clear&&clear.textContent!=='選択解除')clear.textContent='選択解除';
  }

  function decorateFavoriteButtons(){
    document.querySelectorAll('.heart[data-fav]').forEach(btn=>{
      const on=btn.classList.contains('on');
      const label=on?'お気に入りから外す':'お気に入りに追加';
      if(btn.getAttribute('aria-label')!==label)btn.setAttribute('aria-label',label);
      if(btn.title!==label)btn.title=label;
    });
  }

  let polishScheduled=false;
  function polishAll(){
    polishScheduled=false;
    decorateClearButton();
    decorateCompareButtons();
    decorateFavoriteButtons();
  }
  function schedulePolish(){
    if(polishScheduled)return;
    polishScheduled=true;
    requestAnimationFrame(polishAll);
  }

  document.addEventListener('click',event=>{
    const compare=event.target.closest('[data-compare]');
    if(compare){
      const id=String(compare.dataset.compare||'');
      if(compareIds.has(id))compareIds.delete(id);
      else{
        if(compareIds.size>=4)compareIds.delete(compareIds.values().next().value);
        compareIds.add(id);
      }
      schedulePolish();
      return;
    }
    if(event.target.closest('#clearCompare')){
      compareIds.clear();
      schedulePolish();
      return;
    }
    if(event.target.closest('.heart[data-fav]'))schedulePolish();
  });

  const grid=document.getElementById('productGrid');
  if(grid)new MutationObserver(schedulePolish).observe(grid,{childList:true});
  const modal=document.getElementById('modalContent');
  if(modal)new MutationObserver(schedulePolish).observe(modal,{childList:true});

  schedulePolish();
})();
