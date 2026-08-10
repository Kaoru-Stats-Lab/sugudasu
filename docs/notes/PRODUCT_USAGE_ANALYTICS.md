# プロダクト利用計測（開封→着手→完了ファネル）

**更新:** 2026-08-10  
**ステータス:** 契約確定 · 実装正本 · カバレッジ監査済 · Input 中間段追加  
**実装:** `assets/sg-analytics.js` · `assets/sugudasu-shell.js`（`trackGaEvent`）· `assets/sg-copy-feedback.js` · `assets/sugudasu-growth.js`  
**ツール別契約:** [`data/tool-job-contracts.json`](../../data/tool-job-contracts.json)  
**憲法境界:** [`DATA_PRIVACY_CLAIM_POLICY.md`](DATA_PRIVACY_CLAIM_POLICY.md) · Hub 許可リスト [`HUB_IA_REFRESH_V2.md`](HUB_IA_REFRESH_V2.md) Analytics 節  
**計測 MCP:** [`docs/BACKLOG.md`](../BACKLOG.md) §8-13-1 · 週次プロンプト [`docs/prompts/product-usage-weekly-COPYPASTE.md`](../prompts/product-usage-weekly-COPYPASTE.md)  
**VC / 経営価値メーター:** [`VC_DUE_DILIGENCE_METRICS.md`](VC_DUE_DILIGENCE_METRICS.md) · セカンドオピニオン [`../prompts/vc-due-diligence-metrics-second-opinion-COPYPASTE.md`](../prompts/vc-due-diligence-metrics-second-opinion-COPYPASTE.md)

---

## 0. 目的（経営）

| 見るもの | 意思決定に効く問い |
|----------|-------------------|
| ツール別 **開封**（`product_opened`） | どれが発見・再訪されているか |
| ツール別 **着手**（`tool_job_started`） | 開いたあと触ったか（Drop_no_engage） |
| ツール別 **完了**（`tool_job_done`） | どれが「仕事が終わった」か |
| **着手率** = started / opened | リード文・入口ミスマッチか |
| **完了率（着手後）** = done / started | UX / 出力導線の問題か |
| **完了率（開封）** = done / opened | 総合ヘルス |

**役員判断（2026-08-10）:** CPO=中間段必須 · CMO=本文なし列挙のみ · CTO=中央API+契約JSON+Playbook。stamp のテキストは **本文を送らず** `input_kind=type` で計測する（キーストローク連打禁止 · ページあたり kind 最大1回）。

**Sync 課金メーターとは別物。** コアの無料ツール利用状況であり、Room 時間・人数・GB 課金の代替ではない（[`SYNC_EXPLORATION_BOARD_MINUTES.md`](SYNC_EXPLORATION_BOARD_MINUTES.md) R6 の「メーターが空」への **コア側一次指標**）。

---

## 1. イベント契約

| event | 必須 params | 任意 | 意味 |
|-------|-------------|------|------|
| `product_opened` | `tool_id` | `event_source` | ツール画面を開いた（shell chrome mount） |
| `tool_job_started` | `tool_id`, `input_kind` | `event_source`, `surface` | 作業に着手した（本文なし） |
| `tool_job_done` | `tool_id`, `outcome` | `event_source`, `surface` | 成果物を持ち帰った（**outcome 必須 · 列挙厳守**） |
| `tool_job_failed` | `tool_id`, `reason_code` | | ゲート拒否等（**実装契約上必須** · 本文なし · 列挙のみ）。任意扱いしない |

### 1.1 `outcome` 列挙（厳守）

| 値 | いつ |
|----|------|
| `copy` | クリップボードへコピー成功（`sg-copy-feedback` · growth 経由） |
| `pdf` | PDF として保存・生成ダウンロード |
| `download` | CSV / PNG / ZIP / JSON 等のファイル DL |
| `print` | 印刷ダイアログを開いた（明示フックのみ · 自動 beforeprint は使わない） |

### 1.1b `input_kind` 列挙（厳守）

| 値 | いつ（ページ表示あたり同 kind 最大1回） |
|----|------------------------------------------|
| `file_drop` | DnD でファイル受理 |
| `file_pick` | file input で受理 |
| `paste` | テキスト貼り付けで着手 |
| `clipboard_image` | 画像クリップボード受理 |
| `type` | フォーム/テキストの初回有意入力（debounce · 本文なし） |
| `camera` | QR/カメラ読取成功 |
| `load_session` | セッション JSON 等の復元 |
| `generate` | ファイルなし生成開始（テストデータ・抽選等） |

### 1.2 `reason_code` 列挙（failed 時）

| 値 | 意味 |
|----|------|
| `gate` | 行数ゲート等でコピー拒否 |
| `empty` | 出力が空 |
| `other` | 上記以外（詳細文字列は送らない） |

### 1.3 禁止（送信してはならない）

- 入力テキスト · 名簿 · 金額 · ファイル内容 · ファイル名 · プレビュー先頭行
- 検索クエリ本文（Hub `search_used` もクエリ文字列禁止 · 既存方針）
- 行数以外のペイロード統計をイベント param に載せない（トースト表示用の行数は UI のみ）
- PII · メール · 端末固有 ID の自前発行
- キーストローク毎・DnD 毎の連発（once-per-kind）

