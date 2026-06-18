# SUGUDASU 統合 Backlog（会話全量反映）

更新: 2026-06-17（Gemini グロース MECE · PR/ゼロイチマーケ · `sugudasu.com` 本番）  
対象: `C:\asl_dev\sugudasu`

---

## 0) スコープと前提

- 単一ドメイン・静的配信（Cloudflare Pages / GitHub Pages）
- 1ファイル完結 HTML ツール群（現在 10ファイル: hub + 9ツール）
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
  - OGP / Twitter カード最適化（`hub` + 9ツール）
  - `title` / `meta description` をSEO語彙へ調整（`hub` + 9ツール）
  - FAQPage 構造化データ（JSON-LD）を 9ツールへ実装
  - CTA文言の外出し（`data/cta.json` + `sugudasu-shell.js` 適用）

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

### 1-5. FAQ導線・ユーモア強化（2026-06-17）

- [x] 9ツールの表示FAQに「隠し1問（クスッと要素）」を追記
  - [x] `invoice.html`
  - [x] `receipt.html`
  - [x] `label.html`
  - [x] `report.html`
  - [x] `shift.html`
  - [x] `present.html`
  - [x] `reverse.html`
  - [x] `warikan.html`
  - [x] `sns.html`
- [x] 9ツールの `FAQPage` JSON-LD（`data-sg-faq`）に同内容の隠し1問を追加し、表示FAQと構造化データを統一
- [x] `hub.html` の全ツールカードに FAQ 回遊導線を追加
  - [x] 導線文言を「クスッとFAQあり →」に統一
  - [x] 補助導線として可読性を微調整（主張しすぎないトーン）
- [x] 追加後の lint エラーなしを確認

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
  - [ ] `invoice.html`: フォーム下 1枠 + FAQ前 1枠
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
  - [x] `invoice.html` FAQ を 7問 → 4問に圧縮
  - [x] `reverse` / `present` / `report` / `sns` / `warikan` / `shift` / `label` に 3問FAQを追加
- [x] チャット共有導線（Phase 1）
  - [x] `invoice.html` に `Slack / Chatwork / Google Chat / Teams / LINE WORKS` 共有ボタンを追加
  - [x] 共有ボタン押下で「送付文面コピー + 送信先チャットURL起動」を実装
  - [x] 送信先URL設定（ローカル保存）を実装
- [ ] チャット共有導線（Phase 2）
  - [ ] `report.html` に同等の共有ボタンを追加
  - [ ] `shift.html` に同等の共有ボタンを追加
  - [ ] ボタン押下イベント計測（クリック率）を追加
- [ ] 各ツール結果の下に「次のすぐだす」導線を1ブロック追加
- [ ] 曜日/用途別おすすめロジック（簡易版）を `hub.html` に追加
- [x] 完了時CTAテンプレートを共通化（shell or CSS utility）— `data/cta.json` へ外出し済み
- [x] `hub.html` から各ツールFAQへの回遊補助文言を追加（「クスッとFAQあり →」）

### 2-5. AdSense 逆算 · グロースマーケ MECE（正本 · 2026-06-17）

**役割:** 「サイトを知ってもらう」施策と「知った後に稼ぐ」施策を **漏れなく・重複なく** 分解し、実装 TODO に落とす。  
**フェーズ:** `sugudasu.com` 本番 · AdSense サイト承認待ち  
**SUGUDASU の構造的特性:** ログイン不要 · 単機能ツール · 高インテント（今すぐ計算/書類）· ローカル完結 → **SEO + リピート + 結果シェア** が最もレバレッジが高い。

---

#### 0. 逆算方程式（北極星）

**簡略式（KGI）**

$$\text{AdSense収益} \approx \text{PV} \times \text{CTR} \times \text{CPC}$$

**分解式（施策マッピング用）**

$$\text{収益} = \underbrace{\text{セッション数}}_{\text{A 認知}} \times \underbrace{\text{PV/セッション}}_{\text{B 深化}} \times \underbrace{\text{広告表示/ PV}}_{\text{C-1 在庫}} \times \underbrace{\text{CTR}}_{\text{C-2 配置}} \times \underbrace{\text{CPC}}_{\text{C-3 文脈}}$$

| レバー | 意味 | 主な施策ブロック |
|--------|------|------------------|
| セッション数 | 新規＋再訪の「来訪」 | **A** 認知・獲得 |
| PV/セッション | 1人来訪あたりのページ深さ | **B** セッション深化 |
| 広告表示/PV | ポリシー内のインプレッション | **C-1** 在庫（枠数・審査） |
| CTR | クリック率 | **C-2** UI/UX |
| CPC | 単価 | **C-3** コンテキスト |

**SUGUDASU で CTR×CPC を稼ぐ前提:** ユーザーは「作業モード」。**入力フォーム上**に広告を置くと離脱 · ポリシー違反。**結果表示の直下・作業区切り**が唯一の勝ち筋（§2-2 済方針）。

---

#### A. 認知・獲得 —「サイトを知ってもらう」（チャネル MECE）

ユーザーが **初めて SUGUDASU に到達する経路** で4分割（Paid は将来枠として分離）。

| チャネル | 定義 | SUGUDASU での勝ち筋 |
|----------|------|---------------------|
| **A1 検索（Pull）** | 悩みキーワードで自走流入 | **最優先 · 生命線** |
| **A2 ソーシャル（Push）** | X 等で認知・拡散 | 結果シェア · 開発ログ |
| **A3 紹介（Referral）** | 他メディア・リンク | 個人開発 narrative · 被リンク |
| **A4 直接（Direct）** | ブックマーク・再訪 | ホーム画面追加 · リピート |

##### A1 検索（Pull）— SEO

- [x] **P0** Search Console · `sugudasu.com` プロパティ登録（2026-06-17 完了）
- [ ] **P1** ツール別ロングテール（title / h1 / リード / FAQ = 検索質問文）
  - [x] `invoice` — 請求書 無料 · インボイス · 源泉（title/meta反映）
  - [x] `receipt` — 手取り 逆引き · 領収書（title/meta反映）
  - [x] `warikan` — 割り勘 幹事 · 合コン（title/meta反映）
  - [x] `shift` — シフト表 自動作成（title/meta反映）
  - [x] `label` · `report` · `reverse` · `present` · `sns` — 各1テーマ（title/meta反映）
