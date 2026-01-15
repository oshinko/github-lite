# GitHub Lite

匿名参加 OK のミニマル Git ホスティング。
ブラウザでリポジトリを閲覧し、Smart HTTP で clone / fetch / push できます。

Anonymous-friendly minimal Git hosting.
Browse repositories in the browser and clone/fetch/push via Git Smart HTTP.

## できること

- `GIT_PROJECT_ROOT/<bucket>/<owner>` 配下の bare リポジトリ（`*.git`）を一覧表示: `GET /repos`
- リポジトリのツリー表示・ファイル閲覧: `GET /<owner>/<repo>/tree?ref=...`
- bare リポジトリの作成 API: `POST /api/repos`
- Git Smart HTTP（clone/fetch/push）: `http://localhost:3000/<owner>/<repo>` または `http://localhost:3000/<owner>/<repo>.git`

## 必要なもの

- Node.js / npm
- `git` コマンド（`git http-backend` を利用）
- 環境変数 `GIT_PROJECT_ROOT`（bare リポジトリを置くルートディレクトリ）

## セットアップ

```bash
npm install
```

### 起動（PowerShell）

```powershell
$env:GIT_PROJECT_ROOT="C:\path\to\git-project-root"
npm run dev
```

### 起動（bash）

```bash
export GIT_PROJECT_ROOT="/path/to/git-project-root"
npm run dev
```

ブラウザで `http://localhost:3000/repos` を開くと一覧が表示されます。

## 使い方

### UI

- 一覧: `GET /repos`
- リポジトリトップ: `GET /<owner>/<repo>`（デフォルトブランチへリダイレクト）
- ツリー/ファイル: `GET /<owner>/<repo>/tree/<path>?ref=<branch|sha>`

### Git（clone / fetch / push）

```bash
git clone http://localhost:3000/<owner>/<repo>
```

UI から作成したリポジトリは `http.receivepack=true` を自動設定します。  
既存の bare リポジトリを手動で置いた場合、push を許可するには以下を実行してください。

```bash
git -C /path/to/<repo>.git config http.receivepack true
```

## Smart HTTP のルーティング

- Git クライアントからの Smart HTTP リクエスト（`/info/refs`, `/git-upload-pack`, `/git-receive-pack`, `/objects`, `/HEAD`）のみ、`proxy.ts` で `GET/POST /<owner>/<repo>(.git)/...` を内部ルート `GET/POST /git/<owner>/<repo>/...` にリライトします（実体は `app/git/[owner]/[repo]/[[...path]]/route.ts`）。
- 通常のページ遷移（例: `GET /<owner>/<repo>`）はリライトされません。

## API

- `GET /health` -> `{ ok: true }`
- `GET /api/repos` -> `{ repos: { owner: string; name: string; dir: string; defaultBranch: string }[] }`
- `POST /api/repos` body: `{ "name": "my-repo" }` -> `{ ok: true, owner: "anonymous", name: "my-repo" }`

## 環境変数

- `GIT_PROJECT_ROOT`（必須）: bare リポジトリ（`*.git`）を置くディレクトリ
  - 例: `GIT_PROJECT_ROOT/<bucket>/anonymous/<repo>.git`
  - `<bucket>` はリポジトリを分散配置するための区分で、現状は `00` が使われます
- `GIT_HTTP_EXPORT_ALL`（任意）: 未設定時は `"1"` を使用します

## Owner について

現状は匿名ユーザーのみで、作成先 owner は `anonymous` 固定です。  
将来的に `/<owner>/<repo>` 形式で複数 owner を扱えるようにする前提で設計しています。

## 注意

- 認証・認可は未実装です（開発用途向け）。
- `GIT_PROJECT_ROOT` 配下のパス解決は検証していますが、公開環境で運用する場合は十分に注意してください。
