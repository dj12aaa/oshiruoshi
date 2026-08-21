(() => {
  'use strict';
  const INTEREST_KEY='oshiru-interest-signals-v1';
  const MAX_DIMENSION=1600;
  const MAX_UPLOAD_BYTES=5_400_000;

  const categories={
    vtuber:['にじさんじ','nijisanji','ホロライブ','hololive','ぶいすぽ','vspo','vtuber','vチューバー','vチューバ'],
    games:['apex','valorant','原神','スタレ','崩壊','ゼンゼロ','プロセカ','project sekai','ポケモン','pokemon','ゲーム'],
    anime:['呪術','五条悟','ブルーロック','アニメ','漫画','マンガ','manga'],
    character:['サンリオ','sanrio','キティ','シナモロール','クロミ','ポケモン','pokemon'],
    music:['bts','stray kids','スキズ','嵐','arashi','snow man','seventeen','k-pop','kpop','アイドル']
  };

  function readSignals(){
    try{return JSON.parse(localStorage.getItem(INTEREST_KEY)||'{}')||{}}catch{return{}}
  }
  function writeSignals(value){
    try{localStorage.setItem(INTEREST_KEY,JSON.stringify(value))}catch{}
  }
  function recordInterest(text,weight=1){
    const q=String(text||'').trim().toLowerCase();
    if(!q)return;
    const signals=readSignals();
    let changed=false;
    for(const [category,terms] of Object.entries(categories)){
      if(terms.some(term=>q.includes(term.toLowerCase()))){
        signals[category]=Math.min(30,Number(signals[category]||0)+weight);
        changed=true;
      }
    }
    if(changed){signals.updatedAt=Date.now();writeSignals(signals)}
  }

  function addLatestGoodsLinks(){
    const nav=document.querySelector('.header-nav');
    if(nav&&!nav.querySelector('[data-latest-goods-link]')){
      const a=document.createElement('a');
      a.href='/latest-goods';
      a.dataset.latestGoodsLink='1';
      a.textContent='最新グッズ';
      nav.appendChild(a);
    }
    const guide=document.querySelector('.service-guide .guide-links');
    if(guide&&!guide.querySelector('[data-latest-goods-link]')){
      const a=document.createElement('a');
      a.href='/latest-goods';
      a.dataset.latestGoodsLink='1';
      a.textContent='最新グッズ・公式情報';
      guide.prepend(a);
    }
  }

  function optimizeCards(){
    const grid=document.getElementById('productGrid');
    if(!grid)return;
    const tune=()=>{
      const images=[...grid.querySelectorAll('img.market-img')];
      images.forEach((img,index)=>{
        img.decoding='async';
        if(index<4){img.loading='eager';try{img.fetchPriority='high'}catch{}}
        else{img.loading='lazy';try{img.fetchPriority='low'}catch{}}
        if(!img.width)img.width=320;
        if(!img.height)img.height=320;
      });
      grid.querySelectorAll('.card-actions a').forEach(a=>{if(a.textContent!=='商品を見る ↗')a.textContent='商品を見る ↗'});
      grid.querySelectorAll('.source-pill').forEach(p=>{p.title=p.textContent.trim()});
    };
    new MutationObserver(tune).observe(grid,{childList:true,subtree:true});
    tune();
  }

  async function compressImage(file,maxDimension=MAX_DIMENSION,quality=.88){
    let bitmap;
    try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})}
    catch{
      bitmap=await new Promise((resolve,reject)=>{
        const img=new Image(),objectUrl=URL.createObjectURL(file);
        const release=()=>URL.revokeObjectURL(objectUrl);
        img.onload=()=>{release();resolve(img)};
        img.onerror=error=>{release();reject(error)};
        img.src=objectUrl;
      });
    }
    const width=bitmap.width||bitmap.naturalWidth,height=bitmap.height||bitmap.naturalHeight;
    const scale=Math.min(1,maxDimension/Math.max(width,height));
    const outW=Math.max(1,Math.round(width*scale)),outH=Math.max(1,Math.round(height*scale));
    const canvas=document.createElement('canvas');canvas.width=outW;canvas.height=outH;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,outW,outH);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(bitmap,0,0,outW,outH);
    if(bitmap.close)bitmap.close();
    let data=canvas.toDataURL('image/jpeg',quality);
    if(data.length>MAX_UPLOAD_BYTES&&maxDimension>1200)data=await compressImage(file,1200,.82);
    return data;
  }

  function installImageSearch(){
    const btn=document.getElementById('imageSearchBtn');
    if(!btn)return;
    const enable=()=>{
      btn.hidden=false;
      btn.onclick=()=>{
        const modal=document.getElementById('modal'),content=document.getElementById('modalContent');
        if(!modal||!content)return;
        content.innerHTML=`<h2>画像・スクショから探す</h2><p class="lead">画像を検索向けに自動圧縮し、文字やキャラクターの判別に必要な解像度を残したまま解析します。元画像はOSHIRUのデータベースへ保存しません。</p><div class="image-search-zone"><b>画像を選択</b><p style="font-size:12px;color:#64748b;margin:6px 0 10px">スクリーンショット・商品写真に対応。商品やキャラクターが大きく写っている画像ほど精度が上がります。</p><input id="imgInputV6" type="file" accept="image/*"><div id="imgPreviewV6"></div></div>`;
        modal.classList.remove('hidden');
        const input=document.getElementById('imgInputV6');
        input.onchange=async event=>{
          const file=event.target.files?.[0],preview=document.getElementById('imgPreviewV6');
          if(!file)return;
          if(!file.type.startsWith('image/')){preview.textContent='画像ファイルを選択してください。';return}
          if(file.size>20_000_000){preview.textContent='画像が大きすぎます。20MB以下の画像を選択してください。';return}
          preview.innerHTML='<div class="vision-result">画像を検索向けに最適化しています…</div>';
          try{
            const imageData=await compressImage(file);
            preview.innerHTML=`<img src="${imageData}" alt="検索に使用する画像" style="max-height:280px;object-fit:contain"><div class="vision-result">画像を解析しています…</div>`;
            const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
            const response=await fetch('/api/vision-search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({imageData}),signal:controller.signal});
            clearTimeout(timer);
            if(!response.ok)throw new Error(`vision_${response.status}`);
            const result=await response.json(),query=String(result.query||'').trim(),confidence=result.confidence;
            const resultBox=preview.querySelector('.vision-result');
            resultBox.innerHTML=query?`候補: <b>${escapeHtml(query)}</b><br>信頼度: ${escapeHtml(confidence??'不明')}%<br><button id="visionApplyV6">この候補で検索</button>`:'画像から検索語を特定できませんでした。別の画像か、商品部分が大きく写った画像を試してください。';
            if(query){
              document.getElementById('visionApplyV6').onclick=()=>{
                const q=document.getElementById('q');if(q)q.value=query;
                modal.classList.add('hidden');
                recordInterest(query,2);
                const search=document.getElementById('searchBtn');search?.click();
              };
            }
          }catch(error){
            const resultBox=preview.querySelector('.vision-result')||preview;
            resultBox.textContent=error?.name==='AbortError'?'画像解析がタイムアウトしました。もう一度お試しください。':'画像は読み込めましたが、画像検索APIに接続できませんでした。';
          }
        };
      };
    };
    fetch('/api/status',{headers:{accept:'application/json'}}).then(r=>r.ok?r.json():null).then(status=>{if(status?.vision)enable()}).catch(()=>{});
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function installInterestTracking(){
    const search=document.getElementById('searchBtn'),input=document.getElementById('q');
    search?.addEventListener('click',()=>recordInterest(input?.value,1),{capture:true});
    input?.addEventListener('keydown',event=>{if(event.key==='Enter')recordInterest(input.value,1)},{capture:true});
    document.addEventListener('click',event=>{
      const card=event.target.closest('.product-card');
      if(card){
        const title=card.querySelector('.product-title')?.textContent||'';
        recordInterest(`${title} ${input?.value||''}`,.5);
      }
    },{passive:true});
  }

  function init(){
    addLatestGoodsLinks();
    optimizeCards();
    installInterestTracking();
    installImageSearch();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
