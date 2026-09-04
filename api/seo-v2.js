import { snapshotSearch } from './_core.mjs';

const SITE='https://oshiruoshi.vercel.app';
const UPDATED='2026年9月5日';
const UPDATED_ISO='2026-09-05';
const LAST_MODIFIED_HTTP='Fri, 04 Sep 2026 15:00:00 GMT';
const SEO_VERSION='2026-09-05.18';

const commonTips={
  compare:[
    ['価格だけでなく条件をそろえて比べる','商品価格に加えて送料、商品の状態、付属品、販売状況を確認します。送料が不明な候補は、販売元の商品ページで最終的な支払額を確認してください。'],
    ['検索語を具体化する','作品名・キャラクター名・グッズ種別・コラボ名を組み合わせると、目的の商品に近い候補へ絞り込みやすくなります。'],
    ['購入前は販売元で再確認する','価格・送料・在庫・商品状態は取得後に変わる場合があります。OSHIRUの比較結果は候補探しに使い、購入前に販売元の最新情報を確認してください。']
  ],
  discover:[
    ['名前＋グッズ種別で探す','作品名やタレント名だけで広すぎる場合は、「アクスタ」「缶バッジ」「ぬい」「カード」などの種別を追加します。'],
    ['限定・コラボは固有名を足す','イベント名、店舗名、周年、コラボ名などが分かる場合は検索語に加えると、別シリーズとの混在を減らせます。'],
    ['販売条件を最後に確認する','同じ名称でも新品・中古、セット内容、付属品が異なる場合があります。販売元の商品説明と画像を確認してください。']
  ]
};

