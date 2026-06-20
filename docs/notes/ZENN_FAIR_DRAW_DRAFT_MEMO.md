# Zenn 向け fair-draw 記事ネタ — 備忘録

**更新:** 2026-06-19  
**状態:** ドラフト未着手 · アイデア置き場（執筆時に1本に絞る）  
**実装背景:** `docs/BACKLOG.md` §1-9 · §8-10 · §15-6  
**製品SSOT:** `docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md`

---

## 使い方

- ここは **Zenn エディタにそのまま貼らない** メモ。公開前は `ZENN_ARTICLE_XX_DRAFT.md` に昇格させる。
- **1記事1尖り** — 下の案A〜Eは全部書くと散漫。カレンダー空き（8月以降 P2 想定）で1本選ぶ。
- **トーン:** `ZENN_EDITORIAL_PLAN.md` §1 · 案A 7割（実務職人）+ 案B 3割（Web Crypto / 静的配信は補助段落）。
- **禁止:** 「合法/違法」「100%公平」「内部監査システム」· 競合SaaS名 · 未実装（検証タブ · ZIP一括）。

---

## 候補タイトル（5案 · 優先メモ付き）

| 案 | 仮タイトル | 軸 | 刺さる読者 | 優先 | utm_campaign 案 |
|----|-----------|-----|-----------|------|-----------------|
| **A** | Excelの `RAND()` から卒業する — ブラウザだけで公平抽選と説明用PDF | A | マーケ · 幹事 · 店舗イベント担当 | **★ 第一候補** | `article_11_fairdraw_excel` |
| **B** | 景品表示法を ChatGPT に聞く前に — ルール表と「揉め事カード」で一次整理 | A | SNS懸賞 · 小規模EC · 法務なき組織 | ★ 第二候補 | `article_11_fairdraw_prizelaw` |
| **C** | 抽選の「証跡3点セット」 — 名簿txt · PDF · JSON をローカルに残す理由 | A+B | 説明責任が残る幹事 · 個人開発者 | 第三候補 | `article_11_fairdraw_proof` |
| **D** | Web Crypto で Fisher-Yates — 再現可能な抽選をサーバーなしで | B | フロントエンド · 個人開発 | 被リンク弱め · #2 補助 | `article_11_fairdraw_crypto` |
| **E** | SNS懸賞の名簿は本ツールでは取らない — 境界設計の話 | B | エンジニア · プロダクト | note/Qiita寄りも可 | `article_11_fairdraw_scope` |

**編集部メモ:** 案AかBを表に出し、Cの「3点セット」「キャンペーン識別名」を **実務パートに1節** 入れるのがバランス良さそう。D単体は読者狭い。

---

## 案A+B 合体 — 執筆しやすい1本の骨子（推奨メモ）

**仮タイトル:** `SNS懸賞の抽選を Excel からやめた話 — 公平シャッフルと説明用PDF（サーバー送信なし）`

### リード（メモ）

- 幹事あるある: 監査がいないのに Excel `RAND()` · 再計算で数字が変わる · あとから「その名簿で？」と聞かれる。
- 統制SaaSは高い · ChatGPT は断定とハルシネーション — **その間** を埋める無料ブラウザツールを作った、という距離感。

### H2 案

1. **Excel `RAND()` が説明に弱い理由**（再計算 · 名簿スナップショットなし · シードなし）
2. **Phase 0 — 景表法は LLM に聞かない**（揉め事カード P01–P15 · 黄/赤フラグ · e-Gov リンク · 断定しない）
3. **Phase 1 — 名簿貼付 → Fisher-Yates + Web Crypto**（`crypto.getRandomValues` · シード表示 · 再現の話は「検証タブはこれから」程度）
4. **幹事向けに UI を「発表台」から「作業台」にした**（表/TSV/1行1名 · 大画面演出は PPT 任せ · なぜそうしたか）
5. **証跡3点セット** — 名簿 `.txt` 自動DL · 監査PDF · JSON · **キャンペーン識別名**（並行CPで混線しない）
6. **やらないこと**（X API · 名簿スクレイピング · 統制SaaS · 合法判定）

### CTA

- Phase 0: `https://sugudasu.com/fair-draw?tab=check&utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel`
- Phase 1: `https://sugudasu.com/fair-draw?tab=draw&utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel`
- 前処理: `https://sugudasu.com/normalize?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel`（名簿正規化 · 1行だけ）

### スクショ / GIF 候補

| # | 内容 | 用途 |
|---|------|------|
| 1 | Phase 0 揉め事カード + 黄フラグ | 景表法パート |
| 2 | 抽選タブ — CP名 · 実施者 · 名簿 | 必須入力の説明 |
| 3 | 結果 — 賞帯表 + TSVコピー | 作業台UI |
| 4 | 証跡バー（シード · SHA-256 · CP名） | 技術+実務 |
| 5 | ダウンロードした `roster-*.txt` ヘッダ | 3点セット |
| 6 | 監査PDF 1ページ目 | aha! |

### 技術メモ（Zenn 向け · 段落に散らす）

