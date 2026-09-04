# OSHIRU 品質記録・再発防止台帳

最終更新: 2026-09-05

## 運用ルール

ユーザーから受けた指摘は、その場の見た目だけを直して終了しない。次の5項目を記録し、該当する自動検査と本番確認が完了して初めて「解決」とする。

1. 症状: 利用者に何が起きたか
2. 根本原因: どの設計・実装・確認工程が症状を生んだか
3. 恒久対策: 同じ条件で再発させない実装または工程
4. 自動検査: CIまたはテストで検出できる条件
5. 本番証拠: 対象URL、対象リリース、確認日時、未確認事項

テスト合格、Gitへの反映、VercelでのDeployment作成、本番URLでの確認は別々の状態として扱う。本番URLで確認できていないものを「確認済み」「デプロイ完了」と表現しない。

## 指摘・原因・恒久対策

### QL-001 初回表示で商品カードが1列になり巨大化する

- 症状: モバイルで商品画像が画面幅近くまで拡大し、価格・お気に入り・比較が重なった。
- 根本原因: 高密度グリッド用CSS/JSを遅延スクリプトから動的挿入しており、通信順・キャッシュ状態により旧CSSが先に確定する競合があった。
- 恒久対策: 重要CSSを`index.html`の旧CSS後段から直接読み込み、重要JSも依存スクリプト後段から直接読み込む。列数、`minmax(0,1fr)`、正方形画像、横方向overflowを決定的に定義する。
- 自動検査: `tests/layout-v9.test.mjs`とV9 quality workflowが直接読込、8/7/6/5/4/3列、正方形画像、横overflow抑止を検査する。
- 本番証拠: `https://oshiruoshi.vercel.app`で390px/1440pxの実ブラウザ確認が必要。未確認の間は解決済みとしない。

### QL-002 初回検索結果に推し活と無関係な一般商品が混ざる

- 症状: 「ナルト」などの曖昧語で、一般のヘアピン・漫画等が先に表示され、推し活グッズが反映されないように見えた。
- 根本原因: 初回レスポンスが単純なスナップショット検索で、後から精度重視APIへ置換する二段構成だった。初回結果と更新結果の品質基準も一致していなかった。
- 恒久対策: 初回・更新とも`/api/live-search-v8`の同一精度経路を使い、作品/人物別名、グッズ意図、一般小売ノイズ除外、厳格な検証済みスナップショットfallbackを統合する。
- 自動検査: `tests/search-precision-v9.test.mjs`で正例と一般商品・漫画の負例、曖昧語補正、fallback精度を検査する。
- 本番証拠: 本番APIの`precisionVersion`、有効検索語、代表検索の結果内容を確認する。プロバイダー件数だけで精度確認を代替しない。

### QL-003 お気に入り・比較・価格が崩れる

- 症状: カード描画後に比較ボタン等が移動し、文字やボタンがカード外へはみ出した。
- 根本原因: MutationObserverで描画後に要素を移動する実装があり、表示途中のgeometryと最終geometryが異なった。
- 恒久対策: 価格・出品元・お気に入り・比較を最初から画像コンテナ内に生成し、固定サイズのoverlayとして配置する。選択状態は同じボタン上のclassと`aria-pressed`で更新する。
- 自動検査: `tests/layout-v9.test.mjs`が各操作要素の初期DOM位置、選択状態、旧カード下部アクション不在を検査する。
- 本番証拠: 390pxで3列、各overlay非重複、タップ後も列幅不変を実ブラウザで確認する。

### QL-004 「最新」に販売終了品が残る

- 症状: 公式最新情報として、既に販売期間が終了した商品が表示された。
- 根本原因: 公式URLの存在確認を最新性確認として扱い、販売期間・イベント期間の終了日を公開前ゲートにしていなかった。
- 恒久対策: 公式一次情報のみを使い、確認日と掲載期間を確認する。各期間限定項目に`data-live-until`を持たせ、期限後はブラウザ側でも自動的に最新枠から外す。販売期間内でも在庫切れなら確認日付きで明示する。ページには出典サイト名と商品名を同時表示する。
- 自動検査: V9 layout testが採用中の公式商品、公式画像、確認日、期限後の自動除外、在庫表示、出典ラベル、回転制御を固定回帰項目として検査する。内容の最新性は一次情報の手動確認も必須とする。
- 一次情報確認（2026-08-23 JST）: 先斗寧誕生日グッズ2026は8月27日23:59まで受注。獅白ぼたん活動6周年記念は受注期間が9月14日18:00までだが、確認時は全品SOLD OUT。呪術廻戦POP UPは会場別に8月21日から10月4日まで。Stray Kids特設はgoods導線と10月24日までの公演日程を掲載している。
- 本番証拠: 上記一次情報は確認済みだが、正規本番ページへの反映は未確認。自動テストのみで本番確認済みとはしない。

