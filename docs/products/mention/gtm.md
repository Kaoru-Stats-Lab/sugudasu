# Mention GTM（Go To Market）

**更新:** 2026-07-28  
**役割:** 誰に · どこで · どう届けるか（成長の経路）  
**非役割:** 価格そのもの（[`pricing.md`](./pricing.md)）· 実装（[`roadmap.md`](./roadmap.md)）· Store 提出文面の正本（[`chrome-store.md`](./chrome-store.md)）  
**状態:** 骨格（Phase 0 = 無料検証に合わせて肉付けする）  
**採用:** ADR-0008 — ドキュメントとして採用。国際表記は `Mention by SUGUDASU` で足りる（追加実装判断不要）

---

## Positioning（再掲）

Dashboard を売らない。  
**今開いているページで仕事を終わらせる** Action Dispatcher。

GTM でも「監視」「分析」「AI が返信」を前面に出さない。

---

## Target / ICP（仮）

| 優先 | 誰 | 瞬間 |
|------|-----|------|
| 1 | 一人広報 · 店舗オーナー · CS 兼務 | Google 口コミ / 記事を今見ている |
| 2 | 小規模チームのマーケ | X · ニュースで自社名を見つけた |
| 後 | 代理店 · 複数ブランド | Scenario Pack / Team 以降 |

稟議なしで入れられる個人・現場決裁を優先（Pricing Philosophy と一致）。

---

## Motion（仮説）

```text
Target
  → One Person Marketing（開発者自身の発信）
  → Chrome Web Store
  → Reddit / コミュニティ
  → Product Hunt
  → SEO（/mention · 問題語彙）
  → 口コミ（「これで終わった」体験）
```

監視 SaaS の比較表で戦わない。  
**「見つけたあと、何分で終わったか」** の物語で戦う。

---

## Channel Notes（初期）

| 経路 | やる | やらない |
|------|------|----------|
| Chrome Store | Single Purpose · 最小権限の説明 | 全サイト監視を匂わせる文言 |
| `/mention` LP | Mission · インストール · Done | 機能カタログの羅列 |
| Reddit / PH | ワークフローデモ（開く→Done） | AI 生成自慢 |
| SEO | 「口コミ 返信 テンプレ」等の**終わらせる語彙** | 「ソーシャルリスニング 比較」だけで集客して期待を監視に寄せる |

---

## Success Metrics（GTM）

Pricing / Product と同じく、悪い KPI（滞在・レポート閲覧）を追わない。

| 良い | 悪い |
|------|------|
| インストール → 初回 Action 完了 | ダッシュボード滞在 |
| Store レビューの「終わった」言及 | 「監視できない」への機能追加衝動 |
| Adapter 許可の自発追加 | 全 host 一括許可の強要 |

---

## 関連

- 差別化の正本: [`competition.md`](./competition.md)  
- 価格: [`pricing.md`](./pricing.md) · [`pricing-roadmap.md`](./pricing-roadmap.md)  
- Store: [`chrome-store.md`](./chrome-store.md)
