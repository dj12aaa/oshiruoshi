import { suggest as entitySuggest } from './_core.mjs';
import { buildSearchVariants, preferredProviderQuery, detectIntent, detectMerchLabel, normalizeFlexible, compactFlexible } from './search-language.mjs';
import { correctKnownQuery, findDynamicEntityCorrection } from '../lib/search-typo.mjs';

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
function labelFor(hit){const age=ageDays(hit?.releaseDate),reviews=Math.max(0,Number(hit?.review?.count)||0);if(age!=null&&age<=120)return'新着';if(reviews>=10||hit?.seller?.isBestSeller)return'人気';return'商品候補'}
async function yahooFetch(query){
  const appid=process.env.YAHOO_CLIENT_ID;if(!appid||!query)return[];
  const run=async()=>{
    const wait=Math.max(0,1050-(Date.now()-yahooLastAt));if(wait)await new Promise(r=>setTimeout(r,wait));yahooLastAt=Date.now();
    const p=new URLSearchParams({appid,query,results:'30',image_size:'76',in_stock:'true',sort:'-score'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4200);
    try{
      const r=await fetch(`https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?${p}`,{signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-suggest/3.0'}});
      if(!r.ok)throw new Error(`yahoo_${r.status}`);const d=await r.json();return Array.isArray(d?.hits)?d.hits:[];
    }finally{clearTimeout(timer)}
  };
  const task=yahooGate.then(run,run);yahooGate=task.catch(()=>{});return task;
}
function addCandidate(map,item){
  const name=clamp(item?.name);if(!name)return;const key=compactFlexible(name);if(!key)return;
  const current=map.get(key);if(!current||Number(item.score||0)>Number(current.score||0))map.set(key,{...item,name});
}
function allowedMerch(intent,type){
  if(!type)return false;if(!intent.merchGroups.length)return true;
  const t=compactFlexible(type);return intent.merchGroups.some(g=>[g.canonical,g.broad].filter(Boolean).some(v=>compactFlexible(v)===t));
}
function structuredCommerceCandidates(hits,q){
  const out=new Map(),intent=detectIntent(q),qCompact=compactFlexible(q);
  for(let i=0;i<hits.length;i++){
    const h=hits[i]||{},title=String(h.name||''),type=detectMerchLabel(title);if(!type||!intent.entity||!allowedMerch(intent,type))continue;
    let score=150-i*2+popularityPoints(h)+recencyPoints(h.releaseDate);
    if(qCompact&&compactFlexible(title).includes(qCompact))score+=45;
    const candidate=`${intent.entity} ${type}`.replace(/\s+/g,' ').trim();
    addCandidate(out,{name:candidate,kind:'commerce',label:labelFor(h),detail:'現在の商品傾向から',score:score+28});
  }
  return [...out.values()];
}
function entityCandidates(data,q){
  const intent=detectIntent(q),qCompact=compactFlexible(intent.entity||q),out=[];
  for(const x of data?.items||[]){
    const base=clamp(x.name),n=compactFlexible(base);if(!base||!n)continue;
    let score=100;if(qCompact&&(n.startsWith(qCompact)||n.includes(qCompact)))score+=85;
    const merch=intent.merchGroups[0]?.canonical||'';
    const name=merch?`${base} ${merch}`:base;
    out.push({name,kind:x.kind||'entity',image:x.image||null,label:x.kind==='character'?'キャラクター':'作品',detail:merch?'グッズ種別を維持':'候補',score});
  }
  return out;
}
function correctionDetail(corrections=[]){
  if(!corrections.length)return'入力の表記を補正';
  const c=corrections[0];return`「${c.from}」→「${c.to}」`;
}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{items:[]},30)}
  const u=new URL(req.url,'http://local'),q=clamp(u.searchParams.get('q')||'');
  if(normalizeFlexible(q).length<2)return send(res,200,{items:[]},180);
  const key=normalizeFlexible(q),cached=cache.get(key);if(cached&&Date.now()-cached.at<300_000)return send(res,200,cached.value,180);

  const known=correctKnownQuery(q),baseQuery=known.changed?known.corrected:q;
  const providerQuery=preferredProviderQuery(baseQuery),intent=detectIntent(baseQuery);
  const [productsResult,entitiesResult]=await Promise.allSettled([yahooFetch(providerQuery),entitySuggest(intent.entity||baseQuery)]);
  let products=productsResult.status==='fulfilled'?productsResult.value:[];
  const entities=entitiesResult.status==='fulfilled'?entitiesResult.value:{items:[]};
  let fallbackProducts=[];
  if(products.length<5&&intent.entity&&intent.merchGroups.length){
    const merchQuery=[...new Set(intent.merchGroups.map(g=>g.canonical).filter(Boolean))].join(' ');
    if(merchQuery&&compactFlexible(merchQuery)!==compactFlexible(providerQuery)){
      try{fallbackProducts=await yahooFetch(merchQuery)}catch{}
    }
  }

  const merged=new Map();
  addCandidate(merged,{name:q,kind:'exact',label:'このまま検索',detail:'入力した言葉を変更しません',score:280});

  if(known.changed)addCandidate(merged,{name:known.corrected,kind:'correction',label:'誤字・表記補正',detail:correctionDetail(known.corrections),score:390});

  const dynamic=findDynamicEntityCorrection(baseQuery,[...products,...fallbackProducts].map(x=>x?.name).filter(Boolean));
  if(dynamic&&compactFlexible(dynamic.corrected)!==compactFlexible(q)){
    addCandidate(merged,{name:dynamic.corrected,kind:'correction',label:'もしかして',detail:`近い商品表記を確認（${Math.round(dynamic.confidence*100)}%）`,score:370});
  }

  const canonical=preferredProviderQuery(baseQuery);
  if(canonical&&compactFlexible(canonical)!==compactFlexible(q))addCandidate(merged,{name:canonical,kind:'correction',label:'表記補正',detail:'略称・空白・表記ゆれを整理',score:340});
  for(const v of buildSearchVariants(baseQuery,4)){
    if(['canonical','segmented'].includes(v.reason)&&compactFlexible(v.query)!==compactFlexible(q))addCandidate(merged,{name:v.query,kind:'correction',label:'入力補正',detail:'検索しやすい表記に整理',score:315+Number(v.weight||0)});
  }
  for(const item of structuredCommerceCandidates([...products,...fallbackProducts],baseQuery))addCandidate(merged,item);
  for(const item of entityCandidates(entities,baseQuery))addCandidate(merged,item);

  const items=[...merged.values()]
    .sort((a,b)=>(b.score||0)-(a.score||0))
    .slice(0,8)
    .map(({score,...x})=>x);
  const value={
    query:q,
    providerQuery,
    items,
    typoCorrection:known.changed?known:null,
    signals:{commerce:products.length,fallbackCommerce:fallbackProducts.length,entity:(entities.items||[]).length,popularity:'Yahoo!ショッピングおすすめ順・レビュー件数',freshness:'発売日'},
    generatedAt:new Date().toISOString()
  };
  cache.set(key,{at:Date.now(),value});if(cache.size>120)cache.delete(cache.keys().next().value);
  return send(res,200,value,180);
}
