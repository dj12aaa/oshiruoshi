(() => {
  'use strict';

  const FAVORITE_IDS_KEY='oshiru-v5-favs';
  const FAVORITE_ITEMS_KEY='oshiru-favorite-items-v2';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  function readJson(key,fallback=[]){
    try{const v=JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));return v??fallback}catch{return fallback}
  }
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function favoriteIds(){return new Set(readJson(FAVORITE_IDS_KEY,[]).map(String))}
  function favoriteItems(){const v=readJson(FAVORITE_ITEMS_KEY,[]);return Array.isArray(v)?v:[]}

  function text(card,selector){return card.querySelector(selector)?.textContent?.trim()||''}
  function conditionFrom(card){
    const nodes=[...card.querySelectorAll('.cost-row span')];
    const label=nodes.find(x=>x.textContent.trim()==='状態');
    return label?.nextElementSibling?.textContent?.trim()||'要確認';
  }
  function snapshotFromCard(card,id){
    if(!card)return null;
    const link=card.querySelector('.card-actions a[href]');
    const img=card.querySelector('img.market-img');
    const status=card.querySelector('.tag-row .tag.live,.tag-row .tag.ended')?.textContent?.trim()||'要確認';
    return{
      id:String(id),
      title:text(card,'.product-title')||'商品名不明',
      source:text(card,'.source-pill')||'販売サイト',
      status,
      condition:conditionFrom(card),
      price:text(card,'.main-price')||'不明',
      shipping:text(card,'.ship')||'送料・総額は要確認',
      meta:text(card,'.meta-line'),
      image:img?.src||'',
      url:link?.href||'',
      checkedAt:text(card,'.verified span:last-child').replace(/^確認\s*/,''),
      savedAt:new Date().toISOString()
    };
  }

  function upsertFavorite(item){
    if(!item)return;
    const items=favoriteItems().filter(x=>String(x.id)!==String(item.id));
    items.unshift(item);
    writeJson(FAVORITE_ITEMS_KEY,items.slice(0,100));
  }
  function removeFavoriteSnapshot(id){
    writeJson(FAVORITE_ITEMS_KEY,favoriteItems().filter(x=>String(x.id)!==String(id)));
  }
  function syncVisibleFavorites(){
    const ids=favoriteIds();
    $$('.product-card[data-card-id]').forEach(card=>{
      const id=String(card.dataset.cardId||'');
      if(id&&ids.has(id))upsertFavorite(snapshotFromCard(card,id));
    });
  }

  function favoriteStatusClass(status){
    const s=String(status||'');
    if(/販売中|受付中|募集中|候補/.test(s))return'fav-status-live';
    if(/在庫なし|終了|売切/.test(s))return'fav-status-off';
    return'fav-status-check';
  }

  function openFavorites(){
    syncVisibleFavorites();
    const ids=favoriteIds();
    const known=favoriteItems().filter(x=>ids.has(String(x.id)));
    const missing=Math.max(0,ids.size-known.length);
    const modal=$('#modal');
    const content=$('#modalContent');
    if(!modal||!content)return;

    const cards=known.map(item=>`
      <article class="favorite-item" data-favorite-id="${escapeHtml(item.id)}">
        <div class="favorite-media">
          ${item.image?`<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" data-favorite-preview>`:`<div class="favorite-noimage">画像なし</div>`}
        </div>
        <div class="favorite-info">
          <div class="favorite-source">${escapeHtml(item.source)}</div>
          <h3>${escapeHtml(item.title)}</h3>
          ${item.meta?`<p class="favorite-meta">${escapeHtml(item.meta)}</p>`:''}
          <div class="favorite-state-row">
            <span class="favorite-status ${favoriteStatusClass(item.status)}">${escapeHtml(item.status)}</span>
            <span class="favorite-condition">${escapeHtml(item.condition)}</span>
          </div>
          <div class="favorite-price-row"><b>${escapeHtml(item.price)}</b><span>${escapeHtml(item.shipping)}</span></div>
          <div class="favorite-checked">最終確認 ${escapeHtml(item.checkedAt||'保存時点')}</div>
          <div class="favorite-actions">
            ${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">商品ページで最新状態を確認 ↗</a>`:''}
            <button type="button" data-favorite-search="${escapeHtml(item.title)}">同じ商品名で検索</button>
          </div>
        </div>
      </article>`).join('');

    content.innerHTML=`
      <div class="favorite-view-head">
        <div><span class="favorite-eyebrow">MY OSHIRU</span><h2>お気に入り</h2><p>保存した商品の価格・販売状態をまとめて確認できます。</p></div>
        <div class="favorite-total"><b>${ids.size}</b><span>件</span></div>
      </div>
      ${known.length?`<div class="favorite-grid">${cards}</div>`:`<div class="favorite-empty"><b>お気に入りはまだありません</b><p>商品カードの♡を押すと、ここに商品を保存できます。</p></div>`}
      ${missing?`<div class="favorite-migration">以前のバージョンで保存した ${missing} 件は商品詳細が保存されていません。該当商品が検索結果に再表示されると、自動的に詳細情報へ移行します。</div>`:''}
      <p class="favorite-note">価格・在庫・商品状態は変動します。購入前には販売元の商品ページで最新情報を確認してください。</p>`;

    content.querySelectorAll('[data-favorite-search]').forEach(btn=>btn.addEventListener('click',()=>{
      const q=$('#q');
      if(q){q.value=btn.dataset.favoriteSearch||'';modal.classList.add('hidden');$('#searchBtn')?.click()}
    }));
    modal.classList.remove('hidden');
  }

  function openImagePreview(img){
    const card=img.closest('.product-card');
    const modal=$('#modal');
    const content=$('#modalContent');
    if(!modal||!content)return;
    const title=text(card,'.product-title')||img.alt||'商品画像';
    const source=text(card,'.source-pill');
    const link=card?.querySelector('.card-actions a[href]')?.href||'';
    content.innerHTML=`
      <div class="image-preview-head"><span>${escapeHtml(source)}</span><h2>${escapeHtml(title)}</h2></div>
      <div class="image-preview-stage"><img src="${escapeHtml(img.src)}" alt="${escapeHtml(title)}"></div>
      ${link?`<div class="image-preview-action"><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">商品ページを見る ↗</a></div>`:''}`;
    modal.classList.remove('hidden');
  }

  document.addEventListener('click',event=>{
    const heart=event.target.closest('.heart[data-fav]');
    if(heart){
      const id=String(heart.dataset.fav||'');
      const removing=heart.classList.contains('on');
      if(removing)removeFavoriteSnapshot(id);
      else upsertFavorite(snapshotFromCard(heart.closest('.product-card'),id));
      window.setTimeout(syncVisibleFavorites,30);
      return;
    }
    const img=event.target.closest('.product-card img.market-img');
    if(img){event.preventDefault();openImagePreview(img)}
  },true);

  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('.product-card img.market-img')){
      event.preventDefault();openImagePreview(event.target);
    }
  });

  const favoritesBtn=$('#favoritesBtn');
  if(favoritesBtn){
    favoritesBtn.setAttribute('aria-label','お気に入り一覧を開く');
    favoritesBtn.addEventListener('click',event=>{
      event.preventDefault();event.stopImmediatePropagation();openFavorites();
    },true);
  }

  const grid=$('#productGrid');
  if(grid){
    new MutationObserver(()=>{
      window.setTimeout(()=>{
        $$('.product-card img.market-img').forEach(img=>{
          img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',`${img.alt||'商品画像'}を拡大表示`);
        });
        syncVisibleFavorites();
      },0);
    }).observe(grid,{childList:true,subtree:true});
  }

  window.setTimeout(syncVisibleFavorites,500);
})();
