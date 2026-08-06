# Cursor Task: ADR-008 Normalizer Architecture CREATE TASK

**用途:** Cursor 投入用 COPYPASTE  
**成果物:**
- `docs/architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md`
- `docs/architecture/normalizer/normalizer-design.md`

**絶対条件:** Accepted 変更禁止 · Parser≠Normalizer≠SLIR  
**推奨（本投入で確定候補）:** Option C — `TextNode` + `styleSegments[]`（Word Run を SLIR に漏らさない）

**後工程順:**

```text
ADR-008 Normalizer
  ↓
ADR-009 SLIR Schema Accepted化（TextRun vs TextNode+segments を閉じる）
  ↓
ADR-010 Renderer（先に行かない）
```

---

# 以下を Cursor に投入

```markdown
# Smart Diff ADR-008 Normalizer Architecture CREATE TASK

## Role

あなたは SUGUDASU Smart Diff の Software Architect です。
目的は Normalizer Architecture（ADR-008）を Proposed ADR として定義することです。
実装コード・Implementation Plan は禁止。Architecture Decision Record のみ。

---

# 絶対条件

- 既存 Accepted ADR を書き換えない（矛盾は Proposed 差分 / Open Question）
- Parser は Raw Document Model まで（ADR-007）。Normalizer が SLIR を作る
- Matcher / Delta / Renderer の責務を侵食しない
- AI 意味理解・重要度判定を Normalizer に置かない

---

# パイプライン正本

```text
Input Format
  → Format Parser → Raw Document Model（format-dependent）
  → Normalizer（本 ADR）→ semantic reconstruction
  → SLIR v0.1
  → Matcher → Delta → Renderer / Export
```

## 責務対比

Parser:
> 「ファイルに何が書いてあるか取得する」

Normalizer:
> 「比較可能な意味単位へ再構成する」

禁止例:
DOCX の `<w:p>` / `<w:r>` / `<w:t>` をそのまま SLIR へ流すこと。

---

# 必須決定事項

## 1. Normalizer 責務境界

YES:
- Raw → 意味単位（Heading / Paragraph / List / Table Atomic / Image / Annotation Attach）
- Text 正規化（normalizedText 方針）
- Style の比較用抽象化
- PDF Geometry → Block 推定（Loss Aware）
- Loss / confidence の付与

NO:
- Diff / Identity Score / ChangeKind
- Stable ID
- UI / Export
- OpenXML 型の SLIR 露出

---

## 2. TextRun 問題の解決（本 ADR の核心）

過去 ADR-002 系: Run は Parser 内部吸収、または TextRunNode 公開案あり。

Deep Research: Style 変更検出には Run 相当情報が必要。ただし Word 依存モデル化は避けたい。

### Option A — Paragraph → Text のみ · Style は metadata

- メリット: シンプル · SUGUDASU らしい
- デメリット: Style 差分が弱い

### Option B — Paragraph → TextRunNode

- メリット: Word 比較精度
- デメリット: Word 依存モデルになりやすい

### Option C（推奨 · 本 Task の既定採用候補）

```text
Paragraph
 └ TextNode
      └ styleSegments[]
```

比較単位 = TextNode（意味中心）  
属性 = styleSegments（range + style）

例:

```json
{
  "type": "text",
  "content": "重要事項",
  "styleSegments": [
    { "range": [0, 4], "style": { "bold": true } }
  ]
}
```

要件:
- SLIR は意味中心
- Word `<w:r>` を Node 型として漏らさない
- Style Diff 可能（Delta は changeDetail: style_only 等）

ADR 本文で A/B/C を比較し、**採用を明記**する。
SLIR Schema（ADR-002 Proposed の TextRunNode）との差分は Open Question / ADR-009 Accepted 化へ送る。

---

## 3. Table Atomic 接続

Parser: Table structure を Raw で持てる  
Normalizer: **TableNode（Atomic）** に正規化（summary / contentHash 等）  
Diff Phase1: Table changed まで · Cell Delta 禁止（ADR-004）

tbl/tr/tc を読めても SLIR に Row/Cell Node を出さない。

---

## 4. Loss Aware 具体化

推測はするが、失敗を隠さない。

悪い設計: 低確度でも黙って Paragraph 化  
良い設計: Unknown Block + confidence

例:

```json
{
  "type": "unknown",
  "origin": "pdf",
  "confidence": 0.42,
  "loss": ["reading_order_uncertain"]
}
```

PDF の文字+座標 → Paragraph? の規則と閾値方針を定義（詳細チューニングは OQ 可）。
SLIR P5 Loss Aware / ADR-002 の実装接点として明文化。

---

## 5. Raw → SLIR 境界

各 format の Raw 入力からどの SLIR Node へ写るか対応表を書く。
Deterministic Normalization（同じ Raw → 同じ SLIR）を原則とする。

---

## 6. Style 保持方針

Option C 採用時:
- 全文比較は content
- Style Diff は styleSegments の差分（アルゴリズム詳細は Delta/後続可、保持契約は本 ADR）

空の styleSegments = style 情報なし。

---

# 出力成果物

1. `docs/architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md`
2. `docs/architecture/normalizer/normalizer-design.md`

必要なら Manifest / ARCHITECTURE.md を入口リンクのみ更新。

---

# Open Questions に送るもの

- Identity / Candidate（ADR-003/004 済み領域を再発明しない）
- Track Changes Product
- StyleSegments の range 単位（UTF-16 vs 文字数）の最終規約
- ADR-009 での SLIR Accepted への TextNode 反映

---

# 禁止

- 実装コード
- Renderer 設計の混入
- mammoth HTML を SLIR 正本化
- Table Cell を Phase1 SLIR Node 化
- AI Semantic Normalization

---

# 完了条件

1. Normalizer 責務が Parser/SLIR/Matcher と分離されている
2. TextRun 問題に対する採用 Option（推奨 C）が明記されている
3. Raw→SLIR 境界が明確
4. Loss Aware 規則がある
5. Table Atomic 接続が明文化されている
6. Style 保持方針がある
7. ADR-009 / Renderer への手渡しが書かれている
```
