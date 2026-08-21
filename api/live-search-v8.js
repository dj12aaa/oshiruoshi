import legacyHandler from './live-search.js';
import { detectIntent, normalizeFlexible, compactFlexible } from './search-language.mjs';

const VERSION='2026-08-21.8';
const OSHI_HINTS=[
  'グッズ','アクスタ','アクリルスタンド','アクキー','アクリルキーホルダー','アクリル','缶バッジ','缶バ','ぬい','ぬいぐるみ','マスコット',
  'トレカ','トレーディングカード','ブロマイド','チェキ','クリアファイル','ステッカー','シール','ラバスト','ラバーストラップ',
  'タペストリー','ペンライト','フィギュア','キーホルダー','キーチェーン','チャーム','タオル','色紙','ポスター','うちわ',
  '一番くじ','くじ','プライズ','景品','特典','公式グッズ','限定グッズ','記念グッズ','コラボグッズ','tシャツ','パーカー','アパレル'
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
  const intent=detectIntent(query),text=itemText(item);
  if(!text)return false;
  if(noiseHit(text,query))return false;
  if(isNarutoQuery(query)&&!hasNarutoEntity(text))return false;

  if(intent.entityGroups.length&&!intent.entityGroups.some(group=>groupMatch(group,text)))return false;
  if(!isNarutoQuery(query)&&!intent.entityGroups.length&&intent.entity&&!entityTokenMatch(intent,text))return false;
  if(intent.merchGroups.length&&!intent.merchGroups.some(group=>groupMatch(group,text)))return false;

  if(!intent.merchGroups.length&&intent.entity&&!hasOshiSignal(text))return false;
  return true;
}
export function normalizeAmbiguousQuery(query=''){
  const q=String(query||'').trim();
  if(isNarutoQuery(q))return 'NARUTO ナルト';
  return q;
}
export function effectiveQuery(query=''){
  const normalized=normalizeAmbiguousQuery(query),intent=detectIntent(normalized);
  if(intent.entity&&!intent.merchGroups.length)return `${normalized} グッズ`;
  return normalized;
}
function adjustedProviders(providers={},items=[]){
  const p=typeof structuredClone==='function'
    ? structuredClone(providers||{})
    : JSON.parse(JSON.stringify(providers||{}));
  const map={yahooShopping:'Yahoo!ショッピング',rakuten:'楽天市場',x:'X'};
  for(const [key,source] of Object.entries(map))if(p[key])p[key].count=items.filter(item=>item.source===source).length;
  return p;
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

  const target=effectiveQuery(original);
  const forwarded={...req,url:`/api/live-search?q=${encodeURIComponent(target)}`};
  const capture=captureResponse();
  try{
    await Promise.resolve(legacyHandler(forwarded,capture.res));
    const result=await capture.promise;
    if(result.status>=400||!result.data||!Array.isArray(result.data.items)){
      res.status(result.status||500).json(result.data||{error:'precision_search_failed'});return;
    }
    const strict=result.data.items.filter(item=>relevant(item,original));
    const originalIntent=detectIntent(normalizeAmbiguousQuery(original));
    const fallback=originalIntent.entity
      ? []
      : result.data.items.filter(item=>!noiseHit(itemText(item),original)&&Number(item?._score||0)>=120);
    const items=(strict.length?strict:fallback).slice(0,120);
    res.setHeader('X-OSHIRU-Precision-Version',VERSION);
    res.setHeader('Cache-Control','public, max-age=8, s-maxage=22, stale-while-revalidate=75');
    res.status(200).json({
      ...result.data,
      query:original,
      effectiveQuery:target,
      precisionVersion:VERSION,
      items,
      providers:adjustedProviders(result.data.providers,items)
    });
  }catch(error){
    res.status(500).json({error:'precision_search_failed',message:String(error?.message||error).slice(0,160)});
  }
}
