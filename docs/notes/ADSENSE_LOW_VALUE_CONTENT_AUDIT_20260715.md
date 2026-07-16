# AdSense「有用性の低いコンテンツ」監査 — 2026-07-15

**ステータス:** AdSense サイト `sugudasu.com` = **要確認** / 詳細 **有用性の低いコンテンツ**  
**ads.txt:** 承認済み（変更不要）  
**黄色アラート:** お支払い情報・サイトリンク — **提督操作**（コード外）  
**Gemini プロンプト:** [`docs/prompts/adsense-low-value-content-gemini-prompt.md`](../prompts/adsense-low-value-content-gemini-prompt.md)  
**戦略正本:** [`GUIDES_CONTENT_STRATEGY.md`](GUIDES_CONTENT_STRATEGY.md)

---

## 1. Gemini 一般論の読み替え（Cursor 判定）

| Gemini（一般ブログ） | SUGUDASUでの扱い | 判定 |
|---------------------|------------------|------|
| 記事15本 · 1本1500字 | `/guides` を深さ優先で増やす（日記量産は禁止） | **改変して採用** |
| 独自の体験談 | 現場手順・失敗分岐・チェックリスト（匿名で可） | **採用** |
| 固定: プライバシー | `/privacy` あり | **済** |
| 固定: 利用規約 | `/terms` · `/disclaimer` あり | **済** |
| 固定: 問い合わせ | `/updates` にフォームあり → **`/contact` を独立させフッター明示** | **今回実装** |
| 運営者プロフィール実名 | 方針で非公開。`/statements` の運営節で代替 | **実名公開しない** |
| 空カテゴリ整理 | WP範疇。guides は柱(event/docs/…)で足りる | **触らない** |
| ads.txt | 承認済み | **触らない** |

---

## 2. 現状アセット（チェック結果）

| 項目 | 状態 |
|------|------|
| ガイド本数 | **8**（索引 `/guides`） |
| ガイド本文ボリューム | 概ね実用長。construction / web-production は厚い。event 系は追記余地 |
| ツール本数 | 30超（ハブ）— 「サイトがスカスカ」ではないが、**テキスト密度はガイド不足**が審査官視点の弱点 |
| ポリシー | privacy / terms / disclaimer / statements |
| 問い合わせ | updates 内フォーム → **contact ページ新設** |
| 内部リンク | footer に guides · updates · statements · privacy |
| ads.txt · 自動広告タグ | 仕込み済み（別ログ） |

---

## 3. 優先バックログ（再申請まで）

| 優先 | 作業 | 担当 |
|------|------|------|
| P0 | `/contact` 新設 + footer「問い合わせ」 | Cursor（本セッション） |
| P0 | お支払い情報（AdSense） | **提督** |
| P1 | Gemini で新規ガイド 3〜5 本（planning-poker / mask / 非送信実務 等） | Gemini → Cursor 実装 · プロンプト: [`adsense-guides-batch-p1-gemini-prompt.md`](../prompts/adsense-guides-batch-p1-gemini-prompt.md) |
| P1 | 既存 event 系ガイドの加筆（失敗談・チェックリスト） | Gemini → Cursor |
| P2 | 主要ツール導入文・FAQ→guides 導線の増強 | Cursor |
| P3 | GSC インデックス（別件）· www→apex 301 | 提督 + 別スレ |

**再申請は** ガイド追加＋問い合わせ明示が本番反映された **数日後**（サイト削除・再登録はしない）。

---

## 4. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-07-15 | 不合格（有用性）初回監査 · Gemini一般論の読み替え · contact 実装方針 |
| 2026-07-15 | Gemini パックレビュー（誤ID・PDF墨消し過大主張を是正）· 新規ガイド5本 + ツール導線実装。正本: [`ADSENSE_GEMINI_PACK_REVIEW_20260715.md`](ADSENSE_GEMINI_PACK_REVIEW_20260715.md) |
