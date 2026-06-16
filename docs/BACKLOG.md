# SUGUDASU 統合 Backlog（会話全量反映）

更新: 2026-06-16 21:10 JST  
対象: `C:\asl_dev\sugudasu`

---

## 0) スコープと前提

- 単一ドメイン・静的配信（Cloudflare Pages / GitHub Pages）
- 1ファイル完結 HTML ツール群（現在 9ファイル: hub + 8ツール）
- 入力データはブラウザ内処理（外部送信なし）
- 収益は **AdSense + Amazon アソシエイト** のハイブリッド

---

## 1) これまでの実施済み（Done）

### 1-1. 情報設計・共通基盤

- `tools/hub.html` 作成（全ツール入口）
- `assets/sugudasu-shell.js` 導入
  - 共通ヘッダー / 9本ナビ / フッター
  - `SUGUDASU_SHELL.mount({ title, print, landscape })`
- `assets/sugudasu.css` に共通化
  - デザイントークン
  - 共通 UI クラス (`sg-card`, `sg-input`, `ad-slot` など)
  - 共通印刷スタイル（A4縦 / 横、`no-print`, `print-target`）
- 各 `tools/*.html` で共通 shell と共通 CSS の読み込みを統一

### 1-2. UX/PdM STEP5 改善（全件）

- 監査正本: `docs/PRODUCT_UX_AUDIT.md`
- 完了済み
  - `reverse.html` 全面改善（平易文言・blue CTA・コピー導線等）
  - `report.html` 全面改善（2タブ・平易化・インラインエラー）
  - `present.html` amber/過装飾整理、CTA統一
  - `hub.html` SEO文言/カード順見直し
  - `warikan.html` 用語「階級」→「グループ」統一
  - `sns.html` 入力時自動変換 + コピー改善
  - `shift.html` オンボーディング1行 + 定休日UI不具合修正
  - `label.html` モード切替の補足文追加
  - `index.html` FAQ見出しの平易化

### 1-3. ドキュメント整備

- `docs/DESIGN_GUIDELINE.md` を正本化（共通化章を実装済みに更新）
- `README.md` 更新（Cloudflare Pages 手順含む）
- `docs/prompts/` にプロンプト履歴集約（HTML内長文コメントを分離）

### 1-4. Cloudflare Pages デプロイ準備

- `scripts/build-pages.mjs` 追加
  - `tools/*.html` + `assets/` を `dist/` へ出力
  - `../assets/` を `/assets/` に正規化
  - `dist/index.html` は `hub.html` をコピー
- `package.json` 追加
  - `npm run build:pages`
  - `npm run preview:pages`
- `.gitignore` 追加（`dist/`, `node_modules/`）
- ビルド実行確認済み（成功）

---

## 2) 収益戦略 Backlog（AdSense + Amazon 統合）

本会話で合意した方針を、実装可能な TODO に分解。

### 2-1. 戦略骨子（採用）

- **Layer A: Amazon**
  - 主戦場: `present.html`, 次点 `label.html`
  - 購買意図が高い文脈に限定配置（乱立しない）
- **Layer B: AdSense**
  - 全ツールに「作業の区切り」で配置
  - 誤タップ防止レイアウト（CTA と密着させない）
- **Layer C: 回遊**
  - 完了直後の「次に使うツール」導線
  - セッションPV増（ツール横断回遊）

### 2-2. AdSense 実装 TODO（更新）

- [x] 広告ポリシー固定
  - [x] `ad-slot` を本番 `<ins class="adsbygoogle">` に置換するためのクラス基盤（`ad-slot--result`）を追加
  - [x] CTA ボタンから最低 24px 以上離す（`margin-top: 1.5rem`）
  - [x] 入力フォーム上部への配置禁止（結果領域側へ集約）
- [ ] ページ別配置案（1st）
  - [x] `hub.html`: カード群下に 1枠
  - [ ] `index.html`: フォーム下 1枠 + FAQ前 1枠
  - [ ] `shift.html`: フォーム下 1枠（印刷対象外）
  - [x] `report.html` / `reverse.html`: 結果領域の下 1枠
  - [x] `present.html`: 提案カード群の末尾 1枠
  - [x] `sns.html` / `warikan.html` / `label.html`: 1枠まで（`sns` / `warikan` は配置済み、`label` は未配置）
- [ ] 計測項目（最低限）
  - [ ] ページごとの表示回数
  - [ ] スクロール到達率（広告位置検証用）
  - [ ] 直帰率・回遊率（hub 経由効果）

