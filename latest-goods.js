(() => {
  'use strict';
  const SIGNAL_KEY='oshiru-interest-signals-v1';
  const PREF_KEY='oshiru-latest-preferences-v1';
  const categories=['vtuber','games','anime','character','music'];
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
  const writeJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const selectedPrefs=()=>{const value=readJson(PREF_KEY,[]);return Array.isArray(value)?value.filter(x=>categories.includes(x)):[]};
  const setPrefs=value=>writeJson(PREF_KEY,[...new Set(value.filter(x=>categories.includes(x)))]);

  function scores(){
    const signals=readJson(SIGNAL_KEY,{}),prefs=selectedPrefs(),out={};
    for(const category of categories)out[category]=Number(signals[category]||0)+(prefs.includes(category)?12:0);
    return out;
  }
  function scoreElement(el,map){const cats=String(el.dataset.category||'').split(/\s+/).filter(Boolean);return cats.reduce((sum,c)=>sum+(map[c]||0),0)+Number(el.dataset.priority||0)}
  function renderForYou(){
    const host=document.getElementById('forYouGrid');if(!host)return;
    const map=scores(),candidates=[...document.querySelectorAll('#latestHighlights .latest-card')];
    candidates.sort((a,b)=>scoreElement(b,map)-scoreElement(a,map));host.replaceChildren(...candidates.slice(0,4).map(card=>card.cloneNode(true)));
    const hasSignals=Object.values(map).some(v=>v>0),label=document.getElementById('forYouState');
    if(label)label.textContent=hasSignals?'この端末の興味傾向を反映しています':'初回はカテゴリを横断して表示しています';
  }
  function syncPreferenceButtons(){
    const prefs=new Set(selectedPrefs());
    document.querySelectorAll('[data-interest]').forEach(button=>{const active=prefs.has(button.dataset.interest);button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false')});
  }
  function installPreferences(){
    document.querySelectorAll('[data-interest]').forEach(button=>button.addEventListener('click',()=>{
      const prefs=new Set(selectedPrefs()),cat=button.dataset.interest;prefs.has(cat)?prefs.delete(cat):prefs.add(cat);setPrefs([...prefs]);syncPreferenceButtons();renderForYou();
    }));
    document.getElementById('personalReset')?.addEventListener('click',()=>{setPrefs([]);syncPreferenceButtons();renderForYou()});syncPreferenceButtons();
  }
  function installFilters(){
    const buttons=[...document.querySelectorAll('[data-category-filter]')],cards=[...document.querySelectorAll('.official-source-card')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const filter=button.dataset.categoryFilter;buttons.forEach(x=>x.classList.toggle('active',x===button));
      cards.forEach(card=>card.classList.toggle('source-hidden',!(filter==='all'||String(card.dataset.category||'').split(/\s+/).includes(filter))));
    }));
  }
  function installSourceLearning(){
    document.addEventListener('click',event=>{
      const card=event.target.closest('[data-category]');if(!card)return;
      const cat=String(card.dataset.category||'').split(/\s+/)[0];if(!categories.includes(cat))return;
      const signals=readJson(SIGNAL_KEY,{});signals[cat]=Math.min(40,Number(signals[cat]||0)+.5);signals.updatedAt=Date.now();writeJson(SIGNAL_KEY,signals);
    },{passive:true});
  }

  function installOfficialRail(){
    const rail=document.querySelector('[data-official-rail]'),cards=rail?[...rail.querySelectorAll('.official-preview-card')]:[];
    if(!rail||cards.length<2)return;
    const dots=[...document.querySelectorAll('[data-rail-dot]')];
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toggle=document.getElementById('railToggle'),stateLabel=document.getElementById('railState');
    let timer=null,manualPaused=reduced,interacting=false;
    const nearestIndex=()=>{
      const left=rail.scrollLeft;let best=0,delta=Infinity;
      cards.forEach((card,index)=>{const d=Math.abs(card.offsetLeft-left);if(d<delta){delta=d;best=index}});return best;
    };
    const paint=()=>{const index=nearestIndex();dots.forEach((dot,i)=>dot.classList.toggle('active',i===index))};
    const syncState=()=>{
      if(toggle){toggle.textContent=manualPaused?'再生':'停止';toggle.setAttribute('aria-pressed',manualPaused?'true':'false')}
      if(stateLabel)stateLabel.textContent=manualPaused?(reduced?'動きを抑える設定により停止中':'自動スライド停止中'):interacting?'操作中は一時停止':'自動スライド中';
    };
    const advance=()=>{
      if(manualPaused||interacting||document.hidden)return;
      const index=nearestIndex(),next=index>=cards.length-1?0:index+1;
      rail.scrollTo({left:cards[next].offsetLeft,behavior:'smooth'});setTimeout(paint,480);
    };
    const start=()=>{clearInterval(timer);if(!manualPaused)timer=setInterval(advance,4200);syncState()};
    const pause=()=>{interacting=true;syncState()};const resume=()=>{interacting=false;start()};
    rail.addEventListener('scroll',()=>requestAnimationFrame(paint),{passive:true});
    rail.addEventListener('pointerenter',pause);rail.addEventListener('pointerleave',resume);
    rail.addEventListener('pointerdown',pause,{passive:true});rail.addEventListener('pointerup',()=>setTimeout(resume,1000),{passive:true});
    rail.addEventListener('focusin',pause);rail.addEventListener('focusout',resume);
    toggle?.addEventListener('click',()=>{manualPaused=!manualPaused;start()});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(timer);else start()});
    cards.forEach(card=>card.querySelector('img')?.addEventListener('error',event=>{event.currentTarget.classList.add('is-failed');card.classList.add('image-failed')},{once:true}));
    paint();start();
  }

  function init(){installPreferences();installFilters();installSourceLearning();renderForYou();installOfficialRail()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
