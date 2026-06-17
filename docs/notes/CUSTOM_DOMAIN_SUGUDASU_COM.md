# カスタムドメイン `sugudasu.com` 設定

更新: 2026-06-17  
**取得:** お名前.com  
**本番ホスト:** Cloudflare Pages（現状 `sugudasu.pages.dev`）  
**正本 URL（目標）:** `https://sugudasu.com/`

---

## 方針（推奨）

**DNS を Cloudflare に寄せる**（お名前のネームサーバーを Cloudflare 指定に変更）。

| 方式 | メリット | デメリット |
|------|----------|------------|
| **A. CF ネームサーバー（推奨）** | Pages カスタムドメインが自動 · SSL 自動 · apex + www 簡単 | お名前の DNS 画面は使わなくなる |
| B. お名前 DNS のまま | レジストラを変えない | apex（`@`）の向け先が面倒 · 証明書・検証が遅れがち |

以下は **方式 A** の手順。

---

## 1. Cloudflare にサイトを追加

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **ウェブサイトを追加**
2. `sugudasu.com` を入力 → **Free** プラン
3. 表示される **ネームサーバー 2 つ**をメモ（例: `xxx.ns.cloudflare.com`）

---

## 2. お名前.com でネームサーバー変更

1. [お名前.com Navi](https://www.onamae.com/) → **ドメイン設定** → **DNS関連機能の設定**
2. 対象: `sugudasu.com`
3. **DNSサーバー設定** → **その他のサービスのDNSを利用**
4. Cloudflare のネームサーバー 2 つを入力 → 設定

反映まで **数時間〜最大 48h**（多くは数時間以内）。

Cloudflare 側が **Active** になれば OK。

---

## 3. Cloudflare Pages にカスタムドメイン

1. **Workers & Pages** → プロジェクト `sugudasu`（または該当名）
2. **カスタムドメイン** → **ドメインを設定**
3. 追加:
   - `sugudasu.com`（apex）
   - `www.sugudasu.com`
4. DNS は Cloudflare 管理下なら **自動レコード** が付く
5. **SSL/TLS** → 暗号化モード **フル** または **フル（厳密）**（Pages 既定で可）
6. **リダイレクト:** 正規は `https://sugudasu.com` に統一（`www` → apex へ 301 推奨）

Pages ダッシュボードの「カスタムドメイン」で www → apex リダイレクトを有効にする。

---

## 4. 公開確認チェックリスト

| # | URL | 期待 |
|---|-----|------|
| 1 | `https://sugudasu.com/` | ポータル（hub） |
| 2 | `https://sugudasu.com/invoice.html` | 請求書 |
| 3 | `https://sugudasu.com/updates.html` | 更新履歴 |
| 4 | `https://sugudasu.com/ads.txt` | AdSense 行がそのまま表示 |
| 5 | `https://www.sugudasu.com/` | apex へリダイレクト |
| 6 | `https://sugudasu.pages.dev/` | 残しても可（任意で apex へリダイレクト） |

---

## 5. 連携サービス（ドメイン切替後）

| サービス | 作業 |
|----------|------|
| **Google AdSense** | サイト一覧に `sugudasu.com` を追加 · `ads.txt` は既に `dist/` にコピー済み |
| **Google Form** | 変更不要（スプシ・GAS は独立） |
| **Search Console** | プロパティ `https://sugudasu.com` を追加 · sitemap は将来 |

`pages.dev` はしばらく併存可。AdSense 審査は **正規ドメイン確定後** に申請するのが無難。

---

## 6. リポジトリ側（任意・後追い）

- README / 法務ページの表記を `sugudasu.com` に統一
- `docs/DESIGN_GUIDELINE.md` の `sugudasu.online` 表記はレガシー（一括置換は別タスク）
- `_redirects` は CF ダッシュボードで足りるなら不要

---

## トラブル

| 症状 | 対処 |
|------|------|
| SSL 保留中 | DNS Active 待ち · 24h 以内に再確認 |
| apex だけ開けない | Pages に `sugudasu.com` が追加されているか · CF DNS に CNAME/flatten があるか |
| お名前で NS 変更できない | 取得直後はロック · Navi の「ドメインロック」解除 |
| 旧 URL ブックマーク | `pages.dev` は CF で apex リダイレクト設定可 |

---

## 参照

- [Cloudflare Pages · Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- デプロイ一般: `docs/WORKFLOW.md` §3 · `README.md`
