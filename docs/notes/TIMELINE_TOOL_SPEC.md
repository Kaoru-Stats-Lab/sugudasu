# イベント進行タイムライン — 仕様SSOT（T13 · M01 · 別Agent引き継ぎ用）

**更新**: 2026-06-24（要件 v2 · Sync ライン分離 · Phase 0 実装着手可）  
**リポジトリ**: `C:\asl_dev\sugudasu`  
**ステータス**: **コア要件確定** — `sugudasu.com/timeline` · Sync は別 SSOT

> **別Agentへ:** 本ファイル = **コア（無料）**。共有・同期・有料は **`docs/notes/SUGUDASU_SYNC_LINE.md`**（T13-S）。続けて Ledger **T13** · Backlog **§1-12 M01** · `GROUP_SPLIT_TOOL_SPEC.md` · `DESIGN_GUIDELINE.md` §3.8。

---

## 0. この文書の立場（イベンター × アーキテクト）

| 視点 | 問い |
|------|------|
| **イベンター（主催・司会・ファシリ）** | 当日「5分押した」のを、誰が・いつ・何分削って直すか。Excel の手計算で司会台本が壊れないか |
| **システムアーキテクト** | その操作を **非送信・1端末・静的配信** で、既存 SUGUDASU パターン（`sg-segment` · `sg-copy-feedback` · 印刷分離）に収まる最小コアは何か |

**一言:** 進行表の **1コマ変更 → 後続の開始・終了時刻を連動再計算** する。Gantt でもカレンダー同期でもない。

---

## 1. プロダクト概要

| 項目 | 内容 |
|------|------|
| ファイル | `tools/timeline.html` |
| URL | `/timeline` |
| ロジック | `assets/timeline-engine.js`（純関数 · 単体テスト可） |
| UI | `assets/timeline-app.js` |
| registry `id` | `timeline` |
| productName | `SUGUDASU イベント進行` |
| conceptName | `進行タイムライン` |
| navLabel | **`進行`**（確定） |
| pageTitle（SEO） | `SUGUDASU イベント進行 ｜ タイムスケジュール自動計算ツール` |
| 一言 | **司会・研修の当日進行表 — 1箇所ずらすと後ろが全部追従（非送信）** |
| **主ペルソナ** | **P-A 幹事** — イベント主催 · 司会進行 · 研修ファシリテーター |
| 副ペルソナ | 社内総務（社内勉強会）· ハッカソン OP 進行 |
| Ledger | **T13 · Tier S · GO** |
| Backlog | **M01 · P0 新規** |
| SUGUDASU適合 | F1–F7 ◎ · 静的 · ブラウザ内完結 · LLM 判定なし |

### 1-1. 幹事イベント束での位置

```
warikan → group-split → 【timeline】 → fair-draw → present
   集金      班分け        当日進行       抽選        ギフト
```

| 隣接ツール | 関係 |
|------------|------|
| `group-split.html` | **事前**に班が決まる。**当日**は「各班発表◯分」がずれたときに本ツールで全体を直す |
| `shift.html` | **別世界** — 週次の勤務表・公平配置。時間軸は似るが **事前固定グリッド** が主役 |
| `report.html` | 事後の議事録。**進行表そのものは本ツール** |
| `fair-draw.html` | 懸賞・抽選。**進行の時刻連動とは無関係** |

### 1-2. コア vs SUGUDASU Sync（T13-S）

| | **コア**（本 SSOT） | **Sync**（`SUGUDASU_SYNC_LINE.md` §1-1） |
|---|---------------------|----------------------------------------|
| Ledger | **T13** | **T13-S** |
| registry `id` | **`timeline`** | **`timeline-sync`**（registry **未登録** · 非掲載） |
| productName | SUGUDASU イベント進行 | **SUGUDASU Sync イベント進行** |
| URL | `/timeline` | `sync.sugudasu.com/timeline` |
| 登録 | 不要 | 必須 |
| 共有 | コピー · 印刷 · JSON | **Push/Pull · 新版バナー**（§3-3） |
| 向く規模 | **進行係1人** | **司会・音響など複数関係者** |
| 広告 | あり（現状） | **なし** |
| エンジン | `timeline-engine.js` | **同一モジュールを共有** |

**掲載方針（2026-06-24）:** コアのみ `sugudasu.com` に出す。**Sync CTA・hub・ナビは `sync.sugudasu.com` 準備まで出さない。**

