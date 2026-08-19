import { json, cleanQuery, liveSearch as coreLiveSearch } from './_core.mjs';
import { normalizeFlexible, buildSearchVariants, rankSearchItems, countStrongMatches } from './search-language.mjs';
import { correctKnownQuery, typoFallbackVariants, rerankWithTypos } from './search-typo.mjs';

const SEARCH_ALIAS_VERSION='2026-08-19.3';
const cache=new Map();
const MAX_RESULTS=120;
const MAX_VARIANTS=5;

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
  res.setHeader('Cache-Control',cacheable?'public, max-age=10, s-maxage=25, stale-while-revalidate=90':'no-store');
  return res.status(status).json(data);
}
function addVariants(target,seen,list=[]){
  for(const v of list){
    const q=String(v?.query||'').trim(),key=normalizeFlexible(q);if(!q||!key||seen.has(key))continue;
    seen.add(key);target.push(v);if(target.length>=MAX_VARIANTS)break;
  }
}
function buildRobustVariants(query){
  const known=correctKnownQuery(query),variants=[],seen=new Set();
  addVariants(variants,seen,buildSearchVariants(query,5));
  if(known.changed)addVariants(variants,seen,buildSearchVariants(known.corrected,5).map(v=>({...v,reason:`typo-${v.reason}`,weight:Number(v.weight||0)+5})));
  return{known,variants};
}
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  const u=new URL(req.url,'http://local'),q=cleanQuery(u.searchParams.get('q')||'');
  if(!q)return send(res,200,{query:'',items:[],providers:{},queryVariants:[],generatedAt:new Date().toISOString()},true);
  const cacheKey=normalizeFlexible(q),existing=cache.get(cacheKey);
  if(existing&&Date.now()-existing.at<30_000)return send(res,200,existing.value,true);

  const {known,variants}=buildRobustVariants(q),runs=[];
  const scoringQuery=known.changed?known.corrected:q;
  try{
    if(variants[0])runs.push(await runVariant(variants[0],0));
    if(variants[1])runs.push(await runVariant(variants[1],1));
    let currentItems=runs.flatMap(run=>run.items);
    for(let i=2;i<variants.length&&runs.length<4;i++){
      if(countStrongMatches(currentItems,scoringQuery)>=10)break;
      runs.push(await runVariant(variants[i],i));
      currentItems=runs.flatMap(run=>run.items);
    }
    if(countStrongMatches(currentItems,scoringQuery)<6&&runs.length<MAX_VARIANTS){
      const fallback=typoFallbackVariants(scoringQuery);
      for(const v of fallback){
        if(runs.length>=MAX_VARIANTS)break;
        if(runs.some(run=>normalizeFlexible(run.variant.query)===normalizeFlexible(v.query)))continue;
        runs.push(await runVariant(v,runs.length));
      }
    }
  }catch(error){
    if(!runs.length)return send(res,200,{query:q,items:[],providers:{search:{ok:false,count:0,error:String(error?.message||error).slice(0,120)}},queryVariants:variants.map(v=>v.query),aliasVersion:SEARCH_ALIAS_VERSION,typoCorrection:known.changed?known:null,generatedAt:new Date().toISOString()},true);
  }

  const providers={};let items=[];
  for(const run of runs){mergeProviderState(providers,run.data.providers,run.variant.query);items.push(...run.items)}
  let ranked=rankSearchItems(items,scoringQuery);
  if(!known.changed)ranked=rerankWithTypos(ranked,q);
  ranked=ranked.slice(0,MAX_RESULTS);
  for(const [name,state] of Object.entries(providers)){
    state.count=ranked.filter(item=>name==='yahooShopping'?item.source==='Yahoo!ショッピング':name==='rakuten'?item.source==='楽天市場':name==='x'?item.source==='X':false).length;
  }
  const value={
    query:q,
    providerQuery:variants.find(v=>/canonical/.test(v.reason))?.query||variants[0]?.query||q,
    queryVariants:runs.map(run=>({query:run.variant.query,reason:run.variant.reason})),
    aliasVersion:SEARCH_ALIAS_VERSION,
    typoCorrection:known.changed?known:null,
    items:ranked,
    providers,
    generatedAt:new Date().toISOString()
  };
  cache.set(cacheKey,{at:Date.now(),value});if(cache.size>100)cache.delete(cache.keys().next().value);
  return send(res,200,value,true);
}