### QL-005 Git/Vercelの状態を本番反映と誤認する

- 症状: GitHubの変更やVercelのDeployment作成だけでは、既定URL`oshiruoshi.vercel.app`が新しい内容にならない可能性があった。
- 根本原因: Gitブランチ、Vercel project、preview alias、production alias、公開ドメインの対応を同一状態として扱っていた。
- 恒久対策: リリース時は、mainの対象SHA、Vercel production状態、正規ドメインのasset marker/API version、実ブラウザ表示を別々に確認する。別project/aliasへの成功を本番成功として扱わない。
- 自動検査: main push後のproduction smokeが正規ドメイン上のV9 CSS、ナビ、最新情報、検索API版を検査する。`tests/process-guard-v9.test.mjs`がこの完了条件の削除を防止する。
- 本番証拠（2026-08-23 20:08 JST）: 正規ドメインのHTMLは`20260819-pcfix1`系assetを返し、V9の`gallery-v8.css?v=20260822-9`を含んでいなかった。したがって、この時点ではV9を本番反映済みと扱わない。正規ドメインと対象main SHAの一致が取れた時点で更新する。

### QL-006 テスト合格を実画面の確認と混同する

- 症状: 静的テストでは合格しても、実端末のキャッシュ、読込順、画像比率、固定ナビで崩れる余地が残った。
- 根本原因: 文字列・単体テストの成功条件に、実ブラウザの寸法・重なり・操作フローが含まれていなかった。
- 恒久対策: 390pxと1440pxで列数、横overflow、overlay重なり、検索直後の配置、画像検索modal、最新情報の自動回転を本番ブラウザで確認する。
- 自動検査: `.github/workflows/dense-latest-production-smoke.yml`で本番Playwright検査と測定結果を保存する。
- 本番証拠: workflow run、対象SHA、生成された測定JSON/スクリーンショットを記録する。

### QL-007 指定済みのUI条件を修正中に変えてしまう

- 症状: 修正の途中で、ユーザーが指定した画像密度、導線、出品元表示、ボタン位置等が別の判断で弱まる危険がある。
- 根本原因: 変更前に固定すべき受入条件を一覧化せず、個別ファイル単位で修正していた。
- 恒久対策: 変更前に受入条件をテストへ落とす。今回の固定条件は、小さい画像、多列表示、価格と出品元の画像内表示、画像検索と最新情報のtaskbar導線、公式画像railの自動回転、レイアウト非崩壊、精度優先検索である。
- 自動検査: V9 layout/search testsおよびGitHub workflowsが上記条件を横断検査する。
- 本番証拠: 正規ドメインのモバイル/PC測定が全条件を満たすことを確認する。

### QL-008 Vercel Function数を少なく数えてproductionを失敗させる

- 症状: GitHub ActionsのV9品質検査は成功したが、Vercel deploymentが作成直後に失敗し、正規URLは旧版のままになった。
- 根本原因: Function予算検査が`.js`だけを数え、`api/search-language.mjs`を数えていなかった。Vercelは`api/`直下の非`_` runtime fileをFunction化するため、V8精度API追加後はHobby上限12に対して実数13だった。
- 恒久対策: 共有moduleを`api/_search-language.mjs`へ移し、精度handlerも`api/_live-search-v8.js`へ統合する。公開URL`/api/live-search-v8`は`/api/search`へのrewriteで維持し、Vercel公式仕様に従って補助moduleのFunction化を防ぐ。予算検査は`.js/.mjs/.cjs/.ts/.mts/.cts`を数え、`_`または`.`始まりと`.d.ts`だけを補助fileとして除外する。
- 自動検査: `scripts/check-vercel-function-budget.mjs`が`api/`を再帰走査してNode/Python/Ruby/Go runtimeを数え、2本のV9 workflowと`tests/process-guard-v9.test.mjs`がFunction数11、上限まで1枠の余裕、両共有moduleの`_`接頭辞、互換rewriteを検査する。
- 本番証拠: 修正後deploymentの成功と正規URLのV9 asset/API/browser検査が必要。成功前は本番反映済みと扱わない。

