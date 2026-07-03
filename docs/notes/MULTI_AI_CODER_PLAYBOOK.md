# SUGUDASU — マルチAIリファクタ · コーディング担当 Playbook

**更新:** 2026-07-03  
**リポジトリ:** `C:\asl_dev\sugudasu`（asl-dashboard ではない）  
**読者:** Cursor（実装担当）· 提督（非エンジニア）· Gemini（PM）· GLM（監査・設計図）  
**位置づけ:** 3AI分業の **実装・レビュー・テストの正本**。Gemini/GLM は本書の形式に合わせて成果物を出す。

---

## 0. 3役の境界（再掲）

| 役 | やる | やらない |
|----|------|----------|
| **Gemini（PM）** | 不変条件チェックリスト（INV）· ユーザー向け説明 · GLM への依頼文 | ファイル書き換え |
| **GLM（監査）** | 既存コードレビュー · 安全な修正設計図 · Cursor 実装パケット | ファイル書き換え · 設計図にない改善 |
| **Cursor（コーダー）** | 設計図の再現 · ゲート実行 · BLOCKED 報告 | ついでリファクタ · スコープ外変更 · 推測での穴埋め |

**鉄則:** 設計図と不変条件の **両方** が揃うまで実装を開始しない。

---

## 1. 用語

| 用語 | 意味 |
|------|------|
| **INV** | Invariant。壊したらアウトな挙動。`INV-{tool}-{nn}` で採番 |
| **実装パケット** | GLM が Cursor に渡す 1 タスク分の設計図（テンプレ: `docs/templates/multi-ai/IMPLEMENTATION_PACKET.example.md`） |
| **ゲート** | `npm run …` で機械判定する品質関所（exit 0 必須） |
| **BLOCKED** | パッチ不整合・解釈二通り・テスト不足などで **実装中止** し報告すること |
| **パイロット帯** | 自動テストが厚いツール。リファクタ試行の最初の対象 |

---

## 2. SUGUDASU 固有の前提

### 2.1 アーキテクチャ

- **静的サイト**（Cloudflare Pages）。core = `sugudasu.com` · sync = `sync.sugudasu.com`
- ツールは `tools/{id}.html` + `assets/{id}*.js` が基本
- 命名 3 層の SSOT は `data/tool-registry.json`（手順: `TOOL_NAMING_AGENT_PLAYBOOK.md`）
- 横断 UX 事故防止: `SUGUDASU_OOPS_GUARDRAILS.md`（行数一致 · コピーゲート · 非送信）

### 2.2 触ってはいけない暗黙ルール

| ルール | 根拠 |
|--------|------|
| `dist/` · `dist-sync/` を Git に含めない | deploy ルール |
| 本番 push / sync deploy 前に `DEPLOY_LOG.md` | `DEPLOY_CLOUDFLARE_PAGES.md` |
| ツール改名・新規は registry → HTML → hub → shell の順 | `sugudasu-tool-naming.mdc` |
| Schedule / Sync UI は ADAPT 色のみ（Notion HEX 直書き禁止） | `sugudasu-design-schedule.mdc` |
| `machine-dashboard` へ push しない | `DEV_GIT_AGENT_DELEGATION.md` |

---

## 3. コードレビュー仕様（Cursor が設計図を受け取ったら）

GLM の設計図を **実装前** に、次の観点で自己レビューする。1 項目でも FAIL なら BLOCKED。

### 3.1 スコープ整合（必須）

- [ ] **変更許可ファイル** がフルパスで列挙されている
- [ ] 列挙外ファイルを触る必要がない
- [ ] 1 タスク = **最大 1〜2 ファイル**（50 行目安。超える場合はタスク分割を GLM に依頼）
- [ ] 設計図に **禁止事項**（リネーム · 共通化 · 依存追加 · 無関係フォーマット）が明記されている

### 3.2 パッチ適用可能性（必須）

- [ ] 各変更に **関数名または一意な前後コンテキスト** がある（行番号のみは不可）
- [ ] 現行 `main` の該当箇所と **文字列一致** を Cursor が確認済み
- [ ] import / export の呼び出し元が設計図に含まれるか、影響なしと明記されている
- [ ] HTML + engine + app + registry + test の **セット更新** が必要な場合、すべて列挙されている

### 3.3 挙動・非機能（必須）

- [ ] 各 INV に **確認方法**（コマンド or 手順）と **期待結果** がある
- [ ] シード再現が必要なツールで、固定シード・期待 CSV/出力が fixtures にある
- [ ] ブラウザ内完結（非送信）を壊す変更でない
- [ ] `SUGUDASU_OOPS_GUARDRAILS` の該当事例（行ズレ · 変質 · コピー先祖返り）に触れない

### 3.4 リポジトリゲート（変更種別に応じて）

| 変更種別 | 必須ゲート |
|----------|------------|
| 任意の JS ロジック | 当該 `npm run test:*` |
| ツール HTML / registry / shell | `npm run validate:tool-naming` |
| 新規・変更ページ OGP | `npm run validate:ogp` |
| ビルド成果物に影響 | `npm run build:pages` |
| core 本番 push 前 | `npm run release:pages:free` |
| sync deploy 前 | `npm run release:pages:sync` + `deploy:pages:sync` |

