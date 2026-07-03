# Data軸 × Finance軸 — Priority 深掘りリサーチ RESULT（Cursor 突合済）

**更新:** 2026-07-03  
**入力:** Gemini 依頼1–10 全文 + Grok 短縮版（提督貼付）  
**プロンプト:** [`docs/prompts/data-finance-priority-gemini-research.md`](../prompts/data-finance-priority-gemini-research.md)  
**上流:** [`data-finance-axis-gemini-RESULT.md`](data-finance-axis-gemini-RESULT.md)

---

## 0. Cursor 突合サマリー（提督向け）

Gemini 詳細版は **実装仕様のたたき台として採用可**。Grok 版は同趣旨の短縮だが **一部 SSOT と逆** のため採用しない。

| 論点 | Gemini | Cursor 判定 |
|------|--------|-------------|
| fair-draw が「新規 id 枠を消費」 | 今期枠消費と記載 | **誤り** — `fair-draw` は **既存 beta**。CSV D&D は **GO拡張のみ** |
| table-conv を Q3 フル配信（工感 L） | 実装順 #1 | **修正** — Q3 は **SSOT + スパイク**。正式配信は **Q4・新規 id 枠** |
| 重複削除デフォルト | 完全一致（安全側） | **採用** · Grok「同一視デフォルト」は **却下** |
| invoice 源泉 UI | 100万超累進 + 端数トグル要 | **採用** · Grok「チェック1つのみ」は **不足** |
| 証跡PDF | 初期実装要否の問い | **既存実装済** — CSV取込時に **PDF/JSON へファイル名・列名を追記** で足りる |
| normalize 行数上限 | 1万行 / 1MB | **要実測** — まず **5,000行** で警告（table-conv と揃える） |
| Web Crypto | `crypto.getRandomValues` 推奨 | **既存** — fair-draw は Web Crypto 済。CSV 経路も同じ |

**Grok との相違（採用しない）**

- normalize 重複削除のデフォルト同一視
- invoice 源泉「チェック1つで足りる」
- fair-draw 証跡「PDF即時」だけの差別化（既に3点セットあり）

---

## 1. 実装順 — 正本（四半期 id 枠込み）

**ルール:** 四半期 **新規 id 最大1**。Q3=0 · Q4=`table-conv` · Q1'27=`time-calc`

| 順 | 時期 | id | 機能 | 工感 | Go |
|----|------|-----|------|------|-----|
| 1 | Q3 | `normalize` | 行ソート · 重複削除 · 行フィルタ | M | Go |
| 2 | Q3 | `fair-draw` | Connpass CSV D&D · 列選択 · 表示名デフォルト | M | Go |
| 3 | Q3 | `table-conv` | SSOT 初稿 · CP932 スパイク · エンコード PoC | S | Go |
| 4 | Q4 | `table-conv` | **MVP 配信**（Excel貼付/CSV → MD·JSON·TSV） | L | Go |
| 5 | Q4 | `invoice` | 源泉 10.21%（累進・端数トグル） | M | Go |
| 6 | Q4 | `invoice` | 内税 8%/10% 混在分離 | M | Go |
| 7 | Q1'27 | `time-calc` | h:mm 合計 · 時給（**新規 id**） | M | Go |
| 8 | Q1'27 | `normalize` | 伏字プリセット（メール・電話） | S | Go |
| — | HOLD | `diff` | テキスト2面比較 | — | 様子見 |
| — | PARK | `anbun` | 按分新規 id | — | ガイドのみ |

---

## 2. 項目別 — 採用仕様メモ

### P0-1 `normalize` — ソート / 重複削除 / 行フィルタ

**Pain（採用）:** 事務・マーケが Excel/エディタ以外で **非送信** の行処理。

**UX（採用）**

| 項目 | 仕様 |
|------|------|
| UI | 既存テキストエリア + **オプション3つ**（並び替え / 重複削除 / 行フィルタ） |
| フィルタ | **含む · 含まない** のみ（正規表現は上級者折りたたみ・デフォルト OFF） |
| ソート | デフォルト **文字列昇順** · オプション **数値として**（混在時は事故注意 FAQ） |
| 重複削除 | デフォルト **完全一致** · オプション「大文字小文字・全角半角を同一視」 |
| 上限 | **5,000行** 警告（超過は処理中断 or 先頭 N 行のみ — 実装時に1つに固定） |
| プリセット名 | `行を並び替え` · `重複行を削除` · `特定の行を抽出・除外` |

**ソート事故 FAQ 用（採用）:** `10` vs `2` 辞書順 · 全角数字混在 · 先頭スペース/記号。

**SEO 上位キーワード:** `テキスト 重複削除 オンライン` · `行 フィルタ 抽出` · `SQL IN句`（既存）· `データの重複を削除 安全`

