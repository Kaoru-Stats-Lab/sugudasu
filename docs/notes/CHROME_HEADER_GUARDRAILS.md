# 共通ヘッダー（sg-chrome）再発防止

**更新:** 2026-06-19  
**対象:** `assets/sugudasu-shell.js` · `scripts/build-pages.mjs` · `tools/*.html`

---

## 1. 症状

本番で **ロゴ・ツールナビ・ページタイトルが消え**、コンテンツが画面上部から始まる。`#sg-chrome-top` が空のまま。

---

## 2. 過去の原因（高頻度）

| 日付 | 原因 | 対策 |
|------|------|------|
| 2026-06-17 | 手動 `dist` コピー・パス不整合・CSS 未読込 | `build-pages` 正規化 · `sg-chrome` sticky 化（Backlog §8） |
| 2026-06-19 | **`build-pages` が `shell.js` と inline `mount` に `defer` を付与** → 実行順崩壊 | `defer` 禁止 · **data 属性自動マウント** · ビルド検証 |

**禁止（再発パターン）**

- `sugudasu-shell.js` への `defer` / `async`
- inline `SUGUDASU_SHELL.mount()` の `defer`
- `shell.js` より **前** に `mount` を置く
- `build-pages` 以外での手動 `dist` 上書き

---

## 3. 正しい実装（2026-06-19〜）

### HTML

```html
<div id="sg-chrome-top" data-sg-title="傾斜割り勘"></div>
<!-- main … -->
<div id="sg-chrome-bottom"></div>
<script src="../assets/sugudasu-segment.js"></script> <!-- モード切替ツールのみ -->
<script src="../assets/sugudasu-shell.js"></script>
```

| 属性 | 意味 |
|------|------|
| `data-sg-title` | ヘッダー見出し（**必須**） |
| `data-sg-print="true"` | 印刷/PDF ボタン表示 |
| `data-sg-landscape="true"` | A4 横（シフトのみ） |

**インライン `SUGUDASU_SHELL.mount()` は使わない。** `shell.js` 読込時に `bootstrapChromeFromDom()` が自動実行。

### ビルドゲート

`npm run build:pages` 末尾で `scripts/verify-chrome-mount.mjs` が **必ず** 走る。

- `data-sg-title` 必須
- `defer` 禁止
- inline `mount` 禁止

---

## 4. 変更時チェックリスト

- [ ] `tools/*.html` の `sg-chrome-top` に `data-sg-title` がある
- [ ] 末尾は `sugudasu-shell.js` のみ（同期）
- [ ] `npm run build:pages` が通る（chrome-mount-guard 含む）
- [ ] 本番確認: `/warikan` 等でロゴ+ナビが見える

---

## 5. 参照

- デザイン規約: `docs/DESIGN_GUIDELINE.md` §7
- UX 監査: `docs/PRODUCT_UX_AUDIT.md`（shell 読込失敗）
