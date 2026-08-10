# VC デューデリ視点のサイト価値メーター（MECE）

**更新:** 2026-08-10  
**ステータス:** 方針確定 · セカンドオピニオン反映済（Strong · Pass-with-gaps）  
**目的:** SUGUDASU の「いまの価値」を経営・投資目線で常に辿れるようにする。チャット議論の正本化。  
**実装・イベント契約:** [`PRODUCT_USAGE_ANALYTICS.md`](PRODUCT_USAGE_ANALYTICS.md) · [`data/tool-job-contracts.json`](../../data/tool-job-contracts.json)  
**週次:** [`../prompts/product-usage-weekly-COPYPASTE.md`](../prompts/product-usage-weekly-COPYPASTE.md)  
**セカンドオピニオン:** [`../prompts/vc-due-diligence-metrics-second-opinion-COPYPASTE.md`](../prompts/vc-due-diligence-metrics-second-opinion-COPYPASTE.md)  
**Backlog:** [`../BACKLOG.md`](../BACKLOG.md) §8-13-1 · 節 D「信頼・計測」

---

## 0. 使い方（価値を常に把握する）

| 頻度 | やること | 成果 |
|------|----------|------|
| **週次** | 週次プロンプトを Agent に貼る（GA4 MCP） | ツール別 **転換率**付き open→start→done · failed |
| **月次** | 本ドキュメント §1–3 を眺め、ギャップ未充足を1行メモ | 投資家向けストーリーの更新 |
| **新規ツール** | Playbook A16 + `tool-job-contracts.json` | 価値メーターが自動で広がる |
| **セカンドオピニオン** | COPYPASTE を他 AI に投げる | MECE・妥当性の監査 |

**境界:** コア（sugudasu.com）の無料利用 ≠ Sync 課金メーター。収益は Sync / Stripe **および広告**（軸 D · コアGA4に無理統合しない）。

**最大の問題はイベント不足ではない。** 既存契約を本番で均質に取り、件数を **Activation / Retention / Portfolio** に変換すること（セカンドオピニオン 2026-08-10）。

---

## 1. VC が欲しいデータ（MECE · 6軸）

相互排他・全体網羅: **見つけられ → 価値到達 → 戻る → 金になる → 拡大する → 壊れない**。

| ID | 軸 | VC の問い | 欲しいデータ（概念） |
|----|-----|-----------|----------------------|
| **A** | Acquisition | どう見つかるか · いくらで連れてくるか | 流入チャネル · 初回到達 · Hub/検索 · SEO · **獲得効率（CAC は広告/事業管理側で補完）** |
| **B** | Activation | 価値を体験したか | ツール別 open→start→done · **転換率（分母明示）** · outcome · failed · Drop 分解 |
| **C** | Retention | 戻ってくるか | **New/Returning** · **コホート再訪（7/30/60/90）** · リピート完了 · ツール横断（ログインなし近似） |
| **D** | Monetization | 金になるか · 収益構造 | Sync 登録/課金/ARPU/解約 · **広告収益・表示効率**（コアGA4外が主） · LTV/GM は経営台帳 |
| **E** | Unit / Scale | 伸びるか | 内部を2層で見る（**軸は増やさない**）: **E1 Economics**（成長の経済性・別台帳）· **E2 Portfolio Scale**（集中度・Pareto・新ツール純増 vs 共食い） |
| **F** | Trust / Risk | 壊れないか | プライバシー整合 · **failed 率** · **計測カバレッジ均質性** · 依存 |

**サイト計測の対象外（Reject as site metric）:** TAM/SAM/SOM · 競争優位の定性ストーリー本体。  
**サイト外だが DD 必須:** LTV · Gross Margin · Burn · Runway（経営台帳 · G14）。

---

## 2. GA4 で測れる範囲（現行契約）

Property: **G-WBB6PTTYF7** · カスタムディメンション登録済: `tool_id` · `outcome` · `input_kind`。

### 2.1 コアファネル（B の正本）

```
product_opened (tool_id)
  → tool_job_started (tool_id, input_kind)
  → tool_job_done (tool_id, outcome)     # outcome 必須・列挙厳守
  → tool_job_failed (tool_id, reason_code)  # ゲート拒否等は必須送信（任意扱いにしない）
```

