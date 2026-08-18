# OSHIRU API取得・接続手順

APIキー/Client IDの発行は、利用者本人のログイン・規約同意・場合によっては申請や支払いが必要なため、完全自動化しない。発行後のOSHIRUへの接続、テスト、秘密情報管理、再デプロイは自動化対象とする。

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

設定後の確認:
1. `/api/status` で `yahooShopping: true`
2. `/api/live-search?q=五条悟%20アクスタ` を実行
3. `items` に `source: "Yahoo!ショッピング"` が含まれることを確認
4. 画面の横断検索結果へYahoo!ショッピング商品が追加されることを確認

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
1. `/api/status` で `rakuten: true`
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
