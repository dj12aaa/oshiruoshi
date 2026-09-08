// Fixed API adapters only: never crawl a URL supplied by a visitor.
import { liveSearch } from './_core.mjs';
import { relevant } from './_live-search-v8.js';

export const FEED_VERSION='2026-09-08.23';
export const FEED_TOPICS={
  vtuber:{label:'VTuber',queries:['星街すいせい アクスタ','にじさんじ アクスタ','宝鐘マリン グッズ']},
  anime:{label:'アニメ・漫画',queries:['五条悟 アクスタ','NARUTO ナルト フィギュア','ブルーロック 缶バッジ']},
  games:{label:'ゲーム',queries:['初音ミク アクスタ','プロセカ 缶バッジ','原神 アクスタ']},
  character:{label:'キャラクター',queries:['サンリオ ぬいぐるみ','ポケモン ぬいぐるみ','ちいかわ ぬいぐるみ']},
  music:{label:'アイドル・K-POP',queries:['Stray Kids グッズ','BTS グッズ','SEVENTEEN グッズ']}
};
export const IMAGE_SOURCES={
  'Yahoo!ショッピング':{id:'yahooShopping',terms:'https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html',imageHosts:['c.yimg.jp'],linkHosts:['yahoo.co.jp','ck.jp.ap.valuecommerce.com']},
  '楽天市場':{id:'rakuten',terms:'https://webservice.rakuten.co.jp/documentation/ichiba-item-search',imageHosts:['rakuten.co.jp','r10s.jp'],linkHosts:['rakuten.co.jp','rakuten.ne.jp']}
};
export function allowedUrl(value,hosts){
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.some(host=>u.hostname===host||u.hostname.endsWith('.'+host))?u.href:null}catch{return null}
}
export function topicQuery(category,now=Date.now()){
  if(!Object.hasOwn(FEED_TOPICS,category))return null;
  const topic=FEED_TOPICS[category];return topic.queries[Math.floor(now/900_000)%topic.queries.length];
}
export function selectFeedItems(items,query,category,now=Date.now()){
  const shops=new Map(),seen=new Set();
  for(const item of items||[]){
    const policy=IMAGE_SOURCES[item?.source];
    if(!policy||item.origin!=='official-api'||item.status==='在庫なし'||!relevant(item,query))continue;
    const image=allowedUrl(item.image,policy.imageHosts),url=allowedUrl(item.url,policy.linkHosts);
    const checked=Date.parse(item.verifiedAt||'');
    if(!image||!url||!Number.isFinite(checked)||checked>now+60_000||now-checked>600_000)continue;
    const key=String(item.id||item.canonicalUrl||url);if(seen.has(key))continue;seen.add(key);
    const shopKey=`${item.source}|${item.sellerId||item.shop||'不明'}`;
    if(!shops.has(shopKey))shops.set(shopKey,[]);
    shops.get(shopKey).push({id:key,title:String(item.title).slice(0,220),source:item.source,shop:item.shop||'販売元で確認',image,url,price:item.price,condition:item.condition,status:item.status,affiliate:item.affiliate===true,verifiedAt:item.verifiedAt,releaseDate:item.releaseDate||null,category,query,imagePolicy:'provider-api',policyUrl:policy.terms});
  }
  // Round-robin across merchants before filling the remaining slots.
  const out=[],groups=[...shops.values()];
  while(out.length<8&&groups.some(group=>group.length))for(const group of groups){if(group.length&&out.length<8)out.push(group.shift())}
  return out;
}
export async function buildLatestFeed(category,{now=Date.now(),search=liveSearch,timeoutMs=8000}={}){
  const query=topicQuery(category,now);if(!query)return null;
  let timer;
  try{
    const data=await Promise.race([search(query,{marketplacesOnly:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('provider_timeout')),timeoutMs)})]);
    const items=selectFeedItems(data.items,query,category,now),providers={};
    for(const policy of Object.values(IMAGE_SOURCES)){
      const state=data.providers?.[policy.id];
      providers[policy.id]=state?{ok:state.ok===true,count:items.filter(item=>IMAGE_SOURCES[item.source].id===policy.id).length,error:state.error?(/^upstream_\d{3}$/.test(state.error)?state.error:'provider_error'):null}:{ok:false,count:0,error:'not_configured'};
    }
    return{feedVersion:FEED_VERSION,category,label:FEED_TOPICS[category].label,query,items,providers,checkedAt:new Date(now).toISOString(),refreshAfterSeconds:300,freshnessBasis:'retrieval-time-not-publication',partial:Object.values(providers).some(provider=>!provider.ok)};
  }finally{clearTimeout(timer)}
}
const cache=new Map(),pending=new Map();
export default async function handler(req,res){
  const u=new URL(req.url,'https://oshiruoshi.vercel.app'),category=u.searchParams.get('category')||'vtuber';
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('X-OSHIRU-Feed-Version',FEED_VERSION);
  if(req.method&&req.method!=='GET'){res.setHeader('Cache-Control','no-store');res.setHeader('Allow','GET');return res.status(405).json({error:'method_not_allowed'})}
  if(!Object.hasOwn(FEED_TOPICS,category)){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'unknown_category',feedVersion:FEED_VERSION})}
  const key=category+':'+topicQuery(category),existing=cache.get(category);
  try{
    let data=existing?.key===key&&Date.now()-existing.at<240_000?existing.data:null;
    if(!data){
      if(!pending.has(key))pending.set(key,buildLatestFeed(category).finally(()=>pending.delete(key)));
      data=await pending.get(key);
      if(data.items.length)cache.set(category,{key,at:Date.now(),data});
    }
    res.setHeader('Cache-Control',data.items.length?'public, max-age=0, s-maxage=60':'no-store');
    return res.status(200).json(data);
  }catch{
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({feedVersion:FEED_VERSION,category,items:[],error:'feed_unavailable',partial:true});
  }
}
