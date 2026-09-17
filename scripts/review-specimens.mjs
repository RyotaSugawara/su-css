/**
 * The cases the review bench renders.
 *
 * Each specimen is a fragment of the plain, class-free HTML the framework is
 * supposed to style, shown on its own so a change can be looked at without the
 * rest of the demo site around it. Add one whenever a feature lands: a case
 * here is what makes the next change to that feature reviewable.
 *
 * id    — stable anchor, used in the page's table of contents
 * title — what the reader sees
 * note  — one line on what to look at, or what tends to break
 * html  — the specimen itself, written exactly as a user would write it
 */
export const specimens = [
  {
    id: 'text',
    title: '文章と見出し',
    note: '素の見出し・段落・リスト・引用。土台が崩れていないかの基準。',
    html: `
<article>
  <h2>見出し 2</h2>
  <p>段落のテキスト。<a href="#">リンク</a>、<strong>強調</strong>、<em>斜体</em>、
  <code>inline code</code> を含む。</p>
  <ul>
    <li>箇条書きの項目</li>
    <li>もうひとつの項目</li>
  </ul>
  <blockquote>
    <p>引用文。左の罫と余白の出かたを見る。</p>
  </blockquote>
</article>`,
  },
  {
    id: 'buttons',
    title: 'ボタン単体',
    note: 'type によって塗りが変わる。submit が主役、reset と button は控えめ。',
    html: `
<button type="submit">送信</button>
<button type="button">ボタン</button>
<button type="reset">リセット</button>
<button type="button" disabled>使えない</button>`,
  },
  {
    id: 'group-cluster',
    title: 'role="group" — コマンドの束',
    note: '横並びで間隔だけが付き、各ボタンは自分のマークアップどおりの見た目を保つ。',
    html: `
<div role="group" aria-label="操作">
  <button type="submit">保存</button>
  <button type="button">複製</button>
  <button type="reset">破棄</button>
</div>`,
  },
  {
    id: 'group-segmented',
    title: 'role="group" + aria-pressed — セグメンテッドコントロール',
    note: '選択を持った途端に地続きの一枚板になる。押された側だけが塗られる。',
    html: `
<div role="group" aria-label="表示">
  <button type="button" aria-pressed="true">日</button>
  <button type="button" aria-pressed="false">週</button>
  <button type="button" aria-pressed="false">月</button>
</div>`,
  },
  {
    id: 'group-current',
    title: 'role="group" + aria-current — リンクの選択',
    note: 'リンクでも同じ。aria-current="page" が現在地。',
    html: `
<div role="group" aria-label="言語">
  <a href="#" aria-current="page">日本語</a>
  <a href="#">English</a>
</div>`,
  },
  {
    id: 'group-fields',
    title: 'role="group" — フィールドの束（巻き込まれないこと）',
    note: 'ラベルや入力欄を含む group は横並びにされない。ここが誤爆しやすい。',
    html: `
<div role="group" aria-label="氏名">
  <label for="sei">姓</label>
  <input id="sei" type="text">
  <label for="mei">名</label>
  <input id="mei" type="text">
</div>`,
  },
  {
    id: 'toolbar',
    title: 'role="toolbar"',
    note: 'コマンドの帯になる。<hr> が区切りとして立ち、submit だけが主役のまま。',
    html: `
<div role="toolbar" aria-label="書式">
  <button type="button" aria-pressed="true">太字</button>
  <button type="button">斜体</button>
  <hr>
  <button type="button">左</button>
  <button type="button">中央</button>
  <hr>
  <button type="submit">適用</button>
</div>`,
  },
  {
    id: 'toolbar-vertical',
    title: 'role="toolbar" aria-orientation="vertical"',
    note: '縦積みになり、区切りも横向きに寝る。',
    html: `
<div role="toolbar" aria-label="ツール" aria-orientation="vertical">
  <button type="button">選択</button>
  <button type="button">ペン</button>
  <hr>
  <button type="button">消しゴム</button>
</div>`,
  },
  {
    id: 'tablist',
    title: 'role="tablist" — タブ',
    note:
      '選択中のタブは aria-pressed と同じ塗りで描かれる。クリックでの切り替えはこの見本だけの短い script の仕事で、' +
      '実際の矢印キー移動と automatic activation(選択がそのまま移動先になる)は @ryo9ra/su-css/behaviors.js が担う — CSS 側はその存在を前提にしていない。',
    html: `
<div role="tablist" aria-label="セクション">
  <button type="button" role="tab" id="specimen-tab-a" aria-selected="true" aria-controls="specimen-panel-a">概要</button>
  <button type="button" role="tab" id="specimen-tab-b" aria-selected="false" aria-controls="specimen-panel-b">詳細</button>
  <button type="button" role="tab" id="specimen-tab-c" aria-selected="false" aria-controls="specimen-panel-c">履歴</button>
</div>
<div id="specimen-panel-a" role="tabpanel" aria-labelledby="specimen-tab-a" tabindex="0">
  <p>概要パネルの中身。</p>
</div>
<div id="specimen-panel-b" role="tabpanel" aria-labelledby="specimen-tab-b" tabindex="0" hidden>
  <p>詳細パネルの中身。</p>
</div>
<div id="specimen-panel-c" role="tabpanel" aria-labelledby="specimen-tab-c" tabindex="0" hidden>
  <p>履歴パネルの中身。</p>
</div>
<script>
  // この見本だけの簡易配線。実際の roving tabindex と automatic activation は behaviors.js の仕事。
  document.querySelectorAll('[role="tab"][aria-controls^="specimen-panel"]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[role="tab"][aria-controls^="specimen-panel"]').forEach((other) => {
        var chosen = other === tab;
        other.setAttribute('aria-selected', String(chosen));
        document.getElementById(other.getAttribute('aria-controls')).hidden = !chosen;
      });
    });
  });
</script>`,
  },
  {
    id: 'focus-ring',
    title: 'フォーカスリング',
    note: 'Tab で辿ると、group / toolbar の中でもリングが他の塗りに負けずに出る。',
    html: `
<p>Tab キーで順に辿ってください。</p>
<div role="group" aria-label="フォーカス確認">
  <button type="button" aria-pressed="true">ひとつめ</button>
  <button type="button" aria-pressed="false">ふたつめ</button>
</div>
<div role="toolbar" aria-label="フォーカス確認">
  <button type="button">みっつめ</button>
  <button type="submit">よっつめ</button>
</div>`,
  },
  {
    id: 'form',
    title: 'フォームと aria-invalid',
    note: 'エラーのフィールドは赤く縁取られ、form 内の role="alert" は細い帯のまま。板にならないこと。',
    html: `
<form>
  <label for="mail">メールアドレス</label>
  <input id="mail" type="email" value="not-an-address" aria-invalid="true" aria-describedby="mail-err">
  <p id="mail-err" role="alert">メールアドレスの形式が正しくありません。</p>

  <label for="plan">プラン</label>
  <select id="plan">
    <option>無料</option>
    <option>有料</option>
  </select>

  <label for="memo">メモ</label>
  <textarea id="memo" rows="2"></textarea>

  <button type="submit">送信</button>
</form>`,
  },
  {
    id: 'messages',
    title: 'role="alert" / role="note" — 単独のメッセージ',
    note: 'フォームの外なら板になる。alert は危険色の帯、note は中立。',
    html: `
<div role="alert">
  <p>保存できませんでした。接続を確認してからもう一度お試しください。</p>
</div>
<div role="note">
  <p>この設定はこのブラウザにのみ保存されます。</p>
</div>`,
  },
  {
    id: 'busy',
    title: 'aria-busy — 処理中',
    note: 'ボタンはラベルの前、領域は角に輪が回る。OS の「視覚効果を減らす」を入れると、回転が止まって輪だけが残るはず。',
    html: `
<button type="submit" aria-busy="true">公開しています</button>
<button type="submit" aria-busy="true" disabled>押せない公開中</button>
<section aria-busy="true" aria-live="polite">
  <h3>最近のデプロイ</h3>
  <p>直近 10 件を取得しています…</p>
</section>`,
  },
  {
    id: 'disclosure',
    title: 'aria-expanded + [popover] — 開閉',
    note:
      'ボタンを押すと popover が開く。開閉自体は JS ゼロ。山形を回転させているのは下の短い script で、aria-expanded を揃えるだけの仕事。CSS はその属性を描くだけで、この script の存在を前提にしていない。' +
      'この見本だけ高さを確保しているのはレビュー台の都合：[popover] は自分のビューポート全体を使って中央寄せになるので、枠が狭いままだと開いたパネルが自分を開いたボタンを覆う。実際のページはもっと縦に長いので起きない。',
    html: `
<div style="min-height:260px">
  <button type="button" popovertarget="specimen-popover" aria-expanded="false">その他のオプション</button>
  <div id="specimen-popover" popover>
    <p>popover の中身。dialog と同じトークンで描いている。</p>
  </div>
</div>
<script>
  // aria-expanded は popovertarget からは自動で揃わない。<details> だけの特権。
  document.querySelector('#specimen-popover').addEventListener('toggle', (event) => {
    document.querySelector('[popovertarget="specimen-popover"]')
      .setAttribute('aria-expanded', String(event.newState === 'open'));
  });
</script>`,
  },
  {
    id: 'disabled',
    title: 'aria-disabled と inert',
    note: '操作できないものが褪せる。inert は中身ごと。',
    html: `
<button type="button" aria-disabled="true">押せない</button>
<a href="#" aria-disabled="true">たどれない</a>
<fieldset inert>
  <legend>受付終了</legend>
  <label for="amt">金額</label>
  <input id="amt" type="number" value="1000">
  <button type="submit">申し込む</button>
</fieldset>`,
  },
  {
    id: 'table',
    title: 'テーブルと aria-sort',
    note: '並び替えの基準列に向きの印が付き、その列だけ少し広い。',
    html: `
<table>
  <caption>売上</caption>
  <thead>
    <tr>
      <th scope="col">商品</th>
      <th scope="col" aria-sort="descending">金額</th>
      <th scope="col">日付</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>あ</td><td>1,200</td><td>09-01</td></tr>
    <tr><td>い</td><td>980</td><td>09-02</td></tr>
  </tbody>
</table>`,
  },
  {
    id: 'landmarks',
    title: 'ランドマークのロール',
    note: 'div にロールを書いても、対応する要素と同じ装飾が付く。',
    html: `
<div role="banner">
  <div role="navigation">
    <strong>サイト名</strong>
    <a href="#" aria-current="page">ホーム</a>
    <a href="#">About</a>
  </div>
</div>
<div role="main">
  <p>main 相当の領域。</p>
</div>
<div role="contentinfo">
  <p>footer 相当の領域。</p>
</div>`,
  },
  {
    id: 'controls',
    title: 'そのほかのネイティブ部品',
    note: 'dialog / details / switch。素のまま動くものが素のまま整っているか。',
    html: `
<input type="checkbox" role="switch" id="sw" checked>
<label for="sw">通知を受け取る</label>
<details>
  <summary>詳細を開く</summary>
  <p>開いた中身。</p>
</details>
<progress value="0.6"></progress>`,
  },
];
