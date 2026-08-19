# SUGUDASU ページ抜き — 製品仕様 SSOT（v0.1）

**更新:** 2026-08-19  
**ステータス:** **v0.1 実装**（`tools/pdf-pick.html`）  
**Ledger:** [`PRODUCT_IDEA_JUDGMENT_LEDGER.md`](PRODUCT_IDEA_JUDGMENT_LEDGER.md) **§25 GO**  
**id:** `pdf-pick` · URL `/pdf-pick`  
**関連:** 赤入れ（残したページ上の秘匿）· PDF記入（書類全体の提出完成）· PDF画像抽出（埋め込み画像）

> **一言:** 複合機でまとめてスキャンした PDF から、**渡していいページだけ**を選んで新しい PDF にする。結合・回転・圧縮・OCR・黒塗りではない。非送信。元ファイルは端末メモリのみ（IndexedDB に置かない）。

---

## 1. 製品境界（Job）

| 向く | 向かない |
|------|----------|
| 一括スキャンに他案件・個人情報ページが混ざった束から、渡すページだけ残す | PDF Toolbox（結合・回転・圧縮の箱） |
| アップロード型サイトにスキャンを預けたくない | 読書ビューワ（分割表示 · duo-reader / FRACTO） |
| ページ単位で残す／落とす | ページ上の黒塗り・ぼかし（→ 赤入れ） |

**ユーザー向け一言:**  
「渡すページを選んで、1つの PDF にします。ファイルはサーバーに送りません。」

**導線:**

```text
スキャンPDF → ページ抜き →（handoff）PDF記入 →（任意）印鑑
残したページの上を隠すなら、赤入れは別途
```

ページ抜きから PDF記入へは、切り出し後の PDF を端末内で 1 回だけ渡す（`sg-pdf-handoff`）。元のスキャン束は置かない。ウィザード化しない。

---

## 2. v0.1 Must / OUT

### Must

| 項目 | 内容 |
|------|------|
| 入力 | PDF **1ファイル** · ドロップ / クリック |
| 上限 | `sg-pdf-limits`（40MB / 50ページ）。超過は拒否。自動で部分処理しない |
| 選択 | サムネをクリックして残すページを選ぶ。既定は **未選択**（オプトイン）。「すべて選ぶ」「すべて外す」あり |
| 出力 | 選んだページだけを **文書順** で 1 つの PDF（pdf-lib `copyPages`。ラスタ化しない） |
| ファイル名 | `{元ベース名}_{件数}p_{HHmmss}.pdf` |
| 非送信 | `data-sg-privacy-badge` · `data-subject="PDF"` |
| PC | Desktop-first バナー |
| エンジン | `sg-pdf-vendor`（pdf.js サムネ · pdf-lib 組立） |

### OUT（v0.1）

- 結合・回転・圧縮・OCR・ページ並べ替え
- 51ページ超の窓処理（開始ページ指定でスライス）· 複数回の結果マージ
- 黒塗り・ぼかし（赤入れ）· 記入（PDF記入）
- 元 PDF の上書き · IndexedDB / Continue Later
- 複数 PDF 一括 · パスワード PDF の解除
- AI による「渡してよいページ」判定

---

## 3. UI（必須体験）

1. PDF を選ぶ  
2. サムネ一覧。クリックで残す／外す  
3. 「選んだページをPDFにする」（ダウンロード）または「PDF記入で続ける」（切り出し後だけを 1 回渡す）  
4. タブを閉じると元のスキャン束は消える。handoff は記入側が読んだら消える  

レイアウト系統: **B（ワイド）** — サムネグリッドが主役。[`PAGE_LAYOUT_SELECTOR.md`](PAGE_LAYOUT_SELECTOR.md)

---

## 4. 失敗・注意

| 状況 | 文言の方針 |
|------|------------|
| 非 PDF | PDF を選んでください |
| 40MB 超 / 51p 超 | 上限を超えている。部分処理はしない |
| 暗号化・破損 | 開けない（パスワード付きは対象外） |
| 0ページ選択 | 主 CTA 無効。エラーにしない |

FAQ: スキャンの文字認識（OCR）はしない。設定ONでも文字レイヤが無いことがある。あれば copyPages で残す。残したページの個人情報は赤入れへ。結合・圧縮はしない。

---

## 5. UIUX_DECISION_BLOCK

```text
[UIUX_DECISION_BLOCK]
product_id: pdf-pick
completion_model: bake_download
product_voice: fast_utility
copy_success_mode: point_confirm
lead_profile: light
continue_later: no
has_file_drop: yes
cta_order: S1 > S2 > S3 > S4
S1_action: PDFをドロップ
S2_action: 渡すページをクリック
S3_action: 選んだページをPDFにする（DL）
S4_action: （任意）PDF記入へ（1回限り handoff）
```

Continue Later を置かない理由: 入力に他案件・個人情報が混ざる。残すと事故になる。  
handoff は切り出し**後**のバイトだけを IndexedDB に置き、PDF記入が読んだら消す。元束は置かない。
