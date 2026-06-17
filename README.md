# SUGUDASU（すぐだす）

単一ドメイン・1ファイル完結の無料ビジネスツール8本＋法務ページ3本。ブラウザ内だけで完結し、入力データは外部に送信しません。

`asl-dashboard` とは別フォルダ／別デプロイを想定しています。

## クイックスタート

```powershell
cd tools
python -m http.server 8080
```

ブラウザで `http://localhost:8080/hub.html` を開く（`assets/` は `../assets/` 参照のため、`tools/` をドキュメントルートにしてください）。

## ツール一覧（`tools/`）

| ファイル | 名称 | 印刷 |
|----------|------|------|
| [hub.html](tools/hub.html) | ポータル（全ツール入口） | — |
| [invoice.html](tools/invoice.html) | 見積・納品・請求書（インボイス） | PDF |
| [present.html](tools/present.html) | ギフトサジェスター（地雷回避） | — |
| [label.html](tools/label.html) | 宛名ラベル・サンキューカード | PDF |
| [shift.html](tools/shift.html) | 2ヶ月シフト表 | A4横 |
| [report.html](tools/report.html) | 議事録・報告書穴埋め | — |
| [reverse.html](tools/reverse.html) | 逆引き辞典 | — |
| [warikan.html](tools/warikan.html) | 傾斜割り勘 | — |
| [sns.html](tools/sns.html) | SNSデコ文字・縦書き | — |
| [privacy.html](tools/privacy.html) | プライバシーポリシー | — |
| [terms.html](tools/terms.html) | 利用規約 | — |
| [disclaimer.html](tools/disclaimer.html) | 免責事項 | — |

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
<script>SUGUDASU_SHELL.mount({ title: 'ページ名', print: true/false });</script>
```

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/DESIGN_GUIDELINE.md](docs/DESIGN_GUIDELINE.md) | トンマナ・印刷・コンポーネント規約（実装の正本） |
| [docs/PRODUCT_UX_AUDIT.md](docs/PRODUCT_UX_AUDIT.md) | **PdM/UX 監査（STEP1〜5・チェックリスト）** |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | 運用コマンド早見表（何をする時に何を実行するか） |
| [docs/prompts/](docs/prompts/) | 各ツールの要件プロンプト履歴（HTML には埋め込まない） |

## デプロイ（Cloudflare Pages 推奨）

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
