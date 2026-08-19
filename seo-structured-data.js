(() => {
  'use strict';
  const SITE='https://oshiruoshi.vercel.app/';
  const canonical=document.querySelector('link[rel="canonical"]')?.href||new URL(location.pathname,location.origin).href;
  const description=document.querySelector('meta[name="description"]')?.content||'';
  const graph=[
    {
      '@type':'WebSite',
      '@id':SITE+'#website',
      url:SITE,
      name:'OSHIRU',
      description:'推し活グッズを複数の販売サイトから横断検索し、価格・送料・販売状況を比較できる検索サービスです。',
      inLanguage:'ja-JP'
    },
    {
      '@type':'WebPage',
      '@id':canonical+'#webpage',
      url:canonical,
      name:document.title,
      description,
      inLanguage:'ja-JP',
      isPartOf:{'@id':SITE+'#website'}
    }
  ];
  const links=[...document.querySelectorAll('.seo-breadcrumb a')];
  if(links.length){
    graph.push({
      '@type':'BreadcrumbList',
      '@id':canonical+'#breadcrumb',
      itemListElement:links.map((a,index)=>({
        '@type':'ListItem',
        position:index+1,
        name:(a.textContent||'').trim(),
        item:new URL(a.getAttribute('href')||'/',location.origin).href
      }))
    });
    graph[1].breadcrumb={'@id':canonical+'#breadcrumb'};
  }
  const modified=document.querySelector('meta[name="last-modified"]')?.content;
  if(modified)graph[1].dateModified=modified;
  const script=document.createElement('script');
  script.type='application/ld+json';
  script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});
  document.head.appendChild(script);
})();
