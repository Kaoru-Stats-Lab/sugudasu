# ADR-013 Smart Diff Performance Budget / Browser Constraint v0.1

| 項目 | 値 |
|------|-----|
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Title** | Performance Budget & Browser Constraint |
| **Related** | Product / Brand · ADR-007–011 · ADR-006 Export |

> MVP Implementation Plan の前に固定する。過剰な Tree Diff / PDF 処理設計を防ぐ。数値は Pilot で改定可だが **制約の種類は固定**。

---

## Decision

1. Smart Diff も SUGUDASU 憲法を適用する: **登録不要 · ブラウザ完結 · 非送信 · 低スペック PC 想定**。
2. **サーバ側 compute に逃げる設計を禁止**（Parse / Match / Render / Export は Local）。
3. Architecture は **フル文書再処理・フル再描画を毎操作に要求しない**（010 incremental · 011 visibility）。
4. 目標文書サイズと時間予算を下表で持つ（初期値 · Pilot で更新）。

---

## Target Document（Phase1）

| 項目 | 目標 |
|------|------|
| 形態 | A4 相当 **最大 100 ページ**（規程・契約の実務レンジの下限〜中位） |
| Format | DOCX / PDF（HTML/MD は同予算内） |
| Runtime | **Browser only** |
| Compute | **No server compute** |

300 ページ級は Phase1 保証外（可能なら劣化表示 · 予算超過の明示）。

---

## Performance Targets（初期値 · Pilot 改定）

| 段階 | Target（初期） | 備考 |
|------|----------------|------|
| Parse + Normalize（片側） | **&lt; 5 s** | 100p DOCX/PDF · 中位 PC |
| Match + Delta build | **&lt; 5 s** | 両側合計のオーダー感 |
| Initial Review render | **&lt; 3 s** | Difference First · 全ページ同時描画必須にしない |
| Interaction（次/前 Jump） | **&lt; 100 ms** 体感 | Anchor Sync · Projection 更新 |
| Export PDF Report | **&lt; 10 s** | 変更件数に依存 · Worker 可 |
| UI | 操作中も **responsive**（長処理は Worker + 進捗） | メインスレッド占有禁止を原則 |

数値は「約束の SLA」ではなく **設計予算**。超過時は機能削減・仮想化・段階表示で吸収し、サーバ送信しない。

---

## Design Implications

| 禁止・回避 | 推奨 |
|------------|------|
| 毎キー/毎スクロールで全 Match 再実行 | Match は明示実行 · 結果を保持 |
| 全ページ DOM 一括マウント必須 | Virtualization / 段階マウント（010 NFR） |
| Filter で DOM 破棄→再構築 | visibility（011） |
| 同期 scrollTop | Anchor Sync |
| サーバ OCR / AI | Local only |

---

## Open Questions

| ID | 内容 |
|----|------|
| OQ-P1 | 100p を超えたときのユーザメッセージ |
| OQ-P2 | Worker 分割境界（Parse / Match / Export） |
| OQ-P3 | 低スペック定義（実機 Pilot） |

---

## Intent

Browser 完結のまま「確認できる」を守る。速さのために境界（SLIR/Matcher/Delta）を壊さない。

次: [`MVP_IMPLEMENTATION_PLAN.md`](../notes/smart-diff/MVP_IMPLEMENTATION_PLAN.md)
