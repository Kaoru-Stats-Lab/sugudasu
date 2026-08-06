# Smart Diff — Session Log Template（Wave 6.3）

| 項目 | 値 |
|------|-----|
| **Audience** | **Evaluator Only** |
| **粒度** | 認知負荷のみ（座標・操作テレメトリ不要） |
| **Sheet** | [`EVALUATION_SHEET.md`](EVALUATION_SHEET.md) と同等 · 本紙は実施記入用 |

> **1 条件（A または B）につき 1 部。** 被験者に見せない。

---

## Participant 情報

| Field | 記入 |
|-------|------|
| session_id | S1 / S2 / S3 … |
| participant_id | |
| Persona | |
| 利用経験 | |
| 想定業務 | |
| 使用環境 | |
| fixture_id | V-A / V-B / V-C |
| condition | A_side_by_side / B_smart_diff |
| order_in_session | 1st / 2nd |
| date | |
| evaluator | |

---

## 結果入力（必須）

| 項目 | 記入 |
|------|------|
| 開始時刻 | |
| 最初の変更発見時刻 | |
| First Change Discovery Time（秒） | |
| 完了時刻 | |
| 全変更確認時間（秒） | |
| 打ち切り（12分） | yes / no |
| changes_total N（事前記入） | |
| Miss Count | |
| False Alarm（誤認数） | |
| found_ids | |
| missed_ids | |
| Confidence（全部見たか） | yes / partial / no または 1–5 |
| 「どこが重要かわからない」発言 | yes / no |
| 操作迷い（UI改善候補 · 主軸外） | none / slight / strong |
| navigator_used（Bのみ） | yes / partial / no |
| 行動コード（B） | success / stop_candidate / stop / go |
| 失敗分類タグ（任意） | Detection / Presentation / **Trust** / Scope |
| コメント | |

---

## 判断回答（MVP 核心 · 記録順 ①→②→③）

| Field | 記入 |
|-------|------|
| **① 最終判断** | 承認 / 保留 / 不承認 |
| **② Smart Diff だけで判断できたか** | **Yes / No** |
| （NO時）何が不安だったか | |
| （NO時）何を確認しに戻ったか | |
| （NO時）戻ったことで判断できたか | Yes / No |
| **③ 全文へ戻ったか** | **Yes / No** |
| **復帰の意味** | `正常確認`（理解のため一部参照）/ `Trust Failure 候補`（不安で全文）/ `沈黙移動` |
| 戻った理由 | （解釈しない · 発言のまま · 沈黙なら「無言で全文へ」） |
| Candidate/Loss 境界を理解して判断できたか | Yes / No / n/a（存在自体は失敗にしない） |
| 戻らず判断できた理由 | |
| 成功コメント（要約） | 例: ここだけ見ればよい |
| 失敗コメント（要約） | 例: 一応全部読んだ → Trust 形成失敗 |
| Feature Request / Scope Gap（隔離） | セル差分 · Word風 · AI 等 · MVP と直結させない |
| 承認してよいか（被験者の言葉） | |
| 挙げた気になる点 | |

「念のため全部見ます」→ 職種・性格で補正しない。記録は **Trust Failure 候補**（理由分析は 6.4）。

---

## Interview Notes（要約）

必須4問の要点のみ（全文は任意で別紙）:

| 質問 | メモ |
|------|------|
| 最初にどこを見ればよいかわかったか | |
| 見落としが不安な箇所 | |
| 差分表示を信用できたか | |
| 全部確認したと思える瞬間 | |
| その他 | |

タグ（事後）: `nav_clear` / `nav_unused` / `table_where` / `pdf_noise` / `trust_*` / `confidence_*`

---

## S1/S2/S3 観察メモ（任意 · 焦点は WAVE6.3_FOCUS）

| 観察 | 記入 |
|------|------|
| 全文読みに戻ったか / 「念のため全部」（特に V-A） | yes / no / partial |
| style_only を重要規則変更と誤認したか（V-B） | |
| 表 Atomic で不安になったか（V-B） | |
| PDF Loss 上で範囲承認できたか / 信用できたか（V-C） | |
| wish は失敗か要望か | `failure_*` / `wish_phase2` |

---

## コピー用ワンライナー

```text
session= condition= full_read=Yes|No reason_back= reason_no_back= miss= false_alarm= behavior= failure_class= wish= failure|phase2 notes=
```
