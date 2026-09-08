# リリース手順（npm 公開）

SuCSS は npm パッケージ [`su-css`](https://www.npmjs.com/package/su-css) として公開しています。
公開されるのは `src/lib/sucss.css` から生成したCSS 2ファイルのみで、デモアプリ（React / Vite）のコードや依存関係は含まれません。

---

## 1. 初回のみ必要な設定

### npm アクセストークンの登録

1. npmjs.com にログインし、**Access Tokens** から **Granular Access Token** を発行する。
   - Packages and scopes: `su-css`（初回公開前で対象パッケージが存在しない場合は、公開権限のある scope / `Read and write` を選択）
   - Permissions: **Read and write**
   - Expiration: 運用に合わせて設定（期限切れ時は再発行して差し替える）
2. GitHub リポジトリの **Settings → Secrets and variables → Actions** で、シークレット `NPM_TOKEN` として登録する。

> リリースワークフローは `environment: npm` を使用します。Environment 側にシークレットを置くと、リリース時のみトークンが露出するよう制限でき、承認レビューを挟むこともできます（リポジトリレベルのシークレットのままでも動作します）。

### 2FA を有効にしている場合

npm アカウントで「Require two-factor authentication for write actions」を有効にしていると、CI からの publish が失敗します。
Granular Access Token は 2FA をバイパスできる設定で発行するか、パッケージ設定の Publishing access を
**Require two-factor authentication or an automation token** にしてください。

---

## 2. リリースの流れ

```bash
# 1. main を最新にする
git checkout main && git pull

# 2. 事前チェック（CIと同じ内容 + パッケージ内容の確認）
npm ci
npm run lint
npm run test
npm run build:lib
npm run release:dry-run   # 公開されるtarballの中身を表示（公開はしない）

# 3. バージョンを上げる
#    npm version が src/lib/sucss.css のバナー（SuCSS vX.Y.Z）も自動更新し、
#    コミットと v<version> タグを作成します。
npm version patch   # または minor / major

# 4. コミットとタグを push（タグの push がリリースの起点）
git push origin main --follow-tags
```

`v*.*.*` タグが push されると `.github/workflows/release.yml` が起動し、次を順に実行します。

1. タグ名と `package.json` の `version` の一致を検証
2. `src/lib/sucss.css` のバージョンバナーの一致を検証（`npm run check:version`）
3. 型チェック / Stylelint / テスト
4. `npm run build:lib` で `dist-lib/` を生成
5. `npm publish --access public`（リポジトリが public の場合は `--provenance` 付き）
6. `gh release create` で GitHub Release を作成（リリースノートは自動生成）

---

## 3. 公開せずにワークフローを試す

GitHub の **Actions → Release → Run workflow** から手動実行できます。
`dry_run` を `true`（既定値）のままにすると、全チェックと `npm publish --dry-run` のみが実行され、実際の公開は行われません。

---

## 4. バージョニング方針

[Semantic Versioning](https://semver.org/lang/ja/) に従います。CSSフレームワークとしては次を目安にします。

| 種別 | 対象となる変更 |
| --- | --- |
| **patch** | 既存の見た目を壊さない修正（コントラスト調整、バグ修正、ブラウザ互換対応） |
| **minor** | 新しい要素・セレクタへの対応、新規カスタムプロパティの追加（後方互換あり） |
| **major** | 既存HTMLの見た目が変わる変更、カスタムプロパティの削除・改名 |

---

## 5. トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `Tag vX.Y.Z does not match package.json version` | タグを削除し、`npm version` でバージョンを上げ直してから push する |
| `npm run check:version` が失敗 | `npm run sync:version` を実行し、`src/lib/sucss.css` の差分をコミットする |
| `ENEEDAUTH` / `E401` | `NPM_TOKEN` が未設定・期限切れ。トークンを再発行してシークレットを更新する |
| `E403 Forbidden` | 同一バージョンが公開済み、またはパッケージへの権限不足。バージョンを上げ直す |
| `Provenance generation ... public repository` | リポジトリが private の間は provenance を自動的にスキップします。エラーが出る場合はワークフローの visibility 判定を確認する |
