# SuCSS (素のHTMLを使ったCSS)

[![CI](https://github.com/RyotaSugawara/su-css/actions/workflows/ci.yml/badge.svg)](https://github.com/RyotaSugawara/su-css/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/RyotaSugawara/su-css/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/RyotaSugawara/su-css/actions/workflows/deploy-pages.yml)

> クラス名や独自属性を一切書かずに、標準のHTMLタグだけでGlassmorphism 2.0(フロストガラス調)のモダンなデザインとダークモード・アクセシビリティを実現するクラスレスCSSフレームワーク。

**🌐 デモサイト: https://ryotasugawara.github.io/su-css/**

---

## ✨ 特徴

- **Zero Class Names / Zero Custom Attributes**: `class="..."` や独自の `data-*` 属性は一切不要。純粋なセマンティックHTML（`<header>`, `<main>`, `<article>`, `<button>`, `<dialog>` 等）のみでスタイリング。
- **ダークモード標準対応**: OSのカラーテーマ（`prefers-color-scheme`）および `data-theme` 切り替えに自動連動。
- **高アクセシビリティ**: WCAG AA/AAA コントラスト比（4.5:1 / 7:1以上）をクリア、キーボード操作のフォーカスリング（`:focus-visible`）完備、`prefers-reduced-motion` 対応。
- **超軽量 & 依存ゼロ**: 単一のCSSファイル（圧縮時 5KB未満）。JavaScriptライブラリやビルド設定は一切不要。
- **インタラクティブ要素のネイティブサポート**: `<dialog>` のモーダル、`<details>`/`<summary>` のアコーディオン、`input[role="switch"]` のトグルスイッチ等に対応。

---

## 📦 インストール

npm パッケージ [`@ryo9ra/su-css`](https://www.npmjs.com/package/@ryo9ra/su-css) として配布しています。中身はCSS 1ファイルのみで、依存パッケージはありません。

```bash
npm install @ryo9ra/su-css
```

| インポート指定子 | 実ファイル | 内容 |
| --- | --- | --- |
| `@ryo9ra/su-css` / `@ryo9ra/su-css/sucss.css` | `dist-lib/sucss.css` | 整形済み・コメント付き（約 29KB / gzip 約 6KB） |
| `@ryo9ra/su-css/sucss.min.css` | `dist-lib/sucss.min.css` | 圧縮版（約 22KB / gzip 約 4.3KB） |

### バンドラ（Vite / webpack / Next.js など）から使う

```js
import '@ryo9ra/su-css';                 // = @ryo9ra/su-css/sucss.css
import '@ryo9ra/su-css/sucss.min.css';   // 圧縮版を使う場合
```

### `<link>` で使う

```html
<link rel="stylesheet" href="/node_modules/@ryo9ra/su-css/dist-lib/sucss.min.css">
```

### CDN で使う（インストール不要）

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ryo9ra/su-css/dist-lib/sucss.min.css">
<!-- バージョン固定を推奨 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ryo9ra/su-css@2/dist-lib/sucss.min.css">
```

---

## 🚀 クイックスタート

### 1. CSSファイルの読み込み
上記のいずれかの方法で読み込んだCSSを、HTMLの `<head>` に指定するだけです：

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

### 品質チェック

```bash
# TypeScript型チェック + CSSリント (Stylelint)
npm run lint

# CSSリントのみ (--fixで自動修正)
npm run lint:css
npm run lint:css:fix

# テスト実行 (colorUtilsの単体テスト、sucss.cssのコントラスト比・構造テスト)
npm run test
npm run test:watch
```

### npmパッケージのビルド

```bash
# dist-lib/sucss.css と dist-lib/sucss.min.css を生成
npm run build:lib

# 公開されるtarballの中身を確認（実際には公開しない）
npm run release:dry-run
```

リリース手順は [docs/RELEASING.md](docs/RELEASING.md) を参照してください。

`tests/css/contrast.test.ts` は `src/lib/sucss.css` のCSSカスタムプロパティ（トークン）を実際にパースし、ライト/ダークの各テーマでWCAG AA (4.5:1) を満たしているかを検証します。`tests/css/structure.test.ts` は `prefers-reduced-motion` 対応や `:focus-visible` の存在、タッチターゲットサイズなど、README冒頭で謳っているアクセシビリティ要件をCSS構造として検証します。

---

## 📄 ライセンス

[MIT License](LICENSE)
