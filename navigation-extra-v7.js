(() => {
  'use strict';
  const imageIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m5 17 4.2-4 3.1 2.7 2.4-2.1L19 17"/><path d="M18.5 2.8v4M16.5 4.8h4"/></svg>';
  const newsIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a2 2 0 0 1 2 2v14H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M18 8h3v9a3 3 0 0 1-3 3M7 8h7M7 12h7M7 16h4"/></svg>';

  function install(){
    const actions=document.querySelector('#utilityDock .dock-actions');if(!actions||actions.dataset.extraV7==='1')return false;
    actions.dataset.extraV7='1';
    const results=actions.querySelector('[data-dock="results"]');
    const image=document.createElement('button');
    image.type='button';image.className='dock-item';image.dataset.dock='image-search';image.dataset.openImageSearch='1';
    image.innerHTML=`${imageIcon}<span>画像検索</span>`;
    const latest=document.createElement('a');
    latest.className='dock-item';latest.dataset.dock='latest-goods';latest.href='/latest-goods';
    latest.innerHTML=`${newsIcon}<span>最新グッズ</span>`;
    if(location.pathname==='/latest-goods'||location.pathname==='/latest-goods.html'){latest.setAttribute('aria-current','page');latest.classList.add('current')}
    if(results){results.insertAdjacentElement('afterend',latest);results.insertAdjacentElement('afterend',image)}
    else actions.prepend(latest,image);
    const foot=document.querySelector('#utilityDock .dock-mobile-foot');if(foot)foot.textContent='商品検索・画像検索・最新グッズ・比較をここからすぐ操作できます。';
    image.addEventListener('click',event=>{
      event.preventDefault();
      const existing=document.getElementById('imageSearchBtn');
      if(existing){existing.click();return}
      if(document.querySelector('[data-open-image-search]')!==image){document.querySelector('[data-open-image-search]')?.click();return}
      location.href='/?imageSearch=1';
    });
    return true;
  }
  if(install())return;
  const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
})();
