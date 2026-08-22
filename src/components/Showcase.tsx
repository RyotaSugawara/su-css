import React, { useState, useRef } from 'react';
import { Type, LayoutGrid, CheckSquare, Table, HelpCircle, Layers, Code, Sparkles } from 'lucide-react';

interface ShowcaseProps {
  theme: 'auto' | 'light' | 'dark';
}

export const Showcase: React.FC<ShowcaseProps> = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const dialogRef = useRef<HTMLDialogElement>(null);

  const categories = [
    { id: 'all', label: 'すべて表示', icon: Layers },
    { id: 'typography', label: 'タイポグラフィ', icon: Type },
    { id: 'buttons', label: 'ボタン & リンク', icon: Code },
    { id: 'forms', label: 'フォーム & 入力', icon: CheckSquare },
    { id: 'containers', label: 'レイアウト & カード', icon: LayoutGrid },
    { id: 'tables', label: 'テーブル & データ', icon: Table },
    { id: 'interactive', label: 'ダイアログ & アコーディオン', icon: HelpCircle },
  ];

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: 0 }}>
      {/* Category selector pill bar */}
      <nav data-tabs style={{ marginBottom: '0.5rem' }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              data-secondary={!isActive ? 'true' : undefined}
              aria-current={isActive ? 'page' : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Banner message reminding zero classes */}
      <aside style={{ margin: 0 }}>
        <div data-flex>
          <Sparkles size={24} />
          <div>
            <strong data-flex style={{ gap: '0.35rem', margin: 0 }}>
              クラス名の指定は一切ありません
            </strong>
            <small>
              以下の要素はすべて<code>class</code>属性を一切使用せず、標準のHTMLタグ（<code>&lt;h1&gt;</code>, <code>&lt;button&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;input&gt;</code>, <code>&lt;table&gt;</code> 等）をそのまま書いてレンダリングしています。
            </small>
          </div>
        </div>
      </aside>

      {/* 1. TYPOGRAPHY */}
      {(activeCategory === 'all' || activeCategory === 'typography') && (
        <section style={{ margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <Type size={20} /> 1. タイポグラフィ & インライン要素
          </h2>
          <small style={{ display: 'block', marginBottom: '1rem' }}>
            見出し、本文、引用、マーカー、コードブロック、キーボード要素
          </small>

          <div>
            <h1>見出し 1 (h1) - 見やすい大見出し</h1>
            <h2>見出し 2 (h2) - 下線付きのセクション見出し</h2>
            <h3>見出し 3 (h3) - サブセクション見出し</h3>
            <h4>見出し 4 (h4) - カードの見出し等</h4>
            <h5>見出し 5 (h5) - 補足的な見出し</h5>
            <h6>見出し 6 (h6) - キャプション・ラベル見出し</h6>
          </div>

          <div>
            <p>
              これは段落テキスト（<code>p</code>タグ）です。適切な行間と文字間隔が設定されており、長文でも快適に読み進めることができます。
              文中では<strong>太字（strong）</strong>や<em>斜体（em）</em>、<mark>重要ハイライト（mark）</mark>、そして<small>補足の小さいテキスト（small）</small>を混在させることができます。
            </p>
            <p>
              ウェブサイトのテーマ切り替えは <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> キーで行えます。
            </p>
          </div>

          <blockquote>
            <p>「クラス名の命名規則に悩まされる時代は終わりました。素のHTMLによるセマンティックな構造こそが真のメンテナンス性を生みます。」</p>
            <cite>— SuCSS 開発ドキュメントより</cite>
          </blockquote>

          <div>
            <p>インラインコード: <code>const theme = useTheme();</code></p>
            <p>マルチラインコードブロック（<code>pre &gt; code</code>）:</p>
            <pre><code>{`// Pure CSS Variables Configuration
:root {
  --color-primary: #3b82f6;
  --radius: 0.5rem;
  --max-width: 800px;
}`}</code></pre>
          </div>

          <hr />

          <div>
            <h3>リスト構造</h3>
            <ul>
              <li>順不同リストアイテム 1</li>
              <li>順不同リストアイテム 2
                <ul>
                  <li>ネストされた階層 A</li>
                  <li>ネストされた階層 B</li>
                </ul>
              </li>
              <li>順不同リストアイテム 3</li>
            </ul>

            <ol>
              <li>ステップ 1: CSSファイルを読み込み</li>
              <li>ステップ 2: クラス名なしでHTMLを記述</li>
              <li>ステップ 3: 美しいWebサイトが完成！</li>
            </ol>

            <dl>
              <dt>クラスレスCSS (Classless CSS)</dt>
              <dd>HTML要素の標準タグに対してのみスタイルを適用するCSSフレームワークの手法。</dd>
              <dt>CSS Custom Properties</dt>
              <dd>変数を利用して動的にカラーやサイズを一括テーマ変更できる仕様。</dd>
            </dl>
          </div>
        </section>
      )}

      {/* 2. BUTTONS & LINKS */}
      {(activeCategory === 'all' || activeCategory === 'buttons') && (
        <section style={{ margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <Code size={20} /> 2. ボタン & インタラクティブ要素
          </h2>
          <small style={{ display: 'block', marginBottom: '1rem' }}>
            標準ボタン、サブセカンダリボタン、非活性状態、リンクスタイル
          </small>

          <div data-flex style={{ marginBottom: '1rem' }}>
            <button type="button">プライマリボタン</button>
            <button type="reset">セカンダリボタン (type="reset")</button>
            <button type="button" data-secondary="true">サブボタン (data-secondary)</button>
            <button type="button" disabled>無効化ボタン</button>
          </div>

          <div data-flex>
            <a href="#link-demo">標準のハイパーリンク</a>
            <a href="https://example.com" target="_blank" rel="noreferrer">
              外部サイトへのリンク ↗
            </a>
          </div>
        </section>
      )}

      {/* 3. FORMS & INPUTS */}
      {(activeCategory === 'all' || activeCategory === 'forms') && (
        <section style={{ margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <CheckSquare size={20} /> 3. フォーム & 入力コントロール
          </h2>
          <small style={{ display: 'block', marginBottom: '1rem' }}>
            フィールドセット、テキスト入力、選択メニュー、スイッチ、プログレス
          </small>

          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend>基本プロフィールフォーム</legend>

              <label>
                フルネーム
                <input type="text" placeholder="例: ヤマダ タロウ" defaultValue="山田 太郎" />
              </label>

              <label>
                メールアドレス
                <input type="email" placeholder="email@example.com" defaultValue="taro@example.com" />
              </label>

              <label>
                生年月日
                <input type="date" defaultValue="2000-01-15" />
              </label>

              <label>
                ロール / 職種を選択
                <select defaultValue="frontend">
                  <option value="frontend">フロントエンドエンジニア</option>
                  <option value="backend">バックエンドエンジニア</option>
                  <option value="designer">UI/UXデザイナー</option>
                  <option value="pm">プロダクトマネージャー</option>
                </select>
              </label>

              <label>
                備考・メッセージ
                <textarea placeholder="自由にご入力ください..." defaultValue="クラスレスCSSの検証中です。シンプルで使いやすいです。"></textarea>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>
                  <input type="checkbox" defaultChecked />
                  利用規約およびプライバシーポリシーに同意する
                </label>

                <label>
                  <input type="checkbox" role="switch" defaultChecked />
                  ダークモード自動連動スイッチ (role="switch")
                </label>
              </div>

              <div>
                <label style={{ fontWeight: 600, marginBottom: '0.35rem' }}>契約プランの選択（ラジオボタン）</label>
                <div data-flex>
                  <label>
                    <input type="radio" name="plan" value="free" />
                    フリープラン
                  </label>
                  <label>
                    <input type="radio" name="plan" value="pro" defaultChecked />
                    プロプラン
                  </label>
                  <label>
                    <input type="radio" name="plan" value="biz" />
                    ビジネスプラン
                  </label>
                </div>
              </div>

              <label>
                ボリューム調整スライダー
                <input type="range" min="0" max="100" defaultValue="70" />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>
                  進捗状況 (progress)
                  <progress value="65" max="100"></progress>
                </label>

                <label>
                  ストレージ残量 (meter)
                  <meter min="0" max="100" low={33} high={66} optimum={80} value={45}></meter>
                </label>
              </div>

              <div data-flex style={{ marginTop: '0.5rem' }}>
                <button type="submit">送信する</button>
                <button type="reset">クリア</button>
              </div>
            </fieldset>
          </form>
        </section>
      )}

      {/* 4. LAYOUT & CONTAINERS */}
      {(activeCategory === 'all' || activeCategory === 'containers') && (
        <section style={{ margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <LayoutGrid size={20} /> 4. レイアウト & カード要素
          </h2>
          <small style={{ display: 'block', marginBottom: '1rem' }}>
            <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;section&gt;</code>
          </small>

          {/* Sample Header Nav Bar */}
          <header style={{ marginBottom: '1.25rem' }}>
            <nav>
              <strong>SuApp</strong>
              <div data-flex>
                <a href="#" aria-current="page">ホーム</a>
                <a href="#">機能紹介</a>
                <a href="#">料金</a>
                <a href="#">お問い合わせ</a>
              </div>
            </nav>
          </header>

          {/* Automatic Card Grid via section > article */}
          <section data-grid>
            <article>
              <h3>🚀 超軽量設計</h3>
              <p>圧縮後わずか3KB未満。外部ライブラリやJS依存関係は一切不要で、最速のページロードを実現します。</p>
            </article>

            <article>
              <h3>🌙 自動ダークモード</h3>
              <p>OSのテーマ設定（<code>prefers-color-scheme</code>）を検出し、暗所での見やすさを自動最適化します。</p>
            </article>

            <article>
              <h3>♿ アクセシビリティ標準</h3>
              <p>フォーカスリングや色コントラスト比がWCAG 2.1 AA/AAAに準拠。キーボード操作も完璧に対応。</p>
            </article>
          </section>
        </section>
      )}

      {/* 5. TABLES & DATA */}
      {(activeCategory === 'all' || activeCategory === 'tables') && (
        <section style={{ margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <Table size={20} /> 5. テーブル & データ表示
          </h2>
          <small style={{ display: 'block', marginBottom: '1rem' }}>
            ゼブラ模様、ホバーハイライト、スクロール対応レスポンシブテーブル
          </small>

          <figure>
            <table>
              <thead>
                <tr>
                  <th>プロジェクト名</th>
                  <th>カテゴリ</th>
                  <th>ライセンス</th>
                  <th>スター数</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SuCSS</td>
                  <td>Classless Framework</td>
                  <td>MIT</td>
                  <td>12.4k</td>
                  <td><mark>アクティブ</mark></td>
                </tr>
                <tr>
                  <td>Pico.css</td>
                  <td>Minimal CSS</td>
                  <td>MIT</td>
                  <td>15.2k</td>
                  <td>Stable</td>
                </tr>
                <tr>
                  <td>Water.css</td>
                  <td>Classless CSS</td>
                  <td>MIT</td>
                  <td>7.8k</td>
                  <td>Stable</td>
                </tr>
                <tr>
                  <td>Simple.css</td>
                  <td>Classless Framework</td>
                  <td>MIT</td>
                  <td>4.1k</td>
                  <td>Stable</td>
                </tr>
              </tbody>
            </table>
            <figcaption>主な人気クラスレスCSSライブラリの比較表</figcaption>
          </figure>
        </section>
      )}

      {/* 6. INTERACTIVE (DIALOG & ACCORDION) */}
      {(activeCategory === 'all' || activeCategory === 'interactive') && (
        <section style={{ margin: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <HelpCircle size={20} /> 6. インタラクティブ (Accordion & Dialog Modal)
          </h2>
          <small style={{ display: 'block', marginBottom: '1rem' }}>
            <code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code> アコーディオンおよび <code>&lt;dialog&gt;</code> モーダルダイアログ
          </small>

          <div>
            <details open>
              <summary>SuCSSは商用利用可能ですか？</summary>
              <p>はい。MITライセンスのもとで完全無料でオープンソースとして利用・改変・商用利用が可能です。</p>
            </details>

            <details>
              <summary>フレームワークのカスタマイズ方法は？</summary>
              <p>CSS変数（<code>:root</code> 内の <code>--color-primary</code> や <code>--radius</code> など）を書き換えるだけで、全体のテーマやブランドカラーを一括変更できます。</p>
            </details>
          </div>

          <article style={{ marginTop: '1rem' }}>
            <h4 style={{ marginTop: 0 }}>モーダルダイアログのデモ (&lt;dialog&gt;)</h4>
            <p>
              <small>HTML5標準の<code>&lt;dialog&gt;</code>要素もクラスなしで美しいダイアログとして機能します。</small>
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
            >
              ダイアログモーダルを開く
            </button>

            <dialog ref={dialogRef}>
              <h3>お知らせモーダル</h3>
              <p>標準の<code>&lt;dialog&gt;</code>要素です。背景のぼかし（backdrop-filter）やシャドウが綺麗に適用されています。</p>
              <div data-flex style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => dialogRef.current?.close()}>
                  閉じる
                </button>
              </div>
            </dialog>
          </article>
        </section>
      )}
    </article>
  );
};
