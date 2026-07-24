# SUGUDASU PDF記入 — 概要

**仮 id:** `pdf-fill`  
**プロダクト名:** SUGUDASU PDF記入  
**ステータス:** **GO** · **α v0.1.0 実装済**（本番 deploy は未）· **仕様更新 2026-07-22（編集ページ定義 · Paper First）**  
**判定:** [`PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) **§19** · Tier A  
**憲法:** [`PRODUCT_CONSTITUTION.md`](../../product/PRODUCT_CONSTITUTION.md)  
**Backlog:** [`BACKLOG.md`](../../BACKLOG.md) §1-16  
**実装:** `tools/pdf-fill.html` · `assets/pdf-fill-app.js` · `assets/pdf-fill-engine.js`  
**変更履歴:** [CHANGELOG.md](./CHANGELOG.md)

> 入口ポインタ: [README.md](./README.md) も同概要を参照可。本文の正本は本ファイル群。

---

## 一文

提出用PDFを、ブラウザ内だけで完成させるツール。  
**編集ページだけ**見たまま固定し、未編集ページは元PDFのまま残す。  
体験の基準は PDF Viewer ではなく **A4用紙へ書く（Paper First）**。  
時間の基準は **迷う時間を消す（Calm UX）**。

---

## 目的

年に数回しか触らない提出書類を、**印刷→手書き→スキャン**せずに終わらせる。

| やる | やらない |
|------|----------|
| テキスト追加 | 既存文字の編集・フォント置換 |
| 印鑑・画像の貼付 | ページ並べ替え・結合・分割 |
| 黒塗り・白塗り | フォームフィールド設計 |
| **編集ページのみ**固定して提出用PDFを生成 | 全ページの無差別画像化 · クラウド保存 · PDFビューア化 |

---

## 編集ページとは（定義）

**編集ページ** = そのページ上のオーバーレイオブジェクト数が **1以上** のページ。

配置対象（いずれか1つ以上）:

- テキスト
- 印鑑
- 画像
- 黒塗り
- 白塗り

**編集と見なさない:**

- ページを開いただけ
- 拡大縮小
- スクロール
- ページ送り
- オブジェクトを選択しただけ
- 一度置いたが **全削除** された状態（再び未編集）

焼き付け保存で固定されるのは、この定義の編集ページのみ。詳細と状態遷移は [specification.md](./specification.md)。

---

## 競合の定義

| ではない | である |
|----------|--------|
| Adobe Acrobat | **印刷 → 手書き → スキャン** |
| Foxit | 複合機での再取り込み |
| 汎用PDFエディタ・PDFビューア | 「提出できる形にする」手間そのもの |

---

## ターゲット

- 行政提出・保険・契約書・履歴書・見積書など、**年数回だけ** PDF に記入する人
- ソフトをインストールしたくない人
- 書類を外部サーバーへ上げたくない人

---

## 制約

- ブラウザ完結 · 完全ローカル · 送信なし · インストール不要

---

## 保存の核心（2026-07-22）

出力は **書類全体**（ページ数は元と同じ）。  
固定（見たまま化）するのは **編集ページだけ**（定義上記）。  
未編集ページは元PDFをコピーし、容量・検索・コピー可能性を保つ。

詳細: [specification.md](./specification.md) · 思想: [philosophy.md](./philosophy.md) · Paper First: [ux.md](./ux.md) · ADR-014

---

## ドキュメント地図（MECE）

| ファイル | 責務 |
|----------|------|
| [overview.md](./overview.md) | 本ファイル · 概要 |
| [philosophy.md](./philosophy.md) | なぜ作るか · 引き算 · Paper ≠ Viewer · 将来検討 |
| [specification.md](./specification.md) | 振る舞い（What）· 編集ページ定義 · ライフサイクル |
| [ux.md](./ux.md) | Paper First · 操作感 · 文言 |
| [faq.md](./faq.md) | FAQ · 安心・思想・使い方のオンボーディング |
| [CHANGELOG.md](./CHANGELOG.md) | 設計変更履歴 |
| [technical-design.md](./technical-design.md) | 技術パイプライン · 編集領域高さ |
| [decisions.md](./decisions.md) | ADR |
| [ui-ux.md](./ui-ux.md) | → **ux.md へ移転**（互換ポインタ） |

関連ツール: `stamp` · `mask` · `pdf-images`