- [ ] **P1** 内部リンク — hub ↔ 各ツール · 関連ツール相互（例: invoice ↔ receipt）
- [ ] **P2** プログラムSEO — `calc.html`（メルカリ/ラクマ手数料 · `calc-furima.md`）
- [x] **P2** `FAQPage` / `WebApplication` 構造化データ（ツール単位）※FAQPageは `hub` を除く9ツールへ実装済み
- [x] **P2** sitemap.xml 送信（`https://sugudasu.com/sitemap.xml` · 2026-06-17）
- [x] **P2** `sitemap.xml` / `robots.txt` を `build-pages.mjs` で `dist/` 生成（2026-06-18 · HTML誤配信を修正）
- [x] **P2** PageSpeed Insights 初回計測（Search Console 経由 · 2026-06-17 · 詳細 §13）
- [x] **P2** `robots.txt`（`build-pages.mjs` · Sitemap 行付き · 2026-06-18）

##### A2 ソーシャル（Push）— 認知拡散

- [x] **P1** 計算結果シェア（X）— `warikan` · `receipt` · `invoice` 優先（`sugudasu-growth.js` · intent 起動）
- [ ] **P1** **開発透明性の発信** — `updates.html` + Form 窓口
  - [x] 初回投稿文面（既存Xアカウント用）— `updates.html` + `OPERATOR_X_POSTS.launch`
  - [ ] Zenn / Qiita 短記事（個人開発 × 実用ツール）
- [ ] **P2** チャット共有 Phase 2（`report` · `shift`）— §2-4
- [ ] **P2** 季節・時事フック投稿（年末調整 · 確定申告 · 歓送迎会割り勘）

##### A3 紹介（Referral）— 被リンク・第三者

**正本:** §14（ゼロイチ認知マーケ）· 原稿 `docs/PR_TIMES_LAUNCH_2026.md`（**pending · 資産のみ**）

- [ ] **PENDING** **PR TIMES** 第一弾入稿 — **見送り（2026-06）** · 税抜3万円/本 · スタートアップチャレンジ対象外 · 収益化前は費用対効果が合わない
  - [x] 入稿原稿ドラフト（`docs/PR_TIMES_LAUNCH_2026.md`）
  - [x] Grok Pass1〜4 監査（`grok-pr-times-review.md` · 原稿 §6 にログ）
  - [x] Gemini §6 メタ解析（`pr-times-gemini-meta.md` · 原稿 §7）
  - [x] Claude/Cursor で SSOT 照合・原稿マージ（Grok+Gemini反映済）
  - [x] 運営者プロフィール SSOT（`docs/operator-profile.md` L0〜L4）
  - [x] L3-press 表現確定（`docs/private/L3-press.md` · 322字）
  - [x] 社名公開境界 — 記者向け PR TIMES 担当者欄のみ（`operator-profile.md`）
  - [x] アイキャッチ素材（`press/assets/`）
  - [ ] 再開条件: AdSense 収益 or 有料プラン検討時 · 原稿はそのまま流用可
- [ ] **P1** **X v2** ローンチ週（ピン + W1 カレンダー · `x_guideline.md`）— **PR TIMES 代替の主軸**
- [ ] **P1** **Zenn / note**「30秒で使える」1本（invoice 訴求 · 自前被リンク）— 原稿の L2 切り口を転用可
- [ ] **P1** デモGIF（invoice 入力→PDF）— X · note 共通素材
- [ ] **P2** 運営者紹介のサイト公開（L4 → `updates.html` 等）
- [ ] **P2** PR TIMES 季節再送（§14-2）
- [ ] **P2** Product Hunt（**国内記事1本 or X初動後** · 英語1段落＋同GIF）
- [ ] **P2** ツール系アグリゲーター登録（国内まとめ · 週1本ペース）
- [ ] **P2** マイクロインフルエンサー ギブ型アプローチ（フリーランス・Excel系 · 10人リスト）
- [ ] **P2** フリーランス / 副業ブロガーへの紹介依頼（神ツール系記事）
- [ ] **P2** 知恵袋・Q&A 回答テンプレ（手動 · 月5件上限 · スパム禁止）
- [ ] **P2** Zenn / note「使い方30秒」1本（PRの裏取り・自前被リンク）
- [ ] **P2** 被リンク監視（Search Console · 参照元 · 二次掲載URLを§14に追記）
- [ ] **P2** デモGIF 3本（invoice / warikan / receipt）— PR・X・PH 共通素材
- [ ] **P3** ツール埋め込み / iframe 提供 — 要セキュリティ・コスト検討
- [ ] **禁止** LINE精算文への Powered by 強制（幹事UX悪化）· X `intent` シェアのみ可

##### A4 直接（Direct）— 再訪・囲い込み

- [x] **P0** ホーム画面追加 / ブックマーク誘導（初回完了後 · `localStorage` · `sugudasu-growth.js`）
- [ ] **P1** GA4 で Direct / 再訪率を追跡
- [ ] **P2** 「よく使うツール」— 最終利用を `localStorage` で hub に表示（ログイン不要）

##### A5 有料広告（将来 · 今はやらない）

- [ ] **P3** 検索広告 · SNS広告 — ROAS 未定 · オーガニック優先後に検討

---

#### B. セッション深化 —「知った後に PV を増やす」（体験 MECE）

初回流入だけでは収益が伸びない。**1セッション内のツール横断**で PV/セッションを上げる。

| 施策 | 内容 | 優先 |
|------|------|------|
| ヘッダー9本ナビ | 常時ツール切替 | [x] |
| 完了後「次のすぐだす」 | 結果下の関連ツール1ブロック | [ ] P1 |
| hub おすすめロジック | 曜日/用途別（月末=請求書等） | [ ] P2 |
| FAQ からの内部リンク | 関連ツールへ誘導 | [ ] P2 |
| `updates.html` | 新機能で再訪動機 | [x] ページ · [ ] 発信 |

- [x] **P1** 完了時CTAテンプレ共通化（shell / CSS utility）— `data/cta.json` + `SUGUDASU_SHELL.applyCtaLabels`
- [ ] **P1** ツール間「よく一緒に使われる」静的マップ（例: invoice → receipt → warikan）

---

#### C. 収益構造 — CTR × CPC × 在庫（マネタイズ MECE）

##### C-1 在庫（インプレッション）

- [ ] **P0** AdSense サイト承認待ち（2026-06-17 申請済）
- [ ] **P0** 承認後: 全主要ツールに `ad-slot--result` 本番タグ — §2-2
- [ ] **P1** 未配置ページ完了（`invoice` · `shift` · `label`）
- [ ] **禁止** フォーム直上 · CTA 密着 · 印刷対象内広告

##### C-2 CTR（配置・視線）

- [ ] **P0** 配置原則: **計算結果直下** → 広告 → 次操作（24px+）
- [ ] **P1** モバイル: アンカー広告は UX 監査後に限定
- [ ] **P1** 誤タップ監査 — `docs/PRODUCT_UX_AUDIT.md` 再確認