---

### P0-2 `fair-draw` — Connpass CSV

**Pain（採用）:** 幹事が **本番 CSV を外部に上げず** 抽選したい。

**UX（採用）**

| 項目 | 仕様 |
|------|------|
| 入力 | CSV **D&D** + 既存テキスト貼付併存 |
| 列選択 | ヘッダー解析 → ドロップダウン。**初期推奨列: `表示名`**（メールは投影非推奨） |
| 典型列（要実機確認） | `ユーザー名` `表示名` `メールアドレス` `受付番号` `ステータス` |
| 文字コード | UTF-8 優先 · 失敗時 Shift-JIS 手動トグル |
| 上限 | **5,000行** |
| 演出 | **ドラムロール Out** — 代替: ①カウントダウン ②高速シャッフル数秒 ③**めくるカード**（幹事トーク用） |
| 乱数 | Web Crypto（**現行維持**） |

**証跡（重要 — 新規ではない）**

- 監査 PDF · JSON · 名簿 txt は **既存**。CSV 版では PDF/JSON に **`sourceFileName` · 選択列名 · 行数** を追記するだけでよい（問い1 回答: **A の内容は拡張で足りる · ゼロから作らない**）。

**景表法注記（採用文案）:** Gemini 段落を FAQ に要約掲載（断定弱め · 専門家確認）。

**差別化:** Connpass 列認識 + 非送信 + **既存3点証跡** + 日本幹事 UI。

---

### P0-3 / P1-7 `table-conv` — 表変換

**Pain（採用）:** Excel/CSV → Notion·MD·JSON、**Shift-JIS 文字化け**、社外秘の非送信。

**UX（採用）**

| 項目 | 仕様 |
|------|------|
| 入力 | **デュアル** — テキストエリア（Excel コピペ TSV）+ ファイル D&D |
| 出力タブ | **Markdown（デフォルト）** · JSON · CSV · TSV |
| MD セル内改行 | Markdown 出力時 `<br>` 置換（表崩れ防止） |
| 結合セル | 値は左上のみ — **仕様として FAQ 明記** |
| 文字化け | 出力前 **置換文字検知** 警告 |
| BOM | Excel 向け UTF-8 BOM 出力オプション |
| normalize 境界 | **列が2以上 or タブ/カンマ区切り** → table-conv。1列リスト → normalize |

**逆変換（問い2 回答 — 段階）**

| フェーズ | 範囲 |
|----------|------|
| **v1（Q4 MVP）** | Excel貼付 / CSVファイル → MD · JSON · CSV · TSV（**片道**） |
| **v1.1** | Markdown 表貼付 → TSV/JSON（**双方向の半分**） |
| HOLD | 壊れやすい MD 逆変換の完全自動は v1.1 以降で品質確認後 |

**Tier A FAQ（採用）:** Gemini 5問（非送信 · オフライン · Shift-JIS · DevTools · 無料）。

**ガイド案（採用）**

1. 社内秘 Excel/CSV を Notion/Markdown へ送信せず変換  
2. Shift-JIS と BOM の仕組みとブラウザでの直し方  
3. エンジニア不要の Excel コピペ → JSON/MD

**SEO:** `Excel Markdown 変換` · `Shift-JIS CSV 文字化け` · `エクセル コピペ マークダウン` 等（Gemini 15本リスト採用）。

---

### P1-4 `invoice` — 源泉 10.21%

**UX（採用）**

| 項目 | 仕様 |
|------|------|
| トグル | 「源泉徴収（10.21%）を差し引く」 |
| 追加 | **端数処理**（切捨て / 四捨五入 / 切上げ） |
| 累進 | **100万円超** 20.42% 対応トグル（実務 FAQ 必須） |
| 税込/税抜 | ラジオで選択（Gemini パターン表採用） |
| 免責 | Gemini F7 文案採用 |

**棲み分け:** freee/MF はクラウド本番。**SUGUDASU = 登録不要の検算・1枚 PDF**。

---

### P1-5 `invoice` — 内税 8%/10% 混在

**UX（採用）**

| 項目 | 仕様 |
|------|------|
| 入力 | `10%対象（税込）` · `8%対象（税込）` フィールド |
| 計算 | **税率ごとに1回だけ端数処理**（デフォルト切捨て） |
| 出力 | インボイス記載想定の内訳グリッド + コピー |
| OCR | **Out**（サーバー不要維持） |
| warikan | **載せない**（Gemini 段落を FAQ 正本化済） |

---

### P1-6 `time-calc` — h:mm + 時給

**UX（採用）**