### 3.5 実装中の禁止（Cursor 自己規律）

- 設計図にないリネーム・抽出・共通化
- 「ついでに」触る別ツール
- テスト失敗時の **期待値の無断変更**（INV が古い可能性 → BLOCKED）
- パッチが当たらないときの推測実装

### 3.6 実装後レビュー（コミット前）

- [ ] `git diff` が設計図のファイル・範囲のみ
- [ ] 全 INV を順に実行し、結果をログ付きで報告
- [ ] 該当ゲートをすべて exit 0
- [ ] 提督向けに **1 行サマリ**（何を変えずに何を変えたか）

---

## 4. テスト仕様（階層）

安全性は **下の層が通らないと上に進まない**。

```
L0 パッチ整合（設計図 ↔ 現行コード）
L1 ツール単体テスト（npm run test:*）
L2 リポジトリ検証（validate:*）
L3 ビルド（build:pages）
L4 ローカルスモーク（preview + ブラウザ）
L5 本番ゲート（release:pages:* · DEPLOY_LOG）
L6 提督手動スモーク（チェックリスト）
```

### 4.1 L1 — ツール単体テスト

**実行:** `npm run test:all`（全エンジン）または個別 `npm run test:{name}`  
**実装:** `scripts/{name}.test.mjs` · Node `assert` · エンジンを import  
**合格:** exit 0 · 既存ケースを削除しない（追加のみ可）

| npm script | 対象エンジン | ツール id | パイロット |
|------------|--------------|-----------|------------|
| `test:test-data` | `assets/test-data-engine.js` | `test-data` | **◎ 最優先** |
| `test:group-split` | `assets/group-split.js` 等 | `group-split` | ◎ |
| `test:normalize` | `assets/text-normalize.js` | `normalize` | ○ |
| `test:mask` | `assets/mask-engine.js` | `mask` | ○ |
| `test:timeline` | `assets/timeline-engine.js` | `timeline` | ○ |
| `test:prize-law` | 景品表示法 eval | `fair-draw` | ○ |
| `test:webp-to-jpg` | 変換ロジック | `webp-to-jpg` | ○ |
| `test:linkify` | `assets/sg-linkify.js` | 共有 | ○ |

**テストなし（2026-07-03 時点）:** `invoice` · `stamp` · `receipt` · `label` · `shift` · `report` · `reverse` · `present` · `warikan` · `sns` 等  
→ リファクタ前に **INV を手動チェックリスト化** するか、最小テストを別タスクで追加。

### 4.2 L1 拡張 — ゴールデンファイル（test-data 標準）

`test-data` では次を維持する。

| 種別 | パス | 用途 |
|------|------|------|
| レビュー用 CSV | `docs/fixtures/test-data-review/*.csv` | 3AI レビュー · 回帰比較 |
| マニフェスト | `docs/fixtures/test-data-review/manifest.json` | seed · count · mineRate |
| 再生成 | `node scripts/export-test-data-review-fixtures.mjs` | fixtures 更新（**INV 変更時は GLM 承認後**） |

**典型 INV（test-data）:**

| ID | 内容 | 確認 |
|----|------|------|
| INV-TD-01 | seed=42 · employee100 · mine0 で CSV 再現 | `npm run test:test-data` |
| INV-TD-02 | 地雷 RNG 分離（mine0 vs mine5 は 3 行のみ差分） | 同上 |
| INV-TD-03 | 郵便番号クォート ON で先頭ゼロ維持 | 同上 |
| INV-TD-04 | ブラウザ非送信（fetch なし） | 手動 / コード grep |

### 4.3 L2 — リポジトリ検証

```bash
npm run validate:tool-naming   # registry ↔ HTML ↔ hub ↔ shell
npm run validate:ogp           # OGP 必須タグ
npm run validate:readme-tools  # README ツール表（触った場合）
```

### 4.4 L3 — ビルド

```bash
npm run build:pages            # core dist
# sync 系を触った場合
npm run build:pages:sync
```

### 4.5 L4 — ローカルスモーク

```bash
npm run preview:pages          # http://localhost:8080
# 対象: https://localhost:8080/{tool-id} （拡張子なし）
```

確認: 白ヘッダー表示 · 共通ナビ · 対象ツールの主操作 1 回

### 4.6 L5 — 本番ゲート（提督が push/deploy を依頼したときのみ）

```bash
# DEPLOY_LOG に status: approved を追記してから
npm run release:pages:free     # core
npm run release:pages:sync     # sync（wrangler は別）
```

### 4.7 L6 — 提督手動スモーク

ツール SSOT または `GROUP_SPLIT_AGENT_HANDOFF.md` 形式のチェックリストを INV に紐づける。  
**自動化できない項目は「手動 INV」として明記**し、リファクタタスクでは触らないか、別タスクにする。

---

## 5. 変更種別 → 最小ゲートセット

実装パケットの **変更種別** に応じて、Cursor は次を **最低限** 実行する。

