import fs from 'node:fs';

const verified=JSON.parse(fs.readFileSync(new URL('../data/verified-listings.json',import.meta.url),'utf8'));
const publicAdapters=String(process.env.ENABLE_PUBLIC_PAGE_ADAPTERS||'false').toLowerCase()==='true';
const aliases={アクスタ:['アクスタ','アクリルスタンド','アクリルフィギュア'],グリ缶:['グリ缶','グリッター缶バッジ'],プロセカ:['プロセカ','プロジェクトセカイ'],ぼざろ:['ぼざろ','ぼっち・ざ・ろっく','ぼっちざろっく'],サンリオ:['サンリオ','シナモロール','シナモンロール']};
const yahooCache=new Map();
let yahooLastRequestAt=0;
let yahooGate=Promise.resolve();

export function setCommon(res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
}
export function json(res,status,data){setCommon(res);res.status(status).json(data)}

export function cleanQuery(q=''){
  return String(q).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
}

export function outbound(source,q){
  const e=encodeURIComponent(cleanQuery(q)||'推し活 グッズ');
  if(source==='メルカリ')return`https://jp.mercari.com/search?keyword=${e}`;
  if(source==='Yahoo!フリマ')return`https://paypayfleamarket.yahoo.co.jp/search/${e}`;
  if(source==='Yahoo!オークション')return`https://auctions.yahoo.co.jp/search/search/${e}/0/`;
  return'#';
}

