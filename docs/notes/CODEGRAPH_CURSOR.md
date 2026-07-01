# Cursor + CodeGraph（SUGUDASU 用）

**正本:** [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph)  
**対象:** `C:\asl_dev\sugudasu` を Open Folder にした Cursor Agent

---

## 何をするか

CodeGraph はリポジトリ内のシンボル・呼び出し関係を **ローカル SQLite グラフ**に索引化し、Agent が `grep` / `Read` を繰り返す代わりに **1 回の MCP クエリ**で関連コードを取得する（100% ローカル · API キー不要）。

---

## 導入済み（2026-06-26）

| 項目 | 状態 |
|------|------|
| MCP | `.cursor/mcp.json` → `codegraph`（`npx @colbymchenry/codegraph serve --mcp`） |
| 索引 | `codegraph init` 済み · **64 files · 1,027 nodes** |
| 保存先 | `.codegraph/`（`.gitignore` 済み） |
| 自動同期 | ファイル変更時にデバウンス更新（デフォルト ON） |

**提督:** Cursor を **Developer: Reload Window** → **Settings → MCP** で `codegraph` が緑か確認。

---

## 提督・Agent コマンド

```powershell
cd C:\asl_dev\sugudasu
npx -y @colbymchenry/codegraph status   # 索引状態
npx -y @colbymchenry/codegraph sync     # 手動再索引（通常不要）
npx -y @colbymchenry/codegraph uninit   # 索引削除（MCP は残る）
```

---

## 注意

- **ASL `asl-dashboard` とは別索引** — 各リポで `codegraph init` が必要
- Win + WSL で同一 checkout を共有する場合は `CODEGRAPH_DIR` を分ける（[公式 README — Windows/WSL](https://github.com/colbymchenry/codegraph#windows)）
- `dist/` · `node_modules/` はデフォルト除外

---

## 関連

- [`RTK_CURSOR.md`](RTK_CURSOR.md) — Shell 出力のトークン圧縮
- [`CURSOR_CLOUDFLARE_AGENT_SETUP.md`](CURSOR_CLOUDFLARE_AGENT_SETUP.md) — Cloudflare MCP
