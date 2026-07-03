# Zenn 初稿 #20 — Linktree なしで懇親会のフォロー交換を終わらせる URL hash の話

**Status:** ドラフト（提督レビュー · スクショ差し替え待ち）  
**軸:** B 70% + A 30% · 約 2,400 字  
**CTA UTM:** `article_20_link_qr`  
**ネタ正本:** [`LINK_QR_TOOL_SPEC.md`](LINK_QR_TOOL_SPEC.md) · [#6 非送信設計](ZENN_ARTICLE_06_DRAFT.md)

---

## Zenn 投稿用（以下をコピー）

### タイトル

```
Linktree に登録せず、懇親会のフォロー交換を QR で終わらせる — URL の # に載せるだけ
```

### タグ（3つまで推奨）

```
Web開発 / 個人開発 / フロントエンド
```

（代替: `セキュリティ / プライバシー / QRコード`）

---

### 本文

テック系イベントの懇親会で、「X 何ですか？」「GitHub 見せてください」「Zenn 読んでます」と言われたことはありませんか。名刺に Linktree が1本ある人もいますが、**その場で初対面の人が個別にフォローしにくい** のと、**lit.link にサッと登録するのも面倒** という話は別問題です。

私は個人開発の [SUGUDASU リンク集QR](https://sugudasu.com/link-qr?utm_source=zenn&utm_medium=social&utm_campaign=article_20_link_qr) で、**X · GitHub · Zenn · Qiita などを1枚のリンク集にまとめ、QR コードで渡す** ツールを足しました。アカウント登録は不要で、**入力したリンク集は当社サーバーに保存しません**。データは共有 URL の **`#`（フラグメント）にエンコードされるだけ** です。

この記事は [顧客データをサーバーに送らない Web ツールの設計](https://zenn.dev/PLACEHOLDER/articles/PLACEHOLDER)（#6）の続編で、**「保存しない link hub」を URL だけで配る** 実装の話です。lit.link との勝負ではなく、**イベント当日3分で終わらせる使い捨て** 向けです。

## なぜサーバーに載せないのか

Linktree や lit.link は **常設プロフィール** に強いです。デザイン · 分析 · SNS 連携 — 日常運用には向いています。

一方、懇親会のフォロー交換は次のような性質があります。

| 観点 | 常設 link hub SaaS | 当日の即席交換 |
|------|-------------------|----------------|
| 準備 | アカウント · プロフィール更新 | **5分前にまとめたい** |
| データ | 相手のサーバーにプロフィール保存 | **公開 URL だけ渡したい** |
| 形 | 1本の短い URL | **QR を見せる** ことが多い |
| 寿命 | 長期 | **そのイベント限り** でよい |

「サーバーに載せない」と言うとき、ここで言っているのは **あなたが入力したリンク一覧を、処理目的で当社 API に POST しない** という意味です（[SUGUDASU の約束](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_20_link_qr) と同型）。

ページを開くこと自体は CDN 経由の GET です。#6 で書いた **「POST しない ≠ 通信しない」** の区別はそのまま有効です。

## URL の `#` に載せる — 何が起きているか

実装の芯はシンプルです。

1. 表示名とリンク配列を **短い JSON** にする（例: `{"v":1,"n":"山田","l":[["x","https://x.com/..."],["gh","https://github.com/..."]]}`）
2. UTF-8 → **base64url** でエンコードする
3. `https://sugudasu.com/link-qr#p=<encoded>` を共有 URL にする
4. QR コードは **その URL 全体** を静的に埋め込む

**フラグメント（`#` 以降）は HTTP リクエストに含まれません。** ブラウザがページを取りに行くとき、サーバーは `#p=...` の中身を見ません。デコードは **受け取った人のブラウザ上の JavaScript** が行います。

これは新しい発明ではありません。OSS でも近いパターンがあります。

| 例 | 特徴 |
|----|------|
| [qrshare](https://github.com/jacksoncurrie/qrshare) | `#v1.p.<payload>` · 汎用テキスト受け渡し |
| [linkdance](https://github.com/anshxs/linkdance) | Linktree 風 UI · Base64 URL（**TinyURL 依存**） |
| lz-string 系 JSON ツール | `#d=...` で圧縮共有 |

SUGUDASU 版は **日本語イベント文脈** · **テック SNS プリセット** · **外部短縮 URL なし** に絞っています。ペイロードが小さいうちは lz-string なしの base64url だけで足ります（リンク6枠 · 1200 バイト上限）。

### 「暗号化」ではない

マーケで誤解されやすいので、はっきり書きます。**暗号化ではありません。** URL を知っている人は誰でも中身を読み取れます。入れるべきは **すでに公開している X / GitHub / Zenn の URL** だけです。API キーや非公開メモは入れないでください。

## 静的 QR の制約 — 幹事が知っておくこと

この方式の QR は **動的 QR ではありません**。QR の模様に URL 全体が焼き込まれるので、

- **あとからリンクを差し替えられない**（変えたいなら QR を作り直す）
- URL が長いと **QR が高密度** になり、読み取りにくくなる

その代わり、**リダイレクトサーバーが不要** · **SUGUDASU が消えても URL を知っていれば decode 可能**（静的 HTML が残る限り）という性質があります。イベント当日の使い捨てには向いています。

![](https://static.zenn.studio/user-upload/PLACEHOLDER-link-qr-20260703.png)
*リンク入力 → プレビュー → QR（投稿前に差し替え）*

## 閲覧モードと編集モード

実装で少しだけ配慮したのは **モードの切り分け** です。

- **QR をスキャンして開いた人** — リンクカードだけの閲覧 UI（編集フォームは出さない）
- **自分で作っている人** — 入力フォーム · プレビュー · PNG 保存 · URL コピー

`sessionStorage` で「いま編集中か」を覚え、同じ URL でも作成者は編集を続けられるようにしています。細かいですが、**共有リンクを開いた相手にフォームが出る** のは体験が悪いので分けました。

QR 生成には [qrcode](https://www.npmjs.com/package/qrcode) を CDN から動的 import しています。**ペイロード自体は外部に送りません** が、ライブラリ取得の GET は発生します（#6 のレイヤ①）。

## lit.link と使い分ける

| 使う場面 | おすすめ |
|----------|----------|
| インスタのプロフィールに常設1本 | lit.link / Linktree |
| 懇親会・LT 後の **その場フォロー交換** | リンク集QR（使い捨て QR） |
| 名刺に長期載せる · クリック分析 | lit.link 等 |
| 稟議で「クラウドにプロフィールを置きたくない」 | URL hash 方式の説明がしやすい |

競合を殺すのではなく、**ペルソナが違う** と割り切るのがよいです。

## 自分で確かめる手順（30秒）

1. [リンク集QR](https://sugudasu.com/link-qr?utm_source=zenn&utm_medium=social&utm_campaign=article_20_link_qr) を開く
2. X · GitHub などを入力し「プレビューとQRを更新」
3. DevTools → **Network** を開き、**入力内容が POST されていない** ことを確認する
4. 表示された URL の `#` 以降をコピーし、別タブで開いて同じリンク集になることを見る
5. スマホで QR を読み取り、閲覧モードになることを確認する

「サーバー保存なし」を信じるより、**フラグメントがリクエストに乗らない** ことを一度見る方が、エンジニア同士の説明は早いです。

## まとめ

- 懇親会のフォロー交換は **常設 link hub とは別 Pain**
- **JSON → base64url → `#p=`** でサーバー非保存のリンク集を配れる
- **暗号化ではない** · 静的 QR · 使い捨て向け
- Prior Art はある。差は **日本語 · テック SNS 枠 · 非短縮 URL · SUGUDASU 非送信ライン** に置いた

関連ツール: [SUGUDASU SNS](https://sugudasu.com/sns?utm_source=zenn&utm_medium=social&utm_campaign=article_20_link_qr)（プロフィール文のデコ · 文字数）· [宛名ラベル](https://sugudasu.com/label?utm_source=zenn&utm_medium=social&utm_campaign=article_20_link_qr)（名刺用紙に QR を印刷）

---

**免責:** 本記事は SUGUDASU 個人開発の実装メモです。Linktree · lit.link はそれぞれのサービスの利用規約に従ってください。

---

## 提督チェックリスト（投稿前）

- [ ] スクショ2枚（編集 UI · 閲覧モード · Network タブ）
- [ ] #6 記事の公開 URL を内部リンクに差し替え
- [ ] 自分の QR を1枚作り、記事末尾 or リプ用に載せるか判断
- [ ] `ZENN_EDITORIAL_PLAN.md` に #20 行を追記

---

## メモ（リポ内のみ）

- **公開タイミング案:** link-qr 本番 smoke 後 · カンファ前後
- **note 連携:** 不要（B記事 · 実装寄り）
- **X 初回ポスト案:** 「懇親会で X/GitHub/Zenn を聞き返される問題、URL の # だけで link hub を配るツールを足しました（サーバー非保存）」
