# Mention by SUGUDASU — 思想 · Constitution

**正本:** 本ファイル（Mission · Constitution · Non-Goals）· `specification.md`（Architecture · Catalog · MVP）  
**更新:** 2026-07-27  
**id:** `mention` · **URL:** `/mention`（固定）

---

## 1. Mission

> **Find outside. Finish inside.**  
> **見つけたら、終わらせる。**

英語短句: **Find it. Done.**

これだけが Mission である。

**Google口コミ対応ではない。** X 対応でも、監視でもない。

本質は **Current Context Action Engine** である。

```text
Current Page
  → Scenario Detection
  → Action Cards
  → Done
```

思想ラベル:

> **Mention → Done**

Chrome は情報を見る場所。Mention は仕事を終わらせる場所。

---

## 2. このプロダクトは何か / 何ではないか

### 何か

ユーザーが**今開いているページ**を、その場で終わらせる Action Tool。

Google ★5 口コミも、X のブランド言及も、ニュースも、求人口コミも、**同じエンジン**である。プラットフォームは Feature（Adapter）であり、Mission ではない。

### 何ではないか

- Google口コミ返信ツール（それ単体の製品ではない）
- Brand24 / Meltwater / Ahrefs / Google Alert / Canly
- ダッシュボード · BI · 監視 · 全文検索 · データ収集
- タスク管理 · CRM · 担当者 · 期限

競合が Monitoring / Analytics / Dashboard へ進化しても、Mention は **Done** へ進化する。

---

## 3. Mention Constitution

審査を通すために設計するのではない。  
最初から **最小権限 · 最小取得 · 最小目的** で設計する。結果として審査にも通りやすい。

### P1. Single Purpose

Mention は監視ツールではない。  
ユーザーが今開いているページを、その場で終わらせる Action Tool である。

したがって最初から存在しない:

- ダッシュボード · 時系列分析 · SNS監視 · 全文検索 · データ収集

### P2. Current Context Only（User Opens First）

勝手にページを巡回しない。

```text
User opens page
  → Mention assists
```

Chrome の `activeTab` より上位の思想: **Current Context Only**。  
許可していないプラットフォームでは、Mention は沈黙してよい（PCT-6）。

### P3. Local First · Non-Exfiltration

```text
DOM → Scenario → Action Engine → Template → Copy / Done
```

- **SUGUDASU 管理下へ送らない · クラウドに溜めない**（C-05）
- 端末内の Done / Template（IndexedDB）は「終わらせた痕跡」であり、**監視用アーカイブではない**
- 「保存ゼロ」と書いて端末内 Done を否定しない（字面の罠）

### P4. Explicit Network

唯一の通信候補は **Webhook**。  
ユーザーが Copy または Send を押したときだけ。バックグラウンド通信は禁止。

### P5. Zero Thinking · No LLM

文章を考えさせない。ユーザーは「送るか」だけ判断する。  
定型はルール + `{{変数}}`。LLM 生成は禁止（判断負荷を増やすため）。

### P6. No Paste Product

URL/本文の手動貼り付けを入力経路・ブラウザのみ代替製品にしない。  
Current Tab が体験の本体である。

### P7. Platform is Feature

Google Maps · X · YouTube · GitHub … はすべて **Platform Adapter**。  
Mission にプラットフォーム名を置かない。

### P8. Scenario is Structural

Scenario Detection はページを**評価しない**。  
構造シグナルから Scenario を選び、Action Cards を出すだけである。  
感情スコア · 「返信するな」断定 · AI 解釈は禁止。

---

## 4. 判断に迷ったら

> **それは終わらせるためか、管理するためか**

| 判定 | 扱い |
|------|------|
| 管理 · 監視 · 分析 · 収集 | **Reject** |
| Current Context を Done まで運ぶ | 検討 |

> **それは Mission か、Adapter か**

| 判定 | 扱い |
|------|------|
| 特定プラットフォーム名が Mission になる | **書き直し**（Adapter へ落とす） |
| Adapter 追加で Scenario が増える | 検討 |

Clip Stash（[CASE-2026-002](../../legal/CASE_LAW.md#case-2026-002)）と同型。

---

## 5. SUGUDASU らしさ

既存ツールが「画像編集 → 提出できる」なら、Mention は:

```text
見つけた → 終わった
```

「ブランド監視 → 返信できる」ではない。

---

## 6. 命名 · 国際化（方針）

| 層 | 方針 |
|----|------|
| URL / id | `/mention` · `mention` 固定 |
| Store / 製品 | **Mention by SUGUDASU**（productName · Store 表記を統一） |
| UI 表示名 | ロケール可（言及 / Mentions / …） |
| i18n | **本プロダクトのみ**グローバル前提可。SUGUDASU 全体の一斉多言語化はしない |
| 定型 | 機械翻訳1本ではなく、ロケール別テンプレ束 |

独立ブランド（mention.app）は成功後の分岐。今は切らない。

---

## 7. 憲法との関係

- Brand · Anti · F1/F2/F5/F7 適合（条件付き GO · Extension レーン）
- ログ: [`../../legal/logs/2026-07-27_mention_constitution_review.md`](../../legal/logs/2026-07-27_mention_constitution_review.md)

詳細 Catalog · MVP · Extension は `specification.md`。  
価格戦略は `pricing.md`（仕様に価格を書かない）。  
機能追加で迷ったら `competition.md`（監視の重力か Done か）。  
設計選択の記録は `decisions.md`。Scenario 詳細は `scenarios/`。
