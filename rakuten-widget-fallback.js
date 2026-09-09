(()=>{
  'use strict';
  const ad=document.getElementById('rakutenPictAd');
  const img=document.getElementById('rakutenPictImage');
  if(!ad||!img)return;
  const fail=()=>{ad.classList.add('failed');ad.querySelector('.fallback')?.setAttribute('aria-hidden','false')};
  const inspect=()=>{if(img.naturalWidth<20||img.naturalHeight<10)fail()};
  img.addEventListener('error',fail,{once:true});
  img.addEventListener('load',inspect,{once:true});
  if(img.complete)inspect();
  setTimeout(()=>{if(!img.complete||img.naturalWidth===0)fail()},6000);
})();
