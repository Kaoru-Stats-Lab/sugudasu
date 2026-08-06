# Smart Diff — Architecture Freeze

| 項目 | 値 |
|------|-----|
| **Status** | **MVP Architecture Frozen** |
| **Date** | 2026-08-06 |
| **Architect** | Wave 0–5 一方向パイプライン確定 |

## Gate

| Gate | 判定 |
|------|------|
| Product Constitution | ✅ |
| SLIR 境界 | ✅ |
| Identity = Matcher | ✅ |
| Delta ≠ UI | ✅ |
| Projection → UI | ✅ |
| Projection → Export | ✅ |
| Local PDF Report | ✅ |

## Freeze 規則

- Accepted ADR（002/003/004）の無断変更禁止
- 境界を破る「便利実装」禁止（MVP_NON_GOALS）
- Phase2（Redline / Cell Diff / AI）は Freeze 外 · **6.4 判定後** · 別 ADR
- Wave 6.3 中の追加凍結:

| 領域 | 判断 |
|------|------|
| SLIR · Stable ID · Delta Tree | 変更禁止 |
| Table Atomic | Cell Diff は Phase2 |
| Candidate | ChangeKind 昇格禁止 |
| Loss Report | PDF 万能化禁止 |
| Renderer | 見た目改善は結果後 |

**ここで実装追加へ戻ると判断を誤る。** 検証対象は差分精度ではなく **承認信頼**。

## Pipeline（凍結）

```text
DOCX/PDF → Raw → Normalizer → SLIR
  → Matcher → Delta → Projection → UI / Export
```

## Next（製品 · Wave 6）

```text
Architecture Freeze → Implementation Freeze → Validation Freeze
  → Persona Session ▶ → GO / STOP / Re-scope
```

**今やることは唯一: 実際の承認行動を観測すること。** 追加設計・実装不要。  
**MVP 判断は Trust 層中心**（Detection/Presentation と混ぜない）。  
**実作業:** Participant View → S1 V-A → S2 V-B → S3 V-C → 実施ログ + Rollup 実データ → 6.4。  
6.4 最初の集計: SDだけで承認可能人数 · 全文復帰 · 戻った理由 · Miss（時間はその後）。

正本: [`validation/WAVE6.3_FOCUS.md`](validation/WAVE6.3_FOCUS.md)
