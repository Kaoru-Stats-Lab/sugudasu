# Data軸 × Finance軸 — Gemini ブレスト結果（Cursor 突合済）

**更新:** 2026-07-03  
**入力:** 提督貼付（Gemini 依頼1–8 出力）  
**プロンプト:** [`docs/prompts/data-finance-axis-gemini-brainstorm.md`](../prompts/data-finance-axis-gemini-brainstorm.md)  
**突合:** `vibe-coding-mece-gemini-RESULT.md` · `PRODUCT_IDEA_JUDGMENT_LEDGER.md` · `BACKLOG.md` §1-15-8

---

## 0. Cursor 突合サマリー（提督向け）

**採用:** 2軸＋第3クラスタ（幹事）＋Visual従属＋Sync隔離 — **前提検証はそのまま正本化してよい**。

**修正が必要な提案（Gemini の誤り・既存判断と衝突）**

| Gemini 提案 | Cursor 判定 | 理由 |
|-------------|-------------|------|
| `reverse` を URL/Base64 デコードに拡張 | **却下** | `reverse` = **逆引き類語辞典**（`vibe-coding-mece-gemini-RESULT` 明記）。エンコード系は **T07 縮小** or 将来 `devtools` 仮称 |
| `diff` を Q2 2027 新規 id GO | **HOLD → P2** | 非送信価値はあるが **红海 · hub 増**。まず `normalize` 5行プレビュー拡張 or オマケ |
| `report` に支払調書プリセット | **却下** | `report` = **議事録**。帳票系は `invoice` / ガイド / `normalize` 出力プリセット |
| `anbun` 新規 id Q1 2027 | **PARK（ガイドのみ）** | F7 · 季節需要 · AI代替高。記事＋電卓例で足りる |
| テキストマスクを `mask` に統合 | **分割推奨** | `mask` = Canvas 画像。リスト伏字は **`normalize` プリセット** が自然 |
| `warikan` を「表の何でも電卓」化 | **却下** | 幹事文脈を維持。内税分離は **`invoice`**、外貨は warikan に **最小1トグル**まで |

---

## 1. 2軸前提（採用正本）

| 項目 | 判定 |
|------|------|
| Data × Finance の MECE | **採用** |
| 第3クラスタ（幹事） | `timeline` · `group-split` · `link-qr` · `fair-draw` |
| Visual 従属 | `mask` · `webp-to-jpg` · `png-to-webp` — 大黒柱にしない |
| Sync 隔離 | 保存・同期は `sync.sugudasu.com` のみ |

### 「手厚さ」Tier 定義（採用）

| Tier | 要件 |
|------|------|
| **S** | 独立LP＋ガイド＋プリセット5+＋Zenn＋横連携 |
| **A** | 独立id＋FAQガイド＋プリセット2–3 |
| **B** | 既存idへのタブ/トグル＋FAQ |
| **C** | ロジック/プリセットのみ |

**看板配置（FIX）**

- Data: `normalize`（S）· `table-conv`（A）· `test-data`（A）
- Finance: `invoice`（S）· `receipt`（A）· `warikan`（A）

---

## 2. 実装順 — Cursor 修正版（12ヶ月）

`vibe-coding-mece-gemini-RESULT` §5 と整合。

### 2026 Q3（Jul–Sep）— Data 基盤

| 順 | 項目 | id | 判定 |
|----|------|-----|------|
| 1 | `sql_in` · `tab_to_comma` | normalize | **済 / 仕上げ** |
| 2 | ソート · 重複削除 · 行フィルタ | normalize | GO拡張 · Tier B |
| 3 | fair-draw Connpass CSV D&D | fair-draw | GO · §1-15-6 |
| 4 | Shift-JIS 調査スパイク | table-conv | SSOT 初稿 |

**新規 id: 0**

### 2026 Q4（Oct–Dec）— Finance 帳票 ＋ table-conv

| 順 | 項目 | id | 判定 |
|----|------|-----|------|
| 1 | **`table-conv` 正式配信** | table-conv | GO · **Q4 新規 id 枠** |
| 2 | 源泉徴収トグル明示化 | invoice | GO |
| 3 | 内税8/10%分離タブ | invoice | GO（warikan ではない） |

**新規 id: 1（`table-conv`）** · `time-calc` は **Q1'27** へ（[`data-finance-priority-gemini-RESULT.md`](data-finance-priority-gemini-RESULT.md)）