主張してよいこと（statements 既存）: 「計測はページの閲覧 · 操作の統計のみ」。イベント名のユーザー開示は不要。

---

## 2. ファネル定義（GA4）

```
product_opened (tool_id=X)
  → tool_job_started (tool_id=X, input_kind=…)
  → tool_job_done (tool_id=X, outcome=…)
  → tool_job_failed (tool_id=X, reason_code=…)   # 拒否時は必須

Drop_no_engage ≈ opened かつ started なし
Drop_no_export ≈ started かつ done なし
価値到達率 = done / opened（および done / started）
失敗率 ≈ failed / started
```

注意:

- 1 セッションで複数回完了しうる（コピー連続）→ **完了率は「開封あたりの完了回数」寄り**。厳密なユニークユーザー完了率は GA4 の探索で調整。
- `input_kind` はページ表示あたり kind ごと最大1回（ノイズ・プライバシー）。
- **完了時間バケットは当面送らない**（セカンドオピニオン Defer · 均質化が先）。
- localhost では GA4 を読まない（shell 既存）。本番のみ。

---

## 3. 実装マップ

| 経路 | ファイル | outcome / kind |
|------|----------|----------------|
| 開封 | `sugudasu-shell.js` `pushRecentTool` | —（`product_opened`） |
| 着手 | `SG_ANALYTICS.notifyJobStarted` / `bindTextJobStarted` / `trackFileAccepted` | `input_kind` |
| コピー成功 | `sg-copy-feedback.js` | `copy` |
| 明示完了（warikan / receipt 等） | `recordToolSuccess` | localStorage のみ（GA なし） |
| Blob DL | `downloadBlobTracked` / `notifyJobDone` | `download` \| `pdf` |
| 印刷 | `printTracked` / `notifyJobDone('print')` | `print` |
| 画像コピー等 | `markCopyButtonDone(..., { trackOutcome })` | 明示 outcome |

正本 API: `globalThis.SG_ANALYTICS`（`assets/sg-analytics.js`）。

ツール別 Input/Output の正本: [`data/tool-job-contracts.json`](../../data/tool-job-contracts.json)（§9）。

---

## 4. GA4 セットアップ（提督 · 初回のみ）

Property: Measurement ID **`G-WBB6PTTYF7`**（shell 正本）。

### 4.1 カスタム定義（イベントパラメータ → ディメンション）

| ディメンション名 | 範囲 | イベントパラメータ |
|------------------|------|-------------------|
| Tool ID | イベント | `tool_id` |
| Job outcome | イベント | `outcome` |
| Input kind | イベント | `input_kind` |

反映まで最大 24–48h。それまでは DebugView / リアルタイムでパラメータ確認。

### 4.2 DebugView 確認手順

1. 本番 URL で該当ツールを開く（`product_opened`）
2. 入力または DnD（`tool_job_started`）
3. コピーまたは DL（`tool_job_done`）
4. DebugView で `tool_id` / `input_kind` / `outcome` を確認（本文なし）

### 4.3 保存済み Exploration（定型レポート）

1. **行:** Tool ID  
2. **指標:** opened · started · done  
3. **計算:** 着手率 = started/opened · 完了率 = done/started（および done/opened）  
4. **保存名例:** `SUGUDASU · tool open→start→done funnel`

### 4.4 週次の見方

1. 開封多いが着手少 → リード文 / Pain ミスマッチ  
2. 着手多いが完了少 → UX / 出力 CTA  
3. 完了が多い → 維持・関連ツール導線  

---

## 5. Cursor（Analytics MCP）

### 5.1 ADC（提督 · 一度だけ）

```powershell
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/analytics.edit"
```

### 5.2 週次プロンプト

[`docs/prompts/product-usage-weekly-COPYPASTE.md`](../prompts/product-usage-weekly-COPYPASTE.md)

---

## 6. Agent チェックリスト

- [ ] `data/tool-job-contracts.json` に inputs / outputs（Playbook **A16**）
- [ ] 着手は `notifyJobStarted` / `bindTextJobStarted` / `trackFileAccepted`
- [ ] 完了は中央フック経由
- [ ] 本文・ファイル名を event param に入れていない
- [ ] `npm run validate:usage-analytics`

---

## 7. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-08-10 | セカンドオピニオン反映 — failed 必須化 · 転換率明示 · 時間バケット Defer |
| 2026-08-10 | VC価値メーター · セカンドオピニオン導線を追記 |
| 2026-08-10 | open→started→done · input_kind · tool-job-contracts · stamp type |
| 2026-08-10 | カバレッジ監査 · printTracked · trackOutcome · verify |
| 2026-08-09 | 初版 |

---

## 8. カバレッジ監査（Output）

詳細は履歴コミット参照。Output は中央フックへ寄せ済み。機械チェック: `npm run validate:usage-analytics`。

---

## 9. ツール別 Input/Output 契約

**正本:** [`data/tool-job-contracts.json`](../../data/tool-job-contracts.json)

- `infoPageIds` — 計測対象外  
- `tools.{id}.inputs` / `outputs` — グローバル列挙の部分集合  
- 新規公開時は Playbook §1.5 **A16** で追記  
