import { json, cleanQuery, liveSearch as coreLiveSearch } from './_core.mjs';

const aliasGroups=[
  {key:'acrylic-stand',canonical:'アクリルスタンド',broad:'アクリルスタンド',aliases:['アクスタ','アクリルスタンド','アクリルフィギュア','アクリルスタンドフィギュア','acrylic stand']},
  {key:'acrylic-keyholder',canonical:'アクリルキーホルダー',broad:'キーホルダー',aliases:['アクキー','アクキ','アクチャ','アクリルキーホルダー','アクリルキー','アクリルキーチェーン','アクリルチャーム','acrylic keychain']},
  {key:'can-badge',canonical:'缶バッジ',broad:'缶バッジ',aliases:['缶バ','缶バッジ','缶バッチ','カンバッジ','グリ缶','グリッター缶バッジ','can badge']},
  {key:'plush',canonical:'ぬいぐるみ',broad:'ぬいぐるみ',aliases:['ぬい','ぬいぐるみ','ぬいマス','ぬいマスコット','ぬいぱぺ','ぱぺ','にじぱぺ','にじぱぺっと','マスコット','plush','plushie']},
  {key:'card',canonical:'トレーディングカード',broad:'カード',aliases:['トレカ','トレーディングカード','カード','ブロマイド','ブロマ','ポスカ','ポストカード','クリカ','クリアカード','フォトカ','フォトカード','チェキ風カード','カードコレクション']},
  {key:'photo',canonical:'チェキ',broad:'写真',aliases:['チェキ','チェキ風','生写真','フォト']},
  {key:'clear-file',canonical:'クリアファイル',broad:'クリアファイル',aliases:['クリファ','クリアファイル','クリアホルダー']},
  {key:'sticker',canonical:'ステッカー',broad:'ステッカー',aliases:['ステッカー','シール','sticker']},
  {key:'rubber-strap',canonical:'ラバーストラップ',broad:'ストラップ',aliases:['ラバスト','ラバーストラップ','ラバーチャーム']},
  {key:'acrylic-panel',canonical:'アクリルパネル',broad:'アクリル',aliases:['アクパネ','アクリルパネル','アクリルボード']},
  {key:'tapestry',canonical:'タペストリー',broad:'タペストリー',aliases:['タペ','タペストリー']},
  {key:'penlight',canonical:'ペンライト',broad:'ペンライト',aliases:['ペンラ','ペンライト','ライトスティック']},
  {key:'figure',canonical:'フィギュア',broad:'フィギュア',aliases:['フィギュア','ねんどろ','ねんどろいど','スケールフィギュア','figure']},
  {key:'keyholder',canonical:'キーホルダー',broad:'キーホルダー',aliases:['キーホルダー','キーチェーン','チャーム']},
  {key:'towel',canonical:'タオル',broad:'タオル',aliases:['タオル','マフラータオル','ハンドタオル']},
  {key:'shikishi',canonical:'色紙',broad:'色紙',aliases:['色紙','ミニ色紙']},
  {key:'poster',canonical:'ポスター',broad:'ポスター',aliases:['ポスター','ミニポスター']},
  {key:'uchiwa',canonical:'うちわ',broad:'うちわ',aliases:['うちわ','団扇']}
];
const genericWords=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古']);
const noiseWords=['収納ケース','保護ケース','ディスプレイケース','コレクションケース','収納ボックス','台座のみ','パーツのみ','保護フィルム','カバーのみ','ケースのみ','空箱'];

