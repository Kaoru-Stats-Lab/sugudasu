# Smart Diff — Expected Delta Ledger（Wave 6.1）

| 項目 | 値 |
|------|-----|
| **Status** | Golden（人間正解表） |
| **Date** | 2026-08-06 |
| **Manifest** | [`Golden_Fixture_Manifest.md`](Golden_Fixture_Manifest.md) |

> **人間による正解表。** Smart Diff の出力と突き合わせる。  
> `deltaId` は検証用固定 ID（実装の `delta-N` と一致しなくてよい · 突合は location + kind + text）。

**5分確認用:** 各 Fixture の表だけ読めば足りる。長文本文は「抜粋」列を優先。

---

## 共通列定義

| Field | Description |
|-------|-------------|
| deltaId | 固定ID |
| location | 文書位置（条・節・表） |
| old text | 変更前（抜粋） |
| new text | 変更後（抜粋） |
| kind | Added / Deleted / Modified |
| detail | text / style_only / table_changed / （Candidate 仕込み） |
| expected visibility | Navigator 既定 Filter で見えるべきか |
| user importance | High / Medium / Low |

---

# Fixture A — `V-A-contract`（業務委託契約書 · DOCX）

**Expected Change Count: 10**  
**条番号は新旧とも同一（第1〜第9条・別表）。**

| deltaId | location | old text | new text | kind | detail | expected visibility | user importance |
|---------|----------|----------|----------|------|--------|---------------------|-----------------|
| VA-01 | 第1条（期間）本文 | 本契約の有効期間は**12ヶ月**とする。 | 本契約の有効期間は**24ヶ月**とする。 | Modified | text | yes | High |
| VA-02 | 第3条（責任）本文 | 損害は**甲が負担する**。 | 損害は**甲乙協議する**。 | Modified | text | yes | High |
| VA-03 | 第5条（報酬）本文 | 月額**300,000円**（税別） | 月額**350,000円**（税別） | Modified | text | yes | High |
| VA-04 | 第4条（成果物）本文 | 納品は「遅滞なく」行う。 | 納品は「直ちに」行う。 | Modified | text | yes | Medium |
| VA-05 | 第6条（解除）見出し下・強調 | 重要事項（通常） | **重要事項**（太字） | Modified | style_only | yes※Style ON | Medium |
| VA-06 | 別表1 料金表 | （表内容 v1）基本料 300,000 … | （表内容 v2）基本料 350,000 … | Modified | table_changed | yes | High |
| VA-07 | 第7条（再委託） | （段落あり）乙は事前承諾なく再委託できる。 | （段落なし・削除） | Deleted | text | yes | High |
| VA-08 | 第8条（秘密）末尾 | （なし） | **追加:** 監査への合理的協力義務を負う。 | Added | text | yes | Medium |
| VA-09 | 第9条（通知）住所 | 通知先: 東京都千代田区1-1 | 通知先: 東京都港区2-2 | Modified | text | yes | Medium |
| VA-10 | 前文（契約趣旨） | （短い前文のみ） | 前文に「法令遵守及び相手方秘密の保持」を**1文追加** | Added | text | yes | Low |

※ VA-05: 既定 Filter で Style OFF の場合は非表示になりうる → セッション前に Style を ON にするか、被験者に「書式のみの変更も含む」と明示する。

**非変更（トラップ）**

| 位置 | 内容 | 期待 |
|------|------|------|
| 第2条 タイトル「目的」 | 文言同一 | Unchanged · 一覧に出さない（既定） |
| 条番号「第5条」 | 番号同一 | Unchanged |

---

# Fixture B — `V-B-work-rules`（就業規則抜粋 · DOCX）

**Expected Change Count: 11**

