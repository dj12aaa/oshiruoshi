# OSHIRU 公開前β → 一般公開チェックリスト

## 目的
OSHIRUの既存UIを崩さず、検索・比較サービスとして安全に一般公開できる状態へ移行するための運用基準。

## 現在の公開前β
- Vercel PreviewはVercel Authenticationで保護する。
- `index.html` は `noindex,nofollow`。
- `vercel.json` は `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`。
- `api/robots.js` は `PUBLIC_SITE_INDEXABLE=true` になるまで全クロールを拒否する。
- sitemapは公開許可前は404相当で空のURL setを返す。
- Git自動Previewは通常 `deploymentEnabled:false`。確認版を作るときだけ一時的に有効化して再度停止する。

## SEO設計
SEOは検索エンジン向けの文字詰め込みではなく、ユーザーが目的の商品・比較情報へ短く到達できることを優先する。

### 技術基盤
- ページごとに固有のtitle / description / h1を持つ。
- 公開URLをcanonicalとして固定する。
- robots.txt / sitemap.xml / noindexを意図的に切り替える。
- APIの検索結果ページを無制限にインデックスさせない。
- 静的に意味が伝わるサービス説明をトップページに置く。
- モバイルで主要操作と商品情報が読み取れることを確認する。
- Core Web Vitalsを悪化させる動画・巨大ライブラリを導入しない。カットインはCSS transform/opacityのみで実装する。

### 一般公開後の無料確認
1. Google Search Consoleに所有権を登録。
2. `robots.txt` と `sitemap.xml` を確認。
3. URL検査でトップ、概要、プライバシー等がクロール可能か確認。
4. 検索パフォーマンスで表示回数、クリック、CTR、掲載順位、検索語を週次確認。
5. Chrome Lighthouse / PageSpeed InsightsでPerformance・SEO・Accessibilityを確認。
6. 0件検索率、販売元クリック率、再検索率、お気に入り利用率はOSHIRU側のイベント計測導入後に確認する。

## 一般公開時に必ず変更するもの
1. Vercel Productionへ必要な環境変数を登録。
2. `PUBLIC_SITE_URL` を正式URLへ設定。
3. `PUBLIC_SITE_INDEXABLE=true`。
4. `index.html` のrobots metaを `index,follow` へ変更。
5. `vercel.json` の公開前用 `X-Robots-Tag` を削除。
6. Vercel AuthenticationをProductionでは解除し、Preview保護は維持。
7. canonical / OG URLが正式URLと一致することを確認。
8. Search Consoleへsitemapを送信。

## 商品データ・著作権の運用基準
- 公式API・正式提携・許諾済みデータを優先する。
- Yahoo!ショッピング、楽天市場は各公式APIの戻り値として提供される商品情報・画像URLを、各API規約の範囲で表示する。
- 出所・利用条件を確認できない画像をOSHIRUサーバーへ複製保存しない。
- 任意URLを取得する画像プロキシは無効のまま維持する。
- メルカリ、Yahoo!フリマ、Yahoo!オークションは非公式スクレイピングを公開版の前提にしない。確認済みスナップショットまたは販売元への検索・商品リンクで補完する。
- 作品名、キャラクター名、企業名、サービス名、商標の権利は各権利者に帰属する旨を明記する。
- 権利者から削除・修正依頼が来た場合の連絡窓口を公開前に設定する。

## 広告・アフィリエイト
- アフィリエイトURLを使う商品には商品付近に `PR` を表示する。
- サイト全体の免責・広告表示ページでも収益関係を説明する。
- 広告の有無で価格表示や検索順位を恣意的に変えない。
- 新しい広告事業者を入れる前にPrivacy / Disclaimer / Cookie・第三者送信の内容を更新する。

## プライバシー
### 現在
- お気に入り、保存検索はlocalStorage中心。
- アカウントDBへの同期なし。
- 広告目的の第三者Cookieは標準導入しない。

### 将来の会員化
ログイン・端末間同期を導入するときは、ユーザーID、メール、保存商品、保存検索等をDBで扱うため、以下を先に実施する。
- 保存項目と保存期間の定義
- 削除手段
- アクセス制御
- データベースバックアップ方針
- Privacyの更新
- 必要に応じてCookie/第三者送信の同意・拒否導線

## API秘密情報
- APIキー、Access Key、Bearer TokenをGitHubへコミットしない。
- ブラウザJSへ埋め込まない。
- Vercel Environment Variablesで管理する。
- チャット、スクリーンショット、Issue、ログへ秘密値を残さない。
- 漏えいの可能性があるキーは再発行する。

## 画像検索
- `OPENAI_API_KEY` が設定されている環境だけボタンを表示する。
- 画像検索は「画像から作品・キャラ・グッズ種別等の検索語候補を抽出し通常検索へ渡す」機能として扱う。
- Google LensのようなWeb全体の完全な逆画像検索とは区別する。
- 公開前に実グッズ画像20〜50枚で、作品名・キャラクター名・グッズ種別の候補精度を人手で評価する。

## 公開判断KPI
アクセス数だけでサーバー有料化を決めない。以下を毎月確認する。
- Vercel使用量が無料枠に対して継続的に高いか
- API待ち時間やFunction制約がUXを悪化させていないか
- 商用利用・広告・アフィリエイト開始により現在プランの利用条件と合わなくなっていないか
- エラー率やタイムアウトが増えていないか
- 検索利用者と再訪利用者が増えているか

## 独自ドメイン移行
独自ドメインはサーバー性能向上策ではなく、ブランドURL固定、信頼性、将来の移転コスト低減のために使う。

一般公開βで継続運営する方針が決まった時点で取得を検討する。取得後は以下を行う。
- HTTPS確認
- canonical更新
- sitemap更新
- Search Consoleへ新URL登録
- 旧URLから新URLへの恒久リダイレクト
- Yahoo/Rakuten等のAllowed website更新
- Privacy / Terms / security.txt / OG URLの更新

## 公開GO / NO-GO
### GO条件
- Yahoo! / 楽天検索が実商品を返す。
- API失敗時でも検索画面全体が落ちない。
- 主要画面がPC/スマホで崩れない。
- 秘密情報がクライアントへ露出しない。
- 画像・データ取得元の扱いが運用基準に沿う。
- Privacy / Terms / Disclaimer / Contactが閲覧可能。
- noindex解除手順を実施済み。
- Search Console登録準備が完了。

### NO-GO条件
- APIキーがソースに含まれる。
- 出所不明画像を恒久転載している。
- 検索結果の価格・在庫が取得時点情報であることを表示していない。
- アフィリエイトリンクに広告性の表示がない。
- 公開前Previewが意図せず検索インデックス可能。
- 利用者が外部販売元とOSHIRUを誤認しやすい表示になっている。
