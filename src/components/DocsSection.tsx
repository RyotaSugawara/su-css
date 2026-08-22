import React, { useState } from 'react';
import { BookOpen, Copy, Check, FileCode2, Layers } from 'lucide-react';

export const DocsSection: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const snippets = [
    {
      title: '1. HTMLの <head> タグ内に直接読み込む (CDN / 直読み)',
      code: `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>マイウェブサイト</title>
  
  <!-- SuCSS (素のHTMLを使ったCSS) フレームワークを読み込み -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sucss@1.0.0/sucss.min.css" />
</head>`
    },
    {
      title: '2. CSSの @import またはプロジェクトで読み込む',
      code: `/* main.css */
@import "sucss/sucss.css";

/* 必要に応じてCSS変数でブランドカラーを上書き */
:root {
  --hue: 158; /* ブランドグリーン */
  --radius: 0.375rem;
}`
    },
    {
      title: '3. ダークモードの手動切替 (JavaScript)',
      code: `// ライト/ダークモードの切替例
function setTheme(mode) {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme'); // OS設定に連動
  }
}`
    }
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Intro */}
      <section style={{ margin: 0 }}>
        <div data-flex style={{ marginBottom: '0.75rem' }}>
          <BookOpen size={24} />
          <div>
            <h2 style={{ margin: 0, padding: 0, border: 0 }}>SuCSS 導入ガイド & ドキュメント</h2>
            <small>素のHTMLのセマンティクスを最大活用する完全クラスレスCSSの利用手順</small>
          </div>
        </div>
        <p>
          SuCSS（素のHTMLを使ったCSS）は、ユーティリティクラスやCSSモジュールを一切使用せず、純粋なHTML要素（<code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;button&gt;</code>, <code>&lt;input&gt;</code> 等）を書き進めるだけで、自動的に均整の取れたデザインとダークモード、アクセシビリティを提供するCSSライブラリです。
        </p>
      </section>

      {/* Code Snippets */}
      <section style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', items: 'center', gap: '0.5rem' }}>
          <FileCode2 size={20} /> クイックスタート & コード例
        </h3>

        {snippets.map((item, idx) => (
          <article key={idx} style={{ margin: 0 }}>
            <div data-flex style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong>{item.title}</strong>
              <button
                type="button"
                onClick={() => handleCopy(item.code, idx)}
                data-secondary="true"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }}
              >
                {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedIndex === idx ? 'コピー済' : 'コードコピー'}</span>
              </button>
            </div>
            <pre style={{ margin: 0 }}>
              <code>{item.code}</code>
            </pre>
          </article>
        ))}
      </section>

      {/* HTML Semantic Best Practices Rules */}
      <section style={{ margin: 0 }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={20} /> 推奨されるHTMLマークアップ構造ルール
        </h3>

        <dl style={{ margin: 0 }}>
          <dt>1. ページ全体レイアウト: <code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;footer&gt;</code></dt>
          <dd>
            <code>body</code> 直下に <code>header</code>, <code>main</code>, <code>footer</code> を順に配置することで、画面中央寄せと最大幅が自動計算されます。
          </dd>

          <dt>2. 自動グリッドレイアウト: <code>&lt;section&gt;</code> 内の <code>&lt;article&gt;</code></dt>
          <dd>
            <code>&lt;section&gt;</code> 内に複数の <code>&lt;article&gt;</code> を並べると、画面幅に応じたCSS Gridレスポンシブカードとして自動変換されます。
          </dd>

          <dt>3. サブボタン指定: <code>type="reset"</code> または <code>data-secondary="true"</code></dt>
          <dd>
            控えめなボタンデザインにするには、<code>&lt;button data-secondary="true"&gt;</code> 属性を付与するだけで機能します。
          </dd>
        </dl>
      </section>
    </article>
  );
};
