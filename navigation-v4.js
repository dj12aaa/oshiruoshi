(() => {
  'use strict';
  const $=s=>document.querySelector(s);

  const icons={
    results:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    favorites:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.4 5.4 0 0 0-7.6 0L12 6.1l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.5a5.4 5.4 0 0 0 0-7.6Z"/></svg>',
    compare:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5H4v14h4M16 5h4v14h-4M10 8h4M10 12h4M10 16h4"/></svg>',
    filter:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M9 4v6M7 14v6"/></svg>',
    saved:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>'
  };
  const items=[
    ['results','商品を探す','#results'],
    ['favorites','お気に入り',''],
    ['compare','比較',''],
    ['filter','条件・絞り込み',''],
    ['saved','保存した検索','#watch']
  ];

  const toggle=document.createElement('button');
  toggle.id='dockToggle';
  toggle.className='dock-toggle';
  toggle.type='button';
  toggle.setAttribute('aria-label','メニューを開く');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-controls','utilityDock');
  toggle.innerHTML='<span></span><span></span><span></span>';

  const scrim=document.createElement('div');
  scrim.id='dockScrim';
  scrim.className='dock-scrim';
  scrim.hidden=true;

  const dock=document.createElement('nav');
  dock.id='utilityDock';
  dock.className='utility-dock';
  dock.setAttribute('aria-label','OSHIRU クイックメニュー');
  dock.innerHTML=`
    <div class="dock-mobile-head">
      <a class="dock-home" href="/" aria-label="OSHIRU ホーム"><span>O</span><b>OSHIRU</b></a>
      <button type="button" class="dock-close" aria-label="メニューを閉じる">×</button>
    </div>
    <div class="dock-actions">
      ${items.map(([key,label,href])=>href
        ?`<a class="dock-item" href="${href}" data-dock="${key}">${icons[key]}<span>${label}</span>${key==='results'?'':'<b class="dock-count" hidden>0</b>'}</a>`
        :`<button class="dock-item" type="button" data-dock="${key}">${icons[key]}<span>${label}</span>${key==='filter'?'':'<b class="dock-count" hidden>0</b>'}</button>`).join('')}
    </div>
    <div class="dock-mobile-foot">検索・比較・保存をここからすぐ操作できます。</div>
    <div id="dockNotice" class="dock-notice" role="status" aria-live="polite"></div>`;

  document.body.append(toggle,scrim);
  document.querySelector('.site-header')?.insertAdjacentElement('afterend',dock);
  document.body.classList.add('dock-ready');

  const mobile=()=>matchMedia('(max-width:900px)').matches;
  const notice=$('#dockNotice');
  let noticeTimer;
  function showNotice(text){
    if(!notice)return;
    notice.textContent=text;
    notice.classList.add('show');
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>notice.classList.remove('show'),1900);
  }
  function setDrawer(open){
    if(!mobile())open=false;
    document.body.classList.toggle('mobile-dock-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
    scrim.hidden=!open;
    if(open)requestAnimationFrame(()=>dock.querySelector('.dock-item')?.focus({preventScroll:true}));
  }
  toggle.addEventListener('click',()=>setDrawer(!document.body.classList.contains('mobile-dock-open')));
  scrim.addEventListener('click',()=>setDrawer(false));
  dock.querySelector('.dock-close')?.addEventListener('click',()=>setDrawer(false));
  addEventListener('keydown',e=>{if(e.key==='Escape'){setDrawer(false);closeFilters()}});
  addEventListener('resize',()=>{if(!mobile())setDrawer(false)});

  function smoothTo(selector){const el=$(selector);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
  function closeFilters(){
    const panel=$('.filter-panel');
    if(panel?.classList.contains('mobile-open'))panel.classList.remove('mobile-open');
    document.body.classList.remove('filter-open');
  }
  function openFilters(){
    const panel=$('.filter-panel');if(!panel)return;
    if(mobile()){
      setDrawer(false);
      panel.classList.add('mobile-open');
      document.body.classList.add('filter-open');
      panel.scrollTop=0;
    }else{
      panel.scrollIntoView({behavior:'smooth',block:'start'});
      panel.classList.add('filter-pulse');
      setTimeout(()=>panel.classList.remove('filter-pulse'),700);
    }
  }

  dock.addEventListener('click',e=>{
    const item=e.target.closest('[data-dock]');if(!item)return;
    const action=item.dataset.dock;
    if(mobile())setDrawer(false);
    if(action==='favorites'){
      e.preventDefault();
      $('#favoritesBtn')?.click();
      return;
    }
    if(action==='compare'){
      e.preventDefault();
      const n=Number($('#compareCount')?.textContent||0);
      if(n>0)$('#openCompare')?.click();
      else{showNotice('比較したい商品の「＋」を押してください');smoothTo('#results')}
      return;
    }
    if(action==='filter'){
      e.preventDefault();openFilters();return;
    }
    if(action==='results'||action==='saved'){
      e.preventDefault();smoothTo(action==='results'?'#results':'#watch');
    }
  });

  function syncCounts(){
    const fav=Number($('#favCount')?.textContent||0);
    const cmp=Number($('#compareCount')?.textContent||0);
    for(const [key,value] of [['favorites',fav],['compare',cmp]]){
      const b=dock.querySelector(`[data-dock="${key}"] .dock-count`);if(!b)continue;
      b.textContent=String(value);b.hidden=value<=0;
      dock.querySelector(`[data-dock="${key}"]`)?.classList.toggle('has-items',value>0);
    }
  }
  ['#favCount','#compareCount'].forEach(sel=>{
    const el=$(sel);if(el)new MutationObserver(syncCounts).observe(el,{childList:true,subtree:true,characterData:true});
  });
  syncCounts();

  document.addEventListener('click',e=>{
    if(!mobile())return;
    const panel=$('.filter-panel');
    if(!panel?.classList.contains('mobile-open'))return;
    if(e.target.closest('.filter-panel')||e.target.closest('#mobileFilterBtn'))return;
    closeFilters();
  });

  const money=text=>{const m=String(text||'').replace(/,/g,'').match(/¥\s*(\d+)/);return m?Number(m[1]):null};
  function groupFor(label){return['価格','送料','実質額'].includes(label)?'price':['状態','販売状況'].includes(label)?'state':label==='確認'?'time':'all'}
  function buildMobileCompare(){
    const modal=$('#modalContent'),table=modal?.querySelector('.compare-table');
    if(!table||table.dataset.mobileBuilt==='1')return;
    table.dataset.mobileBuilt='1';
    const rows=[...table.querySelectorAll('tr')];if(rows.length<2)return;
    const productCount=Math.max(0,rows[0].children.length-1);if(!productCount)return;
    const data=Array.from({length:productCount},(_,index)=>({index,source:rows[0].children[index+1]?.textContent?.trim()||`商品${index+1}`,fields:{}}));
    rows.slice(1).forEach(row=>{
      const label=row.querySelector('th')?.textContent?.trim()||'';
      [...row.querySelectorAll('td')].forEach((cell,index)=>{if(data[index])data[index].fields[label]={html:cell.innerHTML,text:cell.textContent.trim(),group:groupFor(label)}});
    });
    const priceValues=data.map(x=>money(x.fields['実質額']?.text)||money(x.fields['価格']?.text));
    const finite=priceValues.filter(Number.isFinite),best=finite.length?Math.min(...finite):null;
    const wrap=document.createElement('section');
    wrap.className='mobile-compare';
    wrap.innerHTML=`<div class="mobile-compare-head"><div><span>比較中</span><b>${productCount}商品</b></div><p>横にスクロールせず、商品ごとに確認できます。</p></div><div class="mobile-compare-tabs" role="tablist"><button class="active" data-mobile-compare="all">すべて</button><button data-mobile-compare="price">料金</button><button data-mobile-compare="state">状態</button><button data-mobile-compare="time">更新</button></div><div class="mobile-compare-list">${data.map((item,index)=>{const v=priceValues[index],isBest=best!=null&&v===best;const f=item.fields;return`<article class="mobile-compare-card ${isBest?'best':''}"><div class="mobile-compare-card-head"><div><span>${item.source}</span><h3>${f['商品']?.text||'商品'}</h3></div>${isBest?'<b class="mobile-best">最安候補</b>':''}</div><div class="mobile-compare-fields">${['価格','送料','実質額','状態','販売状況','確認'].map(label=>f[label]?`<div class="mobile-compare-field" data-mobile-group="${f[label].group}"><span>${label}</span><b>${f[label].html}</b></div>`:'').join('')}</div>${f['販売元']?`<div class="mobile-compare-action">${f['販売元'].html}</div>`:''}</article>`}).join('')}</div>`;
    table.insertAdjacentElement('afterend',wrap);
    wrap.addEventListener('click',e=>{
      const btn=e.target.closest('[data-mobile-compare]');if(!btn)return;
      const group=btn.dataset.mobileCompare;
      wrap.querySelectorAll('[data-mobile-compare]').forEach(x=>x.classList.toggle('active',x===btn));
      wrap.querySelectorAll('.mobile-compare-field').forEach(x=>x.hidden=!(group==='all'||x.dataset.mobileGroup===group));
    });
  }
  const modalContent=$('#modalContent');
  if(modalContent)new MutationObserver(()=>queueMicrotask(buildMobileCompare)).observe(modalContent,{childList:true,subtree:true});
  buildMobileCompare();
})();
