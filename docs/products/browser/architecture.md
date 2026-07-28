# SUGUDASU Browser — Architecture（層）

**更新:** 2026-07-28  
**役割:** Browser Family の置き方 · 子プロダクトの境界  
**非役割:** Mention の Adapter / Scenario 詳細（[`../mention/specification.md`](../mention/specification.md)）  
**憲法:** [`constitution.md`](./constitution.md)

---

## 1. Family 形

```text
Browser Layer
  ├── Shared: Constitution · Minimal Permission · Local First · Explicit Network
  ├── Mention     Current Context → Scenario → Action → Done（言及）
  ├── Capture     （将来）見つけた断片をその場で仮置き・戻す 等
  ├── Share       （将来）今の文脈を明示共有で終わらせる 等
  └── Fill        （将来）今のフォーム文脈を定型で埋めて終わる 等
```

名前は仮。追加時は各子の `philosophy` / ADR を作り、**親 Constitution より緩くしない**。

---

## 2. Mention の載せ方（現状）

| 層 | 置き場 |
|----|--------|
| 親憲法 | `docs/products/browser/constitution.md` |
| 子憲法 | `docs/products/mention/philosophy.md`（変更しない） |
| 子仕様 | `docs/products/mention/specification.md` |
| 実装 | `extensions/mention/` |
| LP | `tools/mention.html` · `/mention` |

実装の Core / Adapter 分離は Mention specification に従う。  
Browser 層ドキュメントは **コードパスを強制しない**（ADR-0008: Mention 実装変更なし）。

---

## 3. Sync を載せない

```text
❌ Mention + クラウド同期アカウント
❌ Browser Family 共通ログイン必須
○ Sync 層の別製品・別ホスト（既存 Sync ライン）
```

Team 共有が価格ロードマップ Phase 4 に現れても、それは **ドキュメント上の将来案**であり、Mention への Sync 層実装ではない（ADR-0007 Phase 0 無料 · 課金コード禁止）。

---

## 4. Surface 方針（共通の推奨）

- Chrome MV3 Extension を既定候補とする  
- Side Panel 等「今のページの横で終わらせる」Surface を優先（Mention ADR-0001）  
- Dashboard を本命 Surface にしない（ADR-0002）

子ごとに例外 ADR が必要なら、親 Constitution を破らない範囲で書く。

---

## 関連

- [`README.md`](./README.md)  
- [`browser.md`](./browser.md)  
- Mention ADR-0008: [`../mention/decisions/0008-browser-brand-layer.md`](../mention/decisions/0008-browser-brand-layer.md)
