# 3AI依頼: テストデータ Raw CSV — ロールレビュー

**用途:** 実際の生成CSVを ROLE 付きAIに見せ、**データセット作法・楔適合・採用可否**のたたき台を得る  
**前提:** [`test-data-wedge-SYNTHESIS.md`](../notes/test-data-wedge-SYNTHESIS.md) · [`TEST_DATA_TOOL_SPEC.md`](../notes/TEST_DATA_TOOL_SPEC.md)  
**Fixture:** [`docs/fixtures/test-data-review/`](../fixtures/test-data-review/)  
**結果置き場:** `docs/notes/test-data-dataset-review-RESULT.md`（Gemini / Grok / ChatGPT を表で突合）  
**更新:** 2026-07-02

---

## v0.4.2 再レビュー（いま投げる版）

**エンジン:** `v0.4.2` · 千円丸め · 郵便番号クォート · 多様な氏名（約4%）

| 対象 | 手順 | サイズ目安 |
|------|------|------------|
| **Gemini / Grok** | `test-data-dataset-review-v042-rerun-COPYPASTE.txt` 全文1回 | ~60 KiB |
| **ChatGPT · 1回で済む** | `test-data-dataset-review-v042-rerun-COPYPASTE-lite.txt` | **~15 KiB** |
| **ChatGPT · 全量100+300** | 下記 **v042 分割5通** | 各 ~5–19 KiB |

**再生成:** `node scripts/export-test-data-review-fixtures.mjs`

### ChatGPT v0.4.2 分割5通（文字数制限対策 · 推奨）

| 順 | ファイル | 内容 |
|----|----------|------|
| 1 | `test-data-dataset-review-v042-chatgpt-1-prompt.txt` | v042ヘッダー + セクション0 + 回答形式（CSVなし） |
| 2 | `test-data-dataset-review-v042-chatgpt-2-employee.txt` | 社員100行 mine0 |
| 3 | `test-data-dataset-review-v042-chatgpt-3-payroll.txt` | 明細300行 |
| 4 | `test-data-dataset-review-v042-chatgpt-4-mine.txt` | 地雷版（任意） |
| 5 | `test-data-dataset-review-v042-chatgpt-5-start.txt` | 「評価開始」+ セクション0リマインド |

※ **60 KiB の全文1回は ChatGPT では長すぎる**ことが多い。lite か分割を使う。

**seed42 の多様な氏名（mine0）:** 4行 — 0024/0042 ラジュ・タパ · 0096 ファム・ミン・ドゥック · 0099 チャン・ティ・フォン · 0059 伊藤海輝マイケル（ハイブリッド）

---

## 使い方（提督向け）

### Gemini / Grok（全文1回）

1. **`test-data-dataset-review-COPYPASTE.txt`** を全文コピーして貼付

### ChatGPT（文字数制限あり）

**A. ライト版（1回で済む · 推奨）**

1. **`test-data-dataset-review-COPYPASTE-lite.txt`** を貼付（社員25 + 明細75 · 約15KiB）

### ChatGPT 全量（100+300）— 分割5通

| 順 | 相対パス | 絶対パス |
|----|----------|----------|
| 1 | `docs/prompts/test-data-dataset-review-chatgpt-1-prompt.txt` | `C:\asl_dev\sugudasu\docs\prompts\test-data-dataset-review-chatgpt-1-prompt.txt` |
| 2 | `docs/prompts/test-data-dataset-review-chatgpt-2-employee.txt` | `C:\asl_dev\sugudasu\docs\prompts\test-data-dataset-review-chatgpt-2-employee.txt` |
| 3 | `docs/prompts/test-data-dataset-review-chatgpt-3-payroll.txt` | `C:\asl_dev\sugudasu\docs\prompts\test-data-dataset-review-chatgpt-3-payroll.txt` |
| 4 | `docs/prompts/test-data-dataset-review-chatgpt-4-mine.txt` | `C:\asl_dev\sugudasu\docs\prompts\test-data-dataset-review-chatgpt-4-mine.txt` |
| 5 | `docs/prompts/test-data-dataset-review-chatgpt-5-start.txt` | `C:\asl_dev\sugudasu\docs\prompts\test-data-dataset-review-chatgpt-5-start.txt` |

※ v0.4.2 全量レビューでは **1通目を `test-data-dataset-review-v042-rerun-COPYPASTE.txt` のセクション0〜プロンプト部分** に差し替えるか、Gemini/Grok と同じ v042 全文1回が簡単。

### その他プロンプト

| 用途 | 相対パス |
|------|----------|
| **v0.4.2 再レビュー正本** | `docs/prompts/test-data-dataset-review-v042-rerun-COPYPASTE.txt` |
| Gemini/Grok 全文（v0.3系） | `docs/prompts/test-data-dataset-review-COPYPASTE.txt` |
| ChatGPT ライト | `docs/prompts/test-data-dataset-review-COPYPASTE-lite.txt` |
| プロンプトのみ（添付用） | `docs/prompts/test-data-dataset-review-PROMPT-only.txt` |
| 手順書 | `docs/prompts/test-data-dataset-review.md` |
| CSV fixture | `docs/fixtures/test-data-review/` |

---

1. `test-data-dataset-review-PROMPT-only.txt` を貼付
2. `docs/fixtures/test-data-review/` の CSV 3本を添付
3. 「添付CSVを読んで評価してください」と送る

### 共通

4. 3つの回答を `test-data-dataset-review-RESULT.md` に貼り、**一致した指摘 = 高信頼**として整理

### Fixture 一覧

