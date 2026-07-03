# Zenn 向け test-data（閉域テストデータ）記事ネタ — 備忘録

**更新:** 2026-07-03  
**製品:** `test-data` · URL `/test-data` · `assets/test-data-engine.js` · `assets/test-data-app.js`  
**製品境界:** 架空CSV生成 · 社員マスタ/給与明細プリセット · シード再現 · 最大25万件 · POSTなし · TDM/本番マスキング代替ではない  
**仕様正本:** [`TEST_DATA_TOOL_SPEC.md`](TEST_DATA_TOOL_SPEC.md) §6.8.6 · [`test-data-wedge-SYNTHESIS.md`](test-data-wedge-SYNTHESIS.md)  
**編集カレンダー:** [`ZENN_EDITORIAL_PLAN.md`](ZENN_EDITORIAL_PLAN.md) **#19** · **#6 非送信設計の実例続編（労務楔）**

---

## 推奨タイトル

**閉域でテストデータが欲しいとき、ブラウザは何をしているか — Fakerは書けるが稟議で止まる話**

| 項目 | 内容 |
|------|------|
| 軸 | B 60%（メカニズム · 手段比較 · DevTools）+ A 40%（閉域SIのあるある） |
| utm_campaign | `article_19_test_data_closed` |
| 字数 | 2,200〜2,800 |
| CTA | `https://sugudasu.com/test-data` · `https://sugudasu.com/statements` |
| 公開タイミング案 | **#6 公開後** · **Zenn 10月中旬**（提督カレンダー 2026-07-03） |

---

## 記事の核心（エンジニア視点）

**「閉域だからExcel手打ち」だけが正解ではない。** エンジニアは **Faker / 自前SQL / Python** で作れる。止まるのは能力ではなく **稟議 · 労務列整合 · シード再現 · 説明資料**。

| | Mockaroo等 SaaS | 自前スクリプト | SUGUDASU test-data |
|---|-----------------|----------------|---------------------|
| データの行き先 | **クラウドへ送信** | 社内配布が必要 | **端末内生成**（POSTなし） |
| 稟議 | SaaS禁止でOUT | 「誰がメンテする？」 | **説明ページ付き静的ツール** |
| 労務整合 | 汎用 · 列は自分で | 毎プロジェクトで書く | **社員↔給与 · 住所整合プリセット** |
| 再現性 | アカウント依存 | スクリプト版管理 | **シード固定** |
| 25万件 | API課金 · 送信 | 書ける | チャンク結合DL |

### 記事に入れる一文（コピペ可）

> テストデータはクラウドが1件ずつ返すのではなく、**初回に落ちたプログラムと辞書を、ブラウザが使って架空行を組み立てる**。生成ボタン以降に氏名・給与を当社サーバーへ送る API は呼ばない — これが「非送信」と Mockaroo の違いです。

---

## H2 案

1. 閉域SIで止まるポイント — 本番コピー禁止 · SaaS禁止 · **自作はできるが通らない**
2. 手段の比較 — Excel / Mockaroo / Faker / 静的ツール
3. **「通信なしでできる」の正体** — 辞書 + クライアントRNG + Blob DL（#6 の実例）
4. なぜ Faker で足りないことがある — 稟議 · 労務プリセット · シード · 今日すぐ
5. DevTools で確認 — 生成時 POST なし · 初回GETは別レイヤ
6. 残る壁（短く）— ホワイトリスト · 広告は生成に不要 · 社内ミラー
7. やらないこと — TDM · 本番マスキング · 100%オフライン断定
8. CTA → `/test-data` · 姉妹 `#6` · note（稟議・事務向け）は別

---

## Zenn / note 分割（提督 2026-07-03）

| 軸 | **Zenn #19** | **note（将来）** |
|----|--------------|------------------|
| 読者 | 受託SI · QA · 情シス兼務エンジニア | 社労士事務所 · マニュアル · 稟議を書く非エンジニア |
| 尖り | Fakerとの住み分け · メカニズム · DevTools | ホワイトリスト申請 · 広告 · Excel手打ち卒業 |
| ペルソナ | **Excel絵は入口の共感** — エンジニアに正直に書く | Excel手打ちを主役にしてよい |

---

## 書かないこと

- 「完全オフライン」「通信ゼロ」
- エンタープライズ TDM / 本番マスキングの代替
- 競合 SaaS の名指し誹謗
- 「エンジニアはExcelで困っている」単一ペルソナ

---

## 内部リンク

- Zenn **#6** [`ZENN_ARTICLE_06_DRAFT.md`](ZENN_ARTICLE_06_DRAFT.md)
- Zenn **#12** normalize（500行 · 別ペルソナ）· [`TEST_DATA_TOOL_SPEC.md`](TEST_DATA_TOOL_SPEC.md) §6.6 切り分け
- [`statements.html`](../../tools/statements.html) · [`TEST_DATA_CLOSED_ENV_RESEARCH.md`](TEST_DATA_CLOSED_ENV_RESEARCH.md)

---

## 次アクション

- [x] 初稿 [`ZENN_ARTICLE_19_DRAFT.md`](ZENN_ARTICLE_19_DRAFT.md)
- [x] `ZENN_EDITORIAL_PLAN.md` §2 に #19 行追加
- [ ] test-data FAQ §6.8 本番反映（提督判断で保留中）
- [ ] スクショ: DevTools POSTなし · 件数セグメント · CSV DL
- [x] Zenn 下書き保存（10月中旬 · 5,233字）
- [ ] `X_POST_ZENN19_LAUNCH.md`（公開時）
