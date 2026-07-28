# SUGUDASU Browser — 思想

**更新:** 2026-07-28  
**正本（境界）:** [`constitution.md`](./constitution.md)  
**層マップ:** [`browser.md`](./browser.md)  
**子の思想（Mention）:** [`../mention/philosophy.md`](../mention/philosophy.md) — **置き換えない**（ADR-0008）

---

## 1. Mission

> **ブラウザで見つけたものを、その場で終わらせる。**

英語短句（層）: **Find in the browser. Finish there.**

これだけが Browser 層の Mission である。  
監視でも、同期でも、ダッシュボードでもない。

---

## 2. 何か / 何ではないか

### 何か

ユーザーが**今ブラウザで見ている文脈**を、拡張機能などの Surface で終わらせる Family。

Mention はその最初の子: **言及（口コミ・記事・SNS 等）→ Done**。

### 何ではないか

| 誤った吸収 | なぜ Reject |
|------------|-------------|
| ソーシャルリスニング / 監視 SaaS | 溜めて見せる Job。Browser Mission と逆 |
| Sync のログイン同期を Browser 製品に必須化 | 別層。Local First を壊す |
| Web ツール全部の Extension 化 | Surface の都合で層を混ぜない |
| 「Browser = Chrome 全権限」 | Minimal Permission に反する |

---

## 3. 親子関係

```text
Browser Constitution（親 · 本ディレクトリ）
  ⊃ Mention Constitution（子 · mention/philosophy.md P1〜P8）
  ⊃ 将来の Capture / Share / Fill …（各子の philosophy）
```

- 親を足しても **子の条文を書き換えない**  
- 子が親より緩くなる提案は Reject  
- 対応表: [`constitution.md`](./constitution.md) §対応表  

---

## 4. 判断に迷ったら

1. それは **今開いているページを終わらせる** か、**溜める / 同期する / 分析する** か  
2. Sync 層の仕事を Browser に持ち込んでいないか（ADR-0008）  
3. 子プロダクト（Mention）の既存 ADR · Constitution と矛盾しないか  

価格・GTM・Phase ロードマップは思想の後。Mention ではドキュメント採用済・コード未実装（ADR-0007）。
