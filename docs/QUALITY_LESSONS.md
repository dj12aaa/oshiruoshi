# OSHIRU 品質記録・再発防止台帳

最終更新: 2026-08-23

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
