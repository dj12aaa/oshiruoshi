export const DEFAULT_SITE='https://oshiruoshi.vercel.app';
function siteBase(){
  const configured=String(process.env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'');
  if(/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured))return configured;
  return DEFAULT_SITE;
}
function escXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function isIndexable(){
  const configured=String(process.env.PUBLIC_SITE_INDEXABLE||'').trim().toLowerCase();
  if(configured==='true')return true;
  if(configured==='false')return false;
  return process.env.VERCEL_ENV==='production';
}
export const SITEMAP_ENTRIES=[
  {path:'/',lastmod:'2026-09-05'},
  {path:'/latest-goods',lastmod:'2026-08-23'},
  ...[
    '/guide/oshi-goods',
    '/guide/how-oshiru-compares',
    '/compare/oshi-goods',
    '/compare/acrylic-stand',
    '/compare/can-badge',
    '/compare/plush',
    '/compare/card',
    '/discover/vtuber',
    '/discover/anime',
    '/discover/manga',
    '/discover/characters',
    '/character/hoshimachi-suisei',
    '/character/gojo-satoru',
    '/character/hatsune-miku'
  ].map(path=>({path,lastmod:'2026-09-05'})),
  ...['/about.html','/terms.html','/privacy.html','/disclaimer.html','/contact.html'].map(path=>({path,lastmod:'2026-08-19'}))
];
export function renderSitemap(base){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP_ENTRIES.map(({path,lastmod})=>`  <url><loc>${escXml(base+path)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>`;
}
export default function handler(req,res){
  const indexable=isIndexable();
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  if(!indexable){
    res.status(404).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    return;
  }
  res.status(200).send(renderSitemap(siteBase()));
}
