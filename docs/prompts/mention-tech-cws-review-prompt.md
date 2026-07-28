# Prompt: Mention by SUGUDASU — 技術・実装・Chrome Store 審査レビュー

**用途:** 設計（Mission / Constitution / Architecture）は確定済み。  
他AI（Gemini / ChatGPT / Claude 等）に **技術スタック · 実装方法 · CWS 審査に通る書き方 · Reject タブー · 全体評価** を聞くための投入プロンプト。  
**更新:** 2026-07-28  
**製品正本:** [`../products/mention/`](../products/mention/README.md)

---

## 使い方

1. 下の「COPYPASTE」ブロックを他AIにそのまま貼る  
2. 必要なら `docs/products/mention/philosophy.md` · `specification.md` · `competition.md` · `chrome-store.md` · `extensions/mention/manifest.json` を添付  
3. 返ってきた指摘のうち、Mission / ADR と矛盾するものは採用しない（Design Order 逆転禁止）

---

## COPYPASTE（ここから）

```markdown
# 依頼

あなたは次の役割を兼ねてください。

- Staff Chrome Extension Architect（MV3 · Chrome Web Store 審査）
- Staff Security Engineer（拡張の権限・データフロー）
- Staff Frontend Architect（実装の単純さ・保守性）
- Staff Product Engineer（仕様を壊さない実装）

**設計仕様は決まっています。再設計しないでください。**
Mission / Constitution / Non-Goals を覆す提案は「代替案」ではなく「仕様違反」として明示してください。
あなたの仕事は、**確定した設計を審査に通し、壊れにくく実装するための技術評価**です。

---

# 確定している設計（変更禁止）

## Mission

- Find outside. Finish inside. / 見つけたら、終わらせる。
- Current Context Action Engine（監視・分析・ダッシュボードではない）
- Platform は Adapter。Google Maps は最初の Adapter に過ぎない。

## Constitution（要約）

1. Single Purpose — 監視/分析/収集なし
2. Current Context Only — ユーザーが開いたページだけ。巡回しない
3. Local First / Non-Exfiltration — SUGUDASU 管理下へ業務データを送らない。端末内 IndexedDB は Done/Template 痕跡のみ
4. Explicit Network — Webhook のみ、ユーザーが押したときだけ
5. No LLM — ルール + 編集可能テンプレ + {{変数}} のみ
6. No Paste Product — URL/本文貼り付けを入力経路にしない
7. optional host permissions — 初期 `<all_urls>` 固定禁止
8. Side Panel 本命 — `/mention` は LP のみ

## Architecture

```
Current Page
  → Platform Adapter（DOM → ContextEnvelope）
  → Scenario Detector（構造ルール）
  → Action Engine（Action Cards + Template fill）
  → Copy / Webhook / Done
```

## 現在の実装方針（α）

- Chrome Extension Manifest V3
- Side Panel + service worker + content script
- 素の HTML/CSS/ES modules（React/Vue なし）
- IndexedDB（sugudasu-mention）
- 静的 LP: sugudasu.com/mention
- リポジトリ配置: extensions/mention/
- α の問題: manifest がまだ広い host_permissions（http/https *）を含みうる → 憲法上は縮小必須

## 絶対に作らないもの

Dashboard / Analytics / Monitoring / 通知巡回 / LLM 文案 / CRM / 担当期限 / クラウド蓄積

---

# あなたへの問い（すべて答える）

## A. 技術スタック評価

1. 現方針（MV3 · vanilla JS · IndexedDB · バンドラなし）は妥当か？
2. 足すべきもの / 足してはいけないもの（React、TypeScript、Plasmo、WXT、CRXJS、バックエンド等）を理由付きで。
3. Adapter 増加を見据えたモジュール分割の推奨形は？
4. テスト戦略（純関数 Action Engine · DOM Adapter の壊れやすさ）は？

## B. 実装方法

1. Side Panel ↔ content script ↔ background の推奨メッセージ設計
2. Scenario Catalog / Adapter のコード配置（仕様の scenarios/ との対応）
3. テンプレ・設定・Done の IndexedDB スキーマとマイグレーション方針
4. DOM 変更に強い Adapter の書き方（versioned selectors · 失敗時の沈黙）
5. Webhook 送信の安全な実装（ユーザー URL のみ · 何を送ってよいか）

## C. Chrome Web Store 審査 — 通る書き方

1. Single Purpose をストア説明・権限説明・スクショでどう証明するか
2. host permissions / optional_host_permissions の推奨申請文
3. privacy policy に必須の一文（非送信 · 明示 Webhook）
4. remote code / minification / obfuscation / eval の扱い
5. 審査員が見る「怪しい挙動」チェックリスト（コード観点）

## D. Reject されるタブー（Chrome Store + 製品）

次を「やってはいけない」リストにしてください。各項目に理由を1行。

- 権限まわり
- データ収集まわり
- UX / 説明まわり
- コード品質まわり（審査ポリシー）
- 製品仕様まわり（Mission 破壊）

## E. 全体評価

次の表で採点（1–5）と一言理由。

| 観点 | 点 | 理由 |
|------|----|------|
| Mission との技術整合 | | |
| 審査通過見込み（現状α） | | |
| 審査通過見込み（憲法どおり optional 化後） | | |
| 実装シンプルさ | | |
| スケール（Adapter 追加） | | |
| 競合との差別化の技術的防衛 | | |
| 総合 | | |

最後に:

1. **今すぐ直すべき P0**（3つ以内）
2. **やらなくてよいこと**（過剰エンジニアリング）
3. **Store 提出前の Done 定義**（チェックリスト）

---

# 出力形式

- 日本語
- 仕様変更提案は「SPEC_CHANGE:」と明示し、採用は読み手が決める前提
- 一般論の Chrome 拡張チュートリアルを長々と書かない。この製品文脈に寄せる
- 競合名で「Brand24 のように」と機能追加を勧めない
```

## COPYPASTE（ここまで）

---

## 添付すると精度が上がるファイル

| 優先 | パス |
|------|------|
| 必須級 | `docs/products/mention/philosophy.md` |
| 必須級 | `docs/products/mention/specification.md` |
| 推奨 | `docs/products/mention/competition.md` |
| 推奨 | `docs/products/mention/decisions.md` |
| 推奨 | `extensions/mention/manifest.json` |
| 任意 | `docs/products/mention/chrome-store.md` |

---

## Design Order（他AIへのリマインド用・短縮）

```text
philosophy → competition → specification → decisions
→ 技術提案。この順を逆転して「便利だから Dashboard」は禁止。
```
