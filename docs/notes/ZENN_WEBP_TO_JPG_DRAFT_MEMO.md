# Zenn 向け webp-to-jpg 記事ネタ — 備忘録

**更新:** 2026-06-19  
**製品:** T09 · URL `/webp-to-jpg` · `tools/webp-to-jpg.html` · `assets/webp-to-jpg.js`  
**製品境界:** 入力 **WebP のみ** · 出力 **JPG/PNG** · 最大20枚 · ZIP/PDF/逆変換は対象外  
**Gemini 正本:** [`webp-to-jpg-gemini-research-RESULT.md`](webp-to-jpg-gemini-research-RESULT.md)

---

## 推奨タイトル

**WebPをJPGに変換するとき — iLoveIMGに載せない選択肢（DevToolsで確認できる非送信）**

| 項目 | 内容 |
|------|------|
| 軸 | A 50%（あるある）+ B 50%（**アップロード型との差** · DevTools 検証） |
| utm_campaign | `article_13_webp_to_jpg` |
| 字数 | 1,800〜2,200 |
| CTA | `https://sugudasu.com/webp-to-jpg` |

---

## 記事の核心（ユーザーに伝える差）

**「ブラウザで動く」だけでは差がつかない。** 競合も UI はブラウザ。差は **画像が運営サーバーを経由するか**。

| | アップロード型 | SUGUDASU webp-to-jpg |
|---|----------------|----------------------|
| 代表 | [iLoveIMG](https://www.iloveimg.com/ja/convert-to-jpg/webp-to-jpg) · [Convertio](https://convertio.co/ja/webp-jpg/) · [PDF24](https://tools.pdf24.org/ja/webp-to-jpg) | このツール |
| 画像の行き先 | 運営サーバーへ POST（SSL 後も一時保存） | **端末のブラウザ内メモリのみ** |
| 確認方法 | DevTools → 変換時に **multipart / upload** | DevTools → **画像 POST なし** |
| 向く用途 | 数百枚一括 · ZIP · URL 取込（サーバー経由） | 社外秘スクショ · 顧客素材 · 今日数枚 |
| 変換の向き | WebP→JPG 等 | WebP→JPG/PNG のみ |

**逆方向（PNG→WebP）** は [サルワカWebツール](https://saruwakakun.com/tools/png-jpeg-to-webp/) 等。混同しない。

### 記事に入れる一文（コピペ可）

> Convertio や PDF24 は「ブラウザで使える」と書いていても、**画像ファイルはクラウドにアップロード**されます。社内スクショや未公開素材を載せたくないときは、F12 のネットワークタブで **画像 POST が出ない** SUGUDASU の方が筋が通ります。

### DevTools デモ手順（スクショ用）

1. F12 → ネットワーク · 「Fetch/XHR」または「すべて」
2. iLoveIMG 等で WebP を1枚変換 → **upload / multipart** が出る
3. SUGUDASU `/webp-to-jpg` で同じファイル → **画像 POST なし**（HTML/JS/CSS のみ）

---

## H2 案

1. WebP 困りごと3選（Excel · 経費 · 社内Wiki）— Gemini §1
2. **「ブラウザで動く」の罠** — 上記比較表 · 競合 URL 3つ
3. **DevTools で見分ける** — 手順 · スクショ1枚
4. webp-to-jpg の設計（非送信 · URL/貼り付け · 20枚 cap · 透過→JPEGは白）
5. **やらないこと** — 数百枚 ZIP · PNG→WebP · PDF — §3
6. CTA → `/webp-to-jpg`

---

## 書かないこと

- 競合批判・「100%安全」・一括 ZIP（未実装）· 右クリック保存の代替（別問題）
- 「唯一の非送信ツール」（サルワカ等もブラウザ内と謳う — **向きと POST の有無**で差を書く）

---

## SEO キーワード

`webp jpg 変換` · `webp png 変換` · `webp excel 貼り付け` · `webp 変換 安全` · `webp 変換 アップロード しない`

---

## 実装ファイル（リネーム済 · 混乱防止）

| 種別 | パス |
|------|------|
| ページ | `tools/webp-to-jpg.html` |
| ロジック | `assets/webp-to-jpg.js` |
| テスト | `scripts/webp-to-jpg.test.mjs` · `npm run test:webp-to-jpg` |
| 旧 URL | `/imgconv` → `/webp-to-jpg` 301 |

---

## 旧メモ

`ZENN_IMGCONV_DRAFT_MEMO.md` は本ファイルに統合。内部コード名 `imgconv` / `image-convert` は廃止。