### 2-3. Amazon 実装 TODO（未着手）

- [ ] `present.html` のカードにアフィリンク最適化
  - [ ] 「安全牌 / ニッチ / 奇策」3属性で導線分岐
  - [ ] クリックログ用 data 属性追加
- [ ] `label.html` に関連文具導線を追加（必要最小限）
- [ ] 露骨なアフィ訴求文を抑え、UX優先文言に統一

### 2-4. 収益ページ導線 TODO（更新）

- [x] ヘッダー回遊強化（ラッコ型）
  - [x] `assets/sugudasu-shell.js` の 9本ナビを「アイコン + 短ラベル」に更新
- [x] FAQ 最適化（Omnicalculator型）
  - [x] `index.html` FAQ を 7問 → 4問に圧縮
  - [x] `reverse` / `present` / `report` / `sns` / `warikan` / `shift` / `label` に 3問FAQを追加
- [ ] 各ツール結果の下に「次のすぐだす」導線を1ブロック追加
- [ ] 曜日/用途別おすすめロジック（簡易版）を `hub.html` に追加
- [ ] 完了時CTAテンプレートを共通化（shell or CSS utility）

---

## 3) AdSense 審査・法務 Backlog（優先度高）

会話上で継続的に指摘された「信頼基盤」タスク。

- [x] 法務3ページを作成
  - [x] `privacy.html`（プライバシーポリシー）
  - [x] `terms.html`（利用規約）
  - [x] `disclaimer.html`（免責 + 広告/アフィリエイト表記）
- [x] `hub.html` / footer から上記3ページへリンク
- [ ] 表現監査
  - [ ] 「100%安全」等の過剰断定を回避
  - [ ] インボイス「完全準拠」表現は根拠文言に調整
- [ ] `ads.txt` 設置（AdSense有効化時）
- [ ] 連絡導線の段階運用
  - [x] 審査前は公開メール連絡先を法務3ページに記載（運営者: `SUGUDASU運営` / 連絡先: `banzai.millionaire@gmail.com`）
  - [ ] AdSense審査通過後、連絡先を Google Form に切替（privacy/terms/disclaimer の文言と運用フローを同時更新）

---

## 4) 品質・テスト Backlog

### 4-1. P0（最優先）

- [ ] `index.html`: 税計算、負数値引き、複数税率、印刷崩れ
- [ ] `label.html`: 規格寸法、改ページ、CSV大件数
- [ ] `shift.html`: 自動生成公平性、改ページ、FIXロック

### 4-2. P1

- [ ] `present.html`: 地雷除外ロジック、予算境界、Amazonリンク生成
- [ ] `report.html` / `reverse.html`: コピー導線・空入力・長文性能

### 4-3. P2

- [ ] `sns.html`: 絵文字・サロゲートペア・長文コピー
- [ ] `warikan.html`: 係数境界・丸め誤差・文面生成

### 4-4. セキュリティ・堅牢性

- [ ] `M7` 対象（`warikan` / `label`）の XSS再確認
- [ ] `M8` 対象（空入力・極大値）の挙動統一

---

## 5) Cloudflare Pages デプロイ Backlog

### 5-1. 事前チェック

- [x] `npm run build:pages` 成功
- [ ] `dist/` の実表示チェック（全9ページ）
- [ ] 404導線（存在しないURL時）方針決定

### 5-2. 本番設定

- [ ] Cloudflare Pages プロジェクト作成
  - Build command: `npm run build:pages`
  - Output: `dist`
  - `NODE_VERSION=20`
- [ ] カスタムドメイン接続
- [ ] 初回公開後の表示確認（PC/スマホ）

### 5-3. 公開後

- [ ] AdSense 審査申請タイミング判断（法務3ページ後）
- [ ] 収益導線のABテスト設計（広告位置・回遊CTA）

---

## 6) 直近スプリント提案（次の5手）

1. 法務3ページ (`privacy/terms/disclaimer`) を追加  
2. `hub.html` と footer に法務リンクを常設  
3. `ad-slot` 本番埋め込み設計（配置固定・誤タップ防止）  
4. `present.html` Amazon 導線のクリック計測導入  
5. Cloudflare Pages に first deploy（`dist` 配信）

---

## 7) 参照（SSOT）

- `docs/PRODUCT_UX_AUDIT.md`
- `docs/DESIGN_GUIDELINE.md`
- `README.md`
- `assets/sugudasu.css`
- `assets/sugudasu-shell.js`
- `scripts/build-pages.mjs`
