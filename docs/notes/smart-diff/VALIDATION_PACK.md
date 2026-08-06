# Smart Diff — MVP Validation Pack（Wave 6）

| 項目 | 値 |
|------|-----|
| **Status** | **Active — 非実装フェーズ** |
| **Date** | 2026-08-06 |
| **Architecture** | [`ARCHITECTURE_FREEZE.md`](ARCHITECTURE_FREEZE.md)（MVP Frozen） |
| **CREATE-TASK** | [`../../prompts/smart-diff-wave6-validation-plan-CREATE-TASK.md`](../../prompts/smart-diff-wave6-validation-plan-CREATE-TASK.md) |
| **Non Goals** | [`MVP_NON_GOALS.md`](MVP_NON_GOALS.md) |

> 技術検証は Wave 0–5 で閉じた。  
> 本 Pack は **価値仮説**「差分だけ見れば確認作業が終わる」を測る。

---

## 0. 仮説と非目標

### 仮説（検証対象）

```text
Smart Diff の Change Navigator で確認すると、
2枚並べ確認より短時間・高発見率で変更を拾える。
```

### このフェーズでやらない

| 禁止 | 理由 |
|------|------|
| 新機能実装 | Freeze 膨張を防ぐ |
| Table Cell Diff | Phase2 判断材料を先に取る |
| Redline PDF / AI 要約 | Non Goals |
| 「アルゴリズム精度」単独の再ベンチ | 価値仮説と別軸 |

---

## 1. 実務テスト計画（Wave 6-1）

### 1.1 Persona × 文書

| Persona | 想定文書 | 確認したいこと | 入力形式 |
|---------|----------|----------------|----------|
| 総務 | 社内規程・就業規則の改訂 | 見落とし防止になるか | DOCX 主 |
| 法務 | 契約書変更 | 条項確認時間が減るか | DOCX 主 |
| 経理 | 請求・支払条件変更 | 数字変更を拾えるか | DOCX / PDF |
| 建設事務 | 工事書類変更 | PDF 差分が使えるか | PDF 主 |

各 Persona **最低 2 名**（可能なら 3 名）。同一人物の複数 Persona 兼任は記録上分離する。

### 1.2 セッション構成（1人あたり 25–40 分）

| 分 | 内容 |
|----|------|
| 0–3 | 同意・目的説明（製品ではなく確認作業の比較であること） |
| 3–8 | 練習（技術 fixture 1件 · 操作説明のみ） |
| 8–18 | **条件 A**: Word/PDF を 2 枚並べて確認 |
| 18–28 | **条件 B**: Smart Diff（Navigator）で確認 |
| 28–35 | Interview Script |
| 35–40 | 自由コメント |

**順序バイアス低減:** 半数は B→A の順。記録に順序を必ず残す。

### 1.3 タスク文言（両条件で同一）

```text
この2つの文書の「変更箇所」をすべて確認してください。
確認できたら「完了」と伝えてください。
（修正・承認・コメント作成は不要です）
```

制限時間の目安: 条件あたり **最大 12 分**（打ち切り時は未発見として記録）。

### 1.4 環境

- ブラウザのみ · 登録なし · `/diff` Smart Diff プレビュー or 同等導線
- オフライン可 · 入力は Local
- 録画は任意（画面 + 音声）。必須は **タイムスタンプ付き観察ログ**

### 1.5 観察ログ（最低フィールド）

```text
participant_id
persona
order (A_first | B_first)
fixture_id
condition (A_side_by_side | B_smart_diff)
start_ts / end_ts / duration_sec
first_find_sec
changes_total (仕込み数)
changes_found (発見数)
miss_count
false_alarm_count
confidence_end (1-5 | yes/partial/no)
found_ids[]
missed_ids[]
navigator_used (yes/no/partial)   # B のみ
notes
```

---

## 2. 評価指標

### 2.1 Primary — Task Completion Time

```text
A = Word/PDF を 2 枚並べて確認した時間
B = Smart Diff で確認した時間
```

**目標（GO 候補）:**

```text
median(B) ≤ median(A) × 0.5
```

報告は中央値 + IQR。外れ値は注記し、除外ルールは事前に「制限時間打ち切りのみ」とする。

### 2.2 Secondary — Change Discovery Accuracy

仕込み変更 N 件（推奨 **10**）に対し:

```text
accuracy = found / N
miss_count = N - found
```

**目標（GO 候補）:**

```text
accuracy ≥ 0.90
```

Persona 別・Fixture 別に集計。全体平均だけで GO しない（建設 PDF だけ崩れていないか見る）。

### 2.3 Additional（Wave 6.1 追記 · 確認終了判断）

Smart Diff の価値は「抽出率」より **確認終了判断を早めること**。Pack 指標に追加する:

