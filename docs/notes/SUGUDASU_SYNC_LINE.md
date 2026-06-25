# SUGUDASU Sync — ブランドライン SSOT

**更新**: 2026-06-25（v2.1 · 同期プロトコル · 機能間非依存 · **同時端末上限価格**）  
**リポジトリ**: `C:\asl_dev\sugudasu`  
**ステータス**: 戦略確定 · **コア timeline 実装中** · **Sync プレースホルダー本番配信中**（`sync.sugudasu.com` · S1 開発フェーズ）

> **別Agentへ:** コア無料ツールは `PRODUCT_IDEA_JUDGMENT_LEDGER.md` F1–F7。**Sync は別ライン** — 本ファイルが正本。初回ツール **T13-S 進行 Sync** · エンジン共有は `TIMELINE_TOOL_SPEC.md`。

---

## 0. なぜ別ラインか

| 課題 | コア SUGUDASU だけでは | Sync で足す |
|------|------------------------|-------------|
| 当日の進行変更 | 1人が編集 → コピペで配信 | **全員の画面が追従** |
| スマホ現場 | アプリ切替 · 古い版リスク | **閲覧 URL 1本** |
| 事前準備 | localStorage / JSON 手渡し | **クラウド下書き · テンプレ** |
| 憲法 F3 | 静的 · 同期サーバ × | **Sync ドメインで例外** |

**提督判断:** 真の Solution（配信・共有）が **使い続ける理由** になる。コアは F1「登録なしで完結する実務」を維持し、Sync は **上乗せ（任意）**。

**ペルソナ分割（2026-06-24）:**

| 像 | ライン | 理由 |
|----|--------|------|
| **小規模 · 進行係1人** | **コアのみ** | コピー1回で足りる · Sync 不要 |
| **司会・音響・複数関係者** | **Sync** | Push/Pull で常に同じ版を見せる |
| **運営デスク＋会場進行**（当日の差し込みが多い） | **Sync**（編集者2 · S4） | 受付が行追加 · 会場が ±5 · 閲覧者は手動反映 |

Sync は **全イベントの必須ではない**。コアと Sync は **併存** する。

---

## 1. ブランド定義

| 項目 | コア **SUGUDASU** | **SUGUDASU Sync** |
|------|---------------------|-------------------|
| 入口 | `sugudasu.com` | **`sync.sugudasu.com`**（インフラ: [`SYNC_INFRA_CLOUDFLARE.md`](SYNC_INFRA_CLOUDFLARE.md)） |
| 登録 | 不要 | **アカウント必須** |
| データ | ブラウザ内 · 非送信 | **クラウド保存**（イベントスコープ） |
| 共有 | コピー · 印刷 · JSON 手渡し | **Push/Pull 同期 · 「新しい版があります」**（§3-3） |
| 広告 | AdSense（現状） | **なし** |
| 課金 | 無料 | **有料**（下記 §4） |
| 憲法 | F1–F7 厳守 | F1 コアは人質にしない · F3 緩和 |

**UI 正本:** [`../DESIGN_GUIDELINE_SYNC.md`](../DESIGN_GUIDELINE_SYNC.md) · Schedule Notion 層 [`DESIGN_GUIDELINE_NOTION_LIKE.md`](../DESIGN_GUIDELINE_NOTION_LIKE.md) · 色マップ [`notes/DESIGN_NOTION_SUGUDASU_ADAPT.md`](notes/DESIGN_NOTION_SUGUDASU_ADAPT.md)

**傘ブランド:** `SUGUDASU Sync`  
**課金ティア名（案）:** `Sync Pro` — 広告非表示 + 共有上限 + 履歴 等

### 1-1b. URL 統治（LP とアプリ分離）

| 種別 | 正規URL |
|------|--------|
| コア無料アプリ | `https://sugudasu.com/timeline` |
| Sync LP（販売ページ） | `https://sync.sugudasu.com/` |
| Sync 実作業アプリ | `https://sync.sugudasu.com/timeline` |
| Sync 共有URL（現場） | `https://sync.sugudasu.com/e/{event_public_id}` |

