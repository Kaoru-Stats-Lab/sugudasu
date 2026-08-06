# Smart Diff — Evaluation Sheet（Wave 6.2）

| 項目 | 値 |
|------|-----|
| **Audience** | **Evaluator Only** |
| **Date** | 2026-08-06 |
| **Protocol** | [`SESSION_PROTOCOL.md`](SESSION_PROTOCOL.md) |

> 被験者に見せない。1 条件（A または B）につき 1 枚。  
> 実施記入の薄い版: [`SESSION_LOG_TEMPLATE.md`](SESSION_LOG_TEMPLATE.md)。  
> **記録しない:** クリック座標 · 詳細操作イベント · 滞在ヒートマップ（認知負荷評価のみ）。

---

## Header

| Field | Value |
|-------|-------|
| session_id | |
| participant_id | |
| Persona | |
| fixture_id | V-A / V-B / V-C |
| condition | A_side_by_side / B_smart_diff |
| order_in_session | 1st / 2nd |
| environment | |
| evaluator | |
| date | |

---

## Timing

| 項目 | 測定 | 記入 |
|------|------|------|
| 開始時刻 | start | |
| First Change Discovery Time | first_find − start（秒） | |
| 全変更確認時間 | end − start（秒） | |
| 打ち切り | yes/no（12分） | |

---

## Accuracy

| 項目 | 測定 | 記入 |
|------|------|------|
| changes_total (N) | Ledger 可視件数（事前記入） | |
| changes_found | Found 数 | |
| Miss Count | N − found | |
| False Alarm | 未変更を変更と言った数 | |
| found_ids | Ledger deltaId リスト | |
| missed_ids | | |
| false_alarm_notes | | |
| candidate_reviewed | （任意） | |

---

## Confidence & UX

| 項目 | 測定 | 記入 |
|------|------|------|
| Confidence | 「全部見たか」1–5 または yes/partial/no | |
| 全文確認へ戻った / 「全文を読んだ」（赤信号） | yes / no / partial | |
| 「どこが重要かわからない」 | yes / no | |
| 操作迷い | none / slight / strong · 箇所メモ（UI改善候補 · 主軸外） | |
| navigator_used | （Bのみ）yes / partial / no | |
| コメント | 自由記述 | |

成功定義は **判断成功**（[`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) §1）。クリック数等は記録しない。

---

## 判断回答（タスク結果）

| Field | 記入 |
|-------|------|
| 承認してよいか（被験者の言葉） | |
| 挙げた気になる点 | |

---

## 突合メモ（Evaluator · セッション後）

Ledger 突合日時:  
突合者:  
特記（style_only / table / PDF Loss）:

---

## コピー用（空欄）

```text
session_id:
participant_id:
persona:
fixture_id:
condition:
start:
first_find_sec:
duration_sec:
timeout:
N:
found:
miss_count:
false_alarm_count:
confidence_end:
navigator_used:
ops_confusion:
notes:
```
