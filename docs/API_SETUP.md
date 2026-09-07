# OSHIRU API取得・接続手順

APIキー/Client IDの発行は、利用者本人のログイン・規約同意・場合によっては申請や支払いが必要なため、完全自動化しない。発行後のOSHIRUへの接続、テスト、秘密情報管理、再デプロイは自動化対象とする。

## 2026-09-07 時点の対応範囲

| 提供元 | OSHIRUの実装 | 稼働・有効化に必要なこと |
| --- | --- | --- |
| Yahoo!ショッピング | 公式API、60秒キャッシュ、承認済みIDによる広告URL取得 | Client ID。広告化にはValueCommerceの登録・Yahoo提携・自身の広告ID |
| 楽天市場 | 公式API、60秒キャッシュ、affiliateUrl自動利用 | Application ID・Access Keyの認可確認。現行本番の403は未解消 |
| Amazon | 外部検索リンクのみ。Creators API adapterは未接続 | Associatesの利用資格・API登録・認証情報・当サイト用途の条件確認 |
| メルカリ | 過去確認情報＋外部検索。全出品APIは未接続 | 正式な提携・許諾済みデータ。Mercari Shopsの自店舗APIと混同しない |
| Google | 外部Web検索リンクのみ。商品在庫APIとしては不使用 | Custom Search JSON APIは新規顧客受付終了。Google Search ConsoleはSEO計測用で、商品APIではない |
| Yahoo!フリマ・オークション | 過去確認情報＋外部検索 | 一般出品APIの提供権限・契約が必要 |

`/api/status` の `providers[].configured` は環境変数の存在確認であり、認証成功ではない。`connection: not-checked` / `healthChecked: false`を返し、実際の成功・失敗は当該検索の `providers` で判定する。公開診断にキーやIDの値を返さない。サイトの「取得元の内訳・連携状況」からも区別して確認できる。

アフィリエイトは検索条件・一致度・順位を変更しない。商品ID/正規URLで重複を除き、同一リダイレクト先の異なる広告商品が1件へ潰れないようにする。各商品にはAPI確認日または過去確認日を表示し、キャッシュを返す際に商品確認時刻を現在へ書き換えない。新規アカウント登録・審査申請・決済・秘密鍵発行は未実施。

公式資料（2026-09-07確認）:

- Yahoo v3: https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html
- Yahoo広告IDの生成・商品URL変換: https://developer.yahoo.co.jp/webapi/shopping/affiliate.html
- 楽天商品検索: https://webservice.rakuten.co.jp/documentation/ichiba-item-search
- Amazon利用前提・Creators API: https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/introduction
- Google新規受付終了: https://developers.google.com/custom-search/v1/overview
- Mercari Shopsの自店舗API: https://api.mercari-shops.com/docs/index.html

## 1. Yahoo!ショッピング 商品検索API — 実装済み / 優先度: 高

用途:
- 新品・店舗商品の検索
- 商品名
- 価格
- 在庫情報
- 商品URL
- APIが返す商品画像URL
- ストア名
- 新品/中古区分
- 送料条件

OSHIRU側は `YAHOO_CLIENT_ID` を読み、Yahoo!ショッピング商品検索API v3へサーバー側から接続する。Client Secretは商品検索API v3では使用しない。

現在の実装:
- `query` に検索語を渡す
- `results=30`
- `image_size=300`
- `in_stock=true`
- YahooレスポンスをOSHIRUの商品カード形式へ正規化
- 送料無料だけ送料0円として確定し、条件付き送料無料/不明は0円扱いしない
- 60秒の短期キャッシュ
- 同一実行環境でYahooへの連続リクエスト間隔を約1秒以上に制御
- 外部APIを5秒でタイムアウト
- 最大レスポンスサイズを制限
- Yahoo障害時もOSHIRU全体の検索を止めず、他の検索結果を表示
- Client IDをブラウザへ返さない

必要なVercel設定:
- Environment Variable名: `YAHOO_CLIENT_ID`
- 値: Yahoo!デベロッパーネットワークで発行したClient ID
- Client Secretは登録不要
- `YAHOO_AFFILIATE_ID`（任意）: 自身が承認されたValueCommerceの `http(s)://ck.jp.ap.valuecommerce.com/servlet/referral?sid=自身の数値&pid=自身の数値&vc_url=`。生URLまたは1回URLエンコードした値を受け付ける。数字だけのID・他社URL・不正な形式は広告化せず、通常検索を継続する。未設定でも検索は動く。

設定後の確認:
1. `/api/status` で `yahooShopping: true`（設定あり。接続成功ではない）
2. `/api/live-search?q=五条悟%20アクスタ` を実行
3. `items` に `source: "Yahoo!ショッピング"` が含まれることを確認
4. 画面の横断検索結果へYahoo!ショッピング商品が追加されることを確認
5. 広告ID設定時は公式レスポンスのURLがValueCommerceになり、`affiliate: true`になることを確認する。実クリックによる自己成果確認は行わない。成果計測の認可・結果は事業者の管理画面で別途確認する。

