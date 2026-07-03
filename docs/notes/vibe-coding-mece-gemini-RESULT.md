# Vibe Coding MECE — Gemini 調査結果（Cursor 突合済）

**更新**: 2026-07-03  
**入力:** Gemini 依頼1–6 出力（提督貼付）  
**プロンプト:** [`docs/prompts/vibe-coding-micro-utils-mece-gemini-research.md`](../prompts/vibe-coding-micro-utils-mece-gemini-research.md)  
**突合:** `PRODUCT_IDEA_JUDGMENT_LEDGER.md` · `BACKLOG.md` §1-15-6/7

---

## 0. Cursor 突合サマリー（提督向け）

Gemini の MECE 表は **地図として有効**。Top 5 はそのまま採用せず、台帳・既存判断で **再ランク** した。

| Gemini Top 5 | Cursor 修正判定 | 理由 |
|--------------|-----------------|------|
| Text Diff 新規 `diff` | **HOLD** | 非送信ニッチはあるが hub 増 · IDE/Git diff と競合。v2 候補 |
| table-conv + JSON | **GO** | planned どおり · Shift-JIS は日本スパイスと一致 |
| Password 新規 | **HOLD** | 台帳 **T19** 红海 · 単体優先度低 |
| Contrast 新規 | **PARK** | JIS/WCAG は筋があるが CSS ジェネレータ系は M3 高 · 画像系優先後 |
| sns 文字数拡張 | **GO拡張（弱）** | `sns` は既に SNS 向け文字数あり。**バイト数/SQL** は **`normalize`** 側が自然 |

**Gemini の誤り（要修正）**

- **URL/JWT を `reverse` に入れる** — `reverse` は **逆引き類語辞典**。エンコード系とは無関係。**T07 縮小1ページ** or 将来 `devtools` 仮称 · **reverse には載せない**
- **Random Name Picker「厚」** — **`fair-draw` 既存GO**（§1-15-6）。Wheel of Names 相当は実装済
- **QR Generator「なし」** — **`link-qr`** 実装済（イベント連絡/テックSNS）
- **Password / UUID / SHA「厚」→ GO新規連発** — T19 HOLD · UUID は **`test-data` 拡張** のみ妥当

---

## 1. ドメイン別サブカテゴリ（Gemini 原文）

→ 提督貼付の依頼1表を参照（40サブカテゴリ · 全ドメイン AI代替度ほぼ高 = **Vibe Coding コモディティ** の確認）

---

## 2. Trust シグナル（Gemini 原文 · 採用メモ）

| ツール | SUGUDASU が取るべきUX | 取らない |
|--------|----------------------|----------|
| CyberChef | 処理の透明性 · 非送信の説明 | 軍用ナイフUI |
| TinyWow | 1クリック到達 | サーバー依存変換 |
| EpochConverter | 開いた瞬間に価値 | 古臭UI放置 |
| Regex101 | リアルタイムマッチ可視化 | コミュニティDB |

**SUGUDASU 既に持つ Trust:** `statements` · DevTools 検証 · Zenn #6 系

---

## 3. ギャップマトリクス — **Cursor 修正版**（採用正本）

| ドメイン | サブカテゴリ | 現状 id | 判定 | アクション |
|----------|--------------|---------|------|------------|
| 1 Text | Line Sorter / Dedup | `normalize` | **GO拡張** | §1-15-7 と統合 · `sql_in` 後 |
| 1 Text | Word/Char Count（バイト） | `sns`（SNS字数） | **GO拡張（P2）** | 原稿400字・UTF-8バイトは sns or 独立1機能 — **normalize と役割分担要** |
| 1 Text | Text Diff | なし | **HOLD** | 非送信価値あり · 新 id は後回し |
| 1 Text | Title Case / Slug 等 | なし | **OUT/PARK** | 日本市場薄 · AI・コモディティ |
| 2 Data | JSON Pretty | T07 | **HOLD** | 極小1ページ or hub · **②デューデリ済** |
| 2 Data | CSV↔JSON / MD表 | `table-conv` planned | **GO** | JSON 統合 · **Shift-JIS/BOM** |
| 2 Data | SQL IN リスト | `normalize` | **GO拡張** | **`sql_in` · `tab_to_comma`** §1-15-7 **最優先** |
| 2 Data | JWT / URL decode | なし | **HOLD** | T07 にバンドル · `reverse` 不可 |
| 2 Data | Regex Tester | なし | **PARK** | Regex101 红海 · 非送信だけでは弱い |
| 3 Finance | 帳票・税 | `invoice` `receipt` | **GO済** | 日本スパイス済 |
| 3 Finance | Date Duration / 営業日 | `timeline` `shift` | **GO拡張（P2）** | T08 営業日ツールと要整理 |
| 3 Finance | Timezone / SaaS metrics | なし | **PARK** | AI/スプシで足りる |
| 3 Finance | 複利・NISA | なし | **OUT** | F7 |
| 4 Visual | 画像変換 | `webp-to-jpg` `mask` | **GO済** | リサイズ統合は将来 · 新 `image-box` は慎重 |
| 4 Visual | SVG / Contrast / CSS Gen | なし | **PARK** | M3 高 · png-to-webp 後 |
| 5 Crypto | 公平抽選 | `fair-draw` | **GO済** | 裏SUGUDASU |
| 5 Crypto | グループシャッフル | `group-split` | **GO済** | |
| 5 Crypto | QR | `link-qr` | **GO済** | |
| 5 Crypto | UUID | `test-data` | **GO拡張（P2）** | バルク UUID 生成項目 |
| 5 Crypto | Password / SHA-256 | なし | **HOLD** | T19 · CyberChef 红海 |

---

## 4. 日本特化スパイス（Gemini · 採用）

| 型 | 接続 id | 採用 |
|----|---------|------|
| 全角数字・機種依存文字 | `normalize` | ◎ §1-15-7 |
| Connpass CSV・公平抽選 | `fair-draw` | ◎ §1-15-6 |
| インボイス・源泉 | `invoice` `receipt` | ◎ 既存 |
| Shift-JIS CSV | `table-conv` | ◎ GO |

---

## 5. 優先 Top 5 — **Cursor 修正版**（実装順）

1. **`normalize` Phase B** — `sql_in` · `tab_to_comma`（リスト整形 · **採用済** §1-15-7）  
2. **`table-conv`** — CSV↔JSON↔MD表 · Shift-JIS/BOM（planned 本命）  
3. **`fair-draw`** — Connpass CSV D&D + 列選択（§1-15-6 P2）  
4. **T07 縮小** — JSON Pretty + URL decode · 1HTML · 機密ログ訴求のみ  
5. **`sns` or `normalize`** — 原稿字数/バイト（重複定義に注意 · P2）

**意図的に下げたもの:** `diff` · `password` · `contrast` · `svg-opt` — いずれも非送信でも **hub 増・红海**

---

## 6. 深掘りドメイン（Gemini 依頼6 · 承認）

次回リサーチは Gemini 提案どおり:

- **2 Data Transform** — クエリ10本 · jsonformatter / jwt.io / regex101  
- **4 Visual** — svgomg / webaim / 日本語「SVG 軽量化 ローカル」

ただし Visual は **実装優先度は Data の後**（§1-14 png-to-webp 等と帯域競合）。

---

## 7. 台帳追記候補（未反映 · Agent用）

| 仮ID | 案 | 判定 |
|------|-----|------|
| T22 | テキスト Diff（2面・インメモリ） | HOLD |
| — | devtools 縮小（JSON+URL） | T07 継続 HOLD |
