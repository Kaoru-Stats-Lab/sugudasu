# Smart Diff — Session Protocol（Wave 6.2）

| 項目 | 値 |
|------|-----|
| **Status** | Fixed for Persona Sessions |
| **Date** | 2026-08-06 |
| **Pack** | [`../VALIDATION_PACK.md`](../VALIDATION_PACK.md) |
| **Golden** | [`Golden_Fixture_Manifest.md`](Golden_Fixture_Manifest.md) · [`Expected_Delta_Ledger.md`](Expected_Delta_Ledger.md) |

> **Product Validation。** 実施中にコード・Fixture・Ledger・UI を変えない（MVP Freeze）。

---

## 0. 情報境界（最重要）

```text
Evaluator Only（被験者に見せない・渡さない）
 ├ Golden Fixture Manifest
 ├ Expected Delta Ledger
 ├ Expected Miss Criteria（本 Protocol §6）
 └ Session Score / Evaluation Sheet（記入済）

Participant View（被験者に渡してよいものだけ）
 ├ Original Document（旧）
 ├ Changed Document（新）
 ├ Smart Diff UI（条件 B）
 └ Task Instruction（本 Protocol §3 · 被験者向け文言のみ）
```

| 漏洩すると起きること | 対策 |
|----------------------|------|
| Ledger が被験者に見える | 「答え合わせ能力」を測ってしまう |
| 変更件数を先に言う | Discovery が歪む |
| 「差分を探して」と指示する | 実務タスクから逸脱 |

**禁止:** 被験者画面・共有フォルダ・チャットに Ledger / Manifest / 評価シートを置く。

---

## 1. Participant（記録項目）

セッション開始前に評価者が記入（被験者に見せない）:

| Field | 例 |
|-------|-----|
| participant_id | P01 |
| Persona | 総務/法務 · 人事総務 · 建設現場管理 |
| 利用経験 | Word Diff / 目視のみ / Smart Diff 初見 等 |
| 想定業務 | 契約確認 · 規程改訂 · 施工計画確認 |
| 使用環境 | OS · ブラウザ · 画面サイズ · 入力は Local |
| session_id | S1 / S2 / S3 …（[`SESSION_ASSIGNMENT.md`](SESSION_ASSIGNMENT.md)） |
| fixture_id | V-A / V-B / V-C |
| order | A_first（並べ→Smart Diff）または B_first |

---

## 2. Task Scenario（実務タスク文言）

### 原則（固定）

測るものは **レビュー判断支援**であり、差分探索ゲームではない。

| 固定コア | 禁止（探索タスク化） |
|----------|----------------------|
| **「この文書変更を承認してよいか判断してください」** | 「変更箇所を探してください」 |
| 気になる点は口頭で挙げてよい | 「差分を確認してください」 |
| 判断できたら「確認完了」 | 「Smart Diff を使ってください」 |
| | 「変更は何件ありますか」 |