function normalizeSearchText(value=''){
  return String(value).normalize('NFKC').toLowerCase()
    .replace(/[・･·／/|｜,，。｡()（）【】\[\]「」『』〈〉《》:_＿\-—–+＋]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function compactSearchText(value=''){return normalizeSearchText(value).replace(/\s/g,'')}
function clean(value=''){return String(value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)}
function aliasNormalized(alias){return normalizeSearchText(alias)}
function groupMatches(group,nq){return group.aliases.some(alias=>nq.includes(aliasNormalized(alias)))}
function detectSearchIntent(query=''){
  const original=clean(query),normalized=normalizeSearchText(original),groups=aliasGroups.filter(group=>groupMatches(group,normalized));
  let entity=normalized;
  for(const group of groups){
    for(const alias of [...group.aliases].sort((a,b)=>normalizeSearchText(b).length-normalizeSearchText(a).length)){
      const n=aliasNormalized(alias);if(n)entity=entity.split(n).join(' ');
    }
  }
  entity=entity.split(/\s+/).filter(token=>token&&!genericWords.has(token)).join(' ').replace(/\s+/g,' ').trim();
  return{original,normalized,entity,groups};
}
function replaceAliases(normalized,groups,mode='canonical'){
  let out=normalized;
  for(const group of groups){
    const replacement=mode==='broad'?group.broad:group.canonical;
    for(const alias of [...group.aliases].sort((a,b)=>normalizeSearchText(b).length-normalizeSearchText(a).length)){
      const n=aliasNormalized(alias);if(n&&out.includes(n))out=out.split(n).join(` ${replacement} `);
    }
  }
  return out.replace(/\s+/g,' ').trim();
}
function pushVariant(list,seen,query,reason,weight){
  const value=clean(query);if(!value)return;const key=normalizeSearchText(value);if(!key||seen.has(key))return;seen.add(key);list.push({query:value,reason,weight});
}
function buildQueryVariants(query='',limit=4){
  const intent=detectSearchIntent(query),variants=[],seen=new Set();
  pushVariant(variants,seen,intent.original,'original',30);
  if(intent.normalized&&intent.normalized!==normalizeSearchText(intent.original.replace(/・/g,' ')))pushVariant(variants,seen,intent.normalized,'normalized',24);
  if(intent.groups.length){
    pushVariant(variants,seen,replaceAliases(intent.normalized,intent.groups,'canonical'),'canonical-merch',26);
    if(intent.entity){
      const broad=[...new Set(intent.groups.map(group=>group.broad))].join(' ');
      pushVariant(variants,seen,`${intent.entity} ${broad}`,'broad-merch',18);
      pushVariant(variants,seen,`${intent.entity} グッズ`,'entity-fallback',10);
    }
  }else{
    const tokens=intent.normalized.split(' ').filter(Boolean);
    const last=tokens.at(-1)||'';
    if(tokens.length>=2&&last.length<=8&&!genericWords.has(last)){
      const entity=tokens.slice(0,-1).join(' ');
      pushVariant(variants,seen,`${entity} グッズ`,'unknown-term-fallback',8);
    }else if(intent.entity&&!/グッズ/.test(intent.normalized))pushVariant(variants,seen,`${intent.entity} グッズ`,'goods-fallback',8);
  }
  return variants.slice(0,Math.max(1,limit));
}
function itemText(item){return normalizeSearchText([item?.title,item?.description,item?.series,item?.character,item?.type,item?.collab,item?.shop,...(item?.tags||[])].filter(Boolean).join(' '))}
function groupHit(group,text){return group.aliases.some(alias=>text.includes(aliasNormalized(alias)))||text.includes(normalizeSearchText(group.canonical))||text.includes(normalizeSearchText(group.broad))}
function freshnessScore(item){
  const value=item?.releaseDate||item?.verifiedAt;if(!value)return 0;const ms=Date.parse(value);if(!Number.isFinite(ms))return 0;const age=(Date.now()-ms)/86400000;
  if(age<0&&age>-365)return 18;if(age<=30)return 14;if(age<=90)return 9;if(age<=365)return 4;return 0;
}
function searchMatchScore(item,query=''){
  const intent=detectSearchIntent(query),text=itemText(item),compact=compactSearchText(text),qCompact=compactSearchText(intent.normalized),entityCompact=compactSearchText(intent.entity);let score=0;
  if(qCompact&&compact.includes(qCompact))score+=180;
  if(entityCompact){
    if(compact.includes(entityCompact))score+=210;
    else{
      const entityTokens=intent.entity.split(' ').filter(Boolean);let matched=0;
      for(const token of entityTokens){if(compact.includes(compactSearchText(token))){score+=token.length>=3?55:30;matched++}}
      if(entityTokens.length&&matched===0)score-=180;else if(matched===entityTokens.length)score+=45;
    }
  }
  if(intent.groups.length){
    let matchedGroups=0;for(const group of intent.groups){if(groupHit(group,text)){score+=125;matchedGroups++}}
    if(matchedGroups===0)score-=50;
  }
  if(noiseWords.some(word=>text.includes(normalizeSearchText(word))))score-=90;
  if(item?.status==='販売中'||item?.status==='販売中候補')score+=8;
  if(item?.image)score+=5;
  score+=freshnessScore(item);
  score+=Math.min(35,Math.max(0,Number(item?._score)||0)*0.08);
  score+=Number(item?._variantWeight)||0;
  return Math.round(score*100)/100;
}
function rankSearchItems(items=[],query=''){
  const seen=new Set(),ranked=[];
  for(const item of items){
    if(!item)continue;const key=String(item.directUrl||item.canonicalUrl||item.url||`${item.source}|${item.title}|${item.price}`).replace(/[?#].*$/,'');if(seen.has(key))continue;seen.add(key);
    ranked.push({...item,_score:searchMatchScore(item,query)});
  }
  return ranked.sort((a,b)=>(b._score||0)-(a._score||0)||(a.price??Infinity)-(b.price??Infinity));
}
function countStrongMatches(items=[],query=''){return rankSearchItems(items,query).filter(item=>(item._score||0)>=180).length}
const SEARCH_ALIAS_VERSION='2026-08-19.1';

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
  const cacheKey=normalizeSearchText(q),existing=cache.get(cacheKey);
  if(existing&&Date.now()-existing.at<30_000)return send(res,200,existing.value,true);

  const variants=buildQueryVariants(q,4),runs=[];
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
  const value={
    query:q,
    providerQuery:variants[0]?.query||q,
    queryVariants:runs.map(run=>({query:run.variant.query,reason:run.variant.reason})),
    aliasVersion:SEARCH_ALIAS_VERSION,
    items:ranked,
    providers,
    generatedAt:new Date().toISOString()
  };
  cache.set(cacheKey,{at:Date.now(),value});if(cache.size>100)cache.delete(cache.keys().next().value);
  return send(res,200,value,true);
}
