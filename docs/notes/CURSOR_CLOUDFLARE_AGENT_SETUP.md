# Cursor + Cloudflare（SUGUDASU 用）

**正本:** [Cloudflare — Cursor + Cloudflare](https://developers.cloudflare.com/agent-setup/cursor/)  
**対象リポ:** `C:\asl_dev\sugudasu`（Pages · `sugudasu-sync` · Wrangler）

---

## 結論 — 入れる価値あり（sugudasu）

Sync ラインは **Cloudflare Pages + Functions + Wrangler** が本番経路のため、Agent に Cloudflare 公式の Skills / MCP を載せるとデプロイ確認・ドキュメント参照が楽になる。

**asl-dashboard（Vercel 本番）** は Vercel MCP が主。**Cloudflare MCP / プラグインは入れない。**

---

## すでに設定済み（`.cursor/mcp.json`）

| MCP | URL | 用途 |
|-----|-----|------|
| `cloudflare-api` | `https://mcp.cloudflare.com/mcp` | Code Mode · API 全般（OAuth） |
| `cloudflare-docs` | `https://docs.mcp.cloudflare.com/mcp` | 最新ドキュメント検索 |
| `cloudflare-builds` | `https://builds.mcp.cloudflare.com/mcp` | Pages/Workers ビルド・デプロイ状況 |

初回ツール利用時に **ブラウザ OAuth** で Cloudflare アカウント承認が必要。

---

## 提督が Cursor 上で一度だけやること

### 1. Cloudflare プラグイン（Skills）

チャットまたはコマンドパレットで:

```text
/add-plugin cloudflare
```

または [Cursor Marketplace — Cloudflare](https://cursor.com/marketplace/cloudflare) からインストール。

**効果:** `wrangler` · `workers-best-practices` · Pages 知識などが Agent に常時ロードされる（[Skills 一覧](https://developers.cloudflare.com/agent-setup/cursor/)）。

Wrangler ログイン後の「Skills を入れますか？」→ **`n` で可**。プラグイン経由の方が更新が追従しやすい。

### 2. MCP OAuth

Cursor **Settings → MCP** で `cloudflare-api` / `cloudflare-builds` が緑（接続済）か確認。失敗時は **Developer: Reload Window**（`docs/notes/CURSOR_MCP_RELOAD_RUNBOOK.md` と同手順 · asl-dashboard 側 SSOT）。

### 3. Wrangler（CLI）

```powershell
npx wrangler login   # 済みなら不要
```

デプロイ正本: `npm run deploy:pages:sync`（`SYNC_INFRA_CLOUDFLARE.md` §4）

---

## Agent への依頼例

```text
cloudflare-builds で sugudasu-sync の最新 Production デプロイが Success か確認。失敗ならビルドログ末尾だけ要約。
```

```text
cloudflare-docs で Pages Functions の環境変数の設定方法を確認し、SYNC_ENV_KEYS と矛盾がないか見て。
```

---

## やらないこと

- Observability MCP のログ総なめ（コスト · トークン肥大）
- Agent からの無断 `wrangler deploy` 連打（`sugudasu-deploy.mdc` — 提督依頼時のみ）

---

## 関連

- `docs/notes/SYNC_INFRA_CLOUDFLARE.md`
- `.cursor/rules/sugudasu-deploy.mdc`
