# Phase H-UI-07 — 仕事コンテキスト入力

**更新:** 2026-07-24  
**状態:** 仕様確定 · **未実装**  
**上位:** [`HUB_CONSTITUTION_SPEC.md`](./HUB_CONSTITUTION_SPEC.md) · [`BRAND_CONSTITUTION.md`](../../brand/BRAND_CONSTITUTION.md)

---

## 目的

マーケティングではない。**調査（アンケート）でもない。**

ユーザーが **自分の仕事を進めやすくするための改善へ参加する** 任意入力である。

SUGUDASU が実際に解決している **Pain / Moment** を理解し、次へ反映する。

| 反映先（これだけ） | 内容 |
|--------------------|------|
| 検索辞書 | `search-dictionary/*` · `synonyms.json` |
| 検索例 | `hub-config.searchExampleChips` |
| Hub IA | カテゴリ · blurb の優先改善 |

**利用禁止:** 広告ターゲティング · レコメンド AI · 個人プロファイル · Persona 向けページ · Product UI のパーソナライズ · マーケセグメント

---

## 憲法判例（必須）

### 判例1 — 質問は「調査」ではなく「改善への参加」

ユーザーから見て「なんで急にアンケート？」にならないこと。

| 補足文 | 判定 |
|--------|------|
| **あなたの仕事を進めやすくするために使います。** | **採用** — WHY と一致 |
| 今後の改善の参考にします。 | 不採用寄り — 改善対象が SUGUDASU 自身に聞こえる |

改善する対象は **SUGUDASU ではなく、ユーザーの仕事** である。ブランド人格（隣の席の同僚 · 前工程）と一致する。

### 判例2 — 聞くのは「仕事」の言葉、分析は必ず Moment

質問文は「どんな仕事で使いましたか？」でよい。

取得後の分析では、**職種分類にしてはいけない**。

| 禁止（Persona / 職種） | 必須（Pain / Moment / Job） |
|------------------------|-----------------------------|
| 経理 · 営業 · 総務 · 学生 | 請求書を作る · PDFを提出する |
| | スクショを隠す · 班分けする · 契約書を比較する |

ブランド憲法 · Product Constitution は **Persona 起点ではなく Pain 起点**（判定順: Persona → Pain → 市場 → F1〜F7 でも、採用の核心は Pain）。職種ラベルで棚卸ししない。

自由記述に「経理」と書かれていても、分析側は **Moment へ正規化** する（例: 経理 → 請求書 / 領収書 / 提出 等の Moment 群）。

### 判例3 — Hub IA の改善材料のみ · マーケセグメント禁止

| 禁止 | 正しい使い方 |
|------|----------------|
| 「営業さん向けページを作ろう」 | 「提出する人が多い」→ 検索例を `提出` · `黒塗り` · `請求書` · `PDF` へ改善 |
| 「学生向け LP」 | 検索辞書 · Chip · blurb の Pain 語を増やす |
| セグメント別ランディング増殖 | Hub IA / 辞書の改善だけに使う |

### 判例4 — おすすめしない · 探させる

取得データから次を **生成しない**:

- おすすめツール
- あなた向け
- 最近使った人は
- AI レコメンド

Hub は **探させない（検索で最短到達）** のであって、**おすすめする場所ではない**。おすすめ化は SUGUDASU の人格と真逆（Anti #9）。

---

## ブランド整合

| 原則 | 適用 |
|------|------|
| 仕事を邪魔しない | **毎回聞かない** — 条件を満たしたときだけ |
| **任意性 PCT-6** | できるから出さない。介入しない選択が既定 |
| ユーザーを賢く見せる | 自由記述 · ユーザーの言葉を尊重 |
| SUGUDASUは賢く見せない | AI分析 · 最適化 · おすすめ文言禁止 |
| 非送信 · 登録不要 | localStorage のみ · PII 禁止 |
| 前工程を増やさない | 1 フィールド · スキップ可能 · 説教しない |
| Pain 起点 | 分析は Moment 正規化のみ · Persona 分類禁止 |

---

## 質問文（確定）

**タイトル:**

> **どんな仕事で使いましたか？**

「何に使っていますか？」は **不採用**。

| 案 | 問題 |
|----|------|
| 何に使っていますか？ | 目的が広く解釈される（遊び · 暇つぶし等） |
| **どんな仕事で使いましたか？** | 実務コンテキストへ自然に誘導 · ブランド（前工程）と一致 |

---

## 表示タイミング

### 原則