## 2. 楽天市場 商品検索API — 実装済み / 優先度: 高

用途:
- 楽天市場の新品・店舗商品の検索
- 商品名/キャッチコピー
- 価格
- 在庫
- 送料込み判定
- 商品URL
- 店舗名
- 商品画像
- レビュー件数/平均
- Affiliate ID設定時のアフィリエイトURL

現在の実装:
- Rakuten Ichiba Item Search API `20260701` を使用
- `applicationId` と `accessKey` をサーバー側から送信
- `affiliateId` は設定されている場合のみ送信
- `hits=30`
- `format=json`
- `formatVersion=2`
- `availability=1`
- API結果をOSHIRUの商品カード形式へ正規化
- `affiliateUrl` が返る場合は商品リンクとして優先
- `itemUrl` は正規URLとして保持
- `postageFlag=0` の場合のみ送料0円として扱う
- 60秒の短期キャッシュ
- 同一実行環境で楽天への連続リクエスト間隔を約1秒以上に制御
- 外部APIを5秒でタイムアウト
- 最大レスポンスサイズを制限
- 楽天API障害時も他の販売元の検索結果を表示
- Application ID / Access Key / Affiliate IDをブラウザへ返さない
- Rakuten Web Serviceの必須クレジットを画面フッターへ表示

必要なVercel設定:
- `RAKUTEN_APP_ID`
- `RAKUTEN_ACCESS_KEY`
- `RAKUTEN_AFFILIATE_ID`（アフィリエイトURLを利用する場合）
- `RAKUTEN_ICHIBA_ENDPOINT=https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`

設定後の確認:
1. `/api/status` で `rakuten: true`（設定あり。接続成功ではない）
2. Affiliate IDも設定した場合は `rakutenAffiliate: true`
3. `/api/live-search?q=五条悟%20アクスタ` を実行
4. `items` に `source: "楽天市場"` が含まれることを確認
5. Affiliate ID設定時は楽天商品リンクがアフィリエイトURLになっていることを確認

## 3. AniList — 優先度: 中

用途:
- 商品価格/在庫ではなく、作品名・キャラクター名の検索補助
- キーワード補正

秘密鍵なしで利用できるため、OSHIRUの検索候補に使用可能。ただし商品データ源として扱わない。

負荷対策:
- 2文字未満では呼ばない
- ブラウザ側debounce
- サーバー/CDNキャッシュ
- API失敗時は候補表示だけを諦め、商品検索本体は止めない

## 4. 画像検索 / OpenAI API — 優先度: 中

用途:
- スクリーンショットから文字/キャラクター候補/作品候補/グッズ種別を抽出
- その結果を通常検索へ渡す

これは「Google LensのようなWeb全体の完全逆画像検索」とは異なる。

ユーザー作業:
1. OpenAI PlatformでAPI利用設定
2. APIキーを作成
3. 必要に応じてBillingを設定
4. Vercelへ `OPENAI_API_KEY` を登録

OSHIRUではAPIキーをブラウザへ送らず、`/api/vision-search`からサーバー側で呼び出す。

テスト方針:
- 20〜50枚のテスト画像を準備
- 正解ラベル（作品/キャラ/グッズ種別）を人間が付与
- 候補抽出精度を測る
- 低信頼度は複数候補を返す
- AI結果を確定情報として扱わない

## 5. X API — 優先度: 低

X APIは従量課金前提のため、無料MVPの標準取得元にはしない。
交換/譲渡投稿検索に明確な需要が確認できてから接続を判断する。

## 6. メルカリ / Yahoo!フリマ / Yahoo!オークション

一般公開βでは「非公式スクレイピングありき」の設計にしない。

優先順位:
1. 公式API/正式な提携/許諾済みフィード
2. 利用条件を確認したアフィリエイト提供データ
3. OSHIRU内の確認済みスナップショット
4. 販売元の検索ページ/個別ページへのディープリンク

取得方法が不明確なときは、画像や商品本文をOSHIRUに複製せずリンクで補う。

## APIは必須か

### APIなしでも可能
- OSHIRUの検索UI
- お気に入り
- 保存検索
- 比較UI
- 販売サイトへの検索リンク
- 手動/許諾済みの確認データ
- SEO用ガイド/作品ページ

### APIがほぼ必要
- 最新価格を継続的に大量取得
- 最新在庫
- 多数の商品画像を安定表示
- 自動更新
- 大規模な新着通知

したがって「サイトそのもの」はAPIなしでも作れるが、「最新の横断商品データサービス」にするほど公式/許諾済みAPIやデータ契約の重要性が上がる。

## API取得後にこちらで自動化できるもの
- API adapter実装
- データ正規化
- タイムアウト
- キャッシュ
- レート制限
- 重複排除
- エラー時のフォールバック
- 自動テスト
- Previewデプロイ検証
- 本番リリース判定

秘密鍵をGitHubへコミットしない。Client IDも可能な限りVercel Environment Variablesで管理する。
