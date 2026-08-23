// Shared search-language utility. The leading underscore prevents Vercel from
// turning this imported module into a separate public Function.
export const MERCH_GROUPS=[
  {key:'voice-keyholder',parent:'keyholder',canonical:'ボイスキーホルダー',broad:'キーホルダー',aliases:['ボイスキーホルダー','ボイスキー','ボイスキーチェーン','voice keyholder','voice key holder','voice keychain','voice key chain'],consumeAliases:['キーホルダー','キーチェーン','ホルダー','keyholder','key holder','keychain','key chain']},
  {key:'acrylic-stand',canonical:'アクリルスタンド',broad:'アクリルスタンド',aliases:['アクスタ','アクリルスタンド','アクリルフィギュア','アクリルスタンドフィギュア','acrylic stand']},
  {key:'acrylic-keyholder',parent:'keyholder',canonical:'アクリルキーホルダー',broad:'キーホルダー',aliases:['アクキー','アクキ','アクチャ','アクリルキーホルダー','アクリルキー','アクリルキーチェーン','アクリルチャーム','acrylic keychain']},
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
  {
    key:'overwatch-kiriko',
    parent:'overwatch',
    canonical:'オーバーウォッチ キリコ',
    aliases:['overwatch 2 kiriko','overwatch2 kiriko','overwatch kiriko','ow2 kiriko','ow kiriko','オーバーウォッチ2 キリコ','オーバーウォッチ キリコ','キリコ オーバーウォッチ','キリコ ow2','キリコ ow','kiriko','キリコ'],
    consumeAliases:['overwatch 2','overwatch2','overwatch','オーバーウォッチ2','オーバーウォッチ','ow2','ow'],
    queryRequiresAny:['overwatch 2','overwatch2','overwatch','オーバーウォッチ2','オーバーウォッチ','ow2','ow'],
    required:[
      ['overwatch 2','overwatch2','overwatch','オーバーウォッチ2','オーバーウォッチ','ow2','ow'],
      ['kiriko','キリコ']
    ]
  },
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
  {
    key:'stray-kids-felix',
    parent:'stray-kids',
    canonical:'Stray Kids フィリックス',
    aliases:['stray kids felix','straykids felix','skz felix','スキズ felix','felix stray kids','felix straykids','felix skz','felix スキズ','スキズ フィリックス','フィリックス スキズ','felix','フィリックス','ピリ'],
    consumeAliases:['stray kids','straykids','skz','スキズ'],
    queryRequiresAny:['stray kids','straykids','skz','スキズ','ボイスキーホルダー','ボイスキー','ボイスキーチェーン','voice keyholder','voice key holder','voice keychain','voice key chain'],
    required:[
      ['stray kids','straykids','skz','スキズ','스트레이 키즈'],
      ['felix','フィリックス','ピリ','bbokari','bokari','ボッカリ']
    ]
  },
  {key:'stray-kids',canonical:'Stray Kids',aliases:['stray kids','straykids','skz','スキズ']}
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
function matchingGroups(text,groups){
  const n=normalizeFlexible(text);
  const matched=groups.filter(group=>
    group.aliases.some(alias=>containsAlias(n,alias))
    &&(!group.queryRequiresAny||group.queryRequiresAny.some(alias=>containsAlias(n,alias)))
  );
  const childParents=new Set(matched.map(group=>group.parent).filter(Boolean));
  return matched.filter(group=>!childParents.has(group.key));
}
function groupAliases(group){
  const aliases=[...(group.aliases||[]),...(group.consumeAliases||[])];
  const seen=new Set();
  return aliases.filter(alias=>{
    const key=aliasNorm(alias);if(!key||seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>compactFlexible(b).length-compactFlexible(a).length);
}
function replaceAliasOccurrences(text,alias,replacer){
  const n=aliasNorm(alias);if(!n)return{text,changed:false};
  if(isShortAscii(n)){
    let changed=false;
    const parts=text.split(/(\s+)/).map(part=>{
      if(part!==n)return part;changed=true;return replacer();
    });
    return{text:parts.join(''),changed};
  }
  const escape=part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=n.split(/\s+/).map(part=>{
    if(new RegExp(`[${JA}]`).test(part))return[...part].map(escape).join('\\s*');
    return escape(part);
  }).join('\\s*');
  let changed=false;
  try{
    const next=text.replace(new RegExp(pattern,'gi'),()=>{changed=true;return replacer()});
    return{text:next,changed};
  }catch{return{text,changed:false}}
}
function replaceGroupAliases(text,groups,mode='canonical'){
  let out=normalizeFlexible(text);
  for(const group of groups){
    const replacement=mode==='broad'?(group.broad||group.canonical):group.canonical;
    const marker='oshirualiasmarker';
    let placed=false;
    for(const alias of groupAliases(group)){
      const result=replaceAliasOccurrences(out,alias,()=>{
        if(placed)return ' ';
        placed=true;return ` ${marker} `;
      });
      out=result.text;
    }
    if(placed)out=out.split(marker).join(replacement);
    out=out.replace(/\s+/g,' ').trim();
  }
  return out;
}
function removeGroupAliases(text,groups){
  let out=normalizeFlexible(text);
  for(const group of groups){
    for(const alias of [...groupAliases(group),group.canonical,group.broad].filter(Boolean).sort((a,b)=>compactFlexible(b).length-compactFlexible(a).length)){
      out=replaceAliasOccurrences(out,alias,()=> ' ').text;
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
  for(const group of entityGroups){
    const canonical=normalizeFlexible(group.canonical);
    if(canonical&&entity.includes(canonical))entity=entity.split(canonical).join(group.canonical);
  }
  return{original,normalized,entity,entityGroups,merchGroups};
}
function pushVariant(list,seen,query,reason,weight){
  const value=cleanFlexible(query),key=normalizeFlexible(value);if(!value||!key||seen.has(key))return;seen.add(key);list.push({query:value,reason,weight});
}
export function buildSearchVariants(query='',limit=5){
  const intent=detectIntent(query),variants=[],seen=new Set();
  pushVariant(variants,seen,intent.original,'original',34);
  const canonical=[intent.entity,...new Set(intent.merchGroups.map(group=>group.canonical))].filter(Boolean).join(' ');
  pushVariant(variants,seen,canonical,'canonical',32);
  pushVariant(variants,seen,intent.normalized,'segmented',26);
  if(intent.merchGroups.length){
    const broad=[intent.entity,...new Set(intent.merchGroups.map(group=>group.broad||group.canonical))].filter(Boolean).join(' ');
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
function groupHit(group,text){
  if(group.required)return group.required.every(alternatives=>alternatives.some(alias=>containsAlias(text,alias)));
  return group.aliases.some(alias=>containsAlias(text,alias))||containsAlias(text,group.canonical)||Boolean(group.broad&&containsAlias(text,group.broad));
}
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
