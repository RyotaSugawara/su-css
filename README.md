# SuCSS (素のHTMLを使ったCSS)

[![CI](https://github.com/RyotaSugawara/sucss/actions/workflows/ci.yml/badge.svg)](https://github.com/RyotaSugawara/sucss/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/RyotaSugawara/sucss/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/RyotaSugawara/sucss/actions/workflows/deploy-pages.yml)

> クラス名や独自属性を一切書かずに、標準のHTMLタグだけで美しくモダンなデザインとダークモード・アクセシビリティを実現するクラスレスCSSフレームワーク。

**🌐 デモサイト: https://ryotasugawara.github.io/sucss/**

---

## ✨ 特徴

- **Zero Class Names / Zero Custom Attributes**: `class="..."` や独自の `data-*` 属性は一切不要。純粋なセマンティックHTML（`<header>`, `<main>`, `<article>`, `<button>`, `<dialog>` 等）のみでスタイリング。
- **ダークモード標準対応**: OSのカラーテーマ（`prefers-color-scheme`）および `data-theme` 切り替えに自動連動。
- **高アクセシビリティ**: WCAG AA/AAA コントラスト比（4.5:1 / 7:1以上）をクリア、キーボード操作のフォーカスリング（`:focus-visible`）完備、`prefers-reduced-motion` 対応。
- **超軽量 & 依存ゼロ**: 単一のCSSファイル（圧縮時 約3KB）。JavaScriptライブラリやビルド設定は一切不要。
- **インタラクティブ要素のネイティブサポート**: `<dialog>` のモーダル、`<details>`/`<summary>` のアコーディオン、`input[role="switch"]` のトグルスイッチ等に対応。

---

## 🚀 クイックスタート

### 1. CSSファイルの読み込み
`src/lib/sucss.css`（またはCDN / 配布CSS）をHTMLの `<head>` で読み込むだけです：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="sucss.css">
</head>
<body>
  <header>
    <nav>
      <strong>サイトタイトル</strong>
      <a href="#about">概要</a>
    </nav>
  </header>

  <main>
    <article>
      <h1>こんにちは！</h1>
      <p>これはクラス名を一切書かずに作成されたページです。</p>
      <button type="submit">送信する</button>
      <button type="reset">リセット</button>
    </article>
  </main>
</body>
</html>
```

### 2. CDN (jsDelivr) 経由での読み込み

npm 公開後は、ビルド不要でCDNから直接読み込めます（バージョン固定URLを推奨）：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/su-css@1.0.0/dist/sucss.css">
```

### 3. npm経由でのインストール

```bash
npm install su-css
```

```css
@import "su-css/sucss.css";
```

> npm / jsDelivr への公開手順は [PUBLISHING.md](./PUBLISHING.md) を参照してください。

---

## 🛠️ ローカル開発・デモアプリの起動

本リポジトリには SuCSS のショーケース、ライブプレビューエディタ（Playground）、テーマカスタマイザー、a11yコントラストチェッカーを含むデモアプリが含まれています。

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build
```

---

## 📄 ライセンス

[MIT License](LICENSE)
