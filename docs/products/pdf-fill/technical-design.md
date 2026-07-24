# SUGUDASU PDF記入 — 技術設計

**正本:** 本ファイル  
**対象:** 技術方針・処理パイプライン（How）  
**プロダクト境界:** [philosophy.md](./philosophy.md) · [decisions.md](./decisions.md)  
**更新:** 2026-07-22 — Paper First v4 · Marker · Adaptive Snap · slot横調整

---

## 方針

次のクライアント技術のみで完結する。

- **pdf.js** — PDFの描画・ページ取得
- **pdf-lib** — 出力PDFの生成（ページコピー + 画像ページ挿入）
- **Canvas** — オーバーレイ描画・**編集ページの**ラスタライズ · **Marker Path（ADR-026）**
- **DOM Overlay** — Paper 上の Object 操作（選択・移動・リサイズ・インライン文字 · Input Strip · Marker）

サーバー処理は **禁止**。

---

## Objectモデル（ADR-018 · ADR-025 · ADR-026）

```text
PaperObject
  id, type, page, x, y, w, h
  + text / fontSize / fontFamily   （type=text）
  + src                            （type=image）
  + template / slots[] / fontSize  （type=input-strip）
  + marker                         （type=marker · kind id）
```

Input Strip:

```text
{
  type: "input-strip",
  template: "datetime",
  slots: [
    { id, label, value, dx, dy, w, h },
    ...
  ]
}
```

- Undo / Redo / Delete / Move は Object 単位（スロット個別の履歴は持たない）
- リサイズ対象外（Strip · Marker）
- Template 定義（`INPUT_STRIP_TEMPLATES`）を増やすだけで郵便番号等へ拡張
- slot の **dx のみ** ユーザーが動かせる（ADR-031）。ヒットは **下端グリップ**のみ（本体ドラッグと分離）。終了時に `reflowInputStripX` で親 x/w を再計算。dy 固定

### Marker

`drawMarker(ctx, kind, x, y, w, h)` — Canvas Path 正本。DOM プレビューも同関数。焼き付けも同関数。

### Adaptive Snap（ADR-027 · Paper First）

`collectGuideLines` → page / object を分離。  
`hardSnap1D` + `snapBox(..., strength, held)`。  
Enter / Exit ヒステリシス。紙優先。ドラッグ中のみ吸着。Equal Gap は対象外。

### 日時 parser

`parseDatetimeInput(raw)` — 上記フォーマットを分解。  
令和のまとめて入力でも **年スロットは `令和N` のまま**（西暦にしない。行政書類の既定）。

### Tab

編集中のフォーカス順は template の slots 順。フォーム移動ではなく印字順。

### HitTest · 選択

- DOM の pointer イベントで最前面 Object を掴む
- 空白クリックのみ作成ツールが発動
- Object 上は常に Direct Manipulation（ADR-016）
- Input Strip: 選択中は slot を横ドラッグ。空白領域は親 Move。編集中は input
- Focus Ring / Cursor は ADR-029 / ADR-030

### 描画フロー

```text
pdf.js でページ Canvas
  ↓
Overlay Layer（DOM）で Object 描画
  ↓
ガイド Canvas（ドラッグ中のみ）
  ↓
焼き付け時: 編集ページだけ Canvas 合成 → JPEG → pdf-lib
```

---

## 文字（ADR-017 · 023 · 024）

- `contentEditable` によるインライン入力（`prompt` 禁止）
- fontSize: `clampFontSize`（10–48）· ±ボタン · Ctrl+ホイール
- fontFamily UI: `gothic` | `mincho` のみ（ラベルは「ゴシック」「明朝」）
- 実装スタックは可読性優先（BIZ UD → Noto 等）。UI に実フォント名を出さない

---

## 画像追加（ADR-021 Clipboard First）

優先順:

1. `paste` で clipboard image（Ctrl+V）
2. 紙への `drop`
3. ファイル選択（クリック）

印・画像モードではこの順を UI で明示する。

---

## 画像リサイズ（ADR-022）

- デフォルト: 縦横比固定（`resizeKeepingAspect`）
- Shift 押下中のみ自由矩形
- 黒・白塗りは常に自由矩形
- 設定トグルは持たない

---

## Undo / Redo

- Undo スタック + Redo スタック（焼き付け前のみ）
- 操作開始時にスナップショットを push
- Ctrl+Z / Ctrl+Y（Ctrl+Shift+Z）

---

## 編集画面の高さ（Paper First）

- 編集領域は **`100vh` を最大限利用**する
- A4 表示領域を優先し、不要な余白は持たない
- 編集開始後は「紙」が画面の主役になること（[ux.md](./ux.md)）
- PDFキャンバス内部スクロールは原則実装しない（例外は ADR必須）

---

## 出力パイプライン（焼き付け保存）

```text
編集ページ集合を特定（ページのオーバーレイ数 > 0）
    ↓
ページ順に走査:
  編集ページ → Canvas描画（表示+オーバーレイ）→ 高解像度ラスタ → 画像ページとして追加
  未編集     → 元PDFページを pdf-lib 等でコピー
    ↓
結合した新しいPDF
    ↓
ブラウザダウンロード
```

- 出力は **新しいPDF**（元ファイル上書きではない）
- ページ数・順序は入力と同一
- ユーザー向け文言に「ラスタライズ」は出さない（[ux.md](./ux.md)）

---

## 解像度（編集ページのみ）

- 仕様上の要求は **提出用途で十分な印刷品質** のみ（固定DPIは仕様に書かない）
- 実装の現在値: `EXPORT_DPI = 300`（`pdf-fill-engine.js`）。実測で 250〜350 などへ調整可
- 表示用スケールと書き出しスケールは分離してよい

---

## 複数ページ・メモリ

- **編集ページだけ**高解像度Canvas化する（全ページ同時は禁止）
- 未編集はコピーのため、ラスタ用メモリを消費しない
- 処理済みCanvasは解放する
- 長時間タブ放置時のリークを避ける

---

## 依存の置き方

- 既存 `pdf-images` の pdf.js ベンダー方針に揃える
- `pdf-lib` は `assets/vendor/pdf-lib/`（ピンは README 参照）
- 純関数（ファイル名 · スナップ · 編集ページ判定 · font clamp）は `pdf-fill-engine.js` に分離

---

## 非目標（技術）

- サーバーサイド変換
- 編集ページのテキストレイヤー再構築（OCR復元）
- 未編集ページの再ラスタ
- WebGL必須の高機能エディタ基盤
- PDFビューア型の内部スクロールUI
- レイヤーパネル · オブジェクト一覧 · プロパティパネル