### QL-009 検証workflow自身のraceと待機条件で偽の失敗を出す

- 症状: V9本番asset/APIは公開済みなのに、browser検査は「カード部品なし」、HTTP smokeは旧asset、検索品質と公開smokeはpush失敗、楽天healthは一時fileなしで失敗した。
- 根本原因: 商品読込前のskeletonも`.product-card`だったためbrowser検査が早く進んだ。別のHTTP検査はproduction aliasのV9 markerを待たなかった。5本の検証workflowが別々の結果fileを同時にmainへpushした。楽天0件時の分岐で後続shellが読む空fileを作らなかった。
- 恒久対策: browserは`data-card-id`を持つ実商品だけを待ち、部品が画像領域内に収まることまで測る。HTTPはV9 markerをpollする。全結果writerを共通concurrency groupで直列化し、共通push scriptでfetch/rebase/retryする。楽天0件時も空URLと`found:false`を正常な検査結果として保存する。
- 自動検査: `tests/process-guard-v9.test.mjs`が実商品selector、overlay境界検査、V9待機、writer直列化、共通push、楽天0件分岐を固定する。
- 本番証拠: 修正workflowをmainで再実行し、390px/1440px browser metricsとHTTP/search checksが成功することを確認する。

### QL-010 同一concurrency groupのpending上限を誤認して検査をcancelする

- 症状: 5本のverification writerを共通groupへ入れたmain実行で、実行中1本とpending 1本以外の3本が`cancelled`になった。
- 根本原因: `cancel-in-progress:false`なら全pendingが順番待ちになると誤認した。GitHub Actionsの既定`queue: single`は同一groupにpendingを1本だけ保持し、新しいpendingが既存pendingを置き換える。
- 恒久対策: GitHub公式仕様の`queue: max`を共通concurrency groupへ明示し、最大100本を直列待機できるようにする。結果pushは引き続きfetch/rebase/retryで保護する。
- 自動検査: `tests/process-guard-v9.test.mjs`が全5 writerに共通group、`cancel-in-progress:false`、`queue: max`、共通push scriptがあることを検査する。
- 本番証拠: mainで5本がcancelされず完了し、各verification結果が順次保存されることを確認する。

### QL-011 曖昧な人物名と重複グッズ語で無関係商品を通す

- 症状: 「Felix ボイスキーホルダー」でStray KidsではないFELIX商品、「OW キリコ ぬい」でOverwatchのコスプレ品や無関係なぬいぐるみが表示された。分割入力では「キーホルダー ホルダー」「ぬいぐるみ ぐるみ」のような重複語も生成し得た。
- 根本原因: Felix・キリコを作品文脈付き人物として定義せず、人物・作品・グッズ種別のどれか一つが一致すれば候補を残していた。加えて長い別名を正規化した後、その正規化結果の中にある短い別名を再置換する連鎖があった。本番品質workflowも旧`/api/live-search`を検査し、表示に使う精度APIと検査対象が一致していなかった。
- 恒久対策: Stray Kids＋Felix、Overwatch＋キリコを文脈必須の複合entityとして定義する。検索先には複合entityと正規グッズ名を組み立てた語を送り、返却商品は作品・人物・グッズ種別をすべて満たす場合だけ採用する。親entityと一般キーホルダーgroupは、より具体的な子groupが一致した場合に除外する。別名置換は長い一致を一度だけmarker化し、重複断片を消してから正規名を一度だけ戻す。
- 自動検査: `tests/search-precision-v9.test.mjs`がFELIX THE CAT、Overwatchコスプレ、無関係ぬいを負例にし、Stray Kids FelixのボイスキーホルダーとOverwatchキリコぬいを正例にする。検索品質workflowは表示と同じ`/api/live-search-v8`、`precisionVersion 2026-08-23.10`、有効検索語、返却全商品の複合文脈を検査する。
- 本番証拠: 正規ドメインで両表記順のFelix検索と両表記のキリコ検索を行い、誤商品0件、`effectiveQuery`、`precisionVersion`を確認する。該当在庫が0件の場合は0件を正しい結果とし、無関係商品で穴埋めしない。

