const SITE='https://oshiruoshi.vercel.app';
const UPDATED='2026年8月19日';
const pages={
  'guide/oshi-goods':{
    path:'/guide/oshi-goods',nav:'推し活グッズ比較ガイド',title:'推し活グッズ比較ガイド | OSHIRU',description:'推し活グッズを探すときの価格・送料・販売状況の見方と、アクスタ・缶バッジ・ぬい・カード、VTuber・アニメ・漫画グッズの探し方をまとめたOSHIRUの比較ガイドです。',eyebrow:'OSHIRU SEARCH GUIDE',h1:'推し活グッズを、迷わず探して比べる。',lead:'グッズ名だけでなく、作品名・キャラクター名・コラボ名を組み合わせると候補を絞りやすくなります。OSHIRUでは複数の販売サイトを横断し、価格・送料・販売状況を同じ基準で確認できます。',query:'推し活 グッズ',sections:[
      ['まずは検索語を具体的にする','「キャラクター名＋アクスタ」「作品名＋缶バッジ」「VTuber名＋ぬい」のように、対象とグッズ種別を組み合わせると、同名商品や無関係な候補を減らしやすくなります。'],
      ['商品価格だけで決めない','表示価格が安くても、送料や商品の状態によって実際の負担は変わります。OSHIRUでは商品価格、送料、販売状況を分けて確認し、最後は販売元の商品ページで最新情報を確認します。'],
      ['検索結果は入口として使う','在庫や出品状況は変動します。見つけた候補は販売元で内容を確認し、同じ検索語で複数サイトを見ることで、購入候補を比較しやすくなります。']
    ],searches:[['推し活グッズを探す','推し活 グッズ'],['アクスタを探す','アクスタ'],['缶バッジを探す','缶バッジ'],['推しぬいを探す','推し ぬい'],['カードを探す','キャラクター カード']],related:['compare/oshi-goods','compare/acrylic-stand','compare/can-badge','compare/plush','compare/card','discover/vtuber','discover/anime','discover/manga','discover/characters']
  },
  'compare/oshi-goods':{
    path:'/compare/oshi-goods',nav:'推し活グッズ価格比較',title:'推し活グッズの価格比較・横断検索 | OSHIRU',description:'推し活グッズを複数の販売サイトから横断検索し、商品価格・送料・販売状況を比較するためのページです。アクスタ、缶バッジ、ぬい、カードなどをOSHIRUで探せます。',eyebrow:'GOODS PRICE COMPARISON',h1:'推し活グッズの価格を、販売サイトをまたいで比較。',lead:'同じグッズでも販売先や出品状態によって価格と送料が異なります。商品名・キャラクター名・作品名を組み合わせて検索し、候補を横断して確認できます。',query:'推し活 グッズ',sections:[
      ['比較するときは総額を見る','本体価格だけでなく送料も確認します。送料が不明な候補は、販売元の商品ページを開いて最終的な支払額を確認してください。'],
      ['新品と中古・出品商品を分けて考える','販売サイトによって新品販売と個人出品が混在します。価格差だけでなく、商品の状態、付属品、販売状況を合わせて確認することが重要です。'],
      ['作品名やキャラ名を追加する','「推し活 グッズ」だけでは対象が広いため、「五条悟 アクスタ」「星街すいせい グッズ」のように固有名を足すと検索候補を絞れます。']
    ],searches:[['推し活グッズ','推し活 グッズ'],['限定グッズ','推し グッズ 限定'],['コラボグッズ','推し コラボ グッズ'],['特典グッズ','推し 特典 グッズ']],related:['compare/acrylic-stand','compare/can-badge','compare/plush','compare/card','discover/characters']
  },
  'compare/acrylic-stand':{
    path:'/compare/acrylic-stand',nav:'アクスタ比較',title:'アクスタの価格比較・横断検索 | OSHIRU',description:'アクスタ・アクリルスタンドを複数の販売サイトから探し、価格・送料・販売状況を比較するためのOSHIRUガイド。キャラクター名や作品名と組み合わせて検索できます。',eyebrow:'ACRYLIC STAND',h1:'アクスタを横断検索して、価格と条件を比較。',lead:'アクスタは通常版、限定、コラボ、イベント販売など名称が似た商品が多いため、キャラクター名やシリーズ名を足して検索すると候補を整理しやすくなります。',query:'アクスタ',sections:[
      ['キャラクター名＋アクスタで探す','固有名を先に入れることで、別作品や別キャラクターのアクリル商品が混ざるのを減らせます。コラボ名やイベント名が分かる場合はさらに追加します。'],
      ['台座・付属品・サイズを確認する','中古出品では台座や外袋の有無など条件が異なる場合があります。価格だけでなく商品説明と画像を販売元で確認してください。'],
      ['送料込みの候補を比較する','低価格の商品でも送料が加わると総額が変わります。候補を並べた後、送料と販売状態を含めて比較します。']
    ],searches:[['アクスタ','アクスタ'],['五条悟 アクスタ','五条悟 アクスタ'],['星街すいせい アクスタ','星街すいせい アクスタ'],['初音ミク アクスタ','初音ミク アクスタ']],related:['compare/oshi-goods','compare/can-badge','compare/plush','discover/characters']
  },
  'compare/can-badge':{
    path:'/compare/can-badge',nav:'缶バッジ比較',title:'缶バッジの価格比較・横断検索 | OSHIRU',description:'推しの缶バッジを複数サイトから横断検索し、価格・送料・販売状況を比べるためのOSHIRUガイド。作品名、キャラクター名、絵柄やシリーズ名を組み合わせて探せます。',eyebrow:'CAN BADGE',h1:'缶バッジを、絵柄やシリーズまで絞って探す。',lead:'缶バッジは同じキャラクターでも絵柄や弾、特典、イベントごとに種類が多くなりやすいグッズです。検索語を細かくして、目的の商品に近い候補を比較します。',query:'缶バッジ',sections:[
      ['作品名・キャラ名・シリーズ名を組み合わせる','「キャラ名＋缶バッジ」に加えて、コラボ名、イベント名、特典名などを追加すると対象の絵柄へ近づきやすくなります。'],
      ['単品とセットを区別する','複数個セットと単品では表示価格の意味が異なります。商品タイトルと説明から個数を確認し、単純な価格だけで比較しないようにします。'],
      ['状態と保管条件も確認する','中古品では細かな傷や保管状態が商品ごとに異なります。気になる候補は販売元の写真と説明を確認してください。']
    ],searches:[['缶バッジ','缶バッジ'],['五条悟 缶バッジ','五条悟 缶バッジ'],['VTuber 缶バッジ','VTuber 缶バッジ'],['アニメ 缶バッジ','アニメ 缶バッジ']],related:['compare/oshi-goods','compare/acrylic-stand','compare/card','discover/anime']
  },
  'compare/plush':{
    path:'/compare/plush',nav:'推しぬい比較',title:'推しぬい・ぬいぐるみの価格比較 | OSHIRU',description:'推しぬい・キャラクターぬいぐるみを複数販売サイトから横断検索し、価格・送料・販売状況を比較するOSHIRUガイド。サイズやシリーズ名を含めて探せます。',eyebrow:'PLUSH & OSHI NUI',h1:'推しぬい・ぬいぐるみを、サイズやシリーズまで比較。',lead:'ぬいぐるみは同じキャラクターでもサイズ、衣装、シリーズが異なることがあります。固有名と商品シリーズを組み合わせ、写真と商品説明を確認しながら候補を探します。',query:'推し ぬい',sections:[
      ['「ぬい」「ぬいぐるみ」の両方で試す','販売元によって商品名の表記が異なるため、「キャラ名＋ぬい」と「キャラ名＋ぬいぐるみ」の両方を試すと候補を広げられます。'],
      ['サイズと衣装を確認する','同名シリーズでもサイズ違いや衣装違いが存在する場合があります。購入前に商品説明と画像で対象を確認します。'],
      ['送料の影響を確認する','ぬいぐるみはサイズによって送料が変わる場合があります。価格差が小さいときほど送料込みで比較してください。']
    ],searches:[['推しぬい','推し ぬい'],['VTuber ぬい','VTuber ぬい'],['アニメ ぬいぐるみ','アニメ ぬいぐるみ'],['初音ミク ぬい','初音ミク ぬい']],related:['compare/oshi-goods','compare/acrylic-stand','compare/card','discover/vtuber']
  },
  'compare/card':{
    path:'/compare/card',nav:'カード比較',title:'キャラクターカード・特典カードの価格比較 | OSHIRU',description:'キャラクターカード、特典カード、コレクションカードなどを複数サイトから横断検索し、価格・送料・販売状況を比較するOSHIRUガイドです。',eyebrow:'CHARACTER CARD',h1:'キャラクターカード・特典カードを横断検索。',lead:'カード類は特典、配布、封入、シリーズ違いなどで名称が似やすいため、作品名やキャラクター名に加えて特典名・弾・コラボ名を入れて探すのが有効です。',query:'キャラクター カード',sections:[
      ['特典名やシリーズ名を検索語に足す','「キャラ名＋カード」だけで広すぎる場合は、店舗特典、来場者特典、コラボ名、シリーズ名など分かる情報を追加します。'],
      ['枚数とセット内容を確認する','単品、複数枚、コンプリートセットでは価格の意味が変わります。商品タイトルだけでなく説明欄も確認してください。'],
      ['状態に敏感な商品として比較する','紙製品は折れ、擦れ、反りなど状態差が価格に影響しやすいため、画像と商品説明を販売元で確認します。']
    ],searches:[['キャラクターカード','キャラクター カード'],['特典カード','アニメ 特典 カード'],['五条悟 カード','五条悟 カード'],['ブルーロック カード','ブルーロック カード']],related:['compare/oshi-goods','compare/can-badge','compare/plush','discover/anime']
  },
  'discover/vtuber':{
    path:'/discover/vtuber',nav:'VTuberグッズ',title:'VTuberグッズを横断検索・価格比較 | OSHIRU',description:'VTuberのアクスタ、缶バッジ、ぬい、カードなどを横断検索するためのOSHIRUガイド。タレント名、グループ名、イベント名とグッズ種別を組み合わせて探せます。',eyebrow:'VTUBER GOODS',h1:'VTuberグッズを、名前とグッズ種別から探す。',lead:'VTuberグッズは公式販売、イベント、コラボ、過去商品など検索語の組み合わせが多くなります。タレント名とグッズ種別を軸に、必要ならイベント名やコラボ名を追加します。',query:'VTuber グッズ',sections:[
      ['タレント名＋グッズ種別を基本にする','「星街すいせい アクスタ」「宝鐘マリン グッズ」のように固有名と商品種別を組み合わせると候補を絞りやすくなります。'],
      ['イベント名・周年・コラボ名を追加する','目的の商品が特定の企画に紐づく場合は、その名称を検索語へ追加します。同じタレントの別シリーズとの混在を減らせます。'],
      ['販売元で公式性と商品状態を確認する','OSHIRUは検索・比較を補助する非公式サービスです。公式商品か、状態や付属品はどうかなど、購入前に販売元の掲載内容を確認してください。']
    ],searches:[['VTuber グッズ','VTuber グッズ'],['星街すいせい アクスタ','星街すいせい アクスタ'],['宝鐘マリン グッズ','宝鐘マリン グッズ'],['兎田ぺこら ぬい','兎田ぺこら ぬい'],['にじさんじ グッズ','にじさんじ グッズ']],related:['character/hoshimachi-suisei','discover/characters','compare/acrylic-stand','compare/plush']
  },
  'discover/anime':{
    path:'/discover/anime',nav:'アニメグッズ',title:'アニメグッズを横断検索・価格比較 | OSHIRU',description:'アニメ作品・キャラクターのアクスタ、缶バッジ、カード、ぬいなどを横断検索するOSHIRUガイド。作品名とキャラクター名、グッズ種別を組み合わせて探せます。',eyebrow:'ANIME GOODS',h1:'アニメグッズを、作品・キャラクター名から横断検索。',lead:'アニメグッズは作品名だけでは候補が多くなりがちです。キャラクター名、グッズ種別、コラボ名まで組み合わせることで目的の商品に近づけます。',query:'アニメ グッズ',sections:[
      ['作品名だけでなくキャラクター名を入れる','特定キャラクターを探す場合は、「作品名＋キャラ名＋グッズ種別」の順で具体化すると候補を整理しやすくなります。'],
      ['特典・コラボ商品は固有語を追加する','店舗特典、イベント、カフェ、企業コラボなどが分かる場合は、その名称も含めて検索します。'],
      ['再販・中古・個人出品を区別する','同じ商品名でも販売条件が異なることがあります。価格だけでなく販売元、状態、送料、在庫状況を確認してください。']
    ],searches:[['アニメ グッズ','アニメ グッズ'],['五条悟 アクスタ','五条悟 アクスタ'],['ブルーロック グッズ','ブルーロック グッズ'],['葬送のフリーレン グッズ','葬送のフリーレン グッズ'],['アニメ 特典 カード','アニメ 特典 カード']],related:['character/gojo-satoru','discover/characters','compare/can-badge','compare/card']
  },
  'discover/manga':{
    path:'/discover/manga',nav:'漫画グッズ',title:'漫画・コミック作品グッズを横断検索・価格比較 | OSHIRU',description:'漫画・コミック作品やキャラクターのグッズを複数販売サイトから横断検索するOSHIRUガイド。作品名、キャラクター名、原作グッズ、特典などを組み合わせて探せます。',eyebrow:'MANGA GOODS',h1:'漫画・コミック作品のグッズを、作品名から探す。',lead:'漫画作品のグッズは原作絵柄、アニメ版、書店特典、イベント商品などが混在する場合があります。欲しい商品の由来が分かるときは検索語へ追加します。',query:'漫画 グッズ',sections:[
      ['原作絵柄かアニメ絵柄かを意識する','同じキャラクターでも商品シリーズによってビジュアルや発売元が異なります。「原作」「コミック」「アニメ」など必要な語を追加します。'],
      ['書店・購入特典は特典名を足す','イラストカードや購入特典を探す場合は、「作品名＋特典＋カード」のように検索すると対象を絞りやすくなります。'],
      ['セット販売の内容を確認する','巻別特典や複数キャラクターセットでは、含まれる商品数や対象キャラクターを販売元の説明で確認してください。']
    ],searches:[['漫画 グッズ','漫画 グッズ'],['漫画 特典 カード','漫画 特典 カード'],['ブルーロック グッズ','ブルーロック グッズ'],['呪術廻戦 グッズ','呪術廻戦 グッズ']],related:['discover/anime','discover/characters','compare/card','compare/acrylic-stand']
  },
  'discover/characters':{
    path:'/discover/characters',nav:'キャラ・作品から探す',title:'キャラクター・作品名から推しグッズを探す | OSHIRU',description:'VTuber、アニメ、漫画、バーチャルキャラクターなどの名前から推しグッズを探すOSHIRUの入口ページ。キャラクター名とアクスタ、缶バッジ、ぬい、カードなどを組み合わせて横断検索できます。',eyebrow:'CHARACTER & TITLE',h1:'キャラクター・作品名から、推しグッズを探す。',lead:'名前が決まっている場合は、キャラクター名やタレント名にグッズ種別を足す方法が最もシンプルです。代表ページと検索例から、そのままOSHIRU検索へ移動できます。',query:'推し キャラクター グッズ',sections:[
      ['名前＋グッズ種別を使う','「五条悟 アクスタ」「星街すいせい アクスタ」「初音ミク ぬい」のように、固有名と商品種別を組み合わせます。'],
      ['同名・似た名称には作品名を追加する','検索結果に別キャラクターや別シリーズが混ざる場合は、作品名、グループ名、イベント名を追加して具体化します。'],
      ['固定ページは検索需要を見て増やす','OSHIRUでは薄いページを大量生成せず、検索されるテーマをSearch Consoleで確認しながら、役立つ情報を持つ固定ページを順次増やす方針です。']
    ],searches:[['星街すいせい グッズ','星街すいせい グッズ'],['五条悟 グッズ','五条悟 グッズ'],['初音ミク グッズ','初音ミク グッズ'],['宝鐘マリン グッズ','宝鐘マリン グッズ'],['潔世一 グッズ','潔世一 グッズ'],['フリーレン グッズ','フリーレン グッズ']],related:['character/hoshimachi-suisei','character/gojo-satoru','character/hatsune-miku','discover/vtuber','discover/anime','discover/manga']
  },
  'character/hoshimachi-suisei':{
    path:'/character/hoshimachi-suisei',nav:'星街すいせいグッズ',title:'星街すいせいグッズを横断検索・価格比較 | OSHIRU',description:'星街すいせいのアクスタ、缶バッジ、ぬい、カードなどのグッズを横断検索するためのOSHIRUページ。商品価格・送料・販売状況を比較できます。',eyebrow:'CHARACTER SEARCH',h1:'星街すいせいグッズを横断検索。',lead:'星街すいせいのグッズを探すときは、名前に「アクスタ」「缶バッジ」「ぬい」などの種別や、分かる場合は企画名・イベント名を追加すると候補を絞りやすくなります。',query:'星街すいせい グッズ',sections:[
      ['まずはグッズ種別を追加する','検索対象が広い場合は「星街すいせい アクスタ」「星街すいせい ぬい」のように商品種別を追加します。'],
      ['限定・イベント商品は企画名も確認する','同じ名称でも販売時期や企画が異なる場合があります。商品タイトルと販売元の説明を確認してください。'],
      ['価格・送料・状態をセットで見る','OSHIRUで候補を比較した後、購入前に販売元で最新価格、送料、商品状態、在庫を確認します。']
    ],searches:[['星街すいせい グッズ','星街すいせい グッズ'],['星街すいせい アクスタ','星街すいせい アクスタ'],['星街すいせい 缶バッジ','星街すいせい 缶バッジ'],['星街すいせい ぬい','星街すいせい ぬい']],related:['discover/vtuber','discover/characters','compare/acrylic-stand','compare/plush']
  },
  'character/gojo-satoru':{
    path:'/character/gojo-satoru',nav:'五条悟グッズ',title:'五条悟グッズを横断検索・価格比較 | OSHIRU',description:'五条悟のアクスタ、缶バッジ、カード、ぬいなどのグッズを複数販売サイトから横断検索するOSHIRUページ。価格・送料・販売状況を比較できます。',eyebrow:'CHARACTER SEARCH',h1:'五条悟グッズを、グッズ種別まで絞って検索。',lead:'五条悟のグッズはアクスタ、缶バッジ、カード、コラボ商品など検索候補が広いため、商品種別やシリーズ名を組み合わせて探すと目的の商品を確認しやすくなります。',query:'五条悟 グッズ',sections:[
      ['グッズ名を具体化する','「五条悟 アクスタ」「五条悟 カード」のように種別を追加します。コラボ商品ならコラボ名も追加してください。'],
      ['同じ絵柄・シリーズか確認する','商品名が似ていても絵柄やシリーズ、付属品が異なる場合があります。販売元の写真と説明で対象商品を確認します。'],
      ['特典や中古品は状態も比較する','紙製特典や中古グッズでは状態差があります。価格だけでなく送料・状態・販売状況を含めて候補を見ます。']
    ],searches:[['五条悟 グッズ','五条悟 グッズ'],['五条悟 アクスタ','五条悟 アクスタ'],['五条悟 缶バッジ','五条悟 缶バッジ'],['五条悟 カード','五条悟 カード']],related:['discover/anime','discover/characters','compare/acrylic-stand','compare/card']
  },
  'character/hatsune-miku':{
    path:'/character/hatsune-miku',nav:'初音ミクグッズ',title:'初音ミクグッズを横断検索・価格比較 | OSHIRU',description:'初音ミクのアクスタ、ぬいぐるみ、フィギュア、カードなどのグッズを横断検索するOSHIRUページ。価格・送料・販売状況を複数サイトで比較できます。',eyebrow:'CHARACTER SEARCH',h1:'初音ミクグッズを、シリーズやグッズ種別から探す。',lead:'初音ミクのグッズは商品カテゴリや企画が幅広いため、「初音ミク＋グッズ種別」にシリーズ名やコラボ名を足して検索すると候補を整理しやすくなります。',query:'初音ミク グッズ',sections:[
      ['グッズ種別を先に決める','アクスタ、ぬい、フィギュアなど目的のカテゴリを追加すると、異なる商品種別が混ざるのを減らせます。'],
      ['シリーズ名・企画名を追加する','特定のビジュアルやコラボ商品を探す場合は、そのシリーズ名や企画名を検索語に含めます。'],
      ['新品・中古・出品条件を確認する','複数の販売経路があるため、価格、送料、商品の状態、付属品を販売元のページで最終確認してください。']
    ],searches:[['初音ミク グッズ','初音ミク グッズ'],['初音ミク アクスタ','初音ミク アクスタ'],['初音ミク ぬい','初音ミク ぬい'],['初音ミク フィギュア','初音ミク フィギュア']],related:['discover/characters','compare/acrylic-stand','compare/plush','compare/oshi-goods']
  }
};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function searchHref(q){return `/?q=${encodeURIComponent(q)}#results`}
function crumbs(page,key){const out=[['/','ホーム']];if(key!=='guide/oshi-goods')out.push(['/guide/oshi-goods','比較ガイド']);if(key.startsWith('character/')&&key!=='discover/characters')out.push(['/discover/characters','キャラ・作品から探す']);out.push([page.path,page.nav]);return out}
function pageHtml(page,key){const canonical=SITE+page.path;const related=(page.related||[]).map(k=>pages[k]).filter(Boolean);return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="OSHIRU"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=20260819-pcfix1"><link rel="stylesheet" href="/seo-pages.css?v=20260819-seo1"></head>
<body><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="OSHIRU ホーム"><span class="brand-mark">O</span><span>OSHIRU</span></a><nav class="header-nav" aria-label="メインナビゲーション"><a href="/">商品検索</a><a href="/guide/oshi-goods">比較ガイド</a></nav><a class="seo-header-cta" href="${searchHref(page.query)}" rel="nofollow">このテーマで検索</a></div></header>
<main class="seo-main"><nav class="seo-breadcrumb" aria-label="パンくず">${crumbs(page,key).map(([href,label],i,a)=>`<a href="${href}">${esc(label)}</a>${i<a.length-1?'<span aria-hidden="true">›</span>':''}`).join('')}</nav>
<section class="seo-hero"><span class="seo-eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.h1)}</h1><p class="seo-lead">${esc(page.lead)}</p><div class="seo-meta">${UPDATED}更新 ｜ OSHIRUは推し活グッズの検索・比較を補助する非公式サービスです。</div><div class="seo-cta-row"><a class="seo-primary" href="${searchHref(page.query)}" rel="nofollow">「${esc(page.query)}」で横断検索する</a></div></section>
<section class="seo-section" aria-labelledby="tips"><h2 id="tips">探す・比べるときのポイント</h2><div class="seo-grid">${page.sections.map(([t,b])=>`<article class="seo-card"><h3>${esc(t)}</h3><p>${esc(b)}</p></article>`).join('')}</div></section>
<section class="seo-section" aria-labelledby="queries"><h2 id="queries">そのまま使える検索例</h2><p>検索語を選ぶと、OSHIRUの既存検索画面に移動して同じ条件で横断検索します。</p><div class="seo-query-list">${page.searches.map(([label,q])=>`<a class="seo-query" href="${searchHref(q)}" rel="nofollow">${esc(label)}</a>`).join('')}</div></section>
${related.length?`<section class="seo-section" aria-labelledby="related"><h2 id="related">関連する比較ページ</h2><div class="seo-related">${related.map(p=>`<a href="${p.path}"><b>${esc(p.nav)}</b><span>${esc(p.description)}</span></a>`).join('')}</div></section>`:''}
<div class="seo-note">表示価格・送料・在庫・販売状況は取得時点の情報です。購入・申込み前に販売元の商品ページで最新情報、商品状態、付属品、送料等を必ず確認してください。各作品名・キャラクター名・タレント名・サービス名等の権利は各権利者に帰属し、OSHIRUは各権利者・販売サイトの公式サービスではありません。</div></main>
<footer class="site-footer"><div class="footer-inner"><div><div class="footer-brand">OSHIRU</div><div class="footer-note">推し活グッズを探す・比べる手間を少なくする横断検索サービスです。</div></div><nav class="seo-footer-links" aria-label="フッターナビゲーション"><a href="/guide/oshi-goods">グッズ比較ガイド</a><a href="/about.html">OSHIRUについて</a><a href="/terms.html">利用規約</a><a href="/privacy.html">プライバシー</a><a href="/disclaimer.html">免責・広告表示</a><a href="/contact.html">お問い合わせ</a></nav></div></footer></body></html>`}
export default function handler(req,res){const section=String(req.query.section||'').trim();const slug=String(req.query.slug||'').trim();const key=`${section}/${slug}`;const page=pages[key];res.setHeader('Content-Type','text/html; charset=utf-8');if(!page){res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.status(404).send('<!doctype html><html lang="ja"><meta charset="utf-8"><title>ページが見つかりません | OSHIRU</title><body><p>ページが見つかりません。</p><p><a href="/">OSHIRUへ戻る</a></p></body></html>');return}res.setHeader('X-Robots-Tag','index, follow');res.setHeader('Cache-Control','public, max-age=0, s-maxage=600, stale-while-revalidate=86400');res.status(200).send(pageHtml(page,key))}