**運用:** 課金流入は LP に着地させ、LP からログイン/開始へ遷移。`/timeline` を直接広告着地に使わない。共有リンクは `/e/{event_public_id}` を固定し、IA変更で壊さない。

**URL/SEO 正本:** [`SYNC_URL_INFORMATION_ARCHITECTURE.md`](SYNC_URL_INFORMATION_ARCHITECTURE.md)

**STATEMENTS との関係:** `docs/notes/STATEMENTS_PAGE_DRAFT.md` の「将来 Pro」は **Sync ラインに具体化**。コアの約束（班分け等の非送信）は **変更しない**。Sync 専用の公開約束ページは **`docs/notes/STATEMENTS_SYNC_PAGE_DRAFT.md`**（想定 `sync.sugudasu.com/statements` · **未実装**）。

### 1-2. LP 必須方針（提督確定）

**Sync 系プロダクトは LP を必須**とする。  
理由: 有料導線では「なぜ今お金を払うか」を短時間で納得させる必要があり、機能説明だけでは CVR が不足するため。

| 項目 | 方針 |
|------|------|
| 対象 | `sync.sugudasu.com` 配下の有料導線（T13-S 以降すべて） |
| 必須要素 | 課題→解決、料金、同時端末上限、導入手順、FAQ、返金/保存ポリシー |
| NG | 価格のみ先出し・機能列挙のみ・上限非開示 |
| 受け入れ | LP 未整備のまま課金導線を本番公開しない |

### 1-1. 開発コード — 初回ツール `timeline-sync`（提督確定 · 2026-06-24）

| 層 | コア **T13** | **T13-S · Sync** |
|----|--------------|------------------|
| **Ledger** | T13 | **T13-S** |
| **registry `id`** | `timeline` | **`timeline-sync`** |
| **productName** | SUGUDASU イベント進行 | **SUGUDASU Sync イベント進行** |
| **conceptName** | 進行タイムライン | 進行タイムライン（エンジン共有） |
| **navLabel** | 進行 | 進行 |
| **URL** | `sugudasu.com/timeline` | **`sync.sugudasu.com/timeline`** |
| **エンジン** | `timeline-engine.js` | **同一 import** |
| **UI（案）** | `timeline-app.js` | `timeline-sync-app.js`（S1 以降） |
| **Chrome** | **通常**（16本ナビ） | **`focus`**（ナビなし · §7-1） |

**サイト掲載（提督 · 2026-06-24）:**

| 掲載 | コア `timeline` | Sync `timeline-sync` |
|------|-----------------|----------------------|
| hub カード | ◎ | **× ドメイン準備まで** |
| `tool-registry.json` · `inNav` | ◎ | **× 未登録**（SSOT のみ） |
| コア画面の Sync CTA | — | **× 同上** |
| 実装順 | **今** | **S1 以降 · ドメイン後に掲載判断** |

正本: 本節 + `TIMELINE_TOOL_SPEC.md` §1-2

---

## 2. F1 線引き（コアを人質にしない）

| 常に無料（コア） | Sync 有料でも奪わない |
|------------------|------------------------|
| 進行表の **連動再計算** | 1人で完結する編集・コピー・印刷 |
| アンカー行 · ±5分 | localStorage 下書き（コア） |
| プレーン / TSV コピー | エンジン `timeline-engine.js` は同一 |

| Sync で有料化してよい | 理由 |
|----------------------|------|
| **ライブ閲覧 URL**（司会・音響が追従） | サーバ・配信コスト |
| **クラウド下書き・テンプレ** | 永続化・バックアップ |
| **編集者2人・閲覧者N人** | 認可・同期 |
| **変更履歴・イベント終了後エクスポート** | ストレージ |
| **広告非表示** | Pro 価値の一部 |

