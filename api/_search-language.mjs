// Shared search-language utility. The leading underscore prevents Vercel from
// turning this imported module into a separate public Function.
export const MERCH_GROUPS=[
  {key:'voice-keyholder',canonical:'ボイスキーホルダー',broad:'キーホルダー',aliases:['ボイスキーホルダー','ボイスキー','ボイスキーチェーン','voice keyholder','voice key holder','voice keychain','voice key chain']},
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
  {key:'keyholder',canonical:'キーホルダー',broad:'キーホルダー',aliases:['キーホルダー','キーチェーン','チャーム','keyholder','key holder','keychain','key chain']},
  {key:'towel',canonical:'タオル',broad:'タオル',aliases:['タオル','マフラータオル','ハンドタオル']},
  {key:'shikishi',canonical:'色紙',broad:'色紙',aliases:['色紙','ミニ色紙']},
  {key:'poster',canonical:'ポスター',broad:'ポスター',aliases:['ポスター','ミニポスター']},
  {key:'uchiwa',canonical:'うちわ',broad:'うちわ',aliases:['うちわ','団扇']}
];

export const ENTITY_GROUPS=[
  {key:'overwatch',canonical:'オーバーウォッチ',aliases:['overwatch 2','overwatch2','overwatch','オーバーウォッチ2','オーバーウォッチ','ow2','ow']},
  {key:'project-sekai',canonical:'プロジェクトセカイ',aliases:['プロジェクトセカイ','プロセカ']},
  {key:'jujutsu-kaisen',canonical:'呪術廻戦',aliases:['呪術廻戦','呪術']},
  {key:'blue-lock',canonical:'ブルーロック',aliases:['ブルーロック','ブルロ']},
  {key:'gakumas',canonical:'学園アイドルマスター',aliases:['学園アイドルマスター','学マス']},
  {key:'idolmaster',canonical:'アイドルマスター',aliases:['アイドルマスター','アイマス']},
  {key:'ensemble-stars',canonical:'あんさんぶるスターズ',aliases:['あんさんぶるスターズ','あんスタ']},
  {key:'honkai-star-rail',canonical:'崩壊スターレイル',aliases:['崩壊スターレイル','崩壊スターレール','スターレイル','スタレ','hsr']},
  {key:'zenless-zone-zero',canonical:'ゼンレスゾーンゼロ',aliases:['ゼンレスゾーンゼロ','ゼンゼロ','zzz']},
  {key:'genshin',canonical:'原神',aliases:['原神','genshin impact','genshin']},
  {key:'valorant',canonical:'VALORANT',aliases:['valorant','ヴァロラント','ヴァロ','valo']},
  {key:'apex',canonical:'Apex Legends',aliases:['apex legends','apex','エーペックス','エペ']},
  {key:'hololive',canonical:'ホロライブ',aliases:['hololive','ホロライブ']},
  {key:'nijisanji',canonical:'にじさんじ',aliases:['nijisanji','にじさんじ']},
  {key:'vspo',canonical:'ぶいすぽっ！',aliases:['ぶいすぽっ！','ぶいすぽ','vspo']},
  {key:'stray-kids',canonical:'Stray Kids',aliases:['stray kids','straykids','skz']}
];

const GENERIC_WORDS=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古','goods','item']);
export const NOISE_WORDS=['収納ケース','保護ケース','ディスプレイケース','コレクションケース','収納ボックス','台座のみ','パーツのみ','保護フィルム','カバーのみ','ケースのみ','空箱'];
const JA='ぁ-んァ-ヶ一-龯々ー';