##### C-3 CPC（文脈・オークション品質）

- [ ] **P1** 高単価文脈の自然な解説（インボイス · 源泉 · フリーランス · 確定申告）
- [ ] **P1** `hub.html` リードをビジネス文脈に拡張
- [ ] **禁止** キーワード詰め込み · 虚偽の専門性

##### C-4 補助収益（AdSense 以外）

- [ ] **P1** Amazon — `present.html` 主戦場 · §2-3
- [ ] **P2** `label.html` 文具アフィ（最小）

---

#### D. 信頼・計測 — 施策が効いているか（横断）

| 領域 | TODO |
|------|------|
| E-E-A-T | [x] 法務3ページ · [x] `updates.html` · [x] Form 窓口 |
| 計測 | [ ] GA4（`sugudasu.com`）· [ ] SC インデックス · [ ] ツール別 PV · [x] PSI ベースライン（2026-06-17 · §13） |
| 実験 | [ ] 広告位置 A/B（承認後）· [ ] シェアボタン CTR |
| フィードバック | [x] Form + GAS + `FEEDBACK_TRIAGE.md` |

---

#### E. 実行ロードマップ（リソース有限前提）

**同時並行は最大3本。** AdSense 承認前後でフェーズを分ける。

| フェーズ | タイミング | 打つ施策（最大3） |
|----------|------------|-------------------|
| **今週** | 審査待ち | ①**X v2**（ピン+W1）②**Zenn/note** 1本 ③**invoice GIF** |
| **ローンチ週** | X 告知 | ①Xスレッド/固定 ②はてブ等 URL1本 ③ツールまとめ登録1件 |
| **承認直後** | タグ設置 | ①結果直下 AdSense ②invoice/shift 枠 ③GA4 |
| **30日** | オーガニック種まき | ①SEO内部リンク ②マイクロインフルエンサー ③完了CTA |
| **90日** | 拡張 | ①calc pSEO ②Product Hunt ③PR TIMES 再検討（pending） |

---

#### 附録: Gemini 提案（2026-06-17）との対応

| Gemini | 本 MECE |
|--------|---------|
| Ⅰ 集客4分類 | **A1〜A4**（+A5 Paid） |
| Ⅱ 構造 CTR/CPC | **C-2 / C-3** |
| 神の一手① ブックマーク | **A4 · P0** |
| 神の一手② 改善レポート | **`updates.html` · A2/A3**（`report.html` ではない） |
| 神の一手③ 結果下広告 | **C-2 · P0（審査後）** |

**やらない（方針）:** 施策一括投入 · フォーム上広告 · スパム的知恵袋 · 露骨アフィ · 有料広告（当面）· **PR TIMES 有料配信（pending）** · **Gemini への原稿遂行委任** · LINE文末ブランディング

**AI役割（PR）:** Grok=`grok-pr-times-review.md` · Gemini=`pr-times-gemini-meta.md` · Claude=SSOT照合・入稿確定

---

## 3) AdSense 審査・法務 Backlog（優先度高）

会話上で継続的に指摘された「信頼基盤」タスク。

- [x] 法務3ページを作成
  - [x] `privacy.html`（プライバシーポリシー）
  - [x] `terms.html`（利用規約）
  - [x] `disclaimer.html`（免責 + 広告/アフィリエイト表記）
- [x] `hub.html` / footer から上記3ページへリンク
- [x] 表現監査
  - [x] 「100%安全」等の過剰断定を回避
  - [x] インボイス「完全準拠」表現は根拠文言に調整
- [x] `ads.txt` 設置（AdSense有効化時）
- [ ] 連絡導線の段階運用
  - [x] 審査前は公開メール連絡先を法務3ページに記載（運営者: `SUGUDASU運営` / 連絡先: `banzai.millionaire@gmail.com`）
  - [ ] AdSense審査通過後、連絡先を Google Form に切替（privacy/terms/disclaimer の文言と運用フローを同時更新）

---

## 4) 品質・テスト Backlog

### 4-1. P0（最優先）

- [ ] `invoice.html`: 税計算、負数値引き、複数税率、印刷崩れ（明細多行時は区切り位置で2枚目へ続く改ページ含む）
- [ ] `label.html`: 規格寸法、改ページ、CSV大件数
- [ ] `shift.html`: 自動生成公平性、改ページ、FIXロック

### 4-2. P1

- [ ] `present.html`: 地雷除外ロジック、予算境界、Amazonリンク生成
- [ ] `report.html` / `reverse.html`: コピー導線・空入力・長文性能

### 4-3. P2

- [ ] `invoice.html`: **品名の複数行入力**（`textarea` + プレビュー/印刷で `whitespace-pre-wrap` · Enter改行 · 下書きJSONは `\n` そのまま）— 要望が複数来たら着手。核仮説（速いPDF）とは別レイヤ
- [ ] `sns.html`: 絵文字・サロゲートペア・長文コピー
- [ ] `warikan.html`: 係数境界・丸め誤差・文面生成

### 4-3b. `sns.html` 拡張（ユースケース強化）

- [x] **④** テンプレ「自分用に差し替えてコピー」（1行目=名前 · 2行目=キャッチ）— 2026-06-17
- [x] **⑥** プロフィール文字数カウンター（Instagram 150字 / X 160字）— 2026-06-17
- [ ] **⑤** 用途別クイック入力チップ（名前 / @ID / 1行キャッチ / 3行プロフ）
- [ ] **⑦** ビフォー → アフター比較スライダー（通常フォント vs デコフォント）
- [ ] **⑧** 季節テンプレの月替わりローテ（年末 · バレンタイン · 卒業 · 夏休み）
- [ ] **⑨** 投稿キャプション用タブ（プロフィールと別 · ストーリー/固定投稿向け）
- [ ] **⑩** `reverse.html` との相互導線（逆引き → デコ変換の回遊）

### 4-4. セキュリティ・堅牢性

- [ ] `M7` 対象（`warikan` / `label`）の XSS再確認
- [ ] `M8` 対象（空入力・極大値）の挙動統一

---

## 5) Cloudflare Pages デプロイ Backlog

### 5-1. 事前チェック

- [x] `npm run build:pages` 成功
- [x] `dist/` の実表示チェック（全9ページ）
- [ ] 404導線（存在しないURL時）方針決定

### 5-2. 本番設定

