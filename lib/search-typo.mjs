import { MERCH_GROUPS, ENTITY_GROUPS, detectIntent, normalizeFlexible, compactFlexible } from './search-language.mjs';

const GENERIC=new Set(['グッズ','商品','通販','販売','公式','非公式','新品','中古','セット','限定','予約','goods','item']);

function distance(a='',b=''){
  const x=[...String(a)],y=[...String(b)],n=x.length,m=y.length;
  if(!n)return m;if(!m)return n;
  const d=Array.from({length:n+1},()=>Array(m+1).fill(0));
  for(let i=0;i<=n;i++)d[i][0]=i;for(let j=0;j<=m;j++)d[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
    const cost=x[i-1]===y[j-1]?0:1;
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
    if(i>1&&j>1&&x[i-1]===y[j-2]&&x[i-2]===y[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[n][m];
}
function sim(a,b){
  const x=compactFlexible(a),y=compactFlexible(b),max=Math.max([...x].length,[...y].length);
  return max?1-distance(x,y)/max:0;
}
function script(value=''){
  const v=compactFlexible(value);if(/^[a-z0-9]+$/i.test(v))return'latin';if(/^[ぁ-んァ-ヶ一-龯々ー]+$/.test(v))return'ja';return'mixed';
}
function threshold(value=''){
  const n=[...compactFlexible(value)].length;
  if(n<=3)return 1;if(n<=5)return .79;if(n<=8)return .82;return .84;
}
function lexicon(){
  const out=[];
  for(const group of [...ENTITY_GROUPS,...MERCH_GROUPS]){
    for(const alias of [...new Set([group.canonical,group.broad,...(group.aliases||[])].filter(Boolean))]){
      const normalized=normalizeFlexible(alias),compact=compactFlexible(alias);
      if([...compact].length<4)continue;
      out.push({alias,normalized,compact,canonical:group.canonical,kind:MERCH_GROUPS.includes(group)?'merch':'entity'});
    }
  }
  return out;
}
const LEXICON=lexicon();

function bestKnown(token){
  const t=compactFlexible(token),kind=script(token);if([...t].length<4)return null;
  let best=null;
  for(const item of LEXICON){
    if(kind!=='mixed'&&script(item.alias)!==kind)continue;
    const lenDiff=Math.abs([...t].length-[...item.compact].length);if(lenDiff>2)continue;
    const score=sim(t,item.compact);if(score<Math.max(threshold(token),threshold(item.alias)))continue;
    if(!best||score>best.score||(score===best.score&&item.compact.length<best.item.compact.length))best={item,score};
  }
  return best;
}

export function correctKnownQuery(query=''){
  const normalized=normalizeFlexible(query),tokens=normalized.split(/\s+/).filter(Boolean),corrections=[];
  if(!tokens.length)return{query:String(query||''),corrected:String(query||''),changed:false,corrections:[]};
  const corrected=tokens.map(token=>{
    const exact=LEXICON.find(x=>x.compact===compactFlexible(token));if(exact)return token;
    const best=bestKnown(token);if(!best)return token;
    corrections.push({from:token,to:best.item.canonical,kind:best.item.kind,confidence:Number(best.score.toFixed(3))});
    return best.item.canonical;
  });
  const value=corrected.join(' ').replace(/\s+/g,' ').trim();
  return{query:String(query||''),corrected:value,changed:compactFlexible(value)!==compactFlexible(query),corrections};
}

function candidateWindows(text=''){
  const tokens=normalizeFlexible(text).split(/\s+/).filter(Boolean).filter(x=>!GENERIC.has(x));
  const out=[];
  for(let i=0;i<tokens.length;i++)for(let size=1;size<=3&&i+size<=tokens.length;size++){
    const value=tokens.slice(i,i+size).join(' '),compact=compactFlexible(value);
    if([...compact].length<4||[...compact].length>28)continue;
    if(detectIntent(value).merchGroups.length)continue;
    if(/^\d+$/.test(compact))continue;
    out.push(value);
  }
  return [...new Set(out)];
}

export function findDynamicEntityCorrection(query='',texts=[]){
  const intent=detectIntent(query),entity=String(intent.entity||'').trim();
  const entityCompact=compactFlexible(entity);if([...entityCompact].length<4||!intent.merchGroups.length)return null;
  let best=null;
  for(const text of texts.slice(0,40)){
    for(const candidate of candidateWindows(text)){
      const c=compactFlexible(candidate),lenDiff=Math.abs([...entityCompact].length-[...c].length);if(lenDiff>3)continue;
      const score=sim(entityCompact,c);if(score<.74)continue;
      if(!best||score>best.score||(score===best.score&&c.length<best.compact.length))best={value:candidate,compact:c,score};
    }
  }
  if(!best)return null;
  const required=[...entityCompact].length<=5?.79:.76;if(best.score<required)return null;
  const merch=intent.merchGroups[0]?.canonical||'';
  return{from:entity,to:best.value,corrected:`${best.value} ${merch}`.trim(),confidence:Number(best.score.toFixed(3))};
}

export function typoFallbackVariants(query=''){
  const intent=detectIntent(query),out=[];
  if(!intent.merchGroups.length)return out;
  const canonical=[...new Set(intent.merchGroups.map(g=>g.canonical).filter(Boolean))].join(' ');
  const broad=[...new Set(intent.merchGroups.map(g=>g.broad||g.canonical).filter(Boolean))].join(' ');
  if(canonical)out.push({query:canonical,reason:'typo-merch-fallback',weight:3});
  if(broad&&compactFlexible(broad)!==compactFlexible(canonical))out.push({query:broad,reason:'typo-broad-fallback',weight:1});
  return out;
}

function itemText(item){return [item?.title,item?.description,item?.series,item?.character,item?.type,item?.collab,item?.shop,...(item?.tags||[])].filter(Boolean).join(' ')}
function entitySimilarity(query,item){
  const intent=detectIntent(query),entity=String(intent.entity||'').trim(),ec=compactFlexible(entity);if([...ec].length<4)return 0;
  let best=0;
  for(const candidate of candidateWindows(itemText(item))){
    const c=compactFlexible(candidate),lenDiff=Math.abs([...ec].length-[...c].length);if(lenDiff>3)continue;
    best=Math.max(best,sim(ec,c));if(best>=.96)break;
  }
  return best;
}
export function rerankWithTypos(items=[],query=''){
  return items.map(item=>{
    const similarity=entitySimilarity(query,item);let bonus=0;
    if(similarity>=.9)bonus=250;else if(similarity>=.82)bonus=210;else if(similarity>=.75)bonus=135;
    return{...item,_fuzzySimilarity:Number(similarity.toFixed(3)),_score:Number(item?._score||0)+bonus};
  }).sort((a,b)=>(b._score||0)-(a._score||0)||(a.price??Infinity)-(b.price??Infinity));
}
