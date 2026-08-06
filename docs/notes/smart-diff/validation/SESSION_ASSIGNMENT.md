# Smart Diff — Session Assignment（Wave 6.2）

| 項目 | 値 |
|------|-----|
| **Status** | Minimum plan · 拡張可 |
| **Date** | 2026-08-06 |
| **Protocol** | [`SESSION_PROTOCOL.md`](SESSION_PROTOCOL.md) |

> Persona × Fixture の最低構成。参加者実名は別管理（本表は ID のみ）。

---

## 最低構成（必須）

| Session | Persona | Fixture | 推奨 order |
|---------|---------|---------|------------|
| **S1** | 総務/法務 | **V-A**（契約書 DOCX） | A_first |
| **S2** | 人事総務 | **V-B**（就業規則 DOCX） | B_first |
| **S3** | 建設現場管理 | **V-C**（施工計画 PDF） | A_first |

各 Session で **条件 A と B の両方**を実施（同一 Fixture）。

---

## 拡張（推奨）

同一 Persona を増やして中央値を安定させる:

| Session | Persona | Fixture | order |
|---------|---------|---------|-------|
| S4 | 総務/法務 | V-A | B_first |
| S5 | 人事総務 | V-B | A_first |
| S6 | 建設現場管理 | V-C | B_first |

目標: Persona あたり **≥2**（可能なら 3）。

---

## 割当記入欄

| Session | participant_id | Persona | Fixture | order | 予定日 | 状態 |
|---------|----------------|---------|---------|-------|--------|------|
| S1 | | 総務/法務 | V-A | A_first | | planned |
| S2 | | 人事総務 | V-B | B_first | | planned |
| S3 | | 建設現場管理 | V-C | A_first | | planned |
| S4 | | | V-A | B_first | | optional |
| S5 | | | V-B | A_first | | optional |
| S6 | | | V-C | B_first | | optional |

---

## 実施順序（全体）

```text
Wave 6.2 Design（本ファイル群）✅
  → バイナリ準備（Participant View のみ配置）
  → Wave 6.3 Persona Session（S1→S2→S3 …）← 進行可 · コード変更禁止
      記録: SESSION_LOG_TEMPLATE · SESSION_RESULTS_ROLLUP · WAVE6.3_FOCUS
  → Wave 6.4 Result Analysis
  → GO / STOP / Re-scope / PDF限定再設計
```

CREATE-TASK: `docs/prompts/smart-diff-wave6.3-persona-session-CREATE-TASK.md`
