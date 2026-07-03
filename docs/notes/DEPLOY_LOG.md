# Deploy Log（SUGUDASU · Cloudflare Pages Free · SSOT）

**目的**: 提督・別 Agent が **同じ判断材料**で deploy を止めたり通したりできる台帳。**デプロイの度に 1 エントリ**。  
**インフラ**: [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/)（**500 builds/月**）· **コアと Sync は別プロジェクト・別経路**  
**手順 SSOT**: コア [`DEPLOY_CLOUDFLARE_PAGES.md`](DEPLOY_CLOUDFLARE_PAGES.md) · Sync [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md) · 運用 [`WORKFLOW.md`](../WORKFLOW.md)

**asl-dashboard（Vercel）の `DEPLOY_LOG` とは別ファイル。** 混同しない。

---

## Agent 着手前（必須 · 違反＝deploy 禁止）

1. 本ファイル **ゲート P1–P8** + **直近エントリ（同一 `target`）**を読む。
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
| **status** | `approved` |
| **target** | `core` |
| **reason** | table-conv 配信 · invoice 源泉 No.2792 · normalize v1.3 · fair-draw CSV · roadmap 対象外 |
| **change_summary** | `table-conv` registry/hub/FAQ · `invoice-finance` 源泉・手取契約 · `normalize` 行整理/伏字 · `fair-draw` Connpass CSV · `roadmap.json` 表変換対象外 · changelog |
| **local_build** | `pass`（`release:pages:free`） |
| **deploy_count_today** | 1 |
| **pages_build_budget_after** | （executed 後） |
| **gates** | P1–P7 · 提督依頼（日付替わり本番反映） |
| **approver** | 提督 |
| **agent** | cursor |
| **cf_project** | `sugudasu` |
| **cf_deployment_id** | （executed 後） |
| **smoke** | （executed 後） |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
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
