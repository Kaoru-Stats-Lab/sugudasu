# ADR-006 Export — Wave 5 Implementation Note

| 項目 | 値 |
|------|-----|
| **Date** | 2026-08-06 |
| **Parent** | [`../ADR-006-Export-Confirmation-2026-08-06.md`](../ADR-006-Export-Confirmation-2026-08-06.md) |
| **Design** | [`export-design.md`](export-design.md) |

## Decision lock（Wave 5）

1. Export 入力 = **Projection Model**（SLIR / Matcher / Delta 再実行禁止）
2. MVP Export 範囲 = **全変更**（UI Filter `visible` を無視）
3. Generator = **pdf-lib** · Local download only
4. Candidate / Table 表示規則は UI（Wave 4）と同趣旨

Confirmation 文書の Residual（Filter）は本 Note で **全変更固定**として閉じる。
