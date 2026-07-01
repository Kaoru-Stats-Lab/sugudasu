# Zenn 向け 非送信設計（#6）— 備忘録

**更新:** 2026-07-01  
**状態:** 初稿あり · [`ZENN_ARTICLE_06_DRAFT.md`](ZENN_ARTICLE_06_DRAFT.md)  
**主ツール:** `/`（ポータル）· 本文参照 [`statements.html`](../../tools/statements.html)  
**utm_campaign:** `article_06_privacy_design`

---

## 使い方

- Zenn エディタに **そのまま貼らない** メモ。公開用は `ZENN_ARTICLE_06_DRAFT.md`。
- **記事の芯:** 「100%安全」ではなく **レイヤを分けて説明する** 設計記事（開発者向け B 軸）
- **正本:** `tools/statements.html` · `privacy.html` · #1 invoice の続き

---

## 推奨タイトル

**顧客データをサーバーに送らない Web ツールの設計 — 静的配信とブラウザ内処理**

| 項目 | 内容 |
|------|------|
| 軸 | **B 80%** + A 20% |
| 読者 | セキュリティ関心 · FE · 個人開発 |
| 字数 | 2,000〜2,400 |
| 優先 | P1（#12 normalize の前後 · 非送信連載の背骨） |

---

## H2 案

1. **「ブラウザ内」は一言で片付けられない** — fetch / キャッシュ / JS / 出力 / 保存
2. オンライン / オフライン · **ブラウザ3系統の得意不得意**（AI 除く）
3. 非送信と言うとき、何を送らないのか
4. 静的配信 · なぜ SaaS DB ではないか
5. 通信レイヤ5段 · DevTools 3ステップ
6. ツール当てはめ · Sync は別ライン

---

## 書かないこと

- 「完全オフライン」「入力ゼロ通信」
- Sync をコアと同じ非送信として書く
- 競合 SaaS の名指し批判

---

## 内部リンク

- #1 invoice · #12 normalize · #14 group-split
- https://sugudasu.com/statements
- https://sugudasu.com/privacy

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-01 | 初版 · ZENN_ARTICLE_06_DRAFT 作成 |
