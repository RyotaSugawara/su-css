# リリース手順（npm 公開）

SuCSS は npm パッケージ [`@ryo9ra/su-css`](https://www.npmjs.com/package/@ryo9ra/su-css) として公開しています。
スコープ付きパッケージなので、公開時には `--access public` が必須です（ワークフローで指定済み。付けないと private 公開扱いとなり、有料プラン以外では失敗します）。
公開されるのは `src/lib/sucss.css` から生成したCSS 2ファイルのみで、デモアプリ（React / Vite）のコードや依存関係は含まれません。

---

## 1. 認証方式

リリースワークフローは **Trusted Publishing（OIDC）を優先**します。
GitHub Actions が発行するOIDCトークンをnpmが検証するため、**長期間有効なnpmトークンをリポジトリに保存する必要がありません**。

ワークフローは `NPM_TOKEN` シークレットの有無で自動的に切り替わります。

| `NPM_TOKEN` シークレット | 使われる認証 |
| --- | --- |
| 未設定 | Trusted Publishing（OIDC）← 通常はこちら |
| 設定あり | 従来のトークン認証（初回公開時のみ必要） |

### なぜ初回だけトークンが必要か

npm の Trusted Publisher 設定は「**公開済みのパッケージの設定画面**」で行うため、
まだ npm 上に存在しない `@ryo9ra/su-css` に対しては事前設定ができません。
そのため **1回目だけトークンで公開し、その後OIDCへ切り替える**のが公式に案内されている手順です。

---

### 手順A: 初回公開（トークンを一時的に使用）

1. npmjs.com で `ryo9ra` ユーザーにログインしていることを確認する（`@ryo9ra` はユーザースコープなので、追加のOrganization作成は不要）
2. npmjs.com → **Access Tokens** → **Granular Access Token** を発行
   - Permissions: **Read and write**
   - Packages and scopes: **Selected scopes → `@ryo9ra`**（パッケージが未作成でもスコープ単位なら指定できます）
   - 2FA を有効にしている場合は **Bypass 2FA** を有効にする
   - Expiration: 最短（数日）で十分。直後に削除するため
3. GitHub の **Settings → Secrets and variables → Actions** で `NPM_TOKEN` として登録
4. 後述の「リリースの流れ」でタグを push し、`@ryo9ra/su-css` の初回バージョンを公開
5. 公開が成功したら **手順B** に進み、トークンを削除する

### 手順B: OIDC（Trusted Publishing）へ切り替え

1. npmjs.com → **Packages → @ryo9ra/su-css → Settings → Trusted publishing** を開く
2. GitHub Actions を選び、以下を**大文字小文字も含めて完全一致**で入力する

   | 項目 | 値 |
   | --- | --- |
   | Organization or user | `RyotaSugawara` |
   | Repository | `su-css` |
   | Workflow filename | `release.yml` |
   | Environment | （空欄） |

   > 値がずれていると publish が **404** で失敗します（401ではなく404が返る点に注意）。
   > Environment を使う場合は、`release.yml` の `publish` ジョブに `environment: <名前>` を追加し、この欄にも同じ名前を入力してください（private リポジトリで Environment を使うには GitHub Pro/Team/Enterprise が必要です）。

3. GitHub の `NPM_TOKEN` シークレットを**削除**する
4. npmjs.com 側の Access Token も**削除**する

これ以降、リリースはトークンなしで実行されます。

### 前提条件（ワークフローで対応済み）

- `permissions: id-token: write`（OIDCトークンの発行に必要）
- npm CLI **11.5.1 以上**（`.nvmrc` の Node 20 に同梱される npm 10 では動かないため、ワークフローで `npm@^11.5.1` へ更新しています）
- **GitHub ホストランナー**であること（セルフホストランナーは未対応）

### provenance（来歴署名）について

Trusted Publishing では provenance が自動生成されますが、**private リポジトリでは生成できません**（パッケージ自体が public でも同様）。
本リポジトリが private の間は自動的にスキップされ、public にすると自動で有効になります。

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
5. `npm publish --access public`（`NPM_TOKEN` が無ければOIDC認証／リポジトリが public の場合は `--provenance` 付き）
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

初回リリースは **0.0.1** から始めます。`0.x` の間は API（HTML要素とカスタムプロパティ）が固まっていない扱いとし、
`minor` でも見た目が変わりうるものとします。安定したら `1.0.0` を切ってください。
なお npm はバージョンが単調増加であればよいため、`0.x` から任意のバージョン（`1.0.0` など）へ進めます。

---

## 5. トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `Tag vX.Y.Z does not match package.json version` | タグを削除し、`npm version` でバージョンを上げ直してから push する |
| `npm run check:version` が失敗 | `npm run sync:version` を実行し、`src/lib/sucss.css` の差分をコミットする |
| `ENEEDAUTH` / `E401` | OIDC未設定でトークンも無い状態。Trusted Publisher 設定（手順B）を見直すか、`NPM_TOKEN` を再登録する |
| publish が `404 Not Found` | Trusted Publisher の設定値のいずれかが不一致（org / repo / ワークフロー名 / Environment）。npmは不一致を401ではなく404で返すため、各項目を大文字小文字まで完全一致で見直す |
| OIDCが使われず認証エラーになる | npm が 11.5.1 未満だとOIDCを試行せず従来のトークン認証にフォールバックします。ワークフローの「Update npm」ステップのログでバージョンを確認する |
| `E403 Forbidden` | 同一バージョンが公開済み、またはパッケージへの権限不足。バージョンを上げ直す |
| `E402 Payment Required` | スコープ付きパッケージが private 扱いで公開されようとしている。`--access public` が付いているか確認する |
| `E404 Scope not found` | npm アカウント名が `ryo9ra` でない、またはトークンのスコープ権限が不足している |
| `Provenance generation ... public repository` | リポジトリが private の間は provenance を自動的にスキップします。エラーが出る場合はワークフローの visibility 判定を確認する |
