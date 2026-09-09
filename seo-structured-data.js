(() => {
  'use strict';
  const SITE='https://oshiruoshi.vercel.app/';
  const searchActions=document.querySelector('.search-actions');
  const searchInput=document.getElementById('q');
  if(searchInput)searchInput.placeholder='キャラ・作品・グッズ名を入力';
  if(searchActions){
    searchActions.querySelectorAll('.examples,.query-chip').forEach(el=>el.remove());
    if(!searchActions.querySelector('[data-search-guidance]')){
      const help=document.createElement('span');
      help.className='examples';help.dataset.searchGuidance='1';help.setAttribute('role','note');
      help.textContent='検索のコツ：推し・作品名とグッズ種別を組み合わせると、関連グッズを優先して探せます。';
      help.style.cssText='display:block;flex:1 1 100%;width:100%;margin:0;padding:2px 2px 0;font-size:12.5px;line-height:1.65;color:#475569;font-weight:700;overflow-wrap:anywhere';
      searchActions.appendChild(help);
    }
  }

  const canonical=document.querySelector('link[rel="canonical"]')?.href||new URL(location.pathname,location.origin).href;
  const description=document.querySelector('meta[name="description"]')?.content||'';
  if(document.querySelector('script[data-oshiru-structured]'))return;
  const graph=[
    {'@type':'WebSite','@id':SITE+'#website',url:SITE,name:'OSHIRU',description:'推し活グッズを複数の販売サイトから横断検索し、価格・送料・販売状況を比較できる検索サービスです。',inLanguage:'ja-JP'},
    {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:document.title,description,inLanguage:'ja-JP',isPartOf:{'@id':SITE+'#website'}}
  ];
  const links=[...document.querySelectorAll('.seo-breadcrumb a')];
  if(links.length){
    graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:links.map((a,index)=>({'@type':'ListItem',position:index+1,name:(a.textContent||'').trim(),item:new URL(a.getAttribute('href')||'/',location.origin).href}))});
    graph[1].breadcrumb={'@id':canonical+'#breadcrumb'};
  }
  const modified=document.querySelector('meta[name="last-modified"]')?.content;if(modified)graph[1].dateModified=modified;
  const structured=document.createElement('script');structured.type='application/ld+json';structured.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});document.head.appendChild(structured);

  // Page-critical assets are declared in HTML. Keeping structured data free of
  // asset bootstrapping removes a race that could expose the legacy card layout.
})();
