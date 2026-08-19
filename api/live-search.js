import { json, cleanQuery, liveSearch as coreLiveSearch } from './_core.mjs';
import { normalizeFlexible, buildSearchVariants, rankSearchItems, countStrongMatches } from './search-language.mjs';

const SEARCH_ALIAS_VERSION='2026-08-19.2';
const cache=new Map();
const MAX_RESULTS=120;

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
  return{variant,index,data,items:(data.items||[]).map(item=>({...item,_queryVariant:variant.query,_queryReason:variant.reason,_variantWeight:variant.weight-index*2}))};
}
function send(res,status,data,cacheable=false){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control',cacheable?'public, max-age=10, s-maxage=25, stale-while-revalidate=90':'no-store');
  return res.status(status).json(data);
}
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  const u=new URL(req.url,'http://local'),q=cleanQuery(u.searchParams.get('q')||'');
  if(!q)return send(res,200,{query:'',items:[],providers:{},queryVariants:[],generatedAt:new Date().toISOString()},true);
  const cacheKey=normalizeFlexible(q),existing=cache.get(cacheKey);
  if(existing&&Date.now()-existing.at<30_000)return send(res,200,existing.value,true);

  const variants=buildSearchVariants(q,5),runs=[];
  try{
    if(variants[0])runs.push(await runVariant(variants[0],0));
    if(variants[1])runs.push(await runVariant(variants[1],1));
    let currentItems=runs.flatMap(run=>run.items);
    if(countStrongMatches(currentItems,q)<12&&variants[2])runs.push(await runVariant(variants[2],2));
    currentItems=runs.flatMap(run=>run.items);
    if(countStrongMatches(currentItems,q)<8&&variants[3])runs.push(await runVariant(variants[3],3));
  }catch(error){
    if(!runs.length)return send(res,200,{query:q,items:[],providers:{search:{ok:false,count:0,error:String(error?.message||error).slice(0,120)}},queryVariants:variants.map(v=>v.query),aliasVersion:SEARCH_ALIAS_VERSION,generatedAt:new Date().toISOString()},true);
  }

  const providers={};let items=[];
  for(const run of runs){mergeProviderState(providers,run.data.providers,run.variant.query);items.push(...run.items)}
  const ranked=rankSearchItems(items,q).slice(0,MAX_RESULTS);
  for(const [name,state] of Object.entries(providers)){
    state.count=ranked.filter(item=>name==='yahooShopping'?item.source==='Yahoo!ショッピング':name==='rakuten'?item.source==='楽天市場':name==='x'?item.source==='X':false).length;
  }
  const value={query:q,providerQuery:variants.find(v=>v.reason==='canonical')?.query||variants[0]?.query||q,queryVariants:runs.map(run=>({query:run.variant.query,reason:run.variant.reason})),aliasVersion:SEARCH_ALIAS_VERSION,items:ranked,providers,generatedAt:new Date().toISOString()};
  cache.set(cacheKey,{at:Date.now(),value});if(cache.size>100)cache.delete(cache.keys().next().value);
  return send(res,200,value,true);
}
