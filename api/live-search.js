import fs from 'node:fs';
import { json, cleanQuery } from './_core.mjs';

const cache=new Map();
const providerLastAt={yahoo:0,rakuten:0};
const providerGate={yahoo:Promise.resolve(),rakuten:Promise.resolve()};

const aliasGroups=[
  ['アクスタ','アクリルスタンド','アクリルフィギュア','acrylic stand'],
  ['アクキー','アクリルキーホルダー','アクリルキーチェーン','acrylic keychain'],
  ['缶バ','缶バッジ','カンバッジ','badge','can badge'],
  ['ぬい','ぬいぐるみ','マスコット','ぬいマス','plush','plushie'],
  ['フィギュア','ねんどろいど','スケールフィギュア','figure'],
  ['カード','トレカ','トレーディングカード','ブロマイド','ポストカード','クリアカード','フォトカード','カードコレクション','card'],
  ['ステッカー','シール','sticker'],
  ['クリアファイル','クリアホルダー'],
  ['キーホルダー','チャーム','ラバーストラップ','ラバスト'],
  ['タオル','マフラータオル','ハンドタオル'],
  ['Tシャツ','シャツ','パーカー','アパレル'],
  ['コラボ','コラボレーション','限定コラボ','collaboration']
];
const merchWords=[
  'アクスタ','アクリルスタンド','アクキー','アクリルキーホルダー','缶バッジ','缶バ','ぬい','ぬいぐるみ','マスコット',
  'フィギュア','ねんどろいど','カード','トレカ','ブロマイド','ポストカード','クリアカード','フォトカード','ステッカー','シール','クリアファイル',
  'タオル','キーホルダー','チャーム','ラバスト','ポスター','色紙','グッズ','特典','Tシャツ','パーカー','ペンライト',
  'アクリルボード','アクリルパネル','タペストリー','チェキ','生写真','うちわ','ライト','ランダム商品','コレクション'
];
const collabWords=['コラボ','コラボレーション','限定','限定品','ポップアップ','popup','カフェ','一番くじ','くじ','特典','描き下ろし','先行販売','受注','予約','周年','記念','誕生日','生誕','ライブ','フェス','イベント'];
const fandomWords=['漫画','マンガ','コミック','アニメ','anime','ゲーム','game','vtuber','vチューバー','バーチャルライバー','アイドル','idol','声優','キャラクター','キャラ','推し','映画','劇場版','movie','ホロライブ','にじさんじ','ぶいすぽ','歌い手','配信者'];
const officialWords=['公式','オフィシャル','official','正規','アニメイト','movic','ムービック','bandai','バンダイ','aniplex','アニプレックス','kadokawa','集英社','講談社','小学館'];
const bonusWords=['特典','購入特典','店舗特典','入場者特典','ノベルティ','限定','描き下ろし','先行販売','予約','受注','周年','記念','誕生日','生誕','コラボ','ポップアップ','カフェ','一番くじ','ライブ','イベント'];
const freshWords=['新商品','新作','最新','予約','受注','先行','発売','販売開始','new','2026'];
const noiseWords=['収納ケース','保護ケース','ディスプレイケース','コレクションケース','収納ボックス','収納','スタンドのみ','台座のみ','互換','ハンドメイド素材','パーツのみ','保護フィルム','カバーのみ','ケースのみ','空箱'];

