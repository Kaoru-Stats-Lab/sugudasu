# Chrome Web Store 提出文面 — Mention by SUGUDASU

**更新:** 2026-07-28
**根拠:** ADR-0004 · ADR-0007 · ADR-0008 · PR#2/#3実装内容
**提出スコープ:** Google Maps / GBP のみ（web / X adapterは次回申請）

---

## 1. ストア説明文（Single Purpose）

### 短文（検索結果・一覧用途）

```
Mention by SUGUDASU — 今見ているGoogleマップの口コミページを、その場で完了させるアクションツール。
```

### 詳細説明（Storeの説明欄）

```
Mention by SUGUDASU は、今開いているGoogleマップ／Googleビジネスプロフィールの
口コミページに対して、定型アクション（返信・社内共有・完了記録）をその場で
提示する拡張機能です。

- 監視・分析・ダッシュボードではありません。過去ページの巡回や収集は行いません。
- ユーザーが開いたページの内容だけを読み取り、返信の定型文を展開します。
- 送信は、ユーザーが設定したWebhook URLへの明示操作による送信のみです。
- 完了した対応の記録（Done）は端末内にのみ保存されます。
```

**禁止語（使わない）:** 監視 / 分析 / 収集 / アラート / レポート / 自動生成 / AIが

---

## 2. optional_host_permissions 申請文（Justification）

Store提出フォームの「Permission justification」欄に使う文面。

```
This extension requests access only to Google Maps and Google Business
Profile pages (maps.google.com, business.google.com and their .co.jp
equivalents). Access is granted at runtime only when the user explicitly
enables it via a button in the extension's side panel — it is not
requested automatically on install.

The extension reads the currently open review page to detect its
structure (star rating, reply status) and offer relevant reply/share
templates. It does not access any other site, does not run in the
background, and does not crawl or monitor pages the user has not
opened.
```

対象ドメイン(実装と一致していることを確認済み):
`https://www.google.com/maps/*` · `https://maps.google.com/*` ·
`https://www.google.co.jp/maps/*` · `https://maps.google.co.jp/*` ·
`https://business.google.com/*`

---

## 3. Privacy Policy 必須文

```
Mention by SUGUDASU does not collect, store, or transmit page content or
user data to SUGUDASU's servers. All data related to completed actions
(Done records) and user-edited templates is stored locally on the user's
device using the browser's IndexedDB, and is never uploaded.

The extension performs an external network request only when the user
explicitly clicks "Send" to deliver a message to a webhook URL that the
user has configured themselves. That request contains only the text the
user reviewed on screen, an internal action identifier, the source page
URL, and a timestamp — no raw page content, browsing history, or personal
data beyond what is visibly part of the reply is included.

Locally stored Done records are capped at 200 entries; the oldest entries
are automatically removed once this limit is exceeded. There is no
search or analytics interface over this local history.
```

---

## 4. remote code / minification / obfuscation / eval への回答

Store提出フォームの該当質問への回答方針。

```
- Remote code: No. All JavaScript is bundled within the extension package.
  No code is fetched or evaluated from external URLs.
- eval() / new Function(): Not used anywhere in the codebase.
- Minification: Code may be minified for size, but is not obfuscated.
  Variable and function names remain meaningful.
```

---

## 5. スクリーンショット方針

**撮ってよいもの:**
- Side Panelを開いた状態で、Google Mapsの口コミページと並んで
  Action Cards（返信・共有・完了ボタン）が表示されている画面
- テンプレート編集画面（Template タブ）
- 完了記録一覧（Done タブ）— **一覧のみ。グラフ・集計・検索バーは映さない**
- 権限許可を求めるボタンとダイアログ

**撮ってはいけないもの:**
- 複数ページ分のデータをまとめた画面（ダッシュボードに見える）
- 数値集計・グラフ・時系列表示
- 検索・フィルタUI

---

## 6. 審査前セルフチェック（実装との突合）

- [x] `host_permissions` が空、`optional_host_permissions`のみ（PR#2で対応済み）
- [x] content_scripts.matchesがoptional_host_permissionsと一致（5ドメイン一致確認済み）
- [x] Core（lib/）に`platform ===`分岐が残っていない（PR#2でgrep確認済み）
- [x] Webhookペイロードが最小メタのみ（PR#3対応: text/actionId/sourceUrl/sentAt）
- [x] Done件数上限200（PR#3対応済み）
- [ ] eval / remote code なし（Store提出直前に再grep推奨）
- [x] ストア説明文に禁止語（監視/分析/収集等）が含まれていない

---

## 未確定・要判断

1. **アイコン・スクリーンショットの実素材** — グループA(baseline)にicons/が含まれているが、
   Store掲載用の高解像度素材・スクリーンショット撮影はこれから
2. **サポートURL・開発者連絡先** — Store提出フォームの必須項目、まだ決めていない
3. **カテゴリ選択** — Chrome Web Storeの「Productivity」等、どのカテゴリで申請するか

---

## 関連ドキュメント

- 思想正本: [`philosophy.md`](./philosophy.md)
- 仕様正本: [`specification.md`](./specification.md)
- 競合・White Space: [`competition.md`](./competition.md)
- GTM: [`gtm.md`](./gtm.md)
- 実装: [`../../../extensions/mention/README.md`](../../../extensions/mention/README.md)
- 診断ログ: [`diagnostics/2026-07-28_constitution-gap.md`](./diagnostics/2026-07-28_constitution-gap.md)
