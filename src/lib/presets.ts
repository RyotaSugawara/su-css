export interface HtmlPreset {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const HTML_PRESETS: HtmlPreset[] = [
  {
    id: 'article',
    name: 'ブログ記事 / ドキュメント',
    description: '見出し、引用、インラインコード、キーボードショートカット、ハイライトを備えた記事',
    code: `<article>
  <header>
    <h1>クラスレスCSSライブラリのすゝめ</h1>
    <p><small>投稿日: 2026年7月26日 • 著者: Webデザインチーム</small></p>
  </header>

  <p>ウェブの基礎に戻り、<strong>クラス名を1つも書かずに</strong>美しいマークアップを表現するアプローチが注目されています。セマンティックなHTML要素を尊重することで、アクセシビリティと軽量化を同時に達成できます。</p>

  <blockquote>
    <p>「優れたデザインとは、これ以上追加するものがない状態ではなく、これ以上削るものがない状態のことである。」</p>
    <cite>— アントワーヌ・ド・サン＝テグジュペリ</cite>
  </blockquote>

  <h2>主な特徴</h2>
  <ul>
    <li>クラス名が一切不要（完全クラスレス）</li>
    <li><mark>CSS変数のみ</mark>でテーマを自在に制御</li>
    <li>標準でダークモード対応 (<kbd>Shift</kbd> + <kbd>D</kbd>)</li>
    <li>軽量（圧縮後わずか3KB未満）</li>
  </ul>

  <hr />

  <h2>コード例</h2>
  <p>設定ファイルを更新する場合は、<code>config.json</code>に以下を記述してください：</p>

  <pre><code>{
  "name": "sucss",
  "theme": "auto",
  "accessibility": {
    "contrastRatio": "WCAG_AA",
    "focusRing": true
  }
}</code></pre>
</article>`
  },
  {
    id: 'form',
    name: 'お問い合わせ・ユーザー登録フォーム',
    description: '入力フィールド、セレクトボックス、ラジオボタン、スイッチ、スライダー',
    code: `<form onsubmit="event.preventDefault(); alert('フォームが送信されました');">
  <fieldset>
    <legend>アカウント登録</legend>

    <label>
      お名前
      <input type="text" placeholder="山田 太郎" required />
    </label>

    <label>
      メールアドレス
      <input type="email" placeholder="taro@example.com" required />
    </label>

    <label>
      パスワード
      <input type="password" placeholder="8文字以上で入力" required />
    </label>

    <label>
      プラン選択
      <select>
        <option value="free">フリープラン（0円）</option>
        <option value="pro" selected>プロプラン（月額1,200円）</option>
        <option value="enterprise">エンタープライズ</option>
      </select>
    </label>

    <label>
      自己紹介・お問い合わせ内容
      <textarea placeholder="ご自由に記入してください..."></textarea>
    </label>

    <label>
      <input type="checkbox" role="switch" checked />
      新着通知メールを受け取る
    </label>

    <label>
      通知頻度スライダー
      <input type="range" min="1" max="5" value="3" />
    </label>

    <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
      <button type="submit">アカウントを作成する</button>
      <button type="reset">リセット</button>
    </div>
  </fieldset>
</form>`
  },
  {
    id: 'pricing',
    name: '料金プラン比較カード',
    description: 'section内にarticleを配置することで自動グリッドレイアウトを形成',
    code: `<section>
  <article>
    <h3>スターター</h3>
    <p><big><strong>￥0</strong></big> /月</p>
    <p><small>個人プロジェクトや実験用に最適</small></p>
    <hr />
    <ul>
      <li>1 プロジェクト</li>
      <li>基本カスタマイズ</li>
      <li>コミュニティサポート</li>
    </ul>
    <button data-secondary="true" style="width: 100%;">無料ではじめる</button>
  </article>

  <article>
    <header>
      <small><mark>一番人気</mark></small>
      <h3>プロフェッショナル</h3>
    </header>
    <p><big><strong>￥1,980</strong></big> /月</p>
    <p><small>小規模チームや本格的な制作に</small></p>
    <hr />
    <ul>
      <li>無制限プロジェクト</li>
      <li>CSS変数フルカスタマイズ</li>
      <li>優先メールサポート</li>
      <li>ダークモード自動同期</li>
    </ul>
    <button style="width: 100%;">プロにアップグレード</button>
  </article>

  <article>
    <h3>エンタープライズ</h3>
    <p><big><strong>お問い合わせ</strong></big></p>
    <p><small>大規模プロダクトや組織に</small></p>
    <hr />
    <ul>
      <li>専任エンジニアサポート</li>
      <li>SLA 99.9% 保証</li>
      <li>オンプレミス / 専用CDN</li>
    </ul>
    <button data-secondary="true" style="width: 100%;">担当者に相談</button>
  </article>
</section>`
  },
  {
    id: 'interactive',
    name: 'アコーディオン ＆ テーブル',
    description: 'details/summary要素と、ゼブラ柄テーブル＆プログレスバー',
    code: `<section>
  <h2>よくある質問 (FAQ)</h2>

  <details open>
    <summary>クラス名をつけずにどうやって装飾していますか？</summary>
    <p>SuCSSは、<code>&lt;header&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;button&gt;</code>, <code>&lt;table&gt;</code> などのHTML標準タグに対して直接スタイルを適用します。これにより、クラス管理の手間をゼロにします。</p>
  </details>

  <details>
    <summary>既存のプロジェクトに導入できますか？</summary>
    <p>はい。CSSファイル1つを読み込むだけで即座に適用されます。CSS変数（<code>:root</code>）で色や余白を一括調整できます。</p>
  </details>

  <details>
    <summary>アクセシビリティ対応について教えてください。</summary>
    <p>すべてのインタラクティブ要素に高コントラストなフォーカスリング（<code>:focus-visible</code>）を設定し、WCAG 2.1 AA規格以上のコントラスト比を確保しています。</p>
  </details>

  <h2>システムステータス</h2>

  <figure>
    <table>
      <thead>
        <tr>
          <th>サービス</th>
          <th>稼働率</th>
          <th>進捗</th>
          <th>状態</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Web API Server</td>
          <td>99.98%</td>
          <td><progress value="98" max="100"></progress></td>
          <td><mark>正常</mark></td>
        </tr>
        <tr>
          <td>Database Cluster</td>
          <td>99.95%</td>
          <td><progress value="95" max="100"></progress></td>
          <td><mark>正常</mark></td>
        </tr>
        <tr>
          <td>CDN Node - Tokyo</td>
          <td>100.0%</td>
          <td><progress value="100" max="100"></progress></td>
          <td><mark>正常</mark></td>
        </tr>
      </tbody>
    </table>
    <figcaption>※ 過去30日間の平均アップタイム記録</figcaption>
  </figure>
</section>`
  }
];