| Sync でもやらない（Phase C / OUT） | 理由 |
|-------------------------------------|------|
| Zoom/Teams **自動配信開始** | OAuth · 従量 · STATEMENTS 明記 |
| **全員同時フル編集**（Google 表級） | 工数 · 競合に劣る |
| **T10 日程調整**（回答集約・リマインド） | 別 Pain · 調整さん領域 |
| **LLM 最適化** | F7 |
| コア機能の **ログイン必須ペイウォール** | F1 違反 |

---

## 3. ロードマップ — 4本柱 + 追加要素

### 3-0. 機能間の依存（提督方針）

**ロードマップ上の要素は、原則お互いに依存しない。** 単体で出荷・単体で価値がある。

| 例外（Sync ルーム内の必須コア） | 内容 |
|--------------------------------|------|
| **同期プロトコル** | Push **または** Pull で **常に** 最新 `revision` を追従（§3-3） |
| **「新しい版があります」** | 閲覧者が古い版を見ているとき **必須 UI**（§3-3） |

それ以外（RBAC · QR · 課金 · Webhook · 組織 WS 等）は **任意アドオン**。S2 で全部要らない。

### 3-1. 提督案の4本柱（キー）

| # | 柱 | 意味 | 最初のマイルストーン |
|---|-----|------|----------------------|
| **K1** | **アカウント登録** | メールマジックリンク or OAuth（Google）· 幹事1人から | Phase S1 |
| **K2** | **共有** | 1編集 · 多閲覧 · **Push/Pull 同期**（§3-3） | Phase S2 · **旗艦価値** |
| **K3** | **有料** | Stripe · イベント単位 or 月額（§4） | Phase S3 |
| **K4** | **NO 広告** | Sync 全域で AdSense ロードしない | Phase S1 から |

### 3-2. 追加要素（すべて任意 · 相互非依存）

| # | 要素 | 価値 | フェーズ目安 |
|---|------|------|--------------|
| **A** | 役割（RBAC） | 編集者 / 閲覧者 | S2+ |
| **B** | イベント単位ルーム | mental model | S1+ |
| **C** | 閲覧 QR · 短 URL | 会場オンボーディング | S2+ |
| **D** | 変更履歴一覧（Pro） | 事後監査 · 翌年テンプレ | S3+ |
| **E** | オフライン閲覧キャッシュ | 会場 Wi‑Fi | S3+ |
| **F** | データ削除・エクスポート | 信頼 FAQ · **ルーム手動削除** | S1+ |
| **G** | コア→Sync 持ち込み | 無料からの昇格 | S2+ |
| **H** | イベント終了後のテンプレ再利用 | **エクスポート → 取込**（クラウド永久保存ではない） | S3+ |
| **I** | 稼働ステータス | 当日安心 | S3+ |
| **J** | Webhook / Slack | チャンネルへ表だけ投稿 | S4+ |
| **K** | 組織ワークスペース | リピート幹事 | S4+ |

> **D と §3-3 の違い:** §3-3 は **最新版への追従**（必須）。D は **過去版の一覧**（Pro · 任意）。

### 3-3. 同期プロトコル（Sync 必須コア · 提督確定）

**閲覧者がルームにいる限り、Push または Pull のどちらかで常に同期する。** サイレントに古い版を見せ続けない。

#### データ

| フィールド | 説明 |
|------------|------|
| `revision` | 単調増加整数（編集のたびに +1） |
| `updatedAt` | ISO8601 · 表示用「最終更新 14:32」 |
| `payload` | `TimelineState` JSON（`timeline-engine` 互換） |

#### 配信経路（両方実装 · フォールバック）

| 経路 | 動作 | 優先 |
|------|------|------|
| **Push** | Realtime 購読 — 編集者保存で閲覧者に `revision` 通知 | 第一 |
| **Pull** | 閲覧画面が N 秒ごとに `GET /rooms/:id/head`（`revision` のみ軽量） | Push 不通時 · 省電力 |

#### 閲覧者 UI（必須 · 提督確定 2026-06-24）

**既定 = 手動反映。** 新版を検知しても **勝手に画面は書き換えない**。