export const SEO_PAGES={
  'guide/oshi-goods':{path:'/guide/oshi-goods',nav:'推し活グッズ比較ガイド',title:'推し活グッズ比較ガイド｜価格・送料・探し方 | OSHIRU',description:'推し活グッズの探し方と価格・送料・販売状況の比較ポイントを解説。アクスタ、缶バッジ、ぬい、カード、VTuber・アニメ・漫画グッズをOSHIRUで横断検索できます。',eyebrow:'OSHIRU SEARCH GUIDE',h1:'推し活グッズを、迷わず探して比べる。',lead:'キャラクター名・作品名・グッズ種別を組み合わせると、欲しい候補を絞りやすくなります。OSHIRUでは複数の販売先を同じ検索画面で確認できます。',query:'推し活 グッズ',tips:commonTips.compare,searches:[['アクスタを探す','アクスタ'],['缶バッジを探す','缶バッジ'],['推しぬいを探す','推し ぬい'],['カードを探す','キャラクター カード']],related:['guide/how-oshiru-compares','compare/oshi-goods','compare/acrylic-stand','compare/can-badge','compare/plush','compare/card','discover/vtuber','discover/anime','discover/manga','discover/characters']},
  'guide/how-oshiru-compares':{path:'/guide/how-oshiru-compares',nav:'検索・比較の仕組み',title:'OSHIRUの検索・価格比較の仕組みと情報更新方針',description:'OSHIRUが推し活グッズをどのように検索・比較し、価格、送料、販売状況、取得時点、広告をどのように扱うかを説明します。',eyebrow:'SEARCH METHODOLOGY',h1:'OSHIRUの検索・比較は、何を基準にしているか。',lead:'検索結果を安心して使えるよう、取得元、検索順位の考え方、情報の更新時点、購入前に確認すべき事項を明示します。',query:'推し活 グッズ',live:false,tips:[['取得元を区別して扱う','Yahoo!ショッピングと楽天市場は利用可能な公式APIから候補を取得します。その他の販売サイトは同じ検索語で確認できる直接導線と、OSHIRU内の確認済み情報を区別して扱います。'],['関連度は検索語との一致を中心にする','商品名、作品名、キャラクター名、グッズ種別、コラボ名などと検索語の一致を使って候補を整理します。広告の有無だけで通常検索の関連度を上げる設計にはしていません。'],['価格・在庫には更新差がある','外部サイトの価格、送料、在庫、商品状態は取得後に変わる可能性があります。購入前の最終確認は販売元の商品ページで行ってください。'],['PRと通常検索を分ける','楽天アフィリエイト等の広告枠は通常の検索結果と区別して表示します。']],searches:[['推し活グッズを検索','推し活 グッズ'],['アクスタを比較','アクスタ'],['VTuberグッズを検索','VTuber グッズ']],related:['guide/oshi-goods','compare/oshi-goods','discover/characters','discover/vtuber']},
  'compare/oshi-goods':{path:'/compare/oshi-goods',nav:'推し活グッズ価格比較',title:'推し活グッズの価格比較・横断検索 | OSHIRU',description:'推し活グッズを複数の販売サイトから横断検索し、商品価格・送料・販売状況を比較。アクスタ、缶バッジ、ぬい、カードなどを探せます。',eyebrow:'GOODS PRICE COMPARISON',h1:'推し活グッズの価格を、販売サイトをまたいで比較。',lead:'同じグッズでも販売先や出品状態によって価格と送料が異なります。名前とグッズ種別を組み合わせて候補を整理できます。',query:'推し活 グッズ',tips:commonTips.compare,searches:[['限定グッズ','推し グッズ 限定'],['コラボグッズ','推し コラボ グッズ'],['特典グッズ','推し 特典 グッズ']],related:['guide/how-oshiru-compares','compare/acrylic-stand','compare/can-badge','compare/plush','compare/card','discover/characters']},
  'compare/acrylic-stand':{path:'/compare/acrylic-stand',nav:'アクスタ比較',title:'アクスタの価格比較・横断検索 | OSHIRU',description:'アクスタ・アクリルスタンドを複数の販売サイトから探し、価格・送料・販売状況を比較。キャラクター名や作品名と組み合わせて検索できます。',eyebrow:'ACRYLIC STAND',h1:'アクスタを横断検索して、価格と条件を比較。',lead:'通常版、限定、コラボ、イベント商品など名称が似た候補を、キャラクター名やシリーズ名と組み合わせて探せます。',query:'アクスタ',tips:commonTips.compare,searches:[['五条悟 アクスタ','五条悟 アクスタ'],['星街すいせい アクスタ','星街すいせい アクスタ'],['初音ミク アクスタ','初音ミク アクスタ']],related:['compare/oshi-goods','compare/can-badge','compare/plush','discover/characters']},
  'compare/can-badge':{path:'/compare/can-badge',nav:'缶バッジ比較',title:'缶バッジの価格比較・横断検索 | OSHIRU',description:'推しの缶バッジを複数サイトから横断検索し、価格・送料・販売状況を比較。作品名、キャラクター名、シリーズ名を組み合わせて探せます。',eyebrow:'CAN BADGE',h1:'缶バッジを、絵柄やシリーズまで絞って探す。',lead:'同じキャラクターでも絵柄、弾、特典、イベントごとに種類が多い缶バッジを、検索語を具体化して比較できます。',query:'缶バッジ',tips:commonTips.compare,searches:[['VTuber 缶バッジ','VTuber 缶バッジ'],['アニメ 缶バッジ','アニメ 缶バッジ'],['五条悟 缶バッジ','五条悟 缶バッジ']],related:['compare/oshi-goods','compare/acrylic-stand','compare/card','discover/anime']},
  'compare/plush':{path:'/compare/plush',nav:'推しぬい比較',title:'推しぬい・ぬいぐるみの価格比較 | OSHIRU',description:'推しぬい・キャラクターぬいぐるみを複数販売サイトから横断検索し、価格・送料・販売状況を比較。サイズやシリーズ名を含めて探せます。',eyebrow:'PLUSH & OSHI NUI',h1:'推しぬい・ぬいぐるみを、サイズやシリーズまで比較。',lead:'同じキャラクターでもサイズ、衣装、シリーズが異なるぬいぐるみを、固有名と商品種別を組み合わせて探せます。',query:'推し ぬい',tips:commonTips.compare,searches:[['VTuber ぬい','VTuber ぬい'],['アニメ ぬいぐるみ','アニメ ぬいぐるみ'],['初音ミク ぬい','初音ミク ぬい']],related:['compare/oshi-goods','compare/acrylic-stand','compare/card','discover/vtuber']},
  'compare/card':{path:'/compare/card',nav:'カード比較',title:'キャラクターカード・特典カードの価格比較 | OSHIRU',description:'キャラクターカード、特典カード、コレクションカードを複数サイトから横断検索し、価格・送料・販売状況を比較できます。',eyebrow:'CHARACTER CARD',h1:'キャラクターカード・特典カードを横断検索。',lead:'特典、配布、封入、シリーズ違いなど名称が似たカード類を、作品名・キャラクター名・特典名で絞って探せます。',query:'キャラクター カード',tips:commonTips.compare,searches:[['特典カード','アニメ 特典 カード'],['五条悟 カード','五条悟 カード'],['ブルーロック カード','ブルーロック カード']],related:['compare/oshi-goods','compare/can-badge','compare/plush','discover/anime']},
  'discover/vtuber':{path:'/discover/vtuber',nav:'VTuberグッズ',title:'VTuberグッズを横断検索・価格比較 | OSHIRU',description:'VTuberのアクスタ、缶バッジ、ぬい、カードなどを横断検索。タレント名、グループ名、イベント名とグッズ種別を組み合わせて探せます。',eyebrow:'VTUBER GOODS',h1:'VTuberグッズを、名前とグッズ種別から探す。',lead:'公式販売、イベント、コラボ、過去商品などを、タレント名とグッズ種別を軸に探せます。',query:'VTuber グッズ',tips:commonTips.discover,searches:[['星街すいせい アクスタ','星街すいせい アクスタ'],['宝鐘マリン グッズ','宝鐘マリン グッズ'],['兎田ぺこら ぬい','兎田ぺこら ぬい'],['にじさんじ グッズ','にじさんじ グッズ']],related:['character/hoshimachi-suisei','discover/characters','compare/acrylic-stand','compare/plush']},
  'discover/anime':{path:'/discover/anime',nav:'アニメグッズ',title:'アニメグッズを横断検索・価格比較 | OSHIRU',description:'アニメ作品・キャラクターのアクスタ、缶バッジ、カード、ぬいなどを横断検索。作品名、キャラクター名、グッズ種別を組み合わせて探せます。',eyebrow:'ANIME GOODS',h1:'アニメグッズを、作品・キャラクター名から横断検索。',lead:'作品名だけでは候補が多い場合も、キャラクター名、グッズ種別、コラボ名まで組み合わせて探せます。',query:'アニメ グッズ',tips:commonTips.discover,searches:[['五条悟 アクスタ','五条悟 アクスタ'],['ブルーロック グッズ','ブルーロック グッズ'],['葬送のフリーレン グッズ','葬送のフリーレン グッズ'],['アニメ 特典 カード','アニメ 特典 カード']],related:['character/gojo-satoru','discover/characters','compare/can-badge','compare/card']},
  'discover/manga':{path:'/discover/manga',nav:'漫画グッズ',title:'漫画・コミック作品グッズを横断検索・価格比較 | OSHIRU',description:'漫画・コミック作品やキャラクターのグッズを複数販売サイトから横断検索。作品名、キャラクター名、原作グッズ、特典を組み合わせて探せます。',eyebrow:'MANGA GOODS',h1:'漫画・コミック作品のグッズを、作品名から探す。',lead:'原作絵柄、アニメ版、書店特典、イベント商品などが混在しやすい漫画グッズを、固有名を足して探せます。',query:'漫画 グッズ',tips:commonTips.discover,searches:[['漫画 特典 カード','漫画 特典 カード'],['ブルーロック グッズ','ブルーロック グッズ'],['呪術廻戦 グッズ','呪術廻戦 グッズ']],related:['discover/anime','discover/characters','compare/card','compare/acrylic-stand']},
  'discover/characters':{path:'/discover/characters',nav:'キャラ・作品から探す',title:'キャラクター・作品名から推しグッズを探す | OSHIRU',description:'VTuber、アニメ、漫画、バーチャルキャラクターなどの名前から推しグッズを探す入口。名前とアクスタ、缶バッジ、ぬい、カードなどを組み合わせて横断検索できます。',eyebrow:'CHARACTER & TITLE',h1:'キャラクター・作品名から、推しグッズを探す。',lead:'名前が決まっている場合は、キャラクター名やタレント名にグッズ種別を足すと目的の商品へ近づきやすくなります。',query:'推し キャラクター グッズ',tips:commonTips.discover,searches:[['星街すいせい グッズ','星街すいせい グッズ'],['五条悟 グッズ','五条悟 グッズ'],['初音ミク グッズ','初音ミク グッズ'],['フリーレン グッズ','フリーレン グッズ']],related:['character/hoshimachi-suisei','character/gojo-satoru','character/hatsune-miku','discover/vtuber','discover/anime','discover/manga']},
  'character/hoshimachi-suisei':{path:'/character/hoshimachi-suisei',nav:'星街すいせいグッズ',title:'星街すいせいグッズを横断検索・価格比較 | OSHIRU',description:'星街すいせいのアクスタ、缶バッジ、ぬい、カードなどを横断検索し、価格・送料・販売状況を比較できます。',eyebrow:'CHARACTER SEARCH',h1:'星街すいせいグッズを横断検索。',lead:'名前に「アクスタ」「缶バッジ」「ぬい」などの種別や、企画名・イベント名を追加して候補を絞れます。',query:'星街すいせい グッズ',tips:commonTips.discover,searches:[['星街すいせい アクスタ','星街すいせい アクスタ'],['星街すいせい 缶バッジ','星街すいせい 缶バッジ'],['星街すいせい ぬい','星街すいせい ぬい']],related:['discover/vtuber','discover/characters','compare/acrylic-stand','compare/plush']},
  'character/gojo-satoru':{path:'/character/gojo-satoru',nav:'五条悟グッズ',title:'五条悟グッズを横断検索・価格比較 | OSHIRU',description:'五条悟のアクスタ、缶バッジ、カード、ぬいなどを複数販売サイトから横断検索し、価格・送料・販売状況を比較できます。',eyebrow:'CHARACTER SEARCH',h1:'五条悟グッズを、グッズ種別まで絞って検索。',lead:'アクスタ、缶バッジ、カード、コラボ商品などを、商品種別やシリーズ名と組み合わせて探せます。',query:'五条悟 グッズ',tips:commonTips.discover,searches:[['五条悟 アクスタ','五条悟 アクスタ'],['五条悟 缶バッジ','五条悟 缶バッジ'],['五条悟 カード','五条悟 カード']],related:['discover/anime','discover/characters','compare/acrylic-stand','compare/card']},
  'character/hatsune-miku':{path:'/character/hatsune-miku',nav:'初音ミクグッズ',title:'初音ミクグッズを横断検索・価格比較 | OSHIRU',description:'初音ミクのアクスタ、ぬいぐるみ、フィギュア、カードなどを横断検索し、価格・送料・販売状況を複数サイトで比較できます。',eyebrow:'CHARACTER SEARCH',h1:'初音ミクグッズを、シリーズやグッズ種別から探す。',lead:'商品カテゴリや企画が幅広い初音ミクグッズを、グッズ種別、シリーズ名、コラボ名を加えて探せます。',query:'初音ミク グッズ',tips:commonTips.discover,searches:[['初音ミク アクスタ','初音ミク アクスタ'],['初音ミク ぬい','初音ミク ぬい'],['初音ミク フィギュア','初音ミク フィギュア']],related:['discover/characters','compare/acrylic-stand','compare/plush','compare/oshi-goods']}
};

