# リリース手順（npm 公開）

> このドキュメントはリリース作業の手順書です。日々の開発ルール（PRタイトル規約、
> スタイルシートが守るべき不変条件、チェックの走らせ方）は [CONTRIBUTING.md](../CONTRIBUTING.md) にあります。

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
公開されるのは `src/lib/sucss.css` から生成したCSS 2ファイルのみで、デモサイト（素のHTMLとVite）のコードや依存関係は含まれません。

---

## 1. 認証方式

リリースワークフローは **Trusted Publishing（OIDC）のみ**で npm に認証します。
GitHub Actions が実行ごとに発行するOIDCトークンをnpmが検証するため、
**長期間有効なnpmトークンはどこにも保存していません**。フォールバックもありません。

漏れて困る資格情報が存在しない、というのがこの構成の一番の狙いです。
リポジトリのシークレットに publish 用のトークンを足すと、
冒頭に書いた「メンテナが 2FA で承認するまで公開されない」というゲートを
迂回する経路を CI に与えることになるので、追加しないでください。

> かつては初回公開だけトークンを使っていました。npm の Trusted Publisher 設定は
> 「公開済みパッケージの設定画面」で行うため、npm 上に存在しないパッケージには
> 事前設定ができないからです。`@ryo9ra/su-css` は公開済みで OIDC へ移行が済んでおり、
> `NPM_TOKEN` シークレットと npm 側の Access Token はどちらも削除済みです。

---

### 設定A: Trusted Publisher の設定内容

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
   publish がエラーにならないことを確認します。設定値がずれていると 404 で落ちるので、
   設定を触ったあとは毎回ここまで確認しておくと安全です。

### 設定B: 公開経路をCIのみに限定する（推奨）

npmjs.com → **Packages → @ryo9ra/su-css → Settings → Publishing access** で
**「Require two-factor authentication and disallow tokens」** を選択します。

- Granular Access Token は **bypass 2FA の設定にかかわらず** publish に使えなくなります
- Trusted Publisher（OIDC）は影響を受けず、そのまま動作します
- 手元から publish する場合は 2FA プロンプトへの対話応答が必須になります

これにより、**仮にトークンが発行・漏洩しても公開できない**状態になります。

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

リリースの起点は2つあり、どちらも最後は同じ `release.yml`（ステージング）に合流します。

| 起点 | 使う場面 | 操作 |
| --- | --- | --- |
| **release-please**（既定） | 通常のリリース | 自動で立つ Release PR をマージするだけ |
| **タグを直接 push** | 緊急時・手元から | `git tag vX.Y.Z && git push origin vX.Y.Z` |

### 2-A. release-please（推奨）

