# ADR-005 Smart Diff Renderer Architecture v0.1

| 項目 | 値 |
|------|-----|
| **Status** | **Superseded as canonical** → [`ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md`](ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md) |
| **Date** | 2026-08-06 |
| **Title** | Smart Diff Renderer Architecture（先行草案） |
| **詳細** | [`renderer-architecture.md`](renderer-architecture.md) · **正本候補 design:** [`renderer-design.md`](renderer-design.md) |

> 本 ADR-005 は先行草案。**Renderer 正本候補は ADR-010**（View Model 必須 · Review First · 009 Adopt 後）。  
> Delta-only · 2 ペイン + Navigator 等の判断は 010 が継承。

---

## Status

Proposed

---

## Architecture Position

```text
Parser → Normalizer → SLIR → Matcher → Delta Tree → Renderer → User
```

**入力:** Delta Tree のみ。

禁止:

- SLIR 直接参照
- Parser metadata 依存（差分判断）
- OpenXML 依存
- PDF 座標依存による差分判断
- Renderer 内での再 Diff / Score 再計算

Origin（page/bbox）は **ハイライト Overlay の配置**に限り ADR-001 経路で利用可。比較し直さない。

---

## Purpose

北極星:

> 変更点を示すことで、確認作業そのものを短縮する。

Renderer は「全文を美しく表示する Viewer」ではない。

ユーザーが次の状態になること:

1. どこが変わったか分かる
2. 変更前後を比較できる
3. 確認漏れなく判断できる（おおよそ実務 3 分確認を目指す HCI）

---

## Decision（必ず結論化）

| # | 論点 | 結論 |
|---|------|------|
| 1 | MVP 表示方式 | **2 ペイン比較（Before \| After）+ Change Navigator** |
| 2 | Delta → UI Mapping | kind / confidence / changeReason / summary のみ表示翻訳 |
| 3 | Change Navigation | 次・前・一覧・種別フィルタ（Delta Tree 走査） |
| 4 | Highlight 粒度 | 確認単位（条・段落・1年→2年）。文字単位 `[間]` を正としない |
| 5 | Noise Filter v0.1 | 初期は内容変更のみ。書式・コメントはトグル（OFF 既定可） |
| 6 | PDF Overlay | pdf.js 表示 + Delta 由来 Highlight。座標は判定に使わない |
| 7 | 非対象 | Word クローン · Infinite Canvas · AI 要約 · Mobile 最適化 · 共同編集 |

---

## Layout Decision

### 比較検討

| 案 | 内容 | 判定 |
|----|------|------|
| A. Before \| After（同期）+ Navigator | 消えた/変わったを同時比較 · 変更一覧でジャンプ | **採用（MVP）** |
| B. Before / Diff / After の 3 等分コンテンツ | 中央 Diff 専用ペイン | **不採用**（情報過多 · 文脈不足） |
| C. 単一 Redline のみ | Word 風 | Phase2 候補 · MVP 非採用 |

採用レイアウト（2 ペイン + Navigator。見た目は「3 領域」でも中央 Diff 専用ではない）:

```text
┌──────────────┬──────────────┐
│ Before       │ After        │
│ 変更前       │ 変更後       │
├──────────────┴──────────────┤
│ Change Navigator             │
└─────────────────────────────┘
```

理由: 実務者は「何が消えたか」「何に変わったか」を同時に見る。Navigator は探させないための必須。中央にアルゴリズム Diff だけを置く 3 画面は採用しない（旧 ADR 判断を維持）。

---

## Core UX — Difference First

初期表示は **変更箇所中心**。全文閲覧は補助。

禁止: 変更なし文書を最初から全文表示し、ユーザーに探させる。

情報階層:

```text
変更箇所 → 変更内容 → 周辺文脈 → 元文書
```

---

## Change Navigation

Delta Tree 利用。必須:

- 次の変更 / 前の変更
- 変更一覧
- 変更種別フィルタ: Added · Deleted · Modified · Candidate

クリック → 該当 Delta へ Jump（Delta Anchor）。

---

## Highlight Rule（要約）

| kind | 表示 |
|------|------|
| Modified | Before/After + 差分強調（例: 1年 → 2年） |
| Added | After のみ |
| Deleted | Before のみ |
| Candidate | 通常変更と区別（例:「自動判定候補 · 確認してください」） |

詳細: [`renderer-architecture.md`](renderer-architecture.md)

再 Diff 禁止。Delta 内情報のみ。

---

## Noise Control / Sync / PDF / A11y / Responsive

- Noise: 文字・追加削除・書式・コメントのフィルタ設計。v0.1 UI は限定実装可。初期 = 内容変更のみ
- Sync: Scroll / Section / Change Jump。**単純 scrollTop 同期禁止** → Delta Anchor Sync。共同編集・WS/WebRTC 禁止
- PDF: pdf.js + Overlay。座標は判定に使わない
- A11y: 色だけ禁止 · 文字ラベル · キーボード
- Responsive: **Desktop 優先** · スマホ最適化対象外
- Browser: Only · No Upload · Local · No Account

---

## Rejected Alternatives

- 完全な Word 互換 UI（規模過大）
- Infinite Canvas（探索負荷）
- AI 要約 Diff（No AI Required）
- Before/Diff/After 3 等分
- Renderer 内再 Diff
- 表示都合の Engine 逆流

参考思想のみ: GitHub Diff UI · Docs Suggesting · Word Compare（クローンにしない）。

---

## Validation（完了条件）

| 項目 | 結果 |
|------|------|
| Renderer が Delta Tree のみを見る | OK |
| Diff 判断ロジックを持たない | OK |
| 実務確認時間短縮につながる（Difference First） | OK |
| Word クローン化していない | OK |
| SUGUDASU 制約と一致 | OK |
| Phase2 拡張余地あり | OK（Redline 単一 · Mobile 等） |

---

## Intent

技術的に比較できる状態を、実務者が短時間で確認できる表示へ落とす。比較核を汚さない。

次工程（プロンプト案）: Parser Architecture。**採番注意:** Export が既に ADR-006 Proposed。Parser は別番号または Board 再採番。
