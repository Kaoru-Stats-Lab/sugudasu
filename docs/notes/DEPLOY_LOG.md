# Deploy Log（SUGUDASU · Cloudflare Pages Free · SSOT）

**目的**: 提督・別 Agent が **同じ判断材料**で deploy を止めたり通したりできる台帳。**デプロイの度に 1 エントリ**。  
**インフラ**: [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/)（**500 builds/月**）· **コアと Sync は別プロジェクト・別経路**  
**手順 SSOT**: コア [`DEPLOY_CLOUDFLARE_PAGES.md`](DEPLOY_CLOUDFLARE_PAGES.md) · Sync [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md) · 運用 [`WORKFLOW.md`](../WORKFLOW.md)

**asl-dashboard（Vercel）の `DEPLOY_LOG` とは別ファイル。** 混同しない。

---

## Agent 着手前（必須 · 違反＝deploy 禁止）

1. 本ファイル **ゲート P1–P8** + **「事故防止 · ES module cache bust」** + **直近エントリ（同一 `target`）**を読む。
2. **本番反映の前に** 下記 **「新規エントリを追記」**（`status: approved` · `approver: 提督`）。
3. 機械ゲート: `npm run deploy:gate`（`--target=core` / `--target=sync`）。
4. **完了後** 同一エントリを **`executed`** に更新（`cf_deployment_id` · smoke · 月次ビルド残数）。

---

## デプロイ経路（MECE）

| target | プロジェクト | 正本経路 | リモートビルド |
|--------|--------------|----------|----------------|
| **`core`** | `sugudasu` · `sugudasu.com` | `npm run release:pages:free` → **`git push origin main`** | **ON**（push で +1 回カウント） |
| **`sync`** | `sugudasu-sync` · `sync.sugudasu.com` | `npm run deploy:pages:sync`（Wrangler 手動） | **OFF**（Automatic git deploys 無効） |

**共有予算**: 両プロジェクトのビルドは **同一 Cloudflare アカウントの 500 回/月**に加算。ローカル台帳 `.ops/cloudflare-pages-build-budget.json`（ソフト **450**）。

---

## ゲート（deploy 前 · 全項目 YES でなければ **実行禁止**）

| # | 確認 | core | sync |
|---|------|:----:|:----:|
| P1 | 作業ディレクトリ **`C:\asl_dev\sugudasu`**（asl-dashboard ではない） | ☑ | ☑ |
| P2 | **`target`** がエントリとコマンド一致（`core` / `sync`） | ☑ | ☑ |
| P3 | 本番相当ビルド成功（`build:pages` / `build:pages:sync`） | ☑ | ☑ |
| P4 | **`[cf-pages-free-guard]`** pass（ファイル数 · 25MiB · headers/redirects） | ☑ | ☑ |
| P5 | **月次ビルド予算 OK**（`guard:pages-budget` · ソフト 450） | ☑ | ☑ |
| P6 | 本ファイルに **`status: approved`** エントリ追記済み | ☑ | ☑ |
| P7 | **同一日・同一 target の deploy 試行 ≤ 1**（失敗後連打禁止） | ☑ | ☑ |
| P8 | Sync: Dashboard で **Automatic git deploys = Disabled** | — | ☑ |

**機械ゲート**: `npm run deploy:gate:core` / `npm run deploy:gate:sync`（最新エントリの `target` + `status` + `approver` を検査）。

**禁止（Free 枠防衛）**

- build 失敗直後の **push / wrangler 連打**
- `dist/` / `dist-sync/` の Git コミット
- Sync の **git push だけ**で本番反映しようとすること（自動デプロイ OFF が正）
- 月 450 回（ソフト）超過後の consume

---

## 事故防止 · ES module cache bust（必読 · 再発禁止）

**発生:** 2026-07-20 · `/watermark`（id `watermark` · **SUGUDASU 透かし**）で DnD クリックしてもファイル選択が開かない。  
**根因:** `_headers` で `/assets/*` が **immutable 1年**なのに、`watermark-app.js` だけ `?v=` 更新され、相対 import の **`watermark-engine.js` が古いキャッシュのまま**。Console: `does not provide an export named 'decodeImageFile'` → **モジュール全体が評価されず `bindDrop` 未登録**。  
**同型リスク:** `*-app.js` が `*-engine.js`（や共有 engine）を import する全プロダクト。**app だけバストして engine を忘れるな。**

**正本コード:** `scripts/build-pages.mjs` — `listBustAssetNames()`（全 `*-app.js` / `*-engine.js` をハッシュ）+ `bustJsImports()`（相対 `.js` import **すべて**に `?v=`）。新規 engine を足すときも **手動リスト追加は不要**（ディレクトリ自動拾い）。ただし **handoff / 共有ユーティリティ** は `BUST_ASSET_NAMES_EXPLICIT` に残す。

**デプロイ前セルフチェック（該当ツール改修時）**

1. `dist/assets/*-app.js` の `from './…-engine.js?v=…'` に **クエリが付いている**こと  
2. 共有依存（例: `pdf-images-engine` → `watermark-engine`）も `?v=` 付きであること  
3. 本番/プレビューで Console に `does not provide an export named` が無いこと · DnD ゾーンクリックで file chooser が開くこと

### エンジン付きプロダクト（注意喚起 · id / productName / ファイル）

| id | productName | app | engine（依存） |
|----|-------------|-----|----------------|
| **`watermark`** | **SUGUDASU 透かし** | `watermark-app.js` | **`watermark-engine.js`** ← **本事故の直接原因** |
| **`pdf-images`** | **SUGUDASU PDF画像抽出** | `pdf-images-app.js` | `pdf-images-engine.js` → **`watermark-engine.js`（共有）** |
| `mask` | SUGUDASU マスク | `mask-app.js` | `mask-engine.js` |
| `stamp` | SUGUDASU 電子印鑑 | `stamp-app.js` | `stamp-engine.js` |
| `test-data` | SUGUDASU テストデータ | `test-data-app.js` | `test-data-engine.js` |
| `planning-poker` | SUGUDASU 見積会議 | `planning-poker-app.js` | `planning-poker-engine.js` |
| `slot-board` | SUGUDASU 枠取りパレット | `slot-board-app.js` | `slot-board-engine.js` |
| `timeline` | SUGUDASU イベント進行 | `timeline-app.js` / `sync-timeline-s1-app.js` | `timeline-engine.js` |
| `budget-trim` | SUGUDASU 引き算パレット | `budget-trim-app.js` | `budget-trim-engine.js` |
| `group-split` | SUGUDASU 班分け | `group-split-assign-app.js` | `group-split-assign-engine.js` |
| `link-qr` | SUGUDASU リンク集QR | （ページ側） | `link-qr-engine.js` |
| `qr-reader` | SUGUDASU QR読取 | （ページ側） | `qr-reader-engine.js` |
| `sns` | SUGUDASU SNS | inline + `sns-app.js` | `sns-font-engine.js` |
| `font-converter` | SUGUDASU フォント変換 | `font-converter-app.js` | `sns-app.js` → `sns-font-engine.js` |
| （hub 検索） | — | `hub-search-boot.js` | `hub-search-engine.js` |

**補足:** `image-trim`（SUGUDASU 画像切り出し）は現状 `image-trim-app.js` 単体（engine なし）だが、将来 engine 分割したら **上表に追記必須**。`fair-draw` も同様に engine 分割時は追記。

**過去の同族事故（参照）:** DEPLOY-20260703-007（mask cache bust）· DEPLOY-20260703-013（link-qr module import cache bust）· **本節 + DEPLOY-20260720-002**。

---

## エントリ書式（コピペ用）

```markdown
## DEPLOY-YYYYMMDD-NNN

| 項目 | 値 |
|------|-----|
| **status** | `planned` / `approved` / `executed` / `blocked` / `aborted` |
| **target** | `core` / `sync` |
| **reason** | （例: FAQ 左寄せ · Sync env 結合 · hotfix） |
| **change_summary** | （例: tools/*.html · docs · changelog） |
| **local_build** | `pass` / `fail` / `skip` |
| **deploy_count_today** | 1（同一 target） |
| **pages_build_budget_after** | （executed 後 · 例: 14/450） |
| **gates** | P1–P8（該当 target）確認済み |
| **approver** | 提督 |
| **agent** | （任意 · Cursor セッション） |
| **cf_project** | `sugudasu` / `sugudasu-sync` |
| **cf_deployment_id** | （executed 後 · Dashboard URL または ID） |
| **smoke** | （executed 後 · 代表 URL 1〜3 行） |
```