main に積まれた [Conventional Commits](https://www.conventionalcommits.org/ja/) を読み、
次のバージョンと `CHANGELOG.md` を書いた **Release PR** を自動で立てて更新し続けます。

```
feat: add a styled <progress> element     → minor (0.x では patch 相当の扱い)
fix: raise the contrast of muted text     → patch
feat!: drop the legacy [switch] attribute → major
docs: ...  chore: ...  ci: ...            → リリースを起こさない
```

**その PR をマージするだけ**でタグと GitHub Release が作られ、続けて npm へのステージングが走ります。

> `0.x` の間は `bump-minor-pre-major` により `feat:` でも minor に留め、
> 破壊的変更（`!` または `BREAKING CHANGE:`）で初めて 1.0.0 に上がる設定にしています。

> **かつてあった Version Bump ワークフローは削除しました。**
> `npm version` で直接バージョンを上げて main に push する手動ディスパッチでしたが、
> release-please のマニフェスト（`.release-please-manifest.json`）を更新しないため、
> これを使うと release-please が最後のリリースを見失います。実際 0.1.0 をこれで切った結果、
> マニフェストが 0.0.2 のまま取り残され、次のリリース PR が公開済みより低い 0.0.3 を
> 提案する状態になりました。
> main への直接 push はブランチ保護とも噛み合わないため、リリースの起点は
> release-please に一本化しています。

### 2-B. 共通: ステージング後に承認して公開する

いずれの起点でも、`release.yml` が次を順に実行します。

1. タグ名と `package.json` の `version` の一致を検証（タグ起点の場合）
2. そのバージョンが未公開であることを検証（`npm run check:unpublished`）
3. 型チェック / Stylelint / テスト
4. `npm run build:lib` で `dist-lib/` を生成
5. `npm stage publish --access public`（OIDC認証／リポジトリが public の場合は `--provenance` 付き）

**この時点ではまだ公開されていません。** ジョブのサマリに承認手順が出力されます。

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

> タグを手で push した場合の GitHub Release 作成は、別ワークフロー `github-release.yml` が担当します。
> release.yml から切り出してあるのは、再利用ワークフローは呼び出し元より強い権限を要求できず、
> `contents: write` を release.yml に残すと**すべての呼び出し元に書き込み権限を要求させてしまう**ためです。
> （release-please は自分で Release を作るので、この分離で困りません。）

### なぜ起点ごとにワークフローが分かれているのか

GITHUB_TOKEN が作成したタグは**ワークフローを起動しません**（GitHub の無限ループ防止）。
そのため release-please は、タグ push による連鎖に頼らず
`release.yml` を **`workflow_call` で直接呼び出し**ています。

この違いは npm 側の設定に影響します。npm は**実行を開始したワークフロー**を認可するため、
Trusted Publisher には起点ごとのファイル名を登録する必要があります（npm は1パッケージにつき最大10件登録可）。

| 起点 | npm に登録するワークフロー名 |
| --- | --- |
| タグ push / 手動 dry run | `release.yml` |
| release-please | `release-please.yml` |

> `version-bump.yml` の登録が npm 側に残っている場合は削除してください。
> 対応するワークフローが無くなったため、認可される必要のない入口になります。

### バージョン情報の一元管理

バージョンの実体は `package.json` **だけ**です。

- `dist-lib/*.css` の `/*! SuCSS vX.Y.Z */` バナーはビルド時に `package.json` から生成されます
- `src/lib/sucss.css` にはバージョンを書きません
- README の CDN URL はバージョン無し（＝最新）で記載しています

そのため、バージョンを上げるときに手で直すファイルはありません。

---

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
| Release PR が立たない | リポジトリ設定 → Actions → General → 「Allow GitHub Actions to create and approve pull requests」を有効にする。リリース対象のコミットが1件も無い（`docs:` / `chore:` のみ）場合も立ちません |
| Release PR をマージしたのにステージされない | npm の Trusted Publisher に `release-please.yml` を登録しているか確認する（起点ごとに別登録が必要です） |
| ワークフローが `startup_failure` になる | 再利用ワークフロー側のジョブが、呼び出し元より強い `permissions` を要求している。呼び出し元の `permissions` を合わせるか、その権限が必要なジョブを別ワークフローに切り出す |
| `Tag vX.Y.Z does not match package.json version` | タグが古いコミットを指している。タグを削除し、`package.json` がそのバージョンになっているコミット上で作り直す |
| `... is already published. Bump the version` | そのバージョンは公開済み。`npm version <patch\|minor\|major>` で上げ直す（dry run でも未公開バージョンが必要です） |
| `You cannot publish over the previously published versions` | 同上。ローカルで `npm run check:unpublished` を実行すると事前に確認できます |
| `ENEEDAUTH` / `E401` | OIDC の認証に失敗している。Trusted Publisher の設定値（設定A）と、ジョブに `id-token: write` があるかを見直す。トークンを足して回避しないこと |
| publish が `404 Not Found` | Trusted Publisher の設定値のいずれかが不一致（org / repo / ワークフロー名 / Environment）。npmは不一致を401ではなく404で返すため、各項目を大文字小文字まで完全一致で見直す |
| OIDCが使われず認証エラーになる | npm が 11.5.1 未満、または Node が 22.14.0 未満。ワークフローの「Update npm」ステップのログで `node --version` / `npm --version` を確認する |
| OIDCなのに stage publish が拒否される | Trusted Publisher の **Allowed actions** で `npm stage publish` が有効になっているか確認する |
| `E403 Forbidden` | 同一バージョンが公開済み／ステージ済み、またはパッケージへの権限不足。`npm stage list` を確認し、不要なら `npm stage reject` してからバージョンを上げ直す |
| `npm stage` が unknown command | npm が 11.15.0 未満。ワークフローの「Update npm」ステップのログを確認する |
| ステージしたのに承認できない | npm アカウントの 2FA が無効。承認・却下には 2FA が必須です |
| `E402 Payment Required` | スコープ付きパッケージが private 扱いで公開されようとしている。`--access public` が付いているか確認する |
| `E404 Scope not found` | npm アカウント名が `ryo9ra` でない、または Trusted Publisher の設定がスコープに届いていない |
| `Provenance generation ... public repository` | リポジトリが private の間は provenance を自動的にスキップします。エラーが出る場合はワークフローの visibility 判定を確認する |
