# Code診断ラクダ 評価メモ（2026-07-17）

**対象 URL:** https://code-rakuda.com/cases/yJFNmPNgFSSVFd7qOCLy（ログイン前提 · 公開監査証明ではない）  
**対象サイト:** `https://sugudasu.com/`（core）  
**目的:** 同種の自動診断を再実施したときに、同じ「要確認」を重大インシデント扱いしないための判定ログ  
**読者:** 提督 · Agent

---

## 0. サービス自体の位置づけ

| 項目 | 判定 |
|------|------|
| 運営 | 株式会社Arstruct（[arstruct.co.jp](https://arstruct.co.jp/) · 実在のIT会社） |
| 性質 | AIで作ったWeb向けの **チェックリスト／リスク診断＋改善商材**（無料 → 有料レポート → 改善支援） |
| 権威 | Semgrep / Sonar / 侵入テスト級の第三者認証監査 **ではない** |
| 使い方 | 指摘の種火にはなる。**ランク（例: C）や合格率を正本にしない** |

---

## 1. 判定した指摘（core）

| 指摘 | 判定 | 対応 |
|------|------|------|
| axe-core color-contrast / h1 / region | a11y負債（セキュリティではない） | 別バックログ可 · 本メモでは未着手 |
| `Server: cloudflare` | 虚偽陽性に近い | **対応不要** |
| DMARC なし | 事実（メールなりすまし対策） | Web脆弱性ではない · 送信運用が出たら別途 |
| `Access-Control-Allow-Origin: *` | 静的公開の事実 · 認証APIではない | **低優先 · 現状維持可** |
| Permissions-Policy / X-Frame-Options / CSP / HSTS なし | 事実 · `_headers` に未設定 | 任意改善候補（下記） · **必須対応ではない** |
| AIクローラ拒否（GPTBot 等） | **Cloudflare Managed** が挿入 · リポジトリの `robots.txt` は `Allow: /` + `Disallow: /data/` のみ | **意図と合致 · 対応不要**（2026-07-17 決定） |

### AIクローラ（再確認用）

本番 `robots.txt` は CF Managed ブロックのあと、SUGUDASU 本体が続く二段構成。  
検索ボットと学習ボットは別。SEO主戦場を壊す設定ではない。AI学習への積極露出を求めない限り変更しない。

---

## 2. 任意の改善候補（やるなら別タスク）

優先度の目安のみ。本診断を理由に緊急対応はしない。

1. HSTS · `frame-ancestors` / `X-Frame-Options`（`_headers`）
2. CSP は AdSense · 外部スクリプトと衝突しやすい → Report-Only から
3. DMARC はメール送信ドメイン運用とセット
4. axe の色コントラスト · hub の `h1`

---

## 3. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-16〜17 | 診断結果をレビュー · AIクローラ拒否は対応不要と決定 · 本メモ作成 |
