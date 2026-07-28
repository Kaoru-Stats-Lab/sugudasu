# Mention Implementation Roadmap

**更新:** 2026-07-27  
**役割:** 技術・製品機能の実装順序（When / What next）  
**非役割:** 価格（[`pricing.md`](./pricing.md) · [`pricing-roadmap.md`](./pricing-roadmap.md)）· Constitution（[`philosophy.md`](./philosophy.md)）

原則: **Adapter を追加するだけで対応面を増やす。** Core（Scenario / Action）をプラットフォーム名で汚さない。

---

## 現在地

- α: Side Panel · Action Engine · Google Maps / Web Adapter · `/mention` LP
- Hub 未掲載 · Store 未提出
- **診断 2026-07-28:** broad host が憲法 FAIL — [`diagnostics/2026-07-28_constitution-gap.md`](./diagnostics/2026-07-28_constitution-gap.md)
- 初期値: [`decisions/0007-implementation-defaults.md`](./decisions/0007-implementation-defaults.md)

---

## 実装フェーズ

0. **憲法追随（最優先）** — optional/最小 host · content_scripts 縮小 · 未許可は沈黙 · adapters 分割 · Done 上限 200 · Webhook ペイロード最小化  
1. **MVP 縦通し** — Google Maps 口コミ 1 Scenario が開く→Action→Copy→Done で速い  
2. Adapter: `web` / `x`（許可 UX 付き · Store 初回に含めない判断可）  
3. Scenario 精緻化（sns / hiring / news）  
4. UI i18n + ロケール別テンプレ束（本プロダクトのみ）  
5. Playbook §1.5 · Chrome Web Store 提出（スコープは ADR-0007 HOLD · 推奨 Maps のみ）  
6. 追加 Adapter（YouTube · Reddit · GitHub …）— Current Context → Done の範囲内

---

## 罠

Adapter フレームワークだけ先に肥大化させ、Maps の Done 速度を落とさない。  
**最初の Scenario が速いことが先。**

---

## 関連

- MVP 境界: [`specification.md`](./specification.md) §8
- 価格の出し方: [`pricing-roadmap.md`](./pricing-roadmap.md)
- BACKLOG: [`../../BACKLOG.md`](../../BACKLOG.md) §1-17