- [x] Cloudflare Pages プロジェクト（`sugudasu.pages.dev` 稼働中）
- [x] カスタムドメイン `sugudasu.com` 接続（お名前.com · 2026-06-17 本番確認済）
  - [x] Cloudflare にサイト追加 · NS をお名前から CF へ
  - [x] Pages: `sugudasu.com` · SSL 有効 · `https://sugudasu.com/` 表示確認
  - [ ] `www.sugudasu.com` Active 後 · www→apex リダイレクト
  - [ ] `ads.txt` / 主要ツール URL を apex で最終確認
  - [ ] AdSense に `sugudasu.com` 登録 · 審査待ち（2026-06-17 有効化手順完了）

### 5-3. 公開後

- [x] AdSense 所有権の確認（`ads.txt`）完了
- [x] AdSense サイト追加・有効化手順（`sugudasu.com` · 同意メッセージ済 · 2026-06-17）
- [ ] AdSense **サイト承認**待ち（メール通知）
- [ ] 収益導線のABテスト設計（広告位置・回遊CTA）

---

## 6) 優先順位キュー（P0 / P1 / P2）

優先度定義:
- **P0**: 収益・公開品質・主要導線に直結。先に止めると機会損失が大きい
- **P1**: 主要価値を強化する機能。P0 完了後に連続実装
- **P2**: 改善・最適化・拡張。P1 の成果を見て実行

### P0（最優先）

1. `invoice.html` の品質担保（税計算 / 負数値引き / 複数税率 / 印刷崩れ）  
2. ~~Cloudflare 本番運用~~ — `sugudasu.com` 本番確認済（§5-2）· 404 導線は未  
3. ~~法務表現監査~~（過剰断定の除去、インボイス文言の根拠化） — 完了（§3）  
4. ~~`ads.txt` 設置~~ — 完了 · AdSense 審査待ち  
5. ~~**§2-5 A4** ホーム画面追加 / ブックマーク誘導~~ · **P0** 完了（`sugudasu-growth.js`）  
6. **§2-5 C-2** AdSense 承認後 · 結果直下広告本番タグ · **P0**  
7. ~~**§2-5 A1** Search Console 登録~~ · **P0** 完了（2026-06-17）

> 2026-06-17 時点の P0 残: **2件**（①invoice品質担保 ②AdSense承認後の本番広告タグ）

### P1（高優先）

1. ~~**新規ツール `receipt.html`（手取り逆引き・領収書）MVP**~~ — 完了（`docs/prompts/receipt.md`）  
2. ~~**`updates.html`（更新履歴・改善レポート）**~~ — 完了 · 詳細 §11 · SSOT: `data/changelog.json`  
3. **§2-5 A2** `updates.html` の X / Zenn 発信（認知 · 被リンク）— **主軸（PR TIMES 見送り後）**  
3b. ~~**§2-5 A3 / §14** PR TIMES 第一弾入稿~~ — **PENDING**（原稿・素材は完成 · 税抜3万/本）  
4. ~~**§2-5 A1** ツール別ロングテール SEO（invoice / receipt / warikan 優先）~~ — title/meta/OG/Twitter 反映済  
5. **§2-5 A2** 結果画面シェア導線（warikan · receipt · invoice）  
6. **§2-5 B** 完了後「次のすぐだす」CTA · ツール間マップ（未実装）  
7. チャット共有 Phase 2（`report.html` / `shift.html` へ横展開）  
8. 共有・回遊の計測追加（クリック率、スクロール到達率、直帰率）  
9. `present.html` Amazon 導線の最適化（属性分岐 + data属性）  
10. `shift.html` の品質担保（公平性 / 改ページ / FIXロック）

### P2（通常優先）

1. ~~完了時CTAテンプレート共通化~~（`data/cta.json` 運用へ移行）  
2. **§2-5** `calc.html` プログラムSEO（フリマ手数料 · `calc-furima.md`）  
3. **§2-5** 構造化データ · Search Console · sitemap  
4. **§2-5** ブロガー紹介依頼 · 知恵袋運用テンプレ  
5. **§2-5** アンカー広告（UX 監査後）  
6. `hub.html` の曜日/用途別おすすめロジック  
7. `label.html` 文具導線追加（必要最小限）  
8. `sns.html` / `warikan.html` などの長文・境界ケース最適化  
9. `invoice.html` 品名の複数行入力（§4-3 · §8-8 — 要望次第）

---

## 7) 参照（SSOT）

- `docs/PRODUCT_UX_AUDIT.md`
- `docs/DESIGN_GUIDELINE.md`
- `README.md`
- `assets/sugudasu.css`
- `assets/sugudasu-shell.js`
- `scripts/build-pages.mjs`
- `data/changelog.json`（更新履歴 SSOT）
- **§2-5** AdSense 逆算 · グロースマーケ MECE（正本）
- **§13** PageSpeed Insights ベースライン（2026-06-17）
- **§14** ゼロイチ認知マーケ（PR · 紹介 · UGC）
- `docs/PR_TIMES_LAUNCH_2026.md`（PR TIMES 入稿原稿 · 代表カオル）
- `docs/prompts/grok-pr-times-review.md`（Grok推敲 5パス）
- `docs/prompts/pr-times-gemini-meta.md`（Gemini PRメタ解析 · 書き直し禁止）
- `docs/operator-profile.md`（運営者 L0〜L4 · 代表カオル）
- `press/assets/`（PR TIMES アイキャッチ · 本番非配信）

---

## 8) 意思決定ログ（背景・思想・別Agent向け）

この章は「なぜその実装/運用にしたか」を残すための判断ログ。  
別Agentは、ここを読んでから設計変更を提案すること。

### 8-1. URL設計: `index` はポータル、請求書は `invoice`

- **決定**
  - `https://sugudasu.com/`（`index.html`）= ツール一覧ポータル · **2026-06-17 本番確認済**
  - 請求書ツール = `invoice.html`（`/invoice`）
- **背景**
  - Cloudflare Pagesでは `index.html` がルート `/` の正本になる。
  - 旧構成では `build-pages.mjs` が `hub.html` を `dist/index.html` にコピーするため、請求書を `index.html` に置くと上書き衝突が起きる。
- **思想**
  - 1 URL 1責務（情報設計の衝突を回避）
  - トップは回遊導線を最大化し、実務ツールは個別URLで運用する。

### 8-2. Cloudflare Free枠ガードをビルドに強制

- **決定**
  - `npm run build:pages` に `verify-pages-free-plan.mjs` を組み込み、上限超過時は build fail。
  - 月間ビルド数は `guard-pages-build-budget.mjs`（ローカル台帳）で運用ゲート化。
- **背景**
  - Free plan の制限超過はデプロイ失敗や運用事故を起こしやすい。
  - 人手チェックは漏れるため、自動失敗で守る方が安全。
- **思想**
  - 「ルールは文章でなく仕組みで守る」
  - 失敗を早い段階（ローカル/CI）で起こす。