### QL-012 検索中のスケルトンが終了せず結果が返らない

- 症状: モバイルで検索ボタンが「検索中…」のままになり、商品欄もスケルトンカードから変化しなかった。
- 根本原因: 初回`/api/search`を精度APIへ転送した後、複数の検索語variantごとに外部providerを直列実行していた。各providerには5秒の通信期限があったが、variant全体と待機queueには短い上限がなかった。ブラウザの初回検索と追加検索にも終了期限がなく、Functionや外部APIの遅延時にUIが待ち続けた。
- 恒久対策: 初回`/api/search?initial=1`は外部通信を行わず、検証済みsnapshotを同じ精度filterで即時返却する。追加取得は`/api/live-search-v8`へ分離し、正規化済み検索語1回に限定、server側5.5秒・browser側8秒で終了する。初回もbrowser側6秒で中断し、成功・0件・失敗の全経路で`finally`から検索ボタンを復元する。旧asset cacheを避けるため`app.js`と`performance-v3.js`のversionを`20260823-11`へ更新する。
- 自動検査: `tests/layout-v9.test.mjs`が初回/追加URL、AbortController期限、`finally`、server fast mode、asset versionを固定する。`tests/search-precision-v9.test.mjs`が初回snapshotを1秒未満で返し、精度filterを維持することを検査する。本番browser検査は実商品selectorまたは明示的な0件/エラー状態まで待ち、スケルトン残存を失敗にする。
- 本番証拠: 正規ドメインのモバイルで「なると」と代表的な推しグッズ語を検索し、検索ボタンが8秒以内に戻ること、スケルトンが消えること、取得済み商品または0件/直接検索案内が表示されることを確認する。

### QL-013 初回検索の失敗で正常なlive検索まで開始されない

- 症状: 本番APIへ直接「なると」を送ると商品が返る一方、画面では初回検索が遅れた際に商品が表示されず、検索中または0件案内のままになった。さらに本番browser検査が旧画面assetを読んでもV9の共通markerだけで配信準備完了と誤判定した。
- 根本原因: 画面側が初回snapshotの成功後にだけlive検索を開始する直列構成だったため、初回Functionのcold start・timeout・一時失敗がlive検索の開始条件になっていた。検証側もリリース間で変わらないCSS/JS文字列を待機条件にしており、現行HTML・現行`app.js`・APIが同じ版へ切り替わったことを確認していなかった。
- 恒久対策: 初回snapshotとlive検索を並行開始し、どちらが先に返っても既存結果を上書きせず重複排除して統合する。初回失敗時もlive検索を継続し、独立watchdogで検索ボタンとskeletonを必ず解除する。現行HTMLにUI版marker、`app.js`に同じ`SEARCH_UI_VERSION`を置き、production検査は両方の完全一致後にだけ実ブラウザ検査を始める。
- 自動検査: `tests/layout-v9.test.mjs`がlive検索を初回awaitより前に開始すること、統合処理、12秒上限、watchdog、UI版markerを固定する。本番Playwrightは実際の「なると」で検索中表示の解除だけでなく6件以上の商品描画と一般小売ノイズ除外まで確認する。HTTP検査もUI版markerと`app.js`版の一致を待つ。
- 本番証拠: 正規ドメインの390px/1440px実ブラウザで「なると」のlive商品描画、検索ボタン復元、skeleton 0件、UI版`2026-08-23.12`を確認する。workflow成功前は解決済みとしない。

### QL-014 商品カード描画直後にMutationObserverが自己再発火して画面を停止する

