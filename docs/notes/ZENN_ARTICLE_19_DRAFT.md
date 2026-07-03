# Zenn 初稿 #19 — 閉域でテストデータが欲しいとき、ブラウザは何をしているか

**Status:** Zenn 下書き保存済（**10月中旬** 公開予定 · 5,233字 · 2026-07-03）  
**軸:** B 60% + A 40% · リポ初稿 約 2,600 字 → Zenn 本文で拡張済み  
**CTA UTM:** `article_19_test_data_closed`  
**ネタ正本:** [`ZENN_TEST_DATA_DRAFT_MEMO.md`](ZENN_TEST_DATA_DRAFT_MEMO.md) · [`TEST_DATA_TOOL_SPEC.md`](TEST_DATA_TOOL_SPEC.md) §6.8.6

---

## Zenn 投稿用（以下をコピー）

### タイトル

```
閉域でテストデータが欲しいとき、ブラウザは何をしているか — Fakerは書けるが稟議で止まる話
```

### タグ（3つまで推奨）

```
Web開発 / 個人開発 / テスト
```

（代替: `フロントエンド / セキュリティ / SI`）

---

### 本文

顧客VPNの中だけで動かす給与SaaSのインポート試験。本番DBのコピーは禁止、Mockaroo はクラウドSaaS禁止、USB で怪しい CSV を持ち込むのもアウト — こういう現場で「それっぽい社員マスタが欲しい」と言われたことはありませんか。

私は受託SI寄りの文脈で、**Python + Faker で十分作れる** 場面を何度も見てきました。それでも現場では止まります。止まる理由は「スクリプトが書けない」ではなく、**稟議 · 列整合 · 再現性 · 説明資料** です。

