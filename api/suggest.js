import { suggest as entitySuggest } from './_core.mjs';
import { buildSearchVariants, preferredProviderQuery, detectIntent, detectMerchLabel, normalizeFlexible, compactFlexible } from './search-language.mjs';

const cache=new Map();
let yahooLastAt=0;
let yahooGate=Promise.resolve();

function send(res,status,data,ttl=120){
  res.setHeader('Cache-Control',`public, max-age=15, s-maxage=${ttl}, stale-while-revalidate=${Math.max(300,ttl*4)}`);
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(data);
}
function clamp(value=''){return String(value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)}
function ageDays(value){const ms=Date.parse(value||'');return Number.isFinite(ms)?(Date.now()-ms)/86400000:null}
function recencyPoints(value){const age=ageDays(value);if(age==null)return 0;if(age<0&&age>-365)return 34;if(age<=30)return 30;if(age<=90)return 22;if(age<=180)return 12;if(age<=365)return 6;return 0}
function popularityPoints(hit){const reviews=Math.max(0,Number(hit?.review?.count)||0);return Math.min(42,Math.log10(reviews+1)*15)+(hit?.seller?.isBestSeller?8:0)}
function labelFor(hit){const age=ageDays(hit?.releaseDate),reviews=Math.max(0,Number(hit?.review?.count)||0);if(age!=null&&age<=120)return'新着候補';if(reviews>=10||hit?.seller?.isBestSeller)return'人気候補';return'商品候補'}
async function yahooFetch(query){
  const appid=process.env.YAHOO_CLIENT_ID;if(!appid||!query)return[];
  const run=async()=>{
    const wait=Math.max(0,1050-(Date.now()-yahooLastAt));if(wait)await new Promise(r=>setTimeout(r,wait));yahooLastAt=Date.now();
    const p=new URLSearchParams({appid,query,results:'30',image_size:'76',in_stock:'true',sort:'-score'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4200);
    try{
      const r=await fetch(`https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?${p}`,{signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-suggest/2.0'}});
      if(!r.ok)throw new Error(`yahoo_${r.status}`);const d=await r.json();return Array.isArray(d?.hits)?d.hits:[];
    }finally{clearTimeout(timer)}
  };
  const task=yahooGate.then(run,run);yahooGate=task.catch(()=>{});return task;
}
function cleanProductParts(title=''){
  return String(title).normalize('NFKC')
    .replace(/【[^】]{0,35}】/g,' ')
    .replace(/[\[\]「」『』()（）|｜／/,:：・]+/g,' ')
    .split(/\s+/).map(x=>x.trim()).filter(x=>x&&x.length<=24&&!/^(送料無料|中古|新品|予約|特価|ポイント|クーポン|セール)$/i.test(x));
}
function titleCompletion(title,q){
  const parts=cleanProductParts(title);if(!parts.length)return'';
  const qTokens=normalizeFlexible(q).split(/\s+/).filter(Boolean),needle=qTokens.at(-1)||normalizeFlexible(q);let index=-1;
  for(let i=0;i<parts.length;i++){const p=compactFlexible(parts[i]);if(p&&needle&&(p.includes(compactFlexible(needle))||compactFlexible(needle).includes(p))){index=i;break}}
  if(index<0){const qCompact=compactFlexible(q);for(let i=0;i<parts.length;i++){if(qCompact&&compactFlexible(parts[i]).includes(qCompact)){index=i;break}}}
  if(index<0)return'';
  const start=Math.max(0,index-(qTokens.length>1?1:0)),candidate=parts.slice(start,index+3).join(' ');
  return candidate.length>=2&&candidate.length<=48?candidate:'';
}
function addCandidate(map,item){
  const name=clamp(item?.name);if(!name)return;const key=compactFlexible(name);if(!key)return;
  const current=map.get(key);if(!current||Number(item.score||0)>Number(current.score||0))map.set(key,{...item,name});
}
function commerceCandidates(hits,q){
  const out=new Map(),intent=detectIntent(q),canonical=preferredProviderQuery(q),qCompact=compactFlexible(q);
  for(let i=0;i<hits.length;i++){
    const h=hits[i]||{},title=String(h.name||''),type=detectMerchLabel(title),reviewCount=Math.max(0,Number(h?.review?.count)||0);
    let score=145-i*2+popularityPoints(h)+recencyPoints(h.releaseDate);
    if(qCompact&&compactFlexible(title).includes(qCompact))score+=55;
    if(type&&intent.entity){
      addCandidate(out,{name:`${intent.entity} ${type}`,kind:'search',label:labelFor(h),detail:'現在の商品から予測',score:score+34,reviewCount,releaseDate:h.releaseDate||null});
    }
    const short=titleCompletion(title,q);
    if(short)addCandidate(out,{name:short,kind:'search',label:labelFor(h),detail:'現在の商品から予測',score:score+18,reviewCount,releaseDate:h.releaseDate||null});
  }
  if(intent.merchGroups.length&&canonical&&compactFlexible(canonical)!==qCompact)addCandidate(out,{name:canonical,kind:'correction',label:'表記補正',detail:'略称・空白を補正',score:290});
  for(const v of buildSearchVariants(q,4)){
    if(['canonical','segmented'].includes(v.reason)&&compactFlexible(v.query)!==qCompact)addCandidate(out,{name:v.query,kind:'correction',label:'入力補正',detail:'つながった文字や略称を補正',score:260+v.weight});
  }
  return [...out.values()];
}
function entityCandidates(data,q){
  const qCompact=compactFlexible(q),out=[];
  for(const x of data?.items||[]){
    const name=clamp(x.name),n=compactFlexible(name);if(!name||!n)continue;
    let score=95;if(qCompact&&(n.startsWith(qCompact)||n.includes(qCompact)))score+=80;
    out.push({name,kind:x.kind||'entity',image:x.image||null,label:x.kind==='character'?'キャラクター':'作品',detail:'作品・キャラクター候補',score});
  }
  return out;
}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{items:[]},30)}
  const u=new URL(req.url,'http://local'),q=clamp(u.searchParams.get('q')||'');
  if(normalizeFlexible(q).length<2)return send(res,200,{items:[]},180);
  const key=normalizeFlexible(q),cached=cache.get(key);if(cached&&Date.now()-cached.at<300_000)return send(res,200,cached.value,180);
  const providerQuery=preferredProviderQuery(q),intent=detectIntent(q);
  const [productsResult,entitiesResult]=await Promise.allSettled([yahooFetch(providerQuery),entitySuggest(intent.entity||q)]);
  const products=productsResult.status==='fulfilled'?productsResult.value:[],entities=entitiesResult.status==='fulfilled'?entitiesResult.value:{items:[]};
  const merged=new Map();
  for(const item of commerceCandidates(products,q))addCandidate(merged,item);
  for(const item of entityCandidates(entities,q))addCandidate(merged,item);
  const items=[...merged.values()].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,8).map(({score,...x})=>x);
  const value={query:q,providerQuery,items,signals:{commerce:products.length,entity:(entities.items||[]).length,popularity:'Yahoo!ショッピングおすすめ順・レビュー件数',freshness:'発売日'},generatedAt:new Date().toISOString()};
  cache.set(key,{at:Date.now(),value});if(cache.size>120)cache.delete(cache.keys().next().value);
  return send(res,200,value,180);
}