| 指標 | 意味 | 記録 |
|------|------|------|
| **First Change Discovery Time** | 最初の差分を指摘するまでの秒 | A/B 両方 |
| **Miss Count** | 見落とし数（= N − found） | 必須 |
| **False Alarm** | 実際は未変更なのに確認してしまった箇所 | 任意だが推奨 |
| **Confidence** | 「これで全部見た」と思えたか（1–5 or yes/partial/no） | Interview 必須 |

観察ログに `first_find_sec` · `miss_count` · `false_alarm_count` · `confidence_end` を追加。

### 2.4 Qualitative（必須だが数値化しない）

Interview からタグ付け:

| タグ | 例 |
|------|-----|
| `nav_clear` | 次へで迷わない |
| `nav_unused` | Navigator を使わない |
| `table_where` | 「表のどこ？」 |
| `pdf_noise` | PDF の誤認・順序不安 |
| `candidate_ok` | 確認候補の表示が分かる |
| `candidate_confusing` | アルゴリズムっぽく感じる |

---

## 3. 実務 Fixture 設計（Wave 6-2）

技術 fixture（`第3条 30→45`）は **Regression 用に残す**。UX 検証には以下を追加する（**作成は Validation 準備 · 本 Pack では仕様のみ**）。

### 3.1 Fixture V-A — 契約書（DOCX）

| 項目 | 内容 |
|------|------|
| 目的 | 法務・経理の条項・数字確認 |
| 仕込み | **10 変更** |
| 例 | 支払 30→45 · 条文追加 · 条項削除 · 文言微修正 · style_only · 表1 · Candidate になりうる類似段落 等 |
| 期待体験 | Navigator で 10 件を順に潰せる |

変更台帳（Golden）例:

| ID | 種別 | 要約 |
|----|------|------|
| VA-01 | modified / 数字 | 第5条 支払 30→45 |
| VA-02 | added | 秘密保持の追記段落 |
| VA-03 | deleted | 旧・再委託条の削除 |
| VA-04 | modified / 文言 | 「遅滞なく」→「直ちに」 |
| VA-05 | style_only | 「重要事項」太字化 |
| VA-06 | table_changed | 料金表 |
| VA-07 | modified | 契約期間 1年→2年 |
| VA-08 | added | 監査協力リスト項目 |
| VA-09 | modified | 通知先住所 |
| VA-10 | candidate 仕込み | ほぼ同一の別条（誤マッチしやすい） |

### 3.2 Fixture V-B — 就業規則（DOCX）

| 変更種 | 必須 |
|--------|------|
| 条文追加 | ✅ |
| 削除 | ✅ |
| 太字（style_only） | ✅ |
| 表変更（Atomic） | ✅ |
| 数字・日付 | ✅ 推奨 |

総務 Persona 主。ページ数は A4 想定 **4–8 ページ**（長すぎない）。

### 3.3 Fixture V-C — 建設書類（PDF 主体）

SUGUDASU 親和性検証。題材例（いずれか1つを主、残りは予備）:

- 施工体制台帳（抜粋）
- 安全管理計画（抜粋）
- 工事請負契約書（抜粋）

| 確認点 | 内容 |
|--------|------|
| Loss Aware | 2段組・スキャン混在があれば `reading_order` / `ocr_required` がユーザーにどう見えるか |
| Table Atomic | 「表に変更があります」で足りるか（`table_where` タグ） |
| Page origin | 改ページ文書で「何ページか」が追えるか |

仕込み変更は **6–10**（PDF ノイズを踏まえ契約書より少なくてよい）。

### 3.4 Fixture 作成ルール

1. **Golden 台帳**を先に書く → 文書を作る（逆禁止）
2. 旧・新のペアを固定し、ハッシュ or ファイル名で版管理
3. 技術 Regression（Wave1–5）とは **別ディレクトリ**
4. **Wave 6.1 正本:** [`validation/Golden_Fixture_Manifest.md`](validation/Golden_Fixture_Manifest.md) · [`validation/Expected_Delta_Ledger.md`](validation/Expected_Delta_Ledger.md)

---

## 4. UX 確認項目（Wave 6-3）

### 4.1 Navigator

成功イメージ:

```text
変更 N 件 → 次へ → … → 確認完了
```

観察:

- Navigator を主操作にしているか
- 左右文書をスクロール探ししていないか

質問（必須）:

> 「どこを見ればいいか迷いましたか？」

### 4.2 Candidate コピー

| 避ける | 採用するトーン |
|--------|----------------|
| 自動判定できませんでした | **確認候補** |
| 一致度 ○○% を前面に | 必要なら副次情報 |

ユーザーはアルゴリズム評価をしたいわけではない。表示検証では **文言の理解**を見る（実装変更は GO 後でも可。検証中は現行 UI + 口頭補足でも可）。

### 4.3 Table

現行 Phase1:

