import { json, cleanQuery, liveSearch as coreLiveSearch, snapshotSearch } from './_core.mjs';
import { MERCH_GROUPS, ENTITY_GROUPS, normalizeFlexible, compactFlexible, detectIntent, buildSearchVariants, rankSearchItems } from './search-language.mjs';

const SEARCH_ALIAS_VERSION='2026-08-21.1';
const cache=new Map();
const webCache=new Map();
const MAX_RESULTS=120;
const GENERIC=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古','セット','限定','予約','goods','item']);
const MARKETPLACE_DOMAINS=['jp.mercari.com','paypayfleamarket.yahoo.co.jp','auctions.yahoo.co.jp'];

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
function send(res,status,data,cacheable=false){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control',cacheable?'public, max-age=15, s-maxage=45, stale-while-revalidate=180':'no-store');return res.status(status).json(data)}
function dedupe(items=[]){const seen=new Set(),out=[];for(const item of items){const k=String(item?.url||`${item?.source}|${item?.title}|${item?.price}`).replace(/[?#].*$/,'');if(!k||seen.has(k))continue;seen.add(k);out.push(item)}return out}
function sourceFromUrl(value=''){
  try{const u=new URL(value);if(u.hostname==='jp.mercari.com'&&/^\/item\//.test(u.pathname))return'メルカリ';if(u.hostname==='paypayfleamarket.yahoo.co.jp'&&/^\/item\//.test(u.pathname))return'Yahoo!フリマ';if(u.hostname==='auctions.yahoo.co.jp'&&/(?:\/jp)?\/auction\//.test(u.pathname))return'Yahoo!オークション'}catch{}return'';
}
function parsePrice(value){if(value==null||value==='')return null;const digits=String(value).replace(/[^0-9]/g,'');if(!digits)return null;const n=Number(digits);return Number.isFinite(n)&&n>0?n:null}
function extractOutputText(data){return(data?.output||[]).flatMap(x=>x?.content||[]).map(x=>x?.text||'').join('').trim()}
function mapWebRows(rows=[],query=''){
  const now=new Date().toISOString(),intent=detectIntent(query),type=intent.merchGroups?.[0]?.canonical||'その他',out=[];
  for(let i=0;i<rows.length&&out.length<24;i++){
    const row=rows[i]||{},url=String(row.url||'').trim(),source=sourceFromUrl(url),title=String(row.title||'').replace(/\s+/g,' ').trim().slice(0,180);if(!source||!title)continue;
    out.push({id:`web-${source}-${i}-${Buffer.from(url).toString('base64url').slice(-12)}`,source,title,price:parsePrice(row.price),shipping:null,fee:0,status:'販売中候補',condition:'要確認',url,image:null,type,shop:'',verifiedAt:now,origin:'openai-web-search',real:true,imageVerified:false,tags:[query,type].filter(Boolean)});
  }
  return dedupe(out);
}
async function openaiMarketplaceSearch(query=''){
  const q=cleanQuery(query);if(!process.env.OPENAI_API_KEY||!q)return{items:[],ok:false,skipped:true,error:null};
  const key=normalizeFlexible(q),hit=webCache.get(key),now=Date.now();if(hit&&now-hit.at<300_000)return hit.value;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3600);
  try{
    const model=process.env.OPENAI_SEARCH_MODEL||process.env.OPENAI_MODEL||'gpt-5-mini';
    const prompt=`日本の推し活グッズ検索サービス用です。検索語「${q}」に関連する、メルカリ・Yahoo!フリマ・Yahoo!オークションの公開されている個別商品/個別出品ページを探してください。検索結果ページやカテゴリページではなく個別ページだけにしてください。存在を確認できないURLは作らないでください。価格が検索結果上で明示されていなければpriceはnullにしてください。最大18件。必ずJSONだけで {"items":[{"title":"...","url":"https://...","price":1234}]} の形で返してください。`;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model,tools:[{type:'web_search',filters:{allowed_domains:MARKETPLACE_DOMAINS},search_context_size:'low'}],input:prompt,max_output_tokens:1800})});
    if(!r.ok)throw new Error(`openai_${r.status}`);const data=await r.json();let text=extractOutputText(data).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim(),parsed={items:[]};try{parsed=JSON.parse(text)}catch{const m=text.match(/\{[\s\S]*\}/);if(m)parsed=JSON.parse(m[0])}
    const value={items:mapWebRows(Array.isArray(parsed?.items)?parsed.items:[],q),ok:true,error:null};webCache.set(key,{at:Date.now(),value});if(webCache.size>80)webCache.delete(webCache.keys().next().value);return value;
  }catch(e){return{items:[],ok:false,error:String(e?.name==='AbortError'?'timeout':e?.message||e).slice(0,120)}}finally{clearTimeout(timer)}
}
function diversifySources(items=[],limit=MAX_RESULTS){
  const ranked=dedupe(items),sources=['メルカリ','Yahoo!フリマ','Yahoo!オークション','Yahoo!ショッピング','楽天市場','X'],buckets=new Map(sources.map(s=>[s,ranked.filter(x=>x.source===s)])),chosen=[],used=new Set();
  const lead=Math.min(30,ranked.length);let progressed=true;while(chosen.length<lead&&progressed){progressed=false;for(const source of sources){const bucket=buckets.get(source)||[];while(bucket.length&&used.has(bucket[0]?.url))bucket.shift();if(!bucket.length)continue;const item=bucket.shift();chosen.push(item);used.add(item.url);progressed=true;if(chosen.length>=lead)break}}
  for(const item of ranked){if(chosen.length>=limit)break;if(used.has(item.url))continue;chosen.push(item);used.add(item.url)}return chosen.slice(0,limit);
}
function mergeProviderState(target={},source={}){for(const [name,state] of Object.entries(source||{})){target[name]={ok:state?.ok===true,count:Number(state?.count||0),error:state?.error?String(state.error).slice(0,120):null}}return target}

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  const u=new URL(req.url,'http://local'),q=cleanQuery(u.searchParams.get('q')||'');if(!q)return send(res,200,{query:'',items:[],providers:{},queryVariants:[],generatedAt:new Date().toISOString()},true);
  const cacheKey=`${SEARCH_ALIAS_VERSION}|${normalizeFlexible(q)}`,existing=cache.get(cacheKey);if(existing&&Date.now()-existing.at<60_000)return send(res,200,existing.value,true);
  const {prefix,known,seed,providerQuery}=robustQuery(q),scoringQuery=seed||q;
  const snapshotQueries=compactFlexible(providerQuery)===compactFlexible(q)?[q]:[q,providerQuery];
  const snapshotPromise=Promise.all(snapshotQueries.map(x=>snapshotSearch(x))).then(parts=>dedupe(parts.flatMap(x=>x.items||[])));
  const [snapResult,liveResult,webResult]=await Promise.allSettled([snapshotPromise,coreLiveSearch(providerQuery),openaiMarketplaceSearch(providerQuery)]);
  const snapshotItems=snapResult.status==='fulfilled'?snapResult.value:[];
  const live=liveResult.status==='fulfilled'?liveResult.value:{items:[],providers:{search:{ok:false,count:0,error:String(liveResult.reason?.message||liveResult.reason||'live_search_failed').slice(0,120)}}};
  const web=webResult.status==='fulfilled'?webResult.value:{items:[],ok:false,error:String(webResult.reason?.message||webResult.reason||'web_search_failed').slice(0,120)};
  const providers={snapshot:{ok:true,count:snapshotItems.length,error:null}};mergeProviderState(providers,live.providers);providers.openai={ok:web.ok===true,count:web.items?.length||0,error:web.error||null,skipped:web.skipped===true};
  let items=dedupe([...snapshotItems.map(x=>({...x,_variantWeight:8,_queryReason:'verified-snapshot'})),...(live.items||[]).map(x=>({...x,_variantWeight:6,_queryReason:'live-provider'})),...(web.items||[]).map(x=>({...x,_variantWeight:4,_queryReason:'public-web-search'}))]);
  let ranked=rankSearchItems(items,scoringQuery);if(!known.changed)ranked=rerankFuzzy(ranked,q);ranked=diversifySources(ranked,MAX_RESULTS);
  const bySource={yahooShopping:'Yahoo!ショッピング',rakuten:'楽天市場',x:'X'};for(const [name,source] of Object.entries(bySource))if(providers[name])providers[name].count=ranked.filter(item=>item.source===source).length;
  providers.openai.count=ranked.filter(item=>item.origin==='openai-web-search').length;providers.snapshot.count=ranked.filter(item=>item.origin==='verified-snapshot'||item.origin==='web-index-snapshot').length;
  const value={query:q,providerQuery,queryVariants:[{query:providerQuery,reason:'single-fast-provider-query'}],aliasVersion:SEARCH_ALIAS_VERSION,inputCompletion:prefix.changed?prefix:null,typoCorrection:known.changed?known:null,items:ranked,providers,generatedAt:new Date().toISOString()};
  cache.set(cacheKey,{at:Date.now(),value});if(cache.size>120)cache.delete(cache.keys().next().value);return send(res,200,value,true);
}
