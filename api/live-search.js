import { liveSearch, json, cleanQuery } from './_core.mjs';

const rakutenRetryCache=new Map();

function firstImage(h){
  const v=h?.mediumImageUrls?.[0]??h?.smallImageUrls?.[0]??null;
  return typeof v==='string'?v:(v?.imageUrl||null);
}

function mapRakuten(row,i,now){
  const h=row?.Item||row||{};
  const image=firstImage(h);
  const available=Number(h?.availability)!==0;
  const postage=Number(h?.postageFlag);
  return{
    id:`rakuten-retry-${h?.itemCode||i}`,
    source:'楽天市場',
    title:[h?.catchcopy,h?.itemName].filter(Boolean).join(' ').trim()||'商品名不明',
    price:Number.isFinite(Number(h?.itemPrice))?Number(h.itemPrice):null,
    shipping:postage===0?0:null,
    shippingLabel:postage===0?'送料込み/送料無料':'送料は商品ページで確認',
    fee:0,
    status:available?'販売中':'在庫なし',
    condition:'商品ページで確認',
    url:h?.affiliateUrl||h?.itemUrl||'#',
    canonicalUrl:h?.itemUrl||null,
    image,
    type:'通販',
    shop:h?.shopName||'',
    itemCode:h?.itemCode||'',
    reviewCount:Number.isFinite(Number(h?.reviewCount))?Number(h.reviewCount):null,
    reviewAverage:Number.isFinite(Number(h?.reviewAverage))?Number(h.reviewAverage):null,
    description:String(h?.itemCaption||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,240),
    affiliate:Boolean(h?.affiliateUrl),
    verifiedAt:now,
    origin:'official-api',
    real:true,
    imageVerified:Boolean(image)
  };
}

async function retryRakuten(q){
  const appId=process.env.RAKUTEN_APP_ID;
  const accessKey=process.env.RAKUTEN_ACCESS_KEY;
  if(!appId||!accessKey)return{items:[],provider:null};
  const key=q.toLowerCase();
  const cached=rakutenRetryCache.get(key);
  if(cached&&Date.now()-cached.at<60_000)return cached.value;

  const p=new URLSearchParams({applicationId:appId,keyword:q,hits:'30',format:'json',formatVersion:'2',availability:'1',field:'0',imageFlag:'1'});
  if(process.env.RAKUTEN_AFFILIATE_ID)p.set('affiliateId',process.env.RAKUTEN_AFFILIATE_ID);
  const endpoint=process.env.RAKUTEN_ICHIBA_ENDPOINT||'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
  const configured=String(process.env.PUBLIC_SITE_URL||'https://oshiruoshi.vercel.app').trim().replace(/\/$/,'');
  const site=/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured)?configured:'https://oshiruoshi.vercel.app';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const r=await fetch(`${endpoint}?${p}`,{signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-beta/2.1',accessKey,origin:site,referer:`${site}/`}});
    const text=await r.text();
    if(!r.ok){
      let detail='';
      try{const e=JSON.parse(text);detail=String(e?.error||e?.error_description||'').slice(0,80)}catch{}
      return{items:[],provider:{ok:false,count:0,error:`upstream_${r.status}${detail?`_${detail}`:''}`}};
    }
    const d=JSON.parse(text);
    const rows=d.Items||d.items||[];
    const now=new Date().toISOString();
    const items=rows.map((row,i)=>mapRakuten(row,i,now)).filter(x=>x.url&&x.url!=='#');
    const value={items,provider:{ok:true,count:items.length,error:null}};
    rakutenRetryCache.set(key,{at:Date.now(),value});
    if(rakutenRetryCache.size>80)rakutenRetryCache.delete(rakutenRetryCache.keys().next().value);
    return value;
  }catch(e){
    return{items:[],provider:{ok:false,count:0,error:String(e?.name==='AbortError'?'timeout':e?.message||e).slice(0,100)}};
  }finally{clearTimeout(timer)}
}

function mergeUnique(primary,secondary){
  const out=[];const seen=new Set();
  for(const i of [...primary,...secondary]){
    const k=(i?.canonicalUrl||i?.url||`${i?.source}|${i?.title}|${i?.price}`).replace(/[?#].*$/,'');
    if(seen.has(k))continue;seen.add(k);out.push(i);
  }
  return out;
}

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  try{
    const u=new URL(req.url,'http://local');
    const q=cleanQuery(u.searchParams.get('q')||'');
    if(!q)return json(res,200,{query:'',items:[],providers:{},generatedAt:new Date().toISOString()});
    const result=await liveSearch(q);
    const rakuten=result?.providers?.rakuten;
    if(process.env.RAKUTEN_APP_ID&&process.env.RAKUTEN_ACCESS_KEY&&(!rakuten||rakuten.ok!==true)){
      const retry=await retryRakuten(q);
      if(retry.provider){
        result.providers={...(result.providers||{}),rakuten:retry.provider};
        result.items=mergeUnique(retry.items,result.items||[]);
      }
    }
    return json(res,200,result);
  }catch(e){
    console.error('live-search',String(e?.message||e));
    return json(res,502,{error:'live_search_failed',items:[]});
  }
}