- `assets/prize-law-eval.js` — `evaluatePrizeLaw` · `runBandDraw` · `sha256Hex` · テスト23本（信頼の一言）
- データ: `prize-law-rules.json` · `prize-law-patterns.json`（version 付き · 告示差し替え運用）
- ビルド: 静的 `dist/` · Cloudflare Pages · **リクエスト時 PostgREST なし**（invoice 記事と同型の非送信 narrative）
- sessionStorage: **実施者のみ** 復元 · CP名は毎回入力（並行キャンペーン設計）

### 字数 · 配分

- 1,800〜2,400字 · 実務7 : 技術3
- コードブロックは **10行以内**（Fisher-Yates 核心 or 名簿ヘッダ例のみ）

---

## 切り口別 — 1段落ネタ（拾い物）

### 運用UX（幹事向け · 案A/C）

- 当選者リストは **Excel にそのまま貼る TSV** がデフォルト。カードUIは見栄えが良いがコピー不能だった。
- 空行と重複は **別カウント** — 「有効120 · 重複3」と表示（口数設計ミスの早期発見）。
- 複数コース / 口数2倍 / Wチャンスは **UI を増やさず** FAQ + 名簿重複行 + Excel分割 + fair-draw 複数回。

### 景表法（マーケ向け · 案B）

- P12 複数コース · P13 複数SNS · P14 購入ティア · P15 紹介 — **2026-06 追加**。抽選エンジンは共通。
- ChatGPT との差: **根拠のある数値チェック** + 揉め事パターン + PDF 証跡。条文解釈はしない。
- 社内イベント（ビンゴ）と対外懸賞の **Step 0 分岐** — 同じ URL · 用途でトーンが変わる。

### 証跡 · コンプラ（説明責任 · 案C）

- **3点セット:** 名簿スナップショット txt · 監査PDF · 抽選JSON — ハッシュだけでは中身が検証できない。
- **キャンペーン識別名必須** — CPページのスクショは「企画仕様」、識別名+txtは「その回の抽選」。並行CPでフォルダが混線する現場向け。
- **conductedBy** — SSO なしの自己申告。統制SaaSではないが、空よりマシ、という honest ポジション。

### 個人開発（案B/D/E）

- **製品境界:** X ログインなし · 返信スクレイピングなし · 懸賞天国リストも手動フォローのみ（Backlog §15-5）。
- **RevenueCat SOSA 転用:** fair-draw の aha! = 初回セッションで PDF + コピー（`REVENUECAT_SOSA_SUGUDASU_SSOT.md`）。
- **おっちょこガード:** テスト/本番バナー · 名簿行数バッジ（`SUGUDASU_OOPS_GUARDRAILS.md`）— 記事では「人間のミスを UI で減らす」1段落。

### SEO · 公開タイミング

- 検索意図（spec §8）: 社内抽選 公平 / 景品表示法 チェック / 懸賞 上限 / 景品 抽選 ツール
- **時事フック:** 景表法ニュースが出た週に案Bを足す · 年末 SNS 懸賞シーズンに案A
- **内部リンク:** Zenn #1 invoice（非送信）· #2 開発裏側 · normalize（名簿前処理）

---

## 書かないこと（法務 · ポジション）

- 「合法」「違法」「問題なし」の断定
- 「監査対応」「内部統制」「SOC2」級の暗示
- 総付上限 20% 等の **Gemini 誤情報**（正: 1,000円以上で 10% — 実装時告示再確認）
- 競合の懸賞SaaS / Notarius 等との優劣
- 検証タブ · ZIP一括 · X API — **未実装**

---

## カレンダー上の置き場（案）

| 時期 | 案 | 備考 |
|------|-----|------|
| 8月 P2 | 案A+B 合体 | #3 warikan / #4 shift の後 · fair-draw beta 安定後 |
| 9月以降 | 案B 単体 | 景表法トピックが出たタイミング |
| note 向け | 案E 短縮 | 「5分で fair-draw」· Zenn から link |

`ZENN_EDITORIAL_PLAN.md` §2 テーマ表への正式追加は **執筆1週前** でよい（#11 行として）。

---

## 公開後 X 連動（メモ · 未整形）

- フック: 「Excel RAND() やめた · 名簿txtまで残る · サーバー送信なし」
- 固定ピン v2 とは別投稿 · fair-draw スクショ1枚 + Zenn URL
- 文案テンプレ: `docs/notes/X_POST_ZENN01_LAUNCH.md` を流用

---

## 次アクション（執筆時）

- [ ] 上記5案から **1本に確定**
- [ ] `ZENN_ARTICLE_11_DRAFT.md` 作成（#1 ドラフト形式に合わせる）
- [ ] スクショ6枚 · 必要なら GIF（貼付→抽選→TSVコピー 15秒）
- [ ] `ZENN_EDITORIAL_PLAN.md` §2 に #11 行追加 · `BACKLOG.md` §15 P2-3 を `[x]` 化
- [ ] 公開後 `changelog.json` + 任意で `updates.html`
