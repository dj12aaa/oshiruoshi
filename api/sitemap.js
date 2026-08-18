function siteBase(req){
  const configured=String(process.env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'');
  if(/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured))return configured;
  const raw=String((req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0]);
  const host=raw.replace(/[^A-Za-z0-9.:-]/g,'');
  return host?`https://${host}`:'';
}
function escXml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function isIndexable(){
  const configured=String(process.env.PUBLIC_SITE_INDEXABLE||'').trim().toLowerCase();
  if(configured==='true')return true;
  if(configured==='false')return false;
  return process.env.VERCEL_ENV==='production';
}
export default function handler(req,res){
  const indexable=isIndexable();
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  if(!indexable){
    res.status(404).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    return;
  }
  const base=siteBase(req);
  const pages=['/','/about.html','/terms.html','/privacy.html','/disclaimer.html','/contact.html'];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${escXml(base+p)}</loc></url>`).join('')}</urlset>`;
  res.status(200).send(xml);
}
