const MAX_BYTES=4_000_000;
const MAX_REDIRECTS=2;
const IMAGE_TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);

function hostAllowed(host,source=''){
  const h=String(host||'').toLowerCase().replace(/\.$/,'');
  const yahoo=h==='item-shopping.c.yimg.jp'||h==='shopping.c.yimg.jp';
  const rakuten=h==='rakuten.co.jp'||h.endsWith('.rakuten.co.jp')||h==='r10s.jp'||h.endsWith('.r10s.jp')||h==='rakuten-static.com'||h.endsWith('.rakuten-static.com')||h==='rakuten.ne.jp'||h.endsWith('.rakuten.ne.jp');
  if(source==='yahoo')return yahoo;
  if(source==='rakuten')return rakuten;
  return yahoo||rakuten;
}

function safeUrl(raw,source){
  if(!raw||String(raw).length>2048)return null;
  try{
    const u=new URL(String(raw));
    if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
    if(!hostAllowed(u.hostname,source))return null;
    return u;
  }catch{return null}
}

async function fetchImage(url,source){
  let current=url;
  for(let i=0;i<=MAX_REDIRECTS;i++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),4500);
    let r;
    try{
      r=await fetch(current,{redirect:'manual',signal:controller.signal,headers:{accept:'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8,*/*;q=0.1','user-agent':'OSHIRU-image-proxy/1.0'}});
    }finally{clearTimeout(timer)}
    if([301,302,303,307,308].includes(r.status)){
      const next=safeUrl(new URL(r.headers.get('location')||'',current).href,source);
      if(!next||i===MAX_REDIRECTS)throw new Error('redirect_not_allowed');
      current=next;
      continue;
    }
    if(!r.ok)throw new Error(`upstream_${r.status}`);
    const type=String(r.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!IMAGE_TYPES.has(type))throw new Error('unsupported_image_type');
    const declared=Number(r.headers.get('content-length')||0);
    if(declared>MAX_BYTES)throw new Error('image_too_large');
    const body=Buffer.from(await r.arrayBuffer());
    if(body.length>MAX_BYTES)throw new Error('image_too_large');
    return{body,type};
  }
  throw new Error('redirect_limit');
}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});
  const source=String(req.query?.source||'').toLowerCase();
  if(source&&!['yahoo','rakuten'].includes(source))return res.status(400).json({error:'invalid_source'});
  const url=safeUrl(req.query?.url,source);
  if(!url)return res.status(400).json({error:'image_url_not_allowed'});
  try{
    const image=await fetchImage(url,source);
    res.setHeader('Content-Type',image.type);
    res.setHeader('Content-Length',String(image.body.length));
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cross-Origin-Resource-Policy','same-origin');
    return res.status(200).send(image.body);
  }catch(e){
    console.warn('official-image-proxy',String(e?.message||e));
    return res.status(502).json({error:'official_image_fetch_failed'});
  }
}
