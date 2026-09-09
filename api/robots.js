export const DEFAULT_SITE='https://oshiruoshi.vercel.app';
function siteBase(){
  const configured=String(process.env.PUBLIC_SITE_URL||'').trim().replace(/\/$/,'');
  if(/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured))return configured;
  return DEFAULT_SITE;
}
function isIndexable(){
  const configured=String(process.env.PUBLIC_SITE_INDEXABLE||'').trim().toLowerCase();
  if(configured==='true')return true;
  if(configured==='false')return false;
  return process.env.VERCEL_ENV==='production';
}
export function renderRobots({indexable,base}){
  if(!indexable)return'User-agent: *\nDisallow: /\n';
  const sitemap=base?`Sitemap: ${base}/sitemap.xml\n`:'';
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*?q=\n${sitemap}`;
}
export default function handler(req,res){
  const indexable=isIndexable();
  const base=siteBase();
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  res.status(200).send(renderRobots({indexable,base}));
}