```
localRevision < serverRevision のとき:
  固定バナー「新しい版があります（14:32 更新）」
  主 CTA [今すぐ反映]  — タップで payload 取得・再描画（明示的インプット）
  設定（折りたたみ）: [ ] 自動で反映する  — 既定 OFF · 任意オプトイン
```

| モード | 動作 | 既定 |
|--------|------|------|
| **手動反映** | Push/Pull で **新版を検知** → バナー表示のみ。反映は **[今すぐ反映]** タップ時 | **◎ 正** |
| **自動反映** | 検知と同時に `payload` 取得・再描画 | OFF · ユーザーが明示オン |

**手動既定の理由（提督）:**

- 司会が読んでいる途中で表が勝手に入れ替わる **事故を防ぐ**
- 「今すぐ反映」を押す = **確認のインプット** — 古い版のまま進行し続けるミスを減らす
- 自動反映は音響など **常に最新だけ見ればよい** 役割向けの例外

**技術:** Push/Pull は **検知まで** 常時動作。`payload` 全文取得は **手動反映タップ時**（自動 ON 時のみ即取得）。

#### マルチデバイス UX（提督確定 · 肝）

進行係＝多くは **スマホ編集** · 司会＝ **スマホ or タブレット閲覧** · 事前準備＝ **PC** もありうる。**端末ごとに最適化が製品価値の一部。**

| 端末 | 編集者 | 閲覧者 |
|------|--------|--------|
| **スマホ** | 1カラム · sticky フッター（±5 · 保存）· 編集/プレビュータブ | sticky 新版バナー · 全幅「今すぐ反映」 |
| **タブレット** | 1カラム推奨 or 狭2カラム | バナー + プレビュー一覧 · 横持ち可読 |
| **PC** | 2カラム（編集 \| プレビュー） | 閲覧専用 · バナー同様 |

詳細レイアウト: `TIMELINE_TOOL_SPEC.md` §7-2–§7-4

編集者画面: フッターに `rev.12 · 14:32 保存済み` · 閲覧者数（任意）

#### 受け入れ基準（S2）

- [ ] 編集者が +5分 → **5秒以内**に閲覧者バナー「新しい版があります」（Push または Pull）
- [ ] **既定では画面内容は変わらない** — [今すぐ反映] 後に時刻が更新される
- [ ] 閲覧者が古い版のとき **必ず** バナーが出る（サイレント更新なし）
- [ ] Push 切断時も Pull で **60秒以内**にバナー検知
- [ ] 自動反映 ON は設定で切替可能 · セッション内で記憶（localStorage）

**意図的に後回し:** フル共同編集 · カレンダー双方向 · ネイティブアプリ · OS プッシュ通知

### 3-4. ビューレーン（提督採用 · 2026-06-25）

**正本:** `docs/notes/timeline-sync-lanes-gemini-RESULT.md` · `TIMELINE_TOOL_SPEC.md` §7-5

| 論点 | 決定 |
|------|------|
| データ | **1本** `TimelineState` · 行ID・時刻は全役割で同一 |
| 表示 | **crew / stage / public** のビュープロファイル（2レーン以上は **UI** の話） |
| スキーマ | **案B** — `publicTitle`（司会・来場者）と `note`（= crewNote · クルーのみ） |
| 却下 | **案C** 2レーン別データ · 同期崩壊リスク |

| フェーズ | 出荷 |
|----------|------|
| S2 | 閲覧 URL = **stage**（司会 · 手動反映） |
| S2+ | **public** 閲覧（Signage · 最小表示） |
| S4+ | 役割別マルチ列は見送り — `crewNote` + crew ビューで代替 |

---

## 4. 課金モデル（案 · 製品ライン別）