| deltaId | location | old text | new text | kind | detail | expected visibility | user importance |
|---------|----------|----------|----------|------|--------|---------------------|-----------------|
| VB-01 | 第1章 総則 §1 | この規則は従業員に適用する。 | この規則は正社員及び契約社員に適用する。 | Modified | text | yes | High |
| VB-02 | §2 定義 | （なし） | **追加段落:** 「契約社員」とは期間の定めのある者をいう。 | Added | text | yes | Medium |
| VB-03 | 第2章 労働時間 | 所定労働時間は1日8時間とする。 | 所定労働時間は1日7時間45分とする。 | Modified | text | yes | High |
| VB-04 | 休日（強調） | 法定休日（通常） | **法定休日**（太字） | Modified | style_only | yes※Style ON | Low |
| VB-05 | 服務規律リスト | 項目: 機密保持 / 設備愛護 | 項目: 機密保持 / 設備愛護 / **ハラスメント禁止** | Added | list item | yes | High |
| VB-06 | 服務・削除 | 「私的メールの全面禁止」項目あり | 当該項目**削除** | Deleted | list item | yes | Medium |
| VB-07 | 休日・休暇表 | 表 v1（夏季3日 …） | 表 v2（夏季5日 …） | Modified | table_changed | yes | High |
| VB-08 | 第4章 懲戒 | 戒告・減給・懲戒解雇 | 戒告・減給・**出勤停止**・懲戒解雇 | Modified | text | yes | High |
| VB-09 | 附則 施行日 | 2024年4月1日 | 2026年4月1日 | Modified | text | yes | Medium |
| VB-10 | 安全衛生 | （短い1段落） | 段落末に「産業医面談の申出可」を追加 | Modified | text | yes | Medium |
| VB-11 | 表の注記 | （なし） | 表下に注記1行追加「詳細は別紙」 | Added | text | yes | Low |

**Table 期待（Phase1）**

```text
VB-07 → kind Modified · detail table_changed
表示: 「表に変更があります」
禁止期待: 「○行○列」のセル Diff
```

---

# Fixture C — `V-C-construction-plan`（施工計画抜粋 · PDF）

**Expected Change Count: 8**  
**OCR ページは比較対象外（Loss `ocr_required`）。**

| deltaId | location | old text | new text | kind | detail | expected visibility | user importance |
|---------|----------|----------|----------|------|--------|---------------------|-----------------|
| VC-01 | 表紙・発行日 | 発行日: 2026-04-01 | 発行日: 2026-06-01 | Modified | text | yes | High |
| VC-02 | §2 工程名 | 工程: 躯体工事 | 工程: 仕上げ工事 | Modified | text | yes | High |
| VC-03 | §3 数量 | コンクリート 120 m³ | コンクリート 135 m³ | Modified | text | yes | High |
| VC-04 | §4 工期 | 着工 2026-05-01 / 竣工 2026-09-30 | 着工 2026-05-15 / 竣工 2026-10-15 | Modified | text | yes | High |
| VC-05 | p.2 本文（改ページ後） | 「仮設機材は元請支給」 | 「仮設機材は**下請調達**」 | Modified | text | yes | Medium |
| VC-06 | 安全方針リスト | 3項目 | 4項目目「KY活動毎日実施」**追加** | Added | text/list | yes | Medium |
| VC-07 | 工程概要表 | 表 v1 | 表 v2（工期列変更） | Modified | table_changed | yes | High |
| VC-08 | （任意）注記段落 | 短文同一だった注記 | 注記に「変更管理票を添付」追加 | Modified | text | yes | Low |

**PDF 限界（差分ではなく Loss / 対象外）**

| ID | 現象 | 期待 Smart Diff |
|----|------|-----------------|
| VC-L1 | 2段組レイアウト頁 | Loss `reading_order_uncertain`（比較は続行可） |
| VC-L2 | スキャン画像のみの頁 | Text なし · `ocr_required` · **比較対象外** |
| VC-L3 | 改ページ | page origin 保持 · **Section 生成しない** |

---

## 突合ルール（Smart Diff 結果との比較）

1. Ledger の `kind` + `location` + 主要トークン（数字・固有語）でマッチ  
2. 実装の `delta-N` ID 一致は求めない  
3. Candidate になった場合: **見落としにしない** · `False Alarm` でもない · 「確認候補として提示された」と別記録  
4. `style_only` 非表示はセッション設定ミスとして再試行可  

---

## 5分レビュー手順（ファシリテータ）

1. Manifest の Change Count を見る（A10 / B11 / C8）  
2. 各表の High 行だけ目視（A: VA-01,02,03,06,07）  
3. Table は「表に変更があります」期待であることを確認  
4. C の Loss 行（L1–L3）を口頭で被験者に説明できるか確認  