function normalize(value=''){
  return String(value).normalize('NFKC').toLowerCase().replace(/[・･／/|｜,，。()（）【】\[\]「」『』:_-]+/g,' ').replace(/\s+/g,' ').trim();
}
function hasAny(text,words){return words.some(w=>text.includes(normalize(w)))}
function queryTokens(q){return normalize(q).split(' ').filter(Boolean)}
function matchingAliasGroups(q){const n=normalize(q);return aliasGroups.filter(group=>group.some(v=>n.includes(normalize(v))))}
function detectType(value=''){
  const n=normalize(value);
  const names=['アクスタ','アクキー','缶バッジ','ぬい','フィギュア','カード','ステッカー','クリアファイル','キーホルダー','タオル','アパレル'];
  for(let i=0;i<names.length;i++)if(hasAny(n,aliasGroups[i]))return names[i];
  if(hasAny(n,['ペンライト','ライトスティック']))return'ペンライト';
  if(hasAny(n,['タペストリー','ポスター']))return'ポスター・タペストリー';
  if(hasAny(n,['チェキ','生写真','フォトカード']))return'写真・フォトカード';
  return'通販';
}
function detectCollab(value=''){
  const n=normalize(value);
  if(n.includes('コラボ')||n.includes('collaboration'))return'コラボ商品';
  if(hasAny(n,['限定','ポップアップ','popup','カフェ','一番くじ','描き下ろし','先行販売','周年','記念','誕生日','生誕','ライブ','フェス','特典']))return'限定・企画商品';
  return'';
}
function providerQuery(q){const n=normalize(q);return hasAny(n,[...merchWords,...collabWords])?q:`${q} グッズ`}
function dateValue(value){if(!value)return null;const d=new Date(value);return Number.isFinite(+d)?+d:null}
function freshnessScore(item){
  const now=Date.now(),release=dateValue(item?.releaseDate);
  if(release){const age=(now-release)/86400000;if(age<0&&age>-365)return 52;if(age<=30)return 46;if(age<=90)return 34;if(age<=180)return 22;if(age<=365)return 10}
  if(item?.source==='楽天市場'&&Number.isFinite(item?.sourceFreshRank))return Math.max(0,32-item.sourceFreshRank*.8);
  return 0;
}
function relevanceScore(item,q){
  const nq=normalize(q),title=normalize(item?.title||''),description=normalize(item?.description||''),shop=normalize(item?.shop||'');
  const hay=`${title} ${description} ${shop}`;let score=0;
  if(nq&&title.includes(nq))score+=170;
  const compact=nq.replace(/\s/g,'');if(compact&&title.replace(/\s/g,'').includes(compact))score+=96;
  const tokens=queryTokens(q);let matchedTokens=0;
  for(const token of tokens){if(title.includes(token)){score+=token.length>=3?46:30;matchedTokens++}else if(description.includes(token)){score+=15;matchedTokens++}else if(shop.includes(token))score+=3}
  if(tokens.length>1&&matchedTokens===tokens.length)score+=54;
  for(const group of matchingAliasGroups(q)){if(group.some(v=>title.includes(normalize(v))))score+=56;else if(group.some(v=>description.includes(normalize(v))))score+=20}

  const expectedType=detectType(q),resultType=item?.type||detectType(hay),qHasType=expectedType!=='通販';
  const qHasMerch=hasAny(nq,merchWords),resultHasMerch=hasAny(hay,merchWords);
  if(qHasType){if(resultType===expectedType)score+=72;else if(resultType!=='通販')score-=24}
  if(resultHasMerch)score+=qHasMerch?36:30;else if(qHasMerch)score-=38;

  const resultFandom=hasAny(hay,fandomWords),resultBonus=hasAny(hay,bonusWords),resultOfficial=hasAny(hay,officialWords);
  if(resultFandom&&resultHasMerch)score+=20;
  if(hasAny(nq,fandomWords)&&resultHasMerch)score+=18;
  if(hasAny(nq,collabWords)&&resultBonus)score+=52;
  if(resultBonus)score+=qHasType?10:22;
  if(resultOfficial&&resultHasMerch)score+=12;
  if(!qHasType&&['カード','写真・フォトカード'].includes(resultType))score+=22;
  if(!qHasType&&item?.collab)score+=16;
  if(hasAny(title,freshWords))score+=18;
  if(title.includes('2026'))score+=10;
  if(hasAny(hay,noiseWords))score-=72;
  if(item?.image)score+=8;
  if(item?.status==='販売中')score+=5;
  score+=freshnessScore(item);
  return Math.round(score*100)/100;
}
function rankItems(items,q){return dedupe(items).map(item=>({...item,_score:relevanceScore(item,q),freshnessScore:freshnessScore(item)})).sort((a,b)=>(b._score||0)-(a._score||0)||(b.freshnessScore||0)-(a.freshnessScore||0)||(a.price??Infinity)-(b.price??Infinity))}
function dedupe(items){const seen=new Set();return items.filter(i=>{const k=(i?.directUrl||i?.canonicalUrl||i?.url||`${i?.source}|${i?.title}|${i?.price}`).replace(/[?#].*$/,'');if(seen.has(k))return false;seen.add(k);return true})}
function loadAffiliateHealth(){try{return JSON.parse(fs.readFileSync(new URL('../verification/affiliate-health.json',import.meta.url),'utf8'))}catch{return null}}
const affiliateHealth=loadAffiliateHealth();
const rakutenAffiliateHealthy=affiliateHealth?.affiliate?.ok===true;
function rakutenDirectUrl(h){
  const code=String(h?.itemCode||''),colon=code.indexOf(':'),shop=String(h?.shopCode||(colon>0?code.slice(0,colon):'')).trim(),item=String(colon>0?code.slice(colon+1):'').trim();
  if(!shop||!item)return null;return `https://item.rakuten.co.jp/${encodeURIComponent(shop)}/${item.split('/').map(encodeURIComponent).join('/')}/`;
}
async function fetchJson(url,{headers={},timeout=5000}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const r=await fetch(url,{signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-beta/2.6',...headers}}),text=await r.text();
    if(text.length>2_000_000)throw new Error('response_too_large');
    if(!r.ok){let detail='';try{const d=JSON.parse(text);detail=String(d?.error||d?.error_description||d?.message||'').replace(/[^A-Za-z0-9_.-]/g,'_').slice(0,70)}catch{}throw new Error(`upstream_${r.status}${detail?`_${detail}`:''}`)}
    return JSON.parse(text);
  }finally{clearTimeout(timer)}
}
function gated(provider,fn){
  const run=async()=>{const wait=Math.max(0,1050-(Date.now()-providerLastAt[provider]));if(wait)await new Promise(r=>setTimeout(r,wait));providerLastAt[provider]=Date.now();return fn()};
  const task=providerGate[provider].then(run,run);providerGate[provider]=task.catch(()=>{});return task;
}
function yahooCondition(v){return v==='used'?'中古':v==='new'?'新品':'要確認'}
async function yahooSearch(q){
  const appid=process.env.YAHOO_CLIENT_ID;if(!appid)return[];
  return gated('yahoo',async()=>{
    const p=new URLSearchParams({appid,query:providerQuery(q),results:'30',image_size:'600',in_stock:'true',sort:'-score'});
    const d=await fetchJson(`https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?${p}`),now=new Date().toISOString();
    return(d.hits||[]).map((h,i)=>{
      const image=h?.exImage?.url||h?.image?.medium||h?.image?.small||null,shippingCode=Number(h?.shipping?.code||0),description=String(h?.description||h?.headLine||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,320),searchText=`${h?.name||''} ${description}`;
      return{id:`yshop-${h?.code||i}`,source:'Yahoo!ショッピング',title:h?.name||'商品名不明',description,price:Number.isFinite(Number(h?.price))?Number(h.price):null,shipping:shippingCode===2?0:null,shippingLabel:h?.shipping?.name||null,fee:0,status:h?.inStock===false?'在庫なし':'販売中',condition:yahooCondition(h?.condition),url:h?.url||'#',directUrl:h?.url||null,image,type:detectType(searchText),collab:detectCollab(searchText),shop:h?.seller?.name||'',sellerId:h?.seller?.sellerId||'',janCode:h?.janCode||'',releaseDate:h?.releaseDate||null,reviewCount:Number.isFinite(Number(h?.review?.count))?Number(h.review.count):null,reviewAverage:Number.isFinite(Number(h?.review?.rate))?Number(h.review.rate):null,sourceFreshRank:i,verifiedAt:now,origin:'official-api',real:true,imageVerified:Boolean(image)};
    }).filter(x=>x.url&&x.url!=='#');
  });
}
function firstRakutenImage(h){const v=h?.mediumImageUrls?.[0]??h?.smallImageUrls?.[0]??null;return typeof v==='string'?v:(v?.imageUrl||null)}
async function rakutenSearch(q){
  const appId=process.env.RAKUTEN_APP_ID,accessKey=process.env.RAKUTEN_ACCESS_KEY;if(!appId||!accessKey)return[];
  return gated('rakuten',async()=>{
    const p=new URLSearchParams({applicationId:appId,keyword:providerQuery(q),hits:'30',format:'json',formatVersion:'2',availability:'1',field:'0',imageFlag:'1',sort:'-updateTimestamp'});if(process.env.RAKUTEN_AFFILIATE_ID)p.set('affiliateId',process.env.RAKUTEN_AFFILIATE_ID);
    const endpoint=process.env.RAKUTEN_ICHIBA_ENDPOINT||'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701',configured=String(process.env.PUBLIC_SITE_URL||'https://oshiruoshi.vercel.app').trim().replace(/\/$/,''),site=/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(configured)?configured:'https://oshiruoshi.vercel.app';
    const d=await fetchJson(`${endpoint}?${p}`,{headers:{accessKey,origin:site,referer:`${site}/`}}),rows=d.Items||d.items||[],now=new Date().toISOString();
    return rows.map((row,i)=>{
      const h=row?.Item||row||{},image=firstRakutenImage(h),available=Number(h?.availability)!==0,postage=Number(h?.postageFlag),description=String(h?.itemCaption||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,320),title=[h?.catchcopy,h?.itemName].filter(Boolean).join(' ').trim()||'商品名不明',searchText=`${title} ${description}`,directUrl=rakutenDirectUrl(h),affiliateUrl=h?.affiliateUrl||null,useAffiliate=Boolean(affiliateUrl&&rakutenAffiliateHealthy);
      return{id:`rakuten-${h?.itemCode||i}`,source:'楽天市場',title,description,price:Number.isFinite(Number(h?.itemPrice))?Number(h.itemPrice):null,shipping:postage===0?0:null,shippingLabel:postage===0?'送料込み/送料無料':'送料は商品ページで確認',fee:0,status:available?'販売中':'在庫なし',condition:'商品ページで確認',url:(useAffiliate?affiliateUrl:directUrl)||affiliateUrl||h?.itemUrl||'#',directUrl:directUrl||null,canonicalUrl:directUrl||null,affiliateUrl,image,type:detectType(searchText),collab:detectCollab(searchText),shop:h?.shopName||'',itemCode:h?.itemCode||'',reviewCount:Number.isFinite(Number(h?.reviewCount))?Number(h.reviewCount):null,reviewAverage:Number.isFinite(Number(h?.reviewAverage))?Number(h.reviewAverage):null,affiliate:useAffiliate,affiliateAvailable:Boolean(affiliateUrl),affiliateHealthy:rakutenAffiliateHealthy,sourceFreshRank:i,verifiedAt:now,origin:'official-api',real:true,imageVerified:Boolean(image)};
    }).filter(x=>x.url&&x.url!=='#');
  });
}
async function xSearch(q){
  if(!process.env.X_BEARER_TOKEN)return[];const xq=`(${q}) (グッズ OR コラボ OR 特典 OR カード OR 交換 OR 譲 OR 求 OR 買取) -is:retweet lang:ja`,d=await fetchJson(`https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(xq)}&max_results=12&tweet.fields=created_at`,{headers:{authorization:`Bearer ${process.env.X_BEARER_TOKEN}`}});
  return(d.data||[]).map(t=>({id:`x-${t.id}`,source:'X',title:t.text,price:null,shipping:null,fee:0,status:'交換・譲渡候補',condition:'投稿内容を確認',url:`https://x.com/i/web/status/${t.id}`,image:null,type:'交換投稿',releaseDate:t.created_at,verifiedAt:t.created_at||new Date().toISOString(),origin:'official-api',real:true,imageVerified:false}));
}
function send(res,status,data,cacheable=false){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control',cacheable?'public, max-age=10, s-maxage=25, stale-while-revalidate=90':'no-store');return res.status(status).json(data)}
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});const u=new URL(req.url,'http://local'),q=cleanQuery(u.searchParams.get('q')||'');if(!q)return send(res,200,{query:'',items:[],providers:{},generatedAt:new Date().toISOString()},true);
  const cacheKey=normalize(q),existing=cache.get(cacheKey);if(existing&&Date.now()-existing.at<30_000)return send(res,200,existing.value,true);
  const jobs=[];if(process.env.YAHOO_CLIENT_ID)jobs.push(['yahooShopping',yahooSearch(q)]);if(process.env.RAKUTEN_APP_ID&&process.env.RAKUTEN_ACCESS_KEY)jobs.push(['rakuten',rakutenSearch(q)]);if(process.env.X_BEARER_TOKEN)jobs.push(['x',xSearch(q)]);
  const settled=await Promise.all(jobs.map(async([name,promise])=>{try{return{name,ok:true,value:await promise}}catch(e){return{name,ok:false,value:[],error:String(e?.name==='AbortError'?'timeout':e?.message||e).slice(0,120)}}}));
  const providers={};let items=[];for(const r of settled){providers[r.name]={ok:r.ok,count:r.value.length,error:r.error||null};items.push(...r.value)}
  const value={query:q,providerQuery:providerQuery(q),items:rankItems(items,q),providers,affiliate:{rakutenHealthy:rakutenAffiliateHealthy},generatedAt:new Date().toISOString()};cache.set(cacheKey,{at:Date.now(),value});if(cache.size>100)cache.delete(cache.keys().next().value);return send(res,200,value,true);
}