- **毎回表示しない**
- **使うたびに聞く** — 禁止
- **毎日起動時に聞く** — 禁止
- Hub を開くたびの質問は **前工程化** するため Reject

### 表示条件（AND）

すべて満たすときのみ表示:

1. **未回答** — `sgWorkContextAnsweredAt` が無い
2. **未 dismiss または dismiss 冷却済み** — §Dismiss
3. **利用しきい値到達** — 次の **いずれか早い方**:
   - ユニーク **10 ツール** 利用後
   - 初回利用から **14 日** 経過

「初回訪問から一定期間利用した後 **または** 複数ツール利用後」= 上記 OR 条件。

### 表示場所

- **Hub（`/`）のみ** — Product 作業中は表示しない
- 検索モード · 作業 focus 中は **表示しない**（Open Issue: query 非空時は defer）

### 一度回答したら

`sgWorkContextAnsweredAt` を保存。**基本的に二度と聞かない。**

---

## Dismiss（閉じる）

× または「スキップ」で閉じた場合:

- `sgWorkContextDismissedAt` を記録
- **180 日間** 再表示しない（長期間）
- 180 日後 · しきい値再達成 · 未回答のままなら **再表示可**

回答済みの場合は dismiss 冷却より **回答フラグが優先**（再表示しない）。

---

## UI

### 配置

- Hub Hero **下** · カテゴリチップ **上**
- インライン callout（`sg-hub-callout` 系）· **モーダル禁止**
- 1 回の表示で画面を占有しない（折りたたみ可能な 1 ブロック）

### コピー

| 要素 | 文案 |
|------|------|
| タイトル | どんな仕事で使いましたか？ |
| 入力 placeholder | 例: 請求書作成 · 資料づくり · 提出 · 班分け · 会議準備 |
| 補足（小さく） | あなたの仕事を進めやすくするために使います。 |
| 送信 | 送信（または「記録する」— マーケ語禁止） |
| スキップ | スキップ · × 閉じる |

- 文字は小さく · **説明しすぎない**
- 補足は判例1どおり · 「今後の改善の参考にします」は使わない
- placeholder は **Moment 寄り**（職種ラベル例は出さない）
- Guard Rails 文言（§禁止コピー）を UI に載せない

### 回答形式

| 採用 | 不採用 |
|------|--------|
| 自由入力 1 行（max 200 字） | カテゴリ選択 |
| | 選択肢大量列挙 |
| | タグ UI |
| | AI 補完 · 入力補助 · autocomplete |

---

## 送信 · 保存

### 取得する

| 項目 | 保存先 |
|------|--------|
| 自由記述（仕事コンテキスト） | `localStorage.sgWorkContextAnswer` |
| 回答日時 | `localStorage.sgWorkContextAnsweredAt` |

### 取得禁止

氏名 · メール · 会社名 · 部署 · IP 送信 · 端末 fingerprint

### サーバー送信

**Phase H-UI-07 初版: 送信なし。**

回答は端末内に留め、Product 改善は **手動 export / 将来 ADR 化した匿名集計** のみ。

GA4 に **回答本文を送らない**。

---

## localStorage スキーマ

| Key | 型 | 責務 |
|-----|-----|------|
| `sgWorkContextFirstSeenAt` | ISO8601 | 初回 Product または Hub 訪問 |
| `sgWorkContextUniqueTools` | `string[]` | 利用済み toolId（重複なし） |
| `sgWorkContextAnswer` | string | 回答本文（端末内のみ） |
| `sgWorkContextAnsweredAt` | ISO8601 | 回答済み · **再表示禁止** |
| `sgWorkContextDismissedAt` | ISO8601 | スキップ時刻 · 180 日冷却 |

### 記録タイミング

| イベント | 更新 |
|----------|------|
| 初回 Hub / Product 訪問 | `sgWorkContextFirstSeenAt`（未設定時のみ） |
| Product 打开 | `sgWorkContextUniqueTools` に toolId 追加（`sugudasu-shell.js` · recent と同所） |
| Hub boot · しきい値判定 | 表示可否 |
| 送信 | answer + answeredAt |
| スキップ | dismissedAt |

**既存キー変更禁止:** `favoriteTools` · `recentTools` · `selectedCategory`

---

## 計測（Open Issue · ADR 化前）

| 計測可 | 計測禁止 |
|--------|----------|
| `work_context_shown` | 回答本文 |
| `work_context_answered` { has_text: boolean } | 自由記述の GA パラメータ |
| `work_context_dismissed` | |
| （将来）匿名集計の回答率 · 偏り | 個人プロファイル |

