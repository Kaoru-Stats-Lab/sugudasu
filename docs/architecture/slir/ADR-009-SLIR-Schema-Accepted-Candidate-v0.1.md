# ADR-009

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff SLIR Schema — Accepted Candidate v0.1 |
| **Status** | **Adopted**（2026-08-06）→ Accepted ADR-002 に反映済み |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board（Architect 推奨 Adopt 承認） |
| **Merged into** | [`../adr/ADR-002-slir-schema.md`](../adr/ADR-002-slir-schema.md) |
| **Schema** | [`schema/SLIR-v0.1.md`](schema/SLIR-v0.1.md) |
| **Brief** | [`BOARD_ADOPT_BRIEF_ADR-009.md`](BOARD_ADOPT_BRIEF_ADR-009.md) |

> Adopt 実行記録。以後の Schema 正本は **Accepted ADR-002**。本ファイルは Decision Log として保持。

---

## Decision

SLIRのテキスト表現は TextNode + styleSegments を採用する。

TextRunNode は採用しない。

## Rationale

TextRunはDOCX(OpenXML)固有の内部表現であり、
比較対象となる意味単位ではない。

Format Parser / Normalizer がRun情報を解釈し、
SLIRではTextNodeとして表現する。

Style差分が必要な場合はstyleSegmentsとして保持する。

追加理由:

- SLIRの目的は「比較可能な意味構造」であり、OpenXML内部構造の保存ではない
- `<w:r>` はParser/Normalizerで吸収すべきOrigin/Raw情報
- Style差分は必要だが、Node粒度にする必要はない
- MatcherのIdentity判定単位が安定する
- DOCX以外（PDF/HTML/MD）との共通化が可能

## Superseded

以下の旧案を廃止する。

- TextRunNode
- Paragraph → TextRun階層
- TextSpan 断片列を正とする案（旧 Accepted Inline）

## Impact

影響範囲:

- ADR-002 SLIR Schema（Accepted 更新済み）
- ADR-003 Matcher Engine（参照文言追随）
- ADR-004 Delta Tree（参照文言追随）
- ADR-010 Renderer Architecture（Adopt 後に本格化可 · 既存 Pack は ADR-005）

## Residual（非ブロッカー）

| 項目 | 扱い |
|------|------|
| range 単位 | 実装詳細 · Schema 契約のブロッカーではない |
| Section | **optional** semantic grouping（必須にしない） |
| Track Changes | Phase1 特別扱いしない · Future 可 |
| Candidate confidence | **Matcher / Delta** に置く · SLIR に混ぜない |

---

## Adopt 実行チェック

- [x] Accepted ADR-002 最小更新（TextNode + styleSegments）
- [x] TextRun 旧案 Superseded
- [x] Matcher / Delta 参照文言更新
- [x] Architecture Index 更新
- [x] Candidate = confidence（ChangeKind に足さない）確認

次: **Renderer Architecture**（SLIR 直接参照禁止 · Delta 入力契約固定済み）。
