# AdSense 再不合格ログ — 2026-08-13（有用性の低いコンテンツ · 第2回）

**記録日時:** 2026-08-13  
**対象:** `sugudasu.com`  
**画面:** AdSense「サイト」→ サイトは広告を表示できない状態 · 所有権確認済  
**詳細ラベル:** **ポリシー違反が見つかりました → 有用性の低いコンテンツ**  
**ads.txt / 所有権:** 確認済（緑チェック）· 変更不要想定  
**再審査 UI:** 「問題を修正しました」チェック → 「審査をリクエスト」（**いまは押さない** · 本ログのゲート後）

**公式参照（審査理由に紐づく）**

| # | 文書 | URL |
|---|------|-----|
| 1 | Publisher Policies（最小コンテンツ要件を含む） | https://support.google.com/adsense/answer/10502938 |
| 2 | AdSense content and user experience | https://support.google.com/adsense/answer/10015918 |
| 3 | ウェブマスター品質（thin content） | https://support.google.com/webmasters/answer/9044175 |
| 4 | Spam policies for Google web search（広告面でも準拠） | https://support.google.com/publisherpolicies/answer/11035931 |

**前回（第1回）**

| 日付 | 内容 | 正本 |
|------|------|------|
| 2026-07-09 | 承認待ちログ | [`ADSENSE_APPROVAL_WAIT_LOG_20260709.md`](ADSENSE_APPROVAL_WAIT_LOG_20260709.md) |
| 2026-07-15 | 初回「有用性」· 監査 · contact · ガイド強化方針 | [`ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md`](ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md) |
| 2026-07-15 | Gemini パック実装レビュー | [`ADSENSE_GEMINI_PACK_REVIEW_20260715.md`](ADSENSE_GEMINI_PACK_REVIEW_20260715.md) |
| 以降 | `/guides` 拡充 · ガイド戦略 | [`GUIDES_CONTENT_STRATEGY.md`](GUIDES_CONTENT_STRATEGY.md) |

---

## 0. 前回以降にやったこと（事実）

| 施策 | 状態（2026-08-13） | 備考 |
|------|-------------------|------|
| `/contact` 独立 + フッタ | 済 | 第1回 P0 |
| 運営メール公開（privacy 等） | 済 · **AdSense通過後に削除予定** | 審査対策 |
| `/guides` 拡充 | **8本 → 14本**（`tools/guides/*.html`） | 第1回「記事増やせ」への応答 |
| 2026-07-15 新規ガイド群 | privacy / planning-poker / mask / event-day / dispute 等 | Gemini→Cursor |
| `document-change-review` | 2026-08-09 公開 | docs 柱 |
| ads.txt · 自動広告タグ | 仕込み済 | 所有権は通っている |
| お支払い情報 | **要提督確認**（第1回から黄色アラート指摘あり） | コード外 |
| ツール Reject（label/report/reverse） | 2026-08-13 | 提供終了ページ化 · **薄いURL残留リスク**を本ログで再評価 |
| 定性FB（Issues） | 同日デプロイ | 審査理由とは別レーン |

**結論（短い）:** 「ガイドを増やした」だけでは **同じラベルで再不合格**。量不足単体ではなく、**サイト全体の“薄いページ比率・独自価値の見え方・審査官が辿る入口”** が残っている可能性が高い。

---

## 1. MECE — 「何が NG か」チェック（仮説ランク付き）

判定凡例: **H** = 再不合格の主因候補 · **M** = 寄与しうる · **L** = 今回のラベルとは距離 · **OK** = 既に十分 / 触らない

### A. コンテンツ量・深さ（Minimum content / enough unique content）

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| A1 | ドメイン内に十分な独自テキストがあるか | guides 14本あり。だが **ツールURLが圧倒的多数**で、クロール観点の「平均ページの文章量」はツール殻が支配しうる | **H** |
| A2 | 1 URL あたりの実質本文 | ガイドは実用長。ツールは UI+短いリード+FAQ で **thin に見えやすい** | **H** |
| A3 | 定期更新の痕跡 | `/updates` · changelog あり | **M**（あるが審査官が入口で見ない） |
| A4 | 「記事15本」機械達成 | ブログ型指標。SUGUDASU では **非目標**（戦略どおり） | **OK（捨てる）** |

