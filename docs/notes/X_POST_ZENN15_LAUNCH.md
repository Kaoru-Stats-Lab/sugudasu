# X 投稿 — Zenn #15 公開連動

**用途:** CRDT × 現場同期 Zenn 記事の公開日〜翌日  
**記事:** [`ZENN_ARTICLE_15_DRAFT.md`](ZENN_ARTICLE_15_DRAFT.md)  
**記事 UTM:** `article_15_sync_crdt_field`  
**X UTM:** `zenn15_launch` / `article_15_sync_crdt_field`

---

## 推奨投稿（Zenn URL 差し替え）

公開後、末尾を **実際の Zenn 記事 URL** に差し替えて投稿。

```
進行表、保存は成功したのに読めなくなったことありませんか？

受付と会場が同時に行を足すと、塊が崩れて現場が止まる。CRDTを流行語で売る話ではなく、混ざらない同期の設計メモをZennに書きました。

https://（Zenn記事URL）?utm_source=x&utm_medium=social&utm_campaign=zenn15_launch

https://sync.sugudasu.com/timeline?utm_source=x&utm_medium=social&utm_campaign=article_15_sync_crdt_field
```

**文字数目安:** 140 前後（URL は t.co 短縮想定）

---

## 代替A（幹事向け · 短文）

```
イベント本番で怖いのは「保存できない」より「読めない」。

進行表の同時編集で行が混ざる話と、現場向けマージの設計をZennにまとめました。

https://（Zenn記事URL）

https://sync.sugudasu.com/timeline?utm_source=x&utm_medium=social&utm_campaign=article_15_sync_crdt_field
```

---

## 代替B（開発者向け · Git比喩）

```
CRDTは新宗教じゃなく、Git vs SVNと同じ系譜の話だと思ってます。

進行表の行が混ざらない同期（設計メモ）をZennに書きました。S4予定・現行はrevision。

https://（Zenn記事URL）

https://sync.sugudasu.com/timeline?utm_source=x&utm_medium=social&utm_campaign=article_15_sync_crdt_field
```

---

## 代替C（1投稿完結 · 超短文）

```
「速く書ける」より「混ざらず読める」— 進行表の同期設計メモをZennに投稿しました。

https://（Zenn記事URL）?utm_source=x&utm_medium=social&utm_campaign=zenn15_launch
```

---

## 投稿タイミング

| 順 | 内容 |
|----|------|
| 1 | Zenn 公開後に記事 URL を控える |
| 2 | 上記投稿（当日 or 翌日） |
| 3 | 固定ピンは hub のまま差し替え不要 |

---

## 画像（任意）

- 行混在前後の図（`mom/dad` → 進行表の翻訳）
- Sync 新版バナー + 手動反映のスクショ

---

## 注意（誤読防止）

- 本文は **設計メモ**（S4 予定 · 現行は `revision`）
- 「CRDT 実装済み」「競合ゼロ」と読まれない文言のまま投稿する
