# Gemini依頼用: Data軸 × Finance軸 — Priority 高項目の深掘りリサーチ

**用途:** Q3–Q4 実装候補の **競合・UX・SEO・仕様境界** を調査（実装・記事本文・コード禁止）  
**更新:** 2026-07-03  
**上流:** [`docs/notes/data-finance-axis-gemini-RESULT.md`](../notes/data-finance-axis-gemini-RESULT.md) §2  
**突合先:** `BACKLOG.md` §1-15-6/7/8 · `NORMALIZE_TEXT_TOOL_SPEC.md` · `LOTTERY_PRIZE_LAW_TOOL_SPEC.md`

**使い方**

1. 新規 Gemini チャット（長文OK · Deep Research 可）
2. 任意添付: `data-finance-axis-gemini-RESULT.md`（§0–§2）· `data/tool-registry.json`
3. 下記依頼文をコピペ
4. 出力を `docs/notes/data-finance-priority-gemini-RESULT.md` に保存 → Cursor が SSOT 化

---

## 調査対象（Priority 固定 · この8件のみ）

| P | 四半期 | id | 機能 | 状態 |
|---|--------|-----|------|------|
| **P0** | Q3 | `normalize` | 行ソート · 重複削除 · キーワード行フィルタ | GO拡張 |
| **P0** | Q3 | `fair-draw` | Connpass CSV D&D · 列選択（名簿） | GO · §1-15-6 |
| **P0** | Q3 | `table-conv` | Shift-JIS/BOM · Excel↔MD↔JSON 仕様調査 | planned · SSOT初稿用 |
| **P1** | Q4 | `invoice` | 源泉徴収 10.21% トグル · 端数明示 | GO |
| **P1** | Q4 | `invoice` | 内税 8%/10% 混在の分離計算 UI | GO |
| **P1** | Q4 | `time-calc` | h:mm 合計 · 時給掛け算（労働時間電卓） | planned 昇格 |
| **P1** | Q4 | `table-conv` | 正式配信向け UX · 競合 · SEO | GO |
| **P2** | Q1 | `normalize` | メール/電話伏字プリセット | GO（参考調査のみ） |

**調査しない（明示）:** `diff` 新規id · `anbun` 新規id · `reverse` エンコード拡張 · `warikan` 財務電卓化

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本の実務Webツール・フリーランス帳票・社内データ整形市場に詳しい調査アシスタントです。
礼賛・前置き長文・記事本文・LP全文・コード実装は不要。指定フォーマットの表と箇条書きのみ。
捏造禁止。検索ボリューム・シェアは分からなければ「要確認（Keyword Planner等）」。
未実装を実装済みと書かない。

【製品前提 — SUGUDASU コア】
- 静的サイト · 登録不要 · ブラウザ内完結（非送信訴求）
- 新規 HTML は四半期あたり最大1 id。既存 id 拡張優先
- 税務法務の断定禁止（F7）— 「一般的な計算例」「要専門家確認」を添える
- `reverse` は逆引き辞典（エンコード拡張しない）

【今回の調査対象 — 8項目のみ】
P0 normalize 行ソート/重複削除/行フィルタ
P0 fair-draw Connpass CSV D&D+列選択
P0 table-conv Shift-JIS/BOM+表双方向変換仕様
P1 invoice 源泉徴収10.21%
P1 invoice 内税8%/10%混在分離
P1 time-calc h:mm合計+時給
P1 table-conv 競合UX+SEO
P2 normalize 伏字プリセット（参考）

---

【共通テンプレ — 各項目に適用】
各 Priority 項目について、次の **ミニ調査パック** を出す（表＋箇条書き）。

### パックA: Pain & ペルソナ（5行以内）
- 誰が · どんな場面で · 今何で凌いでいるか · なぜ外部Converterが使えないか

### パックB: 競合表（日本語圏3 + 英語圏2 · 最大5行）
列:
| サービス/ツール | 送信の有無 | 強み | 弱点 | SUGUDASUが勝てる1点 | 红海/ニッチ |

### パックC: Keyword Planner 向けシード（日本語8本）
形式: `キーワード | 意図（1行）| 月間感（高/中/低/要確認）| 競合（低/中/高）`

### パックD: UX仕様の示唆（実装者向け · 箇条書き6項目以内）
- 入力UI · 出力UI · エラー時 · 行数/サイズ上限の目安 · やらないこと · 非送信の見せ方（DevTools等）

### パックE: リスク・F7・コンプラ（3項目以内）

---

【項目別の追加依頼】

#### P0-1 `normalize` — ソート · 重複削除 · 行フィルタ

パックA–E に加え:
- **既存プリセット（sql_in, comma_join, name_trim）との役割分担表** — 新トグル3つの命名案（日本語ラベル）
- **ソート:** 数値行 vs 文字列行の混在リストで起きる事故パターン3例
- **重複削除:** 大文字小文字 · 全角半角を「同一視するか」— 日本ユーザー向け推奨デフォルト
- **行フィルタ:** 正規表現は要否？ 初心者向けは「含む/含まない」のみで足りるか

