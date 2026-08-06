# ADR-006: Smart Diff Local Export Architecture v0.1

| 項目 | 値 |
|------|-----|
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Title** | Smart Diff Local Export Architecture |
| **Related** | [`ADR-005-Renderer-Architecture-v0.1.md`](ADR-005-Renderer-Architecture-v0.1.md) · [`adr/ADR-004-delta-tree-model.md`](adr/ADR-004-delta-tree-model.md) · [`../notes/smart-diff/ADR-001-origin-metadata.md`](../notes/smart-diff/ADR-001-origin-metadata.md) |
| **採番注意** | Architecture 一覧の ADR-006 = Export。プロンプト列の「ADR-008 Export」案と同層になりうる。Board で番号統一。 |

> **Print First:** 編集 SaaS 化・クラウド保存化へ寄らない。比較結果を **ユーザー環境内で成果物化**する。  
> 実装コードは書かない。DOCX Track Changes / 元文書書き換えは v0.1 非対応・禁止。

---

## Status

Proposed

---

## Decision

1. Export は比較結果を **Local Only** で成果物化する（サーバーアップロード・クラウド保存・外部 API 送信禁止）。
2. 哲学は **Print First** — 編集ではなく、確認結果を提出・共有できる状態にする。
3. v0.1 対応は **PDF Report Export**（`{original-name}_smart-diff.pdf`）。
4. **DOCX Track Changes Export** は v0.1 非対応（将来検討）。
5. **元 PDF/DOCX の書き換えは禁止**（比較ツールであり編集ツールではない）。
6. PDF 生成ライブラリは **pdf-lib**。責務は生成・ページ・画像・テキスト配置。
7. 正本入力は **Delta Tree**。中間に **DiffReport（Report Model）** を置き、Renderer と Export を分離する。
8. Redline は **Text Redline**（例: `10万円 → 15万円`）。Visual Diff（画像比較）は Phase2。
9. PDF 入力時の Page / Bounding Box は Origin Metadata 経由で位置リンクに使える。**再編集は禁止**。

Pipeline:

```text
Local Document → Browser Memory → Delta Tree → Export → Local Download
```

禁止パイプライン:

```text
Upload → Processing Server → Download
```

---

## Export Philosophy

SUGUDASU:

- Browser First · Local Only
- Print First（確認 → 提出・共有）
- 編集 SaaS / クラウド保存 / 外部 AI・OCR API に寄らない

---

## Export Scope v0.1

### Adopted: PDF Report Export

出力例: `Smart Diff Report.pdf` / ファイル名規約は § File Naming。

内容:

- 文書情報
- 比較日時
- 変更一覧（Summary）
- 差分詳細（Detail · Before / After）
- Text Redline

### Non Goals

| 項目 | 扱い | 理由 |
|------|------|------|
| DOCX Track Changes | 非対応 | OpenXML 依存が大きい · MVP 価値中心ではない |
| Original Document Rewrite | **禁止** | 比較ツールであり編集ツールではない |
| Visual Diff PDF | Phase2 | 計算量大 · Semantic Diff と別軸 |
| Accept/Reject 編集結果の書き戻し | 対象外 | 編集 SaaS 化 |

---

## PDF Export Architecture

利用: **pdf-lib**

責務:

- PDF 生成
- ページ管理
- 画像配置
- テキスト配置

Build 側:

```text
Delta Tree → Report Model → PDF Layout Engine → pdf-lib → Blob → Download
```

---

## Report Model（Renderer と分離）

中間モデル例:

```ts
interface DiffReport {
  title: string;
  summary: DiffSummary;
  sections: ReportSection[];
}
```

- Renderer: 画面表示（Delta Tree）
- Export: DiffReport → PDF
- 両者は UI DOM を共有して PDF 化しない（責務分離）

---

## Report Content

### Cover

- Original file name(s)
- Compare date
- Change count

### Summary

例:

```text
変更: 12件
追加: 3件
削除: 2件
変更（Modified）: 7件
```

### Detail

Delta Tree 順。例:

```text
第3条 契約期間

Before
契約期間は1年間

After
契約期間は2年間
```

---

## Redline Policy

v0.1: **Text Redline**

```text
10万円 → 15万円
```

Visual Difference（ページ画像比較）は Phase2。

---

## PDF Original Handling

PDF 入力時、Origin Metadata で保持しうるもの:

- Page number
- Bounding Box

利用: 変更位置への参照・リンク（レポート内）。

禁止: 元 PDF の再編集・上書き保存。

Diff Engine は Origin を消費しない（ADR-001）。Export / Renderer 層のみ。

---

## Local Privacy / Security

Export 処理は Browser 内完結。

禁止:

- document upload（比較・Export 目的）
- Processing Server
- external analytics with content
- OCR API / AI API（内容送信）

採用:

```text
Local Parse → Local Compare → Local Export → Local Download
```

---

## Large Document Handling

想定: おおよそ 100 ページ程度。

対策方針:

- Web Worker
- Incremental 生成（必要に応じて）
- Memory Release

詳細バジェットは後続 Performance ADR / Note。

---

## File Naming

```text
{original-name}_smart-diff.pdf
```

例: `contract_v2_smart-diff.pdf`

---

## Error Handling

失敗時表示例:

```text
PDF生成に失敗しました。
元データは変更されていません。
```

（書き換え禁止と整合。）

---

## OSS Boundary

| 層 | 方針 |
|----|------|
| PDF 生成 | **pdf-lib**（採用） |
| Report 構築 | Self-build（DeltaTree → DiffReport → Layout） |
| DOCX 出力 | v0.1 なし |

Parser / Normalizer の OSS 境界は **別 ADR（Parser）**。本 ADR は Export のみ。

---

## Forbidden Dependencies

Export 禁止:

- サーバー側 PDF レンダリングサービス
- mammoth / OpenXML による元文書書き換え
- Matcher Score 再計算
- Renderer DOM をそのまま「印刷 PDF」の正本にする（Layout は Report Model 経由）

---

## Non Goals（再掲）

- DOCX Track Changes
- 元文書 Rewrite
- Visual Diff Report（Phase2）
- クラウド保存・共有リンク発行
- 編集 SaaS（コメント返信・承認ワークフローの永続化）

---

## Trade-offs

| 利点 | 代償 |
|------|------|
| Local Only · Print First | Word 変更履歴派には非対応 |
| Report PDF に集中 | 元ファイル上の Redline 再現は弱い |
| Renderer と分離 | 画面と PDF の見た目は完全一致しない |

---

## Open Questions

1. DiffReport の正式スキーマ（型定義の置き場）
2. Noise Control（Renderer トグル）を Export 既定にどう反映するか
3. Origin bbox を PDF Report に図解するか、テキスト参照のみか
4. Sync ラインでの「提出物保管」との境界（本 ADR は Local Download のみ）
5. 採番: Architecture ADR-006 vs プロンプト列の Export 番号

---

## Review Checklist

| 項目 | 結果 |
|------|------|
| Local Only 維持 | OK |
| Print First 維持 | OK |
| 編集ツール化していない | OK |
| DOCX Track Changes を勝手に追加していない | OK |
| pdf-lib 利用範囲明確 | OK |
| Renderer と Export 分離 | OK |
| Delta Tree が正本 | OK |

---

## Intent

比較確認の先に、**提出・共有できる PDF レポート**をブラウザ内で出す。編集 SaaS・クラウド保存・元文書書き換えには寄らない。

次: **Parser Architecture**（DOCX Hybrid · PDF pdf.js · Normalizer Build · OSS 境界）。Export は成果物化のみ。