const pageGuidance={
  'guide/oshi-goods':[
    ['検索語は「作品・人物・種類」の順で組み立てる','たとえば「呪術廻戦 五条悟 アクスタ」のように対象を三段階で指定すると、同名作品や一般商品が混ざりにくくなります。'],
    ['価格差は送料と状態まで含めて判断する','本体価格が安くても送料や中古状態、付属品の欠品で条件が変わります。商品ページで最終支払額とセット内容を確認します。']
  ],
  'guide/how-oshiru-compares':[
    ['一致条件を先に、人気や価格を後に評価する','作品・キャラクター・指定したグッズ種別に合う候補だけを残し、その中で一致度、販売状況、確認時点などを使って順序を整えます。'],
    ['0件を無関係商品で埋めない','指定条件を満たす候補が取得できない場合は0件とし、似た名前だけの一般商品や別作品の商品を代わりに表示しません。']
  ],
  'compare/oshi-goods':[
    ['同一商品名でも販売条件を分けて見る','新品・中古、単品・セット、予約・在庫品を同じ条件として扱わず、価格と販売状況を合わせて確認します。'],
    ['限定名やイベント名を追加する','周年、誕生日、POP UP、店舗コラボなどの固有名を加えると、通常版との混在を減らせます。']
  ],
  'compare/acrylic-stand':[
    ['アクスタとアクキーを区別する','アクリル製でも、台座で立てる商品と金具で持ち歩く商品は別種です。検索結果では指定した種類との一致を優先します。'],
    ['台座・サイズ・開封状態を確認する','中古品は台座欠品や組立済みの場合があります。高さ、付属台座、未開封かどうかを販売元で確認します。']
  ],
  'compare/can-badge':[
    ['単品とBOX・全種セットを分ける','同じ絵柄名でも単品、ランダム商品、BOX、全種セットでは価格の意味が違うため、商品名と数量を確認します。'],
    ['シリーズ名と絵柄を指定する','周年、イベント、描き下ろし、弾数などをキャラクター名に足すと、別絵柄の混在を抑えられます。']
  ],
  'compare/plush':[
    ['サイズとシリーズをそろえて比較する','マスコット、10cm、20cm、プライズなどは価格帯が異なります。サイズやシリーズ名を検索語へ追加します。'],
    ['タグ・衣装・付属品を確認する','中古ぬいは紙タグ、衣装、小物の有無で状態が変わるため、写真と商品説明を販売元で確認します。']
  ],
  'compare/card':[
    ['配布元とシリーズ名を確認する','店舗特典、入場特典、封入カード、トレーディング商品は似た名称になりやすいため、配布元や弾数まで指定します。'],
    ['単枚・複数枚と状態を区別する','セット枚数、折れや傷、スリーブの有無を確認し、単純な表示価格だけで比較しないようにします。']
  ],
  'discover/vtuber':[
    ['タレント名と所属名を併用する','同名や英字表記の混在を避けるため、必要に応じてホロライブ、にじさんじ等の所属名を加えます。'],
    ['受注期間と再販を確認する','誕生日・周年グッズは受注期限があり、二次流通品とは価格条件が異なります。販売元と受付期間を確認します。']
  ],
  'discover/anime':[
    ['作品名・キャラクター名・商品種別を指定する','作品名だけの検索より、人物名とアクスタ・缶バッジ等を組み合わせた方が目的の候補を絞れます。'],
    ['TV版・劇場版・シーズンを区別する','同じ作品でもシリーズや公開時期で絵柄と商品が異なるため、分かる場合は副題や企画名を加えます。']
  ],
  'discover/manga':[
    ['原作絵柄かアニメ絵柄かを指定する','原作グッズ、アニメ化商品、書店特典では絵柄と販売元が異なるため、求める種類を検索語へ加えます。'],
    ['本そのものと特典グッズを区別する','単行本や電子書籍ではなく特典を探す場合は、「特典」「カード」「アクスタ」などの種別を明記します。']
  ],
  'discover/characters':[
    ['同名キャラクターには作品名を加える','短い名前や英字名は別作品・一般商品と重なりやすいため、作品名や所属名を一緒に指定します。'],
    ['略称・表記揺れはOSHIRUで正規化する','アクスタ、缶バ、ぬい等の略称は正式なグッズ種別へ整理し、元の意図を保った候補を優先します。']
  ],
  'character/hoshimachi-suisei':[
    ['企画名や衣装名を加えて絞る','周年、ライブ、コンビニコラボなどの企画名を「星街すいせい」に足すと、別ビジュアルの混在を減らせます。'],
    ['公式販売と二次流通を区別する','公式ショップの受注品と中古・未開封出品では価格条件が異なるため、販売元と状態を確認します。']
  ],
  'character/gojo-satoru':[
    ['「呪術廻戦」と五条悟を同時に確認する','同名や部分一致の商品を避けるため、作品文脈とキャラクター名の両方を満たす候補を優先します。'],
    ['コラボ名・シリーズ名を残して検索する','サンリオ、懐玉・玉折、劇場版などの指定語を落とさず、通常商品との混在を抑えます。']
  ],
  'character/hatsune-miku':[
    ['シリーズや衣装名を加える','初音ミクは商品数が多いため、雪ミク、レーシングミク、マジカルミライ等のシリーズ名で絞ると比較しやすくなります。'],
    ['同一商品名の重複を整理する','同じ販売元で同一名の商品が複数返った場合は重複を抑え、異なる販売元の比較候補は残します。']
  ]
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function searchHref(q){return `/?q=${encodeURIComponent(q)}#results`}
function crumbs(page,key){const out=[['/','ホーム']];if(key!=='guide/oshi-goods')out.push(['/guide/oshi-goods','比較ガイド']);if(key.startsWith('character/'))out.push(['/discover/characters','キャラ・作品から探す']);out.push([page.path,page.nav]);return out}
function money(n){return new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(n)}
function uniqItems(items){const seen=new Set();return items.filter(item=>{const k=String(item.canonicalUrl||item.url||`${item.source}|${item.title}|${item.price}`).replace(/[?#].*$/,'');if(!k||seen.has(k))return false;seen.add(k);return true})}
export async function buildSnapshot(page){
  if(page.live===false)return null;
  const snap=await snapshotSearch(page.query);
  const items=uniqItems(snap.items||[]);
  if(!items.length)return null;
  const priced=items.map(x=>Number(x.price)).filter(Number.isFinite).filter(x=>x>=0);
  const sources={};
  for(const item of items){const s=String(item.source||'その他');sources[s]=(sources[s]||0)+1}
  const sourceRows=Object.entries(sources).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const checkedTimes=items.map(item=>Date.parse(item.verifiedAt||'')).filter(Number.isFinite);
  const checkedAt=checkedTimes.length?new Date(Math.max(...checkedTimes)).toISOString():null;
  return {count:items.length,sourceRows,min:priced.length?Math.min(...priced):null,max:priced.length?Math.max(...priced):null,checkedAt};
}
function snapshotHtml(data,page){
  if(!data)return '';
  const price=data.min!==null&&data.max!==null?(data.min===data.max?money(data.min):`${money(data.min)}〜${money(data.max)}`):'価格情報なし';
  const checked=data.checkedAt?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(data.checkedAt)):'確認日時不明';
  const source=data.sourceRows.length?data.sourceRows.map(([name,count])=>`<span><b>${esc(name)}</b>${count}件</span>`).join(''):'<span>取得できた販売サイト別候補はありません</span>';
  return `<section class="seo-section seo-live" aria-labelledby="liveSnapshot"><div class="seo-live-head"><div><span class="seo-eyebrow">OSHIRU VERIFIED DATA</span><h2 id="liveSnapshot">「${esc(page.query)}」の確認済み比較スナップショット</h2></div><a href="${searchHref(page.query)}" rel="nofollow">最新候補を検索</a></div><p class="seo-live-lead">OSHIRUが確認済み情報として保持する候補だけを集計しています。市場全体の件数や現在の相場を保証するものではありません。</p><div class="seo-live-stats"><div><span>確認済み候補</span><b>${data.count}件</b></div><div><span>表示価格帯</span><b>${esc(price)}</b><small>送料は含めず、価格が取得できた候補のみ</small></div><div><span>最終確認</span><b>${esc(checked)}</b><small>日本時間</small></div></div><div class="seo-source-counts" aria-label="販売サイト別候補件数">${source}</div><p class="seo-live-note">ページ表示のたびに外部販売APIを待たないため、検索エンジンと利用者へ安定した本文を返します。最新の価格・送料・在庫・商品状態は販売元で確認してください。</p></section>`;
}
function structuredData(page,canonical,crumbRows){
  const graph=[
    {'@type':'WebSite','@id':SITE+'/#website',url:SITE+'/',name:'OSHIRU',alternateName:'OSHIRU 推し活グッズ検索',description:'推し活グッズを複数の販売サイトから横断検索し、価格・送料・販売状況を比較できる検索サービスです。',inLanguage:'ja-JP'},
    {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:page.title,description:page.description,inLanguage:'ja-JP',dateModified:UPDATED_ISO,isPartOf:{'@id':SITE+'/#website'},breadcrumb:{'@id':canonical+'#breadcrumb'}},
    {'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbRows.map(([href,label],index)=>({'@type':'ListItem',position:index+1,name:label,item:SITE+href}))}
  ];
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
}
function guidanceHtml(key){
  const rows=pageGuidance[key]||[];if(!rows.length)return'';
  return `<section class="seo-section" aria-labelledby="pageChecks"><h2 id="pageChecks">このテーマで結果を絞る確認ポイント</h2><div class="seo-grid">${rows.map(([title,body])=>`<article class="seo-card"><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('')}</div></section>`;
}
export function renderSeoPage(page,key,snapshot){
  const canonical=SITE+page.path;
  const related=(page.related||[]).map(k=>SEO_PAGES[k]).filter(Boolean),crumbRows=crumbs(page,key);
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="oshiru-seo-version" content="${SEO_VERSION}"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="last-modified" content="${UPDATED_ISO}"><link rel="canonical" href="${canonical}"><link rel="sitemap" type="application/xml" href="/sitemap.xml"><meta property="og:type" content="article"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="OSHIRU"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=20260819-pcfix1"><link rel="stylesheet" href="/seo-pages.css?v=20260819-seo3"><link rel="stylesheet" href="/seo-live.css?v=20260819-seo3"><script type="application/ld+json" data-oshiru-structured>${structuredData(page,canonical,crumbRows)}</script></head><body><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="OSHIRU ホーム"><span class="brand-mark">O</span><span>OSHIRU</span></a><nav class="header-nav" aria-label="メインナビゲーション"><a href="/">商品検索</a><a href="/guide/oshi-goods">比較ガイド</a></nav><a class="seo-header-cta" href="${searchHref(page.query)}" rel="nofollow">このテーマで検索</a></div></header><main class="seo-main"><nav class="seo-breadcrumb" aria-label="パンくず">${crumbRows.map(([href,label],i,a)=>`<a href="${href}">${esc(label)}</a>${i<a.length-1?'<span aria-hidden="true">›</span>':''}`).join('')}</nav><section class="seo-hero"><span class="seo-eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.h1)}</h1><p class="seo-lead">${esc(page.lead)}</p><div class="seo-meta">${UPDATED}更新 ｜ OSHIRUは推し活グッズの検索・比較を補助する非公式サービスです。</div><div class="seo-cta-row"><a class="seo-primary" href="${searchHref(page.query)}" rel="nofollow">「${esc(page.query)}」で横断検索する</a></div></section>${snapshotHtml(snapshot,page)}${guidanceHtml(key)}<section class="seo-section" aria-labelledby="tips"><h2 id="tips">探す・比べるときのポイント</h2><div class="seo-grid">${(page.tips||[]).map(([t,b])=>`<article class="seo-card"><h3>${esc(t)}</h3><p>${esc(b)}</p></article>`).join('')}</div></section><section class="seo-section" aria-labelledby="queries"><h2 id="queries">そのまま使える検索例</h2><p>検索語を選ぶとOSHIRUの検索画面へ移動し、同じ条件で候補を探せます。</p><div class="seo-query-list">${(page.searches||[]).map(([label,q])=>`<a class="seo-query" href="${searchHref(q)}" rel="nofollow">${esc(label)}</a>`).join('')}</div></section>${related.length?`<section class="seo-section" aria-labelledby="related"><h2 id="related">関連する比較ページ</h2><div class="seo-related">${related.map(p=>`<a href="${p.path}"><b>${esc(p.nav)}</b><span>${esc(p.description)}</span></a>`).join('')}</div></section>`:''}<div class="seo-note">表示価格・送料・在庫・販売状況は取得時点の情報です。購入・申込み前に販売元の商品ページで最新情報、商品状態、付属品、送料等を必ず確認してください。<a href="/guide/how-oshiru-compares">検索・比較の仕組みと更新方針</a>も確認できます。</div></main><footer class="site-footer"><div class="footer-inner"><div><div class="footer-brand">OSHIRU</div><div class="footer-note">推し活グッズを探す・比べる手間を少なくする横断検索サービスです。</div></div><nav class="seo-footer-links" aria-label="フッターナビゲーション"><a href="/guide/oshi-goods">グッズ比較ガイド</a><a href="/guide/how-oshiru-compares">検索・比較の仕組み</a><a href="/about.html">OSHIRUについて</a><a href="/terms.html">利用規約</a><a href="/privacy.html">プライバシー</a><a href="/disclaimer.html">免責・広告表示</a><a href="/contact.html">お問い合わせ</a></nav></div></footer></body></html>`;
}

export default async function handler(req,res){
  const section=String(req.query.section||'').trim();
  const slug=String(req.query.slug||'').trim();
  const key=`${section}/${slug}`;
  const page=SEO_PAGES[key];
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if(!page){res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.status(404).send('<!doctype html><html lang="ja"><meta charset="utf-8"><title>ページが見つかりません | OSHIRU</title><body><p>ページが見つかりません。</p><p><a href="/">OSHIRUへ戻る</a></p></body></html>');return}
  let snapshot=null;
  try{snapshot=await buildSnapshot(page)}catch{}
  res.setHeader('X-Robots-Tag','index, follow');
  res.setHeader('X-OSHIRU-SEO-Version',SEO_VERSION);
  res.setHeader('Last-Modified',LAST_MODIFIED_HTTP);
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=1800, stale-while-revalidate=86400');
  res.status(200).send(renderSeoPage(page,key,snapshot));
}
