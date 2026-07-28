# 2026-07-28 — Mention α 憲法適合診断

**対象:** `extensions/mention/`  
**基準:** philosophy · ADR-0001〜0006 · ADR-0007  
**結論（初回）:** ギャップは「optional 権限化 · Core/Adapter 分離」に集約。ゼロからの再設計は不要。  
**追随実装後（同日・判断ログ承認）:** P0 の権限・沈黙 UX・Adapter 分割は **解消**。残 P0 は Done 上限 / Webhook ペイロード縮小。

---

## 適合状況

| チェック | 結果 | 根拠 |
|----------|------|------|
| MV3 · Side Panel | **PASS** | `manifest.json` `side_panel` · `sidepanel.html` |
| No LLM · テンプレ置換 | **PASS** | `lib/action-engine.js` · `templates-default.js` · テストあり |
| Local First IndexedDB | **PASS** | `lib/idb.js`（templates / settings / done） |
| Explicit Webhook（UI 起点） | **PASS 寄り** | `sidepanel.js` の明示ボタン。送付ペイロードは ADR-0007 に合わせて縮小余地 |
| No Paste Product | **PASS** | 貼り付け入力 UI なし |
| No Dashboard | **PASS** | Inbox/Done/Template/Setting のみ |
| optional host / 最小権限 | **PASS** | `host_permissions: []` · `optional_host_permissions` = Maps パス + `business.google.com` のみ（`*://*/*` なし） |
| Current Context Only（未許可は沈黙） | **PASS** | 非 Maps URL は Side Panel 沈黙。未許可は Panel 内許可ボタンのみ（ページバッジなし） |
| Core ⊥ Adapter | **PASS** | `content/adapters/google_maps.js` · `extract.js` はルータのみ · Core は `adapterId` で Scenario 表選択（仕様 §3.1/§5） |
| Store 説明と権限の一致 | **PASS 寄り** | Maps/GBP 限定なら Single Purpose 説明が容易。初回提出スコープは ADR-0007 HOLD |

---

## 承認済み判断（2026-07-28）

| 項目 | 判断 |
|------|------|
| manifest after | 承認（そのまま実装） |
| `business.google.com` | **含める**（仕様 §4 `google_maps` = GBP / Maps。ADR-0007 の Adapter 単位絞り込み） |
| Core 分岐 | **案1** — `platform` 廃止 · `adapterId` 比較のみ（Scenario 表選択は分離違反ではない） |

---

## P0（残）

1. ~~manifest 縮小 · optional~~ **済**
2. ~~未許可 UX（沈黙 + Panel 許可）~~ **済**
3. ~~adapters 分割 · adapterId~~ **済**
4. **Done 上限 200** — `idb.js` に trim（未着手）
5. **Webhook ペイロード** — 展開テキスト + 最小メタに固定（未着手）

## P1 / バックログ

- **GBP DOM fixture** — `business.google.com` は権限に含めた。`extractGoogleMaps` が GBP 管理画面で動くかは Adapter 切り出し後に fixture で検証（今回スコープ外）
- Scenario id を Engine が明示返却（category 近似から scenarios 正本へ）
- ブランド照合を false-positive 回避に寄せる
- chrome-store.md の提出文面（Maps 限定なら説明が容易）

## やらなくてよい

React 化 · バンドラ必須化 · 課金コード · Firefox 対応 · Dashboard · X/web Adapter（今スプリント）。

---

## 判定一文

> α は「動く骨格」としては存在する。broad host ブロッカーは **追随実装で解消**。次は Done 上限 · Webhook 縮小 · GBP DOM 検証（fixture）。