---

## 2. イベンター視点 — 現場シナリオ（要件の根拠）

### 2-1. ペイン（なぜ Excel が破綻するか）

司会・ファシリが当日やること:

1. 開始時刻（例 13:00）と **コマ順リスト** がある  
2. 第2セッションが **5分押す** — または **想定外のコマが差し込まれる**（挨拶・表彰・撮影 等 · §2-2 S7）  
3. 休憩を削るか、最終の質疑を短くするか — とにかく **以降の「何時から何時」を全行書き直す**  
4. その表を **Slack / LINE / 司会台本 / 投影** に流す  

Excel だと `=前の終了時刻` を各行に張り、押した行だけ直すと **参照が切れる・行挿入で崩れる・スマホで触れない**。

### 2-2. 代表シナリオ（MVP が刺さる順）

**期間タイプ:** ターゲットは **1日完結** と **複数日** の両方。複数日は **累積分数モデル（§6）** + 必要なら「宿泊・睡眠」ダミー行で夜間ギャップを表現。

| # | 期間 | シーン | 触る人 | 典型操作 | 成功像 |
|---|------|--------|--------|----------|--------|
| S1 | 1日 | **社内研修**（3h） | ファシリ | 午後のワークが10分延び → ワーク行の所要+10 | 終了予定が17:10→17:20と一目で分かる |
| S2 | 1日 | **ハッカソン OP**（90min） | MC | ルール説明が長引き+7分 | デモ開始・ランチ案内時刻が自動でずれる |
| S3 | 1日 | **勉強会・LT大会** | 司会 | 登壇者1人短縮（-8分） | 後続登壇の開始時刻が繰り上がる |
| S4 | 1日 | **対面+Zoomハイブリッド** | 進行係 | 表をコピーしてチャットに貼る | TSV/プレーンがそのまま使える |
| S5 | 複数日 | **2日間新人研修** | 研修担当 | Day1 午後が押し · Day2 朝は固定 | Day バッジ付きプレビューで混乱しない |
| S6 | 複数日 | **合宿・宿泊研修** | ファシリ | 昼食12:00・バス出発を **アンカー** 固定 | 衝突時は赤表示 · 手動で手前を短縮 |
| S7 | 1日 | **当日の差し込み**（挨拶・表彰・撮影・質疑延長 等） | 運営デスク or 進行係 | 進行中に **行挿入** or 前後 **±5** · `note` に担当・内容 | 以降コマが連動 · 撤収アンカー超過なら即警告 · Sync なら閲覧者が手動反映 |

詳細シナリオ12件: `docs/notes/timeline-gemini-research-RESULT.md` §2

### 2-3. やらなくていいこと（イベンターが他ツールに任せる）

| 要件 | 担当 | 理由 |
|------|------|------|
| 週次シフト・公平当番 | `shift.html` | 粒度が違う |
| 班構成・欠席再編 | `group-split.html` | 人の割当は別 |
| 登壇者への個別リマインド | 外部（カレンダー・Slack） | 通知インフラはスコープ外 |
| 複数端末リアルタイム共同編集 | Google 表 · **Sync ライン** | コアは非送信。配信は **T13-S** |
| AI が「何分削るべき」と提案 | LLM | F7 · 提督方針で禁止 |

### 2-4. 当日の操作原則（UX 要件）

| 原則 | 内容 |
|------|------|
| **3タップ以内** | よくあるのは「今のコマ +5分」— 行選択 → +5 → コピー。**差し込み**は 行選択 → **行追加** → 所要・`note` 入力（§2-2 S7） |
| **後ろだけ動かす** | 変更行より **前** の終了時刻は原則固定（MVP）。巻き戻しは行単位の所要編集で対応 |
| **見せる用と編集用** | 左: 編集 · 右: 印刷プレビュー（`invoice` / `group-split` と同型） |
| **不安の解消** | 冒頭に emerald pill「ブラウザ内完結・進行表は外部に送信しません」 |

---

## 3. 競合・代替との境界

| 代替 | 弱点 | 本ツール |
|------|------|----------|
| Excel / スプレッドシート | 式の手入れ · モバイル弱 · 司会が触れない | **行の所要分だけ触れば連動** |
| Google カレンダー | 招待・通知が主 · 進行表の「コマ物語」には不向き | **1本の時系列リスト** |
| 進行表テンプレ PDF | 当日変更に弱い | **即再計算 + コピー** |
| `shift.html` | 日付×メンバー格子 | **当日1イベントの RUN OF SHOW** |

