# Smart Diff — Session Results Rollup（Wave 6.3 → 6.4）

| 項目 | 値 |
|------|-----|
| **Audience** | **Evaluator Only** |
| **Purpose** | S1–S3（＋拡張）集約 · GO/STOP 判定準備 |
| **Focus** | [`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) |

> 実施後に記入。コード変更の根拠にしてその場で実装しない。  
> **次の成果物はこのファイルの実データ。** 追加 ADR / CREATE-TASK / 実装は不要。  
> 「便利だけど最後に全文を見る」→ STOP 寄り（Trust）。セル差分要望→ Scope（Detection へ誤変換しない）。  
> 評価チェーン: Detection → Presentation → Trust → **Business Judgment**（アルゴリズム賢さではない）。

---

## 6.4 最初に見る集計（時間短縮はその後）

| 指標 | 人数/件数 | メモ |
|------|-----------|------|
| Smart Diff だけで承認可能だった人数 | | MVP 価値 |
| 全文復帰人数 | | Trust Failure 検出 |
| うち 正常確認（一部参照） | | |
| うち 不安で全文（Trust Failure 候補） | | |
| 沈黙のまま全文へ移動した人数 | | 一覧だけでは判断できず |
| Miss（合計） | | 安全性 |

---

## 最重要ログ（MVP 核心 · 記録順 ①→②→③）

| Session | Fixture | ①最終判断 | ②SDだけで判断 | （NO）不安/戻先/戻後判断可 | ③全文へ戻ったか | 復帰の意味 | 戻った理由 | Feature Request / Scope Gap |
|---------|---------|-----------|---------------|---------------------------|----------------|------------|------------|------------------------------|
| S1 | V-A | 承認/保留/不承認 | Yes/No | | Yes/No | 正常確認 / Trust候補 / 沈黙移動 | | |
| S2 | V-B | 承認/保留/不承認 | Yes/No | | Yes/No | 正常確認 / Trust候補 / 沈黙移動 | | |
| S3 | V-C | 承認/保留/不承認 | Yes/No | | Yes/No | 正常確認 / Trust候補 / 沈黙移動 | | |
| S4 | | | Yes/No | | Yes/No | | | |
| S5 | | | Yes/No | | Yes/No | | | |
| S6 | | | Yes/No | | Yes/No | | | |

③の見方: 「全文を見たか」ではなく **「全文に戻らないと判断できなかったか」**。  
復帰の意味: 理解のための一部参照＝正常確認 · 不安で全文＝Trust Failure 候補 · 無言で全文移動も記録。  
Candidate/Loss **の存在自体は失敗にしない**（境界を理解して判断できたか）。  
ケース: A=GO候補 · B=短縮+最後に全文→注意 · C=要望→Scope Gap。

---

## 集約表（条件別）

各セルは秒または件数。A/B は同一 participant × fixture。

| Session | Persona | Fixture | order | A_duration | B_duration | B/A | A_first_find | B_first_find | A_miss | B_miss | A_FA | B_FA | A_conf | B_conf | nav_used | behavior_B |
|---------|---------|---------|-------|------------|------------|-----|--------------|--------------|--------|--------|------|------|--------|--------|----------|------------|
| S1 | 総務/法務 | V-A | | | | | | | | | | | | | | |
| S2 | 人事総務 | V-B | | | | | | | | | | | | | | |
| S3 | 建設現場管理 | V-C | | | | | | | | | | | | | | |
| S4 | | V-A | | | | | | | | | | | | | | |
| S5 | | V-B | | | | | | | | | | | | | | |
| S6 | | V-C | | | | | | | | | | | | | | |

`behavior_B`: `success`（一覧→箇所→承認）/ `stop_candidate`（念のため全文）/ `stop`（理解不能→全文）/ `go`（安心して承認）。  
速さ（B/A）より **behavior_B** と Trust を先に読む。

---

## 定性タグ頻度

| タグ | 回数 | 特記 |
|------|------|------|
| nav_clear | | |
| nav_unused | | |
| table_where | | |
| pdf_noise | | |
| trust_high / trust_low | | |
| confidence_yes / partial / no | | |
| full_read_fallback（全文読み） | | |

---

## Session 別メモ（1行）

| Session | 成功/失敗パターン | 一文 |
|---------|-------------------|------|
| S1 V-A | 条で変更あり/なし判断 / 全文読み · 「念のため全部」 | |
| S2 V-B | style_only 誤認なし / 太字＝重要規則と誤認 · 表Atomic不安 | |
| S3 V-C | Loss上で範囲承認可 / 信用できない · 結局全部見る | |

---

## 失敗分類（6.4 · 混ぜない）

件数は Session 横断のタグ数。**Trust Failure を最優先で読む。**

| 分類 | 意味 | 該当 Session · 回数 · メモ |
|------|------|---------------------------|
| **Detection Failure** | 差分を出せなかった | |
| **Presentation Failure** | 差分はあるが理解できない | |
| **Trust Failure** | 理解できるが信用できない（**最重要**） | |
| **Scope Failure** | そもそも対象外だった | |

例: 「表セル差分が欲しい」→ **Scope**（Detection と混ぜない）。  
測る軸の優先: **全文確認なしで承認できるか（Trust）** ≫ 便利・速さ。

正本: [`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) §4–§5。