---

## DEPLOY-20260626-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | FAQ 左寄せ · 情報ページ統一 · ads.txt headers · リード文改行 |
| **change_summary** | `assets/sugudasu.css` · `tools/*.html` · `docs/DESIGN_GUIDELINE_INFO_PAGES.md` · `data/changelog.json` |
| **local_build** | `pass` |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | （台帳 `.ops/` · Git 外） |
| **gates** | P1–P7（当時 DEPLOY_LOG 未導入 · 以降必須） |
| **approver** | 提督 |
| **agent** | cursor · 33156bd 系 |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | （git push · CF 自動ビルド） |
| **smoke** | `sugudasu.com` · `/updates` · `.sg-info-page` 反映確認済み |

---

## DEPLOY-20260626-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Sync Supabase インフラ完了のドキュメント MECE 反映 · Pages Free ガードレール · DEPLOY_LOG 初版 |
| **change_summary** | `docs/notes/DEPLOY_LOG.md` · `scripts/check-deploy-gate.mjs` · `docs/notes/SUPABASE_SYNC_KEEPALIVE.md` · `.github/workflows/supabase-sync-keepalive.yml` · 関連 SSOT 更新 |
| **local_build** | `skip`（ドキュメント・スクリプト中心） |
| **deploy_count_today** | 2 |
| **pages_build_budget_after** | （CF Dashboard · git push 自動ビルド） |
| **gates** | P1–P7 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `7858bf8`（git push · CF 自動ビルド） |
| **smoke** | （LP deploy と連続 · 004 で代表 smoke） |

---

## DEPLOY-20260626-004

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | LP型A-D RUNBOOK 文案反映 — **warikan** · **group-split** |
| **change_summary** | `tools/warikan.html` · `tools/group-split.html` · `data/changelog.json` · `docs/prompts/lp-runs/*-RUNBOOK.md` · `docs/notes/lp-runs/*-RESULT.md`（各8本） |
| **local_build** | `skip`（静的 HTML · push トリガー） |
| **deploy_count_today** | 3（core · 同一日） |
| **pages_build_budget_after** | （CF Dashboard 確認推奨） |
| **gates** | P1–P7 · 提督依頼で push 実行 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `b0bb674`（`33156bd..b0bb674` · git push origin main） |
| **smoke** | `sugudasu.com/warikan.html` · `sugudasu.com/group-split` — FV · 3ステップ · 信頼FAQ4問（提督確認待ち） |

**RUNBOOK 詳細:** [`docs/notes/lp-runs/LP_RUNBOOK_SESSION_20260626.md`](lp-runs/LP_RUNBOOK_SESSION_20260626.md)

---

