# リリース手順（npm 公開）

SuCSS は npm パッケージ [`@ryo9ra/su-css`](https://www.npmjs.com/package/@ryo9ra/su-css) として公開しています。
スコープ付きパッケージなので、公開時には `--access public` が必須です（ワークフローで指定済み。付けないと private 公開扱いとなり、有料プラン以外では失敗します）。

リリースは **staged publishing** を使います。CI はパッケージを npm の**ステージングキューに積むだけ**で、
利用者に届くのはメンテナが 2FA で**承認した後**です。CIが侵害されても、人の承認なしには公開されません。

```
タグ push  →  CI が npm stage publish  →  メンテナが 2FA で承認  →  公開
```

> **前提: npm アカウントで 2FA が有効になっていること。**
> ステージ済みパッケージを承認・却下できるのは、パッケージへの書き込み権限があり **かつ 2FA を有効にしているユーザーのみ**です。
> 2FA が無効だと、ステージしたものを公開できなくなります。
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

> **順番が重要です。** 先に Trusted Publisher を設定してOIDCで公開できることを確認し、
> それからトークンを削除してください。逆順にすると公開手段が無くなります。

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

3. **Allowed actions は `npm stage publish` のみにする**

   2026-09-03 以降に作成した設定は既定でこの状態です。`npm publish`（直接公開）は**有効にしないでください** —
   有効にすると、承認ゲートを迂回して公開できる経路を CI に与えることになります。
   本ワークフローは `npm stage publish` しか実行しません。

4. **タグを打たずに動作確認する。** Actions → Release → Run workflow を `dry_run: true` で実行し、
   ログに「publishing with trusted publishing (OIDC)」ではなく token 認証と出ていないか、
   publish がエラーにならないかを確認します。
   ※ この時点ではまだ `NPM_TOKEN` があるためトークン認証が使われます。OIDC の実地確認は手順5の後になります。

5. GitHub の `NPM_TOKEN` シークレットを**削除**する → 再度 `dry_run: true` で実行し、
   ログが **「No NPM_TOKEN; publishing with trusted publishing (OIDC)」** になり成功することを確認する

6. npmjs.com 側の Access Token も**削除**する

これ以降、リリースはトークンなしで実行されます。

### 手順C: 公開経路をCIのみに限定する（推奨）

手順Bが完了したら、npmjs.com → **Packages → @ryo9ra/su-css → Settings → Publishing access** で
**「Require two-factor authentication and disallow tokens」** を選択します。

- Granular Access Token は **bypass 2FA の設定にかかわらず** publish に使えなくなります
- Trusted Publisher（OIDC）は影響を受けず、そのまま動作します
- 手元から publish する場合は 2FA プロンプトへの対話応答が必須になります

これにより、**トークンが漏洩しても公開できない**状態になります。

### 前提条件（ワークフローで対応済み）

- `permissions: id-token: write`（OIDCトークンの発行に必要）
- **Node 22.14.0 以上**（Trusted Publishing の要件。`.nvmrc` を `22` にしています）
- npm CLI **11.15.0 以上**（`npm stage` の要件。Node 22 同梱の npm では古いため、ワークフローで `npm@^11.15.0` へ更新しています）
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
5. `npm stage publish --access public`（`NPM_TOKEN` が無ければOIDC認証／リポジトリが public の場合は `--provenance` 付き）
6. `gh release create` で GitHub Release を作成（リリースノートは自動生成）

**この時点ではまだ公開されていません。** ジョブのサマリに承認手順が出力されるので、続けて承認します。

### 5. 承認して公開する

**スマホ・ブラウザから**: https://www.npmjs.com/package/@ryo9ra/su-css を開き、ステージ中のバージョンを承認（2FA）

**ターミナルから**:

```bash
npm stage list @ryo9ra/su-css      # ステージ中の一覧と stage-id
npm stage view <stage-id>          # 中身を確認
npm stage download <stage-id>      # tarballを手元に落として検査（任意）
npm stage approve <stage-id>       # 2FAプロンプト → 公開
npm stage reject  <stage-id>       # 破棄する場合（2FA必要）
```

承認した時点で初めて `npm install @ryo9ra/su-css` で取得できるようになります。

> ステージ中のバージョンは公開済みバージョンと同じ採番空間を共有します。
> 同じバージョン番号を二重にステージすることはできません。破棄する場合は `npm stage reject` を使ってください。
> また、dist-tag はステージ時に確定し、後から変更できません。

---

## 3. 公開せずにワークフローを試す

GitHub の **Actions → Release → Run workflow** から手動実行できます。
`dry_run` を `true`（既定値）のままにすると、全チェックと `npm stage publish --dry-run` のみが実行され、
ステージングキューには何も積まれません。

> **`package.json` のバージョンが未公開である必要があります。**
> `npm stage publish` は `--dry-run` でもレジストリ側でバージョン重複を検査するため、
> 公開済みバージョンのままでは dry run も失敗します。
> ワークフローの「Verify the version is not already released」ステップが冒頭でこれを検出し、
> `npm version` でバージョンを上げるよう促します。

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
| `npm run check:version` が失敗 | `npm run sync:version` を実行し、`src/lib/sucss.css` と `README.md` の差分をコミットする |
| `... is already published. Bump the version` | そのバージョンは公開済み。`npm version <patch\|minor\|major>` で上げ直す（dry run でも未公開バージョンが必要です） |
| `You cannot publish over the previously published versions` | 同上。ローカルで `npm run check:unpublished` を実行すると事前に確認できます |
| `ENEEDAUTH` / `E401` | OIDC未設定でトークンも無い状態。Trusted Publisher 設定（手順B）を見直すか、`NPM_TOKEN` を再登録する |
| publish が `404 Not Found` | Trusted Publisher の設定値のいずれかが不一致（org / repo / ワークフロー名 / Environment）。npmは不一致を401ではなく404で返すため、各項目を大文字小文字まで完全一致で見直す |
| OIDCが使われず認証エラーになる | npm が 11.5.1 未満、または Node が 22.14.0 未満。ワークフローの「Update npm」ステップのログで `node --version` / `npm --version` を確認する |
| OIDCなのに stage publish が拒否される | Trusted Publisher の **Allowed actions** で `npm stage publish` が有効になっているか確認する |
| `E403 Forbidden` | 同一バージョンが公開済み／ステージ済み、またはパッケージへの権限不足。`npm stage list` を確認し、不要なら `npm stage reject` してからバージョンを上げ直す |
| `npm stage` が unknown command | npm が 11.15.0 未満。ワークフローの「Update npm」ステップのログを確認する |
| ステージしたのに承認できない | npm アカウントの 2FA が無効。承認・却下には 2FA が必須です |
| `E402 Payment Required` | スコープ付きパッケージが private 扱いで公開されようとしている。`--access public` が付いているか確認する |
| `E404 Scope not found` | npm アカウント名が `ryo9ra` でない、またはトークンのスコープ権限が不足している |
| `Provenance generation ... public repository` | リポジトリが private の間は provenance を自動的にスキップします。エラーが出る場合はワークフローの visibility 判定を確認する |
