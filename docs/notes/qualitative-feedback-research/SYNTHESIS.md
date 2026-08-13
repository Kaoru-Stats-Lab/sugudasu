# 定性フィードバック受け皿 — SYNTHESIS（役員会用）

**更新:** 2026-08-13  
**生ログ:** [`raw-deep-research-20260813.md`](raw-deep-research-20260813.md)  
**既存受け皿:** [`../../FEEDBACK_TRIAGE.md`](../../FEEDBACK_TRIAGE.md)（Google Form · updates 経由 · スプシ Inbox）

---

## 0. 一文総意

**催促ゼロの常設受け皿（フッタ）＋ 失敗時インライン**を Adopt。Inbox は **GitHub Issues**（Cursor / `gh` 可読）。Form はレガシー。コピー成功直後の割り込み・公開★は Reject。

**正本:** [`../QUALITATIVE_FEEDBACK_INTAKE.md`](../QUALITATIVE_FEEDBACK_INTAKE.md)

---

## 1. 既存との関係（重要）

すでに **Form 受け皿はある**（`FEEDBACK_TRIAGE` · updates）。今回の論点は「受け皿ゼロ」ではなく、

- **遷移なし・文脈内**で送りやすくするか
- Identity 無しのまま **定性の質**を上げるか
- 低トラフィックでも **発見可能だが催促しない**か

Form を捨てる話ではない。主経路をインページ化し、Form は補助／長文用に残すのが自然。

---

## 2. リサーチ結論（圧縮）

| 設置点 | 推奨 |
|--------|------|
| 失敗・空出力インライン | **高**（定性の質が最大） |
| ツールフッタ常設「フィードバック」 | **高**（催促ゼロの核 · CyberChef/Regex101型） |
| Hub 再訪時 1行 | **中〜条件付き**（閉じる＋再表示抑制必須 · localStorage 方針要憲法確認） |
| コピー成功トースト直下 | **中以下**（去る瞬間 · 邪魔になりやすい） |
| ショートカット隠し導線 | **中**（パワーユーザー向け後段） |

**案の合成（総意）:** 案1（サイレント・レシーバー）を基盤 ＋ エラー時だけ案2のインライン。案3（コピー後スナック残留）は保留〜弱推奨。

**少数意見:** 低トラフィックだとゼロ件続きで検証不能 → Hub に期間限定の目立つ意見箱実験も検討、という慎重な積極案。

---

## 3. 成功事例で移植しやすい型

| 事例 | 学べること |
|------|------------|
| CyberChef | フッタ常設 · バージョンメタ自動付与 · 遷移なし |
| Regex101 | 入力本文を送らせない · ツール識別子＋不具合のみ |
| Convertio | Down 時だけ理由タグ（成功時はほぼ黙る） |
| Excalidraw | 作業面の外に Feedback を隠す |
| MDN / Vercel Docs | ページ内 2択→短文（ドキュメント向け · ツール完了ジョブとは距離あり） |

---

## 4. 採否（2026-08-13 確定）

| ID | 提案 | 判定 |
|----|------|------|
| QF-1 | シェルフッタに静かな「フィードバック」→ インページ短文＋分類 | **Adopt** |
| QF-2 | 失敗・空出力付近に「不具合を報告」 | **Adopt** |
| QF-3 | 送信先 = **GitHub Issues**（Cursor / `gh` が直接読める） | **Adopt** |
| QF-4 | コピー成功直後の催促 / 残留アイコン | **Reject** |
| QF-5 | Hub 上部バナー | **Defer** |
| QF-6 | 公開★ · NPS常設 · 報酬 | **Reject** |
| QF-7 | 成功定義 = 月数件でも受け皿 OK | **Adopt** |

**取込仕様正本:** [`../QUALITATIVE_FEEDBACK_INTAKE.md`](../QUALITATIVE_FEEDBACK_INTAKE.md)  
**Form:** 主経路から外す（Cursor 不可読 · 遷移摩擦）。レガシー着信のみ `FEEDBACK_TRIAGE`。

---

## 5. 役員会の未解決（F節より）

1. コメント欄への誤ペースト機密 → 注意書き1行で足りるか / サーバ側フィルタ要否  
2. Core「静的」主張と任意送信通信の開示レベル  
3. Hub再訪用に `last_tool_id` を localStorage してよいか  
4. 匿名スパム → Captcha無しでレート制限のみでよいか  
5. 「返信しません」告知で期待値を切れるか  
6. GA4 イベントと FB ログの突合はポリシー内か  
7. **既存 Form 運用との一本化**（二重受け皿にしない）

---

## 6. 生ログの注意（ファクトチェック）

Deep Research 生文に次の揺れあり。実装時は正本を優先すること。

- ドメイン表記 `sugudasu.jp` → 正は **sugudasu.com**  
- 例示 slug `excel-column-convert` → registry に無い架空例  
- 「localStorage すらクリーン」は過度（fav/recent・bookmark dismiss 等で既に使用）  
- 一部出典が通知許可・PWA記事など論点がずれる行あり（効果数値は「未確認」扱いを維持）

---

## 7. 次アクション

1. ~~役員会で QF-1+QF-2 と QF-3~~ → **確定**（Issues）  
2. 実装: CF `POST /api/feedback` · `sg-feedback.js` · shell フッタ · failure フック（`QUALITATIVE_FEEDBACK_INTAKE` §7）  
3. label `feedback-inbox` 作成 · `GITHUB_FEEDBACK_TOKEN`  
4. privacy に任意送信レーンを1行  
5. Hub 目立つ意見箱（少数意見）は Backlog に置かない限り触らない  