匿名集計専用パイプラインが必要なら **別 ADR** を起票してから実装する。

---

## Guard Rails — 禁止コピー

UI · 補足 · 送信後メッセージに載せない:

- あなた専用に最適化します
- おすすめします
- AI が分析します
- あなた向けに学習します
- パーソナライズします
- アンケートにご協力ください（調査トーン）
- 今後の改善の参考にします（SUGUDASU 自身が改善対象に聞こえる）

## Guard Rails — データ利用（判例3 · 4）

取得データから次を作らない:

- おすすめツール棚 · 「あなた向け」レール · 「最近使った人は」
- AI レコメンド · パーソナライズ feed
- 「営業向け」「経理向け」「学生向け」ページ / LP / セグメント
- Persona 分類ダッシュボード

SUGUDASU は **ユーザーを賢く見せる**。SUGUDASU 自身は賢く見せない（`ANTI_PRINCIPLES.md`）。

---

## 分析パイプライン（将来 · 手動でも同じ）

```
生回答（自由記述）
  → Persona / 職種ラベルに分類しない
  → Pain / Moment / Job へ正規化
  → 検索辞書 · 検索例 Chip · Hub IA のみ更新
```

例: 「営業で使ってます」→ 「提出する人が多い」→ Chip `提出` · `黒塗り` · `請求書` · `PDF` を厚くする。  
「営業さん向けページ」は **作らない**。

---

## 実装チェックリスト（将来）

- [ ] `sugudasu-shell.js` — unique tools 追跡
- [ ] `hub-ia.js` または `hub-work-context.js` — 表示判定 · UI
- [ ] `tools/hub.html` — callout DOM
- [ ] `sugudasu.css` — `.sg-hub-work-context`
- [ ] GA イベント（本文なし）
- [ ] `verify-hub-ia` — LS キー名定数化
- [ ] FAQ / statements — 「端末内のみ · 任意 · 再質問しない」1 行

---

## ADR

| ID | 決定 |
|----|------|
| **H-UI-07-001** | 質問文 = 「どんな仕事で使いましたか？」 |
| **H-UI-07-002** | 10 ツール OR 14 日 · 回答後は基本非再表示 |
| **H-UI-07-003** | dismiss = 180 日冷却 |
| **H-UI-07-004** | 自由入力のみ · タグ/AI/カテゴリ UI 禁止 |
| **H-UI-07-005** | 回答本文 GA 送信禁止 · サーバー送信なし（初版） |
| **H-UI-07-006** | 補足 = 「あなたの仕事を進めやすくするために使います。」（調査トーン禁止） |
| **H-UI-07-007** | 分析は Pain / Moment / Job 正規化のみ · Persona 分類禁止 |
| **H-UI-07-008** | Hub IA / 辞書改善のみ · マーケセグメント · おすすめ生成禁止 |

### ADR H-013（Hub 憲法 · 一文）

```text
取得した回答は Persona 分類には利用しない。

必ず Pain / Moment / Job へ正規化し、
検索辞書・検索例・Hub IA 改善のみに利用する。
```

立法意思の上位正本: [`../../legal/CONSTITUTION_COMMENTARY.md`](../../legal/CONSTITUTION_COMMENTARY.md) C-02 · C-07 · C-09  
**Persona Trait:** [`PCT-6 任意性`](../../legal/PERSONA_CONSTITUTION_TRAITS.md#pct-6-任意性discretion)  
**判例:** [`CASE-2026-004`](../../legal/CASE_LAW.md#case-2026-004)

「匿名だから OK」「改善だから OK」は義解上の誤解釈である。本 Phase は **条件付き · 任意 · 邪魔しない** 設計でのみ成立する。

---

## 関連

- [`HUB_CONSTITUTION_SPEC.md`](./HUB_CONSTITUTION_SPEC.md) §11 · §12 H-013 · §14
- [`../../brand/BRAND_CONSTITUTION.md`](../../brand/BRAND_CONSTITUTION.md)
- [`../../brand/CONSTITUTIONAL_INTERPRETATION.md`](../../brand/CONSTITUTIONAL_INTERPRETATION.md)
- [`../../product/PRODUCT_CONSTITUTION.md`](../../product/PRODUCT_CONSTITUTION.md) — Pain 起点
- [`../../research/personalization/LocalStorage-UX.md`](../../research/personalization/LocalStorage-UX.md)