#### P0-2 `fair-draw` — Connpass CSV

パックA–E に加え:
- **Connpass エクスポートCSVの典型列名**（要確認可）— 抽選に使う列の候補（ニックネーム/氏名/メール/受付番号）
- **ドラムロール演出は Out** — 代替の「幹事が場を盛り上げる」非演出UX 3案
- **景品表示法チェックとの共存** — CSV抽選時に幹事が踏むべき注意1段落（断定弱め）
- **Wheel of Names / 類似ツール** との差別化（非送信・証跡PDF・日本幹事）

#### P0-3 `table-conv` — Shift-JIS · 表変換仕様（SSOT初稿用）

パックA–E に加え:
- **Excelコピペ → TSV/MD/JSON** のデータ損失ポイント表（結合セル · 改行セル · 数式 · 日付）
- **Shift_JIS / CP932 / BOM** — ブラウザのみで扱う際の既知制約（FileReader · Encoding API · 要確認）
- **Markdown表 vs CSV** — Notion/Backlog/GitHub向けにどちらをデフォルトにすべきか（理由付き推奨1つ）
- **normalize との境界** — 「1列リスト」と「2次元以上の表」を分ける判断基準（1段落）

#### P1-4 `invoice` — 源泉徴収 10.21%

パックA–E に加え:
- **フリーランス請求でよくあるパターン表** — 税込/税抜 · 消費税別 · 源泉あり/なし · 端数処理
- **既存クラウド請求書** が源泉をどう扱うか（freee/MoneyForward等 · 一般論 · 要確認可）
- **UI最小案** — チェック1つで足りるか、別フィールドが要るか
- **免責文案** 1例（F7準拠）

#### P1-5 `invoice` — 内税 8%/10% 混在

パックA–E に加え:
- **インボイス適格請求書で混在税率の記載義務** — 実務上の表示項目チェックリスト（専門家確認注記付き）
- **端数処理** — 行ごと vs 合計ごと · 切捨て/四捨五入の一般的選択（断定弱め）
- **warikan に載せない理由** を1段落（幹事集金 vs 帳票）

#### P1-6 `time-calc` — 労働時間 h:mm

パックA–E に加え:
- **競合:** 勤怠SaaSではなく「電卓・スプレッドシート・Google検索」での回避パターン
- **入力形式の許容** — `1:30` `1.5` `90分` 混在時のパース優先順位案
- **F7:** 残業代・法定労働時間の自動判定は **Out** である旨の境界
- **id命名** — `time-calc` vs `work-calc` のSEO観点（要確認）

#### P1-7 `table-conv` — 発売向け競合・SEO

P0-3と重複する場合は **差分のみ**。
- **ロングテールキーワード日本語15本** — Excel Notion 表 変換 · CSV 文字化け 等
- **Tier A LP に載せるべき FAQ 5問**（型D · 信頼・非送信中心）
- **ガイド記事 `/guides/` タイトル案3本**

#### P2-8 `normalize` — 伏字（参考）

パックB・Cのみ（浅く）。
- メール `a***@example.com` · 電話 `090-****-1234` の **一般的マスク規則** 2–3パターン
- `mask`（画像）との導線文案1行

---

【依頼9】横断 — Priority 実装順の最終確認表

8項目を **実装順1–8** で並べ替え。列:
| 順 | id | 機能 | 工感（S/M/L · 相対）| 非送信差別化（高/中/低）| SEO期待（高/中/低）| 依存（他項目）| Go/No-Go |

**Go/No-Go** は調査結果に基づき率直に。No-Go は理由1行。

【依頼10】提督への追加質問（調査で判明した未決のみ · 最大3問）

選択肢付き。問い1–4（table-conv独立id等）は **決定済みとして再問しない**:
- table-conv = 独立id GO
- diff = 当面HOLD
- warikan = 幹事特化
- 伏字 = normalize プリセット

【出力ルール】
- 日本語 · Markdown表
- 各項目見出し `## P0-1 normalize ...` 形式
- 礼賛・「最強」禁止
- 红海行には「红海」か「AI代替高」を1語
- 合計で長くてよい（Token潤沢想定）
```

---

## Cursor 側の反映手順

1. 出力を `docs/notes/data-finance-priority-gemini-RESULT.md` に保存
2. P0-3 / P1-7 → `table-conv` SSOT 初稿の入力に
3. P0-2 → `LOTTERY_PRIZE_LAW_TOOL_SPEC.md` または `fair-draw` FAQ 追記案
4. P1-4/5 → `invoice` 仕様メモ（既存があれば突合）
5. 依頼9の順序 → `data/roadmap.json` 更新（提督承認後）