---

## STOP シグナル集計（GO より先に見る）

| シグナル | 該当 Session | 支配的か | 失敗分類（上表） |
|----------|--------------|----------|------------------|
| 変更発見後も全文確認へ戻る / 「念のため全部」 | | yes / no | |
| 「どこが重要かわからない」 | | yes / no | |
| Modified / style_only の意味が分からない · 太字＝重要規則と誤認 | | yes / no | |
| Candidate が不安を増やす | | yes / no → ADR | |
| 表 Atomic で不安 | | yes / no | |
| PDF 結果を信用できない · Loss が不安を増やす · 「結局全部見る」 | | yes / no → PDF Scope | |
| 「全文を読んだ」発言（赤信号）回数 | | | |

正本: [`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) §3–§4。

---

## GO / STOP 判定準備（Wave 6.4）

### 分析順（固定 · 逆にしない）

```text
1. Trust Failure の有無（最重要ログ 4 列）
2. Miss Count
3. False Alarm
4. Time Shortening
5. Feature Request（隔離済み · MVP と直結させない）
```

### 6.4 ケース早見

| ケース | 判断 |
|--------|------|
| A: 短縮 + 全文復帰なし + 承認 | GO 候補 |
| B: 短縮 + 最後に全文 | 注意（承認保証になっていない可能性） |
| C: セル/PDF/AI 要望 | Scope Gap · 即 STOP ではない |

### 6.4 でやらない分析

| 禁止 | 理由 |
|------|------|
| もっと精度を上げれば解決 | Trust → Detection 誤変換 |
| AI 追加すれば安心 | 信頼形成とは別 |
| Cell Diff を作れば解決 | 表対応範囲の問題 |
| 操作時間だけ比較 | 判断品質を見失う |

仮判定（STOP 候補が支配的なら GO を先に選ばない）:

| 候補 | チェック |
|------|----------|
| **STOP**（時間短縮なし / 全文解放失敗が支配的） | ☐ |
| **STOP 候補**（重要箇所不明 · 安心できない承認） | ☐ |
| **Re-scope**（短縮あるが不安 · Confidence） | ☐ |
| **PDF限定再設計** / PDF Scope 再検討 | ☐ |
| **ADR 再検討**（Candidate が不安を増やす） | ☐ |
| **GO**（時間≤50% + Miss少 + 全文解放が支配的） | ☐ |

唯一の問いへの答え: 承認者は差分一覧で全文確認から解放されたか → **Yes / No / Partial**  
信頼性の問い: この結果を信じて承認できるか → **Yes / No / Partial**  
支配的失敗分類（混ぜない）: Detection / Presentation / **Trust** / Scope → ________

根拠（最大3点 · ログ転記禁止）:

1.  
2.  
3.  

判定日:  
判定者:  

→ 正式結果ファイル案: `VALIDATION_RESULT_YYYY-MM-DD.md`（6.4 で作成）
