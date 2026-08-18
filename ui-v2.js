(() => {
  'use strict';

  const intro = document.getElementById('introCutin');
  const storage = {
    get(key){ try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key,value){ try { sessionStorage.setItem(key,value); } catch {} }
  };
  const persistent = {
    get(key,fallback='[]'){ try { return localStorage.getItem(key) || fallback; } catch { return fallback; } },
    set(key,value){ try { localStorage.setItem(key,value); } catch {} },
    remove(key){ try { localStorage.removeItem(key); } catch {} }
  };

  const style=document.createElement('style');
  style.textContent=`
    #suggestBox .history-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 7px;border-bottom:1px solid #e5e7eb}
    #suggestBox .history-toolbar b{font-size:12px;color:#334155}
    #suggestBox .history-clear{border:0;background:transparent;color:#64748b;font-size:12px;font-weight:800;cursor:pointer;padding:4px 2px}
    #suggestBox .history-clear:hover{color:#111827}
    #suggestBox .history-item{width:100%;border:0;background:#fff;text-align:left;cursor:pointer}
    #suggestBox .history-item:hover{background:#f8fafc}
    #suggestBox .history-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#f1f5f9;color:#475569;font-size:15px;flex:none}
    #suggestBox .history-item small{display:block;color:#64748b;font-size:11px;margin-top:2px}
    .image-fallback .image-source-note{display:block;margin-top:7px;font-size:10.5px;line-height:1.45;color:#64748b;padding:0 10px}
  `;
  document.head.appendChild(style);

  function dismissIntro(immediate=false){
    if(!intro) return;
    if(immediate){ intro.remove(); return; }
    if(intro.classList.contains('is-leaving')) return;
    intro.classList.add('is-leaving');
    window.setTimeout(() => intro.remove(), 720);
  }

  if(intro){
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const seen = storage.get('oshiru-intro-v3') === '1';
    if(reduced || seen){
      dismissIntro(true);
    }else{
      storage.set('oshiru-intro-v3','1');
      const release = () => window.setTimeout(() => dismissIntro(false), 880);
      if(document.readyState === 'complete') release();
      else window.addEventListener('load', release, {once:true});
      window.setTimeout(() => dismissIntro(false), 1750);
      intro.addEventListener('click', () => dismissIntro(false), {once:true});
      window.addEventListener('keydown', e => { if(e.key === 'Escape') dismissIntro(false); }, {once:true});
    }
  }

  /* Only expose the image-search control when the server-side vision API is configured. */
  const imageSearchButton=document.getElementById('imageSearchBtn');
  if(imageSearchButton){
    fetch('/api/status',{headers:{accept:'application/json'}})
      .then(r => r.ok ? r.json() : null)
      .then(s => { if(s?.vision === true) imageSearchButton.hidden=false; })
      .catch(() => {});
  }

  const categoryFor = label => {
    if(['価格','送料','実質額'].includes(label)) return 'price';
    if(['状態','販売状況'].includes(label)) return 'state';
    if(['確認'].includes(label)) return 'time';
    return 'base';
  };

  const numericYen = text => {
    const m = String(text || '').replace(/,/g,'').match(/¥\s*(\d+)/);
    return m ? Number(m[1]) : null;
  };

  function highlightBest(table){
    const rows = [...table.querySelectorAll('tr')];
    for(const row of rows){
      const head = row.querySelector('th');
      if(!head || !['価格','送料','実質額'].includes(head.textContent.trim())) continue;
      const cells = [...row.querySelectorAll('td')];
      const values = cells.map(td => numericYen(td.textContent));
      const valid = values.filter(Number.isFinite);
      if(!valid.length) continue;
      const min = Math.min(...valid);
      cells.forEach((td,i) => td.classList.toggle('best-value', values[i] === min));
    }
  }

  function enhanceCompare(){
    const table = document.querySelector('#modalContent .compare-table');
    if(!table || table.dataset.v2Enhanced === '1') return;
    table.dataset.v2Enhanced = '1';

    [...table.querySelectorAll('tr')].forEach(row => {
      const label = row.querySelector('th')?.textContent.trim() || '';
      row.dataset.compareGroup = categoryFor(label);
    });

    const bar = document.createElement('div');
    bar.className = 'compare-filterbar';
    bar.innerHTML = `
      <span class="compare-label">比較する項目</span>
      <button type="button" class="compare-tab active" data-compare-filter="all">すべて</button>
      <button type="button" class="compare-tab" data-compare-filter="price">料金</button>
      <button type="button" class="compare-tab" data-compare-filter="state">状態</button>
      <button type="button" class="compare-tab" data-compare-filter="time">更新時期</button>`;

    const tip = document.createElement('p');
    tip.className = 'compare-tip';
    tip.textContent = '料金では最安値を強調します。送料不明の商品は総額を断定せず、販売元での確認を優先します。';

    table.parentNode.insertBefore(bar, table);
    table.parentNode.insertBefore(tip, table);

    bar.addEventListener('click', e => {
      const btn = e.target.closest('[data-compare-filter]');
      if(!btn) return;
      const filter = btn.dataset.compareFilter;
      bar.querySelectorAll('.compare-tab').forEach(x => x.classList.toggle('active', x === btn));
      [...table.querySelectorAll('tr')].forEach((row,index) => {
        if(index === 0){ row.classList.remove('compare-row-hidden'); return; }
        const group = row.dataset.compareGroup || 'base';
        const visible = filter === 'all' || group === filter || group === 'base';
        row.classList.toggle('compare-row-hidden', !visible);
      });
    });

    highlightBest(table);
  }

  function sourceName(card){
    return card.querySelector('.source-pill')?.textContent?.trim() || '';
  }

  function markAffiliateCards(){
    document.querySelectorAll('.product-card').forEach(card => {
      const link=card.querySelector('.card-actions a[href]');
      if(!link) return;
      let affiliate=false;
      try{ affiliate=new URL(link.href,location.href).hostname==='hb.afl.rakuten.co.jp'; }catch{}
      const row=card.querySelector('.tag-row');
      const existing=card.querySelector('.affiliate-tag');
      if(affiliate && row && !existing){
        const tag=document.createElement('span');
        tag.className='tag affiliate-tag';
        tag.textContent='PR';
        tag.title='アフィリエイトリンクを含みます';
        row.appendChild(tag);
      }else if(!affiliate && existing){
        existing.remove();
      }
    });
  }

  function protectOfficialImages(){
    document.querySelectorAll('.product-card').forEach(card => {
      const source=sourceName(card);
      const provider=source.includes('Yahoo!ショッピング')?'yahoo':source.includes('楽天市場')?'rakuten':'';
      const img=card.querySelector('img.market-img');
      if(provider && img && img.dataset.oshiruOfficialProxy!=='1'){
        let original='';
        try{
          const current=new URL(img.currentSrc||img.src,location.href);
          if(current.origin!==location.origin) original=current.href;
        }catch{}
        if(original){
          img.dataset.oshiruOfficialProxy='1';
          img.dataset.proxyTried='1';
          img.dataset.originalImage=original;
          img.removeAttribute('referrerpolicy');
          img.src=`/api/image-proxy?source=${provider}&url=${encodeURIComponent(original)}`;
        }
      }

      const fallback=card.querySelector('.image-fallback');
      if(fallback && fallback.dataset.oshiruExplained!=='1'){
        fallback.dataset.oshiruExplained='1';
        if(['メルカリ','Yahoo!フリマ','Yahoo!オークション'].some(x=>source.includes(x))){
          fallback.innerHTML='画像は販売元で確認<small class="image-source-note">現在この販売元は、OSHIRUで公式API経由の出品画像を取得していません。</small>';
        }
      }
    });
  }

  function enhanceProductCards(){
    markAffiliateCards();
    protectOfficialImages();
  }

  const HISTORY_KEY='oshiru-search-history-v1';
  const queryInput=document.getElementById('q');
  const suggestBox=document.getElementById('suggestBox');

  function historyItems(){
    try{
      const parsed=JSON.parse(persistent.get(HISTORY_KEY,'[]'));
      return Array.isArray(parsed)?parsed.filter(x=>typeof x==='string'&&x.trim()).slice(0,10):[];
    }catch{return[]}
  }

  function rememberSearch(value){
    const q=String(value||'').trim().replace(/\s+/g,' ').slice(0,80);
    if(!q)return;
    const next=[q,...historyItems().filter(x=>x!==q)].slice(0,10);
    persistent.set(HISTORY_KEY,JSON.stringify(next));
  }

  function renderSearchHistory(){
    if(!queryInput||!suggestBox||queryInput.value.trim())return;
    const items=historyItems();
    if(!items.length){suggestBox.classList.add('hidden');return}
    suggestBox.innerHTML=`<div class="history-toolbar"><b>最近の検索</b><button type="button" class="history-clear" data-history-clear>履歴を削除</button></div>${items.map(q=>`<button type="button" class="suggest-item history-item" data-history-query="${q.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}"><span class="history-icon">↺</span><div><b>${q.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</b><small>もう一度検索</small></div></button>`).join('')}`;
    suggestBox.classList.remove('hidden');
  }

  if(queryInput && suggestBox){
    queryInput.addEventListener('focus',()=>{if(!queryInput.value.trim())renderSearchHistory()});
    queryInput.addEventListener('input',()=>{if(!queryInput.value.trim())window.setTimeout(renderSearchHistory,420)});
    queryInput.addEventListener('keydown',e=>{if(e.key==='Enter')rememberSearch(queryInput.value)},true);
    document.getElementById('searchBtn')?.addEventListener('click',()=>rememberSearch(queryInput.value),true);
    document.getElementById('clearQ')?.addEventListener('click',()=>window.setTimeout(renderSearchHistory,0));
    document.querySelectorAll('.query-chip').forEach(b=>b.addEventListener('click',()=>rememberSearch(b.dataset.query||''),true));
    suggestBox.addEventListener('click',e=>{
      const clear=e.target.closest('[data-history-clear]');
      if(clear){e.preventDefault();e.stopPropagation();persistent.remove(HISTORY_KEY);suggestBox.classList.add('hidden');queryInput.focus();return}
      const history=e.target.closest('[data-history-query]');
      if(history){e.preventDefault();e.stopPropagation();const q=history.dataset.historyQuery||'';queryInput.value=q;rememberSearch(q);suggestBox.classList.add('hidden');document.getElementById('searchBtn')?.click();return}
      const suggestion=e.target.closest('[data-suggest]');
      if(suggestion)rememberSearch(suggestion.dataset.suggest||'');
    },true);
  }

  const modalContent = document.getElementById('modalContent');
  if(modalContent){
    new MutationObserver(() => window.setTimeout(enhanceCompare,0))
      .observe(modalContent,{childList:true,subtree:true});
  }

  const productGrid=document.getElementById('productGrid');
  if(productGrid){
    new MutationObserver(() => window.setTimeout(enhanceProductCards,0))
      .observe(productGrid,{childList:true,subtree:true});
  }
  enhanceProductCards();

  document.getElementById('openCompare')?.addEventListener('click', () => window.setTimeout(enhanceCompare,0));
})();
