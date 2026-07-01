# SUGUDASU 統合 Backlog（会話全量反映）

更新: 2026-06-26（§5-4 クォータ案C確定 · ENT-SCOPE）  
対象: `C:\asl_dev\sugudasu`

---

## 0) スコープと前提

- 単一ドメイン・静的配信（Cloudflare Pages / GitHub Pages）
- 1ファイル完結 HTML ツール群（現在 10ファイル: hub + 9ツール）
- 入力データはブラウザ内処理（外部送信なし）
- 収益は **現状 AdSense + Amazon アソシエイト** のハイブリッド（**将来 Pro** — 広告非表示 · 高度機能 — は道を閉じない · F1 コアは無料維持）
- **SUGUDASU Sync**（別ライン · 有料 · 登録 · 共有 · NO広告）— `docs/notes/SUGUDASU_SYNC_LINE.md` · 初回 **`timeline-sync`（T13-S）** · **インフラ完了** `sync.sugudasu.com` · Backlog **§5-4**

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

### 1-6. UI 統一 — `sg-segment` 全モード切替ツール展開（2026-06-19）

- [x] 共有資産: `assets/sugudasu.css`（`.sg-segment*`）· `assets/sugudasu-segment.js`（`SUGUDASU_SEGMENT.mount`）
- [x] 適用: `invoice` · `receipt` · `warikan` · `report` · `reverse` · `label`
- [x] 主CTA `.sg-btn-primary` へ寄せ: `report` · `reverse` · `warikan` · `present`（他は段階適用可）
- **ペルソナ・3層アクション・設計根拠の正本:** [`docs/DESIGN_GUIDELINE.md`](DESIGN_GUIDELINE.md) §0–§3.3（本 Backlog には重複記載しない）

### 1-8. ツール開発段階ラベル（アルファ / ベータ / ガンマ / 安定）（2026-06-19）

- **SSOT:** `data/tool-registry.json`（段階・バージョン・Backlog 根拠の `statusNote`）
- **表示:** `assets/sugudasu-shell.js` が `data-sg-tool-id` を読み、ヘッダー直下にバッジ＋注記を自動挿入
- **段階の目安（Backlog 整合）**
  - **beta** — P0/P1 品質担保が残る（`invoice` · `shift` · `fair-draw`）
  - **gamma** — 主要機能済・細部・収益導線が残る（大半の実務ツール）
  - **stable** — 法務固定ページ等（**バッジは出さない** · `devBadge: false`）
  - **alpha** — 内部プレビュー（`brand-logo-preview`）
- [x] 実務ツール（hub + 9ツール + lottery + updates）に `data-sg-tool-id` 付与
- [x] 法務・混同防止ページ（privacy / terms / disclaimer / not-a-car）はバッジ非表示
- [ ] 段階昇格時は registry の `version` / `stage` を更新し `changelog.json` に追記

### 1-9. `fair-draw.html` — 運用UX・証跡・Phase 0 拡張（2026-06-19）

**registry:** `fair-draw` **v1.5.1** · **beta** · `data/changelog.json` 同日エントリ4件  
**SSOT:** [`docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md`](notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md) · 意思決定は **§8-10** · タスク正本 **§15**

#### 背景（なぜこのスプリントか）

- 抽選結果画面が **発表・画面共有向け**（大きいカード表示）に寄っており、幹事の本番作業（Excel貼付 · DM · 発送リスト）とズレていた。
- 監査PDF・JSONだけでは **「どの名簿のスナップショットか」** が第三者に再現しづらい。Excel `RAND()` から卒業しても、あとから「その回の名簿全文」が残らないと説明が弱い。
- マーケ現場では **複数キャンペーンを並行** することが多く、証跡ファイル名・PDF見出しに **どのCPか** が無いとフォルダが混線する。
- Phase 0 は P01–P11 までだったが、実務で多い **複数コース · 口数増 · Wチャンス** は抽選UIを複雑化せず **FAQ＋名簿運用** で逃がす方針が §15 と整合。

#### 実施済み（Done）

- [x] **結果UI — 運用ファースト**
  - 賞帯あり → **2列表**デフォルト + **TSVコピー**（Excel貼付向け）
  - 人数のみ → **1行1名** textarea
  - 「発表・画面共有用（大きい表示）」**削除**（PPT/Zoom共有は運営側。製品境界 §15-4）
  - 証跡バー: **キャンペーン · 実施者 · 日時 · シード · 名簿SHA-256** 常時表示
  - 上司・法務向け長文は **折りたたみ** のみ
- [x] **名簿統計** — 空行と重複を **別カウント**（`analyzeRosterStats()`）
- [x] **賞帯行UI修正** — flex+`width:100%` で左セルが潰れる問題 → grid + 列見出し（`sugudasu.css`）
- [x] **Phase 0 拡張** — P12–P15 · `campaignFormats` +4（`prize-law-patterns.json` · `prize-law-campaign-meta.json`）
- [x] **抽選コア** — `runBandDraw()` · 単体テスト **23本**（`scripts/prize-law-eval.test.mjs`）
- [x] **証跡3点セット（Phase 1）**
  - 必須: **キャンペーン名（識別用）** · **抽選実施者**（自己申告 · SSOなし）
  - 実行時 **名簿 `.txt` 自動DL**（ヘッダ: CP名 · 実施者 · 指紋 · シード · 名簿全文）
  - ファイル名: `sugudasu-roster-{cpSlug}-{date}-{sha8}.txt` · JSON も同 slug
  - 手動DL: 監査PDF · 抽選JSON · 名簿再DL
  - Phase 0「キャンペーン概要」1行目 → 抽選タブ **空時のみ** 自動補完（`syncDrawCampaignFromPhase0()`）
  - **実施者**のみ `sessionStorage` 復元 · **CP名は復元しない**（並行CPで前回名が残らない）
- [x] **運用コピー** — メインコピー · IDのみ（賞帯時）· Slack連絡文
- [x] **案C** — 1URL `?tab=check|draw` · Hub 2カード

#### 未着手 / 任意（§15-6 参照）

- [ ] 3点セット **単一ZIP** 一括DL
- [ ] 検証タブ（JSON再計算一致 · P2-2）
- [ ] `LOTTERY_PRIZE_LAW_TOOL_SPEC.md` へ Phase1 証跡節の正式追記（campaignLabel · 3点セット）
- [ ] FAQ JSON-LD にキャンペーン識別の1問追加

### 1-10. `normalize.html` — T03 文字列正規化 Phase A FIX（2026-06-19）

**registry:** `normalize` **v1.0.0** · **beta** · SSOT: `docs/notes/NORMALIZE_TEXT_TOOL_SPEC.md`

#### 背景

- Tier S（P-B）· Excel列コピーの半角/空白整理。**おっちょこ事故**（行数ズレで貼り戻し失敗）を **Before/After 行数** で防ぐ。
- fair-draw 名簿前処理としても使えるが、**単体ツールとして FIX クローズ**（新規大型開発は T09 等へ）。

#### 実施済み（Phase A · Done）

- [x] 用途プリセット3 · 500行 cap · 行数一致チェック · コピーゲート
- [x] `text-normalize.js` + 単体テスト · 貼付スキャン · sg-copy-feedback
- [x] hub · ナビ · changelog · FAQ **6問 + JSON-LD 同期**（2026-06-19）

#### 意図保留 / Phase B

- [ ] ページ内「このあと」回遊 — **削除** · §2-4 横断CTA待ち
- [ ] Phase B（v1.1）: 差分ハイライト · 変更内訳 · ヘッダー行警告 · 制御文字行番号
- [ ] **Zenn #2** — 開発裏側 · AI分担（[`ZENN_ARTICLE_02_DRAFT.md`](notes/ZENN_ARTICLE_02_DRAFT.md) · **9月上旬**）
- [ ] **Zenn #3** — warikan · 固定額 · LRM · LINE清算文（[`ZENN_ARTICLE_03_DRAFT.md`](notes/ZENN_ARTICLE_03_DRAFT.md) · [`ZENN_WARIKAN_DRAFT_MEMO.md`](notes/ZENN_WARIKAN_DRAFT_MEMO.md) · **9月中旬〜**）
- [ ] **Zenn #6** — 非送信設計 · 静的配信 · DevTools（[`ZENN_ARTICLE_06_DRAFT.md`](notes/ZENN_ARTICLE_06_DRAFT.md) · [`ZENN_PRIVACY_DESIGN_DRAFT_MEMO.md`](notes/ZENN_PRIVACY_DESIGN_DRAFT_MEMO.md)）
- [ ] **Zenn #11** — fair-draw · 証跡3点 · 景表法一次整理（[`ZENN_ARTICLE_11_DRAFT.md`](notes/ZENN_ARTICLE_11_DRAFT.md) · **#14 後**）
- [ ] **Zenn #14** — 班分け · RAND()卒業 · **予約投稿準備**（[`ZENN_ARTICLE_14_DRAFT.md`](notes/ZENN_ARTICLE_14_DRAFT.md) · [`X_POST_ZENN14_LAUNCH.md`](notes/X_POST_ZENN14_LAUNCH.md)）
- [ ] **Zenn #12** — Gemini事故カタログ × 他サービスあるある解消（[`ZENN_NORMALIZE_DRAFT_MEMO.md`](notes/ZENN_NORMALIZE_DRAFT_MEMO.md) · [`ZENN_ARTICLE_12_DRAFT.md`](notes/ZENN_ARTICLE_12_DRAFT.md)）
- [ ] **Zenn #15** — CRDT × 現場同期 · 行が混ざらない進行表（[`ZENN_CRDT_SYNC_DRAFT_MEMO.md`](notes/ZENN_CRDT_SYNC_DRAFT_MEMO.md) · **S4 ゲート**）

### 1-11. `group-split.html` — T11 グループ分け（**Phase A/B/C 実装済** · UX改善継続）

**registry:** `group-split` · **beta** v1.2.x  
**SSOT:** [`docs/notes/GROUP_SPLIT_TOOL_SPEC.md`](notes/GROUP_SPLIT_TOOL_SPEC.md)  
**Tier:** S（`PRODUCT_IDEA_JUDGMENT_LEDGER.md` T11）

#### 実装済（2026-06-20）

- [x] Phase A — 均等割り · TSV/Slack · シード再現
- [x] Phase B — 固定班 · 固定配置 · 離すペア · 定員超過表示
- [x] Phase C — Excel複数列 · 属性2〜3 · 分散/各組必須 · **cap 250名**
- [x] **UX C1** — Step ①〜④ · 列マッピング優先の説明 · 制約件数サマリ · 名簿ピッカー（固定班/固定/離すペア）· preset「各組に役員1名」
- [x] **M02 Resilience** v1.2.2 — 結果タップ除外 · セッション JSON
- [x] **各組必須・緩和モード** v1.2.3 — 人数不足時「可能な限り」実行 · 未充足組バッジ

#### 提督実体験 · 2モード（2026-06-20）

**正本:** [`GROUP_SPLIT_SWITCHER_PREP.md`](notes/GROUP_SPLIT_SWITCHER_PREP.md) · SPEC §1-2

