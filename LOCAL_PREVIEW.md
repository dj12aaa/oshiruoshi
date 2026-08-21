# OSHIRU ローカル全画面プレビュー

本番 `main` を変更せず、OSHIRU の主要画面・検索結果・画像検索導線・5販売サイト表示をローカルで確認するためのブランチです。

## 起動

```bash
git clone https://github.com/dj12aaa/oshiruoshi.git
cd oshiruoshi
git switch local-preview-all-visible-20260822
npm run local
```

ブラウザで以下を開きます。

- `http://127.0.0.1:4173/` — ホーム。自動でサンプル検索を表示
- `http://127.0.0.1:4173/__local` — 全画面一覧
- `http://127.0.0.1:4173/latest-goods` — 最新グッズ

## ローカル既定モード

外部APIキーなしでもUI全体を確認できるよう、以下をローカルモックで返します。

- Yahoo!ショッピング
- 楽天市場
- メルカリ / Yahoo!フリマ / Yahoo!オークションの確認用データ
- 画像検索ステータス
- 商品画像プロキシ用のローカルSVG
- 検索候補
- APIプロバイダ状態

画面下部には `LOCAL PREVIEW` パネルが追加され、主要ページを直接切り替えられます。

## 実APIで確認

`.env.local` に必要な環境変数を設定してから次を実行します。

```bash
npm run local:real
```

このモードでは既存の `api/*.js` ハンドラをローカルから呼び出します。

## 本番への影響

この機能は `local-preview-all-visible-20260822` ブランチ専用です。`main` にはローカル確認用パネルやモックAPIを入れていません。
