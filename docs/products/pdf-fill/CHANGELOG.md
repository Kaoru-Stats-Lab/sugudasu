# SUGUDASU PDF記入 — 設計 CHANGELOG

プロダクト設計ドキュメントの変更履歴。  
実装の `data/changelog.json`（ユーザー向け更新履歴）とは別。必要に応じて両方へ載せる。

---

## 2026-07-24 — 保存ボタン · 安心文（思想語の整理）

### 種別

UX · 文言

### 要約

主ボタンを「焼き付け保存」→ **保存** に。固定・OCR・黒塗り・非送信の安心文をボタン直上に置く。確認ダイアログは「保存の確認」。完了は「提出用PDFが完成しました」のまま。内部用語「焼き付け」は technical-design のみ。

### 影響

- `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `ux.md` · `specification.md` · `decisions.md`（ADR-006）· `philosophy.md` · `faq.md`

---

## 2026-07-23 — Paper First Snap UX（Hard · 紙優先 · ヒステリシス）

### 種別

UX（アルゴリズムのみ）

### 要約

Snap を「ガイドに吸う」から「紙に吸い付く」へ再設計。紙中央・四辺を Object より優先。Hard Snap（Enter≈9 / Exit≈15）· 速度連動維持 · ガイドは吸着中のみ控えめ表示。Equal Gap・設定UI・ライブラリは入れない。

### 影響

- `assets/pdf-fill-engine.js` · `assets/pdf-fill-app.js` · `decisions.md`（ADR-027）· `technical-design.md` · `ux.md`

---

## 2026-07-22 — 日時 Object コピペ · 再編集

### 種別

バグ修正 + UX

### 要約

Ctrl+V が電子印の画像クリップボードに負けて日時を貼れない問題を修正（Object クリップボード優先。印は「印・画像」タブ）。Ctrl+D / 貼り付け直後は編集モードへ。選択済みをもう一度クリック、または Enter でも書き直し可能に。

### 影響

- `assets/pdf-fill-app.js` · `specification.md`

---

## 2026-07-22 — 日時 slot 横寄せ · グリップ分離

### 種別

バグ修正 + UX

### 要約

Alt+ドラッグ依存をやめ、選択中スロットの下端グリップで横寄せ。本体ドラッグは Object 移動のまま。ドラッグ中は `reflowInputStripX` せず、pointerup で確定（紙面ジャンプ防止）。

### 影響

- `assets/pdf-fill-app.js` · `tools/pdf-fill.html` · `specification.md` · `decisions.md`（ADR-031）

---

## 2026-07-22 — 削除×クリップ · Markerサイズ · Objectコピペ

### 種別

バグ修正 + UX

### 要約

日時の削除×が overflow で切れる問題を修正。Marker（楕円等）はサイズ変更可（角ハンドル · －/＋ · Ctrl+ホイール）・線を細くして下の文字を残す。文字・日時・Marker 等は Ctrl+C/V（または Ctrl+D）で同一紙面へ複製。

### 影響

- `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js` · `tools/pdf-fill.html` · `specification.md`

---

## 2026-07-22 — 日時 · 元号のまま + 文字サイズ

### 種別

仕様修正 + UX

### 要約

年スロットは「令和7」を西暦に変換しない（行政書類の既定）。日時 Object でも文字サイズ・書体を調整可能にし、スロット下端の見切れを防ぐ。

### 影響

- `assets/pdf-fill-engine.js` · `assets/pdf-fill-app.js` · `specification.md`

---

## 2026-07-22 — Input Strip · IME / はみ出し / 順序固定

### 種別

バグ修正 + UX明確化

### 要約

日時スロット: IME変換中は Tab を奪わない。紙面外クランプ。横寄せは許可するが年↔月の入れ替えは禁止（書く順を固定）。年の「令和7」を西暦へ正規化。

### 影響

- `assets/pdf-fill-engine.js` · `assets/pdf-fill-app.js` · `tools/pdf-fill.html`
- `specification.md` · `decisions.md`（ADR-031 帰結追記）

---

## 2026-07-22 — Paper First v3.2 · サンプル文言統一（ファイル名）

### 種別

仕様 + UX + 実装

### 要約

完成PDFのファイル名UIを統一。書類名「例）〇〇申請書」· 利用者名（任意）「例）薫」。日付は `YYYY-MM-DD`。プレビューとダウンロードは同一関数。SUGUDASU全体のサンプル人物名は佐藤薫（本ツールのファイル名用は薫）。

### 影響

- `specification.md` · `ux.md` · `README.md`
- `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js`

---

## 2026-07-22 — Paper First v4 · UX磨き込み + Input Strip 横調整

### 種別

思想 + 仕様 + 実装

### 要約

機能追加ではなく「紙へ書く心地よさ」の磨き込み。Marker Palette（文字ツール内記号 · Canvas Path）· Adaptive Snap · Calm Motion · Unified Focus Ring · Cursor Language。Input Strip の slot は横方向のみ個別調整（ADR-031）。図形ツール・プロパティパネルはしない。

### 影響

- ADR-026〜031 · `philosophy.md` · `specification.md` · `ux.md` · `technical-design.md` · `README.md` · `faq.md`
- `assets/pdf-fill-engine.js` · `assets/pdf-fill-app.js` · `tools/pdf-fill.html`

---

## 2026-07-22 — Paper First v3 · Input Strip

### 種別

思想 + 仕様 + 実装

### 要約

**Input Strip** 導入（ADR-025）。複数印字位置を一つの入力のまとまりとして扱う。UIは「日時」のみ。年・月・日・時・分。パース入力 · Tab は紙を書く順。フォーム認識・OCRはしない。

### 影響

- `philosophy.md` · `specification.md` · `ux.md` · `technical-design.md` · `decisions.md` · `README.md`
- `assets/pdf-fill-engine.js` · `assets/pdf-fill-app.js` · `tools/pdf-fill.html`

---

## 2026-07-22 — FAQ（オンボーディング）

### 種別

ドキュメント + プロダクトページ

### 要約

FAQ を「機能説明」ではなく、安心・思想・使い方のオンボーディングとして整備。正本 `faq.md`。ツールページは `<details>` 折りたたみ。送信しない・元PDFは残る・提出用完成が自然に伝わる構成。

### 影響

- `faq.md` · `README.md` · `CHANGELOG.md`
- `tools/pdf-fill.html`（FAQ · JSON-LD）

---

## 2026-07-22 — 透過印影 · A4 fit · テキスト枠

### 種別

バグ修正 + UX純化

### 要約

クリップボード印影の黒背景を除去（PNG優先 + 近黒ノックアウト）。PDF表示を stage にフィットさせ領域内スクロールをやめる。テキストの × を枠外へ、四隅リサイズを追加。**Enterは改行**、確定は外クリック / Ctrl+Enter。

### 影響

- `ux.md` · `CHANGELOG.md`
- `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js`

---

## 2026-07-22 — Paper First v2+

### 種別

思想純化 + 実装

### 要約

**Clipboard First**（エコシステム連携）· **Image Natural Resize**（縦横比固定が標準、Shiftで自由変形）· **Minimal Font UI** · **Readable Default Font**（内部BIZ UD系、UIは明朝/ゴシックのみ）。印・画像の案内を Ctrl+V 優先に整理。

### ADR

| 番号 | 内容 |
|------|------|
| ADR-021 | SUGUDASU Ecosystem Clipboard First |
| ADR-022 | Image Natural Resize |
| ADR-023 | Minimal Font UI |
| ADR-024 | Readable Default Font |

### 影響

- `philosophy.md` · `specification.md` · `ux.md` · `technical-design.md` · `decisions.md` · `README.md`
- `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js`

---

## 2026-07-22 — Paper First v2

### 種別

UX純化 + 実装（機能追加ではない）

### 要約

Paper First を強化。**Object Direct Manipulation · Inline Text Editing · Unified Object Model · Clipboard First · White Mask redesign · Minimal Typography**。文字は紙上インライン。画像は Ctrl+V 優先。白塗りは枠なし。移動ツールなし。明朝/ゴシックと大きさのみ。

### ADR

| 番号 | 内容 |
|------|------|
| ADR-016 | Object Direct Manipulation |
| ADR-017 | Inline Text Editing |
| ADR-018 | Unified Object Model |
| ADR-019 | Minimal Typography |
| ADR-020 | Minimal Font Selection |

※ ADR-015 は既存の Calm UX（番号は変更しない）

### 影響

- `philosophy.md` · `specification.md` · `ux.md` · `technical-design.md` · `decisions.md` · `README.md`
- `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js`

---

## 2026-07-22 — Calm UX · 入口安心感 · 触感契約

### 種別

設計 + 軽微実装（文言・触感）

### 要約

上位原則 **Calm UX（ADR-015）** を追加。「迷う時間を消す」。入口を「提出するPDFを置く」＋安心チェックリストへ。読込は「提出用紙を準備しています」。スナップは最後5pxで決まる紙感、ガイドはドロップ後0.2秒で消える、置けた一瞬の青光、黒塗りは墨の矩形、完成は3段階（見出し→焼き付け保存→完成）。Paper First（空間）と Calm UX（時間）を両輪と明記。

### 影響

- `philosophy.md` · `ux.md` · `decisions.md` ADR-015 · `README.md` · `CHANGELOG.md`
- `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js`

---

## 2026-07-22 — 編集ページ定義 · Paper First · ADR-014

### 種別

設計明確化（αで見えたUX課題の仕様化）

### 要約

「編集ページ」を **オーバーレイオブジェクト数 > 0** と正式定義し、全削除で未編集へ戻るライフサイクルを仕様化。UI思想に **Paper First**（PDFビューアではなく A4 へ書く）を追加。PDF領域内スクロール禁止、ToolbarはA4直上、サムネは編集状況可視化、編集領域は100vh優先を明文化。ADR-014を追加。

### 主な決定

| 項目 | 内容 |
|------|------|
| 編集ページ | テキスト／印／画像／黒／白が1つ以上。開く・ズーム・選択のみは非編集 |
| ライフサイクル | 未編集 → 追加で編集済み → 全削除で未編集 |
| Paper First | Viewer ではなく Paper。迷ったら Paper を優先 |
| スクロール | PDF内部スクロール原則禁止（例外はADR） |
| レイアウト | Header · Toolbar（A4直上）· A4 · Footer |
| サムネ | ナビのビューア化ではなく編集印の可視化 |

### 影響ドキュメント

- `overview.md` · `specification.md` · `philosophy.md` · `ux.md`
- `technical-design.md` · `decisions.md`（ADR-014）· `README.md`

---

## 2026-07-22 — オブジェクト操作UX（移動タブ廃止）

### 種別

設計変更 + 実装

### 要約

作成ツールと選択を分離。「移動」タブを廃止し、置いたオブジェクトは常時掴めるようにする。個別削除、文字の文言差し替え、黒白リサイズを最小再編集として採用。フル編集UIは Reject。

### 理由

移動タブ必須はモード税で迷いを増やす。提出前の手直しには消す・ずらす・直すが必要だが、編集ソフト化はしない。

### 影響

- `ux.md` · `specification.md` · `decisions.md` ADR-012/013
- `assets/pdf-fill-app.js` · `tools/pdf-fill.html`

---

## 2026-07-22 — α実装を編集ページのみ固定へ · 確認・サムネ

### 種別

実装追随（仕様整合）

### 要約

全ページラスタのα実装を改め、編集ページのみ固定・未編集は元ページコピーに変更。確認ダイアログに不可逆文言、左サムネ編集印、編集0件ガードを追加。見出し「提出用PDFを完成」とボタン「焼き付け保存」を分離。印刷品質の仕様は固定DPIではなく「提出用途で十分な品質」とし、実装値は当面300dpi。

### 実装

- `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js` · `tools/pdf-fill.html`

---

## 2026-07-22 — 編集ページのみ固定（焼き付け保存）

### 種別

設計変更（Breaking for α 実装）

### 要約

保存＝全ページラスタライズを廃止し、**編集済みページだけ見たまま固定**、未編集ページは **元PDFをコピー** する方式へ変更した。

### 変更理由

提出用途では編集ページは一部であることが多い。それでも出力は **書類全体** である必要がある。  
未編集ページまで画像化するのは、容量・検索性・速度の面で過剰であり、引き算の美学に反する。  
固定（提出用の見たまま化）が必要なのは編集したページだけである。

### 主な決定

| 項目 | 内容 |
|------|------|
| 出力ページ数 | 元PDFと同じ（順序維持） |
| 編集ページ | オーバーレイ込みで固定（画像ページ） |
| 未編集ページ | 元ページをコピー |
| 見出し | **提出用PDFを完成** |
| ボタン | **焼き付け保存** |
| 確認UI | 編集ページ一覧 + 見たまま固定 + **あとから変更不可** + 元PDF保持 |
| サムネ | 編集済みに鉛筆・青い点 |
| 保存方式 | 一つだけ（派生保存は将来検討） |
| 印刷品質 | 仕様は「提出用途で十分」。実装DPIは固定必須にしない |

### 影響ドキュメント

- `overview.md`（新設）
- `specification.md`
- `ux.md`（新設 · `ui-ux.md` から正本移転）
- `philosophy.md`
- `technical-design.md`
- `decisions.md`（ADR-007 改訂 · ADR-011 追加）
- `README.md`（地図更新）

### 実装への影響

α v0.1.0 の「全ページ raster → embed」は本仕様と不一致。  
実装タスクは overview / 本レポート末尾のリストを参照。

---

## 2026-07-22 — 初版設計ドキュメント一式

### 種別

初版

### 要約

`docs/products/pdf-fill/` に思想・仕様・UI・技術・ADR を新設。台帳 §19 で GO。  
当時の保存モデルは全ページラスタ（本日付の条目で改訂）。
