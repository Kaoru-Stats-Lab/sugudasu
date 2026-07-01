# Cursor + RTK（SUGUDASU 用）

**正本:** [rtk-ai/rtk](https://github.com/rtk-ai/rtk) · [README_ja.md](https://github.com/rtk-ai/rtk/blob/develop/README_ja.md)  
**対象:** `C:\asl_dev\sugudasu` を Open Folder にした Cursor Agent

---

## 何をするか

[RTK](https://github.com/rtk-ai/rtk)（Rust Token Killer）は、Agent が Shell で叩く `git` · `npm test` · `rg` 等の出力を圧縮し、**トークン消費を 60–90% 削減**する CLI プロキシ。

Cursor では **global `preToolUse` フック**が `Shell` ツールのコマンドを `rtk …` に自動書き換える（`Read` / `Grep` / `Glob` は対象外）。

---

## 導入済み（2026-06-26）

| 項目 | 状態 |
|------|------|
| `rtk` CLI | `0.36.0`（PATH） |
| `jq` | `1.8.2`（フック必須 · winget `jqlang.jq`） |
| Cursor フック | `C:\Users\sophi\.cursor\hooks.json` → `preToolUse` · `rtk-rewrite.sh` |
| インストールコマンド | `rtk init -g --agent cursor --auto-patch` |

**提督:** Cursor を **Developer: Reload Window** 後、Agent に `git status` を任せて出力が短文化されるか確認。統計は `rtk gain`。

---

## Windows 注意

| 項目 | 内容 |
|------|------|
| フック実体 | `rtk-rewrite.sh`（bash + jq） |
| ネイティブ Win | Git Bash 等で `bash` が PATH にあるとフックが動く。無い場合は **明示的に** `rtk git status` 等 |
| フル自動化 | **WSL** 内 Cursor / ターミナルが最も確実（[RTK Windows 節](https://github.com/rtk-ai/rtk#windows)） |

---

## アンインストール

```powershell
rtk init -g --agent cursor --uninstall
```

---

## 関連

- [`CURSOR_CLOUDFLARE_AGENT_SETUP.md`](CURSOR_CLOUDFLARE_AGENT_SETUP.md) — Cloudflare MCP（別系統）
