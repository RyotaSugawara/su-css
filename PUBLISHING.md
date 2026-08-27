# npm / jsDelivr 公開手順

SuCSS (`su-css`) を npm に公開すると、jsDelivr が npm レジストリを自動ミラーするため、
追加の登録作業なしで CDN 配信も同時に有効になります。

公開物は `src/lib/sucss.css` のみです。`npm run build:pkg` がこれを
`dist/sucss.css`（そのまま）と `dist/sucss.min.css`（esbuildでminify）としてビルドし、
`package.json` の `files` フィールドによってこの2ファイル + `README.md` + `LICENSE` のみが
tarball に含まれます（デモアプリのソースは含まれません）。

以降のリリースは GitHub Actions（`.github/workflows/publish-npm.yml`）に一本化されており、
**npmのトークンをリポジトリに保存する必要はありません**（npm Trusted Publishing / OIDC を使用）。
ただし、npmの仕様上「存在しないパッケージ」に対して Trusted Publisher を設定することはできないため、
**最初の1回だけは人手での `npm publish` が必須**です。以降は全てActionで完結します。

## フェーズ0: 初回のみ・手動ブートストラップ

これは人（npmアカウントを持つメンテナ）がローカル端末から一度だけ行う作業です。

1. `su-css` という名前がまだ空いているか確認する
   ```bash
   npm view su-css
   ```
   `404 Not Found` であればOK（本リポジトリ確認時点では未使用でした。ただし予約はできないため、
   公開直前に必ず再確認してください）。
2. npmアカウントで2要素認証(2FA)を「公開時に必須」に設定していることを確認する
   （npmjs.com → Account → Access → Two-Factor Authentication → "Authorization and write actions" ）
3. ローカルでログイン
   ```bash
   npm login
   ```
4. ビルドして中身を確認（デモアプリのソースが混ざっていないか必ず目視する）
   ```bash
   npm ci
   npm run build:pkg
   npm pack --dry-run
   ```
5. 公開
   ```bash
   npm publish
   ```
   （unscoped パッケージなのでデフォルトで public 公開されます）

## フェーズ1: 初回のみ・Trusted Publisher の設定

パッケージが存在するようになったら、npmjs.com 上で GitHub Actions を「信頼された発行元」として登録します。

1. https://www.npmjs.com/package/su-css/access → **Trusted Publisher** タブ
2. "GitHub Actions" を選択し、以下を入力
   - Organization or user: `RyotaSugawara`
   - Repository: `sucss`
   - Workflow filename: `publish-npm.yml`
   - Environment name: 空欄（未使用）
3. 保存

これで、このリポジトリの `publish-npm.yml` ワークフローから実行された `npm publish` だけが
信頼され、トークンなしで公開できるようになります。

## フェーズ2: 以降のリリース（すべて GitHub Actions で完結）

1. `package.json` の `"version"` を更新し（必要であれば `src/lib/sucss.css` 冒頭のバナーコメントの
   バージョン表記も揃える）、`main` にマージする
2. `vX.Y.Z` のタグを切って GitHub Release を作成する（タグ名は `package.json` の version と
   完全一致させること。ワークフロー側で不一致なら公開前に失敗します）
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   # その後 GitHub 上で Release を作成 (Publish release)
   ```
3. `release: published` イベントで `.github/workflows/publish-npm.yml` が起動し、
   - `npm ci` → `npm run lint`（型チェック）
   - タグと `package.json` バージョンの一致確認
   - `npm run build:pkg`
   - `npm pack --dry-run` で内容確認
   - `npm publish`（OIDC Trusted Publishing、`id-token: write` 権限のみ・保存トークンなし。
     provenance attestation も自動付与されます）
   を実行します。失敗時はワークフローのログで原因を確認してください。

手動での緊急発行が必要な場合のために `workflow_dispatch` も有効にしていますが、
その場合はタグ ref から実行しないとバージョン一致チェックで失敗する点に注意してください。

## jsDelivr での配信

npm への公開後、数分以内に以下のURLで自動的に配信されます（jsDelivr側での追加作業は不要）。

```html
<!-- バージョン固定（本番用に推奨。immutableなので長期キャッシュしても安全） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/su-css@1.0.0/dist/sucss.css">

<!-- minify版 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/su-css@1.0.0/dist/sucss.min.css">

<!-- メジャーバージョン追従 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/su-css@1/dist/sucss.css">
```

`@latest`（バージョン指定なし）のURLは利用者に予告なく変更が届くため、ドキュメントや配布用の
サンプルには使わないでください。

## 公開後の確認

- `npm view su-css` でレジストリのメタデータを確認
- `https://cdn.jsdelivr.net/npm/su-css@<version>/dist/sucss.css` に実際にアクセスして内容を確認
- `https://www.npmjs.com/package/su-css` で Provenance バッジが付いていることを確認
