# AdSense R2 — 役員会 SYNTHESIS（Gemini読み替え）

**更新:** 2026-08-13  
**生:** [`adsense-r2-gemini-RESULT.md`](adsense-r2-gemini-RESULT.md)  
**不合格ログ:** [`ADSENSE_REJECTION_LOG_20260813.md`](ADSENSE_REJECTION_LOG_20260813.md)  
**広告注入正本コード:** `scripts/adsense-pages.mjs` · `data/adsense.json`

---

## 0. 一文総意

Gemini の主因仮説は **おおむね採用可**。ガイド増だけでは足りない、という結論は第2回不合格と整合する。  
ただし **Astro 前提の実装パスは捨てる**。コピーの「送信ゼロ」「完全保証」は憲法・Commentary に反するので **Adopt しない**。

### GSC 事実（2026-08 · 提督スクショ）

| 指標 | 値 |
|------|-----|
| 登録済み | **57** |
| 未登録 | **63**（合計既知 ≈120） |
| クロール済み - 未登録 | **20**（確認=失敗） |
| 検出 - 未登録 | **20** |
| リダイレクト | **15**（確認=失敗 · 多くは clean URL 301 の正常系の可能性） |
| sitemap.xml | 成功 · 検出 **72**（2025/08/12 読取表示 · 要: Reject除外後に再減） |

→ 「クロールしたが載せない」20件は thin / 低品質シグナルとして主因仮説を強化する。

### 実装進捗（2026-08-13）

| ID | 状態 |
|----|------|
| AD-R2-2 広告 allowlist | **実装**（`adsense-pages.mjs` · guides/hub/updates/statements/roadmap のみ） |
| AD-R2-1 Reject sitemap除外 + `_headers` noindex | **実装**（label/report/reverse/present） |
| AD-R2-1 meta robots | ソースに既存（確認済） |
| AD-R2-4 Hub 価値モジュール | **実装**（過大表現なし） |
| AD-R2-5 代表ツール本文 | invoice/stamp/normalize は既存 lead+FAQ で充足 · 追加量産は不要と判断 |
| AD-R2-8 GSC | 提督作業（削除リクエスト · 再クロール） |

---

## 1. 主因トップ3 — 採否

| 順位 | Gemini主因 | 判定 | 理由 |
|------|------------|------|------|
| 1 | 薄いURLへの自動広告一律注入 | **Adopt** | `build:pages` が core 全HTMLに自動広告。ツール殻＋広告は審査官視点で最悪の組 |
| 2 | Reject URL の 200 + 広告 + index 可能 | **Adopt（要実測）** | label/report/reverse 提供終了は事実。noindex/広告除外は未確認→先に確認してから実装 |
| 3 | ツール初期HTMLのテキスト不足 | **Adopt** | ガイドと別URL。代表ツールからプレーン本文を増やす |

**引き上げる仮説:** Hub カタログ感（C）は M→**P1** でよいが、広告・Reject の後。  
**捨てる/緩和:** 「一発スパム違反で即アウト」断定は強すぎ（**H寄りのリスク**と書く）。最終手段のツール全面非公開は **Defer**（ブランド・F1体験を壊す）。

---

## 2. Gemini誤り・危険コピー（実装禁止）

| Gemini記述 | 正しい扱い |
|------------|------------|
| `src/**/*.astro` | **不在**。`tools/*.html` · `assets/*` · `scripts/build-pages.mjs` |
| 架空ガイド `/guides/text-lint-guide` 等 | **作らない**。既存14本へリンク |
| 「データ外部送信ゼロ」「完全保証」 | **禁止**。業務データ非送信意図 + 静的/広告/解析の例外（Commentary C-05） |
| 「法律改正に準拠」断定 | **禁止**（F7 · Anti） |
| 全ツール一括400字を再申請必須 | **段階化**。まず代表ツール（invoice / stamp / normalize 等）→ 拡げ |

---

## 3. 採択バックログ（実装順）

| ID | 優先 | 打ち手 | 実ファイル候補 | Done |
|----|------|--------|----------------|------|
| **AD-R2-1** | P0 | Reject/提供終了ページに `noindex` | `build-pages` inject or 各終了HTML · `_headers` | **Done**（meta + `_headers` · sitemap除外） |
| **AD-R2-2** | P0 | 自動広告を **ガイド中心**に限定（ツール・終了・privacy/terms/contact 除外） | `scripts/adsense-pages.mjs` · `data/adsense.json` | **Done**（allowlist · verify-adsense） |
| **AD-R2-3** | P0 | Reject URL の実測（200/meta/広告）を1表に記録 | 本ログ追記 or 短い CHECK 節 | **Done**（meta/noindex · 広告無し · sitemap無し） |
| **AD-R2-4** | P1 | Hub FVに価値宣言＋guides導線（過大表現なし） | `tools/hub.html` · hub-config | **Done** |
| **AD-R2-5** | P1 | 代表ツールに導入・手順・FAQプレーンHTML（既存FAQ転用可） | 各 `tools/{id}.html` | **Defer**（invoice等は既存 lead+FAQで充足） |
| **AD-R2-6** | P1 | ガイド⇄ツール双方向リンク監査 | guides + tool FAQ | 穴リストを埋める |
| **AD-R2-7** | P1 | statements に実名非公開理由の1段落（既存方針と整合） | `tools/statements.html` | プライバシー徹底の論理 |
| **AD-R2-8** | 提督 | GSC: 終了URL削除/再クロール · カバレッジ確認 | GSC | スクショ or メモ |
| **AD-R2-9** | — | 再申請 | AdSense UI | **AD-R2-1〜2 + 代表テキスト + GSC清掃後、最低10〜14日待ち** |

**やらない（いま）:** 日記量産 · ツール全面非公開 · Astro移行 · 架空ガイド新設で文字稼ぎ。

---

## 4. Cursor チケット（読み替え後）

### T1 — Reject noindex + 広告除外  
`feat(seo): 提供終了ページ noindex と adsense 除外`  
→ `build-pages` / 終了HTML / `adsense-pages.mjs`

### T2 — AdSense パス制御  
`fix(ads): 自動広告を guides（と必要なら hub）に限定`  
→ `adsense-pages.mjs` allowlist or denylist

### T3 — Hub 価値モジュール  
`feat(hub): FVに安全設計要約と guides 導線（非過大）`  
→ `hub.html` · 必要なら `hub-config.json`

### T4 — 代表ツール本文密度  
`feat(tools): invoice/stamp/normalize 等に静的導入+手順+FAQ`  
→ 各 tool HTML（既存 FAQ を折りたたみ外へ）

---

## 5. 再申請ゲート（役員会用・短縮）

**押してよい条件（すべて）**

1. Reject URL = noindex（実測）  
2. ツール・終了・法務系で自動広告スクリプト無し（実測）  
3. 代表ツールで JSオフ本文 ≥300字  
4. GSC で終了URLの扱いを確認（削除申請 or noindex反映待ち）  
5. 改修本番反映から **10〜14日** 経過  

**押すな:** 不合格直後 · ガイドだけ追加した直後 · token/広告設定だけ変えた直後。

---

## 6. 次アクション提案

1. **今すぐ実測** AD-R2-3（終了3URLのHTMLソース: robots · adsbygoogle）  
2. **実装** T2（広告除外）→ T1（noindex）→ T4 代表3 → T3 Hub  
3. 提督: GSC + お支払い情報  
4. 待機 → 再申請  

実装着手の可否は提督指示待ちでよい。本 SYNTHESIS は採否の正本とする。