| ファイル | 内容 | 評価での位置づけ |
|----------|------|------------------|
| `employee-seed42-n100-mine0.csv` | 社員100 · シード42 · 地雷なし | **主評価** · payroll と整合 |
| `payroll-seed42-n100.csv` | 明細300（×3ヶ月） | **主評価** · リレーション |
| `employee-seed42-n100-mine5.csv` | 社員100 · 地雷約5% | **副評価** · 地雷の有用性のみ |
| `employee-seed42-n25-mine0.csv` | 社員25（ライト） | ChatGPT 1回貼付用 |
| `payroll-seed42-n25.csv` | 明細75（ライト） | ChatGPT 1回貼付用 |

### 生成条件（固定）

- 基準年 2026 · 入社開始年 2000 · ID `EMP-2026-####` · メール `@example.com`
- 生年月日 `YYYY/MM/DD` · 入社年月日 `YYYY-MM-DD`
- 再雇用約7% · 住所57件マスタ整合 · マイナンバー/実口座は**生成しない**

---

## 3AI への依頼文（コピペ用 · RAW DATA 込み）

`test-data-dataset-review-COPYPASTE.txt` と同期。再生成は export スクリプト。

```text
あなたは、日本の「労務・給与の小規模実務」に詳しいプロダクトレビュアーです。
役割: 小規模社労士事務所の実務担当（給与計算SaaSのインポート検証 · 月次テスト · Excel地獄経験あり）。
論調: 現場目線 · 辛口OK · 抽象的な褒めは不要 · 根拠はCSVの具体行を引用。

【目的】
新興Webツール「SUGUDASU テストデータ」が出力した **実際のRaw CSV** を読み、
テストデータとして現場で使えるか・楔（社労士・人事・受託SI）に刺さるかを評価する。
これは製品のマーケ文案ではなく、**データ品質と実務適合のレビュー**である。

【プロダクト事実（評価の前提）】
- ブラウザ内のみ生成 · 外部送信なし · シード固定で再現可能
- 楔: 労務・給与の小規模実務（社労士・会計事務所 · 派遣人事 · 受託SI）
- やらない: 本番マスキング · 100万件 · 実マイナンバー/実口座 · 和暦列 · 年度列
- 競合: Handy（50型・SQL）/ SnowFakery（CLI）— 本ツールは「5分で業務CSV · 地雷 · シード · 情シス説明」

【渡すデータ（3ファイル）】
1. 社員マスタ100行（地雷なし）— 給与明細と **同一シードで整合**
2. 給与明細300行（社員100 × 3ヶ月）
3. 社員マスタ100行（地雷約5%）— **任意** · mine0 とシードは同じだが地雷分岐で内容がずれ、payroll とは整合しない

【回答形式 — 必ずこの順で】

## 1. 総合採点
- 採用可否: 1〜5点（5=そのまま現場で使う · 1=使えない）
- 一言理由（20字以内）

## 2. インポートで最初に止まる箇所（最大5件）
表形式: | 優先度 | ファイル | 行番号 or 社員番号 | 列名 | 問題 | 想定エラー |

※ 実際のSaaS名を推測してよい（マネーフォワード / freee / ジョブカン等）。断定できなければ「一般的なCSV取込」でよい。

## 3. データ整合性チェック
- 社員↔給与: 社員番号 · 基本給 · 通勤手当 · 雇用形態は一致しているか（不一致があれば列挙）
- フリガナ・住所・郵便番号: インポート検証として信頼できるか
- 再雇用・高齢層: テストとして意味があるか（生年・入社日の関係）
- 日付形式（生年月日 `/` · 入社 `-`）: 現場の「あるある」として妥当か

## 4. テストデータとして足りないもの（優先度付き · 最大7件）
| 優先 | 欲しい列/データ | 理由 | v0.3で必須か（Must/Should/Nice/不要） |

和暦 · 年度列は **わざと入れていない**。不要なら「不要」と明記してよい。

## 5. 地雷データ（mine5ファイル）の評価
- テストに役立つ地雷はあったか / ノイズか
- 5%の比率は適切か
- 追加すべき地雷タイプ（あれば）

## 6. 競合・代替との比較（3行以内）
Excel手打ち · 外部DL · Handy · 本CSV — 現場担当としてどれを選ぶか

## 7. 情シス・所長への説明（2文）
非送信で試す理由を、事務所向けにどう言うか

## 8. 提督への1アクション
「次に1つだけ直すなら何か」— 具体的に1件

【禁止】
- CSVを見ずに一般論だけで答えること
- 「便利そう」だけの感想
- 実マイナンバー生成を推奨すること

<<<RAW_DATA_PLACEHOLDER>>>
```

---

## 結果テンプレ（突合用）

`docs/notes/test-data-dataset-review-RESULT.md` に以下を貼る:

```markdown
# テストデータ Raw CSV — 3AIロールレビュー結果

**日付:** YYYY-MM-DD  
**Fixture:** seed42 · employee100 · payroll300  
**ROLE:** 小規模社労士事務所の実務担当

## 採点サマリ
| AI | 点数 | 一言 |
|----|------|------|
| Gemini | | |
| Grok | | |
| ChatGPT | | |

## 3AI一致（高信頼）
-

## 相違（要ヒアリング or 保留）
-

## 次の1手（製品）
-
```

---

## 再生成

```bash
node scripts/export-test-data-review-fixtures.mjs
```

`manifest.json` の `payrollEmployeeMismatchRows` が **0** であることを確認（mine0 ↔ payroll 整合）。