function expand(q=''){
  const s=cleanQuery(q).toLowerCase().replace(/　/g,' ');
  const out=new Set(s.split(/\s+/).filter(Boolean));
  for(const [k,vs] of Object.entries(aliases)){
    if(s.includes(k.toLowerCase())||vs.some(v=>s.includes(v.toLowerCase())))vs.forEach(v=>out.add(v.toLowerCase()));
  }
  return [...out];
}
function score(i,q){
  if(!q)return 1;
  const hay=[i.title,i.series,i.character,i.type,i.collab,...(i.tags||[])].filter(Boolean).join(' ').toLowerCase();
  const terms=expand(q);let n=0;
  for(const t of terms){if(hay.includes(t))n+=t.length>3?4:2}
  const raw=cleanQuery(q).toLowerCase();if(hay.includes(raw))n+=10;return n;
}
function dedupe(items){
  const seen=new Set();
  return items.filter(i=>{const k=(i.url||`${i.source}|${i.title}|${i.price}`).replace(/[?#].*$/,'');if(seen.has(k))return false;seen.add(k);return true});
}

async function fetchJson(url,opts={}){
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),5000);
  try{
    const r=await fetch(url,{...opts,signal:c.signal,headers:{'user-agent':'OSHIRU-beta/2.0',accept:'application/json',...(opts.headers||{})}});
    const len=Number(r.headers?.get?.('content-length')||0);if(len>2_000_000)throw new Error('response_too_large');
    const text=await r.text();if(text.length>2_000_000)throw new Error('response_too_large');
    if(!r.ok)throw new Error(`upstream_${r.status}`);
    return JSON.parse(text);
  }finally{clearTimeout(timer)}
}

function yahooCondition(v){if(v==='used')return'中古';if(v==='new')return'新品';return'要確認'}
export function mapYahooHit(h,i=0,now=new Date().toISOString()){
  const image=h?.exImage?.url||h?.image?.medium||h?.image?.small||null;
  const shippingCode=Number(h?.shipping?.code||0);
  return{
    id:`yshop-${h?.code||i}`,
    source:'Yahoo!ショッピング',
    title:h?.name||'商品名不明',
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
    verifiedAt:now,
    origin:'official-api',
    real:true,
    imageVerified:Boolean(image)
  };
}

async function yahooRequest(q){
  const appid=process.env.YAHOO_CLIENT_ID;
  if(!appid||!q)return[];
  const params=new URLSearchParams({appid,query:q,results:'30',image_size:'300',in_stock:'true'});
  const data=await fetchJson(`https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?${params}`);
  const now=new Date().toISOString();
  return (data.hits||[]).map((h,i)=>mapYahooHit(h,i,now)).filter(x=>x.url&&x.url!=='#');
}

async function yahooShopping(q){
  const query=cleanQuery(q);if(!process.env.YAHOO_CLIENT_ID||!query)return[];
  const key=query.toLowerCase();const cached=yahooCache.get(key);const now=Date.now();
  if(cached&&now-cached.at<60_000)return cached.items;
  const run=async()=>{
    const wait=Math.max(0,1050-(Date.now()-yahooLastRequestAt));
    if(wait)await new Promise(r=>setTimeout(r,wait));
    yahooLastRequestAt=Date.now();
    const items=await yahooRequest(query);yahooCache.set(key,{at:Date.now(),items});
    if(yahooCache.size>80){const first=yahooCache.keys().next().value;yahooCache.delete(first)}
    return items;
  };
  const task=yahooGate.then(run,run);yahooGate=task.catch(()=>{});return task;
}

async function rakuten(q){
  if(!process.env.RAKUTEN_APP_ID||!process.env.RAKUTEN_ACCESS_KEY||!q)return[];
  const p=new URLSearchParams({applicationId:process.env.RAKUTEN_APP_ID,accessKey:process.env.RAKUTEN_ACCESS_KEY,keyword:q,hits:'16',format:'json'});
  const ep=process.env.RAKUTEN_ICHIBA_ENDPOINT||'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
  const d=await fetchJson(`${ep}?${p}`);
  return(d.Items||d.items||[]).map((row,i)=>{const h=row.Item||row;return{id:`rakuten-${h.itemCode||i}`,source:'楽天市場',title:h.itemName,price:h.itemPrice,shipping:null,fee:0,status:'販売中',condition:'新品',url:h.itemUrl||h.affiliateUrl,image:h.mediumImageUrls?.[0]?.imageUrl||h.mediumImageUrls?.[0]||null,type:'通販',shop:h.shopName||'',verifiedAt:new Date().toISOString(),origin:'official-api',real:true,imageVerified:Boolean(h.mediumImageUrls?.length)}});
}
async function xSearch(q){
  if(!process.env.X_BEARER_TOKEN||!q)return[];
  const xq=`(${q}) (交換 OR 譲 OR 求 OR 買取) -is:retweet lang:ja`;
  const d=await fetchJson(`https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(xq)}&max_results=12&tweet.fields=created_at`,{headers:{authorization:`Bearer ${process.env.X_BEARER_TOKEN}`}});
  return(d.data||[]).map(t=>({id:`x-${t.id}`,source:'X',title:t.text,price:null,shipping:null,fee:0,status:'交換・譲渡候補',condition:'投稿内容を確認',url:`https://x.com/i/web/status/${t.id}`,image:null,type:'交換投稿',verifiedAt:t.created_at||new Date().toISOString(),origin:'official-api',real:true,imageVerified:false}));
}
async function anilist(q){
  if(!q)return[];
  const query=`query($s:String){Page(page:1,perPage:5){media(search:$s,type:ANIME){title{romaji native english} coverImage{medium}} characters(search:$s){name{full native} image{medium}}}}`;
  const d=await fetchJson('https://graphql.anilist.co',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{s:q}})});
  const p=d.data?.Page||{};
  return[...(p.characters||[]).map(x=>({kind:'character',name:x.name?.native||x.name?.full,image:x.image?.medium})),...(p.media||[]).map(x=>({kind:'anime',name:x.title?.native||x.title?.romaji||x.title?.english,image:x.coverImage?.medium}))];
}
async function jikan(q){if(!q)return[];const d=await fetchJson(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=5&order_by=favorites&sort=desc`);return(d.data||[]).map(x=>({kind:'character',name:x.name,image:x.images?.jpg?.image_url}))}

export async function snapshotSearch(q){
  q=cleanQuery(q);const items=verified.map(i=>({...i,_score:score(i,q),real:true})).filter(i=>!q||i._score>0).sort((a,b)=>b._score-a._score);
  const direct=['メルカリ','Yahoo!フリマ','Yahoo!オークション'].map(source=>({source,url:outbound(source,q)}));
  return{query:q,items,direct,providers:{snapshot:{ok:true,count:items.length}},snapshotCount:items.length,generatedAt:new Date().toISOString()};
}
export async function liveSearch(q){
  q=cleanQuery(q);if(!q)return{query:q,items:[],providers:{},generatedAt:new Date().toISOString()};
  const jobs=[];
  if(process.env.YAHOO_CLIENT_ID)jobs.push(['yahooShopping',yahooShopping(q)]);
  if(process.env.RAKUTEN_APP_ID&&process.env.RAKUTEN_ACCESS_KEY)jobs.push(['rakuten',rakuten(q)]);
  if(process.env.X_BEARER_TOKEN)jobs.push(['x',xSearch(q)]);
  const settled=await Promise.all(jobs.map(async([name,p])=>{try{const value=await p;return{name,ok:true,value}}catch(e){return{name,ok:false,value:[],error:String(e.message||e)}}}));
  let items=[];const providers={};
  for(const r of settled){items.push(...r.value);providers[r.name]={ok:r.ok,count:r.value.length,error:r.error||null}}
  return{query:q,items:dedupe(items),providers,generatedAt:new Date().toISOString()};
}
export async function suggest(q){
  q=cleanQuery(q);const [a,b]=await Promise.allSettled([anilist(q),jikan(q)]);const merged=[];const seen=new Set();
  for(const x of [...(a.status==='fulfilled'?a.value:[]),...(b.status==='fulfilled'?b.value:[])]){const k=`${x.kind}|${x.name}`;if(!x.name||seen.has(k))continue;seen.add(k);merged.push({...x,id:`s-${merged.length}`})}
  return{items:merged.slice(0,8),providers:{anilist:a.status==='fulfilled',jikan:b.status==='fulfilled'}};
}
export async function vision(imageData){
  if(!process.env.OPENAI_API_KEY)throw Object.assign(new Error('OPENAI_API_KEY is not configured'),{status:503});
  if(!/^data:image\//.test(imageData||''))throw Object.assign(new Error('imageData is required'),{status:400});
  if(String(imageData).length>6_000_000)throw Object.assign(new Error('image_too_large'),{status:413});
  const model=process.env.OPENAI_MODEL||'gpt-5-mini';
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model,input:[{role:'user',content:[{type:'input_text',text:'この推し活グッズ画像から検索に使える短い日本語検索語を推定してください。推測は避け、JSONだけで {"query":"...","confidence":0,"notes":[]} を返してください。'},{type:'input_image',image_url:imageData}]}]})});
  if(!r.ok)throw new Error(`vision_${r.status}`);const d=await r.json();const text=(d.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||'').join('').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');return JSON.parse(text);
}
export function status(){return{snapshot:verified.length,publicAdapters,vision:Boolean(process.env.OPENAI_API_KEY),yahooShopping:Boolean(process.env.YAHOO_CLIENT_ID),rakuten:Boolean(process.env.RAKUTEN_APP_ID&&process.env.RAKUTEN_ACCESS_KEY),x:Boolean(process.env.X_BEARER_TOKEN),anilist:true,jikan:true,contact:Boolean(process.env.PUBLIC_CONTACT_EMAIL)}}
