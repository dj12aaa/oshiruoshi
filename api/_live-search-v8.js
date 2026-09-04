// Shared precision handler. The leading underscore keeps this module from
// consuming a separate Vercel Function while public routes reuse it.
import legacyHandler from './live-search.js';
import { detectIntent, normalizeFlexible, compactFlexible, rankSearchItems, resolveSearchQuery } from './_search-language.mjs';
import { snapshotSearch } from './_core.mjs';

const VERSION='2026-09-05.18';
const OSHI_HINTS=[
  'グッズ','アクスタ','アクリルスタンド','アクキー','アクリルキーホルダー','アクリル','缶バッジ','缶バ','ぬい','ぬいぐるみ','マスコット',
  'トレカ','トレーディングカード','ブロマイド','チェキ','クリアファイル','ステッカー','シール','ラバスト','ラバーストラップ',
  'タペストリー','ペンライト','フィギュア','キーホルダー','キーチェーン','チャーム','タオル','色紙','ポスター','うちわ',
  '一番くじ','くじ','プライズ','景品','特典','公式グッズ','限定グッズ','記念グッズ','コラボグッズ','生誕グッズ','周年グッズ',
  '誕生日グッズ','トレーディング','ランダム','セット','痛バッグ','法被','tシャツ','パーカー','アパレル'
];
const GENERIC_RETAIL_NOISE=[
  'ヘアピン','ヘアクリップ','髪留め','ヘアゴム','ピアス','イヤリング','ネックレス','指輪','リング','コスメ','化粧品','食品','お菓子',
  'コミック','単行本','電子書籍','漫画 全巻','攻略本','ゲームソフト','収納ケース','保護ケース','ディスプレイケース','台座のみ','パーツのみ','空箱'
];

function itemText(item={}){
  return normalizeFlexible([item.title,item.description,item.series,item.character,item.type,item.collab,item.shop,...(item.tags||[])].filter(Boolean).join(' '));
}
function includesLoose(text,value){
  const n=normalizeFlexible(value);if(!n)return false;
  return text.includes(n)||compactFlexible(text).includes(compactFlexible(n));
}
function groupMatch(group,text){
  if(group.required)return group.required.every(alternatives=>alternatives.some(value=>includesLoose(text,value)));
  return [group.canonical,group.broad,...(group.aliases||[])].filter(Boolean).some(value=>includesLoose(text,value));
}
function queryMentions(query,term){return includesLoose(normalizeFlexible(query),term)}
function hasOshiSignal(text){return OSHI_HINTS.some(term=>includesLoose(text,term))}
function noiseHit(text,query){return GENERIC_RETAIL_NOISE.some(term=>includesLoose(text,term)&&!queryMentions(query,term))}
function isNarutoQuery(query=''){return /^(?:naruto|ナルト|なると)$/i.test(String(query||'').trim())}
function hasNarutoEntity(text=''){return ['NARUTO','ナルト'].some(value=>includesLoose(text,value))}
function entityTokenMatch(intent,text){
  const tokens=normalizeFlexible(intent.entity||'').split(/\s+/).filter(token=>compactFlexible(token).length>=2);
  if(!tokens.length)return true;
  const matched=tokens.filter(token=>includesLoose(text,token)).length;
  return matched===tokens.length || (tokens.length>=3&&matched>=tokens.length-1);
}
export function relevant(item,query){
  const resolved=normalizeAmbiguousQuery(resolveSearchQuery(query).resolved||query);
  const intent=detectIntent(resolved),text=itemText(item);
  if(!text)return false;
  if(noiseHit(text,resolved))return false;
  if(isNarutoQuery(resolved)&&!hasNarutoEntity(text))return false;

  if(intent.entityGroups.length&&!intent.entityGroups.every(group=>groupMatch(group,text)))return false;
  if(intent.entityGroups.length&&intent.residual&&!entityTokenMatch({entity:intent.residual},text))return false;
  if(!isNarutoQuery(resolved)&&!intent.entityGroups.length&&intent.entity&&!entityTokenMatch(intent,text))return false;
  if(intent.merchGroups.length&&!intent.merchGroups.some(group=>groupMatch(group,text)))return false;

  // Entity-only searches should show merchandise, not ordinary retail goods, books or media with the same word.
  if(!intent.merchGroups.length&&intent.entity&&!hasOshiSignal(text))return false;
  return true;
}
export function normalizeAmbiguousQuery(query=''){
  const q=String(query||'').trim();
  if(isNarutoQuery(q))return 'NARUTO ナルト';
  return q;
}
export function effectiveQuery(query=''){
  const resolution=resolveSearchQuery(query),normalized=normalizeAmbiguousQuery(resolution.resolved||query);
  if(isNarutoQuery(normalized))return 'NARUTO ナルト グッズ';
  const intent=detectIntent(normalized);
  const merch=[...new Set(intent.merchGroups.map(group=>group.canonical))];
  const canonical=[intent.entity,...merch].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  if(intent.entity&&!merch.length)return `${canonical||normalized} グッズ`;
  return canonical||normalized;
}
function adjustedProviders(providers={},items=[],snapshotCount=0){
  const p=typeof structuredClone==='function'
    ? structuredClone(providers||{})
    : JSON.parse(JSON.stringify(providers||{}));
  const map={yahooShopping:'Yahoo!ショッピング',rakuten:'楽天市場',x:'X'};
  for(const [key,source] of Object.entries(map))if(p[key])p[key].count=items.filter(item=>item.source===source).length;
  p.snapshot={ok:true,count:snapshotCount,label:'確認済み出品'};
  return p;
}
export function dedupeItems(items=[]){
  const seen=new Set(),titleSeen=new Set(),out=[];
  for(const item of items){
    const key=String(item?.id||item?.canonicalUrl||item?.url||`${item?.source}|${item?.title}|${item?.price}`);
    const titleKey=`${normalizeFlexible(item?.source||'')}|${normalizeFlexible(item?.title||'').replace(/&(?:amp|#38);/g,'&')}`;
    if(!key||seen.has(key)||(item?.title&&titleSeen.has(titleKey)))continue;
    seen.add(key);if(item?.title)titleSeen.add(titleKey);out.push(item);
  }
  return out;
}
function captureResponse(){
  let resolve;
  const promise=new Promise(r=>{resolve=r});
  const headers={};
  const res={
    statusCode:200,
    setHeader(name,value){headers[String(name).toLowerCase()]=value},
    status(code){this.statusCode=code;return this},
    json(data){resolve({status:this.statusCode,headers,data});return this}
  };
  return{res,promise};
}