| モード | 体験 | 欠席 | SUGUDASU 優先 |
|--------|------|------|----------------|
| **バッファ型** | 納会 · 円卓（事業部×職種シャッフル） | 料理・グラスで吸収 · 再編ほぼ不要 | 属性分散 · 事前1回 · TSV |
| **ゼロバッファ型** | ハッカソンオンライン | エンジニア0人 → 即再編 | 各組必須 · M02 · **スイッチャー向け出力** |
| **緩和型** | **アイディアソン** | 班分けは大きな問題になりにくい | 分散 · 均等 · **各組必須は使わない** |

ハッカソンでは **班決定 ≠ 完了**。BR 案内 · Slack 部屋割当 · Zoom 手動移動がセット。**スイッチャー**が班表を見ながら BR を操作する（Zoom 画面に属性は出ない）。

**アイディアソン（提督）:** 班分けは問題にならなかった。**非エンジニアへの役割説明**はツール外 — 名簿の職能ラベル定義 · 事前ブリーフが先（FAQ/Zenn P2）。

#### スイッチャーが事前に準備すると楽（要約）

| 必須 | 内容 |
|------|------|
| 班 ↔ BR 対応表 | `G1=BR-A` … 1枚（印刷 or スプシ） |
| 班 ↔ Slack 対応表 | `#team-01` 等 · 案内文コピー用 |
| 名簿 + 職能列 | 各組必須の入力元 |
| 班分け正本 | TSV + シード + 名簿指紋 |
| BR 数 = 組数 | ルーム名をグループ番号順に揃える |
| ホスト権限 | BR 手動割当できるアカウント |

| 当日 | 内容 |
|------|------|
| 欠席 → 再実行 | 幹事が SUGUDASU · **差分1行**をスイッチャーへ DM |
| 2画面 | ① Zoom ② 班表/対応表（スマホ可） |
| 案内再投稿 | Slack 用テキストを最新班で上書き |

詳細チェックリスト14項目 · 当日オペ手順: **`GROUP_SPLIT_SWITCHER_PREP.md`**  
**Agent 引き継ぎ:** [`GROUP_SPLIT_AGENT_HANDOFF.md`](notes/GROUP_SPLIT_AGENT_HANDOFF.md)

#### UX / 機能 Backlog（group-split）

| 優先 | 項目 | 状態 |
|------|------|------|
| P0 | 制約欄プレースホルダー · 列マッピング優先の1行 | [x] C1 |
| P1 | 名簿から選ぶピッカー（手打ち廃止） | [x] C1 |
| P1 | preset · Step番号 · 制約件数サマリ | [x] C1 |
| P1 | FAQ 2層化（班分け基本 + ツール）· `data/group-split-faq.json` | [x] C1 |
| **P1** | **M13 スイッチャー対応表（O8）** — BR名·Slack列テンプレ + 班員結合 TSV/Slack · 再編差分1行 | [ ] |
| P2 | 制約 Excel インポート | [ ] |
| **見送り** | 年齢バランス · 性別比の数値目標 · 属性上限/組 | ソルバ外 · SPEC に明記 |
| **見送り** | ドラッグ卓割り · 100%最適保証 | スコープ外 |

#### 訴求 · SEO · Resilience（2026-06-20 整理）

**プロダクトの Resilience（既存機能 · UI にコピー増やさない）**

| シーン | ツールの答え |
|--------|-------------|
| 開始直前の欠席 | 名簿から行削除 → 再実行 |
| 班だけ組み直し | 再シャッフル（条件維持） |
| 会場で最新版共有 | Slack/告知文を再コピー |
| 説明責任 | シード + 名簿指紋 |

**検索意図との役割分担**

| 層 | 例キーワード | 役割 | 載せ方 |
|----|-------------|------|--------|
| **A 獲得（正面）** | 研修 グループ分け · ブレイクアウト 班分け · ハッカソン チーム分け · Excel 班分け | title · meta 主軸 | 済 |
| **B 安心（ロングテール）** | 研修 班分け 欠席 調整 · グループ分け やり直し | 刺さるが検索入口には弱い | meta 1句 · FAQ · Zenn 後半 |
| **C 見送り** | Zoom ブレイクアウト自動 · 出欠管理 · 座席リアルタイム | スコープ外 | 追わない |

**M13（O8）スコープ FIX:** Zoom/Slack **API 連携・自動部屋作成はしない**。幹事が BR 名・チャンネル名を入力 → 班員と結合した **コピー用1枚** を出す（非送信維持）。再編差分は M02 タップ除外後の **1行サマリ**。

**方針:** 「班分けツール」で検索に載せ、**イベント直前の再編**は meta + FAQ + 記事で伝える（ページ内コピー乱立はしない）。  
**参照:** `group-split-gemini-research-RESULT.md` §5 · `data/group-split-faq.json` 欠席 FAQ · **`GROUP_SPLIT_SWITCHER_PREP.md`**

#### 背景（なぜやるか）

- **主ペルソナ:** 人事 · 研修担当 · **イベント幹事** — ブレイクアウト · 67名級 Excel 名簿。
- **Pain:** 属性分散は列マッピング · 固定班/離すペアは少数例外 · **当日欠席で班の組み直し**。
- **差別化:** 非送信 · 属性条件 · TSV/Slack · シード再現 · **名簿貼り直しで即再構成**（投影ルーレット演出とは別目的）。

#### Agent 着手順（新規）

1. `GROUP_SPLIT_TOOL_SPEC.md` §4b · §7c
2. `npm run test:group-split` · `build:pages`
3. UX 変更は **列マッピング = メイン · 名前ルール = 任意** を崩さない

### 1-12. スマホキラープロダクト — Gemini ブレスト（2026-06-20）

