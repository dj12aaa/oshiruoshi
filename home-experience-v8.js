(() => {
  'use strict';
  const INTEREST_KEY='oshiru-interest-signals-v1';
  const MAX_DIMENSION=1600;
  const MAX_UPLOAD_CHARS=5_400_000;
  const categories={
    vtuber:['にじさんじ','nijisanji','ホロライブ','hololive','ぶいすぽ','vspo','vtuber'],
    games:['apex','valorant','原神','スタレ','崩壊','ゼンゼロ','プロセカ','pokemon','ポケモン'],
    anime:['呪術','五条悟','ブルーロック','ナルト','naruto','アニメ','漫画'],
    character:['サンリオ','sanrio','キティ','シナモロール','クロミ','ポケモン'],
    music:['bts','stray kids','スキズ','嵐','arashi','snow man','seventeen','k-pop','アイドル']
  };
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function readSignals(){try{return JSON.parse(localStorage.getItem(INTEREST_KEY)||'{}')||{}}catch{return{}}}
  function recordInterest(text,weight=1){
    const q=String(text||'').trim().toLowerCase();if(!q)return;
    const signals=readSignals();let changed=false;
    for(const [category,terms] of Object.entries(categories))if(terms.some(term=>q.includes(term.toLowerCase()))){signals[category]=Math.min(40,Number(signals[category]||0)+weight);changed=true}
    if(changed){signals.updatedAt=Date.now();try{localStorage.setItem(INTEREST_KEY,JSON.stringify(signals))}catch{}}
  }

  function removeLegacySourcePanel(){
    const purge=()=>document.getElementById('sourceAccessPanel')?.remove();
    purge();
    const host=document.querySelector('.result-area')||document.body;
    new MutationObserver(purge).observe(host,{childList:true});
  }

  function normalizeControls(card){
    const heart=card.querySelector('.heart[data-fav]');
    if(heart){
      const active=heart.classList.contains('on');
      heart.textContent=active?'♥':'♡';
      heart.setAttribute('aria-label',active?'お気に入りから外す':'お気に入りに追加');
      heart.title=active?'お気に入りから外す':'お気に入りに追加';
    }
    const compare=card.querySelector('[data-compare]');
    if(compare){
      const active=compare.classList.contains('is-selected')||compare.getAttribute('aria-pressed')==='true';
      compare.textContent=active?'✓':'＋';
      compare.setAttribute('aria-label',active?'比較から外す':'比較に追加');
      compare.setAttribute('aria-pressed',active?'true':'false');
      compare.title=active?'比較から外す':'比較に追加';
    }
  }
  function enhanceCard(card,index=0){
    if(!card)return;
    normalizeControls(card);
    const visual=card.querySelector('.visual'),title=card.querySelector('.product-title'),mainPrice=card.querySelector('.main-price');
    const productLink=card.querySelector('.card-actions a[href]'),compare=card.querySelector('[data-compare]'),image=card.querySelector('img.market-img');
    if(visual){
      if(!visual.dataset.galleryV8){
        visual.dataset.galleryV8='1';visual.tabIndex=0;visual.setAttribute('role','link');visual.setAttribute('aria-label',`${title?.textContent?.trim()||'商品'}の商品ページを開く`);
        const openProduct=event=>{
          if(event.target.closest('button,a'))return;
          const href=productLink?.href;if(!href)return;
          recordInterest(`${title?.textContent||''} ${document.getElementById('q')?.value||''}`,.4);
          window.open(href,'_blank','noopener,noreferrer');
        };
        visual.addEventListener('click',openProduct);
        visual.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct(event)}});
      }
      let price=visual.querySelector('.gallery-price');
      if(!price&&mainPrice){price=document.createElement('span');price.className='gallery-price';visual.appendChild(price)}
      if(price&&mainPrice)price.textContent=(mainPrice.textContent||'価格不明').trim()||'価格不明';
      if(compare){compare.classList.add('gallery-compare');if(compare.parentElement!==visual)visual.appendChild(compare)}
    }
    if(title&&productLink&&!title.dataset.galleryV8){
      title.dataset.galleryV8='1';title.tabIndex=0;title.setAttribute('role','link');
      title.addEventListener('click',()=>window.open(productLink.href,'_blank','noopener,noreferrer'));
      title.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();window.open(productLink.href,'_blank','noopener,noreferrer')}});
    }
    if(image){
      image.decoding='async';const eager=index<(matchMedia('(max-width:520px)').matches?6:10);image.loading=eager?'eager':'lazy';
      try{image.fetchPriority=eager?'high':'low'}catch{}image.width=320;image.height=320;
    }
  }
  function optimizeGallery(){
    const grid=document.getElementById('productGrid');if(!grid)return;
    const tune=()=>[...grid.querySelectorAll('.product-card')].forEach(enhanceCard);
    new MutationObserver(tune).observe(grid,{childList:true,subtree:true,characterData:true});tune();
  }

  async function decodeImage(file){
    try{return{bitmap:await createImageBitmap(file,{imageOrientation:'from-image'}),url:null}}
    catch{return await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>resolve({bitmap:img,url});img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image_decode_failed'))};img.src=url})}
  }
  async function compressImage(file,maxDimension=MAX_DIMENSION,quality=.86){
    const decoded=await decodeImage(file),bitmap=decoded.bitmap;
    try{
      const width=bitmap.width||bitmap.naturalWidth,height=bitmap.height||bitmap.naturalHeight;if(!width||!height)throw new Error('image_dimensions_missing');
      const scale=Math.min(1,maxDimension/Math.max(width,height)),outW=Math.max(1,Math.round(width*scale)),outH=Math.max(1,Math.round(height*scale));
      const canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('canvas_unavailable');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,outW,outH);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,outW,outH);
      const data=canvas.toDataURL('image/jpeg',quality);if(data.length>MAX_UPLOAD_CHARS&&maxDimension>1200)return compressImage(file,1200,.80);return data;
    }finally{if(typeof bitmap.close==='function')bitmap.close();if(decoded.url)URL.revokeObjectURL(decoded.url)}
  }

  function ensureModal(){
    let modal=document.getElementById('modal'),content=document.getElementById('modalContent');
    if(!modal||!content){
      modal=document.createElement('div');modal.id='modal';modal.className='modal hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
      modal.innerHTML='<div class="modal-card"><button id="modalCloseV8" class="modal-close" type="button" aria-label="閉じる">×</button><div id="modalContent"></div></div>';document.body.appendChild(modal);content=modal.querySelector('#modalContent');
      modal.querySelector('#modalCloseV8')?.addEventListener('click',()=>modal.classList.add('hidden'));
    }
    return{modal,content};
  }
  function closeImageSearch(modal){modal.classList.add('hidden');modal.classList.remove('image-search-open')}
  async function visionStatus(){
    try{const r=await fetch('/api/status',{headers:{accept:'application/json'}});if(!r.ok)return false;return Boolean((await r.json())?.vision)}catch{return false}
  }
  async function openImageSearch(){
    const {modal,content}=ensureModal();modal.classList.add('image-search-open');
    content.innerHTML=`<div class="image-search-head"><div><span class="image-search-eyebrow">IMAGE SEARCH</span><h2>画像・スクショからグッズを探す</h2><p class="lead">画像を端末内で検索向けに圧縮してから解析します。商品・キャラクター・作品名が大きく写っている画像ほど検索語を特定しやすくなります。</p></div></div><div class="image-search-zone"><b>画像を選択</b><p class="image-search-help">スクリーンショット・商品写真に対応 / 20MB以下</p><input id="imgInputV8" type="file" accept="image/*"><div id="visionStatusV8" class="vision-api-state">画像解析APIを確認しています…</div><div id="imgPreviewV8"></div></div>`;
    modal.classList.remove('hidden');
    const closeButton=modal.querySelector('.modal-close,#modalClose,#modalCloseV7,#modalCloseV8');
    closeButton?.addEventListener('click',()=>modal.classList.remove('image-search-open'),{once:true});
    const configured=await visionStatus();const status=document.getElementById('visionStatusV8');if(status)status.textContent=configured?'画像解析API：利用可能':'画像解析API：未設定（OPENAI_API_KEY が必要です）';
    const input=document.getElementById('imgInputV8');
    input?.addEventListener('change',async event=>{
      const file=event.target.files?.[0],preview=document.getElementById('imgPreviewV8');if(!file||!preview)return;
      if(!file.type.startsWith('image/')){preview.textContent='画像ファイルを選択してください。';return}
      if(file.size>20_000_000){preview.textContent='画像が大きすぎます。20MB以下の画像を選択してください。';return}
      preview.innerHTML='<div class="vision-result">画像を最適化しています…</div>';
      try{
        const imageData=await compressImage(file);
        preview.innerHTML=`<img class="image-search-preview" src="${imageData}" alt="検索に使用する画像"><div class="vision-result">${configured?'画像を解析しています…':'画像の準備ができました。AI解析には OPENAI_API_KEY の設定が必要です。'}</div>`;
        if(!configured)return;
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);let response;
        try{response=await fetch('/api/vision-search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({imageData}),signal:controller.signal})}finally{clearTimeout(timer)}
        if(!response.ok)throw new Error(`vision_${response.status}`);
        const result=await response.json(),query=String(result.query||'').trim(),confidence=result.confidence,box=preview.querySelector('.vision-result');
        if(!query){box.textContent='検索語を特定できませんでした。商品やキャラクターがより大きく写った画像を試してください。';return}
        box.innerHTML=`候補: <b>${escapeHtml(query)}</b><br>信頼度: ${escapeHtml(confidence??'不明')}%<br><button id="visionApplyV8" type="button">この候補で商品検索</button>`;
        document.getElementById('visionApplyV8')?.addEventListener('click',()=>{recordInterest(query,2);closeImageSearch(modal);const q=document.getElementById('q');if(q){q.value=query;document.getElementById('searchBtn')?.click()}else location.href=`/?q=${encodeURIComponent(query)}`});
      }catch(error){const box=preview.querySelector('.vision-result')||preview;box.textContent=error?.name==='AbortError'?'画像解析がタイムアウトしました。もう一度お試しください。':'画像は読み込めましたが、画像解析APIに接続できませんでした。'}
    });
  }
  function installImageSearch(){
    const button=document.getElementById('imageSearchBtn');if(button)button.hidden=false;
    document.addEventListener('click',event=>{const trigger=event.target.closest('#imageSearchBtn,[data-open-image-search]');if(!trigger)return;event.preventDefault();event.stopImmediatePropagation();openImageSearch()},true);
    try{if(new URLSearchParams(location.search).get('imageSearch')==='1')setTimeout(openImageSearch,80)}catch{}
  }
  function installInterestTracking(){const search=document.getElementById('searchBtn'),input=document.getElementById('q');search?.addEventListener('click',()=>recordInterest(input?.value,1),{capture:true});input?.addEventListener('keydown',event=>{if(event.key==='Enter')recordInterest(input.value,1)},{capture:true})}
  function init(){removeLegacySourcePanel();optimizeGallery();installImageSearch();installInterestTracking()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