参照: [AdSense content and UX](https://support.google.com/adsense/answer/10015918) · [Publisher Policies](https://support.google.com/adsense/answer/10502938)

### B. 独自性・重複（duplicate / scraped / cookie-cutter）

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| B1 | 他サイトからの転載・薄いリライト | 自前手順中心。過大主張は第1回で是正済 | **L〜M** |
| B2 | サイト内の長文コピペ（同文の量産） | event 系・Excel落とし穴系が **同型テンプレ**に見えうる | **M** |
| B3 | ツール同士の説明が似すぎ | リード文・FAQ の型が揃いすぎるとドアウェイ臭 | **M** |
| B4 | 提供終了ツールURL | label/report/reverse — **薄い終了ページがインデックスに残ると thin 加算** | **H** |

参照: [thin content / quality](https://support.google.com/webmasters/answer/9044175) · [Spam policies](https://support.google.com/publisherpolicies/answer/11035931)

### C. サイト全体の価値認識（「ツール置き場」 vs 「役立つサイト」）

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| C1 | トップがカタログのみで記事ハブに見えない | Hub はカード一覧。**初見で「中身のあるサイト」と読まれない**リスク | **H** |
| C2 | `/guides` への露出不足 | フッタ・一部FAQ。**主CTAがツール起動** | **H** |
| C3 | ガイド索引の厚み | `/guides` はあるが、トップからの物語が弱い | **M** |
| C4 | E-E-A-T（運営実名なし） | statements で代替方針。第1回で実名公開しない決定 | **M**（変えすぎない） |

### D. UX・ナビ・信頼ページ

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| D1 | privacy / terms / contact | あり · メール残置 | **OK** |
| D2 | 壊れたリンク・虚偽のダウンロード約束 | 意図的なものなし。要スポット監査 | **L** |
| D3 | ナビの分かりやすさ | ツール多 · カテゴリあり。記事導線は弱い | **M** |

参照: [content and UX](https://support.google.com/adsense/answer/10015918)

### E. スパム・ドアウェイ・キーワード寄せ

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| E1 | 検索エンジン向けだけの薄いページ | ガイドは実務意図。Reject 終了ページは要注意 | **M〜H** |
| E2 | 過度なキーワード反復 | 監査継続 | **L** |
| E3 | アフィリエイト薄い寄せ集め | 主は自作ツール。アフィは補助 | **L** |

参照: [Spam policies](https://support.google.com/publisherpolicies/answer/11035931)

### F. 審査プロセス・運用（コンテンツ以外）

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| F1 | 改善反映後のクロール待ち不足 | 第1回チェックリストは「最低7日」— **守ったかは要確認** | **M** |
| F2 | お支払い情報未完了 | 第1回黄色アラート。**有用性ラベルとは別だが並行必須** | **M** |
| F3 | サイト削除・再登録連打 | しない方針 | **OK** |
| F4 | GSC インデックス（guides 新URL） | 一部未インデックスのまま再申請だと効果薄 | **H** |

### G. 広告面との齟齬

| ID | チェック項目 | 現状メモ | 判定 |
|----|--------------|----------|------|
| G1 | 薄いツールURLにも自動広告コード | 審査官がツールを開くと **広告枠＋薄い本文** | **H** |
| G2 | ads.txt 不一致 | 所有権OK | **OK** |

---

## 2. MECE 合成 — 「NG の本命」仮説（優先順）

1. **H · ツール殻の thin 比率**（A1/A2/G1）— ガイドを増やしても、サイトの大半の URL は短いツールページのまま。  
2. **H · 入口（Hub）がカタログ**（C1/C2）— 審査官が記事価値に到達しにくい。  
3. **H · 新ガイドのインデックス未成熟 / 再申請タイミング**（F4/F1）。  
4. **H · 提供終了・薄い固定ページの残留**（B4）。  
5. **M · 同型ガイド・同型ツール説明**（B2/B3）。  
6. **M · お支払い等アカウント側**（F2）— 別アラートだが並行。

**やっても効きにくい（捨てる）:** 日記ブログ15本量産 · 運営実名強制 · ads.txt いじり · サイト削除再登録。

---

## 3. 対応方針（このログ時点 · 未決は Gemini / 役員会）

| レーン | 方向 | 即決可否 |
|--------|------|----------|
| **コンテンツ** | ガイド「本数」より **Hub〜guides の回遊 · 主要ツールの本文密度 · 終了URLの扱い** | 方針は本ログ · 詳細は Gemini |
| **技術/SEO** | GSC で `/guides/*` カバレッジ確認 · 必要なら URL 検査 | 提督 + Agent |
| **収益コード** | 自動広告は **guides/hub/updates/statements/roadmap のみ**（ツール殻から除外） | **実装済** |
| **再申請** | 改善デプロイ + インデックス確認後 · **最低10〜14日待ち** · チェックしてからリクエスト | **今は押さない** |

**実装済（DEPLOY-20260813-005）:** 広告 allowlist · Reject sitemap除外 + `_headers` noindex · Hub 価値モジュール。詳細は SYNTHESIS §0。

---

## 4. Gemini

第2回診断・打ち手優先度用プロンプト:  
[`../prompts/adsense-low-value-r2-gemini-COPYPASTE.md`](../prompts/adsense-low-value-r2-gemini-COPYPASTE.md)

**Gemini 結果（生）:** [`adsense-r2-gemini-RESULT.md`](adsense-r2-gemini-RESULT.md)  
**役員会読み替え・採否:** [`ADSENSE_R2_BOARD_SYNTHESIS.md`](ADSENSE_R2_BOARD_SYNTHESIS.md)

---

## 6. GSC 追記（2026-08-13）

提督スクショより: 登録 57 / 未登録 63 · 「クロール済み - 未登録」20 · sitemap 検出 72。  
詳細と是正実装は [`ADSENSE_R2_BOARD_SYNTHESIS.md`](ADSENSE_R2_BOARD_SYNTHESIS.md)。

**提督TODO:** Reject URL（`/label` `/report` `/reverse` `/present`）の URL検査 · 必要ならインデックス削除。リダイレクト15件は clean URL の正常 301 が多い想定（無理にゼロ化しない · SEO_GSC SSOT）。

---

## 5. 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-08-13 | 第2回不合格（有用性）記録 · MECE チェック · Gemini R2 プロンプトへリンク |
| 2026-08-13 | Gemini R2 結果保管 · BOARD_SYNTHESIS（主因Adopt · Astro/過大表現はReject） |
| 2026-08-13 | GSC スクショ反映 · 広告allowlist/Reject除外の実装へ |
| 2026-08-13 | AD-R2-1/2/4 実装 · DEPLOY-20260813-005 · 再申請は10〜14日待ち |
