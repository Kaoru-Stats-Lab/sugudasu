# SUGUDASU（すぐだす）

単一ドメイン・1ファイル完結の無料ビジネスツール8本＋法務ページ3本。ブラウザ内だけで完結し、入力データは外部に送信しません。

`asl-dashboard` とは別フォルダ／別デプロイを想定しています。

## クイックスタート

```powershell
cd tools
python -m http.server 8080
```

ブラウザで `http://localhost:8080/hub.html` を開く（`assets/` は `../assets/` 参照のため、`tools/` をドキュメントルートにしてください）。

<!-- AUTO:TOOLS_START -->

## ツール一覧（`tools/`）

> この一覧は `data/tool-registry.json` を正本として自動同期しています。
> 更新コマンド: `npm run sync:readme-tools`（検証のみ: `npm run validate:readme-tools`）

### 1) 実務ツール（ユーザー向け本体）

| ファイル | URL | 名称 | ナビ | stage |
|---|---|---|---|---|
| [invoice.html](tools/invoice.html) | /invoice | SUGUDASU 請求書 | 請求書 | beta |
| [stamp.html](tools/stamp.html) | /stamp | SUGUDASU 電子印鑑 | 印鑑 | beta |
| [receipt.html](tools/receipt.html) | /receipt | SUGUDASU 領収書 | 領収書 | gamma |
| [label.html](tools/label.html) | /label | SUGUDASU ラベル | ラベル | gamma |
| [shift.html](tools/shift.html) | /shift | SUGUDASU シフト | シフト | beta |
| [report.html](tools/report.html) | /report | SUGUDASU 議事録 | 議事録 | gamma |
| [reverse.html](tools/reverse.html) | /reverse | SUGUDASU 逆引き | 逆引き | gamma |
| [normalize.html](tools/normalize.html) | /normalize | SUGUDASU 全角半角整え | 全角半角 | beta |
| [table-conv.html](tools/table-conv.html) | /table-conv | SUGUDASU 表変換 | 表変換 | beta |
| [webp-to-jpg.html](tools/webp-to-jpg.html) | /webp-to-jpg | SUGUDASU WebP変換 | WebP→JPG | beta |
| [mask.html](tools/mask.html) | /mask | SUGUDASU マスク | マスク | alpha |
| [image-trim.html](tools/image-trim.html) | /image-trim | SUGUDASU 画像トリム | 画像トリム | alpha |
| [test-data.html](tools/test-data.html) | /test-data | SUGUDASU テストデータ | テストデータ | alpha |
| [group-split.html](tools/group-split.html) | /group-split | SUGUDASU 班分け | 班分け | beta |
| [match-board.html](tools/match-board.html) | /match-board | SUGUDASU ドラフト会議 | ドラフト | alpha |
| [planning-poker.html](tools/planning-poker.html) | /planning-poker | SUGUDASU 見積会議 | 見積会議 | alpha |
| [timeline.html](tools/timeline.html) | /timeline | SUGUDASU イベント進行 | 進行 | alpha |
| [present.html](tools/present.html) | /present | SUGUDASU ギフト | ギフト | gamma |
| [fair-draw.html](tools/fair-draw.html) | /fair-draw | SUGUDASU 抽選 | 抽選 | beta |
| [warikan.html](tools/warikan.html) | /warikan | SUGUDASU 割り勘 | 割り勘 | gamma |
| [sns.html](tools/sns.html) | /sns | SUGUDASU SNS | SNS | gamma |
| [link-qr.html](tools/link-qr.html) | /link-qr | SUGUDASU リンク集QR | リンクQR | alpha |
| [qr-reader.html](tools/qr-reader.html) | /qr-reader | SUGUDASU QR読取 | QR読取 | alpha |
| [diff.html](tools/diff.html) | /diff | SUGUDASU 差分チェック | 差分 | alpha |
| [time-calc.html](tools/time-calc.html) | /time-calc | SUGUDASU 時給計算 | 時給計算 | alpha |

### 2) 補助・案内ページ

| ファイル | URL | 名称 | stage |
|---|---|---|---|
| [hub.html](tools/hub.html) | / | ツール一覧 | gamma |
| [font-converter.html](tools/font-converter.html) | /font-converter | SUGUDASU フォント変換 | gamma |
| [not-a-car.html](tools/not-a-car.html) | /not-a-car | 車ではなく書類 | stable |
| [roadmap.html](tools/roadmap.html) | /roadmap | 開発ロードマップ | gamma |
| [statements.html](tools/statements.html) | /statements | SUGUDASU の約束 | gamma |
| [updates.html](tools/updates.html) | /updates | 更新履歴 | gamma |

### 3) 法務ページ

| ファイル | URL | 名称 | stage |
|---|---|---|---|
| [disclaimer.html](tools/disclaimer.html) | /disclaimer | 免責事項 | stable |
| [privacy.html](tools/privacy.html) | /privacy | プライバシーポリシー | stable |
| [terms.html](tools/terms.html) | /terms | 利用規約 | stable |