### 8-3. 共有機能は Phase 分割（いきなりWebhookしない）

- **決定**
  - `invoice.html` にチャット共有 Phase 1 を実装:
    - Slack / Chatwork / Google Chat / Teams / LINE WORKS
    - 送付文面コピー + 設定済み送信先URL起動
    - 送信先URLは `localStorage` 保存
- **背景**
  - 実ユーザーのペインは「書類作成後にチャット報告が面倒」。
  - ただしWebhook直叩きは、秘密URL漏えい・誤送信のリスクが高い。
- **思想**
  - まず「最小摩擦で安全な導線」を作る（MVP）
  - 高リスク連携（Webhook/外部送信）は Phase 2 以降で検証。

### 8-4. 法務ページ先行の理由

- **決定**
  - `privacy` / `terms` / `disclaimer` を先行実装し、フッター常設リンク化。
- **背景**
  - AdSense審査・公開信頼性の土台として法務が不足していた。
  - 「安全」「準拠」など断定表現は監査対象になりやすい。
- **思想**
  - 収益化より先に信頼基盤を固める。
  - 断定ではなく運用可能な表現へ寄せる。

### 8-5. Backlog運用ルール（引き継ぎ）

- **完了条件**
  - 実装 + ビルド通過 + 動作確認の3点が揃ってから `[x]`。
- **記述ルール**
  - ファイル名は現行名（`invoice.html`）を使う。旧名 `index.html` を残さない。
  - 新規機能は「Phase」で分割し、リスクの高い案は後段へ逃がす。
- **更新ルール**
  - 大きい方針変更時はこの章（8章）に必ず「背景」と「思想」を追記する。

### 8-6. フリマ送料比較は「4パターン固定値」で逃げる

- **決定（P2 採用・未実装）**
  - `calc.html` は全タリフマスタを作らず、送料4択 + 手数料定数のみ。
  - ヤフオクはプレミアム会員トグルを MVP に含める。
- **背景**
  - 運送会社 × フリマ便の完全網羅は個人開発で破綻する。
  - 一方、具体金額を出すツールは陳腐化・前提ブレで評判リスクが高い。
- **思想**
  - 「厳密さ」より「出品前3秒の比較」に価値を置く。
  - 免責は画面を汚さずツールチップ + アコーディオン。基準日は常時1行表示。

### 8-7. 更新履歴は `updates.html` + JSON SSOT（`report.html` ではない）

- **決定**
  - 改善レポート = `tools/updates.html` + 正本 `data/changelog.json`
  - 議事録ツール `report.html` とは URL を分離
  - 報告は Google Form（主）+ mailto（代替）
- **背景**
  - 静的ホストではフォーム POST 不可。信頼ページはビルド可能な SSOT が必要
  - 生のバグ報告をそのまま SEO 公開すると品質・プライバシーリスク
- **思想**
  - 「生きてるサイト」を **編集済み changelog** で示す
  - 手数最小の報告 = 文面コピー or mailto 1タップ

### 8-8. Invoice のコアコンピタンス仮説（2026-06-17）

- **コアコンピタンス仮説**
  - `invoice.html` の核は、**無料**・**登録不要**・**ローカル完結**で、実務品質の帳票を短時間で PDF 化できること。
  - 共有URL型 SaaS（freee 等）と同一機能で競うのではなく、**作成速度**と**漏えい面積の小ささ**で勝つ。
  - 価値の中心は高度連携ではなく、**「今すぐ出せる」業務実行力**にある。

- **仮説に基づくサービス設計**
  - **ターゲットスコープは PC ユーザー（Desktop-first）**。帳票の最終確認・PDF保存・印刷は PC 前提で設計し、実務の主戦場（デスクワーク）に合わせる。
  - スマホは補助利用のみ（入力・下書き閲覧程度）。帳票プレビュー最適化・モバイル完結 UX は **Non-goal** とする。
  - 成果物の主軸は **PDF（送付・印刷用の完成版）** とする。
  - 補助導線として **下書きデータ保存/読み込み（JSON）** を実装し、再編集・社内保管・端末間持ち運びを可能にする。
  - **見積 → 納品・請求の転用**：下書きを読み込んだあと書類種別タブを切り替えると明細・宛先は維持（番号・期限・備考は手直し）。UI案内・FAQで明示（2026-06-17）。
  - UI 文言は「JSON」を前面に出さず、**下書きデータ**として説明して期待値を調整する。
  - 共有は「送付文面コピー + チャット起動」を Phase 1 の正とし、Webhook 直送のような高リスク連携は後段で検討する。
  - 会計 SaaS への直接インポートは約束しない。訴求は「編集用データを自分で保持できる」までに留める。
  - 画面上は **PC推奨** を短く明示する（帳票品質・PDF出力の期待値調整）。 — `invoice.html` 先頭に常設バナー実装済（2026-06-17）

- **維持する実装原則**
  - 外部送信を前提にしない（ブラウザ内処理中心）。
  - 過剰断定を避け、運用に耐える表現を使う。
  - 新機能の採否は「速度を落とさない」「説明コストを増やさない」を基準にする。
  - **PC スコープ外の改善**（スマホ帳票UX・タッチ最適化など）は優先度を下げ、P0/P1 を圧迫しない。

- **明細入力 UX（2026-06-17 実装）**
  - 明細行はフレーム内スクロール（`max-h`）をやめ、**下方向に自然伸長**（`space-y-2` 維持）。
  - lg 以上では右 A4 プレビューを **sticky** にし、行を増やしても入力と出力の照合がしやすいようにする。
  - **改ページ用空行**（`spacer` 行）で印刷時の区切りを手動調整。未入力行（品名空・単価0）は **印刷非表示**（画面照合には表示）。**品名あり・0円は印刷可**（サンプル・無償提供向け）。
  - 印刷時の複数枚化の自動組版（2枚目ヘッダー繰越など）は別タスクとして P0 品質担保に残す。

- **品名の複数行（P2・未実装・2026-06-17 判断）**
  - ペイン: 品名1行だと長い作業内容が切れる（例: フロントエンド開発 + 括弧内補足）。
  - 想定ユーザー: **項目名に細かいことを書き込みたい人**（フリーランス見積寄り）。核ユーザー（1行で足りる層）とは別。
  - 軽量案: `input` → `textarea`（2行程度）· プレビュー/印刷は `pre-wrap` · SHIFT+ENTER 専用処理は不要（Enterで改行）。
  - 採否: 実装は半日以内だが **P0/P1 後・フィードバック複数件で着手**。コアコンピタンス（無料・速い・PDF）に直結しない付加価値。

