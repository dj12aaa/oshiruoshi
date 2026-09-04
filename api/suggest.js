import { suggest as entitySuggest } from './_core.mjs';
import { detectIntent, detectMerchLabel, normalizeFlexible, compactFlexible, resolveSearchQuery } from './_search-language.mjs';

const cache=new Map();
const SUGGEST_ENGINE_VERSION='2026-09-05.18';
let yahooLastAt=0;
let yahooGate=Promise.resolve();
const GENERIC=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古','セット','限定','予約','goods','item']);

function send(res,status,data,ttl=60){res.setHeader('Cache-Control',`public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${Math.max(60,ttl*2)}`);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-OSHIRU-Suggest-Version',SUGGEST_ENGINE_VERSION);return res.status(status).json(data)}
function clamp(value=''){return String(value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)}
function ageDays(value){const ms=Date.parse(value||'');return Number.isFinite(ms)?(Date.now()-ms)/86400000:null}
function recencyPoints(value){const age=ageDays(value);if(age==null)return 0;if(age<0&&age>-365)return 34;if(age<=30)return 30;if(age<=90)return 22;if(age<=180)return 12;if(age<=365)return 6;return 0}
function popularityPoints(hit){const reviews=Math.max(0,Number(hit?.review?.count)||0);return Math.min(42,Math.log10(reviews+1)*15)+(hit?.seller?.isBestSeller?8:0)}
function labelFor(hit){const age=ageDays(hit?.releaseDate),reviews=Math.max(0,Number(hit?.review?.count)||0);if(age!=null&&age<=120)return'新着';if(reviews>=10||hit?.seller?.isBestSeller)return'人気';return'商品候補'}
function distance(a='',b=''){
  const x=[...String(a)],y=[...String(b)],n=x.length,m=y.length;if(!n)return m;if(!m)return n;const d=Array.from({length:n+1},()=>Array(m+1).fill(0));for(let i=0;i<=n;i++)d[i][0]=i;for(let j=0;j<=m;j++)d[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){const cost=x[i-1]===y[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);if(i>1&&j>1&&x[i-1]===y[j-2]&&x[i-2]===y[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[n][m];
}
function similarity(a,b){const x=compactFlexible(a),y=compactFlexible(b),max=Math.max([...x].length,[...y].length);return max?1-distance(x,y)/max:0}

function primaryMerchGroups(intent){
  const groups=[...(intent?.merchGroups||[])];
  return groups.filter(group=>{
    const own=compactFlexible(group.canonical);
    return !groups.some(other=>other!==group&&[other.canonical,...(other.aliases||[])].filter(Boolean).some(value=>{const c=compactFlexible(value);return c.length>own.length&&c.includes(own)}));
  });
}
function merchFragments(intent){
  const fragments=new Set();
  for(const group of primaryMerchGroups(intent)){
    for(const value of [group.canonical,group.broad,...(group.aliases||[])].filter(Boolean)){
      for(const token of normalizeFlexible(value).split(/\s+/).filter(Boolean)){const c=compactFlexible(token);if([...c].length>=2)fragments.add(c)}
      const chars=[...compactFlexible(value)];
      for(let len=2;len<=Math.min(7,chars.length-1);len++){fragments.add(chars.slice(0,len).join(''));fragments.add(chars.slice(-len).join(''))}
    }
  }
  return fragments;
}
function cleanSubject(intent){
  const fragments=merchFragments(intent),seen=new Set(),out=[];
  for(const token of normalizeFlexible(intent?.entity||'').split(/\s+/).filter(Boolean)){
    const c=compactFlexible(token);if(!c||GENERIC.has(token)||fragments.has(c)||seen.has(c))continue;seen.add(c);out.push(token);
  }
  return out.join(' ').trim();
}
function normalizeIntentQuery(query=''){
  const intent=detectIntent(query),groups=primaryMerchGroups(intent),subject=cleanSubject(intent),merch=[...new Set(groups.map(g=>g.canonical).filter(Boolean))].join(' ');
  const cleaned=subject&&merch?`${subject} ${merch}`.replace(/\s+/g,' ').trim():normalizeFlexible(query);
  return{intent,groups,subject,cleaned,changed:Boolean(subject&&merch&&compactFlexible(cleaned)!==compactFlexible(query))};
}
function sanitizeGeneratedName(value='',kind='search'){
  const raw=clamp(value);if(!raw||kind==='exact')return raw;
  const normalized=normalizeIntentQuery(raw);
  if(normalized.groups.length&&normalized.subject){const cleaned=clamp(normalized.cleaned);if(cleaned)return cleaned}
  return raw;
}
function candidateWindows(text=''){const tokens=normalizeFlexible(text).split(/\s+/).filter(Boolean).filter(x=>!GENERIC.has(x)),out=[];for(let i=0;i<tokens.length;i++)for(let size=1;size<=3&&i+size<=tokens.length;size++){const value=tokens.slice(i,i+size).join(' '),c=compactFlexible(value);if([...c].length<4||[...c].length>28||/^\d+$/.test(c))continue;if(detectIntent(value).merchGroups.length)continue;out.push(value)}return[...new Set(out)]}
function findDynamicCorrection(query,texts=[]){const normalized=normalizeIntentQuery(query),subject=normalized.subject,ec=compactFlexible(subject);if([...ec].length<4||!normalized.groups.length)return null;let best=null;for(const text of texts.slice(0,40))for(const candidate of candidateWindows(text)){const c=compactFlexible(candidate);if(Math.abs([...ec].length-[...c].length)>3)continue;const score=similarity(ec,c);if(score<.8)continue;if(!best||score>best.score)best={value:candidate,score}}const required=[...ec].length<=5?.84:.81;if(!best||best.score<required)return null;return{corrected:`${best.value} ${normalized.groups[0]?.canonical||''}`.trim(),from:subject,to:best.value,confidence:Number(best.score.toFixed(3))}}
async function yahooFetch(query){const appid=process.env.YAHOO_CLIENT_ID;if(!appid||!query)return[];const run=async()=>{const wait=Math.max(0,1050-(Date.now()-yahooLastAt));if(wait)await new Promise(r=>setTimeout(r,wait));yahooLastAt=Date.now();const p=new URLSearchParams({appid,query,results:'30',image_size:'76',in_stock:'true',sort:'-score'});const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4200);try{const r=await fetch(`https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?${p}`,{signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-suggest/3.4'}});if(!r.ok)throw new Error(`yahoo_${r.status}`);const d=await r.json();return Array.isArray(d?.hits)?d.hits:[]}finally{clearTimeout(timer)}};const task=yahooGate.then(run,run);yahooGate=task.catch(()=>{});return task}
function addCandidate(map,item){const kind=String(item?.kind||'search'),name=sanitizeGeneratedName(item?.name,kind);if(!name)return;const key=compactFlexible(name);if(!key)return;const current=map.get(key);if(!current||Number(item.score||0)>Number(current.score||0))map.set(key,{...item,name})}
function allowedMerch(groups,type){if(!type)return false;if(!groups.length)return true;const t=compactFlexible(type);return groups.some(g=>[g.canonical,g.broad].filter(Boolean).some(v=>compactFlexible(v)===t))}
function commerceCandidates(hits,q){const out=new Map(),normalized=normalizeIntentQuery(q),subject=normalized.subject,groups=normalized.groups,qCompact=compactFlexible(normalized.cleaned);if(!subject)return[];for(let i=0;i<hits.length;i++){const h=hits[i]||{},title=String(h.name||''),type=detectMerchLabel(title);if(!type||!allowedMerch(groups,type))continue;let score=150-i*2+popularityPoints(h)+recencyPoints(h.releaseDate);if(qCompact&&compactFlexible(title).includes(qCompact))score+=45;const candidateType=groups[0]?.canonical||type;addCandidate(out,{name:`${subject} ${candidateType}`.replace(/\s+/g,' ').trim(),kind:'commerce',label:labelFor(h),detail:'現在の商品傾向から',score:score+28})}return[...out.values()]}
function entityCandidates(data,q){const normalized=normalizeIntentQuery(q),subject=normalized.subject||q,qCompact=compactFlexible(subject),groups=normalized.groups,out=[];for(const x of data?.items||[]){const base=clamp(x.name),n=compactFlexible(base);if(!base||!n)continue;let score=100;if(qCompact&&(n.startsWith(qCompact)||n.includes(qCompact)))score+=85;const merch=groups[0]?.canonical||'';out.push({name:merch?`${base} ${merch}`:base,kind:x.kind||'entity',image:x.image||null,label:x.kind==='character'?'キャラクター':'作品',detail:merch?'グッズ種別を維持':'候補',score})}return out}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{items:[]},30)}const u=new URL(req.url,'http://local'),q=clamp(u.searchParams.get('q')||'');if(normalizeFlexible(q).length<2)return send(res,200,{items:[],version:SUGGEST_ENGINE_VERSION},60);const key=`${SUGGEST_ENGINE_VERSION}|${normalizeFlexible(q)}`,cached=cache.get(key);if(cached&&Date.now()-cached.at<120_000)return send(res,200,cached.value,60);
  const resolution=resolveSearchQuery(q),prefix=resolution.inputCompletion,known=resolution.typoCorrection,preNormalized=resolution.resolved||q,normalized=normalizeIntentQuery(preNormalized),baseQuery=normalized.cleaned||preNormalized,providerQuery=baseQuery,intent=detectIntent(baseQuery),groups=primaryMerchGroups(intent);
  const [productsResult,entitiesResult]=await Promise.allSettled([yahooFetch(providerQuery),entitySuggest(cleanSubject(intent)||baseQuery)]);const products=productsResult.status==='fulfilled'?productsResult.value:[],entities=entitiesResult.status==='fulfilled'?entitiesResult.value:{items:[]};let fallbackProducts=[];
  if(products.length<5&&cleanSubject(intent)&&groups.length){const merchQuery=[...new Set(groups.map(g=>g.canonical).filter(Boolean))].join(' ');if(merchQuery&&compactFlexible(merchQuery)!==compactFlexible(providerQuery)){try{fallbackProducts=await yahooFetch(merchQuery)}catch{}}}
  const merged=new Map();addCandidate(merged,{name:q,kind:'exact',label:'このまま検索',detail:'入力した言葉を変更しません',score:280});
  if(normalized.changed)addCandidate(merged,{name:normalized.cleaned,kind:'correction',label:'表記を整理',detail:'グッズ名の重複や断片を整理',score:430});
  if(prefix.changed)addCandidate(merged,{name:prefix.corrected,kind:'correction',label:'入力補完',detail:`「${prefix.completion?.from||''}」→「${prefix.completion?.to||''}」`,score:400});
  if(known.changed)addCandidate(merged,{name:known.corrected,kind:'correction',label:'誤字・表記補正',detail:`「${known.corrections[0]?.from||''}」→「${known.corrections[0]?.to||''}」`,score:390});
  const dynamic=findDynamicCorrection(baseQuery,[...products,...fallbackProducts].map(x=>x?.name).filter(Boolean));if(dynamic&&compactFlexible(dynamic.corrected)!==compactFlexible(q))addCandidate(merged,{name:dynamic.corrected,kind:'correction',label:'もしかして',detail:`近い商品表記を確認（${Math.round(dynamic.confidence*100)}%）`,score:370});
  for(const item of commerceCandidates([...products,...fallbackProducts],baseQuery))addCandidate(merged,item);for(const item of entityCandidates(entities,baseQuery))addCandidate(merged,item);const items=[...merged.values()].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,8).map(({score,...x})=>x);
  const value={query:q,providerQuery,items,inputCompletion:prefix.changed?prefix:null,typoCorrection:known.changed?known:null,normalizedQuery:normalized.changed?normalized.cleaned:null,version:SUGGEST_ENGINE_VERSION,signals:{commerce:products.length,fallbackCommerce:fallbackProducts.length,entity:(entities.items||[]).length,popularity:'Yahoo!ショッピングおすすめ順・レビュー件数',freshness:'発売日'},generatedAt:new Date().toISOString()};cache.set(key,{at:Date.now(),value});if(cache.size>120)cache.delete(cache.keys().next().value);return send(res,200,value,60);
}
