# SUGUDASU 赤入れ — 仕様

**更新:** 2026-07-24  
**id:** `annotate`  
**実装正本:** `assets/annotate-engine.js` · `assets/annotate-app.js`

---

## 1. ツール一覧（左パネル）

| ツール | 操作 |
|--------|------|
| 選択 | クリックで選択 · ドラッグで移動 |
| 黒塗り | 矩形ドラッグ |
| ぼかし | 矩形ドラッグ |
| モザイク | 矩形ドラッグ |
| 矢印 | ドラッグで生成 |
| 枠 | 角丸矩形 · 線のみ |
| 楕円 | 線のみ |

**Reject:** 自由記述テキスト（Visual Grammar Rule — `philosophy.md` · `decisions.md`）

---

## 2. マスク層

- マスクは **baseCanvas** に焼き込み（形状注釈は shapes レイヤ）
- マスク適用前に shapes を base へ flatten
- ぼかし: マニュアル向け · 黒塗り/モザイク: 高機密向け

---

## 3. 注釈

- 色: マゼンタ + 白フチ（固定）
- 線幅: 解像度スケール連動（文字が隠れないよう細め）
- Undo / Redo: 最大 20 · 削除 · Ctrl+Z / Ctrl+Y

---

## 4. PDF

- 入力: pdf.js でページをラスタ表示
- **編集ページ:** 注釈またはマスクを1回以上適用したページ
- 出力: pdf-lib — 編集ページのみ JPEG ラスタ挿入 · 未編集は copyPages
- PDF **編集ツールではない**（ページを画像として開き注釈）

---

## 5. 上限

| 項目 | 値 |
|------|-----|
| 1ファイル | 25MB |
| 長辺 | 8192px（超過は縮小 + 注意） |
| PDF ページ | 仕様上限（engine 定数） |

---

## 6. ファイル

| パス | 役割 |
|------|------|
| `tools/annotate.html` | LP + エディタ |
| `assets/annotate-engine.js` | 描画 · マスク · PDF · hit test |
| `assets/annotate-app.js` | UI |
| `scripts/annotate-engine.test.mjs` | 単体テスト |

---

## 7. レガシー

- id `mask` · URL `/mask` → **301** `/annotate`
- `assets/mask-*.js` · `tools/mask.html` stub は残置可（テスト · リダイレクト）