- **本番ヘッダー表示（2026-06-17 修正）**
  - `sg-chrome` で白ヘッダー+ナビを一体 sticky · Tailwind フォールバックで CSS 未読込時も白地維持。
  - `build-pages` で `/assets/` 正規化 + `?v=` キャッシュバスター。手動 `dist` コピーは正本にしない。

## 9) 新規提案: `receipt.html`（手取り逆引き・領収書）

**状態:** 実装済み（MVP + A4マルチ + URL共有）  
**仕様SSOT:** `docs/prompts/receipt.md`  
**優先度:** P1（`invoice.html` 隣接の実務導線として価値が高い）

### 9-1. なぜやるか（背景）

- 現場ペイン: 「手取りジャストで払いたい」→ 本体・税・源泉の逆算が面倒。
- `invoice.html`（請求書）と補完関係。請求→支払→**領収**の流れを SUGUDASU 内で完結できる。
- チャット報告・印刷・URL共有は、既に `invoice.html` で検証済みのパターンを流用できる。

### 9-2. 思想（SUGUDASUとの整合）

- **1秒解決:** 手取り入力 → 即プレビュー。但し書きは1タップサジェスト。
- **サーバーレス:** 計算・印刷はブラウザ内。URL共有はクエリのみ（サーバー保存なし）。
- **段階実装:** MVP は外税・単票印刷・チャット共有コピーまで。内税・マルチ印刷・URL共有は Phase 1.5。

### 9-3. 実装TODO（チェックリスト）

- [x] `tools/receipt.html` 新規作成（`sugudasu.css` + `sugudasu-shell.js` 準拠）
- [x] 手取り逆引き計算（源泉 ON/OFF・税率・端数・内税/外税）
- [x] 領収書プレビュー（1枚モード）
- [x] 印刷CSS（`no-print` / `print-target`）
- [x] 印紙税注記（5万円超・注記のみ・断定回避）
- [x] 受領印トグル（CSS）
- [x] チャット共有（`invoice.html` と同型 Phase 1）
- [x] `hub.html` カード追加 + `sugudasu-shell.js` ナビ追加（10本目）
- [x] FAQ 3問（手取り逆引き / 源泉 / データ送信）
- [x] `ad-slot--result` 配置
- [x] A4マルチ印刷（3〜4枠）
- [x] URLクエリ共有（共有前確認UI）

### 9-4. リスク・要確認（実装前に決める）

| 項目 | 内容 | 方針案 |
|------|------|--------|
| 内税計算 | 仕様の式は外税前提 | MVPは外税のみ、内税は後続 |
| URL共有 | 宛名・金額がURLに載る | 共有前に「URLに含まれます」確認 |
| 税務表現 | 印紙税・源泉の注記 | 免責事項と整合、「参考計算」トーン |
| ナビ本数 | 9本→10本 | モバイルは横スクロール維持 |

### 9-5. AdSense 審査との関係

- [x] 所有権確認（`ads.txt`）完了
- [ ] **審査申請は未実施**（提督判断待ち）
- 提督方針: 審査申請前に `receipt.html` を入れるか、審査通過後に入れるかを選択（早く入れるとコンテンツ厚みは増えるが、初回審査範囲が広がる）

---

## 10) 新規提案: `calc.html`（フリマ送料・手数料比較）

**状態:** 提案採用・**未実装**  
**仕様SSOT:** `docs/prompts/calc-furima.md`  
**優先度:** **P2**（エピソード利用・料金陳腐化リスクのため P1 より後）

### 10-1. なぜやるか（背景）

- ペイン: 同一商品をメルカリ・ヤフオク・ラクマに出す前、「どこが一番手取りが残るか」を3アプリ開いて比較するのは面倒。
- SEO: 「メルカリ ヤフオク ラクマ 手数料 比較」系の検索意図あり。
- 回遊: `label.html`（宛名・発送）と自然に接続できるフリマ文脈のツール。

### 10-2. 思想（タリフ地獄の回避）

- **網羅しない:** ヤマト・日本郵便 × 各フリマ便の全マスタは作らない（個人開発スコープ外）。
- **4パターン割り切り:** 最薄 / 薄型 / 小箱 / 大型 — 超頻出のみ固定送料で if 分岐。
- **スピード診断:** 確定申告・精算用ではなく「出品前の力関係を3秒で知る」ツールと位置づける。
- **鮮度の正直さ:** 定数に `asOf`（基準日）を常時表示。改定時は定数パッチのみ。

### 10-3. 実装TODO（チェックリスト）

- [ ] `tools/calc.html` 新規（`sugudasu.css` + `sugudasu-shell.js`）
- [ ] 入力3項目（価格・4択サイズ・ラクマ手数料率）
- [ ] ヤフオク プレミアム会員 ON/OFF（8.8% / 10%）
- [ ] 3社手取りリアルタイム計算 + 定数 `asOf` 表示
- [ ] CSS 積み上げ棒グラフ（Chart.js 不使用）
- [ ] 結論表示（断定弱めコピー）
- [ ] `?` ツールチップ + `<details>` 前提・免責
- [ ] `hub.html` カード + ナビ追加（11本目）
- [ ] FAQ 3問 + `ad-slot--result`
- [ ] 完了CTA → `label.html`

### 10-4. リスク・要確認

| 項目 | リスク | 方針 |
|------|--------|------|
| 料金改定 | 数値ズレで低評価 | 基準日表示・免責・定期パッチ運用 |
| サイズ超過 | 実送料と乖離 | ツールチップで「目安」のみと明示 |
| ヤフオク非プレミアム | 8.8% 前提のクレーム | プレミアムトグル必須 |
| ナビ本数 | 11本で横スクロール増 | hub でフリマ系（label/calc）を近接配置 |

### 10-5. 評価メモ（2026-06-17）

- 議論の筋: **良い**（巨大マスタ回避は正しいアーキテクチャ判断）
- ニーズ: **ある**（ただしエピソード利用・リピート弱め）
- SUGUDASU適合: **7〜8割**（手数最小・クライアント完結と一致。数値鮮度が信頼リスク）

---

## 11) 更新履歴・改善レポート: `updates.html`

**状態:** 実装済み（Phase A: 静的 changelog + mailto 報告）  
**仕様SSOT:** `data/changelog.json` · 表示: `tools/updates.html`  
**優先度:** P1（信頼・EEAT・鮮度シグナル）  
**注意:** `report.html` は議事録ツールのため **使わない**

### 11-1. なぜやるか

- ログイン不要サイトの「誰が運営？」不安を、**更新の可視化**で解消
- 料金改定・計算修正の履歴で数値ツールの信頼性を補強
- Google 向け「生きたコンテンツ」シグナル（過度な期待はしない）