**差別化1文:** 「司会が5分押した瞬間に、残りの全コマの開始時刻を手計算せず更新し、そのまま Slack に貼れる。」

---

## 4. 設計原則（アーキテクト）

### 4-1. Outcome-first · Copy-first

| 原則 | 内容 |
|------|------|
| **Copy-first** | 編集後 **1クリック**で司会台本形式をクリップボードへ（`sg-copy-feedback`） |
| **正本出力** | プレーンテキスト（時刻 — タイトル）· **TSV**（開始,終了,分,タイトル） |
| **印刷** | A4 縦 · 進行表体裁（ヘッダー緑 · `data-sg-print`） |
| **JSON** | 下書き保存/読込（`localStorage` + ファイル DL · 任意 v1.1） |
| **避ける** | 画像だけ · PDF だけ · コピー不能な Canvas |

### 4-2. 軽量・上限

| 項目 | 値 | 理由 |
|------|-----|------|
| コマ数上限 | **80行** | 1日イベントで十分 · DOM 安全 |
| ソフト警告 | **40行超** | 「長い進行はセクション分けを推奨」 |
| 1コマ最短 | **1分** | 0分は禁止 |
| 1コマ最長 | **480分（8h）** | 異常値ガード |
| 処理 | O(n) 連鎖 · **POST なし** | |

### 4-3. SUGUDASU 憲法

| F | 対応 |
|---|------|
| F1 非送信 | 進行表テキストは外部 API へ送らない |
| F3 静的 | Cloudflare Pages のみ |
| F7 信頼 | 「自動で最適な休憩配分」等の **AI 断定しない**。数値はユーザー入力のみ |

---

## 5. 機能要件

### 5-1. Phase A — MVP（v1.0.0 · beta）

**ゴール:** S1〜S4 を **1端末で完結**。S5〜S6（複数日）は **累積分数 + Day 表示** で対応。連動エンジンとアンカー衝突検知が最優先。

#### 入力（イベント設定）

| ID | 要件 | 必須 |
|----|------|------|
| E1 | **イベント開始時刻**（`HH:mm` · デフォルト 09:00） | ◎ |
| E2 | **イベント開始日付**（`YYYY-MM-DD` · 印刷・Day 算出 · デフォルト今日） | ○ |
| E3 | **タイトル**（例: 第3回 社内勉強会） | ○ |

#### コマ行（配列 · フラット）

| フィールド | 型 | 説明 |
|------------|-----|------|
| `id` | string | 安定 ID |
| `title` | string | コマ名（空不可 · 最大80字） |
| `durationMin` | number | 所要分（整数 · 1〜480） |
| `anchored` | boolean | **MVP** · 開始時刻固定トグル |
| `anchorAt` | string | `anchored` 時の固定 `HH:mm`（カレンダー日は累積オフセットから算出） |
| `note` | string | **運営メモ**（最大 **100字**）— 誰が喋る · 移動先 · 音響キュー · 一覧は省略表示 |
| `offsetMin` | number | **算出** · イベント開始からの累積分 |
| `startAt` / `endAt` | string | **算出** · 表示用 `HH:mm`（+ Day バッジ） |
| `dayIndex` | number | **算出** · 0=開始日 · 複数日表示用 |

**ダミー行:** 「宿泊・睡眠」「会場撤収待ち」等 — `durationMin` のみで夜間ギャップを表現（案3）。

#### 連動エンジン（コア · 累積分数）

```
入力: state, changedIndex?
処理:
  1. offsetMin[0] = 0（または anchored なら anchorAt を offset に逆算）
  2. 非アンカー: offsetMin[i] = offsetMin[i-1] + durationMin[i-1]
  3. アンカー行: startAt = anchorAt（当該 dayIndex 上）— 前行終了 > anchorAt なら conflict
  4. 表示: eventStartDate + (eventStartMin + offsetMin) から dayIndex / HH:mm を導出
```