| ライン | モデル | 向くペルソナ | メモ |
|--------|--------|--------------|------|
| **T13-S イベント進行** | **イベント単位**（例: ¥980/イベント · 7日間） | 年数回の幹事 | サブスク離脱と相性良 · **同時クラウド枠 3 まで** |
| **Schedule 工程表**（**提督確定 2026-06-26**） | **低額月額**（**¥200/月・アカウント** 案 · 年契可） | 提督 · 制作PM · Excel 工程係 | 正本 [`SYNC_SCHEDULE_PRODUCT_DECISION.md`](SYNC_SCHEDULE_PRODUCT_DECISION.md) · 日/時間 · 可変列 · A3 · xlsx Export のみ |
| **月額 Pro**（横断・案） | 例: ¥1,480/月 | 研修会社 · イベント会社 | 習慣課金は弱い · **同時枠 5 cap**（無制限はしない） |
| **無料トライアル** | 初回幹事 / Schedule 14日 | 初回体験 | **1イベント無料** or 閲覧3人まで — Hard ではなく価値体験 |

**Sync の aha! moment:** 進行係が +5分 → 司会に **「新しい版があります」** → 司会が **[今すぐ反映]** を押す → 全員同じ終了時刻。

### 4-0. 同時スタッフ端末の価格設計（採用）

正本: [`SYNC_CAPACITY_AND_PRICING_POLICY.md`](SYNC_CAPACITY_AND_PRICING_POLICY.md)

| 項目 | 初期値（案） |
|------|--------------|
| Event Base | ¥980 / event（同時スタッフ 5端末） |
| Device Pack +5 | +¥480（+5端末） |
| Device Pack +10 | +¥880（+10端末） |
| 1イベント上限（Free運用） | 35端末 |
| 1イベント上限（Pro運用） | 70端末 |

**方針:** 1イベント課金でも「同時スタッフ端末」を無制限にしない。上限は価格で段階提供。

### 4-1. Rundown 有料機能との対応（**提督採用確定** · 2026-06-24）