[SUGUDASU テストデータ](https://sugudasu.com/test-data?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed) は、その隙間向けに個人開発した **ブラウザ内だけで架空CSVを生成するツール** です。エンタープライズのテストデータ管理（TDM）や本番マスキングの代替ではありません。非送信の背骨は [SUGUDASU の約束](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed)（#6 非送信設計と同型）と同じで、ここでは **労務CSV · 閉域** に絞って書きます。

## 閉域SIで、エンジニアが困るポイント

閉域の制約は業種をまたいで似ています（本番持ち出し禁止 · 外部ファイル禁止 · SaaS禁止）。エンジニア視点では、次のどれかで手が止まります。

| 止まり方 | 典型の一言 |
|----------|------------|
| **本番コピー禁止** | マスキング export も審査が重い |
| **SaaS禁止** | Mockaroo も社内アカウント審査でOUT |
| **自作スクリプト** | 「誰がメンテする？ ウイルス対策は？」 |
| **整合** | 郵便番号と住所 · 社員番号と給与明細が毎回バラバラ |
| **監査** | 「同じデータで再テストせよ」— シードがないと説明できない |

事務職が Excel で社員マスタを手打ちしている現場もあります。マーケではその絵が刺さります。ただ **エンジニアに「Excelやめよう」と売るのはズレます**。エンジニアには **稟議が通る説明付きツールで、今日・この端末で、整合済みCSV** が刺さります。

## 手段の比較 — 何が違うのか

特定サービス名で貶すつもりはありません。カテゴリで見るとこうです。

| 手段 | データの行き先 | 閉域でよくある判定 |
|------|----------------|-------------------|
| **本番マスキング export** | 社内DBから抽出 | C3（持ち出し）で重い |
| **クラウド型ジェネレータ** | **生成のたびに相手クラウド** | C4（SaaS禁止）でOUT |
| **Excel手打ち** | ローカル | 整合と工数が破綻 |
| **自前 Faker / SQL** | ローカル | **配布・稟議・列定義の再利用** が課題 |
| **静的 Web ツール（本ツール）** | **端末内生成**（POSTなし設計） | 説明ページ + DevTools で通しやすい |

「ブラウザで動く」だけでは差がありません。差は **生成のたびに名簿・給与が外部へ送られるか** です。

## 「通信なしでデータができる」の正体

情シスから「通信なしでどうやってデータができるの？」と聞かれたとき、私はまず **「通信ゼロ」ではない** と切ります。

Mockaroo のように **1件ずつクラウドが返す** のではなく、次の3ステップです。

1. **初回だけ** — HTML / JavaScript と、氏名・住所などの **辞書データ** が端末へ届く（普通のページ読み込み · [#6 のレイヤ②](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed)）
2. **生成ボタン以降** — 届いたプログラムが端末内で乱数とルールを回し、社員行を組み立てる。**この間、氏名・給与を当社サーバーへ送る API は呼ばない**（レイヤ①）
3. **ダウンロード** — `Blob` で CSV を手元保存。アップロードはしない

エンジニア向けの一行: **埋め込み辞書 + クライアント側 RNG（シード再現可）+ POST なし**。25万件もチャンク単位で端末内生成し、結合して1本の CSV にします。

![](https://static.zenn.studio/user-upload/PLACEHOLDER-20260703.png)
*生成時 Network — POST なし（投稿前に差し替え）*

「オフラインでも動く」は **キャッシュされた JS が残っている状態** の話で、100% オフライン保証ではありません。インターネット自体が使えない現場では、ビルド済み静的ファイルの **社内ミラー** が現実解です（詳細は製品 FAQ · 稟議向けは note 予定）。

## なぜ Faker で足りないことがあるか

率直に言うと、**閉域で Python 環境が使えるなら Faker で十分なことも多い** です。それでも SUGUDASU を使う理由は、だいたい次に集約されます。

| 課題 | 自前スクリプト | test-data |
|------|----------------|-----------|
| **稟議** | 「社内配布スクリプトの審査」 | URL + [約束ページ](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed) + DevTools |
| **労務列** | 毎案件で列定義 | 社員マスタ · 給与3ヶ月 · 再雇用 · 地雷オプション |
| **整合** | 自分で郵便番号↔住所 | 生成時に揃える |
| **再現** | Git 管理はできるが説明が要る | **シード固定** で同じCSV |
| **今日すぐ** | venv · ライブラリ · 社内PC制約 | ブラウザだけ |

**シード再現** は地味ですが、監査で「同じ手順で再テスト」と言われたときに効きます。`RAND()` を Excel に書く話と同型で、[#14 班分け記事](https://sugudasu.com/group-split?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed) でも扱いました。

### 全角半角整え（normalize）とは別線

大規模CSV（数万〜25万件）を [全角半角整え](https://sugudasu.com/normalize?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed) に流すのは設計外です（500行 cap · Excel列コピー向け）。エンジニアの大規模試験では、全半角は **生成時の形式指定** か **自前ETL** で足りる — test-data と normalize を1本のパイプラインとして売りません。

## DevTools で確認する — 3分

[#6 非送信設計](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed) と同じ手順です。

1. **Network** — `F12` → Network。件数を選び CSV 生成を実行。**入力内容をボディに含む POST** が当社ドメインへ飛ばないこと。ページ初回読込 · フォント · 広告は別レイヤ。  
2. **件数を上げる** — 2.5万 · 10万 · 25万でも同様に POST なし（処理はチャンク分割 · 結合DL）。  
3. **機内モード（任意）** — 一度読込後、オフラインで再生成。キャッシュ依存であることを理解した上で試す。

情シスへの説明は「生成に広告は不要」「POST がないことを自分で確認できる」の2点が効きます。

## 残る壁 — ホワイトリストと広告

データセットの **作り方** を理解しても、現場はそこで終わりません。

- **プロキシ** — `sugudasu.com` 自体の許可が要る（フォントは UI 用 · 生成に必須ではない）  
- **広告** — コアは無料運営のため広告枠あり。**CSV生成には不要**。広告ドメインだけブロックされても生成は動く想定  
- **エアギャップ** — ホワイトリストではなく **社内ミラー**（`dist/` を社内Webサーバへ）

SUGUDASU が代わりに稟議を通すことはできません。[情報管理向けまとめ](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed#for-it-security) に申請メモのコピペブロックを置いています。

## やらないこと

- **エンタープライズ TDM · 本番DBマスキング** の代替  
- **実在のマイナンバー · 口座番号** の生成  
- 「100%安全」「完全オフライン」「通信ゼロ」の断定  
- 金融本部向けの顧客マスタ（労務楔の主役は社員マスタ）  

ダウンロード後の CSV 保管 · 廃棄は利用者側の責任です。

## まとめ

閉域でテストデータが欲しいとき、エンジニアは **作れないのではなく、通らない** ことが多いです。Faker は書ける。Mockaroo は便利。でも SaaS 禁止 · 自作配布禁止 · 労務列の手戻り · 監査のシード — ここで止まる。

SUGUDASU test-data は、その止まり方のうち **説明可能な静的ツール + 労務プリセット + 端末内生成** に寄せた個人開発です。魔法ではなく、[#6 で書いたレイヤ分離](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed) の **労務CSV版の実例** だと思ってください。

困った点は [更新履歴ページ](https://sugudasu.com/updates) のフォームから送ってもらえると、changelog に反映します。

**ツール:** https://sugudasu.com/test-data?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed

**約束 · DevTools:** https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed

**プライバシーポリシー:** https://sugudasu.com/privacy?utm_source=zenn&utm_medium=social&utm_campaign=article_19_test_data_closed

---

### 著者メモ（Zenn に載せない）

- [ ] スクショ: ① Network POSTなし（25万生成時）② 件数セグメント ③ CSV DL
- [ ] `PLACEHOLDER` を Zenn アップロード後に差し替え
- [ ] #6 公開URLに差し替え（本文中 `zenn.dev/` プレースホルダ）
- [ ] test-data FAQ §6.8 本番反映タイミングと整合
- [ ] note 稟議向け分割の要否（`NOTE_TEST_DATA_DRAFT_MEMO` 将来）
- [ ] `X_POST_ZENN19_LAUNCH.md` 公開時作成
- [ ] `ZENN_EDITORIAL_PLAN.md` #19 と整合
