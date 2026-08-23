import { json, cleanQuery, liveSearch as coreLiveSearch } from './_core.mjs';
import {
  MERCH_GROUPS,
  ENTITY_GROUPS,
  normalizeFlexible,
  compactFlexible,
  detectIntent,
  buildSearchVariants,
  rankSearchItems,
  countStrongMatches
} from './_search-language.mjs';

const SEARCH_ALIAS_VERSION='2026-08-21.7';
const cache=new Map();
const MAX_RESULTS=120;
const MAX_VARIANTS=5;
const GENERIC=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古','セット','限定','予約','goods','item']);
const OSHI_MERCH_HINTS=[
  'アクスタ','アクリルスタンド','アクキー','アクリルキーホルダー','缶バッジ','缶バ','ぬい','ぬいぐるみ','マスコット',
  'トレカ','トレーディングカード','ブロマイド','チェキ','クリアファイル','ステッカー','シール','ラバスト','ラバーストラップ',
  'タペストリー','ペンライト','フィギュア','キーホルダー','キーチェーン','チャーム','色紙','ポスター','うちわ',
  'アクリルパネル','アクリルボード','フォトカード','フォト風カード','ボイス','公式グッズ','限定グッズ','記念グッズ','コラボグッズ'
];
const OSHI_CONTEXT_HINTS=['公式','限定','受注','予約','コラボ','周年','誕生日','イベント','ポップアップ','popup','特典','ランダム','トレーディング'];
const GENERIC_RETAIL_HINTS=['レディース','メンズ','日用品','生活雑貨','収納','インテリア','工具','パーツ','互換','汎用','美容','コスメ','食品','家電'];
const NON_MERCH_HINTS=['収納ケース','保護ケース','ディスプレイケース','台座のみ','パーツのみ','保護フィルム','空箱','互換','風','イメージ'];

