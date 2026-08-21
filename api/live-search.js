import { json, cleanQuery, liveSearch as coreLiveSearch, snapshotSearch } from './_core.mjs';
import {
  MERCH_GROUPS,
  ENTITY_GROUPS,
  normalizeFlexible,
  compactFlexible,
  detectIntent,
  buildSearchVariants,
  rankSearchItems
} from './search-language.mjs';

const SEARCH_ALIAS_VERSION='2026-08-21.4-stage';
const cache=new Map();
const discoveryCache=new Map();
const amazonCache=new Map();
const MAX_RESULTS=120;
const GENERIC=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古','セット','限定','予約','goods','item']);
const WEB_MARKETS=[
  {key:'mercari',source:'メルカリ',domain:'jp.mercari.com',path:/^\/item\//},
  {key:'yahooFlea',source:'Yahoo!フリマ',domain:'paypayfleamarket.yahoo.co.jp',path:/^\/item\//},
  {key:'yahooAuction',source:'Yahoo!オークション',domain:'auctions.yahoo.co.jp',path:/(?:\/jp)?\/auction\//}
];

function distance(a='',b=''){
  const x=[...String(a)],y=[...String(b)],n=x.length,m=y.length;if(!n)return m;if(!m)return n;
  const d=Array.from({length:n+1},()=>Array(m+1).fill(0));for(let i=0;i<=n;i++)d[i][0]=i;for(let j=0;j<=m;j++)d[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){const cost=x[i-1]===y[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);if(i>1&&j>1&&x[i-1]===y[j-2]&&x[i-2]===y[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[n][m];
}
function similarity(a,b){const x=compactFlexible(a),y=compactFlexible(b),max=Math.max([...x].length,[...y].length);return max?1-distance(x,y)/max:0}
function script(value=''){const v=compactFlexible(value);if(/^[a-z0-9]+$/i.test(v))return'latin';if(/^[ぁ-んァ-ヶ一-龯々ー]+$/.test(v))return'ja';return'mixed'}
function threshold(value=''){const n=[...compactFlexible(value)].length;return n<=3?1:n<=5?.79:n<=8?.82:.84}
const LEXICON=(()=>{const out=[];for(const group of [...ENTITY_GROUPS,...MERCH_GROUPS])for(const alias of [...new Set([group.canonical,group.broad,...(group.aliases||[])].filter(Boolean))]){const compact=compactFlexible(alias);if([...compact].length<4)continue;out.push({alias,compact,canonical:group.canonical,kind:MERCH_GROUPS.includes(group)?'merch':'entity'})}return out})();
function completeKnownPrefix(query=''){
  const tokens=normalizeFlexible(query).split(/\s+/).filter(Boolean);let best=null;
  tokens.forEach((token,index)=>{const t=compactFlexible(token),len=[...t].length;if(len<4)return;for(const item of LEXICON){const candidate=item.compact;if(candidate===t||!candidate.startsWith(t))continue;const missing=[...candidate].length-len;if(missing<1||missing>5)continue;const score=len/[...candidate].length+(item.kind==='merch'?.08:0);if(!best||score>best.score)best={index,item,score}}});
  if(!best)return{changed:false,corrected:normalizeFlexible(query),completion:null};const next=[...tokens];next[best.index]=best.item.canonical;return{changed:true,corrected:next.join(' '),completion:{from:tokens[best.index],to:best.item.canonical}};
}
function correctKnownQuery(query=''){
  const tokens=normalizeFlexible(query).split(/\s+/).filter(Boolean),corrections=[];
  const corrected=tokens.map(token=>{const t=compactFlexible(token);if(LEXICON.some(x=>x.compact===t))return token;const kind=script(token);let best=null;for(const item of LEXICON){if(kind!=='mixed'&&script(item.alias)!==kind)continue;if(Math.abs([...t].length-[...item.compact].length)>2)continue;const score=similarity(t,item.compact);if(score<Math.max(threshold(token),threshold(item.alias)))continue;if(!best||score>best.score)best={item,score}}if(!best)return token;corrections.push({from:token,to:best.item.canonical,confidence:Number(best.score.toFixed(3))});return best.item.canonical});
  const value=corrected.join(' ').trim();return{query:String(query||''),corrected:value,changed:compactFlexible(value)!==compactFlexible(query),corrections};
}
function candidateWindows(text=''){
  const tokens=normalizeFlexible(text).split(/\s+/).filter(Boolean).filter(x=>!GENERIC.has(x)),out=[];for(let i=0;i<tokens.length;i++)for(let size=1;size<=3&&i+size<=tokens.length;size++){const value=tokens.slice(i,i+size).join(' '),c=compactFlexible(value);if([...c].length<4||[...c].length>28||/^\d+$/.test(c))continue;if(detectIntent(value).merchGroups.length)continue;out.push(value)}return[...new Set(out)];
}
function fuzzyEntityScore(query,item){const entity=String(detectIntent(query).entity||'').trim(),ec=compactFlexible(entity);if([...ec].length<4)return 0;const text=[item?.title,item?.description,item?.series,item?.character,item?.type,item?.collab,item?.shop,...(item?.tags||[])].filter(Boolean).join(' ');let best=0;for(const candidate of candidateWindows(text)){const c=compactFlexible(candidate);if(Math.abs([...ec].length-[...c].length)>3)continue;best=Math.max(best,similarity(ec,c));if(best>=.96)break}return best}
function rerankFuzzy(items=[],query=''){return items.map(item=>{const s=fuzzyEntityScore(query,item),bonus=s>=.9?250:s>=.82?210:s>=.75?135:0;return{...item,_fuzzySimilarity:Number(s.toFixed(3)),_score:Number(item?._score||0)+bonus}}).sort((a,b)=>(b._score||0)-(a._score||0)||(a.price??Infinity)-(b.price??Infinity))}
function robustQuery(query){
  const prefix=completeKnownPrefix(query),known=correctKnownQuery(prefix.changed?prefix.corrected:query),seed=known.changed?known.corrected:(prefix.changed?prefix.corrected:query);
  const variants=buildSearchVariants(seed||query,5);
  const preferred=variants.find(v=>/canonical/.test(v.reason))?.query||variants[0]?.query||seed||query;
  return{prefix,known,seed,providerQuery:normalizeFlexible(preferred)};
}
function send(res,status,data,cacheable=false){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control',cacheable?'public, max-age=12, s-maxage=35, stale-while-revalidate=120':'no-store');return res.status(status).json(data)}
function dedupe(items=[]){const seen=new Set(),out=[];for(const item of items){const k=String(item?.directUrl||item?.canonicalUrl||item?.url||`${item?.source}|${item?.title}|${item?.price}`).replace(/[?#].*$/,'');if(!k||seen.has(k))continue;seen.add(k);out.push(item)}return out}
function mergeProviderState(target={},source={}){for(const [name,state] of Object.entries(source||{})){target[name]={ok:state?.ok===true,count:Number(state?.count||0),error:state?.error?String(state.error).slice(0,140):null,...(state?.skipped?{skipped:true}:{})}}return target}
function settledValue(result,fallback){return result.status==='fulfilled'?result.value:fallback}

async function fetchJson(url,opts={},timeoutMs=2200){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{...opts,signal:controller.signal});
    const text=await response.text();
    if(text.length>2_000_000)throw new Error('response_too_large');
    let data=null;try{data=text?JSON.parse(text):{}}catch{data={}}
    if(!response.ok){const code=data?.error?.code||data?.code||data?.error_description||data?.message||`http_${response.status}`;throw new Error(String(code).slice(0,120))}
    return data;
  }catch(error){if(error?.name==='AbortError')throw new Error('timeout');throw error}finally{clearTimeout(timer)}
}

let amazonTokenValue='';
let amazonTokenExpiresAt=0;
let amazonTokenPromise=null;
function amazonReady(){return Boolean(process.env.AMAZON_CREATORS_CLIENT_ID&&process.env.AMAZON_CREATORS_CLIENT_SECRET&&process.env.AMAZON_PARTNER_TAG)}
async function amazonAccessToken(){
  if(!amazonReady())throw new Error('not_configured');
  const now=Date.now();if(amazonTokenValue&&now<amazonTokenExpiresAt-60_000)return amazonTokenValue;if(amazonTokenPromise)return amazonTokenPromise;
  const endpoint=process.env.AMAZON_TOKEN_ENDPOINT||'https://api.amazon.co.jp/auth/o2/token';
  amazonTokenPromise=fetchJson(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',client_id:process.env.AMAZON_CREATORS_CLIENT_ID,client_secret:process.env.AMAZON_CREATORS_CLIENT_SECRET,scope:'creatorsapi::default'})},1800).then(data=>{
    const token=String(data?.access_token||'');if(!token)throw new Error('token_missing');amazonTokenValue=token;amazonTokenExpiresAt=Date.now()+Math.max(300,Number(data?.expires_in)||3600)*1000;return token;
  }).finally(()=>{amazonTokenPromise=null});
  return amazonTokenPromise;
}
function mapAmazonItem(item,i=0){
  const listing=item?.offersV2?.listings?.[0]||{},money=listing?.price?.money||{},title=item?.itemInfo?.title?.displayValue||'',image=item?.images?.primary?.medium?.url||null;
  const amount=Number(money?.amount),price=Number.isFinite(amount)?Math.round(amount):null,availability=String(listing?.availability?.type||'').toUpperCase();
  return{id:`amazon-${item?.asin||i}`,source:'Amazon',title:title||'商品名不明',price,shipping:null,fee:0,status:availability==='OUT_OF_STOCK'?'在庫なし':'販売中候補',condition:listing?.condition?.value||'要確認',url:item?.detailPageURL||'#',image,type:'通販',shop:listing?.merchantInfo?.name||'Amazon',asin:item?.asin||'',verifiedAt:new Date().toISOString(),origin:'official-api',real:true,imageVerified:Boolean(image)};
}
async function amazonSearch(query){
  const q=cleanQuery(query);if(!amazonReady()||!q)return{items:[],provider:{ok:false,count:0,error:null,skipped:true}};
  const key=normalizeFlexible(q),hit=amazonCache.get(key);if(hit&&Date.now()-hit.at<60_000)return hit.value;
  try{
    const token=await amazonAccessToken(),base=(process.env.AMAZON_CREATORS_API_ENDPOINT||'https://creatorsapi.amazon').replace(/\/$/,''),marketplace=process.env.AMAZON_MARKETPLACE||'www.amazon.co.jp';
    const data=await fetchJson(`${base}/catalog/v1/searchItems`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','x-marketplace':marketplace},body:JSON.stringify({keywords:q,partnerTag:process.env.AMAZON_PARTNER_TAG,marketplace,searchIndex:'All',itemCount:10,resources:['images.primary.medium','itemInfo.title','offersV2.listings.availability','offersV2.listings.condition','offersV2.listings.merchantInfo','offersV2.listings.price']})},2200);
    const items=(data?.searchResult?.items||[]).map(mapAmazonItem).filter(x=>x.url&&x.url!=='#');const value={items,provider:{ok:true,count:items.length,error:null}};amazonCache.set(key,{at:Date.now(),value});if(amazonCache.size>80)amazonCache.delete(amazonCache.keys().next().value);return value;
  }catch(error){return{items:[],provider:{ok:false,count:0,error:String(error?.message||error).slice(0,120)}}}
}

function sourceFromUrl(value=''){
  try{const u=new URL(value);for(const market of WEB_MARKETS)if(u.hostname===market.domain&&market.path.test(u.pathname))return market.source}catch{}return'';
}
function mapWebRows(rows=[],query='',origin='public-page-live'){
  const now=new Date().toISOString(),intent=detectIntent(query),type=intent.merchGroups?.[0]?.canonical||'その他',out=[];
  for(let i=0;i<rows.length&&out.length<30;i++){
    const row=rows[i]||{},url=String(row.url||'').trim(),source=sourceFromUrl(url),title=String(row.title||'').replace(/\s+/g,' ').trim().slice(0,180);if(!source||!title)continue;
    const snippet=String(row.description||row.snippet||'').replace(/\s+/g,' ').trim();
    out.push({id:`web-${i}-${Buffer.from(url).toString('base64url').slice(-12)}`,source,title,description:snippet.slice(0,240),price:null,shipping:null,fee:0,status:'販売中候補',condition:'要確認',url,image:null,type,shop:'',verifiedAt:now,origin,real:true,imageVerified:false,tags:[query,type].filter(Boolean)});
  }
  return dedupe(out);
}
async function braveSearchOne(market,query){
  const params=new URLSearchParams({q:`${query} site:${market.domain}`,count:'6',country:'JP',search_lang:'ja'});
  const data=await fetchJson(`https://api.search.brave.com/res/v1/web/search?${params}`,{headers:{accept:'application/json','x-subscription-token':process.env.BRAVE_SEARCH_API_KEY}},1700);
  const rows=(data?.web?.results||[]).map(x=>({title:x?.title||'',url:x?.url||'',description:x?.description||''}));
  return mapWebRows(rows,query,'public-page-live').filter(x=>x.source===market.source);
}
async function braveMarketplaceSearch(query=''){
  const q=cleanQuery(query);if(!process.env.BRAVE_SEARCH_API_KEY||!q)return{items:[],ok:false,skipped:true,error:null,public:{ok:false,count:0,sources:{}}};
  const key=`brave|${normalizeFlexible(q)}`,hit=discoveryCache.get(key);if(hit&&Date.now()-hit.at<45_000)return hit.value;
  const settled=await Promise.allSettled(WEB_MARKETS.map(m=>braveSearchOne(m,q))),items=[],sources={};
  settled.forEach((result,index)=>{const market=WEB_MARKETS[index],value=result.status==='fulfilled'?result.value:[];items.push(...value);sources[market.key]={ok:result.status==='fulfilled',count:value.length,error:result.status==='rejected'?String(result.reason?.message||result.reason).slice(0,100):null}});
  const value={items:dedupe(items),ok:settled.some(x=>x.status==='fulfilled'),error:settled.every(x=>x.status==='rejected')?'brave_search_failed':null,public:{ok:settled.some(x=>x.status==='fulfilled'),count:items.length,sources}};discoveryCache.set(key,{at:Date.now(),value});if(discoveryCache.size>80)discoveryCache.delete(discoveryCache.keys().next().value);return value;
}
function extractOutputText(data){return(data?.output||[]).flatMap(x=>x?.content||[]).map(x=>x?.text||'').join('').trim()}
async function openaiMarketplaceSearch(query=''){
  const q=cleanQuery(query);if(!process.env.OPENAI_API_KEY||!q)return{items:[],ok:false,skipped:true,error:null,public:{ok:false,count:0,sources:{}}};
  const key=`openai|${normalizeFlexible(q)}`,hit=discoveryCache.get(key);if(hit&&Date.now()-hit.at<45_000)return hit.value;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2400);
  try{
    const model=process.env.OPENAI_SEARCH_MODEL||process.env.OPENAI_MODEL||'gpt-5-mini';
    const prompt=`検索語「${q}」に関連するメルカリ・Yahoo!フリマ・Yahoo!オークションの公開中の個別商品/個別出品ページだけを探してください。検索結果ページやカテゴリページは除外し、存在を確認できないURLを作らないでください。最大18件。JSONだけで {"items":[{"title":"...","url":"https://...","price":null}]} を返してください。価格は推測せず常にnullにしてください。`;
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model,tools:[{type:'web_search',filters:{allowed_domains:WEB_MARKETS.map(x=>x.domain)},search_context_size:'low'}],input:prompt,max_output_tokens:1600})});
    if(!response.ok)throw new Error(`openai_${response.status}`);const data=await response.json();let text=extractOutputText(data).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim(),parsed={items:[]};try{parsed=JSON.parse(text)}catch{const match=text.match(/\{[\s\S]*\}/);if(match)parsed=JSON.parse(match[0])}
    const items=mapWebRows(Array.isArray(parsed?.items)?parsed.items:[],q,'openai-web-search'),sources={};for(const market of WEB_MARKETS)sources[market.key]={ok:true,count:items.filter(x=>x.source===market.source).length,error:null};const value={items,ok:true,error:null,public:{ok:true,count:items.length,sources}};discoveryCache.set(key,{at:Date.now(),value});return value;
  }catch(error){return{items:[],ok:false,error:String(error?.name==='AbortError'?'timeout':error?.message||error).slice(0,120),public:{ok:false,count:0,sources:{}}}}finally{clearTimeout(timer)}
}
async function discoverySearch(query){
  const brave=await braveMarketplaceSearch(query);
  if(!brave.skipped&&brave.ok)return{...brave,providerName:'brave'};
  if(process.env.OPENAI_API_KEY){
    const openai=await openaiMarketplaceSearch(query);
    if(!openai.skipped&&openai.ok)return{...openai,providerName:'openai',fallbackFrom:!brave.skipped?'brave':null};
    if(!brave.skipped)return{...brave,providerName:'brave'};
    return{...openai,providerName:'openai'};
  }
  return{...brave,providerName:'brave'};
}
function diversifySources(items=[],limit=MAX_RESULTS){
  const ranked=dedupe(items),sources=['メルカリ','Yahoo!フリマ','Yahoo!オークション','Yahoo!ショッピング','楽天市場','Amazon','X'],buckets=new Map(sources.map(s=>[s,ranked.filter(x=>x.source===s)])),chosen=[],used=new Set();
  const lead=Math.min(36,ranked.length);let progressed=true;while(chosen.length<lead&&progressed){progressed=false;for(const source of sources){const bucket=buckets.get(source)||[];while(bucket.length&&used.has(bucket[0]?.url))bucket.shift();if(!bucket.length)continue;const item=bucket.shift();chosen.push(item);used.add(item.url);progressed=true;if(chosen.length>=lead)break}}
  for(const item of ranked){if(chosen.length>=limit)break;if(used.has(item.url))continue;chosen.push(item);used.add(item.url)}return chosen.slice(0,limit);
}

async function fastPart(q,providerQuery){
  const snapshotQueries=compactFlexible(providerQuery)===compactFlexible(q)?[q]:[q,providerQuery];
  const snapshotPromise=Promise.all(snapshotQueries.map(x=>snapshotSearch(x))).then(parts=>dedupe(parts.flatMap(x=>x.items||[])));
  const [snapResult,coreResult]=await Promise.allSettled([snapshotPromise,coreLiveSearch(providerQuery)]);
  const snapshotItems=settledValue(snapResult,[]),live=settledValue(coreResult,{items:[],providers:{search:{ok:false,count:0,error:'live_search_failed'}}}),providers={snapshot:{ok:true,count:snapshotItems.length,error:null}};
  mergeProviderState(providers,live.providers);
  const items=dedupe([...snapshotItems.map(x=>({...x,_variantWeight:8,_queryReason:'verified-snapshot'})),...(live.items||[]).map(x=>({...x,_variantWeight:6,_queryReason:'live-provider'}))]);
  return{items,providers};
}
async function discoveryPart(providerQuery){
  const [amazonResult,webResult]=await Promise.allSettled([amazonSearch(providerQuery),discoverySearch(providerQuery)]);
  const amazon=settledValue(amazonResult,{items:[],provider:{ok:false,count:0,error:'amazon_search_failed'}}),discovery=settledValue(webResult,{items:[],ok:false,error:'web_search_failed',public:{ok:false,count:0,sources:{}},providerName:'web'}),providers={amazon:amazon.provider};
  providers.public=discovery.public||{ok:false,count:0,sources:{}};
  providers[discovery.providerName||'web']={ok:discovery.ok===true,count:discovery.items?.length||0,error:discovery.error||null,skipped:discovery.skipped===true};
  const items=dedupe([...(amazon.items||[]).map(x=>({...x,_variantWeight:6,_queryReason:'amazon-creators-api'})),...(discovery.items||[]).map(x=>({...x,_variantWeight:4,_queryReason:'marketplace-discovery'}))]);
  return{items,providers};
}

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  const u=new URL(req.url,'http://local'),q=cleanQuery(u.searchParams.get('q')||''),rawPhase=String(u.searchParams.get('phase')||'all').toLowerCase(),phase=['fast','discovery','all'].includes(rawPhase)?rawPhase:'all';
  if(!q)return send(res,200,{query:'',items:[],providers:{},queryVariants:[],phase,generatedAt:new Date().toISOString()},true);
  const cacheKey=`${SEARCH_ALIAS_VERSION}|${phase}|${normalizeFlexible(q)}`,existing=cache.get(cacheKey);if(existing&&Date.now()-existing.at<45_000)return send(res,200,existing.value,true);
  const {prefix,known,seed,providerQuery}=robustQuery(q),scoringQuery=seed||q;
  let items=[],providers={};
  if(phase==='fast'){
    const fast=await fastPart(q,providerQuery);items=fast.items;providers=fast.providers;
  }else if(phase==='discovery'){
    const discovery=await discoveryPart(providerQuery);items=discovery.items;providers=discovery.providers;
  }else{
    const [fastResult,discoveryResult]=await Promise.allSettled([fastPart(q,providerQuery),discoveryPart(providerQuery)]),fast=settledValue(fastResult,{items:[],providers:{}}),discovery=settledValue(discoveryResult,{items:[],providers:{}});items=dedupe([...fast.items,...discovery.items]);providers={...fast.providers,...discovery.providers};
  }
  let ranked=rankSearchItems(items,scoringQuery);if(!known.changed)ranked=rerankFuzzy(ranked,q);ranked=diversifySources(ranked,MAX_RESULTS);
  const sourceCounts={yahooShopping:'Yahoo!ショッピング',rakuten:'楽天市場',amazon:'Amazon',x:'X'};for(const [name,source] of Object.entries(sourceCounts))if(providers[name])providers[name].count=ranked.filter(item=>item.source===source).length;
  if(providers.snapshot)providers.snapshot.count=ranked.filter(item=>item.origin==='verified-snapshot'||item.origin==='web-index-snapshot').length;
  const discoveryOrigins=new Set(['public-page-live','openai-web-search']);
  if(providers.public){providers.public.count=ranked.filter(item=>['メルカリ','Yahoo!フリマ','Yahoo!オークション'].includes(item.source)&&discoveryOrigins.has(item.origin)).length;for(const market of WEB_MARKETS)if(providers.public.sources?.[market.key])providers.public.sources[market.key].count=ranked.filter(item=>item.source===market.source&&discoveryOrigins.has(item.origin)).length}
  const value={query:q,providerQuery,queryVariants:[{query:providerQuery,reason:'single-fast-provider-query'}],aliasVersion:SEARCH_ALIAS_VERSION,inputCompletion:prefix.changed?prefix:null,typoCorrection:known.changed?known:null,phase,items:ranked,providers,generatedAt:new Date().toISOString()};
  cache.set(cacheKey,{at:Date.now(),value});if(cache.size>160)cache.delete(cache.keys().next().value);return send(res,200,value,true);
}