### 11-2. 実装方針（採用）

| レイヤ | 内容 |
|--------|------|
| 正本 | `data/changelog.json` — リリース時に1エントリ追記 |
| ビルド | `build-pages.mjs` が `dist/data/` へコピー |
| 表示 | `updates.html` が fetch で JSON 読込 → タイムライン描画 |
| 報告 | Google Form（主）+ mailto（折りたたみ代替） |
| 導線 | 全ページフッター + hub 1行リンク（ツールナビには載せない） |

### 11-3. 実装TODO

- [x] `data/changelog.json` 初回エントリ（receipt / warikan 合コン / invoice 等）
- [x] `tools/updates.html`（タイムライン + 報告フォーム）
- [x] `build-pages.mjs` data コピー
- [x] `sugudasu-shell.js` フッターに「更新履歴」
- [x] `hub.html` からリンク
- [x] `sg-changelog` CSS
- [x] Google Form へ報告導線（[フォーム](https://docs.google.com/forms/d/e/1FAIpQLSdzBg0IS1t-LM_J9nkZgECodmm_wFlHvw9jLb6KpWVPK_f1nA/viewform) · `updates.html` 主CTA）
- [x] Form 着信通知 GAS 設置（`gas/README.md` · FB-ID 自動 · メール）— 2026-06-17 トリガー `onFormSubmitNotify` 設置・テスト送信済
- [ ] Phase B: ロードマップ（Planned）セクション — 任意

### 11-4. 運用ルール

- 公開 changelog は **編集済み・過去形のみ**（生のユーザー投稿は載せない）
- ユーザー向け公開は **ツール更新情報を中心** とし、運用改善の内部ログは公開 changelog に混在させない（History 側で管理）
- 計算ツール修正行には **対象ツール名・基準日** を含める
- リリース commit 時に `changelog.json` を同時更新
- **Form 回答のトリアージ**は [`docs/FEEDBACK_TRIAGE.md`](FEEDBACK_TRIAGE.md) + [回答スプレッドシート](https://docs.google.com/spreadsheets/d/1rLYbcqHJMpcj3FIfbCi4LypUM-TKYyQ_g8lt4JWfmhw/edit)（提督のみ）。Status: inbox / 要件定義 / planned / done / wontfix / duplicate
- 公開は **changelog のみ**（スプシは非公開）。着信 → トリアージ doc → 実装 → changelog の順（詳細は `FEEDBACK_TRIAGE.md`）

### 11-5. Changelog 記載ガイド（メタ・SSOT）

**目的:** 「機能を足した」だけでなく、**いつ使うか・なぜ嬉しいか**まで書き、信頼と SEO の両方に効く1行ログにする。

#### JSON 1エントリの構造

| キー | 必須 | 役割 | 文字数目安 |
|------|------|------|------------|
| `date` | ○ | 公開日（`YYYY-MM-DD`） | — |
| `type` | ○ | `feature` / `fix` / `improve` | — |
| `title` | ○ | **何が変わったか**（名詞句・28字以内） | ≤28 |
| `body` | ○ | **変更内容**（過去形・事実のみ） | 1〜2文 · ≤120字 |
| `whenToUse` | 推奨 | **どんな場面で使うか**（ユーザー語） | 1文 · ≤100字 |
| `highlight` | 推奨 | **刺さるポイント**（省ける手間・得する理由） | 1文 · ≤100字 |
| `tools` | 任意 | 関連 HTML（リンク用） | ファイル名配列 |

#### 書き方テンプレ（思考順）

1. **title** — 「ツール名 + 変更の核」（例: 割り勘に固定額モード（合コン等））
2. **body** — 実装事実。「〜を追加しました」「〜を修正しました」
3. **whenToUse** — 「〇〇のとき」「〇〇な現場向け」
4. **highlight** — 「幹事が△△しなくてよい」「1秒で□□」

#### 禁止・注意

- 生のユーザー報告文の転載 · 「完全対応」「100%正確」等の断定
- 未リリースの予告（ロードマップは別 Phase）
- `body` に whenToUse/highlight を詰め込まない（役割分担を崩す）

#### 表示

- `whenToUse` / `highlight` があるエントリは `updates.html` でラベル付き表示
- 無い旧エントリは `body` のみ（後方互換）

#### 例（feature · 割り勘固定額）

```json
{
  "date": "2026-06-17",
  "type": "feature",
  "title": "割り勘に「固定額モード（合コン等）」",
  "body": "一方グループの1人あたり金額を固定し、残りをもう一方で按分するモードを追加しました。",
  "whenToUse": "合コンで女性のみ3,000円固定・男性が残りを割るときなど、金額が先に決まっている場面向け。",
  "highlight": "「総額−固定×人数」の電卓計算とLINE清算文作成をワンストップで済ませられます。",
  "tools": ["warikan.html"]
}
```

### 11-6. 意思決定（8章参照 §8-7）

§8-7 に追記済み。

---

## 12) Form 由来 · shift.html 改善（FB キュー）

**トリアージ正本:** `docs/FEEDBACK_TRIAGE.md`  
**スプシ:** [回答シート](https://docs.google.com/spreadsheets/d/1rLYbcqHJMpcj3FIfbCi4LypUM-TKYyQ_g8lt4JWfmhw/edit)

### 12-1. FB-20260617-001 — シフト枠の可変化

- [x] 枠数 1〜3 · 名称変更 UI（2026-06-17 反映 · changelog 済）

### 12-2. FB-20260617-002 — 複数人配置 + 新人のみ禁止

**Status:** 要件定義（P2）

- [ ] 1シフト帯あたり **複数スタッフ**（データモデル: `val` 配列化）
- [ ] **新人のみの帯を禁止**（帯単位。現行「重複NGキーワード」は同一日2新人回避で別ロジック）
- [ ] 自動生成が対象か / 手動のみか — 要件確定
- [ ] 印刷レイアウト（セル内複数行）
- [ ] 要件確定後 `docs/prompts/shift.md` に追記

**現状の近い機能:** 「役割・職種重複NGキーワード」（既定 `新人`）= 同一営業日に新人タグ2人を避ける。帯内複数名・新人単独禁止とは **未対応**。

---

## 13) PageSpeed Insights ベースライン（2026-06-17）

**きっかけ:** Search Console → PageSpeed Insights 初回計測  
**対象 URL:** `https://sugudasu.com/`（トップ / hub）  
**レポート作成:** 2026-06-17 09:46:51 JST  
**レポート ID:** `3qjiv55dvy`

### 13-1. レポートリンク

| form_factor | URL |
|-------------|-----|
| **mobile** | [PageSpeed Insights（携帯）](https://pagespeed.web.dev/analysis/https-sugudasu-com/3qjiv55dvy?utm_source=search_console&form_factor=mobile&hl=ja) |
| **desktop** | [PageSpeed Insights（デスクトップ）](https://pagespeed.web.dev/analysis/https-sugudasu-com/3qjiv55dvy?utm_source=search_console&form_factor=desktop&hl=ja) |

### 13-2. フィールドデータ（CrUX · 実ユーザー）

| 項目 | mobile | desktop |
|------|--------|---------|
| Chrome UX Report | **データなし** | **データなし** |

- PSI 上「このページの実際の速度データが十分にありません」— トラフィック蓄積前の新規ドメイン想定。
- Core Web Vitals の **検索ランキング信号**は、CrUX が出るまで未評価。SC の「体験」タブも同様に様子見。

### 13-3. ラボデータ（Lighthouse · 診断）

- 同一レポート内の **「パフォーマンスの問題を診断する」** = Lighthouse 計測（シミュレーション）。
- スコア・監査項目の正本は上記 PSI リンク（UI）。数値の転記は **次回再計測時に差分比較**する運用とする（本日は CrUX 未成立が主記録）。

### 13-4. 解釈メモ（SUGUDASU 前提）

- 静的 HTML + Cloudflare Pages · サーバー送信データなし → ラボ側は比較的良好になりやすい構成。
- **AdSense 本番タグ設置後**は第三者 JS 増加のため **§13 と同手順で再計測**（§2-5 C-1 承認後ゲート）。
- ツール個別 URL（`/invoice` 等）は未計測。必要なら hub と同様に PSI を追加。

### 13-5. TODO

- [ ] **P2** CrUX が表示されたら LCP · INP · CLS を §13-2 表に追記
- [ ] **P2** Lighthouse Performance が 90 未満なら静的資産（CSS/JS サイズ · フォント · 画像）を監査
- [ ] **P2** AdSense 承認・タグ設置後に mobile/desktop を再計測し §13 に追記行を追加
- [ ] **P3** 高トラフィックツール（`invoice` · `warikan`）の個別 URL 計測

---

## 14) ゼロイチ認知マーケ（PR · 紹介 · UGC）

**目的:** 広告費ゼロで **A3 紹介** と **A2 拡散** をレバレッジする。正本は §2-5 A3 の TODO と連動。  
**ポジション:** クラウド巨人の足元にある **No-Account Fast Tool**（ログイン不要 · ローカル完結 · 単機能爆速）

### 14-1. メディアが動く5メタフック（記事化の免罪符）

| # | フック | SUGUDASUでの刺さり | 第一弾PRでの配分 |
|---|--------|-------------------|------------------|
| 1 | 時流・社会課題 | インボイス · クラウド疲れ · フリーランス実務 | **主軸** |
| 2 | 逆張り・カウンター | 登録不要 · データ非送信 | **主軸** |
| 3 | タイパ・数字 | 開いて即作業 · 見積→請求転用 | サブ（具体1機能） |
| 4 | 開発者ストーリー | 非エンジニア×AI×Cloudflare低コスト | 段落5行以内 |
| 5 | すぐ試せる拡散性 | URL1本 · Xシェア · changelog | 末尾CTA |

**Gemini向け:** 上表の適合度採点のみ（`pr-times-gemini-meta.md`）— **原稿遂行はさせない**

### 14-2. PR TIMES 戦略 — **PENDING（2026-06 見送り）**

> 税抜3万円/本 · 無料枠（スタートアップチャレンジ）対象外。**原稿・`press/assets/` は資産として保持。** 再開は AdSense 収益化後 or 明示的な広報予算時。

| 弾 | 時期 | 切り口 | 原稿 |
|----|------|--------|------|
| **第一弾** | **pending** | 案① 時流×カウンター | `PR_TIMES_LAUNCH_2026.md`（完成） |
| 第二弾 | 7〜8月 | 案② 幹事・店長 | 未作成 · PR再開時 |
| 第三弾 | 10月 | 案① 再送 | 第一弾差分 |
| 第四弾 | 12〜1月 | receipt · 確定申告文脈 | 未作成 |

**代替の主軸（今すぐ）:** X v2 · Zenn/note · invoice GIF · ツールまとめ登録  
**成功指標（30日・無料ルート）:** X インプレ増 · `/invoice` 週50セッション+ · 自社記事1本インデックス

### 14-3. PR以外のゼロイチ施策（優先 Tier）

| Tier | 施策 | 優先 | 備考 |
|------|------|------|------|
| **1** | X v2 カレンダー（`x_guideline.md`） | **P1** | **ローンチ主軸**（PR TIMES 代替） |
| **1** | Zenn or note「30秒で使える」 | **P1** | 原稿 L2 転用 · 自前被リンク |
| **1** | デモGIF invoice | **P1** | X · note 共通 |
| **1** | デモGIF warikan / receipt | P2 | 横展開 |
| **2** | マイクロインフルエンサー・ギブ型 | P2 | 有料PR禁止 · 10人リスト |
| **2** | 国内ツールまとめ登録 | P2 | 週1ペース |
| **2** | 知恵袋・Q&A（価値回答） | P2 | 月5件上限 |
| **3** | Product Hunt | P2 | 国内記事 or X初動 **後** |
| **3** | PR TIMES（有料） | **pending** | 原稿完成済 · §14-2 |

### 14-4. AI役割分担（PRワークフロー）

```
原稿 SSOT (PR_TIMES_LAUNCH_2026.md)
  → Grok Pass1-4（スキップ理由・タイトル・法務・短文化）
  → Gemini §6（`pr-times-gemini-meta.md` · 表のみ · リライト禁止）
  → Claude/Cursor（changelog・URL照合・マージ・Backlog更新）
  → 提督入稿
```

| AI | やる | やらない |
|----|------|----------|
| **Grok** | 記者目線の批判 · タイトル多案 · 誇大表現の言い換え | 入稿確定 · 事実追加 |
| **Gemini** | メタフック採点 · 文脈案の比較表 · 見出し候補 | 礼賛リライト · 全文推敲 |
| **Claude/Cursor** | SSOT照合 · 原稿更新 · Backlog | Grok案の無批判採用 |

### 14-5. 二次掲載ログ（着信後に追記）

| 日付 | メディア | URL | きっかけ |
|------|----------|-----|----------|
| — | — | — | — |

### 14-6. やらないこと（ゼロイチ）

- 有料広告 · 大インフルエンサー有料PR · 施策同時10本
- 競合名での誹謗 · 「100%正確」等の断定
- LINE精算文への Powered by 強制
- Gemini への **プレスリリース遂行** 委任

