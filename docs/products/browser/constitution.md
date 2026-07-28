# SUGUDASU Browser Constitution

**更新:** 2026-07-28  
**役割:** Browser Family 共通の親憲法  
**Status:** Accepted（ADR-0008）  
**子:** Mention Constitution は [`../mention/philosophy.md`](../mention/philosophy.md) — **一字一句変更しない**

審査を通すために設計するのではない。  
最初から **最小権限 · 最小取得 · 最小目的** で設計する。結果として審査にも通りやすい。

---

## Principles

### P1. Single Purpose

Browser 製品は監視ツールではない。  
ユーザーが今ブラウザで見ている文脈を、その場で終わらせる Action Tool である。

したがって Family 全体で最初から存在しない:

- ダッシュボード · 時系列分析 · SNS監視 · 全文検索 · バックグラウンド収集

### P2. User Opens First

勝手にページを巡回しない。

```text
User opens page
  → Browser product assists
```

拡張はユーザーの意思で開いた文脈に従う。エージェント的な巡回は禁止。

### P3. Current Context Only

作業対象は **現在のコンテキスト**（多くの場合 active tab / 許可済み Adapter）に限る。  
未許可・非対応の文脈では沈黙してよい。  
P2 と一体で読む（Browser 側で User Opens First と Current Context を条文上分けた）。

### P4. Non-Send

取得した業務データ・DOM 抽出結果を、SUGUDASU 管理下や第三者へ**勝手に送らない**。  
クラウド蓄積を製品の本体にしない（C-05）。

### P5. Explicit Network

ネットワーク通信は、ユーザーが明示した操作のときだけ。  
バックグラウンド送信・黙っての同期は禁止。  
（子によって Webhook / 明示 Export 等の形は異なるが、「押したときだけ」は共通。）

### P6. Local First

既定の状態は端末内で完結する。  
端末内の Done / Template / 設定は「終わらせた痕跡」であり、監視用アーカイブではない。  
「保存ゼロ」と書いて端末内痕跡を否定しない（字面の罠）。

### P7. Rule Based

文脈の解釈・文案生成を LLM に丸投げしない。  
構造シグナルとルール（Scenario / テンプレ / `{{vars}}`）で足りる範囲に留める。  
ページを「評価」して断定しない（感情スコア · 「返信するな」AI 断定の禁止は子の Scenario 原則と対応）。

### P8. Minimal Permission

初期から `<all_urls>` / 広範 host を固定取得しない。  
必要な origin は optional とし、ユーザー操作で許可する。  
権限の広さは Store 説明の Single Purpose と一致させる。

---

## 対応表（Browser ↔ Mention）

| Browser | 対応する Mention（`philosophy.md`） |
|---------|-------------------------------------|
| P1 Single Purpose | P1 Single Purpose |
| P2 User Opens First | P2 Current Context Only |
| P3 Current Context Only | P2 Current Context Only（重複統合、Browser側で吸収） |
| P4 Non-Send | P3 Local First / Non-Exfiltration |
| P5 Explicit Network | P4 Explicit Network |
| P6 Local First | P3 Local First / Non-Exfiltration |
| P7 Rule Based | P5 Zero Thinking / No LLM · P8 Scenario is Structural |
| P8 Minimal Permission | Mention の ADR-0004 / optional host（P番号として独立していなかった。将来 Mention 側への明記を検討可。**今回は Mention 条文を書き換えない**） |

Mention 固有で親に昇格していないもの（例: **P6 No Paste Product** · **P7 Platform is Feature**）は子のまま維持する。

---

## Sync（別層）

クラウド同期・アカウント機能は Browser Constitution の必須要件ではない。  
Mention では **Non-Goal**（ADR-0003 · ADR-0008）。

---

## 関連

- [`philosophy.md`](./philosophy.md)  
- [`browser.md`](./browser.md)  
- ADR: [`../mention/decisions/0008-browser-brand-layer.md`](../mention/decisions/0008-browser-brand-layer.md)