function distance(a='',b=''){
  const x=[...String(a)],y=[...String(b)],n=x.length,m=y.length;
  if(!n)return m;if(!m)return n;
  const d=Array.from({length:n+1},()=>Array(m+1).fill(0));
  for(let i=0;i<=n;i++)d[i][0]=i;for(let j=0;j<=m;j++)d[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
    const cost=x[i-1]===y[j-1]?0:1;
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
    if(i>1&&j>1&&x[i-1]===y[j-2]&&x[i-2]===y[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[n][m];
}
function similarity(a,b){const x=compactFlexible(a),y=compactFlexible(b),max=Math.max([...x].length,[...y].length);return max?1-distance(x,y)/max:0}
function script(value=''){const v=compactFlexible(value);if(/^[a-z0-9]+$/i.test(v))return'latin';if(/^[ぁ-んァ-ヶ一-龯々ー]+$/.test(v))return'ja';return'mixed'}
function threshold(value=''){const n=[...compactFlexible(value)].length;return n<=3?1:n<=5?.79:n<=8?.82:.84}
const LEXICON=(()=>{
  const out=[];
  for(const group of [...ENTITY_GROUPS,...MERCH_GROUPS])for(const alias of [...new Set([group.canonical,group.broad,...(group.aliases||[])].filter(Boolean))]){
    const compact=compactFlexible(alias);if([...compact].length<4)continue;
    out.push({alias,compact,canonical:group.canonical,kind:MERCH_GROUPS.includes(group)?'merch':'entity'});
  }
  return out;
})();
function completeKnownPrefix(query=''){
  const tokens=normalizeFlexible(query).split(/\s+/).filter(Boolean);let best=null;
  tokens.forEach((token,index)=>{
    const t=compactFlexible(token),len=[...t].length;if(len<4)return;
    for(const item of LEXICON){
      const candidate=item.compact;if(candidate===t||!candidate.startsWith(t))continue;
      const missing=[...candidate].length-len;if(missing<1||missing>5)continue;
      const score=len/[...candidate].length+(item.kind==='merch'?.08:0);
      if(!best||score>best.score)best={index,item,score};
    }
  });
  if(!best)return{changed:false,corrected:normalizeFlexible(query),completion:null};
  const next=[...tokens];next[best.index]=best.item.canonical;
  return{changed:true,corrected:next.join(' '),completion:{from:tokens[best.index],to:best.item.canonical}};
}
function correctKnownQuery(query=''){
  const tokens=normalizeFlexible(query).split(/\s+/).filter(Boolean),corrections=[];
  const corrected=tokens.map(token=>{
    const t=compactFlexible(token);if(LEXICON.some(x=>x.compact===t))return token;
    const kind=script(token);let best=null;
    for(const item of LEXICON){
      if(kind!=='mixed'&&script(item.alias)!==kind)continue;
      if(Math.abs([...t].length-[...item.compact].length)>2)continue;
      const score=similarity(t,item.compact);
      if(score<Math.max(threshold(token),threshold(item.alias)))continue;
      if(!best||score>best.score)best={item,score};
    }
    if(!best)return token;
    corrections.push({from:token,to:best.item.canonical,confidence:Number(best.score.toFixed(3))});
    return best.item.canonical;
  });
  const value=corrected.join(' ').trim();
  return{query:String(query||''),corrected:value,changed:compactFlexible(value)!==compactFlexible(query),corrections};
}
function candidateWindows(text=''){
  const tokens=normalizeFlexible(text).split(/\s+/).filter(Boolean).filter(x=>!GENERIC.has(x)),out=[];
  for(let i=0;i<tokens.length;i++)for(let size=1;size<=3&&i+size<=tokens.length;size++){
    const value=tokens.slice(i,i+size).join(' '),c=compactFlexible(value);
    if([...c].length<4||[...c].length>28||/^\d+$/.test(c))continue;
    if(detectIntent(value).merchGroups.length)continue;
    out.push(value);
  }
  return[...new Set(out)];
}
function fuzzyEntityScore(query,item){
  const entity=String(detectIntent(query).entity||'').trim(),ec=compactFlexible(entity);if([...ec].length<4)return 0;
  const text=[item?.title,item?.description,item?.series,item?.character,item?.type,item?.collab,item?.shop,...(item?.tags||[])].filter(Boolean).join(' ');
  let best=0;
  for(const candidate of candidateWindows(text)){
    const c=compactFlexible(candidate);if(Math.abs([...ec].length-[...c].length)>3)continue;
    best=Math.max(best,similarity(ec,c));if(best>=.96)break;
  }
  return best;
}
function rerankFuzzy(items=[],query=''){
  return items.map(item=>{
    const s=fuzzyEntityScore(query,item),bonus=s>=.9?250:s>=.82?210:s>=.75?135:0;
    return{...item,_fuzzySimilarity:Number(s.toFixed(3)),_score:Number(item?._score||0)+bonus};
  }).sort((a,b)=>(b._score||0)-(a._score||0)||(a.price??Infinity)-(b.price??Infinity));
}
export function oshiMerchBias(item={},query=''){
  const intent=detectIntent(query);
  const text=normalizeFlexible([item.title,item.description,item.series,item.character,item.type,item.collab,item.shop,...(item.tags||[])].filter(Boolean).join(' '));
  let score=0;
  const merchHits=OSHI_MERCH_HINTS.filter(term=>text.includes(normalizeFlexible(term))).length;
  const contextHits=OSHI_CONTEXT_HINTS.filter(term=>text.includes(normalizeFlexible(term))).length;
  const genericHits=GENERIC_RETAIL_HINTS.filter(term=>text.includes(normalizeFlexible(term))).length;
  const nonMerchHits=NON_MERCH_HINTS.filter(term=>text.includes(normalizeFlexible(term))).length;
  if(merchHits)score+=Math.min(165,100+(merchHits-1)*20);
  if(contextHits)score+=Math.min(60,contextHits*20);
  if(genericHits&&merchHits===0)score-=Math.min(100,genericHits*35);
  if(nonMerchHits)score-=Math.min(165,nonMerchHits*60);
  if(!intent.merchGroups.length&&merchHits===0)score-=45;
  return score;
}
function applyOshiMerchRanking(items=[],query=''){
  return items.map(item=>({...item,_score:Number(item?._score||0)+oshiMerchBias(item,query)}))
    .sort((a,b)=>(b._score||0)-(a._score||0)||(b.reviewCount||0)-(a.reviewCount||0)||(a.price??Infinity)-(b.price??Infinity));
}
function fallbackVariants(query=''){
  const intent=detectIntent(query);if(!intent.merchGroups.length)return[];
  const canonical=[...new Set(intent.merchGroups.map(g=>g.canonical).filter(Boolean))].join(' ');
  const broad=[...new Set(intent.merchGroups.map(g=>g.broad||g.canonical).filter(Boolean))].join(' '),out=[];
  if(canonical)out.push({query:canonical,reason:'fuzzy-merch-fallback',weight:3});
  if(broad&&compactFlexible(broad)!==compactFlexible(canonical))out.push({query:broad,reason:'fuzzy-broad-fallback',weight:1});
  return out;
}
function mergeProviderState(target={},source={},variant){
  for(const [name,state] of Object.entries(source||{})){
    const current=target[name]||{ok:false,count:0,error:null,queries:[]};
    current.ok=current.ok||state?.ok===true;
    current.count+=Number(state?.count||0);
    if(state?.error&&!current.error)current.error=String(state.error).slice(0,120);
    if(variant&&!current.queries.includes(variant))current.queries.push(variant);
    target[name]=current;
  }
  return target;
}
async function runVariant(variant,index){
  const data=await coreLiveSearch(variant.query);
  return{variant,index,data,items:(data.items||[]).map(item=>({...item,_queryVariant:variant.query,_queryReason:variant.reason,_variantWeight:Number(variant.weight||0)-index*2}))};
}
function send(res,status,data,cacheable=false){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-OSHIRU-Search-Version',SEARCH_ALIAS_VERSION);
  res.setHeader('Cache-Control',cacheable?'public, max-age=8, s-maxage=22, stale-while-revalidate=75':'no-store');
  return res.status(status).json(data);
}
function robustVariants(query){
  const prefix=completeKnownPrefix(query),known=correctKnownQuery(prefix.changed?prefix.corrected:query);
  const seed=known.changed?known.corrected:(prefix.changed?prefix.corrected:query),out=[],seen=new Set();
  const add=list=>{
    for(const v of list){
      const key=normalizeFlexible(v?.query||'');if(!key||seen.has(key))continue;
      seen.add(key);out.push(v);if(out.length>=MAX_VARIANTS)break;
    }
  };
  add(buildSearchVariants(query,5));
  if(compactFlexible(seed)!==compactFlexible(query))add(buildSearchVariants(seed,5).map(v=>({...v,reason:`corrected-${v.reason}`,weight:Number(v.weight||0)+5})));
  return{prefix,known,seed,variants:out};
}

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  const u=new URL(req.url,'http://local'),q=cleanQuery(u.searchParams.get('q')||'');
  if(!q)return send(res,200,{query:'',items:[],providers:{},queryVariants:[],idle:true,generatedAt:new Date().toISOString()},true);
  const cacheKey=`${SEARCH_ALIAS_VERSION}|${normalizeFlexible(q)}`,existing=cache.get(cacheKey);
  if(existing&&Date.now()-existing.at<30_000)return send(res,200,existing.value,true);

  const {prefix,known,seed,variants}=robustVariants(q),runs=[],scoringQuery=seed||q;
  try{
    for(let i=0;i<variants.length&&runs.length<4;i++){
      if(i>=2&&countStrongMatches(runs.flatMap(run=>run.items),scoringQuery)>=10)break;
      runs.push(await runVariant(variants[i],i));
    }
    const current=runs.flatMap(run=>run.items);
    if(countStrongMatches(current,scoringQuery)<6&&runs.length<MAX_VARIANTS){
      for(const v of fallbackVariants(scoringQuery)){
        if(runs.length>=MAX_VARIANTS)break;
        if(runs.some(run=>normalizeFlexible(run.variant.query)===normalizeFlexible(v.query)))continue;
        runs.push(await runVariant(v,runs.length));
      }
    }
  }catch(error){
    if(!runs.length)return send(res,200,{query:q,items:[],providers:{search:{ok:false,count:0,error:String(error?.message||error).slice(0,120)}},queryVariants:variants.map(v=>v.query),aliasVersion:SEARCH_ALIAS_VERSION,generatedAt:new Date().toISOString()},true);
  }

  const providers={};let items=[];
  for(const run of runs){mergeProviderState(providers,run.data.providers,run.variant.query);items.push(...run.items)}
  let ranked=rankSearchItems(items,scoringQuery);
  if(!known.changed)ranked=rerankFuzzy(ranked,q);
  ranked=applyOshiMerchRanking(ranked,scoringQuery).slice(0,MAX_RESULTS);
  for(const [name,state] of Object.entries(providers)){
    state.count=ranked.filter(item=>name==='yahooShopping'?item.source==='Yahoo!ショッピング':name==='rakuten'?item.source==='楽天市場':name==='x'?item.source==='X':false).length;
  }
  const value={
    query:q,
    providerQuery:variants.find(v=>/canonical/.test(v.reason))?.query||variants[0]?.query||q,
    queryVariants:runs.map(run=>({query:run.variant.query,reason:run.variant.reason})),
    aliasVersion:SEARCH_ALIAS_VERSION,
    inputCompletion:prefix.changed?prefix:null,
    typoCorrection:known.changed?known:null,
    items:ranked,
    providers,
    generatedAt:new Date().toISOString()
  };
  cache.set(cacheKey,{at:Date.now(),value});if(cache.size>100)cache.delete(cache.keys().next().value);
  return send(res,200,value,true);
}