- 症状: 本番APIは商品を返し、検索UI版も一致しているのに、実ブラウザでは商品カードへ切り替わる直前のskeletonが残った。Playwrightもページ内JavaScriptへ応答を求める操作から戻らず、ジョブ終了時まで診断DOMを取得できなかった。
- 根本原因: `home-experience-v8.js`が商品grid配下の`childList`・`subtree`・`characterData`を監視し、observer callback内でお気に入り・比較ボタンへ毎回無条件に`textContent`を書き込んでいた。`textContent`更新が新しいmutationを発生させ、そのcallbackがpaint前のmicrotaskで自己再発火し続けたため、API成功後にメインスレッドが描画へ戻れなかった。
- 恒久対策: DOM値は現在値と異なる場合だけ更新するidempotentな関数へ統一する。商品一覧はカードが直接子として置換されるため、observer対象をgrid直下の`childList`だけに限定し、子孫の文字変更を監視しない。HTMLとscriptにhome体験版`2026-08-23.14`を明示して旧script cacheを排除する。
- 自動検査: `tests/layout-v9.test.mjs`がidempotent更新関数、直下だけのobserver、旧`subtree/characterData`設定の不在、home版markerを固定する。2本のquality workflowも同じ不変条件を検査し、本番Playwrightは390px/1440pxで初回カード描画、「なると」のlive商品描画、その後の画像検索と最新情報まで操作する。
- 本番証拠: 正規ドメインでhome版`2026-08-23.14`を確認し、実ブラウザworkflowがDOM診断・モバイル・PCの全工程を終了して成功すること。成功前は解決済みとしない。

### QL-015 workflow内の別Node heredocにある変数を参照してCIを失敗させる

- 症状: V14の単体検査とVercel previewは成功したが、V9 quality workflowのtaskbar検査で`ReferenceError: home is not defined`となった。
- 根本原因: 同じworkflow step内でも複数の`node <<'NODE'`は別プロセス・別scopeである。前のheredocで定義した`home`を後のheredocでも参照できると見誤り、新しいobserver検査だけを後段へ追加した。
- 恒久対策: 各heredocを自己完結させ、使用するファイルと変数はそのブロック内で必ず定義する。検査追加時は対象stepをCIで再実行し、製品テスト成功とworkflow成功を区別する。
- 自動検査: `tests/process-guard-v9.test.mjs`がtaskbar検査ブロック内の`home=fs.readFileSync('home-experience-v8.js'`とobserver検査の両方を固定する。
- 本番証拠: PRのV9 search and layout qualityが再実行で成功すること。成功前はmainへ統合しない。

### QL-016 コンパクト比較ボタンを別scriptが長文ボタンへ再装飾する

- 症状: 検索停止修正後、本番モバイルは30件・3列・overlay境界内・横overflowなしで描画できたが、画像上の丸い比較ボタンの内容が`＋比較に追加`となり、固定幅28pxに長文が入った。
- 根本原因: 商品カード本体とhome補正はコンパクト比較ボタンを記号だけで生成していた一方、後続の`affiliate-widget.js`がすべての`[data-compare]`を大型カード下部ボタンと同じ`icon＋説明文`DOMへ再装飾していた。同じ要素の表示内容を複数scriptが別仕様で所有していた。
- 恒久対策: `gallery-compare`または画像領域内の比較ボタンを明示的にcompact modeと判定し、選択前は`＋`、選択後は`✓`だけをidempotentに設定する。説明は`aria-label`と`title`へ保持し、視覚テキストには追加しない。大型比較ボタンにだけ従来の説明文DOMを使う。asset版`2026-08-23.16`で旧装飾scriptを排除する。
- 自動検査: `tests/layout-v9.test.mjs`と2本のquality workflowがcompact分岐が大型ボタン`innerHTML`より先にreturnすること、記号だけの更新、asset版markerを固定する。本番Playwrightが`compareText==='＋'`、28px以上のtap target、画像領域内配置を390px/1440pxで測る。
- 本番証拠: 正規ドメインでaffiliate UI版`2026-08-23.16`と、モバイル・PC双方の比較ボタン文字・位置・サイズを確認する。workflow成功前は解決済みとしない。

### QL-017 検索語変更後も前回結果を保持し、完了前に新結果と誤認する