export function cleanFlexible(value=''){
  return String(value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
}
export function normalizeFlexible(value=''){
  return cleanFlexible(value).normalize('NFKC').toLowerCase()
    .replace(/[’‘`´]/g,"'")
    .replace(/[・･·／/|｜,，。｡()（）【】\[\]「」『』〈〉《》:_＿\-—–+＋]+/g,' ')
    .replace(new RegExp(`([a-z0-9])([${JA}])`,'gi'),'$1 $2')
    .replace(new RegExp(`([${JA}])([a-z0-9])`,'gi'),'$1 $2')
    .replace(/\s+/g,' ').trim();
}
export function compactFlexible(value=''){return normalizeFlexible(value).replace(/[\s']/g,'')}
function aliasNorm(value=''){return normalizeFlexible(value)}
function isShortAscii(value=''){return /^[a-z0-9]{1,3}$/.test(value)}
function containsAlias(text,alias){
  const n=aliasNorm(alias);if(!n)return false;
  if(isShortAscii(n))return text.split(/\s+/).includes(n);
  return text.includes(n)||compactFlexible(text).includes(compactFlexible(n));
}
function matchingGroups(text,groups){const n=normalizeFlexible(text);return groups.filter(group=>group.aliases.some(alias=>containsAlias(n,alias)))}
function replaceGroupAliases(text,groups,mode='canonical'){
  let out=normalizeFlexible(text);
  for(const group of groups){
    const replacement=mode==='broad'?(group.broad||group.canonical):group.canonical;
    for(const alias of [...group.aliases].sort((a,b)=>compactFlexible(b).length-compactFlexible(a).length)){
      const n=aliasNorm(alias);if(!n)continue;
      if(isShortAscii(n)){
        const parts=out.split(/\s+/).map(token=>token===n?replacement:token);out=parts.join(' ');
      }else if(out.includes(n))out=out.split(n).join(` ${replacement} `);
      else{
        const compactAlias=compactFlexible(n),compactOut=compactFlexible(out);
        if(compactAlias&&compactOut.includes(compactAlias)){
          const escaped=n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
          try{out=out.replace(new RegExp(escaped,'gi'),` ${replacement} `)}catch{}
        }
      }
    }
    out=out.replace(/\s+/g,' ').trim();
  }
  return out;
}
function removeGroupAliases(text,groups){
  let out=normalizeFlexible(text);
  for(const group of groups){
    for(const alias of [...group.aliases,group.canonical,group.broad].filter(Boolean).sort((a,b)=>compactFlexible(b).length-compactFlexible(a).length)){
      const n=aliasNorm(alias);if(!n)continue;
      if(isShortAscii(n))out=out.split(/\s+/).filter(token=>token!==n).join(' ');
      else if(out.includes(n))out=out.split(n).join(' ');
    }
  }
  return out.replace(/\s+/g,' ').trim();
}

export function detectIntent(query=''){
  const original=cleanFlexible(query),normalized=normalizeFlexible(original);
  const entityGroups=matchingGroups(normalized,ENTITY_GROUPS),merchGroups=matchingGroups(normalized,MERCH_GROUPS);
  const entityCanonical=replaceGroupAliases(normalized,entityGroups,'canonical');
  let entity=removeGroupAliases(entityCanonical,merchGroups);
  entity=entity.split(/\s+/).filter(token=>token&&!GENERIC_WORDS.has(token)).join(' ').trim();
  return{original,normalized,entity,entityGroups,merchGroups};
}
function pushVariant(list,seen,query,reason,weight){
  const value=cleanFlexible(query),key=normalizeFlexible(value);if(!value||!key||seen.has(key))return;seen.add(key);list.push({query:value,reason,weight});
}
export function buildSearchVariants(query='',limit=5){
  const intent=detectIntent(query),variants=[],seen=new Set();
  pushVariant(variants,seen,intent.original,'original',34);
  let canonical=replaceGroupAliases(intent.normalized,intent.entityGroups,'canonical');
  canonical=replaceGroupAliases(canonical,intent.merchGroups,'canonical');
  pushVariant(variants,seen,canonical,'canonical',32);
  pushVariant(variants,seen,intent.normalized,'segmented',26);
  if(intent.merchGroups.length){
    let broad=replaceGroupAliases(intent.normalized,intent.entityGroups,'canonical');
    broad=replaceGroupAliases(broad,intent.merchGroups,'broad');
    pushVariant(variants,seen,broad,'broad-merch',20);
    if(intent.entity)pushVariant(variants,seen,`${intent.entity} グッズ`,'entity-fallback',10);
  }
  return variants.slice(0,Math.max(1,limit));
}
export function preferredProviderQuery(query=''){
  const variants=buildSearchVariants(query,4);
  return variants.find(v=>v.reason==='canonical')?.query||variants.find(v=>v.reason==='segmented')?.query||variants[0]?.query||cleanFlexible(query);
}
export function detectMerchLabel(value=''){
  const n=normalizeFlexible(value),group=MERCH_GROUPS.find(g=>g.aliases.some(alias=>containsAlias(n,alias))||containsAlias(n,g.canonical));
  return group?.canonical||'';
}
function groupHit(group,text){return group.aliases.some(alias=>containsAlias(text,alias))||containsAlias(text,group.canonical)||Boolean(group.broad&&containsAlias(text,group.broad))}
function freshnessScore(item){
  const value=item?.releaseDate||item?.verifiedAt;if(!value)return 0;const ms=Date.parse(value);if(!Number.isFinite(ms))return 0;const age=(Date.now()-ms)/86400000;
  if(age<0&&age>-365)return 24;if(age<=30)return 20;if(age<=90)return 13;if(age<=180)return 8;if(age<=365)return 4;return 0;
}
export function itemSearchScore(item,query=''){
  const intent=detectIntent(query),text=normalizeFlexible([item?.title,item?.description,item?.series,item?.character,item?.type,item?.collab,item?.shop,...(item?.tags||[])].filter(Boolean).join(' '));
  const compact=compactFlexible(text),qCompact=compactFlexible(intent.normalized),entityCompact=compactFlexible(intent.entity);let score=0;
  if(qCompact&&compact.includes(qCompact))score+=180;
  if(entityCompact){
    if(compact.includes(entityCompact))score+=210;
    else{
      const tokens=intent.entity.split(/\s+/).filter(Boolean);let matched=0;
      for(const token of tokens){if(compact.includes(compactFlexible(token))){score+=compactFlexible(token).length>=3?55:30;matched++}}
      if(tokens.length&&matched===0)score-=180;else if(matched===tokens.length)score+=45;
    }
  }
  for(const group of intent.entityGroups)if(groupHit(group,text))score+=95;
  if(intent.merchGroups.length){let matched=0;for(const group of intent.merchGroups){if(groupHit(group,text)){score+=125;matched++}}if(!matched)score-=55}
  if(NOISE_WORDS.some(word=>text.includes(normalizeFlexible(word))))score-=90;
  if(item?.status==='販売中'||item?.status==='販売中候補')score+=8;
  if(item?.image)score+=5;
  score+=freshnessScore(item);
  const reviews=Math.max(0,Number(item?.reviewCount)||0);if(reviews)score+=Math.min(28,Math.log10(reviews+1)*10);
  if(item?.isBestSeller)score+=8;
  score+=Math.min(35,Math.max(0,Number(item?._score)||0)*0.08);
  score+=Number(item?._variantWeight)||0;
  return Math.round(score*100)/100;
}
export function rankSearchItems(items=[],query=''){
  const seen=new Set(),ranked=[];
  for(const item of items){
    if(!item)continue;const key=String(item.directUrl||item.canonicalUrl||item.url||`${item.source}|${item.title}|${item.price}`).replace(/[?#].*$/,'');if(seen.has(key))continue;seen.add(key);
    ranked.push({...item,_score:itemSearchScore(item,query)});
  }
  return ranked.sort((a,b)=>(b._score||0)-(a._score||0)||(b.reviewCount||0)-(a.reviewCount||0)||(a.price??Infinity)-(b.price??Infinity));
}
export function countStrongMatches(items=[],query=''){return rankSearchItems(items,query).filter(item=>(item._score||0)>=180).length}