| 種別 | 例 | 最小ゲート |
|------|-----|------------|
| **A** エンジンのみ | `test-data-engine.js` | `test:{tool}` |
| **B** エンジン + UI | engine + app.js | `test:{tool}` + L4 スモーク |
| **C** ツールページ HTML | `tools/*.html` | A/B + `validate:tool-naming` + `validate:ogp` + `build:pages` |
| **D** registry / nav | `tool-registry.json` | `validate:tool-naming` + `build:pages` |
| **E** 共有 shell/css | `sugudasu-shell.js` · `sugudasu.css` | `test:all` + `build:pages` + **全ツール L4 簡易** |
| **F** デプロイ設定 | wrangler · workflow | `release:pages:*` + DEPLOY_LOG |

---

## 6. 実装タスクの標準手順（Cursor）

1. **受領:** 実装パケット + INV チェックリスト（Gemini）
2. **事前:** `git status` クリーン · `git pull` 済み
3. **レビュー:** §3 の自己レビュー → FAIL なら BLOCKED 報告
4. **実装:** 許可ファイルのみ · 設計図どおり
5. **検証:** 変更種別の最小ゲート（§5）+ 全 INV
6. **報告:** 下記フォーマットで提督へ
7. **コミット:** 提督が明示依頼したときのみ · 1 タスク 1 コミット

### 6.1 完了報告フォーマット

```markdown
## 実装完了 — {タスクID}

- **設計図:** {GLM パケット ID}
- **変更ファイル:** {列挙}
- **INV:** {ID} → {pass/fail + 証跡1行}
- **ゲート:** {実行コマンド} → exit 0
- **スコープ外変更:** なし
- **BLOCKED 事項:** なし
```

### 6.2 BLOCKED 報告フォーマット

```markdown
## BLOCKED — {タスクID}

- **理由:** {パッチ不一致 / 呼び出し元未定 / INV 検証不能 / 解釈二通り}
- **設計図の該当箇所:** {引用}
- **現行コード:** {ファイル:行または関数名}
- **選択肢 A:** {安全側・推奨}
- **選択肢 B:** {あれば}
- **実装した変更:** なし（またはロールバック済み）
```

---

## 7. パイロット計画（推奨順）

| 順 | 対象 | 理由 |
|----|------|------|
| 1 | `test-data` | `test:test-data` + fixtures + 3AI レビュー基盤が揃っている |
| 2 | `group-split` | テスト厚め · HANDOFF 手順あり |
| 3 | `normalize` | OOPS ガードレールの中心 · `test:normalize` |
| 4 | `mask` · `timeline` | alpha だがエンジン分離済み |
| 5 | テストなしツール | **リファクタではなくテスト追加タスクを先に** |

**1 タスクの初期サイズ:** 1 関数の抽出 · 1 定数の移動 · 1 ファイル内の重複削除 など **挙動不変** のみ。

---

## 8. 関連テンプレート・専用プロンプト

| ファイル | 作成者 | 用途 |
|----------|--------|------|
| `docs/templates/multi-ai/INVARIANT_CHECKLIST.example.md` | Gemini | 壊してはいけないこと（空欄例） |
| `docs/templates/multi-ai/IMPLEMENTATION_PACKET.example.md` | GLM | Cursor への設計図（空欄例） |
| `docs/prompts/multi-ai-refactor-gemini-COPYPASTE.txt` | 提督→Gemini | **専用プロンプト（貼り付け用）** |
| `docs/prompts/multi-ai-refactor-glm-COPYPASTE.txt` | 提督→GLM | **専用プロンプト（貼り付け用）** |
| `docs/prompts/multi-ai-refactor-cursor-COPYPASTE.txt` | 提督→Cursor | **専用プロンプト（貼り付け用）** |
| `docs/prompts/multi-ai-refactor-RUNBOOK.md` | 提督 | 3段フロー手順書 |
| `.cursor/skills/sugudasu-multi-ai-code-review/SKILL.md` | Cursor | **「コードレビュー」時に上記をセットで案内** |

提督が「コードレビュー」「安全なリファクタ」と言ったら Agent は Skill `sugudasu-multi-ai-code-review` を適用し、§8 の4セット（コピペ用 · 手順書 · 最短手順 · 連携入口）を提示する。

---

## 10. 将来検討ログ（採用見送り含む）

| 日付 | トピック | 判断 | 正本 |
|------|----------|------|------|
| 2026-07-03 | **Antigravity ハイブリッド**（Claude Code 指揮 + `agy`/Gemini 実行） | SUGUDASU **採用しない**（量産フェーズでない）· **ASL なら大規模時に効く可能性** · Cursor では Plugin 非対応 | [`MULTI_AI_ANTIGRAVITY_HYBRID_LOG.md`](MULTI_AI_ANTIGRAVITY_HYBRID_LOG.md) |

---

## 11. 更新ルール

- 新ツールに `test:*` を追加したら **§4.1 表** を更新する
- `test:all` の構成変更は `package.json` と本書を同時更新
- パイロット完了後、次ツールの INV を Gemini と共同で追記
- 将来検討のマルチAI構成は **§10** に 1 行追記し、詳細は `docs/notes/MULTI_AI_*_LOG.md` へ
