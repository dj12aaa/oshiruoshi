import { json, cleanQuery } from './_core.mjs';

const cache=new Map();
const providerLastAt={yahoo:0,rakuten:0};
const providerGate={yahoo:Promise.resolve(),rakuten:Promise.resolve()};

function dedupe(items){
  const seen=new Set();
  return items.filter(i=>{
    const k=(i?.canonicalUrl||i?.url||`${i?.source}|${i?.title}|${i?.price}`).replace(/[?#].*$/,'');
    if(seen.has(k))return false;
    seen.add(k);return true;
  });
}

async function fetchJson(url,{headers={},timeout=5500}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const r=await fetch(url,{signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-beta/2.2',...headers}});
    const text=await r.text();
    if(text.length>2_000_000)throw new Error('response_too_large');
    if(!r.ok){
      let detail='';
      try{const d=JSON.parse(text);detail=String(d?.error||d?.error_description||d?.message||'').replace(/[^A-Za-z0-9_.-]/g,'_').slice(0,70)}catch{}
      throw new Error(`upstream_${r.status}${detail?`_${detail}`:''}`);
    }
    return JSON.parse(text);
  }finally{clearTimeout(timer)}
}

function gated(provider,fn){
  const run=async()=>{
    const wait=Math.max(0,1100-(Date.now()-providerLastAt[provider]));
    if(wait)await new Promise(r=>setTimeout(r,wait));
    providerLastAt[provider]=Date.now();
    return fn();
  };
  const task=providerGate[provider].then(run,run);
  providerGate[provider]=task.catch(()=>{});
  return task;
}

function yahooCondition(v){return v==='used'?'中古':v==='new'?'新品':'要確認'}
async function yahooSearch(q){
  const appid=process.env.YAHOO_CLIENT_ID;
  if(!appid)return[];
  return gated('yahoo',async()=>{
    const p=new URLSearchParams({appid,query:q,results:'30',image_size:'300',in_stock:'true',sort:'-score'});
    const d=await fetchJson(`https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?${p}`);
    const now=new Date().toISOString();
    return(d.hits||[]).map((h,i)=>{
      const image=h?.exImage?.url||h?.image?.medium||h?.image?.small||null;
      const shippingCode=Number(h?.shipping?.code||0);
      return{
        id:`yshop-${h?.code||i}`,
        source:'Yahoo!ショッピング',
        title:h?.name||'商品名不明',
        description:String(h?.description||h?.headLine||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,240),
        price:Number.isFinite(Number(h?.price))?Number(h.price):null,
        shipping:shippingCode===2?0:null,
        shippingLabel:h?.shipping?.name||null,
        fee:0,
        status:h?.inStock===false?'在庫なし':'販売中',
        condition:yahooCondition(h?.condition),
        url:h?.url||'#',
        image,
        type:'通販',
        shop:h?.seller?.name||'',
        sellerId:h?.seller?.sellerId||'',
        janCode:h?.janCode||'',
        releaseDate:h?.releaseDate||null,
        reviewCount:Number.isFinite(Number(h?.review?.count))?Number(h.review.count):null,
        reviewAverage:Number.isFinite(Number(h?.review?.rate))?Number(h.review.rate):null,
        verifiedAt:now,
        origin:'official-api',real:true,imageVerified:Boolean(image)
      };
    }).filter(x=>x.url&&x.url!=='#');
  });
}

function firstRakutenImage(h){
  const v=h?.mediumImageUrls?.[0]??h?.smallImageUrls?.[0]??null;
  return typeof v==='string'?v:(v?.imageUrl||null);
}
async function rakutenSearch(q){
  const appId=process.env.RAKUTEN_APP_ID;
  const accessKey=process.env.RAKUTEN_ACCESS_KEY;
  if(!appId||!accessKey)return[];
  return gated('rakuten',async()=>{
    const p=new URLSearchParams({applicationId:appId,keyword:q,hits:'30',format:'json',formatVersion:'2',availability:'1',field:'0',imageFlag:'1'});
    if(process.env.RAKUTEN_AFFILIATE_ID)p.set('affiliateId',process.env.RAKUTEN_AFFILIATE_ID);
    const endpoint=process.env.RAKUTEN_ICHIBA_ENDPOINT||'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
    const configured=String(process.env.PUBLIC_SITE_URL||'https://oshiruoshi.vercel.app').trim().replace(/\/$/,'');
    const site=/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured)?configured:'https://oshiruoshi.vercel.app';
    const d=await fetchJson(`${endpoint}?${p}`,{headers:{accessKey,origin:site,referer:`${site}/`}});
    const rows=d.Items||d.items||[];
    const now=new Date().toISOString();
    return rows.map((row,i)=>{
      const h=row?.Item||row||{};
      const image=firstRakutenImage(h);
      const available=Number(h?.availability)!==0;
      const postage=Number(h?.postageFlag);
      return{
        id:`rakuten-${h?.itemCode||i}`,
        source:'楽天市場',
        title:[h?.catchcopy,h?.itemName].filter(Boolean).join(' ').trim()||'商品名不明',
        description:String(h?.itemCaption||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,240),
        price:Number.isFinite(Number(h?.itemPrice))?Number(h.itemPrice):null,
        shipping:postage===0?0:null,
        shippingLabel:postage===0?'送料込み/送料無料':'送料は商品ページで確認',
        fee:0,
        status:available?'販売中':'在庫なし',
        condition:'商品ページで確認',
        url:h?.affiliateUrl||h?.itemUrl||'#',
        canonicalUrl:h?.itemUrl||null,
        image,
        type:'通販',shop:h?.shopName||'',itemCode:h?.itemCode||'',
        reviewCount:Number.isFinite(Number(h?.reviewCount))?Number(h.reviewCount):null,
        reviewAverage:Number.isFinite(Number(h?.reviewAverage))?Number(h.reviewAverage):null,
        affiliate:Boolean(h?.affiliateUrl),
        verifiedAt:now,origin:'official-api',real:true,imageVerified:Boolean(image)
      };
    }).filter(x=>x.url&&x.url!=='#');
  });
}

async function xSearch(q){
  if(!process.env.X_BEARER_TOKEN)return[];
  const xq=`(${q}) (交換 OR 譲 OR 求 OR 買取) -is:retweet lang:ja`;
  const d=await fetchJson(`https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(xq)}&max_results=12&tweet.fields=created_at`,{headers:{authorization:`Bearer ${process.env.X_BEARER_TOKEN}`}});
  return(d.data||[]).map(t=>({id:`x-${t.id}`,source:'X',title:t.text,price:null,shipping:null,fee:0,status:'交換・譲渡候補',condition:'投稿内容を確認',url:`https://x.com/i/web/status/${t.id}`,image:null,type:'交換投稿',verifiedAt:t.created_at||new Date().toISOString(),origin:'official-api',real:true,imageVerified:false}));
}

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  const u=new URL(req.url,'http://local');
  const q=cleanQuery(u.searchParams.get('q')||'');
  if(!q)return json(res,200,{query:'',items:[],providers:{},generatedAt:new Date().toISOString()});
  const cacheKey=q.toLowerCase();
  const existing=cache.get(cacheKey);
  if(existing&&Date.now()-existing.at<75_000)return json(res,200,existing.value);

  const jobs=[];
  if(process.env.YAHOO_CLIENT_ID)jobs.push(['yahooShopping',yahooSearch(q)]);
  if(process.env.RAKUTEN_APP_ID&&process.env.RAKUTEN_ACCESS_KEY)jobs.push(['rakuten',rakutenSearch(q)]);
  if(process.env.X_BEARER_TOKEN)jobs.push(['x',xSearch(q)]);
  const settled=await Promise.all(jobs.map(async([name,promise])=>{try{return{name,ok:true,value:await promise}}catch(e){return{name,ok:false,value:[],error:String(e?.name==='AbortError'?'timeout':e?.message||e).slice(0,120)}}}));
  const providers={};let items=[];
  for(const r of settled){providers[r.name]={ok:r.ok,count:r.value.length,error:r.error||null};items.push(...r.value)}
  const value={query:q,items:dedupe(items),providers,generatedAt:new Date().toISOString()};
  cache.set(cacheKey,{at:Date.now(),value});
  if(cache.size>100)cache.delete(cache.keys().next().value);
  return json(res,200,value);
}
