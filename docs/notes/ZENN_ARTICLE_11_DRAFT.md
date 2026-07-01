# Zenn 初稿 #11 — SNS懸賞の抽選を Excel からやめた話

**Status:** ドラフト（提督レビュー · 公開は #14 後推奨 · スクショ差し替え待ち）  
**軸:** A 70% + B 30% · 約 2,200 字（note と分割済み）  
**CTA UTM:** `article_11_fairdraw_excel`  
**ネタ正本:** [`ZENN_FAIR_DRAW_DRAFT_MEMO.md`](ZENN_FAIR_DRAW_DRAFT_MEMO.md) · [`LOTTERY_PRIZE_LAW_TOOL_SPEC.md`](LOTTERY_PRIZE_LAW_TOOL_SPEC.md)  
**景表法・運用:** [`NOTE_ARTICLE_FAIR_DRAW_DRAFT.md`](NOTE_ARTICLE_FAIR_DRAW_DRAFT.md)（note 側）

---

## Zenn 投稿用（以下をコピー）

### タイトル

```
SNS懸賞の抽選を Excel からやめた話 — 公平シャッフルと説明用PDF（サーバー送信なし）
```

### タグ（3つまで推奨）

```
Excel / マーケティング / 個人開発
```

（代替: `景品表示法 / フリーランス / ブラウザ`）

---

### 本文

