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

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-01 | 005 executed（affeee6 · normalize 命名 · Zenn docs） |
| 2026-06-26 | 初版（asl-dashboard DEPLOY_LOG を雛形 · CF Pages Free · core/sync 分離） |
| 2026-06-26 | 002 executed（7858bf8）· 004 追加（LP RUNBOOK · b0bb674） |