[Rundown 料金](https://rundownstudio.app/)（Event $410/20日 · Team 年額等）に並ぶ機能を **どこまでやるか** — **以下の表を正本として採用**。

| Rundown 機能 | 意味 | **コア（無料）** | **Sync（有料）** | フェーズ | 判定 |
|--------------|------|------------------|------------------|----------|------|
| **2 team members** | 共同編集者2人 | ×（1人端末） | **編集者2人まで**（閲覧者は別枠） | S4+ | Sync Pro |
| **Unlimited rundowns** | 進行表の作り直し無制限 | **◎ 無制限**（localStorage/都度新規） | **◎ クラウド同時枠あり**（trial 1 · 課金 3） | コア/Sync | コアで既に満たす |
| **Full access guests** | ゲストも編集可 | × | **× 既定** — 閲覧のみ。編集は **編集者枠**（上と同じ） | S2/S4 | 手動反映閲覧が既定 |
| **Prompter** | テレプロンプター | **OUT** | **OUT** | — | 別製品（放送） |
| **API control** | Stream Deck 等 | **OUT** | **Webhook のみ**（Slack 時刻表投稿）· 公開 REST は OUT | S4 | 最小連携のみ |
| **Import CSV** | 一括取込 | **v1.1** — Excel からの初回入力 | **Sync S3** 同等 | v1.1 / S3 | 幹事の摩擦削減 |
| **Export PDF & CSV** | 出力 | **印刷=PDF** · **TSVコピー=CSV相当** · 明示 CSV DL は **v1.1** | **Sync** クラウドから PDF/CSV | コア v1.1 | コアで大半カバー |

**提督向け要約:**

- **コアでやる:** 無制限作成 · 連動再計算 · TSV/印刷 · メモ · 残り時間（MVP）
- **Sync でやる:** 多端末 · 閲覧 URL · 編集者1→2人 · クラウド保存
- **やらない:** Prompter · フル API · ゲスト全員編集（Rundown の Full access guests 相当）
- **後追い:** CSV インポート · CSV ファイル DL（v1.1）

**価格ポジション:** Rundown Event **$410/20日** に対し Sync は **¥980〜/イベント** 帯を維持（幹事の使い捨て課金）。

### 4-2. 現場ニーズ — 当日の差し込み（提督 · 2026-06-24）

イベント当日、**事前の進行表に無かったコマ**が次々入るのは現場あるある。Excel だと行挿入で式が崩れ、司会・音響・投影に伝えるまで手作業が重い。

**典型例（スピーチに限らない）:**

| 種類 | 例 |
|------|-----|
| 挨拶・登壇 | 後援・スポンサー・来賓の挨拶 · VIP サプライズ登壇 |
| 式典・演出 | 表彰 · 記念撮影 · サプライズ演出 · 抽選 |
| 運営・設備 | 機材トラブル待機 · 搬入延長 · 会場アナウンス差し込み |
| コンテンツ調整 | 質疑延長 · 休憩延長 · セッション飛ばし（行削除） |

| 層 | 対応 | 操作像 |
|----|------|--------|
| **コア MVP** | **行挿入 / 削除** · `note` に担当・内容 · **終了予定の即時再計算** | 進行係1人がスマホで差し込み → TSV/プレーンコピーで共有 |
| **Sync S2** | 運営デスクが **1編集者** で表更新 → 司会・音響が **閲覧 URL + 手動反映** | 受付・控室で依頼を受けた瞬間に反映 · 会場はバナー確認後に同期 |
| **Sync S4** | **編集者2人** — 運営デスク（差し込み受付）と会場進行（±5 調整） | デスクが行追加 · 会場が前後コマを圧縮/延長 |

**設計上の約束:**

- 差し込みは **所要分 + タイトル + `note`（誰・何・移動先）** で足す — 独立 `speaker` 列は MVP 不要
- **撤収・閉会アンカー** がある場合は挿入直後に **終了予定 vs デッドライン** を表示（Rundown 早終了/オーバー相当）
- **ゲスト全員編集**（Rundown Full access guests）は採用しない — 差し込みは **編集者枠** または **幹事が代理入力**
- **±5** と **行挿入** はセット — 延びたコマの圧縮と、新コマ追加の両方が同日に起きうる

詳細シナリオ: `TIMELINE_TOOL_SPEC.md` §2-2 **S7**

---

## 5. 技術スタック（方針 · 未確定）

| 層 | 案 | 制約 |
|----|-----|------|
| フロント | コアと同じ静的 + Sync 専用 JS | `timeline-engine.js` 共有 |
| 認証 | Supabase Auth（クライアント + RLS） | 秘密は env · Git 禁止 |
| API | Cloudflare Pages Functions `/api/*` | S1: health · Stripe スタブ · S3: 課金 |
| 同期 | Supabase Realtime（**Push**）+ 軽量 **Pull** ポーリング | **S2** · §3-3 |
| 課金 | Stripe Checkout + Customer Portal | **S3** · `SYNC_S1_ARCHITECTURE.md` §2 |
| ホスティング | Cloudflare Pages（Sync サブドメイン） | コアと deploy 分離可 |

**S1 技術正本:** [`SYNC_S1_ARCHITECTURE.md`](SYNC_S1_ARCHITECTURE.md)

**コスト防衛:** Pull は `revision` のみ · Push 不通時フォールバック · 接続数上限 · **`retain_until` 自動パージ** · **ルーム数・payload 上限**（`SYNC_RETENTION_POLICY.md` · `SYNC_STORAGE_QUOTAS.md`）。

**フロント防衛:** Cloudflare Pages は通常ボトルネックではない。クレームを防ぐ主戦場はフロント実装（初回JSサイズ・描画量・再描画回数）で、性能予算は `SYNC_CAPACITY_AND_PRICING_POLICY.md` を正本にする。

---

## 6. フェーズ一覧

```
Phase 0  [今]     コア timeline MVP — 1人進行もここで完結
Phase S1          登録 · NO広告 · ルーム · クラウド保存（同期なしでも可）
Phase S2          共有の必須コア — Push/Pull · 「新しい版があります」· 閲覧 URL
Phase S2+         任意 — RBAC · QR · コア持ち込み · βダッシュボード（順不同）
Phase S3+         任意 — Stripe · 履歴一覧 · アーカイブ
Phase S4+         任意 — Webhook · 組織 WS
```

| Phase | 出荷物 | 必須/任意 | 成功指標（案） |
|-------|--------|-----------|----------------|
| **0** | `/timeline` コア | 必須 | 1人進行が完結 |
| **S1** | Sync α | 必須（Sync 立ち上げ） | 登録→保存→再開 |
| **S2** | **同期プロトコル** §3-3 | **必須（共有の芯）** | 新版バナー · 手動反映で時刻一致 |
| **S2+** | RBAC · QR · βダッシュボード | 任意 | 利用状況を可視化して改善判断 |
| **S3+** | 課金 · 履歴 · **LP** | 任意（ただし課金公開時は LP 必須） | 有料1件 |

---

## 7. 製品マップ（Ledger 連携）

| ID | 製品 | ライン | Tier |
|----|------|--------|------|
| **T13** | イベント進行（コア） | SUGUDASU | S |
| **T13-S** | 進行 Sync | SUGUDASU Sync | S |

将来候補（未 GO）:

| ID | 案 | 備考 |
|----|-----|------|
| T11-S | 班分け Sync | 名簿クラウド — プライバシー慎重 · 課金文案: [`GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md`](GROUP_SPLIT_SYNC_BILLING_CTA_AND_QUOTE.md) |
| X02-S | 日程テンプレ Sync | T10 縮小版とは別 |

---

## 8. マーケ・ナラティブ

**コア:** 「登録なし。1人進行なら、これだけで足りる。」  
**Sync:** 「関係者が増えたら。新しい版が来たら、誰も古い時刻で進行しない。」

**競合:** **[Rundown Studio](https://rundownstudio.app/)** が UI/機能の主参考。差別化は日本幹事 · 非送信コア · **スマホ縦** · Sync **手動反映** · イベント単位課金。live-board は別カテゴリ（参考にしない）。

---

## 9. 関連ドキュメント

| パス | 内容 |
|------|------|
| `docs/notes/TIMELINE_TOOL_SPEC.md` | コア / Sync 境界 · エンジン |
| `docs/notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md` | T13 · T13-S |
| `docs/notes/SYNC_DB_ARCHITECTURE.md` | DB メタ原則 · テーブル · 採用数値 |
| `docs/notes/SYNC_URL_INFORMATION_ARCHITECTURE.md` | URL構造 · IA · SEO正本 |
| `docs/notes/SYNC_CAPACITY_AND_PRICING_POLICY.md` | 同時端末上限 · 価格 · フロント性能予算 |
| `docs/notes/SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` | Event ID 衝突防止 · 2種ダッシュボード |
| `docs/notes/SYNC_META_PLATFORM_GUARDRAILS.md` | Sync系共通のメタ基盤・死角・優先検証軸 |
| `docs/notes/SYNC_IMPLEMENTATION_TASKS.md` | S1.5→S2 実装タスク（着手順） |
| `docs/notes/SYNC_RETENTION_POLICY.md` | 保持期限 · 削除 |
| `docs/notes/sync-db-architecture-gemini-RESULT.md` | Gemini 調査原文 |
| `docs/notes/SYNC_STORAGE_QUOTAS.md` | 同時ルーム上限 · JSON エクスポート |
| `docs/notes/REVENUECAT_SOSA_SUGUDASU_SSOT.md` | 課金・初回価値（Stripe 方針は Sync アーキ参照） |
| `docs/notes/STATEMENTS_PAGE_DRAFT.md` | コア公開約束 · Pro 文言 |
| `docs/notes/STATEMENTS_SYNC_PAGE_DRAFT.md` | **Sync 専用約束**（未実装 · `sync.sugudasu.com/statements`） |
| `docs/notes/SYNC_SCHEDULE_PRODUCT_DECISION.md` | **工程表 Schedule ライン** — 提督確定 · ¥200/月 |
| `docs/notes/SCHEDULE_TOOL_SPEC.md` | **Schedule 仕様 SSOT**（親ID · 日/時間 · A3 · xlsx Export） |
| `docs/BACKLOG.md` §0 | コア前提（Sync は §追記参照） |