- 症状: 「五条悟 アクスタ」の検索後に「なると」を実行すると、検索ボタンとskeletonは先に終了する一方、画面には前回の30商品が残った。production browser検査も`live: loading`の116ms時点で、その30件を「なると」の取得結果と誤認して失敗した。
- 根本原因: `runSearch()`が新しい検索連番と検索語だけを更新し、前回検索の商品集合`state.all`・表示集合`state.shown`・provider状態を初期化していなかった。そのため初回snapshotとlive結果の統合処理へ前回商品まで入り続けた。また検査はボタン復元・skeleton消滅・カード6件以上だけを待っており、そのカードが現在の検索語のlive取得で生成されたか識別できなかった。
- 恒久対策: 検索開始をトランザクション境界として商品集合・表示集合・provider状態を必ず空にする。診断状態は開始時に件数と完了検索語をリセットし、snapshot完了語を`initialQuery`、live完了語を`liveQuery`へ記録する。検索UI版`2026-08-23.17`で旧script cacheを排除する。
- 自動検査: `tests/layout-v9.test.mjs`が検索開始時の3状態初期化、`initialQuery`・`liveQuery`記録、UI版markerを固定する。本番Playwrightは「なると」について`diagnostics.query`と`diagnostics.liveQuery`の両方が一致し、`live==='complete'`になってから商品数・ノイズ除外を判定する。
- 本番証拠: 正規ドメインでUI版`2026-08-23.17`を確認し、390pxと1440pxの各ブラウザで初回検索後の「なると」再検索が16秒以内にlive完了、skeleton 0件、商品6件以上になること。workflow成功前は解決済みとしない。

### QL-018 robotsの修正元と本番配信元が異なり、SEOページ群が発見されにくい

- 症状: ブラウザ検索の`site:oshiruoshi.vercel.app`相当では、サイトマップに21 URLある一方、確認できた検索結果はトップと概要の2 URLだけだった。一般検索語ではOSHIRUが上位に出ず、固定の比較・キャラクターページもほぼ露出していなかった。
- 根本原因: `/robots.txt`を`/api/robots`へrewriteしていたが、リポジトリ直下にも静的`robots.txt`があり、Vercelでは静的fileが先に配信された。そのためAPI側に実装済みの`Sitemap:`行、検索queryのcrawl抑止、Preview全拒否が本番へ一度も出ていなかった。確認工程も`api/robots.js`のsourceだけを見て、本番`/robots.txt`の本文を受入条件にしていなかった。加えてsitemapの`lastmod`が8月21日で固定され、SEO landing pageはHTML生成前に外部販売APIを最大2.6秒待ち、構造化dataもclient JavaScript挿入だけだった。
- 恒久対策: 静的`robots.txt`を削除し、環境判定付き`api/robots.js`を唯一の配信元にする。Productionはcanonical sitemapを通知し、検索queryとAPIをcrawl対象外、Previewは全拒否にする。sitemapは公開URLごとの実更新日を持つ。SEO landing pageは確認済みlocal dataだけで即時生成し、外部販売APIを待たない。WebSite・WebPage・BreadcrumbListを初期HTMLへ直接埋め込み、各テーマ固有の比較確認ポイントを追加する。
- 自動検査: `tests/seo-indexability.test.mjs`が静的shadow file不在、Production/Preview robots、canonical sitemap URLと重複、全landing page対応、固有title/description/h1、server-rendered JSON-LD、外部API待機不在を検査する。`dense-latest-check.yml`と本番browser workflowは正規URLのrobots本文、sitemap URL、SEO版marker、JSON-LDを実取得する。
- 本番証拠: 正規URLで`Sitemap: https://oshiruoshi.vercel.app/sitemap.xml`、21 URL、SEO版`2026-09-05.18`、server-rendered JSON-LDを確認する必要がある。検索エンジン上の件数・順位は再crawl後に確認し、デプロイ直後の増加を保証または確認済みと表現しない。

### QL-019 誤字補正後に補正前の語で再filterし、正解を0件または別作品にする

