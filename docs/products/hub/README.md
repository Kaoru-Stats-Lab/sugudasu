# SUGUDASU Hub — プロダクト文書

**id:** `hub`（`/` · `tools/hub.html` · `dist/index.html`）  
**役割:** 仕事へ戻るための **探索入口**（目的地ではない）

---

## 正本

| 文書 | 責務 |
|------|------|
| **[HUB_CONSTITUTION_SPEC.md](./HUB_CONSTITUTION_SPEC.md)** | **憲法レビュー & 総合仕様**（思想→IA→UX→UI→技術） |
| **[PHASE_H-UI-07-work-context.md](./PHASE_H-UI-07-work-context.md)** | 仕事コンテキスト入力（条件付き · 未実装） |
| [../../notes/HUB_IA_REFRESH_V2.md](../../notes/HUB_IA_REFRESH_V2.md) | Phase 1–2 実装正本 · SSOT 一覧 |
| [../../HUB_UX_DOC_LAYERS.md](../../HUB_UX_DOC_LAYERS.md) | 4層文書の置き方 |
| [../../design/hub-layout.md](../../design/hub-layout.md) | レイアウト凍結 |
| [../../design/search-guideline.md](../../design/search-guideline.md) | 検索普遍原則 |
| [../../design/card-guideline.md](../../design/card-guideline.md) | カード文案原則 |
| [../../adr/ADR-001-top-page-ia.md](../../adr/ADR-001-top-page-ia.md) | Top IA ADR |

---

## 実装

| 資産 | パス |
|------|------|
| HTML | `tools/hub.html` |
| IA 制御 | `assets/hub-ia.js` |
| 検索エンジン | `assets/hub-search-engine.js` |
| 検索 boot | `assets/hub-search-boot.js`（type=module） |
| 共通 Chrome | `assets/sugudasu-shell.js` |

---

## ビルド

```bash
npm run build:hub-search   # hub-search-bundle 生成
npm run validate:hub-ia    # render-hub-cards + verify-hub-ia（build:pages に含む）
```
