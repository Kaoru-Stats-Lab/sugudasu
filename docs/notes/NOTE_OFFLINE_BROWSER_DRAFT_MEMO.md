# note 向け オフラインブラウザ地図 — 備忘録

**更新:** 2026-07-02  
**状態:** 初稿あり · [`NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md`](NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md)  
**元ネタ:** [`ZENN_OFFLINE_BROWSER_DRAFT_MEMO.md`](ZENN_OFFLINE_BROWSER_DRAFT_MEMO.md)（2026-07-02 起票）  
**狙い:** T-Rex Runner をオフラインの目印として認識している層でも読める、非送信判断の入門記事

---

## 仮タイトル（案）

1. **Wi-Fiを切れば安全？を卒業する — オフラインブラウザの正しい使い分け**（推奨）
2. T-Rexが出たらオフライン？ 画像とPDFを開くときに知っておきたいこと
3. 「ブラウザ内で処理」の意味を、非エンジニア向けに分解する

**尖り:** 事務・幹事・バックオフィス。ブラウザを「サイト閲覧アプリ」としか見ていない層。

---

## 骨子

### 1. 導入（共感）

- 「オフライン = 恐竜ゲーム」でも問題ない、から始める
- ブラウザが画像/PDFビューアーとして使われている現実を示す
- 既定アプリ設定で本人が気づかないケースに触れる

### 2. 3つのオフライン

1. ネット接続がない（飛行機モード）  
2. ローカルで処理できる（変換/黒塗り/印刷）  
3. サーバーへ送らない（非送信）

### 3. よくある誤解

- 「Wi-Fiを切れば安全」
- 「ブラウザで動く = 送信していない」
- 「オフラインで開ける = ずっと使える」

### 4. できること / できないこと

- できる: 表示・簡易編集・印刷・コピー
- できない: 初回取得、クラウド同期、外部API依存機能
- Sync は別ライン（コア非送信と混同しない）

### 5. 自分で確認する手順

- DevTools ネットワークで POST の有無を見る
- 何が送られたかの最低限チェック
- 会社説明用の一言テンプレ

### 6. SUGUDASU への当てはめ

- `normalize` / `webp-to-jpg` / `mask` はローカル処理中心
- `sync` は同期APIを使う別ライン
- `statements` への導線で誇張を避ける

---

## CTA（note 用）

- 約束（非送信）: `https://sugudasu.com/statements?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map`
- マスク: `https://sugudasu.com/mask?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map`
- WebP変換: `https://sugudasu.com/webp-to-jpg?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map`
- 全角半角整え: `https://sugudasu.com/normalize?utm_source=note&utm_medium=social&utm_campaign=note_offline_browser_map`

---

## 書かないこと

- 「完全オフライン」「100%安全」
- 競合名の誹謗
- Sync をコアと同じ非送信として説明すること

---

## 著者メモ

- [x] 初稿 [`NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md`](NOTE_ARTICLE_OFFLINE_BROWSER_DRAFT.md)
- [ ] 公開後に `ZENN_OFFLINE_BROWSER_DRAFT_MEMO.md` へ note URL を追記
- [ ] #6 / #17 末尾リンクを note URL に差し替え
