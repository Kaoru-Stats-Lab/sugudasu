# ADR-007

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff Parser Architecture v0.1 |
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board |
| **Architecture ID** | ADR-007（Export = ADR-006） |
| **Related** | ADR-002 SLIR · ADR-003 Matcher · ADR-004 Delta · ADR-001 Origin · 次 ADR-008 Normalizer |
| **詳細** | [`parser-design.md`](parser-design.md) |
| **旧詳細ファイル** | [`parser-architecture.md`](parser-architecture.md)（本 Pack は design を正とする） |

> **Parser は SLIR を作らない。** SLIR に変換可能な素材（Raw Document Model）を抽出する。  
> OSS 選定は有名度ではなく、**SLIR 生成に必要な情報から逆算**する。Accepted 変更禁止。コード禁止。

---

## 1. Status

**Proposed**

---

## 2. Context — 正しい依存関係

設計上の正本:

```text
Input Format
    ↓
Format Parser              ← 本 ADR
    ↓
Raw Document Model         ← SLIR ではない
    ↓
SLIR Normalizer            ← ADR-008
    ↓
SLIR v0.1
    ↓
Matcher Engine
    ↓
Delta Tree
    ↓
Renderer / Export
```

「Document → Parser → SLIR」と短絡すると、形式差が比較核へ漏れる。

---

## 3. Decision

1. Parser 責務 = 形式解析 · 構造/Metadata/Origin 抽出のみ。
2. Parser 禁止 = Diff · Stable ID · ChangeKind · UI · AI 重要度 · SLIR Node の最終確定。
3. **Output = Raw Document Model**（共通契約）。SLIR ではない。
4. DOCX = **Hybrid（Option C）** — 主経路 JSZip + OpenXML。mammoth = Simple 補助。docx-preview = **表示用 · Parser 主経路にしない**。
5. PDF = **pdf.js**（描画情報。完全 Paragraph/Table 復元は保証しない）。
6. HTML = DOMParser。Markdown = remark/unified → mdast（mdast ≠ SLIR）。
7. Track Changes は Product 未確定 · **採用の唯一根拠にしない**。MVP は完全対応しない。
8. Origin は隔離（ADR-001 / P6）。比較ロジックへ混入禁止。

---

## 4. Responsibility

| YES | NO |
|-----|-----|
| Input format 解析 | 差分計算 |
| 構造情報抽出 | Stable ID 生成 |
| Metadata 抽出 | ChangeKind 判定 |
| Origin 情報保持 | UI 表示判断 |
| Normalizer へ渡す | AI 判断 · 重要度判定 |

---

## 5. SLIR 必要情報から逆算（DOCX 評価軸）

Normalizer / SLIR が要求するもの → Parser が供給すべき素材:

| SLIR / Normalizer 需要 | mammoth | OpenXML (JSZip) | docx-preview |
|------------------------|---------|-----------------|--------------|
| Paragraph | ○（HTML 経由） | ○ | 表示向き |
| Heading | △ | ○ | 表示向き |
| Text | ○ | ○ | ○ |
| Style（TextRun 比較） | △弱い | ○ | 表示向き |
| Table Atomic | △ | ○（要約用） | — |
| Comment / Annotation | △ | ○候補 | — |
| Track Changes | ×不足 | 将来抽出可 | — |
| Origin（xmlPath 等） | △ | ○ | — |

**結論:** 比較正本経路は OpenXML 抽出。mammoth は Semantic 簡易経路。docx-preview は Viewer 参考であり Parser Architecture の主採用ではない。

Track Changes を理由に OpenXML を選んだわけではない。**Style/Text 分離と Origin** が主因。

---

## 6. Format Decisions

### DOCX — Option C Hybrid

- **主:** JSZip → `document.xml` → DOMParser → Raw blocks  
- **補助 Simple:** mammoth.js（SLIR SSOT にしない）  
- **不採用（Parser 主）:** docx-preview  

### PDF — pdf.js

Text · Font · BoundingBox · Page。Reading order / Layout は不完全でありうる。Block 化は Normalizer。

### HTML — DOMParser（+ 必要時 DOMPurify）

### Markdown — remark / unified（mdast は素材）

---

## 7. Parser Output Contract

```text
Raw Document Model
{
  format,
  metadata,
  blocks[],
  originMetadata
}
```

**SLIR ではない。** 詳細型: [`parser-design.md`](parser-design.md)

---

## 8. Origin Metadata

保持例: source format · page number · xml reference · coordinates  

禁止: Matcher / Diff / ChangeKind への混入。

---

## 9. Track Changes

| 方針 | 内容 |
|------|------|
| MVP | 完全対応しない |
| Metadata 候補 | OpenXML 経路で将来 `<w:ins>`/`<w:del>` を Raw に載せうる |
| Product | 未確定 · 本 ADR で Scope 拡張しない |

---

## 10. Phase1 / Phase2

**Phase1:** 上記 Format · Raw Model · Hybrid DOCX · pdf.js · Atomic Table 素材 · Annotation 素材  

**Phase2:** Track Changes 本対応 · Cell 構造の完全抽出 · PDF 高忠実 Layout 復元保証  

---

## 11. Open Questions（隔離）

| ID | 内容 | 送り先 |
|----|------|--------|
| OQ-N1 | Normalizer が要求する Raw フィールドの最終一覧 | **ADR-008** |
| OQ-TC | Track Changes Product 採否 | Product |
| OQ-SIMPLE | mammoth Simple を UI 露出するか | Product / Renderer 周辺 |

※ 「Normalizer 要求情報を先に確定した方が手戻りが少ない」— ADR-008 で Raw 契約を締め、必要なら本 ADR を最小改訂する。

---

## 12. Rejected

- Parser が SLIR を直接完成させる  
- 全形式 HTML 化比較  
- PDF 画像のみ  
- AI Document Understanding  
- Track Changes を採用の唯一根拠にする  
- Stable ID / Diff / ChangeKind を Parser に置く  

---

## Validation

| 完了条件 | 結果 |
|----------|------|
| Format 責務境界 | OK |
| OSS / Build 範囲 | OK |
| Output Contract（非 SLIR） | OK |
| SLIR 境界 | OK |
| Phase1/2 | OK |
| 未確定隔離 | OK |

---

## Intent

汚い入力から、比較可能な意味構造へ渡す**素材**だけを取る。競争領域は Normalizer（ADR-008）にある。

次: **ADR-008 Normalizer Architecture** — Paragraph/Heading/空行/PDF 文章化/形式横断 SLIR。