### 4) 内部ページ（非公開運用）

| ファイル | URL | 名称 | stage |
|---|---|---|---|
| [brand-logo-preview.html](tools/brand-logo-preview.html) | /brand-logo-preview | ロゴタイプ比較 | alpha |

<!-- AUTO:TOOLS_END -->

請求書の機能正本: [invoice-pdf-generator](https://github.com/Kaoru-Stats-Lab/invoice-pdf-generator)

## 共通アセット

| パス | 内容 |
|------|------|
| [assets/sugudasu.css](assets/sugudasu.css) | デザイントークン・印刷用 `@media print` |
| [assets/sugudasu-shell.js](assets/sugudasu-shell.js) | 共通ヘッダー・9本ナビ・フッター |

各 HTML は次を読み込みます。

```html
<link rel="stylesheet" href="../assets/sugudasu.css">
<script src="../assets/sugudasu-shell.js"></script>
```

`#sg-chrome-top` に `data-sg-title`（必須）· `data-sg-print` · `data-sg-landscape` を付与。詳細は `docs/notes/CHROME_HEADER_GUARDRAILS.md`。

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/DESIGN_GUIDELINE.md](docs/DESIGN_GUIDELINE.md) | トンマナ・印刷・コンポーネント規約（実装の正本） |
| [docs/PRODUCT_UX_AUDIT.md](docs/PRODUCT_UX_AUDIT.md) | **PdM/UX 監査（STEP1〜5・チェックリスト）** |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | 運用コマンド早見表（何をする時に何を実行するか） |
| [docs/notes/DEPLOY_CLOUDFLARE_PAGES.md](docs/notes/DEPLOY_CLOUDFLARE_PAGES.md) | **本番デプロイ SSOT（Agent 必須 · CF Pages · トラブル表）** |
| [docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md](docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md) | **景品チェック＋公平抽選（未実装 · 別Agent引き継ぎSSOT）** |
| [docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md](docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) | **アイディア20+10 評価台帳・GO/HOLD/OUT ジャッジ基準** |
| [docs/prompts/](docs/prompts/) | 各ツールの要件プロンプト履歴（HTML には埋め込まない） |

## デプロイ（Cloudflare Pages）

**Agent 正本:** [docs/notes/DEPLOY_CLOUDFLARE_PAGES.md](docs/notes/DEPLOY_CLOUDFLARE_PAGES.md)

### ビルド

```powershell
cd C:\asl_dev\sugudasu
npm run build:pages
```

出力: `dist/`（`index.html` = ポータル、`/assets/sugudasu.css` 絶対パス）

`build:pages` には Cloudflare Pages Free 枠のガードを組み込み済みです。上限を超えるとビルドが失敗します。

- ファイル総数: 20,000 以下
- 単体ファイルサイズ: 25 MiB 以下
- `_headers`: ルール数 / ヘッダー値長
- `_redirects`: static / dynamic / total ルール数

単体実行:

```powershell
npm run guard:pages-free
```

### 無料枠を踏み抜かない運用ゲート（必須化用）

Cloudflare Free の「500 builds / month」を運用で超えないため、ローカル台帳ゲートを追加しています。

```powershell
# 本番リリース前にこれだけ実行（静的上限チェック + 月次ビルド予算消費）
npm run release:pages:free
```

- 台帳: `.ops/cloudflare-pages-build-budget.json`
- 既定ソフト上限: `450`（環境変数 `PAGES_MONTHLY_BUILD_BUDGET` で変更可）
- 現在値確認: `npm run guard:pages-budget:show`

ローカル確認:

```powershell
cd dist
python -m http.server 8080
```

→ `http://localhost:8080/` または `http://localhost:8080/hub.html`

### Cloudflare Pages 設定

| 項目 | 値 |
|------|-----|
| ビルドコマンド | `npm run build:pages` |
| ビルド出力ディレクトリ | `dist` |
| Node バージョン | 20 以上（環境変数 `NODE_VERSION=20`） |

- 本番 URL: **https://sugudasu.com/**（2026-06-17 確認済）
- 暫定: `https://sugudasu.pages.dev/`
- **Framework preset**: None（静的サイト）
- Git 連携時は `sugudasu` リポジトリルートをプロジェクトルートに

開発用（ビルドなし）: `cd tools && python -m http.server 8080` → `hub.html`（`../assets/` 相対パス）

## 開発メモ

- Tailwind CSS v4（`@tailwindcss/browser@4`）を CDN 利用
- プロンプト長文コメントは HTML から除去済み → `docs/prompts/*.md` を参照
- 一括ガイドライン適用スクリプト: `node scripts/apply-design-guideline.mjs`（任意）

## ライセンス・収益

- AdSense・Amazon アソシエイト枠はプレースホルダー
- 各ツールのビジネスロジックは単一 HTML 内の JavaScript