export default async function handler(req,res){
  const u=new URL(req.url,'http://local'),original=(u.searchParams.get('q')||'').trim();
  if(!original)return legacyHandler(req,res);

  const resolution=resolveSearchQuery(original),resolved=normalizeAmbiguousQuery(resolution.resolved||original),target=effectiveQuery(resolved);
  if(u.searchParams.get('initial')==='1'){
    try{
      const verifiedResult=await snapshotSearch(resolved);
      const items=rankSearchItems(dedupeItems((verifiedResult.items||[]).filter(item=>relevant(item,resolved))),resolved).slice(0,120);
      const snapshotCount=items.length;
      res.setHeader('X-OSHIRU-Precision-Version',VERSION);
      res.setHeader('Cache-Control','public, max-age=4, s-maxage=12, stale-while-revalidate=45');
      res.status(200).json({
        query:original,
        effectiveQuery:target,
        resolvedQuery:target,
        queryCorrection:resolution.changed?resolution:null,
        precisionVersion:VERSION,
        initial:true,
        items,
        direct:verifiedResult.direct||[],
        snapshotCount,
        providers:adjustedProviders({},items,snapshotCount),
        generatedAt:new Date().toISOString()
      });
      return;
    }catch(error){
      res.status(500).json({error:'initial_search_failed',message:String(error?.message||error).slice(0,160)});return;
    }
  }

  const forwarded={...req,url:`/api/live-search?fast=1&q=${encodeURIComponent(target)}`};
  const capture=captureResponse();
  try{
    const verifiedPromise=snapshotSearch(resolved);
    await Promise.resolve(legacyHandler(forwarded,capture.res));
    const [result,verifiedResult]=await Promise.all([capture.promise,verifiedPromise]);
    if(result.status>=400||!result.data||!Array.isArray(result.data.items)){
      res.status(result.status||500).json(result.data||{error:'precision_search_failed'});return;
    }
    const strictLive=result.data.items.filter(item=>relevant(item,resolved));
    const strictVerified=(verifiedResult.items||[]).filter(item=>relevant(item,resolved));
    const strict=rankSearchItems(dedupeItems([...strictLive,...strictVerified]),resolved);
    const originalIntent=detectIntent(resolved);
    const fallback=originalIntent.entity
      ? []
      : result.data.items.filter(item=>!noiseHit(itemText(item),resolved)&&Number(item?._score||0)>=120);
    const items=dedupeItems(strict.length?strict:fallback).slice(0,120);
    const snapshotCount=items.filter(item=>String(item.origin||'').includes('snapshot')).length;
    res.setHeader('X-OSHIRU-Precision-Version',VERSION);
    res.setHeader('Cache-Control','public, max-age=8, s-maxage=22, stale-while-revalidate=75');
    res.status(200).json({
      ...result.data,
      query:original,
      effectiveQuery:target,
      resolvedQuery:target,
      queryCorrection:resolution.changed?resolution:null,
      precisionVersion:VERSION,
      items,
      direct:verifiedResult.direct||[],
      snapshotCount,
      providers:adjustedProviders(result.data.providers,items,snapshotCount)
    });
  }catch(error){
    res.status(500).json({error:'precision_search_failed',message:String(error?.message||error).slice(0,160)});
  }
}