| 項目 | 仕様 |
|------|------|
| id | **`time-calc`**（`work-calc` ではない — SEO「時間計算」） |
| 入力 | `h:mm` 優先 → `1.5` 10進 → `90分` / `1時間30分` |
| 出力 | 合計 `58:30` 形式（**24h リセットしない**）+ 10進時間 + 時給×合計 |
| やらない | 残業・深夜割増・法定労働 **自動判定 Out** |
| 端数 | 時給掛け算は **切捨て** 明示 |

**時期（問い3 回答）:** **A — Q1'27 に単独 id**。既存 id タブ内包は SEO 資産を失う。

---

### P2-8 `normalize` — 伏字（Q1'27）

| パターン | ルール |
|----------|--------|
| メール | ローカル部先頭1–2文字 + `***` + `@domain` |
| 電話 | 中央4桁 `****`（`090-****-1234`） |
| 氏名 | 姓2文字目以降・名2文字目以降を `*` |

**mask 導線:** 「画像の黒塗りは [マスク](/mask)」— normalize 本文に1行リンク。テキスト伏字は normalize プリセット。

---

## 3. 提督への質問 — 回答（決定案）

### 問い1: fair-draw 証跡 PDF を初期から？

| 選択肢 | 推奨 |
|--------|------|
| A) 初期から PDF | **△ →「CSV メタデータ追記」として A** |
| B) フェーズ2 | × |

**理由:** 監査 PDF は **既に標準装備**。CSV 対応は **印刷テンプレに filename · column · rowCount** を足す拡張で十分。

### 問い2: table-conv 双方向（MD 逆変換）

| 選択肢 | 推奨 |
|--------|------|
| A) 完全双方向 | **△ v1.1 目標** |
| B) 片道のみ | **◎ v1 MVP** |

### 問い3: time-calc を今期内包？

| 選択肢 | 推奨 |
|--------|------|
| A) 来期まで単独 id | **◎** |
| B) 既存 id タブ | × |

**理由:** Q4 の新規 id は **`table-conv` 専用**。`fair-draw` は枠を消費しない。

---

## 4. roadmap.json 追記候補（承認後に反映）

```json
[
  { "id": "normalize-line-ops", "status": "scheduled", "priority": 4, "toolId": "normalize", "title": "行ソート · 重複削除 · 行フィルタ" },
  { "id": "fair-draw-connpass-csv", "status": "scheduled", "priority": 5, "toolId": "fair-draw", "title": "Connpass CSV 取込 · 列選択" },
  { "id": "table-conv-mvp", "status": "scheduled", "priority": 6, "toolId": "table-conv", "title": "表データ相互コンバータ MVP" },
  { "id": "invoice-withholding", "status": "scheduled", "priority": 7, "toolId": "invoice", "title": "源泉徴収 10.21% · 端数 · 累進" },
  { "id": "invoice-mixed-tax", "status": "scheduled", "priority": 8, "toolId": "invoice", "title": "内税 8%/10% 混在分離" },
  { "id": "time-calc-labor", "status": "considering", "priority": 9, "toolId": "time-calc", "title": "労働時間 h:mm 合計 · 時給" }
]
```

---

## 5. 次アクション（Agent）

- [x] `docs/notes/TABLE_CONV_TOOL_SPEC.md` 初稿（P0-3 + P1-7）
- [x] `NORMALIZE_TEXT_TOOL_SPEC.md` § Phase C（行オプション）· § Phase D（伏字）
- [x] `LOTTERY_PRIZE_LAW_TOOL_SPEC.md` §4-1b — Connpass CSV
- [x] `INVOICE_FINANCE_EXTENSION_SPEC.md` — 源泉 · 内税混在
- [x] `TIME_CALC_TOOL_SPEC.md` — h:mm + 時給（Q1'27）
- [x] `data/roadmap.json` 6件追記
- [ ] 提督承認後 changelog / hub プレビュー文言

---

## 6. 仕様書索引

| id | SSOT |
|----|------|
| `table-conv` | [`TABLE_CONV_TOOL_SPEC.md`](TABLE_CONV_TOOL_SPEC.md) |
| `normalize` | [`NORMALIZE_TEXT_TOOL_SPEC.md`](NORMALIZE_TEXT_TOOL_SPEC.md) Phase C/D |
| `fair-draw` | [`LOTTERY_PRIZE_LAW_TOOL_SPEC.md`](LOTTERY_PRIZE_LAW_TOOL_SPEC.md) §4-1b |
| `invoice` | [`INVOICE_FINANCE_EXTENSION_SPEC.md`](INVOICE_FINANCE_EXTENSION_SPEC.md) |
| `time-calc` | [`TIME_CALC_TOOL_SPEC.md`](TIME_CALC_TOOL_SPEC.md) |

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-03 | 初版 — Gemini/Grok 貼付 · Cursor 突合 · 実装順修正 · 問い1–3 決定案 |
