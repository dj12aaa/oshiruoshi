# OSHIRU 検索プロバイダー設定

確認日: 2026-08-21

この文書は、OSHIRUの横断検索を Yahoo!ショッピング / 楽天市場 / Amazon / メルカリ / Yahoo!フリマ / Yahoo!オークションへ拡張するための設定手順です。

## 実装済み（作業ブランチのみ・未デプロイ）

- Yahoo!ショッピング・楽天市場・X: 既存の公式API検索を継続利用
- Amazon: Amazon Creators API `SearchItems` 対応
- メルカリ / Yahoo!フリマ / Yahoo!オークション: Brave Search API で個別商品URLを発見する補完検索
- Brave未設定時: `OPENAI_API_KEY` があれば既存Web検索をフォールバック
- 検索を `fast` と `discovery` に分離し、公式API側を先に表示してからWeb発見結果を追加
- 入力中に `fast` 検索を短時間プリフェッチし、実検索時の待ち時間を短縮
- Amazon OAuth2トークンを有効期限までサーバー側メモリで再利用
- Brave検索結果は通常プランの条件に合わせ、永続DB保存を行わず短時間の運用キャッシュだけを使用

## 必要なVercel環境変数

### Yahoo!ショッピング

- `YAHOO_CLIENT_ID`

### 楽天市場

- `RAKUTEN_APP_ID`
- `RAKUTEN_ACCESS_KEY`
- `RAKUTEN_AFFILIATE_ID`（アフィリエイトURLを使う場合）
- `RAKUTEN_ICHIBA_ENDPOINT=https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`

### Amazon Creators API

- `AMAZON_CREATORS_CLIENT_ID`
- `AMAZON_CREATORS_CLIENT_SECRET`
- `AMAZON_PARTNER_TAG`
- `AMAZON_MARKETPLACE=www.amazon.co.jp`
- `AMAZON_TOKEN_ENDPOINT=https://api.amazon.co.jp/auth/o2/token`
- `AMAZON_CREATORS_API_ENDPOINT=https://creatorsapi.amazon`

Amazon Creators APIの利用には、Amazonアソシエイトへの正式参加、Creators API利用資格、アプリ作成、認証情報発行が必要です。2026-08-21時点のAmazon公式資料では、Creators API利用要件として直近30日間に10件以上の適格販売が案内されています。

公式資料:
- https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/introduction
- https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/onboarding/register-for-creators-api
- https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/get-started/using-curl
- https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/api-reference/operations/search-items

### Brave Search API

- `BRAVE_SEARCH_API_KEY`

Brave Search APIは通常のWeb Searchプランでは検索結果の永続保存・検索結果DB化が制限されています。OSHIRUの実装では短時間のインメモリキャッシュのみ使用します。将来、検索結果をOSHIRU独自インデックスとして永続保存する場合は、Brave側で明示的なストレージ権限を含む契約が必要です。

公式資料:
- https://api-dashboard.search.brave.com/api-reference/web/search/get
- https://api-dashboard.search.brave.com/documentation/guides/authentication
- https://api-dashboard.search.brave.com/terms-of-service

## 本人操作が必要で自動化できない登録

### Amazon

1. Amazonアソシエイトへログイン/申請
2. 必要な適格販売と審査を満たす
3. Associates Central > Tools > Creators API
4. Create Application
5. Add New Credential
6. Credential ID / Secret / Partner Tag を安全に保管

アカウント本人のログイン、規約同意、審査、販売実績は第三者が代行して自動完了できません。

### Brave Search API

1. Brave Search API Dashboardへログイン
2. Searchプランを選択
3. 規約同意・本人の支払方法確認
4. API Keysからキーを発行

Braveは無料クレジットがある場合でも不正利用防止のためカード確認を要求する場合があります。規約同意・支払方法登録は本人操作が必要です。

### 楽天

楽天側のApp ID / Access Keyが未発行または無効な場合は、楽天Web Serviceの本人アカウントでアプリ登録・キー確認が必要です。OSHIRU側では2026-07-01版APIに対応する設定を使用します。

公式資料:
- https://webservice.rakuten.co.jp/documentation/ichiba-item-search

## デプロイ前の必須確認

- Vercel Productionに必要な環境変数が設定されている
- 秘密鍵がGitHubやクライアントJSへ含まれていない
- `/api/status` でAmazon/Brave/Rakuten/Yahooの設定状態を確認
- `phase=fast` でYahoo/Rakuten/Amazonが独立して失敗しても全体検索を止めない
- `phase=discovery` でメルカリ/Yahoo!フリマ/Yahoo!オークションのURL形式を厳格検証
- 検索結果ページ・カテゴリページを商品カードとして採用しない
- Brave検索結果を永続DB保存しない（ストレージ権限取得前）
- Amazonを有効化する場合はAmazonアソシエイトの表示義務を免責/広告表示へ反映
- スマホ/PCで検索、絞り込み、比較、お気に入り、予測検索を回帰確認

## 現在の作業ブランチ

`work/search-providers-no-deploy`

このブランチではVercelビルドを明示的にスキップする設定を入れており、Productionへは反映していません。
