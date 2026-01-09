# GitHub Lite

Next.js App Router のみで動く、最小構成の Git ホスティング + リポジトリ閲覧 UI です。  
Git Smart HTTP は `git http-backend` を呼び出して処理します。

## できること

- `GIT_PROJECT_ROOT` 配下の bare リポジトリ (`*.git`) を一覧表示: `/repos`
- リポジトリのツリー表示・ファイル閲覧: `/<repo>/tree?ref=...`
- bare リポジトリの作成 API: `POST /api/repos`
- Git Smart HTTP: `/<repo>` または `/<repo>.git`

## 必要なもの

- Node.js / npm
- `git` コマンド（`git http-backend` を利用）
- 環境変数 `GIT_PROJECT_ROOT`（bare リポジトリを置くルート）

## セットアップ

```bash
npm install
```

```powershell
$env:GIT_PROJECT_ROOT="C:\path\to\git-project-root"
npm run dev
```

ブラウザで `http://localhost:3000/repos` を開くと一覧が表示されます。

## Git クローン / Push

```bash
git clone http://localhost:3000/<repo>
```

UI から作成したリポジトリは `http.receivepack=true` を自動設定します。  
手動で作成した場合は、push を許可するために以下を実行してください。

```bash
git -C /path/to/<repo>.git config http.receivepack true
```

## ルーティング

- UI 一覧: `/repos`
- UI リポジトリ: `/<repo>`
- UI ツリー/ファイル: `/<repo>/tree/...`
- Git Smart HTTP は `proxy.ts` で `__git` にリライトされます。

## API

- `GET /health` -> `{ ok: true }`
- `GET /api/repos` -> `{ repos: RepoSummary[] }`
- `POST /api/repos` body: `{ "name": "my-repo" }`

## 環境変数

- `GIT_PROJECT_ROOT`（必須）: bare リポジトリを置くディレクトリ
- `GIT_HTTP_EXPORT_ALL`（任意）: 未設定時は `"1"` を使用

## 注意

- 認証・認可は未実装です（開発用途の最小構成）。
- `GIT_PROJECT_ROOT` 配下のパス解決はチェックしていますが、公開環境での運用は注意してください。
