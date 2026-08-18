import { suggest } from './_core.mjs';

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({items:[]});
  }
  const u=new URL(req.url,'http://local');
  const q=(u.searchParams.get('q')||'').trim().slice(0,60);
  if(q.length<2){
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({items:[]});
  }
  try{
    const data=await suggest(q);
    res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).json({items:(data.items||[]).slice(0,8)});
  }catch{
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({items:[]});
  }
}
