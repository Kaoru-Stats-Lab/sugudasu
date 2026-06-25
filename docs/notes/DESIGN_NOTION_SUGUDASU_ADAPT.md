# Notion Like → SUGUDASU 適用方針

**更新:** 2026-06-26  
**参照元（分析そのまま）:** [`../DESIGN_GUIDELINE_NOTION_LIKE.md`](../DESIGN_GUIDELINE_NOTION_LIKE.md)  
**上書き正本:** コア [`DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) · Sync [`DESIGN_GUIDELINE_SYNC.md`](../DESIGN_GUIDELINE_SYNC.md) · 実装 CSS `assets/sugudasu.css` の `--sg-*`  
**主用途:** **Schedule**（`SCHEDULE_TOOL_SPEC.md` · Notion風 DnD / スラッシュ）の UI 層

> **Agent 必須:** 実装前に本ファイルを読む。Cursor 常時ルール `.cursor/rules/sugudasu-design-schedule.mdc` · 入口 `.cursorrules`

---

## 1. 何を借りる / 借りない

| Notion Like | SUGUDASU で |
|-------------|-------------|
| 余白 · ヘアライン · カード on ソフトキャンバス | **◎ 借りる** |
| 表・行 DnD · ドキュメント感 | **◎ Schedule の UX** |
| 1色構造アクセント + 静かな chrome | **◎** — ただし青は **#2563EB** |
| ステッカー多色パレット（装飾） | **△ Schedule 行背景のみ** — Sync パステル4色。CTA/構造には使わない |
| `hero-band` 深 indigo 全幅 | **×** — Sync/Schedule LP もマーケ夜帯なし |
| マーケ pill CTA 全面 | **△** — 主 CTA は **角丸 md/lg**（`rounded-lg`）。hub 以外で pill 乱用しない |
| `NotionInter` | **×** — システム UI + Inter 可。プロプライetary 名は使わない |

---

## 2. 色トークン — 差し替え表（実装時はここ）

| Notion トークン | Notion 値 | **SUGUDASU マップ** | CSS 変数 / Tailwind |
|-----------------|-----------|---------------------|---------------------|
| `primary` | `#0075de` | **`#2563EB`** | `--sg-primary` · `blue-600` |
| `primary-active` | `#005bab` | **`#1D4ED8`** | `--sg-primary-hover` · `blue-700` |
| `secondary` | `#213183` | **使わない**（hero 夜帯） | ヘッダー強調のみ `--sg-header` `#0F172A` |
| `canvas` / `surface` | `#ffffff` | **`#FFFFFF`** | `--sg-surface` |
| `canvas-soft` | `#f6f5f4` | **`#F1F5F9`**（slate-100 · コア統一） | `--sg-bg` |
| `ink` | `#000000` | **`#1E293B`** | `--sg-text` · `slate-800` |
| `ink-secondary` | `#31302e` | **`#334155`** | `slate-700` |
| `ink-muted` | `#615d59` | **`#64748B`** | `--sg-muted` · `slate-500` |
| `ink-faint` | `#a39e98` | **`#94A3B8`** | `slate-400` |
| `hairline` | `#e6e6e6` | **`#E2E8F0`** | `--sg-border` · `slate-200` |
| `on-primary` | `#ffffff` | **`#FFFFFF`** | 変更なし |

### 2-1. アクセント（ステッカー → Schedule 行のみ）

Notion の `accent-*` は **構造・CTA 禁止**。Schedule の **行背景・カテゴリ** にだけ Sync パステルへ写像:

| Notion accent | SUGUDASU（Schedule 行） |
|---------------|-------------------------|
| purple / pink / orange / teal / green / sky | `--sync-row-mc` · `--sync-row-sound` · `--sync-row-video` · `--sync-row-stage`（`DESIGN_GUIDELINE_SYNC.md` §2） |
| ユーザー列のカラーパレット（Fill） | xlsx Export 用 RGB — **UI 上はパステル背景のみ** |

**violet（`#7C3AED`）:** S2 設計中 · disabled · 版バナー **のみ** — Notion purple ステッカーとは別用途。

### 2-2. コア 3層アクション（Notion 上書き）

Notion は青 pill = 主 CTA 1種。SUGUDASU コア/Sync では:

| 意味 | 色 | Notion コンポーネントとの関係 |
|------|-----|------------------------------|
| L2 主操作（保存 · 編集開始） | **blue-600** | `button-primary` の色だけ借用 · 形状は pill 必須ではない |
| L3 印刷 | **emerald-600** | Schedule A3 印刷 CTA **1画面1つ** |
| L1 モード切替 | **無彩色 sg-segment** | Notion には無い — **コア優先** |

---

## 3. タイポグラフィ

| 項目 | 方針 |
|------|------|
| ファミリ | `NotionInter` → **system-ui, Inter, sans-serif**（`DESIGN_GUIDELINE.md` 既存） |
| display の負 tracking | Schedule **LP のみ** 可。表 UI 本体は **body 系のみ**（過剰 display-1 禁止） |
| 表セル | `body-sm` 相当 · **14–15px** · 行高 1.33–1.5 |

---

## 4. 角丸 · 影 · コンポーネント

| Notion | SUGUDASU 調整 |
|--------|----------------|
| `rounded.full` マーケ CTA | Schedule: **`rounded-lg`**（8px）主 · badge のみ full 可 |
| `hero-band` | **削除** — 代わりに slate-100 + 白カード（Sync §0.3） |
| `feature-card` 12px | **◎** `rounded-lg` — コア `sg-card` と揃える |
| `text-input` 4px | **◎** — 表セル編集も tight radius |
| Level-1 微 shadow | **◎** — 既存 `sg-card` shadow と統一。重い drop 禁止 |
| `ex-data-table-cell` | **Schedule 正本** — Frozen 左3列 · ゼブラは **印刷時のみ**（`SCHEDULE_TOOL_SPEC` §7） |

---

## 5. 実装順（色を触る場所）

1. **`docs/DESIGN_GUIDELINE_NOTION_LIKE.md`** — 分析参照のまま（Notion 値は残す）
2. **本ファイル §2** — Schedule UI 実装時のマップ
3. **`assets/sugudasu.css`** — 新規色は増やさず **`--sg-*` / `--sync-row-*` だけ**
4. **`schedule-*.html` / app JS** — Tailwind は `slate` + `blue-600` + Sync パステルクラス
5. **`DESIGN_GUIDELINE.md` §2.1** — コアツールは Notion 暖色キャンバス `#f6f5f4` に **戻さない**（slate-100 維持）

---

## 6. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | 初版 — 配置 · トークンマップ · 借りないもの |
| 2026-06-26 | **§7** — コアツール（invoice 等）Notion Like 移行マップ |

---

## 7. コアツール Notion Like 移行（invoice · hub 等）

**PoC 推奨:** [`/invoice`](https://sugudasu.com/invoice) → 成功パターンを `sugudasu.css` の **`.sg-notion-*`** として共通化 → 他ツールへ。

**維持（上書きしない）:** `DESIGN_GUIDELINE.md` **3層アクション** — L1 セグメント · L2 青 · L3 緑印刷。

### 7-1. 要素別 — 現状 → Notion Like

| 要素 | 現状（invoice 等） | Notion Like へ | 実装方針 |
|------|-------------------|----------------|----------|
| **書類種別 L1** | `sg-segment` 灰トラック + 白ピルスライド + 下線 `::after` | **テキストタブ** — 選択=太字 + 下 **2px blue-600** · ピルスライド **なし** | 新 `.sg-notion-tabs` · JS は `aria-selected` のみ（アニメ省略可） |
| **転用ヒント** | `sg-segment-hint` · indigo 系強調 | **Callout** — 左 📄 or ℹ · 背景 `#F8FAFC` · 枠 `hairline` · 本文 `body-sm` · **indigo 文字禁止** | `.sg-notion-callout` |
| **セクション見出し** | `📄 書類種別` · UPPERCASE tracking | **eyebrow 12px/600** · 絵文字 **0〜1** · 通常ケース | クラス差し替えのみ |
| **FAQ 全体** | 中央見出し · カード型 `details`（`rounded-xl` · `bg-slate-50` · 枠 · gap） | **Toggle リスト** — 左 **▶**（open で 90°）· カード枠 **なし** · 項目間 **hairline のみ** · 見出し **左寄せ** | `.sg-notion-toggle` · `<details>` 維持（SEO/a11y） |
| **FAQ 開閉** | 右 chevron SVG · `transition-all` | 左三角 · **`prefers-reduced-motion` 時は transition なし** · 200ms 以内 | CSS のみ |
| **主ボタン（保存等）** | `rounded-lg` blue | 同左 · 押下 **`scale(0.98)` 100ms**（Notion 微押し） | `.sg-notion-btn` extends L2 |
| **印刷 CTA** | emerald · 1画面1つ | **変更なし**（L3 憲法） | — |
| **フォームカード** | `sg-card` shadow-sm | 影 **弱く** · **hairline 主** · `rounded-lg`（12px） | Notion `feature-card` 相当 |
| **hub カード** | バッジ多め | 白面 + hairline · NEW は **eyebrow テキスト**（蛍光バッジ×） | 段階的 |

### 7-2. アニメーション方針

| やる | やらない |
|------|----------|
| ボタン press `scale(0.97–0.98)` · 100ms | セグメントピル **180ms スライド**（Notion 非採用） |
| FAQ 三角 rotate · max 200ms | カード全体 `transition-all` |
| `prefers-reduced-motion: reduce` で **motion ゼロ** | パララックス · バウンス · グラデ shimmer |

### 7-3. 実装順（invoice PoC）

**PoC 順:** 先に **FAQ + Callout** の Notion 化 · **書類種別 L1 はハイブリッド**（`sg-segment` ピルは残す · 影/青枠/アニメを弱く · L1 視認性維持）

1. `sugudasu.css` — `.sg-notion-tabs` · `.sg-notion-callout` · `.sg-notion-toggle` · `.sg-notion-btn-press`
2. `invoice.html` — 書類種別ブロック · FAQ セクションのみ差し替え
3. `npm run validate:ogp` · 視覚 smoke · **L3 印刷・segment a11y 退行なし**
4. `DESIGN_GUIDELINE.md` §3.3 に「Notion タブ variant」1段落追記
5. hub / receipt へ横展開

### 7-4. Schedule との境界

- **コア**（invoice 等）: 本 §7 · 色は §2 マップ
- **Schedule**: §7 のタブより **表・DnD・スラッシュ** が主。FAQ はコアと **同一 `.sg-notion-toggle`** を共用可