SNS 懸賞や店頭キャンペーンの抽選、監査担当が同席しない現場では、Excel の `RAND()` と手作業がまだ現役です。私も「その名簿で本当に抽選した？」と聞かれたとき、**再計算で数字が変わる** だけでは説明が弱いと感じました。その **間** を埋めるツールとして [SUGUDASU 抽選](https://sugudasu.com/fair-draw?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel) を個人開発しました。

この記事では、**班分け**（[別記事で `RAND()` 卒業の話](https://sugudasu.com/group-split?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel)）ではなく、**懸賞の「誰が当たったか」** に絞ります。景品表示法や法務なし組織の相談先は [note で別途](https://sugudasu.com/fair-draw?tab=check&utm_source=note&utm_medium=social&utm_campaign=note_fairdraw_prizelaw) 書いています。

## 原体験 — 立会とログが当たり前だった世界

以前関わった企画の抽選では、**内部監査の立会** と **デジカメでのログ撮影** が義務でした。fair-draw は統制 SaaS でも監査部門でもありません。ただ **内部監査がいない会社** では、手順の穴・記録の欠落・番号管理ミスまで含め、**「公正だった」と言いにくい構造** が残りやすい、というのが原体験です。

## 抽選は「公正」でも「疑われる」

| 事例 | 教訓 |
|------|------|
| [ビックカメラ（2017）](https://nlab.itmedia.co.jp/cont/articles/3269464/) | 欠番だけで不正疑惑が燃える |
| [ブラッター証言（2016）](https://www.afpbb.com/articles/-/3090359/) | 物理抽選は操作疑いの想像を与える |
| [パリ五輪柔道（2024）](https://www.nikkansports.com/olympic/paris2024/judo/news/202408040000082.html) | 手順が正しくても納得感は崩れる |

fair-draw が狙うのは魔法の公正ではなく、**疑われたときに渡せる材料** です。名簿 txt · シード · CP識別名 · 監査 PDF — **監査がいない現場の最低限の説明責任** に近い位置づけです。

## Excel `RAND()` が説明に弱い理由（懸賞文脈）

| | Excel `RAND()` | 求められること |
|---|----------------|----------------|
| 再実行 | F9 · 再計算で並びが変わる | **同じ名簿なら同じ結果** と説明したい |
| 名簿 | スプシ上のまま | **その回のスナップショット** が欲しい |
| 共有 | 手動コピー | Slack / Excel に **すぐ貼れるリスト** |

「ランダムに見える」ことと、「後から説明できる」ことは別です。fair-draw では **シード付きシャッフル** と **名簿の指紋（SHA-256）** を画面に出します。**100%公平の魔法** ではなく、**説明できる公平** です。

## Phase 1 — 名簿貼付から公平抽選まで

[抽選タブ](https://sugudasu.com/fair-draw?tab=draw&utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel) の流れです。

1. **キャンペーン識別名** · 実施者を入力（並行 CP で混線しないため）  
2. 名簿を貼付（1行1名 · TSV 可）  
3. 賞帯を設定して抽選実行  
4. 結果を **TSV でコピー** — Excel にそのまま貼れる  

シャッフルは **Fisher-Yates** + `crypto.getRandomValues`（Web Crypto）です。処理はブラウザ内のみで、名簿を当社サーバーへ POST する API はありません。

UI は「発表台」より **作業台** 寄りです。幹事が欲しいのは **コピーして終わるリスト** だと判断しました。

![](https://static.zenn.studio/user-upload/PLACEHOLDER-20260701.png)
*証跡バー（シード · 指紋 · CP名）— 投稿前に差し替え*

## 証跡3点セット

| # | 成果物 | 役割 |
|---|--------|------|
| 1 | 名簿 `.txt` | **その回の入力** の正本 |
| 2 | 監査 PDF | 企画条件 + 結果の **読み物用** 証跡 |
| 3 | 抽選 JSON | シード · 設定 · 結果の **再現用** データ |

ハッシュだけでは中身を検証できません。**キャンペーン識別名** を必須にし、「どの CP のどの回か」が混線しないようにしています。名簿の前処理は [正規化ツール](https://sugudasu.com/normalize?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel) 経由でもできます。

## 限界 — 抽選まで

fair-draw は **「誰が当たったか」を決めるツール** です。当選品の発送 · DM · 住所収集 · 景品表示法の最終判断までは肩代わりしません。抽選が公正でも **賞品を届けない** と企画全体は信頼を失ちます — 履行は幹事側の仕事のままです。

## Phase 0 について（1段落）

抽選の前段に **景品表示法の一次チェック** タブもあります（[景品チェック](https://sugudasu.com/fair-draw?tab=check&utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel)）。合法判定ではなく **専門家への問い合わせ推奨の下準備** です。揉め事カード · 告示ベースの数値 · 消費者庁の相談先 · 法務なし組織の進め方は、幹事向けに **note で詳述** しています（公開後 URL 差し替え · 初稿はリポジトリ内 `NOTE_ARTICLE_FAIR_DRAW_DRAFT.md`）。

## やらないこと

- 「合法」「違法」の断定 · 統制 SaaS 級の暗示  
- X API · 名簿スクレイピング · 検証タブ · ZIP 一括（未実装）  
- 当選品の発送 · 履行管理  

## まとめ

懸賞の抽選で欲しいのは派手な演出ではなく **説明できる公平** です。Excel `RAND()` から一歩進むなら、シードと名簿スナップショットと PDF — **証跡3点** をブラウザ内で作り、サーバーに名簿を預けない。それが fair-draw のスコープです。

班分けは [group-split](https://sugudasu.com/group-split?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel)、景表法の運用は note、非送信の思想は [SUGUDASU の約束](https://sugudasu.com/statements?utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel) を参照してください。

困った点や要望は [更新履歴ページ](https://sugudasu.com/updates) のフォームから送ってもらえると、changelog に反映して改善しています。

**公平抽選:** https://sugudasu.com/fair-draw?tab=draw&utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel

**景品チェック:** https://sugudasu.com/fair-draw?tab=check&utm_source=zenn&utm_medium=social&utm_campaign=article_11_fairdraw_excel

---

### 著者メモ（Zenn に載せない）

- [ ] 公開タイミング: **#14 予約投稿の後**
- [ ] スクショ: 証跡バー · TSVコピー · ダウンロード txt
- [ ] note 公開後、本文の note リンクを本番 URL に差し替え（現状は check タブ UTM）
- [ ] 原体験・3事例の事実関係を公開前に再確認
- [ ] `PLACEHOLDER` を Zenn アップロード後に差し替え
- [ ] `X_POST_ZENN11_LAUNCH.md` は未作成
- [x] note 分割: [`NOTE_ARTICLE_FAIR_DRAW_DRAFT.md`](NOTE_ARTICLE_FAIR_DRAW_DRAFT.md)
- [ ] `ZENN_EDITORIAL_PLAN.md` #11 字数を 2,200 に更新
