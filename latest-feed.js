(() => {
  'use strict';
  const VERSION='2026-09-08.23',REFRESH_MS=300000,MAX_AGE_MS=600000;
  function init(){
    const root=document.getElementById('liveGoods'),rail=document.getElementById('liveGoodsRail');if(!root||!rail)return;
    const status=document.getElementById('liveGoodsStatus'),sourceStatus=document.getElementById('liveGoodsSources'),toggle=document.getElementById('liveGoodsToggle'),counter=document.getElementById('liveGoodsCounter'),refresh=document.getElementById('liveGoodsRefresh');
    const categoryButtons=[...root.querySelectorAll('[data-feed-category]')];
    const categories=['vtuber','anime','games','character','music'],batches=new Map(),controllers=new Set();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let selected='all',paused=reduced,interacting=false,loading=false,sequence=0,lastAttempt=0,failed=0;
    const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return''}};
    const timestamp=value=>{const date=new Date(value);return Number.isFinite(+date)?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(date):'確認時刻不明'};
    const cards=()=>[...rail.querySelectorAll('[data-feed-item]')];
    const itemLeft=card=>card.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft;
    const currentIndex=()=>{let best=0,distance=Infinity;cards().forEach((card,index)=>{const d=Math.abs(itemLeft(card)-rail.scrollLeft);if(d<distance){best=index;distance=d}});return best};
    function paint(){const count=cards().length;counter.textContent=count?`${currentIndex()+1} / ${count}`:'0 / 0';toggle.textContent=paused?'自動再生':'停止';toggle.setAttribute('aria-pressed',String(paused));toggle.disabled=count<2}
    function move(delta){const list=cards();if(list.length<2)return;const index=currentIndex(),atEnd=rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-3;const next=delta>0&&atEnd?0:(index+delta+list.length)%list.length;rail.scrollTo({left:itemLeft(list[next]),behavior:reduced?'auto':'smooth'})}
    function items(){
      const groups=categories.filter(category=>selected==='all'||selected===category).map(category=>(batches.get(category)?.items||[]).filter(item=>Date.now()-Date.parse(item.verifiedAt)<MAX_AGE_MS));
      const result=[],seen=new Set();
      for(let i=0;i<8;i++)for(const group of groups){const item=group[i];if(item&&!seen.has(item.id)){seen.add(item.id);result.push(item)}}
      return result;
    }
    function render(){
      for(const card of cards())if(Date.now()-Date.parse(card.dataset.verifiedAt)>=MAX_AGE_MS)card.remove();
      const list=items(),focused=rail.contains(document.activeElement);
      // Keep keyboard focus and a user's current slide stable during refresh.
      if(!focused){
        const oldId=cards()[currentIndex()]?.dataset.feedItem;
        rail.innerHTML=list.map(item=>{
          const url=safeUrl(item.url),image=safeUrl(item.image);if(!url||!image)return'';
          const price=typeof item.price==='number'&&Number.isFinite(item.price)?`¥${item.price.toLocaleString('ja-JP')}`:'価格は販売元で確認';
          return `<article class="feed-card" data-feed-item="${escape(item.id)}" data-verified-at="${escape(item.verifiedAt)}" data-feed-category="${escape(item.category)}"><a class="feed-image" href="${escape(url)}" target="_blank" rel="noopener noreferrer${item.affiliate?' sponsored':''}"><img src="${escape(image)}" alt="${escape(item.title)}" width="300" height="300" loading="lazy" decoding="async"><span class="feed-image-fallback" hidden>画像を取得できません<br>販売元で確認 ↗</span></a><div class="feed-card-body"><p class="feed-source">${escape(item.source)}${item.affiliate?' · PR':''}</p><h3><a href="${escape(url)}" target="_blank" rel="noopener noreferrer${item.affiliate?' sponsored':''}">${escape(item.title)}</a></h3><p class="feed-shop">${escape(item.shop)}</p><p class="feed-price">${escape(price)} <small>${escape(item.condition||'状態要確認')}</small></p><p class="feed-time">取得 ${escape(timestamp(item.verifiedAt))} JST</p><a class="feed-compare" href="/?q=${encodeURIComponent(item.query)}">同じ推しの商品を比較 →</a></div></article>`;
        }).join('');
        for(const img of rail.querySelectorAll('img'))img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false},{once:true});
        const previous=cards().find(card=>card.dataset.feedItem===oldId);if(previous)rail.scrollTo({left:itemLeft(previous),behavior:'instant'});
      }
      const count=list.length,partial=failed>0||[...batches.values()].some(batch=>batch.partial);
      status.textContent=loading?(count?`${count}件を表示・ほかの販売元も取得中…`:'販売元の画像付き商品を取得しています…'):count?`${count}件を表示${partial?' · 一部の取得元は利用できません':''}`:'画像付き商品を取得できませんでした。下の公式リンク・Yahoo!検索・Google検索も利用できます。';
      root.setAttribute('aria-busy',String(loading));root.dataset.feedState=loading?'loading':count?'ready':'unavailable';
      const states=new Map();
      for(const batch of batches.values())for(const [name,value] of Object.entries(batch.providers||{}))states.set(name,(states.get(name)||false)||value.ok===true);
      sourceStatus.textContent=[...states].map(([name,ok])=>`${name==='rakuten'?'楽天市場':'Yahoo!ショッピング'}：${ok?'応答あり':'取得制限・未設定'}`).join(' / ');
      refresh.disabled=loading;paint();
    }
    async function update(){
      if(loading||document.hidden)return;
      loading=true;failed=0;lastAttempt=Date.now();const seq=++sequence;render();
      await Promise.all(categories.map(async category=>{
        const controller=new AbortController();controllers.add(controller);const timer=setTimeout(()=>controller.abort(),10000);
        try{
          const response=await fetch(`/api/search?feed=latest&category=${category}`,{signal:controller.signal});
          if(!response.ok)throw new Error('unavailable');const data=await response.json();
          if(data.feedVersion!==VERSION||!Array.isArray(data.items))throw new Error('invalid_feed');
          if(seq===sequence)batches.set(category,data);
        }catch{if(seq===sequence)failed++}
        finally{clearTimeout(timer);controllers.delete(controller);if(seq===sequence)render()}
      }));
      if(seq===sequence){loading=false;render()}
    }
    categoryButtons.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.feedCategory;categoryButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));rail.scrollTo({left:0,behavior:'instant'});render()}));
    toggle.addEventListener('click',()=>{paused=!paused;paint()});refresh.addEventListener('click',update);
    document.getElementById('liveGoodsPrev').addEventListener('click',()=>move(-1));document.getElementById('liveGoodsNext').addEventListener('click',()=>move(1));
    rail.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowLeft'?-1:1)}});
    rail.addEventListener('scroll',paint,{passive:true});
    rail.addEventListener('pointerenter',()=>{interacting=true});rail.addEventListener('pointerleave',()=>{interacting=false});
    rail.addEventListener('pointerdown',()=>{interacting=true},{passive:true});
    rail.addEventListener('pointerup',()=>{interacting=false},{passive:true});rail.addEventListener('pointercancel',()=>{interacting=false},{passive:true});
    rail.addEventListener('focusin',()=>{interacting=true});rail.addEventListener('focusout',()=>{interacting=false;queueMicrotask(()=>{if(!rail.contains(document.activeElement))render()})});
    const slideTimer=setInterval(()=>{if(!paused&&!interacting&&!document.hidden)move(1)},4200);
    const refreshTimer=setInterval(()=>{if(Date.now()-lastAttempt>=REFRESH_MS&&!interacting)update()},15000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastAttempt>=REFRESH_MS)update()});
    window.addEventListener('pagehide',event=>{sequence++;loading=false;controllers.forEach(controller=>controller.abort());if(!event.persisted){clearInterval(slideTimer);clearInterval(refreshTimer)}});
    window.addEventListener('pageshow',event=>{if(event.persisted)update()});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
