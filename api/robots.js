function siteBase(req){
  const configured=String(process.env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'');
  if(/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured))return configured;
  const raw=String((req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0]);
  const host=raw.replace(/[^A-Za-z0-9.:-]/g,'');
  return host?`https://${host}`:'';
}
function isIndexable(){
  const configured=String(process.env.PUBLIC_SITE_INDEXABLE||'').trim().toLowerCase();
  if(configured==='true')return true;
  if(configured==='false')return false;
  return process.env.VERCEL_ENV==='production';
}
export default function handler(req,res){
  const indexable=isIndexable();
  const base=siteBase(req);
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  if(!indexable){
    res.status(200).send('User-agent: *\nDisallow: /\n');
    return;
  }
  res.status(200).send(`User-agent: *\nAllow: /\nDisallow: /api/\n${base?`Sitemap: ${base}/sitemap.xml\n`:''}`);
}