```text
表に変更があります
```

ユーザーが「で、どこ？」と言ったら **実装せず** `table_where` として記録し、Phase2 判断材料にする。

---

## 5. Interview Script

### 5.1 導入（共通）

1. 今日の目的は製品の良し悪しの採点ではなく、**確認作業のやり方の比較**です。
2. 正解を急がなくて構いません。思い浮かんだことをそのまま話してください。

### 5.2 条件 A 直後

1. 変更を探すとき、最初に何をしましたか？
2. 自信が持てなかった箇所はありますか？
3. 時間を最も食ったのはどの種類の変更でしたか？（数字 / 文言 / 表 / その他）

### 5.3 条件 B 直後

1. **どこを見ればいいか迷いましたか？**
2. 「次の変更 / 一覧」は使いましたか？ 使わなかった理由は？
3. 「確認候補」や表の「表に変更があります」は分かりましたか？
4. PDF（V-C 実施時）で、画面上の順番と紙のイメージがずれましたか？

### 5.4 比較クロージング

1. 日常業務なら A / B どちらを使いたいですか？理由は？
2. 足りないものは何ですか？（今は実装しない前提で要望だけ聞く）
3. 同僚に勧めるなら一言で？

### 5.5 記録テンプレ（短縮）

```text
Q_nav_confused: yes/no — note
Q_nav_used: yes/partial/no
Q_table_where: yes/no
Q_prefer: A/B/either — reason
Q_wish: free text
```

---

## 6. Phase2 判断分岐

### 6.1 GO（Phase2 検討に進んでよい）

次を **同時に**満たす（Persona 全体の中央値 / 合計）:

| 条件 | 基準 |
|------|------|
| 確認時間 | `median(B) ≤ median(A) × 0.5` |
| 発見率 | `accuracy ≥ 0.90` |
| 定性 | 「表以外は十分」が支配的 · `nav_unused` が少数 |

GO 後に検討してよい Phase2 例（実装コミットは別 ADR）:

- Table のどこが変わったかの **手がかり**（セル Diff 全面ではない段階もありうる）
- UI 磨き込み（Candidate 文言 · Navigator 位置）
- Redline PDF（非必須）

### 6.2 STOP / Re-scope

いずれかが目立つ場合は実装拡張を止め、仮説 or UX を見直す（**GO より先に見る**）:

| シグナル | 意味 · 判断 |
|----------|-------------|
| 変更箇所発見後も全文確認へ戻る | 判断支援が未達 → **STOP 候補** |
| 「どこが重要かわからない」 | 安心して承認できない → **STOP 候補** |
| Candidate 表示が不安を増やす | **ADR 再検討** |
| PDF Loss 説明なしでは信用できない | **PDF Scope 再検討** |
| Navigator を使わない | Primary UX が刺さっていない |
| PDF で誤認が多い | Loss Aware / 正規化の説明 or 範囲の問題 |
| 変更箇所を探す時間が長い · 時間短縮なし | 「3分確認」仮説が未達 → **STOP** |
| `table_where` が多数でも時間・発見率が未達 | 表以前の問題を先に直す |

成功は操作成功ではなく **判断成功**（承認者が「ここだけ見ればよい」と言えるか）。  
測る軸の優先: **この結果を信じて承認できるか** ≫ 便利だったか。  
6.4 集約では失敗を混ぜない: Detection / Presentation / **Trust（最重要）** / Scope。  
実施焦点: [`validation/WAVE6.3_FOCUS.md`](validation/WAVE6.3_FOCUS.md)。

### 6.3 判断の出し方

1. 生データ表（参加者 × Fixture × A/B）
2. Primary / Secondary の集計
3. タグ頻度
4. **一文の判定:** `GO` / `GO_with_table_phase2` / `STOP_rescope`
5. 根拠 3 点まで（長文ログ転記禁止）

判定メモの置き場案: `docs/notes/smart-diff/VALIDATION_RESULT_YYYY-MM-DD.md`（実施後）

---

## 7. 実施チェックリスト（ファシリテータ）

- [ ] Golden 台帳つき V-A / V-B / V-C 準備
- [ ] A/B 順序の割当表
- [ ] 観察ログシート
- [ ] Interview Script 印刷 or 画面
- [ ] 制限時間・打ち切りルールの共有
- [ ] 結果ファイルの置き場確認
- [ ] **コード変更タスクを同日に入れない**

---

## 8. 関連

- Product: [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md)
- UI: [`UI_CONSTITUTION.md`](UI_CONSTITUTION.md) · [`../../ui/smart-diff/`](../../ui/smart-diff/)
- Export: [`../../architecture/export/export-design.md`](../../architecture/export/export-design.md)
- Plan: [`MVP_IMPLEMENTATION_PLAN.md`](MVP_IMPLEMENTATION_PLAN.md)
