(() => {
  'use strict';

  const intro=document.getElementById('introCutin');
  const sessionStore={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch{}}};
  const persistent={get(k,f='[]'){try{return localStorage.getItem(k)||f}catch{return f}},set(k,v){try{localStorage.setItem(k,v)}catch{}},remove(k){try{localStorage.removeItem(k)}catch{}}};
  const RETAIL_SOURCES=['メルカリ','Yahoo!フリマ','Yahoo!オークション','Yahoo!ショッピング','楽天市場'];
  const sourceModes={'メルカリ':'サイト内検索','Yahoo!フリマ':'サイト内検索','Yahoo!オークション':'サイト内検索','Yahoo!ショッピング':'公式API','楽天市場':'公式API'};
  let selectedSources=new Set(RETAIL_SOURCES);
  let fixingFilters=false;
  let affiliateState={rakuten:false,yahoo:false};

  const style=document.createElement('style');
  style.textContent=`
    #suggestBox .history-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 7px;border-bottom:1px solid #e5e7eb}
    #suggestBox .history-toolbar b{font-size:12px;color:#334155}
    #suggestBox .history-clear{border:0;background:transparent;color:#64748b;font-size:12px;font-weight:800;cursor:pointer;padding:4px 2px}
    #suggestBox .history-item{width:100%;border:0;background:#fff;text-align:left;cursor:pointer}
    #suggestBox .history-item:hover{background:#f8fafc}
    #suggestBox .history-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#f1f5f9;color:#475569;font-size:15px;flex:none}
    #suggestBox .history-item small{display:block;color:#64748b;font-size:11px;margin-top:2px}
    .image-fallback .image-source-note{display:block;margin-top:7px;font-size:10.5px;line-height:1.45;color:#64748b;padding:0 10px}
    #sourceFilters label{display:flex;align-items:center;gap:7px;min-width:0}
    #sourceFilters .source-mode{margin-left:auto;font-size:9.5px;line-height:1;padding:4px 6px;border-radius:999px;background:#f1f5f9;color:#64748b;font-weight:800;white-space:nowrap}
    #sourceFilters .source-mode.api{background:#fff0f3;color:#b3123a}
    .source-access-panel{margin:10px 0 18px;padding:14px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}
    .source-access-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
    .source-access-head b{font-size:13px;color:#0f172a}
    .source-access-head span{font-size:11px;color:#64748b;text-align:right}
    .source-access-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    .source-access-link{display:flex;flex-direction:column;gap:4px;padding:10px 11px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;text-decoration:none;color:#0f172a;min-width:0}
    .source-access-link:hover{border-color:#cbd5e1;background:#fff}
    .source-access-link strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .source-access-link small{font-size:10px;color:#64748b}
    .affiliate-tag{background:#fff0f3!important;color:#b3123a!important;border-color:#ffc8d4!important}
    @media(max-width:900px){.source-access-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.source-access-head{display:block}.source-access-head span{display:block;text-align:left;margin-top:4px}}
  `;
  document.head.appendChild(style);

  function dismissIntro(immediate=false){
    if(!intro)return;
    if(immediate){intro.remove();return}
    if(intro.classList.contains('is-leaving'))return;
    intro.classList.add('is-leaving');
    setTimeout(()=>intro.remove(),720);
  }
  if(intro){
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const seen=sessionStore.get('oshiru-intro-v3')==='1';
    if(reduced||seen)dismissIntro(true);
    else{
      sessionStore.set('oshiru-intro-v3','1');
      const release=()=>setTimeout(()=>dismissIntro(false),880);
      if(document.readyState==='complete')release();else addEventListener('load',release,{once:true});
      setTimeout(()=>dismissIntro(false),1750);
      intro.addEventListener('click',()=>dismissIntro(false),{once:true});
      addEventListener('keydown',e=>{if(e.key==='Escape')dismissIntro(false)},{once:true});
    }
  }

  fetch('/api/status',{headers:{accept:'application/json'}})
    .then(r=>r.ok?r.json():null)
    .then(s=>{
      if(s?.vision===true){const b=document.getElementById('imageSearchBtn');if(b)b.hidden=false}
      affiliateState.rakuten=s?.rakutenAffiliate===true;
      affiliateState.yahoo=s?.yahooAffiliate===true;
      enhanceProductCards();
    }).catch(()=>{});

  function sourceClass(s){if(s==='メルカリ')return'mercari';if(s==='Yahoo!フリマ')return'yflea';if(s==='Yahoo!オークション')return'yauc';return'shop'}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function sourceSearchUrl(source,q){
    const e=encodeURIComponent(String(q||'').trim()||'推し活 グッズ');
    if(source==='メルカリ')return`https://jp.mercari.com/search?keyword=${e}`;
    if(source==='Yahoo!フリマ')return`https://paypayfleamarket.yahoo.co.jp/search/${e}`;
    if(source==='Yahoo!オークション')return`https://auctions.yahoo.co.jp/search/search/${e}/0/`;
    if(source==='Yahoo!ショッピング')return`https://shopping.yahoo.co.jp/search?p=${e}`;
    if(source==='楽天市場')return`https://search.rakuten.co.jp/search/mall/${e}/`;
    return'#';
  }

  const sourceFilters=document.getElementById('sourceFilters');
  function fixedSourceMarkup(){
    return RETAIL_SOURCES.map(s=>`<label><input class="source-check" type="checkbox" value="${esc(s)}" ${selectedSources.has(s)?'checked':''}><span class="source-dot ${sourceClass(s)}"></span><span>${esc(s)}</span><span class="source-mode ${sourceModes[s]==='公式API'?'api':''}">${sourceModes[s]}</span></label>`).join('');
  }
  function renderFixedSourceFilters(){
    if(!sourceFilters||fixingFilters)return;
    const names=[...sourceFilters.querySelectorAll('.source-check')].map(x=>x.value);
    if(names.length===RETAIL_SOURCES.length&&RETAIL_SOURCES.every((x,i)=>names[i]===x))return;
    fixingFilters=true;
    sourceFilters.innerHTML=fixedSourceMarkup();
    fixingFilters=false;
  }
  if(sourceFilters){
    renderFixedSourceFilters();
    sourceFilters.addEventListener('change',e=>{
      const input=e.target.closest('.source-check');if(!input)return;
      if(input.checked)selectedSources.add(input.value);else selectedSources.delete(input.value);
      if(selectedSources.size===0){selectedSources.add(input.value);input.checked=true;return}
      if(typeof window.applyFilters==='function')window.applyFilters();
    });
    new MutationObserver(()=>queueMicrotask(renderFixedSourceFilters)).observe(sourceFilters,{childList:true,subtree:true});
  }

  let accessPanel=document.getElementById('sourceAccessPanel');
  if(!accessPanel){
    accessPanel=document.createElement('div');accessPanel.id='sourceAccessPanel';accessPanel.className='source-access-panel';
    const stats=document.getElementById('stats');stats?.insertAdjacentElement('afterend',accessPanel);
  }
  function cardCounts(){
    const counts={};
    document.querySelectorAll('#productGrid .product-card .source-pill').forEach(el=>{const name=el.textContent.trim();counts[name]=(counts[name]||0)+1});
    return counts;
  }
  function renderAccessPanel(){
    if(!accessPanel)return;
    const q=document.getElementById('q')?.value.trim()||'';
    const counts=cardCounts();
    accessPanel.innerHTML=`<div class="source-access-head"><b>販売サイトは常に5サイトから選べます</b><span>OSHIRU内に取得できない場合も、同じ検索語で販売サイトを直接開けます。</span></div><div class="source-access-grid">${RETAIL_SOURCES.map(s=>`<a class="source-access-link" href="${esc(sourceSearchUrl(s,q))}" target="_blank" rel="noopener noreferrer"><strong><span class="source-dot ${sourceClass(s)}"></span> ${esc(s)}</strong><small>${counts[s]?`OSHIRU内 ${counts[s]}件 / サイトも確認`:'同じ語でサイト内検索'}</small></a>`).join('')}</div>`;
  }
  document.getElementById('q')?.addEventListener('input',renderAccessPanel);

  const categoryFor=label=>['価格','送料','実質額'].includes(label)?'price':['状態','販売状況'].includes(label)?'state':label==='確認'?'time':'base';
  const numericYen=text=>{const m=String(text||'').replace(/,/g,'').match(/¥\s*(\d+)/);return m?Number(m[1]):null};
  function highlightBest(table){
    [...table.querySelectorAll('tr')].forEach(row=>{
      const head=row.querySelector('th');if(!head||!['価格','送料','実質額'].includes(head.textContent.trim()))return;
      const cells=[...row.querySelectorAll('td')],values=cells.map(td=>numericYen(td.textContent)),valid=values.filter(Number.isFinite);if(!valid.length)return;
      const min=Math.min(...valid);cells.forEach((td,i)=>td.classList.toggle('best-value',values[i]===min));
    });
  }
  function enhanceCompare(){
    const table=document.querySelector('#modalContent .compare-table');if(!table||table.dataset.v2Enhanced==='1')return;
    table.dataset.v2Enhanced='1';
    [...table.querySelectorAll('tr')].forEach(row=>{row.dataset.compareGroup=categoryFor(row.querySelector('th')?.textContent.trim()||'')});
    const bar=document.createElement('div');bar.className='compare-filterbar';bar.innerHTML='<span class="compare-label">比較する項目</span><button type="button" class="compare-tab active" data-compare-filter="all">すべて</button><button type="button" class="compare-tab" data-compare-filter="price">料金</button><button type="button" class="compare-tab" data-compare-filter="state">状態</button><button type="button" class="compare-tab" data-compare-filter="time">更新時期</button>';
    const tip=document.createElement('p');tip.className='compare-tip';tip.textContent='料金では最安値を強調します。送料不明の商品は総額を断定せず、販売元での確認を優先します。';
    table.parentNode.insertBefore(bar,table);table.parentNode.insertBefore(tip,table);
    bar.addEventListener('click',e=>{const btn=e.target.closest('[data-compare-filter]');if(!btn)return;const f=btn.dataset.compareFilter;bar.querySelectorAll('.compare-tab').forEach(x=>x.classList.toggle('active',x===btn));[...table.querySelectorAll('tr')].forEach((row,i)=>{if(i===0){row.classList.remove('compare-row-hidden');return}const g=row.dataset.compareGroup||'base';row.classList.toggle('compare-row-hidden',!(f==='all'||g===f||g==='base'))})});
    highlightBest(table);
  }

  function sourceName(card){return card.querySelector('.source-pill')?.textContent?.trim()||''}
  function markAffiliateCards(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const source=sourceName(card),link=card.querySelector('.card-actions a[href]'),row=card.querySelector('.tag-row');if(!link||!row)return;
      let affiliate=(source==='楽天市場'&&affiliateState.rakuten)||(source==='Yahoo!ショッピング'&&affiliateState.yahoo);
      try{const h=new URL(link.href,location.href).hostname;affiliate=affiliate||h==='hb.afl.rakuten.co.jp'||h.endsWith('valuecommerce.com')}catch{}
      let tag=card.querySelector('.affiliate-tag');
      if(affiliate&&!tag){tag=document.createElement('span');tag.className='tag affiliate-tag';tag.textContent='PR';tag.title='アフィリエイトリンクを含みます';row.appendChild(tag)}
      else if(!affiliate&&tag)tag.remove();
    });
  }
  function protectOfficialImages(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const source=sourceName(card),provider=source==='Yahoo!ショッピング'?'yahoo':source==='楽天市場'?'rakuten':'';
      const img=card.querySelector('img.market-img');
      if(provider&&img&&img.dataset.oshiruOfficialProxy!=='1'){
        let original='';try{const u=new URL(img.currentSrc||img.src,location.href);if(u.origin!==location.origin)original=u.href}catch{}
        if(original){img.dataset.oshiruOfficialProxy='1';img.dataset.proxyTried='1';img.dataset.originalImage=original;img.removeAttribute('referrerpolicy');img.src=`/api/image-proxy?source=${provider}&url=${encodeURIComponent(original)}`}
      }
      const fallback=card.querySelector('.image-fallback');
      if(fallback&&fallback.dataset.oshiruExplained!=='1'){
        fallback.dataset.oshiruExplained='1';
        if(['メルカリ','Yahoo!フリマ','Yahoo!オークション'].includes(source))fallback.innerHTML=`画像は販売元で確認<small class="image-source-note">${esc(source)}は現在、OSHIRUで一般出品画像を取得できる公式APIを接続していません。商品リンクから画像を確認できます。</small>`;
        else if(provider)fallback.innerHTML='商品画像を読み込めませんでした<small class="image-source-note">公式APIの画像URLを再取得できない場合があります。商品ページでは確認できます。</small>';
      }
    });
  }
  function enhanceProductCards(){markAffiliateCards();protectOfficialImages();renderAccessPanel()}

  const HISTORY_KEY='oshiru-search-history-v1',queryInput=document.getElementById('q'),suggestBox=document.getElementById('suggestBox');
  function historyItems(){try{const p=JSON.parse(persistent.get(HISTORY_KEY,'[]'));return Array.isArray(p)?p.filter(x=>typeof x==='string'&&x.trim()).slice(0,10):[]}catch{return[]}}
  function rememberSearch(value){const q=String(value||'').trim().replace(/\s+/g,' ').slice(0,80);if(!q)return;persistent.set(HISTORY_KEY,JSON.stringify([q,...historyItems().filter(x=>x!==q)].slice(0,10)))}
  function renderSearchHistory(){
    if(!queryInput||!suggestBox||queryInput.value.trim())return;const items=historyItems();if(!items.length){suggestBox.classList.add('hidden');return}
    suggestBox.innerHTML=`<div class="history-toolbar"><b>最近の検索</b><button type="button" class="history-clear" data-history-clear>履歴を削除</button></div>${items.map(q=>`<button type="button" class="suggest-item history-item" data-history-query="${esc(q)}"><span class="history-icon">↺</span><div><b>${esc(q)}</b><small>もう一度検索</small></div></button>`).join('')}`;suggestBox.classList.remove('hidden');
  }
  if(queryInput&&suggestBox){
    queryInput.addEventListener('focus',()=>{if(!queryInput.value.trim())renderSearchHistory()});
    queryInput.addEventListener('input',()=>{if(!queryInput.value.trim())setTimeout(renderSearchHistory,420)});
    queryInput.addEventListener('keydown',e=>{if(e.key==='Enter')rememberSearch(queryInput.value)},true);
    document.getElementById('searchBtn')?.addEventListener('click',()=>rememberSearch(queryInput.value),true);
    document.getElementById('clearQ')?.addEventListener('click',()=>setTimeout(renderSearchHistory,0));
    document.querySelectorAll('.query-chip').forEach(b=>b.addEventListener('click',()=>rememberSearch(b.dataset.query||''),true));
    suggestBox.addEventListener('click',e=>{const clear=e.target.closest('[data-history-clear]');if(clear){e.preventDefault();e.stopPropagation();persistent.remove(HISTORY_KEY);suggestBox.classList.add('hidden');queryInput.focus();return}const h=e.target.closest('[data-history-query]');if(h){e.preventDefault();e.stopPropagation();const q=h.dataset.historyQuery||'';queryInput.value=q;rememberSearch(q);suggestBox.classList.add('hidden');document.getElementById('searchBtn')?.click();return}const s=e.target.closest('[data-suggest]');if(s)rememberSearch(s.dataset.suggest||'')},true);
  }

  const modalContent=document.getElementById('modalContent');if(modalContent)new MutationObserver(()=>setTimeout(enhanceCompare,0)).observe(modalContent,{childList:true,subtree:true});
  const productGrid=document.getElementById('productGrid');if(productGrid)new MutationObserver(()=>setTimeout(enhanceProductCards,0)).observe(productGrid,{childList:true,subtree:true});
  document.getElementById('openCompare')?.addEventListener('click',()=>setTimeout(enhanceCompare,0));
  renderFixedSourceFilters();renderAccessPanel();enhanceProductCards();
})();
