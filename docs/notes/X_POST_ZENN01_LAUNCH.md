# X 投稿 — Zenn #1 公開連動

**用途:** 見積→請求 Zenn 記事の公開日〜翌日  
**正本カレンダー:** `data/x_posts_calendar.json`  
**記事 UTM:** `article_01_invoice_convert`

---

## 推奨投稿（Zenn URL 差し替え）

公開後、末尾を **実際の Zenn 記事 URL** に差し替えて投稿。

```
見積の下書きを、請求書にコピペしていませんか？

登録不要の見積・請求ツールで、JSON下書きを読み込んで書類タブを切り替えるだけ。手順をZennに書きました。

https://（Zenn記事URL）?utm_source=x&utm_medium=social&utm_campaign=zenn01_launch

ツール本体:
https://sugudasu.com/invoice?utm_source=x&utm_medium=social&utm_campaign=article_01_invoice_convert
```

**文字数目安:** 140 前後（URL は t.co 短縮想定）

---

## 代替（短文 · 142字スタイル · W1-D2 拡張）

```
見積の内容、そのまま請求書にしたいのにコピペ地獄になっていませんか？

手順はZennにまとめました（JSON下書き→タブ切替）。会員登録不要。

https://（Zenn記事URL）

https://sugudasu.com/invoice?utm_source=x&utm_medium=social&utm_campaign=zenn01_launch
```

---

## 投稿タイミング

| 順 | 内容 |
|----|------|
| 1 | Zenn 予約が **公開済み** になったら URL を控える |
| 2 | 上記投稿（当日 or 翌日） |
| 3 | 固定ピン v2 はそのまま（hub）— 差し替え不要 |

---

## 画像（任意）

- Zenn 記事の OG または invoice スクショ 1 枚
- `press/assets/invoice-sugudasu01.png`

---

## カレンダー追記案

`x_posts_calendar.json` に `W1-D2-Zenn` として追加する場合:

- `tool`: `invoice`
- `utm_campaign`: `zenn01_launch`
- `remarks`: Zenn #1 公開連動
