(() => {
  'use strict';
  const SIGNAL_KEY='oshiru-interest-signals-v1';
  const PREF_KEY='oshiru-latest-preferences-v1';
  const categories=['vtuber','games','anime','character','music'];

  function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function selectedPrefs(){const value=readJson(PREF_KEY,[]);return Array.isArray(value)?value.filter(x=>categories.includes(x)):[]}
  function setPrefs(value){writeJson(PREF_KEY,[...new Set(value.filter(x=>categories.includes(x)))])}

  function scores(){
    const signals=readJson(SIGNAL_KEY,{}),prefs=selectedPrefs(),out={};
    for(const category of categories)out[category]=Number(signals[category]||0)+(prefs.includes(category)?12:0);
    return out;
  }
  function scoreElement(el,map){
    const cats=String(el.dataset.category||'').split(/\s+/).filter(Boolean);
    return cats.reduce((sum,c)=>sum+(map[c]||0),0)+Number(el.dataset.priority||0);
  }

  function renderForYou(){
    const host=document.getElementById('forYouGrid');if(!host)return;
    const map=scores(),candidates=[...document.querySelectorAll('#latestHighlights .latest-card')];
    const ranked=candidates.sort((a,b)=>scoreElement(b,map)-scoreElement(a,map));
    host.innerHTML='';
    for(const card of ranked.slice(0,4))host.append(card.cloneNode(true));
    const hasSignals=Object.values(map).some(v=>v>0);
    const label=document.getElementById('forYouState');
    if(label)label.textContent=hasSignals?'この端末の興味傾向を反映しています':'初回はカテゴリを横断して表示しています';
  }

  function syncPreferenceButtons(){
    const prefs=new Set(selectedPrefs());
    document.querySelectorAll('[data-interest]').forEach(button=>{
      const active=prefs.has(button.dataset.interest);button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');
    });
  }
  function installPreferences(){
    document.querySelectorAll('[data-interest]').forEach(button=>button.addEventListener('click',()=>{
      const prefs=new Set(selectedPrefs()),cat=button.dataset.interest;
      prefs.has(cat)?prefs.delete(cat):prefs.add(cat);setPrefs([...prefs]);syncPreferenceButtons();renderForYou();
    }));
    document.getElementById('personalReset')?.addEventListener('click',()=>{setPrefs([]);syncPreferenceButtons();renderForYou()});
    syncPreferenceButtons();
  }

  function installFilters(){
    const buttons=[...document.querySelectorAll('[data-category-filter]')],cards=[...document.querySelectorAll('.official-source-card')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const filter=button.dataset.categoryFilter;
      buttons.forEach(x=>x.classList.toggle('active',x===button));
      cards.forEach(card=>{
        const visible=filter==='all'||String(card.dataset.category||'').split(/\s+/).includes(filter);
        card.classList.toggle('source-hidden',!visible);
      });
    }));
  }

  function installSourceLearning(){
    document.addEventListener('click',event=>{
      const card=event.target.closest('[data-category]');if(!card)return;
      const cat=String(card.dataset.category||'').split(/\s+/)[0];if(!categories.includes(cat))return;
      const signals=readJson(SIGNAL_KEY,{});signals[cat]=Math.min(30,Number(signals[cat]||0)+.5);signals.updatedAt=Date.now();writeJson(SIGNAL_KEY,signals);
    },{passive:true});
  }

  function init(){installPreferences();installFilters();installSourceLearning();renderForYou()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