## DEPLOY-20260626-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `sync` |
| **reason** | S1 E2E — マジックリンク修正 · ルーム削除 · anon プレースホルダー除去 |
| **change_summary** | `sync-supabase-sanitize.js` · `sync-timeline-s1-app.js` · build 時 JWT 検証 · `SYNC_S1_E2E_CHECKLIST.md` |
| **local_build** | `pass`（`.env.sync.local` に **実 anon** 必須） |
| **deploy_count_today** | 4（削除 UI · `364318ba`） |
| **pages_build_budget_after** | 18/450（2026-06 · wrangler のみ · ビルドは直前にローカル実行） |
| **gates** | P1–P8 · CF `SYNC_SUPABASE_ANON_KEY` = 実 JWT（プレースホルダー禁止） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu-sync` |
| **cf_deployment_id** | `364318ba`（削除 UI — `disabled` 廃止 · 行削除 · 確認ダイアログ · 先頭自動選択）← `be661ae5` ← `770637be` ← `1c71ab93` |
| **smoke** | `/timeline/app/` 200 · **E2E-3: 一覧各行「削除」から試行**（ハードリロード推奨） |

---

## DEPLOY-20260701-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | normalize 命名刷新 · 事務OLプリセット · Zenn 編集ストック docs |
| **change_summary** | `affeee6` normalize v1.1 · `104a79d` Zenn drafts · registry/hub/shell |
| **local_build** | `pass`（`validate:tool-naming` · `build:pages`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 1/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `affeee6`（`148bb7e..affeee6` · git push origin main） |
| **smoke** | `/normalize` — 全角半角整え · 改行→カンマ · 姓名スペース |

---

## DEPLOY-20260701-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | normalize Tier S LP · Zenn #12 初稿拡張 · FAQ Excel 使い分け |
| **change_summary** | `7e7129d` · `tools/normalize.html` · `hub.html` · Zenn docs · LP matrix |
| **local_build** | `pass`（`build:pages` · 2026-07-01 セッション） |
| **deploy_count_today** | 2 |
| **pages_build_budget_after** | 2/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `60a55ea`（`09e3751..60a55ea` · git push origin main） |
| **smoke** | `/normalize` — Tier S LP · FAQ Excel · 社内規程 FV |

---

## DEPLOY-20260701-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | normalize 確認パネル — 行数 + 変換前/後 統合 UI |
| **change_summary** | `tools/normalize.html` · `sugudasu.css` · 形状変換バッジ · changelog |
| **local_build** | `pass`（`build:pages` · text-normalize.test） |
| **deploy_count_today** | 3 |
| **pages_build_budget_after** | 3/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `53fb792`（`08490dc..53fb792` · git push origin main） |
| **smoke** | `/normalize` — 確認パネル · 変換前/後 · 形状変換バッジ |

---

## DEPLOY-20260702-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | statements 7原則アイコン導入 · WM crop 自動化 skill 追加 |
| **change_summary** | `tools/statements.html` · `assets/icons/principles/*.png` · `scripts/crop-principle-icons.mjs` · `.cursor/skills/crop-principle-icons/SKILL.md` |
| **local_build** | `pass`（`build:pages`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 3/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `51b2d69`（`f388a9b..51b2d69` · git push origin main） |
| **smoke** | `/statements` — 7原則アイコン表示 · 256px crop · principle-01 browser-play |

---

## DEPLOY-20260702-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Git push 委任 docs 正本追加（Agent 向け） |
| **change_summary** | `8562c97` · `334b810` · `docs/notes/DEV_GIT_AGENT_DELEGATION.md` |
| **local_build** | `pass`（`release:pages:free` · docs-only · サイト差分なし） |
| **deploy_count_today** | 2 |
| **pages_build_budget_after** | 4/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `334b810`（`a68417f..334b810` · git push origin main） |
| **smoke** | docs-only · 本番 UI 変更なし · `DEV_GIT_AGENT_DELEGATION.md` 反映 |

---

## DEPLOY-20260702-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | SUGUDASU マスク α v0.1.0 本番反映 · Zenn ネタ追記 |
| **change_summary** | `mask` 新規（engine/app · hub · registry）· `ZENN_MASK_DRAFT_MEMO` · `ZENN_OFFLINE_BROWSER_DRAFT_MEMO` · changelog |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 3 |
| **pages_build_budget_after** | 6/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `691271d`（`4d29b54..691271d` · git push origin main） |
| **smoke** | `/mask` — LP + エディタ · hub カード · nav「マスク」· changelog 2026-07-02 |

---

## DEPLOY-20260702-004

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | SUGUDASU テストデータ α v0.4.3 本番反映 |
| **change_summary** | `test-data` 新規（engine/app · 社員/給与/顧客/取引 · v0.4.3 氏名スペース・給与月次変動・日付統一）· hub/nav · normalize handoff · 3AIレビュー fixture/docs |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 4 |
| **pages_build_budget_after** | 6/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `ce3f10e`（`a6f4eba..ce3f10e` · git push origin main） |
| **smoke** | `/test-data` — 社員/給与生成 · nav「テストデータ」· hub カード · normalize handoff |

---

## DEPLOY-20260703-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | test-data v0.5 大規模社員CSV · マルチAI体制 docs 本番反映 |
| **change_summary** | `test-data` v0.5.0（25万行チャンク結合DL · 行別RNG · §8仕様）· `MULTI_AI_CODER_PLAYBOOK` · スケール上限 docs · BACKLOG |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 7/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `50145d3`（`9629929..50145d3` · git push origin main） |
| **smoke** | `/test-data` — 大規模エクスポート（2.5万/10万/25万）· v0.5.0 · multi-ai playbook docs |

---

## DEPLOY-20260703-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | test-data FAQ — 閉域アイデンティティ · normalize切り分け · 競合比較 · SEO |
| **change_summary** | `test-data.html` FAQ/OGP/JSON-LD · `TEST_DATA_TOOL_SPEC` §1.1 §6.6 · normalize非連携明記 · 競合5行比較表 |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 2 |
| **pages_build_budget_after** | 8/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `3e093ed`（`50145d3..3e093ed` · git push origin main） |
| **smoke** | `/test-data` — 閉域FAQ · 競合比較表 · normalize切り分け · title/OGP |

---

## DEPLOY-20260703-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | test-data 件数UI統合 · §6.7楔境界 · §6.8閉域ホワイトリスト/広告FAQ |
| **change_summary** | `test-data-app.js` 大規模CSV一括DL統合 · `test-data.html` 件数セグメント2.5万/10万/25万 · FAQ（ホワイトリスト·広告·社内ミラー）· `TEST_DATA_TOOL_SPEC` §6.7 §6.8 · BACKLOG |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 3 |
| **pages_build_budget_after** | 9/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督 push 依頼 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `c2d34f6`（`bc9c7ea..c2d34f6` · git push origin main） |
| **smoke** | `/test-data` — 件数2.5万/10万/25万 · 一括CSV DL · ホワイトリスト/広告FAQ · §6.8 |

---

## DEPLOY-20260703-004

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | AdSense 自動広告タグ（build 注入 + guard）· test-data スライダー · TXN整合 · 閉域FAQ |
| **change_summary** | `data/adsense.json` · `adsense-pages.mjs` · `verify-adsense-pages.mjs` · `build-pages` head 注入 · test-data UI/FAQ · `TEST_DATA_TOOL_SPEC` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 4 |
| **pages_build_budget_after** | 10/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督 push 依頼 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `2d3cc6c`（`75f51c0..2d3cc6c` · git push origin main） |
| **smoke** | `/` — view-source に AdSense script · `/test-data` — 件数スライダー · 閉域FAQ · Sync 本番はタグなし（別プロジェクト） |

---

## DEPLOY-20260703-005

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | test-data 件数スライダー不具合（表示・生成が100固定） |
| **change_summary** | `test-data-app.js` スライダーイベント委譲 · プリセット別件数正規化 · ヒント文案 · `resolveCountForPreset` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 5 |
| **pages_build_budget_after** | 11/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督 hotfix |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `293258e`（`d1fdae9..293258e` · git push origin main） |
| **smoke** | `/test-data` — スライダーで500/5000/25万表示 · 生成件数一致 · 種別切替でスケール・ヒント更新 |

---

## DEPLOY-20260703-006

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | mask ドラッグ後に黒塗り/モザイクが適用されない（プレビューだけ残る） |
| **change_summary** | `mask-app.js` — 非同期プレビューと pointerup の競合修正（dragGeneration） |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 6 |
| **pages_build_budget_after** | 12/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督 hotfix |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `6a5c145`（`35bffe1..6a5c145` · git push origin main） |
| **smoke** | `/mask` — ドラッグ離しで黒塗り/モザイクが残る · 点線プレビューだけ残らない |

---

## DEPLOY-20260703-007

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | mask 黒塗り未適用（再発）— 同期 ImageData + JS キャッシュバスト |
| **change_summary** | `mask-app.js` 同期プレビュー/適用 · `build-pages` 全 module JS に ?v= · mask-engine バスター |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 7 |
| **pages_build_budget_after** | 13/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督 hotfix |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `e27c171`（`f7e56ff..e27c171` · git push origin main） |
| **smoke** | `/mask` — ドラッグ離しで黒塗り · ステータス「黒塗りを適用」· view-source に mask-app.js?v= |

---

## DEPLOY-20260703-008

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | mask 矩形確定不具合の根治 · マニュアル向けぼかし/同色塗り |
| **change_summary** | `mask-app.js` オーバーレイ+document drag · `applyBlurRect`/`applyColorRect` · UI ぼかし/黒/同色/スタンプ · モザイク廃止 |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 8 |
| **pages_build_budget_after** | 14/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `c84ba5f`（`ad84d37..c84ba5f` · git push origin main） |
| **smoke** | `/mask` — 提督スモーク済（2026-07-03）· ぼかし/黒/同色/スタンプ · 確定 · 点線消去 · ステータス OK |

---

## DEPLOY-20260703-009

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Prior Art 探索フロー正本化（多言語 Git 検索 · Token 節約） |
| **change_summary** | `MULTI_AI_CODER_PLAYBOOK.md` §9 · §2.3 · `MASK_TOOL_SPEC.md` §8 実例 · RUNBOOK · `.cursorrules` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 9 |
| **pages_build_budget_after** | 15/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `17a6811`（`403e482..17a6811` · git push origin main） |
| **smoke** | 本番 UI 変更なし · `MULTI_AI_CODER_PLAYBOOK.md` §9 存在確認 |

---

## DEPLOY-20260703-010

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | normalize 事務OL訴求 — 実務ガイド（都内総務OL編） |
| **change_summary** | `guides/office-roster-normalize` · guides 索引 · normalize 相互リンク · mask 提督スモーク追記 |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 10 |
| **pages_build_budget_after** | 16/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `b1b4c23`（`07ec690..b1b4c23` · git push origin main） |
| **smoke** | pass — `/guides/office-roster-normalize` 200 · `/guides` 事務セクション 200 · `/normalize` ガイドリンク 200 |

---

## DEPLOY-20260703-011

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | リンク集QR（link-qr）α — イベント懇親会フォロー交換 |
| **change_summary** | `link-qr` 新規 · `#p=` base64url · hub · nav · sns 相互リンク · 単体テスト |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 11 |
| **pages_build_budget_after** | 17/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `2238cba`（`ef63666..2238cba` · git push origin main） |
| **smoke** | pass — `/link-qr` 200 · 本文・フォームあり · `/sns` → link-qr リンク 200 |

---

## DEPLOY-20260703-012

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | link-qr イベント連絡プリセット · normalize SQL IN · 企画ドキュメント |
| **change_summary** | `link-qr` イベント連絡/幹事コピー · `normalize` sql_in · BACKLOG §1-15-6〜8 · 台帳 · Vibe MECE 調査 |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 12 |
| **pages_build_budget_after** | 18/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼（溜まり分一括） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `c3a8839`（`6370d4a..c3a8839` · git push origin main） |
| **smoke** | pass — `/link-qr` 200 · イベント連絡セグメントあり · `/normalize` 200 · SQL IN プリセットあり |

---

## DEPLOY-20260703-013

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | link-qr タブ不能 hotfix（module import cache bust）· normalize プリセット segment 3×2 |
| **change_summary** | `build-pages` import `?v=` · `link-qr-engine` 新API反映 · `normalize` cols-3 · segment pill 2段対応 |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 13 |
| **pages_build_budget_after** | 19/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼（本番反映） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `67ab4c7`（`b2739d6..67ab4c7` · git push origin main） |
| **smoke** | pass — `/link-qr` タブ切替・Slack欄表示 · engine `?v=5cfaa875` · `/normalize` 6プリセット cols-3 |

---

## DEPLOY-20260703-014

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Core UI Refresh 本番反映 · ガイド記事 sg-guide-article · PAGE_LAYOUT_SELECTOR |
| **change_summary** | `sg-main-shell` 全ツール横展開 · `sg-info-page` 情報ページ · ガイド8本 · `PAGE_LAYOUT_SELECTOR.md` · changelog |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 14 |
| **pages_build_budget_after** | 20/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼（本番反映） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `ea571fc`（`e803480..ea571fc` · git push origin main） |
| **smoke** | pass — `/normalize` 200 · `/guides/event-runbook` sg-guide-article--event 確認 |

---

## DEPLOY-20260703-015

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | リード文2段デッキ · ガイド表CSS · sg-tool-intro 幅修正 |
| **change_summary** | `sg-tool-lead-deck` / `sg-guide-lead-deck` · hub/timeline/fair-draw · 全ツールリード文案 · `sg-guide-table-scroll` · docs/archive |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 15 |
| **pages_build_budget_after** | 21/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼（本番反映） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `fb43de1`（`ea571fc..fb43de1` · git push origin main） |
| **smoke** | pass — `/` hub sg-tool-lead-deck · `/normalize` 2段リード · `/guides/invoice-browser-workflow` 表レイアウト |

---

## DEPLOY-20260703-016

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 開発ロードマップ · 更新履歴対ナビ · シフトFAQ · 透明性粒度ルール |
| **change_summary** | `/roadmap` · `sg-dev-transparency-nav` · shift FAQ/scope · `DEV_TRANSPARENCY_RULES.md` · changelog 粒度修正 |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 16 |
| **pages_build_budget_after** | 22/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼（本番反映） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `5cff6f3`（`96907b9..5cff6f3` · git push origin main） |
| **smoke** | pass — `/roadmap` 3レーン · `/updates` 対ナビ · `/shift` FAQ · `roadmap.html#shift-v2-peak` |

---

## DEPLOY-20260704-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | table-conv 配信 · invoice 源泉 No.2792 · normalize v1.3 · fair-draw CSV · roadmap 対象外 |
| **change_summary** | `table-conv` registry/hub/FAQ · `invoice-finance` 源泉・手取契約 · `normalize` 行整理/伏字 · `fair-draw` Connpass CSV · `roadmap.json` 表変換対象外 · changelog |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 23/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督依頼（日付替わり本番反映） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `33474f2`（`ee3224a..33474f2` · git push origin main） |
| **smoke** | pass — `/table-conv` · `/invoice` 源泉検算 · `/normalize` · `/roadmap#table-conv-md-dialects` |

---

## DEPLOY-20260709-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | match-board 独立化 · 見積会議（planning-poker）追加 · time-calc 実装 · statements/adsense 運用更新 |
| **change_summary** | `tools/match-board.html` · `tools/planning-poker.html` · `tools/time-calc.html` · `assets/*` 実装群 · `data/changelog.json` / `data/tool-registry.json` · `docs/notes/sync-specs/*` 整理移動 · `tools/statements.html` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 24/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 確認済み |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `d781dd4`（`3e198ce..d781dd4` · git push origin main） |
| **smoke** | pending — Cloudflare build 完了後に `sugudasu.com` / `updates` / `roadmap` で表示確認 |

---

## DEPLOY-20260709-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | FAQ 白背景統一 · 設定パネル縦スクロール除去 · qr-reader FAQ · match-board FAQ 追記 |
| **change_summary** | `table-conv` / `stamp` FAQ を `sg-faq-section` 外配置 · `shift` / `label` `.sg-setup-panel`（max-height 除去）· `qr-reader` FAQ · `match-board` FAQ（Excel/表変換案内）· `docs/notes/TWO_COLUMN_WORK_MODE_PATTERN_LOG.md`（Phase 2 作業モードは次段階） |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 2 |
| **pages_build_budget_after** | 25/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 確認済み |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `7d547d0`（`4930f91..7d547d0` · git push origin main） |
| **smoke** | pending — `/table-conv` `/stamp` FAQ 白帯 · `/shift` `/label` 左パネル内スクロールなし · `/qr-reader` FAQ |

---

## DEPLOY-20260710-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | GSC SEO パイプライン · FAQ 全幅テンプレ · time-calc「時給計算」改名 · og:url clean path |
| **change_summary** | `build-pages` canonical/robots/X-Robots `/data/` · `verify-ogp` · FAQ main外 · `time-calc` 命名 · planning-poker/link-qr FAQ · SEO SSOT |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 26/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督「本番に反映して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `262c38c`（`32978e7..262c38c` · git push origin main） |
| **smoke** | pass — `/robots.txt` に `Disallow: /data/` · `/time-calc` に「時給計算」 |

---

## DEPLOY-20260710-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `sync` |
| **reason** | 付箋ルーム（sticky-room）初回 Sync 反映 · 整列/見出し · Room DoD |
| **change_summary** | `tools/sync-room.html` · `assets/sticky-room-*.js/css` · sticky-room tests · STICKY_ROOM_* docs · release-checklist |
| **local_build** | `pass`（`deploy:pages:sync`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 27/450（2026-07 · sync wrangler · 要 Dashboard 照合） |
| **gates** | P1–P8 · 提督「本番に反映して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu-sync` |
| **cf_deployment_id** | `f1711774`（https://f1711774.sugudasu-sync.pages.dev） |
| **smoke** | pass — wrangler Success · `sync.sugudasu.com/room` |

---

## DEPLOY-20260715-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | マスク注釈を Skitch / PinkArrows 型の太い塗り矢印・枠へ差し替え |
| **change_summary** | `assets/mask-engine.js` · `assets/mask-app.js` · `tools/mask.html` · `data/changelog.json` · `scripts/mask-engine.test.mjs` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 28/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督「本番に反映して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `57ed661`（`7015aea..57ed661` · git push origin main） |
| **smoke** | pass — `/mask` 200 · 文案に「Skitch」· `mask-app.js?v=` cache-bust あり |

---

## DEPLOY-20260715-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 本家 Skitch 型矢印へ差し替え · 枠の白フチを適度に狭く（提督「本番に反映して」· 同日 core 2回目 · P7 オーバーライド） |
| **change_summary** | `assets/mask-engine.js` · `assets/mask-app.js` · `tools/mask.html` · `data/changelog.json` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 2（P7 override · 提督明示） |
| **pages_build_budget_after** | 29/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「枠の白を修正してから本番に反映して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `f4a3b11`（`de62c54..f4a3b11` · git push origin main） |
| **smoke** | pass — `/mask` 200 · 「本家 Skitch」文案 |

---

## DEPLOY-20260715-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | roadmap — マスク文字注釈を検討中 · 画像切り出し URL取込/編集化を対象外（提督依頼 · 同日 core 3回目 · P7 override） |
| **change_summary** | `data/roadmap.json` · `docs/notes/DEPLOY_LOG.md` |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 3（P7 override · 提督明示） |
| **pages_build_budget_after** | 30/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「検討中で入れて · 対象外も記載」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `99c2124`（`fd71adb..99c2124` · git push origin main） |
| **smoke** | pass — `/data/roadmap.json` に mask-annotate-text · image-trim-url-capture |

---

## DEPLOY-20260715-004

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 見積会議・司会代行入力 + FAQ/updates · mask Ctrl+Z 等の未 push 分を本番反映（提督 Commit&Push · 同日 core 4回目 · P7 override） |
| **change_summary** | `tools/planning-poker.html` FAQ · `assets/planning-poker-app.js` · `data/changelog.json` · roadmap/SPEC · mask shortcut ほか |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 4（P7 override · 提督明示） |
| **pages_build_budget_after** | 31/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit&Pushして」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `3c149b5`（`331dd91..3c149b5` · git push origin main） |
| **smoke** | pass — `/planning-poker` FAQ「どう使えば」「まだできません」 |

---

## DEPLOY-20260715-005

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | AdSense有用性対策 — `/contact` · 実務ガイド5本 · 主要ツールへのガイド導線（提督「本番に反映して」· 同日 core 5回目 · P7 override） |
| **change_summary** | `tools/contact.html` · `tools/guides/*` 5本 · `data/guides.json` · `tools/guides.html` · invoice/mask/planning-poker/timeline 導線 · `assets/sugudasu-shell.js` footer · AdSense監査/プロンプト docs · changelog |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 5（P7 override · 提督明示） |
| **pages_build_budget_after** | 32/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「本番に反映して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `5984fbb`（`b3a71a3..5984fbb` · git push origin main） |
| **smoke** | pass — `/contact`「Googleフォームで送る」· `/guides` に browser-data-privacy · `/mask` にガイド導線 |

---

## DEPLOY-20260716-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | AdSense 監査向け /guides 加筆（5本）＋`/guides` 索引レイアウト幅調整 |
| **change_summary** | `tools/guides/{planning-poker-estimation,pdf-image-masking-security,browser-data-privacy,client-invoice-dispute-prevention,event-day-timeline-recovery}.html` · `tools/guides.html` · `assets/sugudasu.css` · `docs/notes/ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md` |
| **local_build** | `pass`（terminal 2 build log） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | （要 Dashboard 照合） |
| **gates** | P1–P7（台帳追記は後追い。以後は deploy 前に必須） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `0776420`（`8a57b6f..0776420` · git push origin main） |
| **smoke** | pending — `https://sugudasu.com/guides` の cards 幅 / 加筆本文の反映確認待ち |

---

## DEPLOY-20260716-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | ユーザー向け文言の slug/開発者口調除去（FAQ · hub · statements · Sync LP 一部）· USER_FACING 指針追加（提督「Commit&Push」） |
| **change_summary** | hub/fair-draw/statements/font-converter/test-data/qr-reader/diff · sync-index/timeline LP·app · prize-law-patterns · `USER_FACING_COPY_VISIBILITY.md` · GUIDES/DESIGN/.cursorrules リンク |
| **local_build** | `pass`（`release:pages:free` · budget consume 33/450） |
| **deploy_count_today** | 2（P7 override · 提督明示 Commit&Push） |
| **pages_build_budget_after** | 33/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「たまっているものをCommit&Push」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `c1f10da`（`38eb104..c1f10da` · git push origin main） |
| **smoke** | pending — `/` hub カード文言 · `/fair-draw` FAQ · `/statements` WebP変換表記 |

---

## DEPLOY-20260716-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | invoice 税率「対象外」(0) が sync で 10% に潰れるバグ修正 · FAQ に国税庁 No.6359 案内（提督 Commit&Push） |
| **change_summary** | `tools/invoice.html` parseInvoiceTaxRate · FAQ · `scripts/invoice-finance.test.mjs` 値引きケース |
| **local_build** | `pass`（`release:pages:free` · budget consume 34/450） |
| **deploy_count_today** | 3（P7 override · 提督明示 Commit&Push） |
| **pages_build_budget_after** | 34/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit & Push して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `8274572`（`389b198..8274572` · git push origin main） |
| **smoke** | pending — `/invoice` 値引き行を「対象外」にしたときプレビュー税率が「対象外」のままか |

---

## DEPLOY-20260717-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 検索式ビルダー α · match-board 定員スペース区切り修正 · roadmap 対象外宣言（提督 Commit&Push） |
| **change_summary** | `tools/search-query.html` · `assets/search-query.js` · registry/hub/shell · match-board parseSlotsText · roadmap/changelog · SPEC |
| **local_build** | `pass`（`release:pages:free` · budget consume 35/450） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 35/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P7 · 提督「たまっているものをCommit&Push」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `d8f9e91`（`41ef83d..d8f9e91` · git push origin main） |
| **smoke** | pending — `/search-query` プリセットPDF · `/match-board` スペース区切り定員 |

---

## DEPLOY-20260717-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 検索式ビルダー UI 磨き（site blur 正規化 · 詳細折りたたみ · 文言整理 · 4AI実装後レビュー反映） |
| **change_summary** | `tools/search-query.html` · `docs/notes/SEARCH_QUERY_BUILDER_SPEC.md` |
| **local_build** | `pass`（`release:pages:free` · budget consume 36/450） |
| **deploy_count_today** | 2（P7 override · 提督明示 Commit&Push） |
| **pages_build_budget_after** | 36/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit & Push して」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `8f9aaf9`（`3ddcc42..8f9aaf9` · git push origin main） |
| **smoke** | pending — `/search-query` site blur 置換 · 詳細折りたたみ · Googleで開く |

---

## DEPLOY-20260717-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | statements 製品地図 MECE 化 · video-frame α · roadmap scheduled · 同タイミング更新ゲート |
| **change_summary** | `data/statements-product.json` · `tools/statements.html` · `tools/video-frame.html` · `assets/video-frame.js` · `scripts/verify-statements-product.mjs` · registry/hub/shell · roadmap · changelog · DEV_TRANSPARENCY |
| **local_build** | `pass`（`release:pages:free` · budget consume 37/450） |
| **deploy_count_today** | 3（P7 override · 提督明示 Commit&Push） |
| **pages_build_budget_after** | 37/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit&Pushして」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `3c506b5`（`23534ad..3c506b5` · git push origin main） |
| **smoke** | pending — `/statements` カテゴリ8 · ツール対応に動画コマ抜き · `/video-frame` ドロップ→PNG |

---

## DEPLOY-20260717-004

| 項目 | 値 |
|------|-----|
| **status** | `aborted` |
| **target** | `core` |
| **reason** | statements ツール名が slug（video-frame）表示されていた hotfix · productName を JSON に埋め込み |
| **change_summary** | `data/statements-product.json` · `tools/statements.html` · `scripts/sync-statements-product-names.mjs` · verify |
| **local_build** | skip（未 release · **DEPLOY-20260718-001 に統合**） |
| **deploy_count_today** | — |
| **pages_build_budget_after** | — |
| **gates** | aborted · 同梱先 20260718-001 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | — |
| **smoke** | — |

---

## DEPLOY-20260718-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 非送信主張の是正（入力データ vs テレメトリ）· 共通 privacy-badge · statements GA4/AdSense/Fonts 開示 · statements productName hotfix 統合 · diff 空白クレンジング任意オプション |
| **change_summary** | `tools/statements.html` · `assets/sugudasu-shell.js` · 各 tools HTML · guides · `DATA_PRIVACY_CLAIM_POLICY.md` · `DESIGN_GUIDELINE.md` · `data/statements-product.json` · `diff.html` / `diff-app.js` · changelog · README |
| **local_build** | `pass`（`release:pages:free` · budget consume 38/450） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | 38/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P8（core）確認済み · 提督最終承認（フェーズ1〜3） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `c290f81`（`4c3b48a..c290f81` · git push origin main） |
| **smoke** | pending — `/statements#telemetry-disclosure` · `#verify-devtools` · `/normalize` privacy-badge · `/diff` 空白無視 |

---

## DEPLOY-20260718-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | watermark / pdf-images 本番公開 · hub・ナビリンク追加 · ガイド表/リード単列修正 |
| **change_summary** | `tools/watermark.html` · `tools/pdf-images.html` · hub/shell/registry · vendor pdfjs · guide table/lead CSS · SSOT · changelog/roadmap |
| **local_build** | `pass`（`release:pages:free` · budget consume 39/450） |
| **deploy_count_today** | 2（**P7 override** · 提督指示「確認してPUSHまで」· 同一日2回目） |
| **pages_build_budget_after** | 39/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P8（core）確認済み · P7 override 明示 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `dd14049`（`6acf9c0..dd14049` · git push origin main） |
| **smoke** | pending — `/` hub に透かし・PDF画像抽出 · `/watermark` · `/pdf-images` |

---

## DEPLOY-20260718-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | pdf-images 範囲選択 · 開始ページ検証 · ZIP衝突回避 · FAQ（提督 Commit&Push） |
| **change_summary** | `PDF_IMAGE_EXTRACT_SPEC/TECH` · `pdf-images-engine/app` · `tools/pdf-images.html` FAQ · tests |
| **local_build** | `pass`（`release:pages:free` · budget consume 40/450） |
| **deploy_count_today** | 3（**P7 override** · 提督指示「Commit&Push」· 同一日3回目） |
| **pages_build_budget_after** | 40/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P8（core）確認済み · P7 override 明示 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `22e1f0f`（`5a057b9..22e1f0f` · git push origin main） |
| **smoke** | pending — `/pdf-images` 範囲UI · FAQ · ZIP名 |

---

## DEPLOY-20260718-004

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | slot-board（枠取りパレット）α 本番公開 · hub/ナビ · 提督 Commit&Push |
| **change_summary** | `tools/slot-board.html` · engine/app/css · registry/hub/shell · statements · changelog · SLOT_BOARD_SPEC · tests |
| **local_build** | `pass`（`release:pages:free` · budget consume 41/450） |
| **deploy_count_today** | 4（**P7 override** · 提督指示「Commit&Push」· 同一日4回目） |
| **pages_build_budget_after** | 41/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P8（core）確認済み · P7 override 明示 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `4e678b0`（`71fd6b1..4e678b0` · git push origin main） |
| **smoke** | pending — `/` hub 枠取り · `/slot-board` |

---

## DEPLOY-20260718-005

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 新規ツール公開 MECE を Playbook §1.5 に固定（Agent Token 節約） |
| **change_summary** | `TOOL_NAMING_AGENT_PLAYBOOK.md` §1.5 · `.cursorrules` · tool-naming.mdc · learned/tool-ship-mece.mdc |
| **local_build** | `skip`（製品 HTML/アセット差分なし · Agent SSOT / ルールのみ） |
| **deploy_count_today** | 5（**P7 override** · docs/Agent手順 · 同一日5回目） |
| **pages_build_budget_after** | （git push による CF 自動ビルド +1 · Dashboard 照合） |
| **gates** | P1–P8（core）· P7 override · 製品差分なしのため local release 省略 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `66cc1ef`（playbook MECE · `git push origin main`） |
| **smoke** | NA（製品画面変更なし） |

---

## DEPLOY-20260718-006

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | slot-board ファーストビュー · FAQ再構成（用途明示 · サマリー · 空状態）· 提督 Commit&Push |
| **change_summary** | `tools/slot-board.html` · `slot-board-app.js` · `slot-board.css` · `SLOT_BOARD_SPEC.md` |
| **local_build** | `pass`（`release:pages:free` · budget consume 42/450） |
| **deploy_count_today** | 6（**P7 override** · 提督 Commit&Push · 同一日6回目） |
| **pages_build_budget_after** | 42/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P8（core）確認済み · P7 override 明示 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `30e4adf`（`af6441d..30e4adf` · git push origin main） |
| **smoke** | pending — `/slot-board` サブコピー · 用途 · FAQ7 · 空プレースホルダ |

---

## DEPLOY-20260718-007

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 見積会議 — プロジェクター投影向け Reveal前後視線誘導 · 視認性二重化（提督 Commit&Push · 同日 core 7回目 · P7 override） |
| **change_summary** | `tools/planning-poker.html` · `assets/planning-poker-app.js` · changelog |
| **local_build** | `pass`（`release:pages:free` · budget consume 43/450） |
| **deploy_count_today** | 7（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 43/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit&Push」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `f4fea1d`（`105f357..f4fea1d` · git push origin main） |
| **smoke** | pass — `/planning-poker`「開始セットアップ」（3秒なし）·「最小 ▼」· Reveal待機文 |

---

## DEPLOY-20260718-008

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 見積会議 — Reveal後に結果欄が出ないバグ修正（提督 Commit&Push · 同日 core 8回目 · P7 override） |
| **change_summary** | `tools/planning-poker.html` · `assets/planning-poker-app.js` · `SEO_GSC_AND_BUILD_PIPELINE.md` |
| **local_build** | `pass`（`release:pages:free` · budget consume 44/450） |
| **deploy_count_today** | 8（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 44/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「そのままCommit&Pushして」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `53cad7e`（`37bf0f6..53cad7e` · git push origin main） |
| **smoke** | pass — `/planning-poker` に `data-pp-reveal-slot` · JS `syncRevealVisibility` |

---

## DEPLOY-20260718-009

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 見積もりすり合わせガイド書き換え · 開発以外シーン · ハイブリッドSEO FAQ（提督 Commit&Push · 同日 core 9回目 · P7 override） |
| **change_summary** | `tools/guides/planning-poker-estimation.html` · `tools/planning-poker.html` · `tools/guides.html` · `data/guides.json` · `data/changelog.json` |
| **local_build** | `pass`（`release:pages:free` · budget consume 45/450） |
| **deploy_count_today** | 9（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 45/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit&Pushして」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `3cb6813`（`d819d94..3cb6813` · git push origin main） |
| **smoke** | pass — `/guides/planning-poker-estimation`「開発以外でも使える」· フィボナッチFAQ · TシャツFAQなし |

---

## DEPLOY-20260718-010

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 見積ガイドに計画の錯誤・名著案内 · Diff FAQ · 台帳更新（提督「未コミットすべて Commit&Push」· 同日 core 10回目 · P7 override） |
| **change_summary** | `planning-poker-estimation` · guides · changelog · `diff.html` · DIFF_PRECOMPARE · PRODUCT_IDEA · DEPLOY_LOG |
| **local_build** | `pass`（`release:pages:free` · budget consume 46/450） |
| **deploy_count_today** | 10（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 46/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「未コミットのすべてをCommit&Push」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `25b62e2`（`48d034b..25b62e2` · git push origin main） |
| **smoke** | pass — `/guides/planning-poker-estimation` 計画の錯誤 · Cohn/McConnell · tag=harusineision-22 · `/diff` faq-diff-cleanse |

---

## DEPLOY-20260718-011

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 相対リンク罠の修正（ルート絶対クリーンURL）· 提督 Commit&Push · 同日 core 11回目 · P7 override |
| **change_summary** | `assets/sugudasu-shell.js` · `scripts/build-pages.mjs` · `SEO_GSC_AND_BUILD_PIPELINE.md` · changelog |
| **local_build** | `pass`（`release:pages:free` · budget consume 47/450） |
| **deploy_count_today** | 11（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 47/450（2026-07 · core git push · 要 Dashboard 照合） |
| **gates** | P1–P6 · P7 override · 提督「Commit&Push」 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `737332a`（`f111d9f..737332a` · git push origin main） |
| **smoke** | pass — dist hub `href="/slot-board"` · `/invoice`（相対 `.html` なし） |

---


## DEPLOY-20260719-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Hub IA Refresh Phase 1 · カテゴリ SSOT 昇格 · 提督 Commit&Push |
| **change_summary** | categories/hub-config/synonyms · hub-ia.js · /category/{id} · image-trim Ctrl+V 文言 · ADR-0003 · Tsukutta 事実ブロック · 画像系判定台帳 |
| **local_build** | `pass`（`release:pages:free` · budget consume 48/450） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | `48/450`（2026-07 · core git push） |
| **gates** | P1–P8（本エントリ承認後に gate） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `26ec789`（`5e648fe..26ec789` · git push origin main） |
| **smoke** | `pass` — `/` Hub 検索 · `/category/docs` · `/image-trim` |

---

## DEPLOY-20260719-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Hub/category のクリーンURL hotfix · `/hub.html` すり抜け修正 · 提督 Commit&Push · 同日 core 2回目 · P7 override |
| **change_summary** | `build-pages.mjs` rewrite 強化 · category パンくず `/` · hub-ia `pageHref` · SEOメモ |
| **local_build** | `pass`（`release:pages:free` · budget consume 49/450） |
| **deploy_count_today** | 2（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | `49/450`（2026-07 · core git push · P7 override） |
| **gates** | P1–P6 · P7 override · 提督 Commit&Push |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `7817638`（`89034ad..7817638` · git push origin main） |
| **smoke** | `pass` — `/category/docs` パンくず `/` · カード `/invoice` · `/hub.html` なし |

---

## DEPLOY-20260720-001

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Hub IA Phase2 Header · カード JTBD 文言 · 検索辞書 · budget-trim 等未反映分の本番反映 · 提督 Commit&Push |
| **change_summary** | `sugudasu-shell` サイトナビ · hub-cards JTBD · hub-search · `#hash` 付き内部リンク rewrite · TOOL_CARD_WRITING_GUIDELINE · budget-trim 他 |
| **local_build** | `pass`（`release:pages:free` + path-verify · budget consume 50/450） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | `50/450`（2026-07 · core git push） |
| **gates** | P1–P8 · path-verify（updates/roadmap/statements · `.html#` rewrite） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `db205b7`（`282098d..db205b7` · git push origin main） |
| **smoke** | `pass` — `/updates` → `/statements#copy-first-tech` · `/roadmap`·`/statements` に相対 `*.html` なし · shell `resolveNavMode` |

---

## DEPLOY-20260720-002

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 本番一括反映（提督指示）— watermark engine cache bust 再発防止 · Hub 検索 3 層辞書 · Top IA / レイアウト ADR·Design 凍結 · サンプル早期描画 |
| **change_summary** | `build-pages` 全 `*-app`/`*-engine` bust · `brand-normalize` / `search-thesaurus` / `tool-intent-map` · hub-search-engine Layer1–3 · ADR-001〜005 · design/cursor/decision-log · hub-layout 左寄せ・4列凍結 · font-converter/sns サンプル · DEPLOY_LOG 事故防止節 |
| **incident** | `/watermark` DnD 不能（古い `watermark-engine.js`）· 同型 engine 付きプロダクトを台帳化 |
| **local_build** | `pass`（`validate:hub-ia` · `release:pages:free` · budget consume 51/450） |
| **deploy_count_today** | 2（**P7 override** · 提督「すべて本番反映」） |
| **pages_build_budget_after** | 51/450 |
| **gates** | P1–P6 · P7 override · 事故防止 cache bust 確認 · validate:hub-ia |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `302e41d2`（`7505f01` · git push origin main · https://dash.cloudflare.com/adbc084a711933271252e34fab58a209/pages/view/sugudasu/302e41d2-934b-49cb-9fee-6c4c200b558e） |
| **smoke** | `/watermark` · `/pdf-images` · `/` · `/font-converter` · `/sns` 200 · `watermark-app.js` → `watermark-engine.js?v=95d8960f` · `hub-ia.js` `brandRules=YES` |

---

## DEPLOY-20260720-003

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | Hub 検索 Phase1（提督指示）— hiddenKeywords · 検索順位 · normalizeKeyword · description フォールバック |
| **change_summary** | `hub-search-engine` 順位ティア · `search-dictionary/*/hiddenKeywords` · bundle/render/verify · 「グループ」→班分け |
| **local_build** | `pass`（`release:pages:free` · budget consume 52/450） |
| **deploy_count_today** | 3（**P7 override** · 提督「本番環境に反映」） |
| **pages_build_budget_after** | 52/450 |
| **gates** | P1–P6 · P7 override · validate:hub-ia · test:hub-search |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `e2bfb40e`（`d46c208` · git push origin main · https://dash.cloudflare.com/adbc084a711933271252e34fab58a209/pages/view/sugudasu/e2bfb40e-18be-40de-aa5d-5b52cdaacf4d） |
| **smoke** | `/` 200 · `hub-search-engine.js` `normalizeKeyword`+`hiddenKeyword` · bundle `group-split`/`グループ` hiddenKeyword×2 |

---

## DEPLOY-20260720-004

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 提督 Commit&Push — 引き算パレット UI + Hub 検索後の全件復帰（bfcache/hidden） |
| **change_summary** | `budget-trim-*` 1行·ロック多重表現 · `hub-ia` `sg-is-filtered` / pageshow カタログ復帰 · `sugudasu.css` |
| **local_build** | `pass`（`release:pages:free` · budget consume 54/450） |
| **deploy_count_today** | 4（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 54/450 |
| **gates** | P1–P6 · P7 override · test:budget-trim · hub-ia 構文 |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `6deff099`（`579f81d` · git push origin main · https://dash.cloudflare.com/adbc084a711933271252e34fab58a209/pages/view/sugudasu/6deff099-d459-488f-8e3a-bf68c8005746） |
| **smoke** | `/budget-trim` 200 · `/` `hub-ia.js?v=77e1c8ce` `sg-is-filtered`+`pageshow` · CSS `sg-lock-row` |

---

## DEPLOY-20260720-005

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 提督 Commit&Push — 余白トリム（clipboard-trim）新規公開 · Hub 検索復帰強化 · watermark プレビュー · FAQ 文言 |
| **change_summary** | `clipboard-trim` 新規 · `hub-ia` userSearchActive · 検索辞書 · リレーリンク · `watermark` プレビュー · FAQ PNGコピー文言 |
| **local_build** | `pass`（`release:pages:free` · budget consume 55/450） |
| **deploy_count_today** | 5（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 55/450 |
| **gates** | P1–P6 · P7 override |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `11f35b82`（`2cfb167` · git push origin main · https://dash.cloudflare.com/adbc084a711933271252e34fab58a209/pages/view/sugudasu/11f35b82-e0a5-4c96-81fb-e6f5a425e16b） |
| **smoke** | `/` 200 · `/clipboard-trim` 200 · FAQ「PNGをコピーボタンを押したら」反映 · `/watermark` 200 · `/hub` 301 |

---

## DEPLOY-20260720-006

| 項目 | 値 |
|------|-----|
| **status** | `executed` |
| **target** | `core` |
| **reason** | 提督 Commit&Push — json-view / ai-cleaner 公開 · SNS スクリプト体 MATH_HOLES 再デプロイ（cache bust） |
| **change_summary** | `json-view` · `ai-cleaner` 新規 · 命名 AIコピペ整形 · SPEC · 検索辞書 · Hub/registry · SNS 筆記体穴埋めは既存 `unicode-math-alpha.js` を本番キャッシュ更新で反映 |
| **local_build** | `pass`（`release:pages:free` · budget consume 56/450） |
| **deploy_count_today** | 6（**P7 override** · 提督 Commit&Push） |
| **pages_build_budget_after** | 56/450 |
| **gates** | P1–P6 · P7 override |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | `bf5020c`（git push origin main · CF 自動ビルド） |
| **smoke** | `/` 200 · `/sns` 200 · `/json-view` 200 · `/ai-cleaner` 200 · Hub に JSON構造・AIコピペ整形 |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-20 | 006 executed（bf5020c · json-view · ai-cleaner · SNS MATH_HOLES 再デプロイ） |
| 2026-07-20 | 006 approved（json-view · ai-cleaner · SNS MATH_HOLES 再デプロイ · P7 override · 提督 Commit&Push） |
| 2026-07-20 | 005 executed（2cfb167 · 11f35b82 · clipboard-trim 公開 · Hub 検索復帰 · FAQ 文言） |
| 2026-07-20 | 005 approved（clipboard-trim 公開 · Hub 検索復帰 · watermark · P7 override · 提督 Commit&Push） |
| 2026-07-20 | 004 executed（579f81d · 6deff099 · budget-trim UI · Hub catalog restore） |
| 2026-07-20 | 004 approved（budget-trim ロックUI · Hub 全件復帰 · P7 override · 提督 Commit&Push） |
| 2026-07-20 | 003 executed（d46c208 · e2bfb40e · 検索 Phase1 · hiddenKeywords） |
| 2026-07-20 | 003 approved（検索 Phase1 · hiddenKeywords · P7 override · 提督本番反映） |
| 2026-07-20 | 002 executed（7505f01 · 302e41d2 · cache bust · 検索3層 · ADR/Design） |
| 2026-07-20 | 002 approved（cache bust · 検索3層 · ADR/Design · P7 override · 提督本番反映） |
| 2026-07-20 | 002 planned（watermark engine cache bust 事故 · 再発禁止台帳 · build-pages 全 engine バスト） |
| 2026-07-20 | 001 executed（db205b7 · Hub IA Phase2 · カード文言 · `#hash` rewrite · budget-trim 他） |
| 2026-07-20 | 001 approved（Hub IA Phase2 · カード文言 · budget-trim 他 · 提督 Commit&Push） |
| 2026-07-19 | 002 executed（7817638 · クリーンURL hotfix · P7 override） |
| 2026-07-19 | 002 approved（クリーンURL hotfix · P7 override · 提督 Commit&Push） |
| 2026-07-19 | 001 executed（26ec789 · Hub IA Phase 1） |
| 2026-07-19 | 001 approved（Hub IA Phase 1 · 提督 Commit&Push） |
| 2026-07-18 | 011 executed（737332a · 相対リンク罠修正 · P7 override） |
| 2026-07-18 | 011 approved（相対リンク罠修正 · P7 override · 提督 Commit&Push） |
| 2026-07-18 | 010 executed（25b62e2 · 見積名著 · Diff FAQ · P7 override） |
| 2026-07-18 | 010 approved（見積ガイド名著 · Diff FAQ · P7 override · 提督 Commit&Push） |
| 2026-07-18 | 009 executed（3cb6813 · 見積ガイド · 開発以外 · FAQ · P7 override） |
| 2026-07-18 | 009 approved（見積ガイド · 開発以外 · FAQ · P7 override · 提督 Commit&Push） |
| 2026-07-18 | 008 executed（53cad7e · Reveal結果表示バグ · P7 override） |
| 2026-07-18 | 007 executed（f4fea1d · planning-poker 投影UX · P7 override） |
| 2026-07-18 | 006 executed（slot-board FV · FAQ · P7 override · 提督 Commit&Push） |
| 2026-07-18 | 005 executed（66cc1ef · Playbook §1.5 MECE · P7 override · local release skip） |
| 2026-07-18 | 005 approved（Playbook §1.5 MECE · P7 override） |
| 2026-07-18 | 004 executed（4e678b0 · slot-board α · hub · P7 override） |
| 2026-07-18 | 004 approved（slot-board α · hub · P7 override · 提督 Commit&Push） |
| 2026-07-18 | 003 executed（22e1f0f · pdf-images 範囲選択 · FAQ · P7 override） |
| 2026-07-18 | 003 approved（pdf-images 範囲選択 · FAQ · P7 override · 提督 Commit&Push） |
| 2026-07-18 | 002 executed（dd14049 · watermark · pdf-images · hub リンク · ガイド表/リード · P7 override） |
| 2026-07-18 | 002 approved（watermark · pdf-images · hub リンク · ガイド表/リード · P7 override） |
| 2026-07-18 | 001 executed（c290f81 · 非送信主張是正 · privacy-badge · telemetry 開示） |
| 2026-07-18 | 001 approved（非送信主張是正 · privacy-badge · telemetry 開示 · 004 統合） |
| 2026-07-17 | 004 aborted（statements productName hotfix · 20260718-001 に統合） |
| 2026-07-17 | 004 approved（statements productName hotfix · P7 override） |
| 2026-07-17 | 003 executed（3c506b5 · statements MECE · video-frame） |
| 2026-07-17 | 003 approved（statements MECE · video-frame · P7 override · 提督 Commit&Push） |
| 2026-07-17 | 002 executed（8f9aaf9 · search-query UI 磨き） |
| 2026-07-17 | 002 approved（search-query UI 磨き · P7 override · 提督 Commit&Push） |
| 2026-07-17 | 001 executed（d8f9e91 · search-query · match-board 定員） |
| 2026-07-17 | 001 approved（search-query · match-board 定員 · roadmap · 提督 Commit&Push） |
| 2026-07-16 | 003 executed（8274572 · invoice 対象外税率バグ） |
| 2026-07-16 | 003 approved（invoice 対象外税率バグ · No.6359 FAQ） |
| 2026-07-16 | 002 executed（c1f10da · ユーザー向け slug 口調除去） |
| 2026-07-16 | 002 approved（ユーザー向け slug 口調除去 · Commit&Push） |
| 2026-07-16 | 001 executed（0776420 · guides 加筆 · /guides 幅） |
| 2026-07-15 | 005 executed（5984fbb · AdSense guides · contact · P7 override） |
| 2026-07-15 | 004 executed（3c149b5 · 見積会議 FAQ/updates · 司会代行 · P7 override） |
| 2026-07-15 | 003 executed（99c2124 · roadmap 文字注釈検討中 · image-trim 対象外 · P7 override） |
| 2026-07-15 | 002 executed（f4a3b11 · Skitch 本家矢印 · 枠白フチ縮小 · P7 override） |
| 2026-07-15 | 001 executed（57ed661 · core · mask Skitch 型注釈） |
| 2026-07-10 | 001 executed（262c38c · core SEO · FAQ · 時給計算）· 002 executed（f1711774 · sync sticky-room） |
| 2026-07-10 | 001 approved（core · SEO · FAQ · 時給計算）· 002 approved（sync · sticky-room） |
| 2026-07-09 | 002 executed（7d547d0 · FAQ 白背景 · shift/label 設定パネル · qr-reader FAQ） |
| 2026-07-09 | 001 executed（d781dd4 · match-board · 見積会議 · time-calc · statements） |
| 2026-07-09 | 001 approved（match-board · 見積会議 · time-calc · Sync仕様移管 · 提督 push 依頼） |
| 2026-07-04 | 001 executed（33474f2 · table-conv · invoice 源泉 · normalize · fair-draw CSV） |
| 2026-07-04 | 001 approved（table-conv · invoice 源泉 · normalize · fair-draw CSV · roadmap 対象外 · 提督 push 依頼） |
| 2026-07-03 | 016 executed（5cff6f3 · roadmap · 対ナビ · 透明性粒度） |
| 2026-07-03 | 016 approved（roadmap · 対ナビ · 透明性粒度 · 提督 push 依頼） |
| 2026-07-03 | 015 approved（リード2段デッキ · ガイド表 · 提督 push 依頼） |
| 2026-07-03 | 014 executed（ea571fc · Core UI Refresh · PAGE_LAYOUT_SELECTOR） |
| 2026-07-03 | 014 approved（Core UI Refresh · ガイド記事 · PAGE_LAYOUT_SELECTOR · 提督 push 依頼） |
| 2026-07-03 | 013 executed（67ab4c7 · link-qr cache bust · normalize segment 3×2） |
| 2026-07-03 | 013 approved（link-qr cache bust hotfix · normalize segment 3×2） |
| 2026-07-03 | 012 approved（link-qr イベント連絡 · normalize sql_in · 企画docs） |
| 2026-07-03 | 011 executed（2238cba · link-qr α） |
| 2026-07-03 | 011 approved（link-qr α · サーバー非保存リンク集QR） |
| 2026-07-03 | 009 executed（17a6811 · Prior Art §9 多言語探索） |
| 2026-07-03 | 009 approved（Prior Art §9 · 多言語探索フロー） |
| 2026-07-03 | 008 executed（c84ba5f · mask オーバーレイ確定 · ぼかし/同色塗り） |
| 2026-07-03 | 008 approved（mask オーバーレイ確定 · ぼかし/同色塗り） |
| 2026-07-03 | 007 executed（e27c171 · mask 同期化+cache bust） |
| 2026-07-03 | 007 approved（mask 黒塗り再発 hotfix · 同期化+cache bust） |
| 2026-07-03 | 006 approved（mask 黒塗り未適用 hotfix · 提督報告） |
| 2026-07-03 | 005 approved（test-data スライダー hotfix · 提督依頼） |
| 2026-07-03 | 004 approved（AdSense 自動広告 · test-data スライダー/TXN · 提督 push 依頼） |
| 2026-07-03 | 003 approved（test-data 件数UI · §6.8 閉域FAQ · 提督 push 依頼） |
| 2026-07-03 | 002 approved（test-data FAQ 閉域・競合比較 · 提督 push 依頼） |
| 2026-07-03 | 001 executed（50145d3 · test-data v0.5 · multi-ai docs） |
| 2026-07-03 | 001 approved（test-data v0.5 · multi-ai docs · 提督 push 依頼） |
| 2026-07-02 | 004 approved（test-data α v0.4.3 · 提督 push 依頼） |
| 2026-07-02 | 003 executed（mask α · Zenn ネタ） |
| 2026-07-02 | 003 approved（SUGUDASU マスク α · Zenn ネタ · 提督 push 依頼） |
| 2026-07-02 | 002 executed（334b810 · DEV_GIT_AGENT_DELEGATION docs） |
| 2026-07-02 | 002 approved（DEV_GIT_AGENT_DELEGATION · 提督 push 依頼） |
| 2026-07-02 | 001 executed（51b2d69 · statements 7原則アイコン · crop skill） |
| 2026-07-02 | 001 approved（statements 7原則アイコン · crop skill · 提督 push 依頼） |
| 2026-07-01 | 003 executed（53fb792 · normalize 確認パネル） |
| 2026-07-01 | 003 approved（normalize 確認パネル · 提督 push 依頼） |
| 2026-07-01 | 002 executed（60a55ea · normalize Tier S LP · Zenn #12） |
| 2026-07-01 | 002 approved（normalize Tier S LP · Zenn #12 · 提督 push 依頼） |
| 2026-07-01 | 001 executed（affeee6 · normalize 命名 · Zenn docs） |
| 2026-06-26 | 初版（asl-dashboard DEPLOY_LOG を雛形 · CF Pages Free · core/sync 分離） |
| 2026-06-26 | 002 executed（7858bf8）· 004 追加（LP RUNBOOK · b0bb674） |