- 症状: 本番で「五条悟 アクスラ」「フリーレソ グッズ」「星町すいせい アクスタ」は0件、「初音ミク ぬいぐる」は不正な`初音ミク ぐる ぬいぐるみ`へ展開された。「Felix キーホルダー」はFELIX THE CATや別作品を16件返し、「初音ミク ぬい」は同一販売元の同一商品名が上位に重複した。
- 根本原因: 誤字・前方一致補正は内側の`live-search.js`だけで行い、外側の精度handlerは補正前queryからprovider queryと最終`relevant()`を作っていたため、内側で見つけた正解を外側が除外した。known entityはFelixの特定商品例だけに限定され、一般的なグッズ種別では作品文脈を付けなかった。known entityを認識した場合は、`サンリオ`や`6c`等の残余条件を最終filterで確認していなかった。重複排除もURLだけで、同じmarketplaceの同一商品名を残した。
- 恒久対策: 誤字・入力途中・表記揺れの解決を`resolveSearchQuery()`へ一元化し、候補取得前に1回だけ確定した解釈をprovider query、snapshot、関連判定、順位付け、直接検索へ渡す。主要な作品・人物の別名と必須作品文脈をentity registryへ追加し、known entity以外に残ったコラボ・型番語も全件必須にする。同一marketplace＋正規化商品名は1件へ整理し、異なるmarketplace間の比較候補は保持する。UIは解釈後の検索語を明示する。
- 自動検査: `tests/search-precision-v9.test.mjs`がFelix一般グッズ、五条悟＋サンリオの残余条件、誤字、未完入力、人物名表記揺れ、同一marketplace重複を正例・負例で検査する。Production検索品質workflowも同じ複合queryを実APIへ送り、全商品文脈・0件でない基準・重複signature・精度版`2026-09-05.18`を確認する。
- 本番証拠: 正規APIと390px/1440pxの画面で上記queryの`effectiveQuery`、件数、全商品文脈、同一marketplace重複0、補正表示を確認する。PR・CI・Preview成功だけでは解決済みとしない。

### QL-020 静的assetの版だけを待ち、動的SEO経路の切替前に本番検査を始める

- 症状: V18のHTMLと`app.js`は正規URLへ切り替わっていたが、直後の本番browser workflowがHTTP確認で終了し、実ブラウザ工程へ進まなかった。数秒後の同じ`robots.txt`、sitemap、SEOページはすべて正常だった。
- 根本原因: Production準備完了条件が静的HTML・JavaScript・CSSの版だけで、今回変更した動的Function経路を含めていなかった。静的aliasが先に切り替わった直後、robots・sitemap・SEOページを各1回だけ取得して同時切替を前提にした。
- 恒久対策: 静的asset確認後も、正規URLのrobots本文、21件のcanonical sitemap、server-rendered SEO本文が同時に揃うまで独立してpollする。HTTP検査とbrowser検査は同じ共通scriptを使い、動的経路の確認後だけ次へ進む。
- 自動検査: `.github/scripts/verify-production-seo.sh`が3経路をcache-busting付きで反復取得し、URL件数・重複・canonical origin・SEO版・JSON-LDを検査する。`tests/process-guard-v9.test.mjs`が両Production workflowから共通scriptを呼ぶことを固定する。
- 本番証拠: 修正版workflowがHTTP段階を通過し、後続の390px/1440px browser工程まで成功すること。1回の手動curlだけでは工程修正の確認済みとしない。

### QL-021 検索辞書と本番検査で同義語を二重管理し、正解商品を失敗扱いする

- 症状: 「五条悟 アクスラ」は36件の関連商品を順位順に返したが、`アクリルフィギュアメモスタンド`1件だけを本番検索品質workflowが不正商品と判定した。
- 根本原因: 製品側のアクリルスタンドgroupは`アクリルフィギュア`を同義語として保持していた一方、今回追加したworkflowでは`アクスタ|アクリルスタンド|acrylic stand`を別の正規表現へ手書きし、正式な許容語を欠落させた。検査が製品辞書と別の分類定義を持っていた。
- 恒久対策: 本番検査は`api/_search-language.mjs`の`MERCH_GROUPS`を直接importし、グッズ種別の許容同義語を製品と共有する。作品・人物・コラボ条件は独立検査を維持し、全返却商品のscore降順も検査する。
- 自動検査: `search-quality.yml`が`MERCH_GROUPS`由来の`merchGroupOk()`と`rankOrderOk`を使う。`tests/process-guard-v9.test.mjs`が辞書import・アクリルstand group利用・順位検査を固定する。
- 本番証拠: 同じ本番queryで`relevanceOk`、`rankOrderOk`、重複なしが成功し、結果JSONがmainへ記録されること。検査を緩めただけでなく、返却全件の作品・人物条件が維持されていることを確認する。

## リリース前チェックリスト

