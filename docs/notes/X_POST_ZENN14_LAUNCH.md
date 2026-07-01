# X 投稿 — Zenn #14 公開連動

**用途:** group-split Zenn 記事の公開日〜翌日  
**記事:** [`ZENN_ARTICLE_14_DRAFT.md`](ZENN_ARTICLE_14_DRAFT.md)  
**記事 UTM:** `article_14_group_split`  
**X UTM:** `zenn14_launch` / `article_14_group_split`

---

## 推奨投稿（Zenn URL 差し替え）

公開後、末尾を **実際の Zenn 記事 URL** に差し替えて投稿。

```
研修の班分け、ExcelのRAND()だと「なぜこの班？」に答えづらくないですか。

シード付きシャッフルで再現説明できる・名簿はブラウザ内だけ、という設計をZennに書きました。

https://（Zenn記事URL）?utm_source=x&utm_medium=social&utm_campaign=zenn14_launch

https://sugudasu.com/group-split?utm_source=x&utm_medium=social&utm_campaign=article_14_group_split
```

---

## 代替A（ハッカソン幹事向け）

```
ハッカソンの班分けは「ランダム」より「各組にエンジニア1人」と「欠席時の再編」が重い。

Excel RAND()から卒業する話をZennにまとめました（非送信 · TSV/Slackコピー）。

https://（Zenn記事URL）

https://sugudasu.com/group-split?utm_source=x&utm_medium=social&utm_campaign=article_14_group_split
```

---

## 代替B（説明できる公平 · 短文）

```
班分けで欲しいのは魔法の公平じゃなく、後から説明できる公平。

RAND() vs シード付きシャッフルの話をZennに投稿しました。

https://（Zenn記事URL）?utm_source=x&utm_medium=social&utm_campaign=zenn14_launch
```

---

## 投稿タイミング

| 順 | 内容 |
|----|------|
| 1 | Zenn **予約投稿** 設定 · 公開後に記事 URL を控える |
| 2 | 上記投稿（当日 or 翌日） |
| 3 | 固定ピンは hub のまま差し替え不要 |

---

## 画像（任意）

- 結果画面 + シード値表示
- TSV コピー or Slack 用テキスト
- 欠席タップ再構成（M02）

---

## 予約投稿前チェック

- [ ] `npm run build:pages` · `/group-split` 本番 URL 確認
- [ ] スクショ 3枚を Zenn にアップロード
- [ ] 本文は `ZENN_ARTICLE_14_DRAFT.md` の「### 本文」からコピー