| 派生指標（転換率 · 件数だけで終わらない） | 定義 | VC への言い方 |
|------------------------------------------|------|----------------|
| 着手率 | started / opened | 開いたが触らない比率の逆 |
| 完了率（着手後） | done / started | 触れたが持ち帰れない比率の逆 |
| 完了率（開封） | done / opened | 総合アクティベーション = **価値到達率** |
| 失敗率（着手後） | failed / started（または failed / (done+failed)） | 完了できなかった監査値 |

### 2.2 軸 × ソース突合

| 軸 | GA4 で測れる | 測れない／別ソース | 現状 |
|----|--------------|-------------------|------|
| A | チャネル · UTM · 端末 · `page_view` · `search_used` · `sg_cta_click` | 指名検索 · SERP → **GSC** · CAC 金額 → 広告/経理 | 部分充足 |
| B | open→start→done·failed + 転換率 · outcome · input_kind | 入力本文 · 成果物品質 · **完了時間バケットは当面送らない**（仮説検証は後段） | 契約済 · 本番均質化が先 |
| C | New/Returning · エンゲージ · 再訪近似 · コホート（GA4範囲） | アカウント横断 Retention | 近似と明示して使う |
| D | Sync 導線クリック程度 | Sync/Stripe · **AdSense 収益** · LTV | 別レーン必須 |
| E | E2: ツール別時系列 · **Pareto/集中度** · 新ツール寄与（純増 vs 共食い分析） | E1: CAC/LTV/GM | Exploration + 経営台帳 |
| F | failed · `validate:usage-analytics` カバレッジ | 法的非送信証明 · 性能監視 | 契約整合 · PSI 等は別 |

### 2.3 憲法境界（CMO）

送らない: 入力テキスト · ファイル名 · 金額 · 検索クエリ本文 · PII · スタックトレース · 操作リプレイ。  
主張: 「閲覧・操作の統計のみ」。**GA4を操作ログ化しない。**

### 2.4 イベント増殖方針（セカンドオピニオン確定）

| 案 | 判断 |
|----|------|
| `tool_job_failed` を契約上必須（ゲート等で既に API あり） | **Adopt** — 新イベントではなく運用必須化 |
| `outcome` 必須・列挙厳守 | **Adopt** — 既契約の厳格運用 |
| 完了までの時間バケット | **Defer** — いまは均質化・Exploration が先 |
| 新イベントを3つ増やす | **Reject** — 増やすより均質化 |

---

## 3. ギャップと90日優先

| 項目 | 扱い | 次アクション |
|------|------|--------------|
| 本番で全ツール均質に open/start/done/failed | **最優先で埋める** | core デプロイ + カバレッジ監査 |
| GA4 Exploration（転換率 · outcome · input_kind · New/Returning · Pareto） | **埋める** | 提督 · 1画面で理解できる状態 |
| コホート 7/30/60/90 再訪 | **埋める** | GA4 観測範囲と注釈して解釈 |
| GSC データ蓄積開始 | **早めに蓄積 · 分析は後段可** | §8-13 GSC |
| Sync + 広告を含む収益構造（D/E1） | **別レーン** | Sync SSOT · AdSense · 経理 |
| 性能・互換性ログ | **Defer** | 本番監視側 |
| NPS・インタビュー | **Defer** | Form |
| 入力内容・品質スコア | **しない** | 憲法 |
| TAM 等 | **サイト計測対象外** | 投資メモ別 |

---

## 4. 投資家スライド1枚（言える／言えない）

**言える:** (1) ツール別の価値到達（open→start→done 転換率） (2) 一度きりか実用品か（Returning/コホート近似） (3) ヒット依存か分散か（Pareto / 新ツール純増）  

**言えない（欠損ではなく設計）:** (1) 何を入力・作成したか (2) なぜ・満足度 (3) LTV/CAC/利益率の単体完結  

ストーリー: **「利用内容を収集して成長しているのではなく、利用統計だけでプロダクトの成長を説明する」**。

---

## 5. 役員・セカンドオピニオン判断ログ

| 日付 | 主体 | 結論 |
|------|------|------|
| 2026-08-10 | CPO/CMO/CTO | started 中間段 · 本文なし · 中央API+契約 |
| 2026-08-10 | セカンドオピニオン | Overall Strong · MECE Pass-with-gaps · **イベント増殖しない** · failed/outcome 厳格運用 · E は内部2層 · GSCは蓄積先行 · Sync/広告は別レーン |

---

## 6. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-08-10 | セカンドオピニオン反映 — 転換率明示 · Cコホート · E内部2層 · D広告 · failed必須 · 90日優先 |
| 2026-08-10 | 初版 |