**正本:** [`docs/notes/MOBILE_KILLER_GEMINI_RESULT.md`](notes/MOBILE_KILLER_GEMINI_RESULT.md)（生出力 + Cursor 突合）  
**需要検証:** [`group-split-mobile-resilience-gemini-RESULT.md`](notes/group-split-mobile-resilience-gemini-RESULT.md) — **条件付き Go（案B）** · 競合 [GroupMixer /ja](https://groupmixer.app/ja)

#### M02 スコープ FIX（2026-06-20 · リサーチ後）

| v1 やる | v1 やらない |
|---------|-------------|
| 結果一覧でメンバー **タップ除外** → 名簿同期 → **再実行** | **部分移動・最適候補提示**（§1 Pain の「1タップ移動先」） |
| 同一端末（PC 実行 → スマホ幅 or 同タブ） | Session JSON（案C）— インタビュー後 |
| 対面 / hybrid / ハッカソン | 完全オンライン（Zoom/Teams 優先）· **遅刻者の再追加** |

**競合:** GroupMixer /ja — 部分参加・属性均衡あり。**差別化:** 非送信 · TSV/Slack · 幹事3分 · 事後タップ除外（事前シナリオ設定不要）。

#### 採用優先（Cursor 突合後）

| 順 | ID | 内容 | 種別 | 優先 |
|----|-----|------|------|------|
| 1 | **M02** | group-split **Resilience UX**（タップ除外 · セッションJSON） | 拡張 | **P1 実装済 v1.2.2** |
| 2 | **M13** | group-split **スイッチャー対応表（O8）** — BR/Slack 列 + 班員 TSV · 再編差分 | 拡張 | **P1** |
| 3 | **M01** | **T13** イベント進行タイムライン（`timeline.html`） | 新規 | **P0** |
| 4 | **M03** | warikan **送金リンク**（PayPay 等 · 仕様スパイク後） | 拡張 | **P1** |
| 5 | **M07** | normalize **モバイルSNS用プリセット**（新ツール不要） | 拡張 | **P2** |
| 6 | **M10** | receipt **スマホ初回価値**導線改善 | 拡張 | **P2** |

#### HOLD / 見送り

| ID | 判定 | 理由 |
|----|------|------|
| M04 | 実装済相当 | fair-draw チャットコピー · P2 磨きのみ |
| M05 | P2 HOLD | group-split ソルバ共通化後に座席UI |
| M06,M08,M09 | P3 HOLD | Ledger T18/T19/T15 · コモディティ |
| M03 | P1 まで HOLD | T14 — PayPay URL 端末差（Gemini Tier S は楽観） |

#### 検証 TODO（§1-12）

- [ ] **P0** group-split: モバイル結果UI · 名前タップ除外 → `runSplit` 再実行プロトタイプ
- [ ] **P0** timeline: コマ所要分配列 · 1コマ変更で後続時刻連動（`assets/timeline.js` 想定）
- [ ] **P1** group-split **M13**: BR名·Slack列入力 UI · O8 TSV/Slack 出力 · 再編差分1行（`GROUP_SPLIT_SWITCHER_PREP.md` §4）
- [ ] **P1** warikan: PayPay / 送金 Web URL · ディープリンクの端末別可否メモ（実装はスパイク後）
- [ ] **P2** fair-draw: Phase0 スマホ1画面 · CWV（**景表「20%」表記は誤り · 10% 正**）
- [x] コピーフラッシュ — `assets/sg-copy-feedback.js` 済 · 未適用ツールへ横展開

#### 思想（Desktop-first との共存）

- **PC:** 名簿ETL · 帳票 · 大規模Excel — invoice / group-split 準備
- **スマホ:** 当日例外 · 司会進行 · その場集金 · 結果共有 — **3分完結**がキラー条件

#### イベントプロダクト束 — アイデアログ（2026-06-25）

**正本:** [`docs/notes/EVENT_PRODUCT_BUNDLE_IDEAS_LOG.md`](notes/EVENT_PRODUCT_BUNDLE_IDEAS_LOG.md) — ID 01–15 · ライフサイクルマップ · **ブレストのみ**（Go/No-Go · 要件 · 優先度は未確定）

### 1-13. `statements.html` — SUGUDASU の約束（**実装済 2026-06-20**）

**正本ドラフト:** `docs/notes/STATEMENTS_PAGE_DRAFT.md`（v2.1）  
**URL:** `/statements` · `/statements.html`

#### 実装 TODO

- [x] **P1** `tools/statements.html` · shell フッター · meta/OGP · JSON-LD · sitemap
- [x] **P2** fair-draw / group-split FAQ から **各1リンク**（hub 本体へのリンクは置かない · フッターで十分）

#### 受け入れ条件 — 済

- モバイル可読 · privacy/terms/disclaimer 相互リンク · 断定表現なし · FAQ 3問

### 1-14. `png-to-webp.html` — T09b **SUGUDASU WebP圧縮**（**P1 · 未着手**）

**優先度:** **P1**（T09 `webp-to-jpg` の逆方向 Pain · LP/EC 軽量化）  
**状態:** 未着手（2026-06-21 起票 · **実装はしない** · Gemini 調査済）  
**正規 URL:** `/png-to-webp` · `tools/png-to-webp.html`

#### 命名（`TOOL_NAMING_AGENT_PLAYBOOK.md` · 実装時に registry 先）

| 層 | 値 |
|----|-----|
| id | `png-to-webp` |
| productName | **SUGUDASU WebP圧縮** |
| navLabel | **WebP圧縮** |
| conceptName | WebP圧縮 |
| subtitle | `PNG · JPEG · 非送信` |

**兄弟ツール:** `webp-to-jpg`（productName: SUGUDASU WebP変換 · nav: WebP→JPG）— **双方向化はしない**（Gemini §5 推奨 A · `DESIGN_GUIDELINE` 1 URL · 1 Pain）

#### SSOT

- 調査結果: [`docs/notes/png-to-webp-gemini-research-RESULT.md`](notes/png-to-webp-gemini-research-RESULT.md)
- 依頼プロンプト: [`docs/prompts/png-to-webp-gemini-research.md`](prompts/png-to-webp-gemini-research.md)
- 逆方向既調査: [`docs/notes/webp-to-jpg-gemini-research-RESULT.md`](notes/webp-to-jpg-gemini-research-RESULT.md)

#### 背景（1行）

PNG/JPEG を WebP に **非送信**で圧縮 — WordPress/LP 公開前 · 未公開 EC 素材 · 透過 PNG ロゴ等。アップロード型（Convertio 等）の代替として **機密画像をサーバーに送らない**訴求。

#### MVP スコープ（着手時）

- [ ] 入力: PNG / JPEG のみ（WebP 入力は `webp-to-jpg` へ誘導）
- [ ] 出力: WebP · **品質スライダー**（既定 0.85）· Before/After **ファイルサイズ**表示
- [ ] 透過 PNG → 透過 WebP（チェッカー背景プレビュー · **PoC 必須**）
- [ ] 上限: `webp-to-jpg` 踏襲 — 最大20枚 · 25MB/枚 · 8192px · **逐次キュー**
- [ ] 相互導線: webp-to-jpg ↔ png-to-webp（競合サービス名なし）
- [ ] `assets/png-to-jpg.js` との共通化検討（Canvas 変換コア）

#### やらない（非約束 · Gemini §5 整合）

- 一括 ZIP · フォルダ階層維持 · HEIC/AVIF · PDF 抽出 · AI upscale · **リサイズ必須機能** · 100MB 超 RAW

#### 実装 TODO（Playbook 順 · すべて未着手）

- [ ] `data/tool-registry.json` エントリ
- [ ] `tools/png-to-webp.html` · `assets/png-to-webp.js`
- [ ] hub カード · shell ナビ · changelog
- [ ] title / OGP / FAQ JSON-LD（検索: `png webp 変換` · `画像 軽量化 webp` 等）
- [ ] `npm run validate:tool-naming` → `build:pages`
- [ ] **PoC:** Safari/iOS `toBlob('image/webp')` · 透過 PNG 黒背景化の有無

#### 受け入れ条件（着手時）

- DevTools で画像 POST なし · 透過 WebP が目視確認できる · 品質変更で容量が変わる · webp-to-jpg から1クリックで相互遷移

---

### 1-15. 事務OL軸 — ローカル完結プロダクト案（**2026-07-01 採否FIX**）

**起源:** 提督ブレスト — 「1機能特化 · 1秒で解決 · 手軽でポップ」× **人事労務視点の事務OL**（社内データを無料Webツールに貼れない不自由 · 在宅時の監視ストレス）  
**評価軸:** [`PRODUCT_IDEA_JUDGMENT_LEDGER.md`](notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) §2（F1–F7 · M1–M7）· 思想は **§8-12**  
**ペルソナ:** **P-B 実務マイクロ修正職人** を **総務・営業事務・人事補助** に拡張（幹事 P-A とは別導線 · 同じ非送信憲法）

#### 戦略メモ（軌道修正の芯）

| 項目 | 内容 |
|------|------|
| **やる** | ブラウザ内完結 · 貼付→ボタン→コピー/PDF · 「サーバーに送らない」訴求 · DevTools で検証可能 |
| **やらない** | 監視回避・ステータス偽装 · 「社内ログに引っかからない」等の **セキュリティ回避コピー** |
| **既存との関係** | 新ブランド名（Seikei 等）で **ツールを増やしすぎない** — 可能なら **既存 id にプリセット・LP を足す** |
| **横断UI** | 「外部通信していません（スタンドアロン）」表示は **単体製品名ではなく** `sugudasu-shell` 共通バッジ候補（#6 非送信記事と整合） |

#### 採否一覧

| 仮称 | 判定 | 実装形 | 優先 | 台帳ID |
|------|------|--------|------|--------|
| **SUGUDASU-Seikei（成形）** | **採用（新規HTMLなし）** | `normalize` 拡張 · 事務OL向けコピー・プリセット | **P1** | **T03** 既存 |
| **SUGUDASU-Mask（マスク）** | **採用（新規）** | `mask`（仮 id）· Canvas ローカル赤塗り/モザイク | **P1** | 新規（T09 画像系兄弟） |
| **SUGUDASU-Taimu（タイム）** | **採用（新規）** | `time-calc` 等（仮 id）· 勤怠チェック用時間電卓 | **P2** | 新規（T08 営業日とは別 Pain） |
| **SUGUDASU-Keep（キープ）** | **不採用** | — | **OUT** | — |

---

#### 1-15-1. Seikei（成形）— **採用 · 再ポジション**

**解決する悩み（採用理由）**  
営業・総務が持つ顧客リスト（全角半角混在 · 謎改行）を整形したいが、**無料変換サイトへの貼付は社内規程で禁止** — Pain は実在し、Zenn #12 · #6 の読者像と一致。

**不採用にしなかったが「別ツールにはしない」理由**

- 機能の **80%以上** は既存 [`normalize.html`](../../tools/normalize.html)（T03 · §1-10）でカバー済み。
- 新 id を増やすと hub ナビが横スクロール化 · 命名3層のメンテが増える（`TOOL_NAMING_AGENT_PLAYBOOK`）。
- **「Seikei」はマーケ上の呼び名** に留め、registry は `normalize` のまま。

**着手内容（TODO）**

- [x] **命名FIX**（2026-07-01）— productName **SUGUDASU 全角半角整え** · navLabel **全角半角** · conceptName **テキスト整え**
- [x] **命名の実装反映** — registry · shell · hub · normalize.html
- [x] 事務OL向けプリセット **`comma_join`** · **`name_trim`**
- [ ] LP / hub コピー: 両方ターゲット — **hub 反映済** · normalize リード反映済
- [ ] 共通 **スタンドアロンバッジ**（§1-15 横断UI）— normalize 単体バッジは反映済 · shell 共通は未
- [ ] Zenn: #12 続編 or note で「総務が変換サイトに貼れない」角度（任意）· **#12 CTA 表示名追従済（2026-07-01）**

**訴求で避けること**  
「監視システムに引っかからない」→ **「処理がブラウザ内で完結し、当社サーバーへ POST しない」**（`statements` · #6 と同型）

---

#### 1-15-2. Mask（マスク）— **採用 · 新規ツール**

**解決する悩み（採用理由）**  
引き継ぎマニュアル用スクショの **顧客名・金額・アカウント** を隠したいが、画像アップロード型加工サイトは厳禁 — **webp-to-jpg（T09）と同型の「非送信画像」** ニッチ。

**ジャッジ（台帳突合）**

| 軸 | 評価 |
|----|------|
| F1–F2 | ◎ ドラッグ→Canvas→DL · サーバー非送信 |
| F5 | ◎ 矩形なぞり→即DL |
| F7 | ○ 「完全匿名化」断定禁止 · 手動塗り残しはユーザー責任 |
| M2 | ◎ アップロード型との差 · DevTools 検証記事可 |
| M5 | ○ `report` · 社内マニュアル文脈と接続可 |

**MVP スコープ（着手時 · 未着手）**

- [ ] id 仮: `mask` · productName: **SUGUDASU マスク**（副題: スクショの機密消し）
- [ ] 矩形 **黒塗り / モザイク** · PNG ダウンロード
- [ ] スタンプ:「サンプル」「ダミー」（テキスト · ローカル描画）
- [ ] 上限: 解像度・枚数 cap（`webp-to-jpg` 踏襲を検討）
- [ ] FAQ: 閉じたらデータ消滅 · OCR/自動検出は **v2 以降**

**やらない**  
顔自動検出 · クラウド共有 · PDF 多ページ一括（初期）

**SSOT（着手時に作成）**  
`docs/notes/MASK_TOOL_SPEC.md`（未作成）· Zenn メモは `ZENN_WEBP_TO_JPG_DRAFT_MEMO` と同型で可

---

#### 1-15-3. Taimu（タイム）— **採用 · 新規ツール · 優先 P2**

**解決する悩み（採用理由）**  
「10:15〜16:45 · 休憩45分 · 15分切り捨て」等の **単発時間チェック** — Excel `TIME` を開くほどではないが電卓だとミスる Pain。

**ジャッジ**

| 軸 | 評価 |
|----|------|
| F1–F3 | ◎ |
| F5 | ◎ 3分課題 |
| F7 | △ **勤怠確定ツールではない** — 免責・黄旗必須 |
| M1 | ○ 「勤怠 計算 15分 切り捨て」等 |
| M5 | △ `shift` は **配置生成**、本件は **電卓** — 相互リンクのみ |

**MVP スコープ（未着手）**

- [ ] id 仮: `time-calc` · productName: **SUGUDASU 時間計算**（副題: 勤怠チェック用）
- [ ] 入力: `1015` → `10:15` 正規化 · 開始/終了/休憩 · 実働時間
- [ ] 丸め: 15分切捨て · 30分切上げ 等（プリセット2〜3 · 会社ごと差は注記）
- [ ] コピー: 結果1行テキスト

**優先が P2 の理由**  
Mask · png-to-webp · normalize 事務訴求の方が **非送信差別化と SEO が強い**。Taimu は信頼構築後でも遅れない。

---

#### 1-15-4. Keep（キープ）— **不採用（OUT）**

**案の要約**  
在宅中の Teams/Slack 離席ステータスを防ぐ · PC アクティブ偽装 · 「読み込み中」風の **業務偽装画面**。

**不採用理由（思想 · 台帳）**

| # | 理由 |
|---|------|
| 1 | **F7 違反** — 「業務中っぽく偽装」は SUGUDASU の誠実さ（`statements` · Zenn #2「誇大コピー禁止」）と矛盾 |
| 2 | **Pain の質** — 手間削減ではなく **監視への対抗** · 製品哲学「幹事の透明精算」と同型で信頼を毀損 |
| 3 | **スコープ外** — チャット/ OS のプレゼンスは **第三者サービスの領域** · ブラウザ単体では安定提供不可 |
| 4 | **法務・社内規程** — 勤怠・監視回避ツールは利用者・雇用主双方のリスク |
| 5 | **ブランド** — 「スグダス＝サボり補助」印象は **ポータル全体の毀損** |

**代替（記録のみ · 実装しない）**  
在宅ストレスは **Keep ではなく** 正直な業務ツールで扱う（例: 手待ち時の進行メモ印刷 `timeline` · 清算文コピー `warikan`）。**監視そのものへの製品回答はしない。**

**再検討条件**  
原則 **なし**。類似案は `PRODUCT_IDEA_JUDGMENT_LEDGER` で **OUT** 扱い。

---

#### 1-15-5. 推奨リリース順（本件のみ）

1. **normalize 事務OL訴求**（Seikei 再ポジション · 新HTML不要）  
2. **`mask`** 新規 MVP  
3. **`png-to-webp`**（§1-14 · 画像系）  
4. **`time-calc`**（Taimu）  
5. Keep — **着手しない**

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
**外部ベンチマーク（サブスク→Web転用）:** `docs/notes/REVENUECAT_SOSA_SUGUDASU_SSOT.md` §2

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

- **ポータル件数表記 · ツール追加時 SEO 手順（Agent SSOT）:** **§8-11**

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
  - [x] **Zenn** #1 予約投稿済み（2026-06-18 · invoice 見積→請求 · `docs/notes/ZENN_ARTICLE_01_DRAFT.md`）
  - [ ] **Zenn** #2以降（`docs/notes/ZENN_EDITORIAL_PLAN.md`）
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
- [ ] **P1** **X v2** ローンチ週（ピン v2 + W1 カレンダー · `x_guideline.md` §8）— **PR TIMES 代替の主軸**
  - [x] 固定ピン文面 v2（W1-D1 · `pin_hub_v2` · 画像オーダー §8）
- [x] **P1** **Zenn**「見積→請求転用」1本（invoice · 案A · **#1 P0**）— **予約投稿済み** 2026-06-18
  - [x] 本文（技術用語 · JSON 補足 · Zenn AI 指摘反映）
  - [x] スクショ差し替え · Zenn 予約投稿
  - [ ] 公開当日〜翌日: X で記事 URL 共有（`article_01_invoice_convert`）
  - 正本: `docs/notes/ZENN_EDITORIAL_PLAN.md` · `docs/notes/ZENN_ARTICLE_01_DRAFT.md`
- [ ] **P1** デモGIF（invoice 入力→PDF）— X · Zenn 共通素材
- [ ] **P2** 運営者紹介のサイト公開（L4 → `updates.html` 等）
- [ ] **P2** PR TIMES 季節再送（§14-2）
- [ ] **P2** Product Hunt（**国内記事1本 or X初動後** · 英語1段落＋同GIF）
- [ ] **P2** ツール系アグリゲーター登録（国内まとめ · 週1本ペース）
- [ ] **P2** マイクロインフルエンサー ギブ型アプローチ（フリーランス・Excel系 · 10人リスト）
- [ ] **P2** フリーランス / 副業ブロガーへの紹介依頼（神ツール系記事）
- [ ] **P2** 知恵袋・Q&A 回答テンプレ（手動 · 月5件上限 · スパム禁止）
- [ ] **P2** note「5分でわかる使い方」（案C · Zenn 初稿の補助 · 被リンク）
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
| **今週** | 審査待ち | ①**X v2**（ピン+W1）②**Zenn #1** 予約投稿済 ③**invoice GIF** |
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
- [x] `warikan.html`: 最大剰余法（LRM）丸め · 回ごと別計算のLP/FAQ（2026-06-23）
- [ ] `warikan.html`: 係数境界・文面生成の境界テスト

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

### 5-4. Sync ライン — `sugudasu-sync` · `sync.sugudasu.com`（インフラ 2026-06-23 · Supabase 2026-06-26）

**SSOT:** [`docs/notes/SYNC_INFRA_CLOUDFLARE.md`](notes/SYNC_INFRA_CLOUDFLARE.md) · **env:** [`SYNC_ENV_KEYS.md`](notes/SYNC_ENV_KEYS.md) · **提督残タスク:** [`TAISHO_PENDING_TASKS.md`](notes/TAISHO_PENDING_TASKS.md)

#### インフラ Done

- [x] Cloudflare Pages プロジェクト `sugudasu-sync` 作成（Git: `Kaoru-Stats-Lab/sugudasu` · `main`）
- [x] カスタムドメイン `sync.sugudasu.com` — SSL Enabled / Active
- [x] **Automatic git deploys: Disabled**（500 回/月の二重ビルド防止）
- [x] コード: `npm run build:pages:sync` → `dist-sync/` · `tools/sync-*.html`
- [x] **Supabase 専用プロジェクト** · マイグレーション · CF 環境変数 · 本番 UI 結合（2026-06-26 · [`SYNC_ENV_KEYS.md`](notes/SYNC_ENV_KEYS.md)）

#### デプロイ運用（S1 プレースホルダー期）

- [x] ダッシュボード Build = **`build:pages:sync` + `dist-sync`**（2026-06-25）
- [x] Wrangler 認証 · 初回本番反映 `npm run deploy:pages:sync`（2026-06-25）
- [x] §6 チェックリスト — `sync.sugudasu.com/` · `/timeline` プレースホルダー · コア無影響

#### S1 以降（製品）

**残タスクの背景 · 思想 · 完了条件:** [`SYNC_S1_REMAINING_TASKS.md`](notes/SYNC_S1_REMAINING_TASKS.md)（**Agent は着手前に読む**）

- [x] S1 骨格 — Supabase スキーマ · Auth/ルーム JS · `/api/health` · Stripe webhook スタブ（`SYNC_S1_ARCHITECTURE.md`）
- [x] β運用窓口を開設（[不具合・改善フォーム](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor) / [回答管理シート](https://docs.google.com/spreadsheets/d/1LNjUDMiQW5klQlmrtRjDx_AHtf-EQRKYVnOZAJedl64/edit?usp=sharing)）
- [x] 回答管理シート `status` 運用定義を確定（`new` / `triaged` / `in_progress` / `resolved`）
- [x] Supabase プロジェクト作成 · マイグレーション · CF 環境変数 · 本番ログイン UI（2026-06-26）
- [x] リーガル文書を調整し、Supabase / Cloudflare 提供条件との衝突リスクを低減（[`docs/legal/terms-of-use.md`](legal/terms-of-use.md) · [`docs/legal/privacy-policy.md`](legal/privacy-policy.md) · [`docs/legal/data-lifecycle-policy.md`](legal/data-lifecycle-policy.md) · [`docs/legal/dpa-lite.md`](legal/dpa-lite.md) · 復旧保証断定の緩和 / β可用性条項の追加）
- [ ] **`sync.sugudasu.com/statements`** — Sync 専用約束ページ（[`STATEMENTS_SYNC_PAGE_DRAFT.md`](notes/STATEMENTS_SYNC_PAGE_DRAFT.md) · コア `statements.html` とは別）
- [ ] S1 受け入れ — 登録 → ルーム → 保存 → 再開（本番 E2E）— **Auth ブロック中** → [`SYNC_S1_REMAINING_TASKS.md`](notes/SYNC_S1_REMAINING_TASKS.md) §4
  - [x] マジックリンクログイン（本番 · 一度成功）
  - [x] ルーム作成 · クラウド保存（`rev.1`+）
  - [ ] E2E-3 ルーム削除（UI `364318ba` · 確認待ち）
  - [ ] E2E-2 別タブ · リロード復元
  - [x] `retain_until` DB（#2–4 適用）· UI 確認はログイン後
  - [ ] Cookie 分離（`sugudasu.com` に `sg-sync-auth` 無し）
  - [ ] `SYNC_S1_ARCHITECTURE.md` §5-2 `[x]`
  - [ ] 未コミット差分（提督判断）— §6
- [ ] **Sync Auth（P0）** — ログイン UI 実装済 · **アカウント削除 · メール変更** — [`SYNC_AUTH_POLICY.md`](notes/SYNC_AUTH_POLICY.md) §5
- [ ] **GitHub Secrets keepalive** — §5
- [ ] Auth · ルーム · クラウド保存（**E2E 受け入れ完了**で Done）
- [ ] `timeline-sync-app.js` フルエディタ · Push/Pull · 新版バナー（S2）
- [ ] **S2 フィードバック収集 + Dev Ops 表示**（`SYNC_POST_EVENT_REVIEW.md` · **出荷ゲート**）
- [ ] Build watch paths 導入 → Sync 自動デプロイ再開検討（`SYNC_INFRA` §5）

#### β期間 — アカウント MECE · 課金API境界（提督 2026-06-26）

**方針**

| 項目 | 内容 |
|------|------|
| **βと決済API** | **Stripe 本番（Checkout · Webhook · Portal）は β では導入しない** — 審査・接続に時間がかかるため、課金まわりの設計判断・実装・E2E は **今やらない** |
| **βでやること** | Auth · ルーム · `retain_until` · 退会 · コア境界 — **MECE の Non課金列のみ** |
| **冗長性・拡張性** | 課金接続を前提に **`auth.users.id` 正本 · `sync_profiles` · `user_entitlements` スキーマ · entitlement 列 · Functions フック空分岐 · webhook 501 スタブ** は **β で入れておく** |
| **MECE 正本** | [`sync-account-mece-gemini-RESULT.md`](notes/sync-account-mece-gemini-RESULT.md) **§11**（Non課金 / 課金 分割表） |
| **クォータスコープ** | **案 C 確定** — β **S-A'**（プール）· S3 で S-D 再評価 · [`SYNC_STORAGE_QUOTAS.md`](notes/SYNC_STORAGE_QUOTAS.md) §3-1a |
| **製品クラスター** | Timeline+Schedule 横断シナジー **薄** · 各クラスターに相方を足す · S3 で SKU — [`SUGUDASU_SYNC_LINE.md`](notes/SUGUDASU_SYNC_LINE.md) §3-0b |

**β — Non課金（実装キュー）**

- [ ] ACC-ID-01 — `sync_profiles` bootstrap（signup 1:1）
- [ ] ACC-ID-03 — コア↔Sync 非自動同期の UI 明示
- [ ] ACC-ID-05（β分）— 退会 API · JWT `user_id` · PW再確認 · `deleteUser` CASCADE · **Stripe 分岐は空**
- [ ] ACC-AUTH-01〜05 — セッション維持 · 列挙同一応答 · リセット slim 化
- [ ] ACC-AUTHZ-04 — JSON import 時の課金メタ strip（S2）
- [ ] ACC-AUTHZ-05 — owner RLS 確認済 · entitlement 書込 RLS **骨格のみ**
- [ ] ACC-LIFE-01 — trial 1枠 UI マップ（DB トリガー済）· **ENT-SCOPE-03** 単一 `残り X/Y` 極小
- [ ] ACC-LIFE-03 — `retain_until` 表示 · **ROOM-LIST-02** countdown · 直前通知（S2）
- [ ] ACC-LIFE-04 — 法務（TOS · データライフサイクル）· UI は日付のみ
- [ ] ACC-LIFE-05 — `revision` 楽観ロック（S2）
- [ ] ACC-BOUND-01〜05 — コア取込 · export strip · `/e/`（S2）· ドメイン分離
- [ ] ACC-ABUSE-01〜04 — 列挙 · payload 上限 E2E

**当日オペ表示（Grok §11 · アカウント外）**

- [ ] EDIT-IND-01 — 編集画面上部：同期状態 + payload 残量（極小）
- [ ] BANNER-01 — 全局通知：優先度キュー · 同時1件
- [ ] BANNER-02 — Supabase Paused：ログイン直後モーダル（P1）

**拡張性フック（βで必須 · 課金ロジックは入れない）**

- [x] `user_entitlements` · `sync_profiles.stripe_customer_id` 列（マイグレーション済）
- [ ] **ENT-SCOPE-01** — `20260628_sync_entitlements_product.sql` · `product_type` / `stripe_price_id` / `status`（**参照のみ · クォータ非結合**）
- [x] **ENT-SCOPE-02** — クォータスコープ **案 C 確定**（[`sync-entitlement-scope-grok-RESULT.md`](notes/sync-entitlement-scope-grok-RESULT.md) §13）
- [ ] **ENT-SCOPE-03** — UI 枠 **単一 X/Y** · 超過時整理提案（Grok §5 · ROOM-LIST と統合）
- [ ] **ENT-SCOPE-S3** — S3 ゲート: **クラスター別** SKU（timeline+group / schedule+相方）· 製品別必須なら S-D 再評価（着手しない）

**CRDT · 同期（S4 ゲート · 提督 2026-06-29）**

- [ ] **S4-CRDT-01** — 行 insert/reorder · NonInterleaving LSeq 系 · 編集者2人マージ（[`SUGUDASU_SYNC_LINE.md`](notes/SUGUDASU_SYNC_LINE.md) §3-0 · ACC-LIFE-05 拡張）
- [ ] **S4-CRDT-LP-01** — Sync LP / statements 脚注「衝突フリー設計」— **S4-CRDT-01 後**
- [ ] **S4-CRDT-ZENN-01** — Zenn #15 公開 — [`ZENN_CRDT_SYNC_DRAFT_MEMO.md`](notes/ZENN_CRDT_SYNC_DRAFT_MEMO.md) · S4-CRDT-01 または設計メモ明示
- [x] `/api/webhooks/stripe` 501 スタブ
- [ ] signup `ensureSyncProfile(userId)` · 退会 API の Stripe **空分岐コメント**
- [ ] 全アカウント API が **メールではなく JWT `sub`** のみをキーにする

#### Auth UI — Notion 適用（β · 課金なし）

**正本:** [`sync-account-ux-notion-gemini-RESULT.md`](notes/sync-account-ux-notion-gemini-RESULT.md) · [`sync-account-page-content-gemini-RESULT.md`](notes/sync-account-page-content-gemini-RESULT.md) · [`SYNC_AUTH_POLICY.md`](notes/SYNC_AUTH_POLICY.md) §5-5

- [ ] ログイン/登録 — 中央カード · タブ · PW 表示切替 · blue-600 CTA
- [ ] アカウントオーバーレイ — **4要素+安全弁**（メール · PW · ログアウト灰 · 危険ゾーン · 規約/PP/[フィードバック](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor) · ビルド極小）
- [ ] 退会 — 現PW + **登録メール全文タイプ** 確認（Notion 型）
- [ ] 列挙対策 — 登録/リセットの同一成功文言
- [ ] **借りない:** マジックリンク · ログインコード · 黒Primary · UUID表示 · アクセス統計 · アカウント内容量メーター

**インフラ・制限の見せ方（提督 2026-06-26 · Gemini §3 + Grok §11）**

| 種別 | 載せ場所 | アカウント |
|------|----------|------------|
| 同期 + payload 残量 | **編集画面上部インジケータ**（極小 · EDIT-IND-01） | **載せない** |
| `retain_until` · trial 枠 | ルーム一覧（countdown · 枠極小 · ROOM-LIST-01/02） | **載せない** |
| 同期失敗 · 障害 · Supabase Paused | 優先度トースト1件 · Paused ログイン直後モーダル（BANNER-01/02） | **載せない** |

**Grok 突合:** [`sync-account-page-content-grok-RESULT.md`](notes/sync-account-page-content-grok-RESULT.md)

**課金API接続後まで保留（Backlog に載せるのみ · 着手しない）**

- ACC-ID-02 · ACC-AUTHZ-01〜03 · ACC-COMM-01〜05 · ACC-OPS-01（サブスク解約 UI）
- 未決 SCH-B02 · B04 · B05 · B09（チケット紐付け · grace 日数 · 救済 abuse · Stripe Customer delete）
- 正本フェーズ: **Phase S3** · [`SYNC_S1_ARCHITECTURE.md`](notes/SYNC_S1_ARCHITECTURE.md) §2

#### SEO / キーワード調査（2026-06-25）

**クラスター SSOT:** [`docs/notes/SYNC_TIMELINE_SEO_KEYWORDS.md`](notes/SYNC_TIMELINE_SEO_KEYWORDS.md)  
**3社リサーチ要約:** [`docs/notes/sync-timeline-keyword-RESEARCH-RESULT.md`](notes/sync-timeline-keyword-RESEARCH-RESULT.md)  
**Planner 貼り付けシード:** [`docs/notes/SYNC_TIMELINE_KEYWORD_PLANNER_SEEDS.md`](notes/SYNC_TIMELINE_KEYWORD_PLANNER_SEEDS.md)

| 状態 | 項目 |
|------|------|
| **Done** | Gemini + Grok + GPT 突合 · LP/Core Top · 除外 · ページ割当 · 暫定 title/meta |
| **Pending** | Google Keyword Planner Run 1–5 · **検索ボリューム数値**の確定 |

- [x] AI キーワードクラスター調査（Gemini / Grok / GPT）→ `SYNC_TIMELINE_SEO_KEYWORDS.md`
- [ ] **Pending** Keyword Planner Run 1–5 · スプレッドシート化（`run` · `sync`/`core`/`both`）· 数値で Primary 順位を1回見直し
- [ ] Sync LP · Core `title` / `meta` / FAQ へ §1 反映（**暫定コピーで着手可** · ボリューム後に微調整）
- [ ] Zenn **#15** CRDT 現場同期（[`ZENN_CRDT_SYNC_DRAFT_MEMO.md`](notes/ZENN_CRDT_SYNC_DRAFT_MEMO.md) · S4 ゲート）— 旧: note 1本目 Sync 比較案は SEO 記事と役割分担

**除外（3社合意）:** 婚礼主軸 · 放送 · プロンプター · ガントチャート · 動画編集タイムライン — 詳細は `SYNC_TIMELINE_SEO_KEYWORDS.md` §2。

**垂直拡張（ブレスト · クラスター別）:** イベント当日 = timeline+group · 工程 = schedule（Timeline と横断シナジー薄）— [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](notes/SYNC_SCHEDULE_PRODUCT_DECISION.md) · [`SUGUDASU_SYNC_LINE.md`](notes/SUGUDASU_SYNC_LINE.md) §3-0b

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
11. **T11 `group-split.html`** — 研修 · ハッカソン向けグループ分け Phase A（SSOT: `GROUP_SPLIT_TOOL_SPEC.md` · Backlog **§1-11**）  
12. ~~**`statements.html`** — SUGUDASU の約束（§1-13）~~ — **実装済 2026-06-20**
13. **§1-15** `normalize` 事務OL訴求 — Seikei 再ポジション（プリセット · LP · スタンドアロンバッジ）  
14. **§1-15** 新規 `mask` — スクショ機密消し（Canvas · 非送信）  
15. **§1-14** `png-to-webp` — WebP 圧縮（T09b · 調査済）

### P2（通常優先）

1. ~~完了時CTAテンプレート共通化~~（`data/cta.json` 運用へ移行）  
2. **§2-5** `calc.html` プログラムSEO（フリマ手数料 · `calc-furima.md`）  
2b. **§1-15** 新規 `time-calc` — 勤怠チェック用時間電卓（Taimu · F7 免責必須）  
3. **§2-5** 構造化データ · Search Console · sitemap  
4. **§2-5** ブロガー紹介依頼 · 知恵袋運用テンプレ  
5. **§2-5** アンカー広告（UX 監査後）  
6. `hub.html` の曜日/用途別おすすめロジック  
7. `label.html` 文具導線追加（必要最小限）  
8. `sns.html` / `warikan.html` などの長文・境界ケース最適化  
9. `invoice.html` 品名の複数行入力（§4-3 · §8-8 — 要望次第）

---

## 7) 参照（SSOT）

- **`docs/notes/SUGUDASU_SYNC_LINE.md`** — Sync ブランド · T13-S · Phase S1–S4
- **`docs/notes/SYNC_TIMELINE_SEO_KEYWORDS.md`** — Sync 進行 **SEO キーワード SSOT**（LP/Core title · 除外 · KPI）
- **`docs/notes/sync-timeline-keyword-RESEARCH-RESULT.md`** — Gemini/Grok/GPT 要約
- **`docs/notes/SYNC_TIMELINE_KEYWORD_PLANNER_SEEDS.md`** — Keyword Planner 貼り付け Run 1–6（**ボリューム Pending**）
- **`docs/notes/SYNC_URL_INFORMATION_ARCHITECTURE.md`** — Sync LP/App URL · SEO 方針
- **`docs/notes/SYNC_INFRA_CLOUDFLARE.md`** — Sync インフラ · デプロイ運用 · watch paths（Backlog **§5-4**）
- **`docs/notes/DEPLOY_CLOUDFLARE_PAGES.md`** — コア本番デプロイ Agent SSOT
- **`docs/notes/GROUP_SPLIT_TOOL_SPEC.md`** — グループ分け T11（**企画FIX · 未実装** · 主=人事研修 · Backlog **§1-11**）
- **`docs/notes/REVENUECAT_SOSA_SUGUDASU_SSOT.md`** — **RevenueCat SOSA 2024–2026 調査ログ + SUGUDASU 転用判断（GTM · 初回UX · 収益）**
- **`docs/notes/ZENN_CRDT_SYNC_DRAFT_MEMO.md`** — Sync CRDT / 現場同期 Zenn #15 アウトライン
- **`docs/notes/ZENN_NORMALIZE_DRAFT_MEMO.md`** — normalize Zenn ネタ（Gemini OOPS × 他サービスあるある解消 · #12）
- **`docs/notes/ZENN_FAIR_DRAW_DRAFT_MEMO.md`** — fair-draw Zenn 記事ネタ備忘録
- **`docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md`** — 景品チェック＋公平抽選（**実装中 · fair-draw v1.5.1** · Backlog **§1-9 · §15 · §8-10**）
- **`docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`** — **アイディア評価台帳・ジャッジ基準（SUGUDASU適合 vs 市場）**
- **Backlog §1-15 · §8-12** — **事務OL軸プロダクト案（Seikei/Mask/Taimu/Keep 採否FIX · 2026-07-01）**
- **`docs/notes/EVENT_PRODUCT_BUNDLE_IDEAS_LOG.md`** — **イベント束アイデアログ（未評価 · ブレストのみ · Backlog §1-12）**
- `docs/PRODUCT_UX_AUDIT.md`
- `docs/DESIGN_GUIDELINE.md`
- `README.md`
- `assets/sugudasu.css`
- `assets/sugudasu-shell.js`
- `scripts/build-pages.mjs`
- `data/changelog.json`（更新履歴 SSOT）
- **§2-5** AdSense 逆算 · グロースマーケ MECE（正本）
- **§13** PageSpeed Insights ベースライン（2026-06-17）
- **§8-11** ポータル SEO — ツール件数表記 · 新規ツール追加時 Agent チェックリスト（2026-06-19）
- **`docs/notes/STATEMENTS_PAGE_DRAFT.md`** — Statements ページ本文 · SEO · 実装メモ（2026-06-20）
- `docs/PR_TIMES_LAUNCH_2026.md`（PR TIMES 入稿原稿 · 代表カオル）
- `docs/prompts/grok-pr-times-review.md`（Grok推敲 5パス）
- `docs/prompts/pr-times-gemini-meta.md`（Gemini PRメタ解析 · 書き直し禁止）
- **`docs/prompts/kanji-san-lp-patterns-gemini.md`** — 幹事さん型 LPプロンプト SSOT（型A-D · **§14-9**）
- **`data/lp-marketing-matrix.json`** — LPマーケ行列（Pain · 束 · △問題 · Top3）
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
- **ポータル件数・SEO**
  - hub / not-a-car の **「◯選」「全Nツール」禁止** · ツール追加時の SEO 手順 → **§8-11**（Agent 必読）

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

### 8-9. 景品チェック＋公平抽選 `fair-draw.html`（2026-06-17 企画FIX · 2026-06-19 実装中）

- **決定**
  - 新規 `tools/fair-draw.html`：Phase 0 景品表示法チェック → Phase 1 公平抽選。
  - 対外キャンペーン **メイン** / 社内イベント **サブ**。
  - **証跡PDFに景品名・金額を載せる（一択）**。ローカル生成・非送信を明記。
  - 判定は `data/prize-law-rules.json` + IF のみ。**LLMで合法/違法を言わない**。
- **背景**
  - マーケは監査同席で Excel `RAND()`。再現性・説明責任が弱い。
  - 法務なき企業は景表法を ChatGPT に聞きがち（根拠・証跡が弱い）。
  - 法令本文（e-Gov）を一般社員に渡しても判断不能。
- **思想**
  - 揉め事パターン（P01〜P11）カードで「うちの企画これだ」と気づかせる。
  - 断定せず黄/赤フラグ + 専門家確認推奨 + e-Govリンク。
  - `present.html`（何を贈るか）と別ツール（配れるか・誰が当たるか）。
- **SSOT:** `docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md` · タスクは **§15** · 2026-06-19 実装ログ **§1-9 · §8-10**
- **評価台帳:** `docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md` §6（本件の位置づけ）· §2（ジャッジ基準）

### 8-10. fair-draw — 運用UX・証跡設計（2026-06-19）

#### 8-10-1. 結果画面は「幹事の作業台」、発表演出はスコープ外

- **決定**
  - 当選者のデフォルト表示 = **表（賞帯別）または 1行1名リスト** + **TSV/テキストコピー**
  - 「発表・画面共有用」の大きいカードUIは **実装しない**（削除済）
- **背景**
  - 幹事の直後作業は Excel · スプレッドシート · DM · 発送CSV。カードUIは見た目は良いが **コピー不能・列が足りない**。
  - §8-9 / §15-4 で宴会演出は却下済み。大画面は Zoom/PPT/社内モニター = **運営の手元ツール**。
- **思想**
  - fair-draw の aha! は **監査PDF + 再現可能な数値（シード・指紋）** と **すぐ貼れるリスト**。
  - 見せ場は製品が奪わない。

#### 8-10-2. 証跡3点セット — 名簿txt · 監査PDF · 抽選JSON

- **決定**
  - 1回の抽選で残す正本 = **(1) 名簿スナップショット `.txt`** **(2) 監査PDF** **(3) 抽選結果 JSON**
  - 抽選実行時に **(1) を自動DL**。PDF/JSON は幹事がボタンで保存（ZIP一括は P2）
  - 必須メタ: **`campaignLabel`（キャンペーン識別名）** · **`conductedBy`（実施者）** · `rosterSha256` · `seedHex` · `drawnAtJst`
- **背景**
  - PDF/JSONだけでは **名簿全文** が第三者検証に足りない（ハッシュだけでは中身が無い）。
  - Excel `RAND()` 問題の本質は「**いつ · 誰が · どの名簿で**」がセットで残らないこと。
  - 統制SaaSではないため **操作者は自己申告**。それでも「誰が回したか」欄は空よりマシ。
- **思想**
  - サーバー送信なし · ローカル完結のまま **説明責任の最小セット** を1クリックで揃える。
  - 法務向け長文は UI を圧迫しないよう **折りたたみ**。

#### 8-10-3. キャンペーン識別名は必須 — 並行CP対応

- **決定**
  - 抽選タブ `in-draw-campaign` を **空では実行不可**
  - ファイル名・PDF・JSON・名簿txtヘッダ・結果画面証跡バーに **必ず記録**
  - Phase 0 のキャンペーン概要 **1行目** は抽選タブが空のときだけ自動補完
  - **キャンペーン名は sessionStorage に保存しない**（前回CP名の誤混入防止）
  - **実施者名のみ** sessionStorage 復元（同一担当の連続作業向け）
- **背景**
  - 景表法チェック（Phase 0）のスクショ・PDFは **CP仕様の証跡** だが、**どのCPの抽選結果か** は別問題。
  - 幹事は GWキャンペーンと常設懸賞を **同週に並行** しがち。フォルダ名 `audit-1739...json` だけでは後から区別不能。
- **思想**
  - 「CPページのスクショ＝企画仕様の証跡」「**識別名＋名簿txt＝抽選実行の証跡**」を分け、両方そろえて保管する運用を促す。
  - 自動復元で楽をさせるより **毎回明示入力** を優先（並行時の取り違え > 入力手間）。

#### 8-10-4. P12–P15 — 抽選UIを増やさず FAQ＋名簿運用

- **決定**
  - 複数コース · 複数SNS口数 · 購入ティア · 紹介/Wチャンス = **Phase 0 パターン＋FAQ 5問**
  - 加重口数 = 名簿 **重複行** · コース別 = **Excel分割 → fair-draw 複数回実行**
  - `runBandDraw()` で賞帯別抽選は実装済み。自動口数計算・SNS API は **スコープ外**
- **背景**
  - X/IG のフォロー確認 · 口数2倍計算は **データ取得＋統制** が必要で SUGUDASU 境界外（§15 · FAQ）。
  - UIにコース/口数エンジンを載せると invoice P0 と争う工数 · テスト爆発。
- **思想**
  - 「公平シャッフル＋証跡」に尖る。前処理は normalize / Excel / 幹事の手。

### 8-11. ポータル SEO — ツール件数の表記方針（2026-06-19）

**別 Agent 向け SSOT。** hub（`/`）· `not-a-car.html` · その他横断ページの **件数表記** と **ツール追加時の SEO** をここだけ見れば足りる。

#### 8-11-1. 決定（採用）

| やる | やらない |
|------|----------|
| **数字なし**の集合語: 「無料ビジネスツール**集**」「**ツール一覧へ**」 | `全9ツール` · `11選` · `10+` 等の **固定件数** |
| 各ツール固有の title / description / FAQ（ロングテール） | hub title を registry 件数で **毎回自動更新**（工数対効果小 · 必須ではない） |
| ツール追加時: hub カード1枚 · `tool-registry.json` · `sugudasu-shell.js` ナビ · `npm run build:pages` | ポータルだけ数字を増やして SEO を済ませる |

- **正規 URL 例:** `webp-to-jpg.html` → `/webp-to-jpg`（機能名スラッグ。`imgconv` 等の内部略称は廃止）
- **2026-06-19 実施:** `hub.html` の `10選`/`11選` 削除 · `not-a-car.html` の「全9ツール一覧へ」→「ツール一覧へ」 · hub カード「クスッとFAQあり →」削除（FAQ は各ツール内）

#### 8-11-2. 背景（なぜ数字を付けないか）

- ツール数は **増え続ける**（`data/tool-registry.json` が正本）。HTML に書いた数字は **すぐ陳腐化** し、ページ間で **9 / 10 / 11 と不一致** になった（2026-06 時点で既に発生）。
- 「◯選」が CTR を上げるのは **50選・100選** など **厚み自体が訴求** のとき。SUGUDASU は **1ツール1尖り** — 件数は **圧倒的ではない**（2026-06 時点 ~10台）。
- `10+` 等の緩い数字も、12〜15件規模では弱く、**増えるたびに直す** メンテだけ残る。
- 競合（iLoveIMG / Convertio 等）との差は **件数ではなく** 各ツールの **非送信・用途**（例: webp-to-jpg のアップロードしない）で書く（Zenn 正本: `docs/notes/ZENN_WEBP_TO_JPG_DRAFT_MEMO.md`）。

#### 8-11-3. 思想

- **ポータル** = 回遊と信頼。**数字より「何ができるか」の列挙**（請求書 · 領収書 · WebP→JPG …）。
- **SEO の主戦場** = **各ツール URL**（`invoice` · `webp-to-jpg` 等）。hub はブランド＋索引。
- **件数をどうしても出す**場合のみ: 本文の列挙で足りる。title / OG に **N選** を戻さない（提督が「50超」等の明確な訴求点ができたときだけ §8 追記で再検討）。

#### 8-11-4. Agent チェックリスト — 新規ツール追加時

**命名 3 層の詳細手順:** `docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md` §1（**この節より先に registry**）

1. [ ] `data/tool-registry.json` — `conceptName` · `productName` · `navLabel` · `inNav` · `navOrder` · `stage` · `statusNote`
2. [ ] `tools/{slug}.html` 作成（**slug = id = registry キー**。略称のみの `imgconv` 型は禁止）
3. [ ] `data-sg-title` = **productName** · `data-sg-tool-id` = id（`CHROME_HEADER_GUARDRAILS.md`）
4. [ ] `assets/{slug}.js`（ロジックがある場合 · HTML と **同名**）
5. [ ] `tools/hub.html` カード `<h3>` = productName · `assets/sugudasu-shell.js` `TOOLS[].label` = navLabel
6. [ ] 当該 HTML の **title / meta description / OGP / FAQ JSON-LD**（**このツールの検索意図**）
7. [ ] `data/changelog.json` 追記
8. [ ] **`npm run validate:tool-naming`** → **`npm run build:pages`**（sitemap · `_redirects` 自動）
9. [ ] **hub の title に件数を書かない** · **「全Nツール」リンク文言を増やさない**

#### 8-11-5. 任意（P2 · 未採用）

- ビルド時に registry 件数を hub **本文** にだけ注入（例: 「現在 ◯ 機能」）— **title は触らない**。提督が明示依頼するまで **実装しない**。

### 8-12. 事務OL軸プロダクト案 — 採否の思想（2026-07-01）

**正本タスク:** **§1-15**（採否 · MVP · TODO）  
**起源:** 提督ブレスト — ブランド「1機能特化 · 1秒解決 · 手軽ポップ」× 事務OLの **「便利Webツールに社内データを貼れない」** Pain

#### 決定サマリー

| 案 | 判定 |
|----|------|
| Seikei（成形） | **採用** — 新規HTMLなし · `normalize` 再ポジション |
| Mask（マスク） | **採用** — 新規 · 画像ローカル赤塗り |
| Taimu（タイム） | **採用** — 新規 · P2 |
| Keep（キープ） | **不採用（OUT）** — 監視回避・業務偽装 |

#### 背景（なぜこの軸に振るか）

- **市場:** 20〜30代事務は、文字数カウント・画像加工・変換サイトを **日常で使いたいが社内規程で禁止** される — 人事労務視点のストレスは **検索・口コミ・社内Wiki** に乗りやすい。
- **既存資産:** SUGUDASU はすでに **非送信・静的・登録不要**（`statements` · Zenn #6）。訴求を **幹事（P-A）から職人（P-B）** に広げるだけで、憲法は変えない。
- **競合:** 無料ツールの海では **「ブラウザ内完結の証明」**（DevTools · スタンドアロンバッジ）が M2 差別化。

#### 思想（採用案に共通）

1. **正直な非送信** — 「監視に引っかからない」ではなく **「当社サーバーへ送らない」**（F7 · `statements` 整合）。
2. **1 URL · 1 Pain** — Seikei のように既存で足りるなら **id を増やさない**（hub 回遊 · naming コスト）。
3. **手間の削減のみ** — 勤怠の **確定** · プレゼンスの **偽装** · 法令の **自動適法判定** はやらない（fair-draw と同型の境界）。
4. **ポップだが軽くない** — マニュアル用 Mask も **免責と塗り残しリスク** を FAQ で明示。

#### Keep を OUT にした理由（再掲 · 再検討なし）

- 製品が解くのは **作業時間** であり **上司の目** ではない。
- 「読み込み中風UI」は **意図的誤認** に近く、Zenn #2（誇大・未実装宣伝禁止）と両立しない。
- 成功してもブランドが **「サボり補助」** に固定され、normalize / invoice 等の信頼を巻き添えにする。

#### 別Agent向け

- 新規 id 提案時は **§1-15 採否表** と `PRODUCT_IDEA_JUDGMENT_LEDGER` §2 を突合。
- Keep 類似案（アクティブ偽装 · ステータス操作）は **台帳に載せず却下** でよい。

---

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

**代替の主軸（今すぐ）:** X v2 · **Zenn** · invoice GIF · ツールまとめ登録  
**成功指標（30日・無料ルート）:** X インプレ増 · `/invoice` 週50セッション+ · 自社記事1本インデックス

### 14-3. PR以外のゼロイチ施策（優先 Tier）

| Tier | 施策 | 優先 | 備考 |
|------|------|------|------|
| **1** | X v2 カレンダー（`x_guideline.md`） | **P1** | **ローンチ主軸** · ピン v2 文面確定 |
| **1** | **Zenn**「見積→請求転用」等（案A） | **P1** | **#1 予約投稿済** 2026-06-18 · 公開後 X 連動待ち |
| **1** | デモGIF invoice | **P1** | X · Zenn 共通 |
| **2** | note 使い方ガイド（案C） | P2 | Zenn のライト版 · 月1本まで |
| **1** | デモGIF warikan / receipt | P2 | 横展開 |
| **2** | マイクロインフルエンサー・ギブ型 | P2 | 有料PR禁止 · 10人リスト |
| **2** | 国内ツールまとめ登録 | P2 | 週1ペース |
| **2** | 知恵袋・Q&A（価値回答） | P2 | 月5件上限 |
| **2** | **fair-draw GTM** 懸賞天国SNS掲載アカウント手動フォロー | P2 | §15-5 · スクレイピング禁止 |
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

### 14-7. ターゲットメディア（統合 MECE · 2026-06-18）

**前提:** PR TIMES pending · 無料ルート（X · **Zenn** · Qiita · note補助）中心。

| 軸 | 代表メディア | 刺さる訴求 |
|----|--------------|------------|
| **A ライフハック・生産性** | ライフハッカーJP · Lifehacking.jp · ITライフハック · DIME | タイパ · 登録不要 |
| **B ガジェット・Webツール** | GIGAZINE · 窓の杜 · ASCII · Gizmodo/Engadget · Vector | ブラウザ完結 · URL1本 |
| **C ビジネス実務・FL** | @IT · ITmedia Biz/NEWS · 日経xTECH · Workship · さくマガ | インボイス · 見積→請求 |
| **D 開発者・個人開発** | Zenn · Qiita · note · #個人開発 | 職人UX · 低コスト運用 |
| **E バイラル・二次拡散** | ねとらぼ · Yahoo!ニュース · はてブ | 軽いお悩み解決 |

**特化枠（必要時のみ）:** F プライバシー/セキュリティ · G UX/デザイン · H 法務制度

| 優先 | チャネル / メディア | やること |
|------|---------------------|----------|
| **P0** | X + 固定ピン · **Zenn** · Qiita · はてブ | 自分発信（§14-3 Tier1） |
| **P1** | 窓の杜 · GIGAZINE · ITライフハック · ライフハッカー · @IT · Vector | 掲載申請 / 読者投稿 |
| **P2** | ASCII · 日経xTECH · ねとらぼ · ツールまとめ · マイクロインフルエンサー | 余力時 |
| **P3** | PR TIMES · TC Japan · SmartNews直接 | pending / 初動後 |

| ツール / 切り口 | 最優先軸 |
|-----------------|----------|
| invoice（非送信・インボイス） | **B → C → A** |
| warikan / shift | **A → C** |
| 開発者ストーリー | **D → A** |
| ポータル9本 | **B** |

**実行順（同時3本）:** Xピン+W1 → **Zenn #1 予約済** → invoice GIF · **公開日 X 連動** · 次週 Qiita → 窓の杜/Vector検討 → まとめサイト1件

### 14-8. Zenn 運用（note より優先 · 2026-06-18）

**なぜ Zenn:** Tech/個人開発読者に届きやすい · 実装・設計の信頼が積み上がる · 被リンク品質が note より検索向き。note は「5分使い方」など案Cの補助（P2）。

| 項目 | 方針 |
|------|------|
| **ペルソナ（Zenn読者向けトーン）** | 案A — 静かな実務職人・カオル（`operator-profile.md` L2）· **プロダクトの想定ユーザー像は** [`DESIGN_GUIDELINE.md`](DESIGN_GUIDELINE.md) §1.1 |
| **文体** | です・ます · 礼賛しない · 社名・勤務先は出さない |
| **初稿** | 「見積下書きを請求書に転用するまで」+ `sugudasu.com/invoice` |
| **頻度** | 月2〜4本（更新時 + 背景1本） |
| **混ぜ方** | 本丸A · 月1までB（開発エピソード）· note にCを逃がす |

**タグ例:** `#個人開発` `#フリーランス` `#インボイス` — ハッシュタグ盛りすぎない

**Gemini 企画:** `docs/prompts/zenn-editorial-gemini.md`（テーマ・スケジュールのみ · 本文は提督執筆）  
**Gemini 聞き方・API:** `docs/prompts/GEMINI_COLLABORATION_GUIDE.md` · `scripts/gemini/editorial-plan.mjs`  
**採用プラン:** `docs/notes/ZENN_EDITORIAL_PLAN.md`（§2 テーマ10 · 6〜8月5本 · #1 P0）

**#1 ステータス（2026-06-18）**

| 項目 | 状態 |
|------|------|
| タイトル | 登録不要で、見積の下書きを請求書に転用するまで |
| 投稿 | Zenn **予約投稿済み**（スクショ差し替え済） |
| ドラフト | `docs/notes/ZENN_ARTICLE_01_DRAFT.md`（Zenn エディタが公開時の正本） |
| 残 | 公開当日〜翌日 X で URL 共有 · Zenn URL 控え |

### 14-9. 幹事さん型 LPマーケ — プロダクト追加オペ（2026-06-22）

**SSOT:** [`docs/prompts/kanji-san-lp-patterns-gemini.md`](prompts/kanji-san-lp-patterns-gemini.md)  
**行列正本:** `data/lp-marketing-matrix.json`  
**生成物:** `npm run generate:marketing-context` → `docs/prompts/GEMINI_MARKETING_CONTEXT.generated.md`

#### 背景（なぜこの仕組みか）

- [幹事さん](https://kanji-san.com/) は「△の聞き直しが消える」という **Pain起点コピー** で差別化している（参考: [note記事](https://note.com/emanuele/n/n1a7b5f65cdf6)）。
- SUGUDASUはツールが増えるほど **LP・FAQ・X文案がバラつきやすい**。プロンプトをツールごとに複製すると陳腐化する。
- そこで **型（A-D）は固定** · **ツール行列はJSONで増やす** · **事実は registry から自動生成** の3層に分離した。

#### 思想（コピー設計の原則）

| 原則 | 内容 |
|------|------|
| **1 Pain · 1 Tool** | ポータル羅列ではなく、各ツールに「△相当の曖昧さ」を1行で置く |
| **機能ではなく手戻り** | 型B — 「できること」より「消える連絡・確認」 |
| **完了まで閉じる** | 型C — 出力後の次アクション（幹事さんの店予約・カレンダー相当） |
| **信頼を先に** | 型D — 保存 · 共有 · 削除（statements / privacy と突合） |
| **競合名指し禁止** | 構造だけ借りる。誹謗・比較表での名指しはしない |
| **planned は要確認** | 未実装ツールを Gemini が実装済みと断定しない |

#### 型A-D 早見

| 型 | 幹事さんでの例 | SUGUDASUでの例 |
|----|----------------|----------------|
| **A** | △って来るの？ | 班分けのドタキャン聞き直し |
| **B** | 5段階で聞き直し不要 | 請求書PDF + 送付文成形 |
| **C** | 店予約・カレンダー接続 | 割り勘後のLINE精算文 |
| **D** | 編集可 · 90日削除 | 抽選の証跡 · 名簿非送信 |

#### 新規ツール追加時オペ（Agent / 提督共通）

| # | 作業 | 正本 | 完了条件 |
|---|------|------|----------|
| **N1** | registry 登録 | `data/tool-registry.json` | `npm run validate:tool-naming` OK |
| **N2** | HTML · hub · shell | `TOOL_NAMING_AGENT_PLAYBOOK.md` | naming guard OK |
| **N3** | マーケ行列に1行追加 | `data/lp-marketing-matrix.json` | primaryPain · primaryType · deltaProblems |
| **N3b** | TOOL_FACTS 骨格 | `npm run scaffold:tool-facts` | `data/tool-facts/{id}.json` 作成 |
| **N3c** | TOOL_FACTS レビュー | `data/tool-facts/{id}.json` | status=reviewed · 実装と突合 |
| **N4** | 束への所属を決める | 同上 `bundles[]` | 新ツールを既存束 or 新束に追加 |
| **N5** | 生成物更新 | `npm run generate:marketing-context` | 3ファイル更新 |
| **N6** | Gemini 型A-D | `kanji-san-lp-patterns-gemini.md` | 該当束で1型ずつ · 表のみ |
| **N7** | Grok 第2パス | 同ファイル §9 | 採用候補のみ |
| **N8** | 事実突合 | statements · privacy · registry | planned 表記の除去（実装後） |
| **N9** | LP反映 | `tools/{id}.html` | FV · FAQ · 3ステップ |
| **N10** | changelog | `data/changelog.json` | ユーザー向け変更を追記 |
| **N11** | デプロイ | `DEPLOY_CLOUDFLARE_PAGES.md` | `release:pages:free` → push |

**registry のみ先行 · 実装前（planned）のとき:** N1-N3 · N5 · N6（型0のみ）まで。LP断定コピーは **要確認** のまま。

**既存ツールのLP改善のみ:** N3（Pain更新）· N5 · N6-N9。

**warikan 製品方針（2026-06-23 · 提督決定）**

| 項目 | 方針 |
|------|------|
| **主眼** | ① **幹事の手間を減らす** ② **幹事の心理的ハードルを少しでも減らす**（幹事役そのものの面倒さは消せない） |
| 傾斜モデル | **グループ**（係数×人数）が主戦場。個人名簿1画面統合はしない |
| 多回参加 | 1次会/2次会/3次会は**回ごとに別計算**。任意参加の次会は参加者だけで再度 `warikan` |
| 丸め | **LRM（最大剰余法）** — 集金総額＝お会計。`data/tool-facts/warikan.json` 参照 |
| 心理 | 清算文の**公の感謝** · **個別に聞かれたとき**即答文（「いくら出せばいい？」）· 幹事の計算ミス疑念を消す透明化 |

#### Gemini / Grok 役割（LP専用）

| AI | やる | やらない |
|----|------|----------|
| **Gemini** | 型0振り分け · 型A-D表 · ペルソナ別Pain · FAQ案 | 長文LP執筆 · 未実装断定 · 礼賛 |
| **Grok** | 型A-D表の口語化 · AI味除去 | 表構造変更 · 事実追加 |
| **Cursor/提督** | registry/matrix更新 · HTML反映 · deploy | Gemini案の無批判採用 |

#### チェックリスト（プロダクト追加の Definition of Done）

- [ ] `tool-registry.json` + naming guard
- [ ] `lp-marketing-matrix.json`（priority · deltaProblems · bundle）
- [ ] `generate:marketing-context` 実行済み
- [ ] 型AのFV見出し1本以上をHTMLに反映（または backlog で次スプリント明示）
- [ ] 型DのFAQ3問（保存/共有/削除）を privacy と矛盾なく記載
- [ ] changelog 追記
- [ ] `build:pages` OK

---

## 15) 新規ツール: 公平抽選チェック `fair-draw.html`（企画FIX · 実装中）

**状態:** **beta · v1.5.1**（2026-06-19）— Phase 0 + Phase 1 コア実装済 · 運用UX・証跡3点セット反映済  
**SSOT:** [`docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md`](notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md) — **別Agentは本ファイルを最初に読むこと。**  
**実装ログ（背景付き）:** **§1-9** · **§8-10**

### 15-1. 概要

| 項目 | 内容 |
|------|------|
| ファイル | `tools/fair-draw.html`（URL `/fair-draw`） |
| 価値 | Phase 0 景品チェック → Phase 1 公平抽選 → **監査証跡PDF** → **チャット発表用テキスト** |
| ターゲット | マーケ部・幹事（一般キャンペーン **メイン** / 社内イベント **サブ** · 箱なし・スマホ即抽選） |
| 提督FIX | PDFに景品名・金額を載せる（証跡）。LLM判定禁止。e-Govリンク常設。 |

### 15-2. 実装タスク（チェックリスト）

- [x] **P0-1** `data/prize-law-rules.json`（告示突合・`version` 付き）
- [x] **P0-2** `data/prize-law-patterns.json`（P01〜**P15** 揉め事カード）
- [x] **P0-3** `assets/prize-law-eval.js` + `scripts/prize-law-eval.test.mjs`（**23本** pass）
- [x] **P0-4** `tools/fair-draw.html` Phase 0（景品チェック + PDF/JSON）
- [x] **P1-1** Phase 1 公平抽選（Fisher-Yates + Web Crypto + シード表示 · `runBandDraw`）
- [x] **P1-2** 赤フラグ時の「自己責任で続行」ゲート
- [x] **P1-3** Hub · `sugudasu-shell.js` ナビ · `changelog.json` · OGP/FAQ
- [ ] **P2-1** ~~宴会モード（演出UI）~~ — **スコープ外**（会場上映はチャット画面共有・PPT。公平抽選+証跡までが製品境界）
- [x] **P1-4** 公平抽選完了後の **チャット・発表用テキスト** ワンタップコピー
- [x] **P1-4b** 運用コピー強化 — TSV · 1行1名 · 連絡文 · 賞帯表デフォルト（§1-9）
- [x] **P1-4c** 証跡3点セット — 名簿txt自動DL · 実施者必須 · **キャンペーン識別名必須**（§8-10）
- [x] **P1-5** FAQ「統制システムではない」・Excel差・名簿指紋・監査なしでも使う意味（JSON-LD同期）
- [x] **P1-5b** FAQ「Xフォロー・リプライ抽選の応募者名簿はどう集める？」— 本ツール外・手動/別ツール・名簿入力ヒント
- [x] **P1-5c** FAQ 複数コース/口数/Wチャンス — 名簿重複行・Excel分割・複数回実行（P12–P15連動）
- [ ] **P2-2** 検証タブ（JSON再計算一致）— 実装後、発表テキストに検証導線を追記可
- [ ] **P2-2b** 3点セット **単一ZIP** 一括DL
- [ ] **P2-3** Zenn 記事（景表法チェック / Excel抽選卒業）— 初稿 [`ZENN_ARTICLE_11_DRAFT.md`](notes/ZENN_ARTICLE_11_DRAFT.md) · #14 後公開推奨
- [ ] **P2-4** `LOTTERY_PRIZE_LAW_TOOL_SPEC.md` Phase1 証跡節の正式追記（campaignLabel · 3点セット · 並行CP）

### 15-6. 2026-06-19 スプリント — 運用UX・証跡（背景まとめ）

**きっかけ:** 抽選結果が「当選者が見えない」「カード表示は発表向きで Excel/DM に使えない」という運用フィードバック。  
**合意:** 製品は **幹事の作業台** に寄せ、**どのCPの証跡か** を必須メタに含める。

| 論点 | 問題 | 決定 | 根拠 |
|------|------|------|------|
| 結果表示 | 大きいカードはコピー不能 | 表/1行1名 + TSV がデフォルト | §8-10-1 |
| 発表演出 | Zoom/PPT需要 | 製品スコープ外 | §8-9 · §15-4 |
| 名簿の残し方 | PDFだけでは全文が無い | 実行時 `roster-*.txt` 自動DL | §8-10-2 |
| 誰が回したか | SSOなし | `conductedBy` 必須（自己申告） | 統制SaaSではない境界 |
| どのCPか | 並行キャンペーンで混線 | `campaignLabel` 必須 · ファイル名に slug | §8-10-3 |
| CP名の復元 | 前回名が残ると取り違え | **sessionStorage に保存しない** | 並行CP優先 |
| 実施者の復元 | 同一担当の連続作業 | sessionStorage で復元可 | 入力手間削減 |
| P12–P15 | コース/口数の複雑さ | FAQ + 名簿運用 · UI増やさない | §8-10-4 |

**触った主ファイル:** `tools/fair-draw.html` · `assets/prize-law-eval.js` · `assets/sugudasu.css` · `data/prize-law-patterns.json` · `data/prize-law-campaign-meta.json` · `data/tool-registry.json` · `data/changelog.json`

**確認:** `npm run build:pages` · `node scripts/prize-law-eval.test.mjs`（23 pass）· `http://localhost:8080/tools/fair-draw.html?tab=draw`

### 15-5. GTM — 懸賞天国 SNS 掲載アカウントの手動フォロー（スクレイピング禁止）

**方針:** [懸賞天国](https://www.knshow.com/list/) の SNS 別一覧は **懸賞・プレゼント企画を回している見込み客のインデックス**。自動収集は **しない**（ToU・メンテ・ブロック）。**ちまちま手動フォロー**でリーチを積む。

| 入口 | URL | fair-draw との接続 |
|------|-----|-------------------|
| X | https://www.knshow.com/twitter/ | Step 0「SNSフォロー・リプライ → 抽選」 |
| Instagram | https://www.knshow.com/instagram/ | 同上（ビジュアル懸賞幹事） |
| LINE | https://www.knshow.com/line/ | チャット応募・公式懸賞 |
| Facebook | https://www.knshow.com/facebook/ | メディア・店舗ページ懸賞 |

- [ ] **P2-GTM-1** 手動フォローリスト（スプレ1枚: アカウント名 · 媒体 · フォロー日 · メモ）— **スクレイピング代替**
- [ ] **P2-GTM-2** フォロー先へのたまの価値リプ（売り込みではなく幹事あるある · `fair-draw` はプロフィール固定）
- [ ] **P2-GTM-3** 訴求1行例を X 固定 or ピンに置く:「SNS懸賞の景表一次チェック＋公平抽選PDF（統制システムではない）」

**やらないこと:** サイトスクレイピング · 一斉DM · 「内部監査システム」訴求

---

- **P1（高）** — 店長個人の次機能候補。マーケ×監査ニッチで `present.html` と補完関係。
- **2026-06-19:** P0–P1 コア + 運用UX・証跡3点セット **実装済**（§1-9）。残: 検証タブ · ZIP · Zenn · spec追記。

### 15-4. 意思決定ログ（§8 追記分）

- **背景:** マーケは監査同席で Excel `RAND()`。法務なき企業は景表法を ChatGPT に聞きがち。
- **思想:** 法令本文は読ませない。ルール表＋揉め事カード＋証跡PDF。断定しない。
- **2026-06-19 境界FIX:** 宴会演出は却下。スマホで箱・用紙代替＝抽選オペのデジタル化＋チャットコピー（上映はチャット画面共有）。Gemini案の検証URLは検証タブ後まで載せない。
- **2026-06-19 GTM:** 懸賞天国の X/IG/LINE/FB 一覧は見込み客インデックス。手動フォロー（§15-5）。スクレイピングはしない。
- **2026-06-19 運用UX・証跡:** 結果UIを幹事作業台に寄せ、証跡3点セット（名簿txt · PDF · JSON）+ キャンペーン識別名・実施者必須。詳細 **§8-10 · §1-9 · §15-6**。
- **注意:** Gemini 案の総付上限「20%」は誤り。正しくは 1,000円以上で **10%**（実装時に告示再確認）。