- [ ] 今回のユーザー指摘を本台帳へ追記した
- [ ] 受入条件を自動テストへ追加した
- [ ] `npm test`が全件成功した
- [ ] 変更したJavaScriptの`node --check`が成功した
- [ ] `git diff --check`が成功した
- [ ] 公式最新情報の一次URL、期間、画像を確認した
- [ ] mainの対象SHAを確認した
- [ ] 正規URL `https://oshiruoshi.vercel.app` のasset/API markerを確認した
- [ ] 390pxと1440pxの本番ブラウザ検査が成功した
- [ ] 未確認事項と残るリスクを明記した

## 今回リリースの検証状態

- 2026-08-23: 回帰テスト23件成功（Function予算、互換rewrite、production検証processを固定）。
- 2026-08-23: 変更対象JavaScriptの構文確認と`git diff --check`成功。
- 2026-08-23: 掲載中の4件を公式一次ページで再確認。hololive商品は期間内だが全品SOLD OUTのため表示を訂正。
- 2026-08-23 20:08 JST: 正規本番URLは旧assetのまま。V9の本番反映と実ブラウザ検査は未完了。
- 2026-08-23 20:32 JST: 失敗原因をFunction実数13（Hobby上限12）と特定。CIの`.mjs`数え漏れを修正し、互換URLを維持したまま実数11へ削減。
- 2026-08-23 20:57 JST: Vercel本番deploymentと正規URLのV9 asset/APIを確認。browser検査のskeleton誤判定とverification push raceを特定し、再検証用の恒久対策を追加。
- 2026-08-23: Felix／キリコの本番誤検索と別名の連鎖置換を特定。複合文脈必須filter、正規provider query、誤商品回帰testをV10候補へ追加。本番反映前のため、この時点では精度改善を確認済みとしない。
- 2026-08-23 21:19 JST: モバイル本番で検索中表示とスケルトンが終了しない症状を確認。初回snapshot即時応答、live取得期限、UI終了保証をV11候補へ追加。本番反映前のため、この時点では解決済みとしない。
- 2026-08-23: 初回成功後にだけlive検索を始める直列依存と、release固有でないproduction待機markerを追加原因として特定。並行検索・結果統合・独立watchdog・UI版`2026-08-23.12`・「なると」実商品描画検査をV12候補へ追加。本番browser検査成功前のため、この時点では解決済みとしない。
- 2026-08-23: API成功後もPlaywrightがDOMへ応答できない本番証拠から、カード補正observerの無条件`textContent`更新によるmicrotask自己再発火を特定。idempotent更新・grid直下だけの監視・home版`2026-08-23.14`をV14候補へ追加。本番browser検査成功前のため、この時点では解決済みとしない。
- 2026-08-23: V14 PRのquality検査で、別Node heredocの変数を参照するscope漏れを確認。各検査ブロックを自己完結させ、QL-015として再発防止条件へ追加。
- 2026-08-23: V14本番browserで検索結果30件・モバイル3列・overflowなしを確認後、旧affiliate装飾がコンパクト比較ボタンへ長文を再挿入する競合を検出。compact modeの表示所有を記号だけに固定し、V16候補へ追加。
- 2026-08-23: V16本番browserで初回30件の描画・比較ボタン修正を確認後、「なると」再検索が前回商品30件を保持したまま`live: loading`で誤判定される競合を検出。検索開始時の状態初期化・完了検索語診断・current-query完了待ちをV17候補へ追加。本番browser検査成功前のため、この時点では解決済みとしない。
- 2026-09-05: 外部検索では21 URL中2 URLだけが確認でき、本番`robots.txt`に`Sitemap:`がないことを実測。静的fileが環境判定付きAPIをshadowしていたこと、SEO HTMLが外部販売APIを待っていたことをQL-018として記録し、Production本体の本文検査へ変更。
- 2026-09-05: 本番実queryでFelixの別作品16件、誤字・未完入力の0件、同一商品名重複を再現。補正処理と最終filterのqueryが異なる二重解釈、known entity時の残余条件無視をQL-019として記録し、query解決の一元化と複合条件検査をV18候補へ追加。
- 2026-09-05: V18本番でrobots・21 URL sitemap・SEO版・実queryを確認。初回Production検査が静的／動的経路の切替差で早期終了した問題をQL-020、検索辞書と検査の同義語差で関連商品を失敗扱いした問題をQL-021として記録し、共通pollと辞書共有へ修正。