| ルール | 内容 |
|--------|------|
| 連鎖方向 | 変更行 k 以降を再計算（非アンカー行） |
| **アンカー行** | **自動圧縮しない**。衝突時は `conflict: true` · 赤反転 · 警告バナー |
| 日跨ぎ | **翌日セクション自動挿入なし**。`dayIndex` バッジ + 24h 超えは警告 |
| 行操作 | 追加 · 削除 · ↑↓（DnD は v1.1）— **追加/削除は S7 差し込みの必須パス** |
| クイック調整 | 選択行 **+5分 / -5分** |

#### 5-1b. 現場メモ · 現在時刻 · 残り時間（確定 · Gemini §6 · 2026-06-24）

**競合正本:** `docs/notes/timeline-competitors-gemini-RESULT.md`  
**直接競合:** **[Rundown Studio](https://rundownstudio.app/)**（UI主参考）· EZStageManager — 連動再計算は **表 stakes**。live-board は別カテゴリ。

##### 行メモ `note`

| 項目 | 仕様 |
|------|------|
| 入力 | 行下に展開 textarea · 最大100字 |
| 一覧 | 超過は `...` · タップで全文 |
| コピー O1 | `【10:15–10:30】アジェンダ名 （備考：〇〇さん移動）` — `note` あり時のみ括弧 |
| 印刷 | 備考列 · 常時出力 |
| **やらない（MVP）** | 音響/照明など **役割別マルチ列**（Shoflo 型） |

##### 現在時刻「今」

| 要素 | 仕様 |
|------|------|
| ヘッダー | デバイス **実時間**（1分 tick） |
| リスト | **横断「今」線**（Rundown 赤ライン相当 · `sg` トークン色）· スクロール追従 |
| 進行中コマ | 行ハイライト |
| **Next** | プレビュー先頭 `次: {title}` |

##### 残り時間（sticky フッター · §7-2）

| モード | 表示 | 切替 |
|--------|------|------|
| **デフォルト** | 進行中コマの残り（`endAt - now`） | — |
| **任意コマ** | タップ行の **開始まで**（例: `お昼休憩まで あと 45:12`） | 同一行再タップでデフォルトに戻す |

エンジン: `minutesUntilRowStart(state, rowId, now)` · `minutesUntilCurrentRowEnd(...)` — `timeline-engine.js`

##### MVP でやらない（競合にあるが Phase C / OUT）

- 秒単位 `hh:mm:ss`
- 外部モニター専用タイマー画面（Stagetimer 緑黄赤全画面）
- 役割別列フィルタ（音響 · 照明 · MC 列）

#### 出力

| ID | 形式 | 例 |
|----|------|-----|
| O1 | プレーン | `13:00–13:15  開会` または `【13:00–13:15】開会 （備考：…）` |
| O2 | TSV | `開始\t終了\t分\tタイトル`（UTF-8 BOM 可） |
| O3 | 印刷/PDF | ブラウザ印刷 · 進行表レイアウト |
| O4 | コピー成功 | `sg-copy-flash` + `Copied!` + トースト（§3.8） |

#### UI 骨格

| 領域 | 内容 |
|------|------|
| ヘッダー | **`data-sg-chrome-mode="focus"`**（§7-1）· `data-sg-print="true"` |
| 左 | 設定 + コマ一覧（編集） |
| 右 | プレビュー（時刻付きリスト · 印刷対象） |
| フッター FAQ | 非送信 · shift との違い · アンカー衝突 · 複数日（睡眠ダミー行） |

### 5-2. Phase B — v1.1（任意 · MVP 後）

| 機能 | 理由 |
|------|------|
| テンプレート読込（研修3h / ハッカソンOP / LT30×5） | 初回入力の摩擦削減 |
| **CSV インポート**（Rundown 有料相当） | Excel からの一括取込 · v1.1 |
| **CSV ファイル DL** | TSV コピーに加え明示ダウンロード · v1.1 |
| `localStorage` 自動下書き | リロード耐性 |
| セクション見出し行（時刻なし · 連鎖に含めない） | 長い進行の可読性 |
| 終了予定と **目標終了時刻** の差分（「45m early」/「+12m オーバー」） | Rundown フッター相当 · 撤収デッドライン |
| `speaker` / `location` 独立列 | 競合はマルチ列 — MVP は `note` 1本で足す |
| 行 DnD · Day 跨ぎ移動 | §2 合宿シナリオ |

### 5-3. Phase C — 見送り・OUT

| 機能 | 判定 |
|------|------|
| 複数人リアルタイム同期 | **T13-S Sync**（コアスコープ外） |
| **Prompter（テレプロ）** | OUT — Rundown 有料機能だが別製品領域 |
| **公開 API / Stream Deck** | OUT — Webhook のみ Sync S4 検討 |
| **ゲスト全員編集** | OUT — 閲覧+手動反映 · 編集者は最大2（Sync S4） |
| Zoom / Google Calendar API | OUT |
| スピーカーへの SMS リマインド | OUT |
| ガントチャート・クリティカルパス | OUT（コモディティ + 工数） |
| 並行チャネル・マルチトラック進行 | OUT（§2 オンライン展示会は Phase C） |
| LLM「休憩を最適化」 | OUT（F7） |
| アンカー衝突の **自動帳尻合わせ** | OUT（バグ温床 · Gemini §3） |

---

## 6. データモデル（アーキテクト · 案3 確定）

### 6-1. ドメイン型

```typescript
type TimelineEvent = {
  title: string;
  dateIso: string;       // 開始日 YYYY-MM-DD
  startAt: string;       // HH:mm
};

type TimelineRow = {
  id: string;
  title: string;
  durationMin: number;
  anchored?: boolean;
  anchorAt?: string;     // HH:mm · anchored 時のみ
  note?: string;
  // 算出
  offsetMin?: number;
  startAt?: string;
  endAt?: string;
  dayIndex?: number;
  conflict?: boolean;    // アンカー侵害
};

type TimelineState = {
  event: TimelineEvent;
  rows: TimelineRow[];
  version: 1;
};
```

### 6-2. 時刻変換（累積分数）

| 関数 | 責務 |
|------|------|
| `parseTimeToMinutes(hhmm)` | 0〜1439 |
| `formatMinutesToTime(m)` | 日内 HH:mm |
| `offsetToCalendar(event, offsetMin)` | `{ dayIndex, startAt, endAt }` |
| `recalcTimeline(state, fromIndex?)` | 連鎖 + アンカー衝突検知 · immutable 返却 |
| `applyDurationDelta(state, rowId, delta)` | ±5 |
| `moveRow(state, from, to)` | ↑↓ |
| `formatPlain` / `formatTsv` | 出力（`note` 括弧形式 · Day 列 optional） |
| `getCurrentRowIndex(state, now)` | 進行中コマ推定 |
| `minutesUntilRowStart` / `minutesUntilCurrentRowEnd` | 残り時間フッター |
| `validateRow` | EFO |

**テスト:** `scripts/timeline-engine.test.mjs`

- 3行 · 10:00 開始 · 各15分  
- 2行目 +10分 → 3行目繰り下げ  
- アンカー 12:00 · 前行終了 12:15 → `conflict`  
- 開始 22:00 + 180分 → `dayIndex` 繰り上げ  
- 「睡眠」ダミー 720分 → 翌日 09:00 相当の表示

### 6-3. 永続化

| 層 | 内容 |
|----|------|
| `sessionStorage` | 不要（MVP） |
| `localStorage` | v1.1 · キー `sg-timeline-draft-v1` |
| ファイル JSON | エクスポート/インポート · v1.1 |

---

## 7. UI / デザイン契約

**提督方針（2026-06-24）:** スマホ · タブレット · PC **いずれも UI/UX が肝**。当日は **スマホ縦持ち** が最頻 · M01「モバイルキラー」採点の本丸。

### 7-0. UI 参考（提督確定）

| 参考 | URL | 扱い |
|------|-----|------|
| **Rundown Studio**（主） | [rundownstudio.app](https://rundownstudio.app/) · [サンプル](https://app.rundownstudio.app/rundown/JpyhODPhqUyiRPTUiAaO) | **進行表 UX の正** — 開始·所要分·連動·早終了サマリ |
| live-board | [github.com/tsubasagit/live-board](https://github.com/tsubasagit/live-board) | **本体の参考にしない** — 「次へ」型・学校向け表示。内容が違う |

### 7-1. フォーカス chrome（提督採用 · 2026-06-24）

**判断（システムアーキテクト × Web プロデューサー）:** `/timeline` は **通常 SUGUDASU ヘッダー（白帯 + 16本ナビ）を出さない**。

| 観点 | 通常 chrome | **focus モード** |
|------|-------------|------------------|
| 利用文脈 | ツール横断・初回探索 | **当日セッション** — 司会/進行係が縦持ちで何度も操作 |
| 縦スペース | ヘッダー+ナビ ≈ 100px 超 | **≈44px** — sticky フッターと競合しない |
| 認知負荷 | 16本ナビは「他ツールへ」誘導 | 差し込み・±5・コピーに **注意を固定** |
| ブランド | 強い | 「一覧」リンク + ミニフッターで **脱出経路は確保** |
| リスク | — | 回遊率低下 → **幹事束リンク**（班分け・割り勘）で補う |

**実装:** `data-sg-chrome-mode="focus"` on `#sg-chrome-top` · `sugudasu-shell.js` の `focusChromeHtml`。他ツールは従来どおり。

**出ないもの:** ダークナビ · 大ロゴ帯 · 開発バッジ長文帯（バッジはヘッダ内コンパクトのみ）  
**残すもの:** 印刷（L3 緑）· GA4 · F1 emerald pill（本文上）· 法務ミニフッター

Rundown の例示画面・LP からの対応表は `timeline-competitors-gemini-RESULT.md` 提督追記を正とする。

**SUGUDASU と Rundown の意図的差分:**

| 軸 | Rundown | SUGUDASU |
|----|---------|----------|
| テーマ | ダーク · 放送ブース | **`sg-*` ライト** · 社内幹事 |
| 同期 | 常時自動 | Sync **手動反映** |
| コア | 要アカウント | **非送信・登録不要** |
| モバイル | 簡略表示あり | **編集もスマホ最適が主** |

### 7-2. 共通

| 項目 | 指定 |
|------|------|
| セグメント | 出力形式タブ — `sg-segment` §3.3 |
| 主 CTA | 「コピー」`sg-btn-primary` · `sg-copy-feedback` §3.8 |
| 印刷 | ヘッダー緑 · `no-print` / プレビュー領域のみ |
| バッジ | emerald · 非送信 |
| 時刻 | `tabular-nums` · `font-variant-numeric: tabular-nums` |
| タッチ | 操作系 **最小 44×44px**（WCAG 2.5.5 目安） |
| a11y | 行操作は `<button>` · 入力は `<label>` 明示 |

### 7-3. 端末別レイアウト

| 端末 | ブレークポイント目安 | 編集 UX | プレビュー |
|------|---------------------|---------|------------|
| **スマホ** | `< lg` | **1カラム** · 編集が上 | **タブ切替**（編集 \| プレビュー）— 2カラム並べない |
| **タブレット** | `lg` 未満でも可 | 1カラム or **狭い2カラム** | 横持ち時のみ右プレビュー検討 |
| **PC** | `lg+` | `lg:grid-cols-2` · 左編集 / 右プレビュー | 常時表示 |

**スマホ編集の必須パターン:**

| 要素 | 仕様 |
|------|------|
| 選択行の **±5分** | 親指圏 **固定フッター**（`sticky` · `safe-area-inset-bottom`） |
| **行追加** | フッター常設（S7 差し込み）— 選択行の直後に空行挿入 |
| **コピー** | フッターに常設 · 編集タブからも1タップ |
| リスト | 1行 = 開始–終了 · タイトル · 所要分 · `note` 省略表示 |
| **プレビュー（Rundown 型）** | **End 列相当**を表示 · 進行中行ハイライト · **横断「今」線** |
| **現行＋Next** | プレビュー先頭: 大きい残り時間 + `次: ◯◯`（Rundown ステージタイマー簡易版） |
| 数値入力 | `inputmode="numeric"` · 所要分はステッパ or 大きな ± |

**3タップ以内（§2-4）:** 行タップ → **+5** → **コピー**（フッターまでスクロール不要）

### 7-4. Sync 閲覧者 UI（T13-S · `SUGUDASU_SYNC_LINE.md` §3-3）

| 要素 | モバイル必須 |
|------|----------------|
| 「新しい版があります」 | **画面上部 sticky** · 古い版のまま下スクロール可 |
| **[今すぐ反映]** | バナー内 **全幅 CTA** · 44px 以上 |
| 現在の `revision` / 更新時刻 | バナー副文 · 誤進行防止 |

閲覧画面は **編集 UI なし** — Rundown **public view** 簡易版: 巨大残り時間 · `次:` · 直近数行 · **新版バナー＋手動反映**。

### 7-5. 受け入れ（UX · MVP）

- [ ] iPhone Safari **縦** · Android Chrome **縦** で ±5 · コピーが親指圏から操作可能
- [ ] `375px` 幅で横スクロールなし（表は縦積み）
- [ ] タブレット横 `1024px` で 2カラムまたはタブいずれかが破綻しない
- [ ] Sync 閲覧（S2）: 新版バナー + 手動反映 CTA が **片手操作** で完結

---

## 8. 受け入れ基準（Definition of Done · MVP）

- [ ] `/timeline` が `build:pages` で dist に出る  
- [ ] registry · hub カード · sitemap に載る  
- [ ] コマ2行以上で **所要分変更 → 後続が連鎖**（単体テスト）  
- [ ] **行挿入**（選択行直後）で後続が連鎖 · **行削除**で後続が繰り上が · S7 差し込み受け入れ  
- [ ] **アンカー行** ON + 衝突時に赤表示・警告（自動圧縮なし）  
- [ ] **複数日:** `dayIndex` 表示 · 睡眠ダミー行で翌朝まで進める  
- [ ] +5 / -5 が動作  
- [ ] プレーン · TSV コピーが `sg-copy-feedback` 契約どおり  
- [ ] 印刷で右プレビューが崩れない（Chrome · 最新 Safari）  
- [ ] FAQ 3問以上 · JSON-LD optional  
- [ ] `npm run validate:utf8` 通過  
- [ ] **§7-4 UX** — スマホ縦 · タブレット · PC で操作導線が成立  
- [ ] **§5-1b** — `note` 100字 · コピー括弧形式 · 現在時刻線 · 残り時間（進行中/タップ行）  

---

## 9. 実装順序（提督承認後）

**細切れ SSOT（Agent 用）:** **`docs/notes/TIMELINE_IMPLEMENTATION_SLICES.md`** — 1スライス = 1セッション · T0-01 から順に。  
**コード内コメント:** 同 SSOT **§0** — 定数・分岐に「なぜ」を書く（手本: `assets/timeline-engine.js` 先頭）。

| Step | 内容 | 成果物 |
|------|------|--------|
| 1 | エンジン + テスト（T0-01…T0-10） | `assets/timeline-engine.js` · `scripts/timeline-engine.test.mjs` |
| 2 | ページ骨格（T1-01…T1-03） | `tools/timeline.html` · `assets/timeline-app.js` |
| 3 | 編集ループ + 当日 UX（T1-04…T1-17） | 同上 |
| 4 | registry · build · hub · changelog（T2-01…T2-06） | `data/tool-registry.json` 等 |
| 5 | 幹事束相互リンク | `group-split` · `warikan` から1行リンク |

**触る従量レイヤ:** なし（静的のみ · ① Compute 増やさない）

---

## 10. 確定事項（2026-06-24 · Gemini §1–§6 反映）

| # | 論点 | 決定 |
|---|------|------|
| Q1 | navLabel | **`進行`** · title で「タイムスケジュール自動計算」を補完 |
| Q2 | MVP アンカー行 | **入れる** — トグル + 衝突警告のみ（自動圧縮なし） |
| Q3 | 日跨ぎ | **案3 累積分数** + Day バッジ · 翌日セクション自動なし · 睡眠ダミー行可 |
| Q4 | 実装順 | **timeline コア先行** → Sync Phase S1 |

**Sync ロードマップ:** `docs/notes/SUGUDASU_SYNC_LINE.md` §3–§6

---

## 11. 関連ドキュメント

| パス | 内容 |
|------|------|
| `docs/notes/MOBILE_KILLER_GEMINI_RESULT.md` | M01 ブレスト原文 |
| `docs/BACKLOG.md` §1-12 | M01 優先度 |
| `data/tool-facts/timeline.json` | マーケ用 scaffold（実装後 `reviewed` へ） |
| `data/lp-marketing-matrix.json` | 幹事イベント束 · 型A |
| `docs/notes/timeline-gemini-research-RESULT.md` | キーワード · 現場シナリオ12件 |
| `docs/notes/timeline-competitors-gemini-RESULT.md` | 競合調査 · MVP メモ/残り時間確定 |
| `docs/notes/TIMELINE_IMPLEMENTATION_SLICES.md` | **細切れ実装 SSOT · コードコメント方針 §0** |