成功の定義は操作成功ではなく **判断成功**（[`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) §1 · §2b）。

### Fixture 別（Participant に読む・見せる）

いずれもコア意図は「承認してよいか判断」。文言は変えても探索指示に落とさない。

#### V-A（契約書）

> あなたは契約確認担当です。改訂前後の業務委託契約書について、**この文書変更を承認してよいか（社内承認に回してよいか）判断してください。** 気になる点があれば口頭で挙げてください。修正作業やコメント票の作成は不要です。判断できたら「確認完了」と伝えてください。

#### V-B（就業規則）

> あなたは人事・総務担当です。就業規則の改訂案について、**この文書変更を承認してよいか（周知・施行前にこのまま進めてよいか）判断してください。** 押さえるべき変更があれば口頭で挙げてください。判断できたら「確認完了」と伝えてください。

#### V-C（施工計画 PDF）

> あなたは現場管理側の確認担当です。施工計画（抜粋）の改訂版について、**この文書変更を承認してよいか（この版で現場運用を進めてよいか）判断してください。** 問題になりそうな点があれば口頭で挙げてください。スキャン画像のみのページは今回の確認対象外です。判断できたら「確認完了」と伝えてください。

---

## 3. Test Flow（固定）

制限時間の目安: 条件あたり **最大 12 分**（打ち切りは Miss として扱う）。

### 共通フロー（1 Fixture × 2 条件）

```text
1. Background 説明（製品採点ではない · 確認作業の比較）
2. Original（旧文書）を渡す — 2分以内の目通し可
3. Changed（新文書）を渡す
4. 条件実行
   - 条件 A: 旧・新を並べて確認（Smart Diff なし）
   - 条件 B: Smart Diff UI で確認（旧新ファイルは開いてよいが「探す主手段」は Navigator）
5. 判断回答（承認してよいか · 気になる点）
6. Interview（[`INTERVIEW_GUIDE.md`](INTERVIEW_GUIDE.md)）
```

### 条件の順序

[`SESSION_ASSIGNMENT.md`](SESSION_ASSIGNMENT.md) の `order` に従う。半数は B→A。

### Background で言ってよいこと / 言ってはいけないこと

| OK | NG |
|----|-----|
| 登録不要・ブラウザ内・データ非送信 | 変更は○件ある |
| 書式のみの変更も確認対象に含めてよい（V-A/B） | Ledger の内容 |
| V-C: スキャン頁は対象外 | 「差分ツールなので差分を探して」 |

---

## 4. 条件 A / B の定義

| 条件 | Participant View |
|------|------------------|
| **A** | 旧ファイル + 新ファイル（並べ表示 or 切替）。Smart Diff UI **なし** |
| **B** | Smart Diff UI + 必要なら旧新ファイル。操作説明は「変更一覧と次へ」まで · アルゴリズム説明はしない |

---

## 5. 計測タイミング

| イベント | 定義 |
|----------|------|
| start | 条件の文書（と UI）を渡し、タスク文言を読み終えた瞬間 |
| first_find | 被験者が**最初の具体的変更**を口頭または指差しで示した瞬間 |
| end | 「確認完了」宣言、または制限時間打ち切り |

評価シート: [`EVALUATION_SHEET.md`](EVALUATION_SHEET.md) · 実施記入: [`SESSION_LOG_TEMPLATE.md`](SESSION_LOG_TEMPLATE.md)  
観察焦点: [`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md)

### ログ粒度（認知負荷のみ · Wave 6.3 固定）

| 必須 | 不要 |
|------|------|
| 開始 · 最初の変更発見 · 完了 · Miss · 誤認 · コメント | クリック座標 · 詳細操作イベント · 滞在時間ヒートマップ |

UI改善用テレメトリは取らない。サンプル不足の滞在分析もしない。

---

## 6. Expected Miss Criteria（Evaluator Only）

Ledger と突合するときのルール（被験者非公開）:

1. **Found:** location + 要旨（数字・固有語）が Ledger 行と対応  
2. **Miss:** Ledger の可視変更を制限時間内に触れなかった  
3. **False Alarm:** Ledger 上 Unchanged / 非変更トラップを「変わった」と主張した  
4. **Candidate 提示:** Smart Diff が Candidate にした行を被験者が確認した → Miss にしない · False Alarm にしない · `candidate_reviewed` として任意記録  
5. **style_only:** セッション前に Style Filter ON。OFF のまま非表示だった場合は設定ミスとして当該条件を再実施可  
6. **table_changed:** 「表が変わった」と言えれば Found（セル位置まで言えなくても可）

---

## 7. Freeze 維持

実施期間中:

- Implementation 変更禁止  
- Fixture / Ledger 変更禁止  
- UI 改善禁止  
- フィードバックをその場で仕様に反映しない（メモのみ → Wave 6.4）

---

## 8. 実施チェック（開始前）

- [ ] Participant View フォルダに Ledger / Manifest / 本 Protocol 全文が入っていない  
- [ ] 旧・新バイナリ（または印刷）が Fixture ID と一致  
- [ ] Evaluation Sheet がセッション分用意されている  
- [ ] Interview Guide が評価者手元にある  
- [ ] Assignment の Persona / Fixture / order を確認した  