### 2027 Q1（Jan–Mar）— テストデータ ＋ time-calc

| 順 | 項目 | id | 判定 |
|----|------|-----|------|
| 1 | **`time-calc`**（h:mm 合計 · 時給） | time-calc | GO · **新規 id 枠** |
| 2 | 日本語住所・氏名プリセット強化 | test-data | GO |
| 3 | 按分の**ガイド記事**（電卓例） | guides | GO · **`anbun` id なし** |
| 4 | 伏字プリセット（メール・電話） | normalize | GO |

**新規 id: 1（`time-calc`）**

### 2027 Q2（Apr–Jun）— diff 判断点

| 順 | 項目 | id | 判定 |
|----|------|-----|------|
| 1 | T07 縮小（JSON Pretty + URL decode） | devtools or 1HTML | HOLD |
| 2 | `diff` 新規 | diff | **HOLD** — Q2 はスパイクのみ。GOなら四半期 id 枠を消費 |
| 3 | `png-to-webp` | png-to-webp | §1-14 既存計画 |

---

## 3. 提督への質問 — Cursor 推奨回答

### 問い1: `table-conv` の切り口

| 選択肢 | 推奨 |
|--------|------|
| A) 独立新規 id（Tier A） | **◎ 推奨** |
| B) `normalize` の大タブ | **×** |

**理由:** Pain が違う（**行リスト整形** vs **表構造の双方向変換**）。registry · lp-matrix · `BACKLOG` §1-15-8 で **planned 独立 id** 済。normalize に吸収すると Tier S が肥大化し SEO も `/table-conv` を失う。

### 問い2: `diff` 新規 id

| 選択肢 | 推奨 |
|--------|------|
| A) 新規 id 投資 | **△**（2027 Q2 以降 · 四半期 id 枠とトレードオフ） |
| B) オマケ / PARK | **◎ 当面** |

**理由:** `vibe-coding-mece-gemini-RESULT` で **HOLD** 済。先に `normalize` の Before/After 5行→拡張プレビューで様子見。社外秘 diff が FB で再燃したら `diff` id を再評価。

### 問い3: `warikan` 拡張方向

| 選択肢 | 推奨 |
|--------|------|
| A) 何でも電卓化 | **×** |
| B) イベント集金に絞る | **◎** |

**理由:** 幹事クラスタとの動線が `warikan` の差別化。内税分離は **`invoice`**。外貨は **固定レート手入力の1機能**まで（API 禁止）。

### 問い4: テキストマスク UI

| 選択肢 | 推奨 |
|--------|------|
| A) `mask` にテキスト欄 | **×** |
| B) `normalize` 伏字プリセット | **◎** |

**理由:** `mask` = スクショ Canvas（§1-15-2）。`ya***@example.com` 系は **文字列置換プリセット** が筋。画像とテキストを1画面にすると Tier 定義がぶれる。

---

## 4. 反証（依頼7）— 採用

Gemini 5条件はそのまま `roadmap` / 戦略メモに転用可。特に **条件2（社外ドメイン遮断）** は Zenn・社内 Wiki 経由導線の重要性を裏付ける。

---

## 5. SEO / 記事（依頼6）— 採用候補（上位）

### Data（優先）

1. SQL IN 句成形（normalize · **記事化済み方向**）
2. 社外秘データを外部に貼れない（#6 続編）
3. Shift-JIS CSV（table-conv 発売時）

### Finance（優先）

1. インボイス1枚だけ（invoice · 既存）
2. 源泉10.21%（invoice トグル実装後）
3. 傾斜割勘（warikan · Zenn 既存方向）

---

## 6. 次アクション（Agent）

- [ ] `data/roadmap.json` core レーンに Q3–Q4 項目を追記（提督承認後）
- [ ] `BACKLOG.md` §1-15-8 に本 RESULT リンク
- [ ] `PRODUCT_IDEA_JUDGMENT_LEDGER` に T22 diff · T23 anbun を PARK/HOLD 追記
- [ ] 問い1–4 の提督決定を待ち、決まり次第 `roadmap.json` 更新
- [ ] Priority 深掘り: [`docs/prompts/data-finance-priority-gemini-research.md`](../prompts/data-finance-priority-gemini-research.md) → [`data-finance-priority-gemini-RESULT.md`](data-finance-priority-gemini-RESULT.md) **済**

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-03 | 初版 — Gemini 貼付 · Cursor 突合 · 問い1–4 推奨 |
