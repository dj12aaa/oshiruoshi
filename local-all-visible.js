(() => {
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  function unhideKnown(){
    ['#imageSearchBtn','#providerNotice'].forEach(s=>{const el=$(s);if(el){el.hidden=false;el.classList.remove('hidden');el.removeAttribute('aria-hidden')}});
  }
  function addToolbar(){
    if($('#localPreviewToolbar'))return;
    const bar=document.createElement('aside');bar.id='localPreviewToolbar';bar.innerHTML=`<b>LOCAL PREVIEW</b><span>本番には出ない確認用パネル</span><nav><a href="/">ホーム</a><a href="/latest-goods">最新グッズ</a><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/terms.html">規約</a><a href="/privacy.html">Privacy</a><a href="/disclaimer.html">免責</a><a href="/rakuten-widget.html">楽天Widget</a><a href="/guide/oshi-goods">Guide</a><a href="/compare/acrylic-stand">Compare</a><a href="/discover/anime">Discover</a></nav><div class="local-actions"><button data-local-search>サンプル検索を表示</button><button data-local-show>非表示UIを表示</button><a class="local-index" href="/__local">全画面一覧</a></div>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-local-search]')?.addEventListener('click',()=>sampleSearch(true));
    bar.querySelector('[data-local-show]')?.addEventListener('click',()=>{
      unhideKnown();
      $$('.hidden').forEach(el=>{if(el.id==='modal'||el.id==='emptyState'||el.id==='suggestBox'||el.id==='compareTray')return;el.classList.remove('hidden')});
      $$('[hidden]').forEach(el=>{if(el.tagName==='BUTTON'||el.tagName==='SECTION'||el.tagName==='DIV')el.hidden=false});
    });
  }
  function sampleSearch(force=false){
    const q=$('#q'),btn=$('#searchBtn');if(!q||!btn)return;
    if(force||!q.value.trim())q.value='五条悟 アクスタ';
    btn.click();
  }
  function providerPreview(){
    const p=$('#providerNotice');if(!p)return;
    p.classList.remove('hidden');p.removeAttribute('aria-hidden');
    if(!p.textContent.trim())p.innerHTML='<b>ローカル確認モード</b><div>5販売サイト・画像検索・API状態をすべて表示しています。</div><div class="provider-row"><span class="provider-pill ok">メルカリ: local</span><span class="provider-pill ok">Yahoo!フリマ: local</span><span class="provider-pill ok">Yahoo!オークション: local</span><span class="provider-pill ok">Yahoo!ショッピング: mock API</span><span class="provider-pill ok">楽天市場: mock API</span></div>';
  }
  function boot(){
    document.documentElement.dataset.localPreview='all-visible';
    unhideKnown();addToolbar();providerPreview();
    sessionStorage.setItem('oshiru-intro-v3','1');
    setTimeout(()=>sampleSearch(false),500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
