# COPYPASTE — VC デューデリ価値メーター · セカンドオピニオン

**用途:** 他 AI（Gemini / Claude / GPT / Grok 等）に、SUGUDASU の「投資家向けサイト価値メーター」の **妥当性・ヌケモレ** を監査させる。  
**正本（レビュー対象）:** [`../notes/VC_DUE_DILIGENCE_METRICS.md`](../notes/VC_DUE_DILIGENCE_METRICS.md)  
**関連:** [`../notes/PRODUCT_USAGE_ANALYTICS.md`](../notes/PRODUCT_USAGE_ANALYTICS.md) · [`../notes/DATA_PRIVACY_CLAIM_POLICY.md`](../notes/DATA_PRIVACY_CLAIM_POLICY.md) · Backlog §8-13-1  
**更新:** 2026-08-10

---

## 使い方

1. 下の「コピペ用」ブロックを外部 AI に貼る  
2. 可能なら `VC_DUE_DILIGENCE_METRICS.md` 全文と `PRODUCT_USAGE_ANALYTICS.md` §0–2 · §9 要約を添付  
3. 返ってきた **Adopt / Reject / Gap** だけを提督が正本へ最小差分で反映（制度増設禁止）

---

## コピペ用

````text
# ROLE

あなたはシード〜シリーズAを見る VC のプリンシパル兼プロダクト監査役です。
対象は日本の B2B/業務向け無料ブラウザツール集「SUGUDASU」（sugudasu.com）。
将来レーンにアカウント+クラウド同期「Sync」があるが、コアはログイン不要・入力データをサーバーに送らない。

あなたの仕事は「デューデリで欲しいサイトデータの MECE」と「GA4で測る範囲」の妥当性・ヌケモレ監査です。
新しいブランド憲法や計測イベントを量産しないでください。既存の6軸とイベント契約を批判的にレビューし、最小の修正提案に閉じてください。

# PRODUCT CONSTRAINTS（破ってはならない）

- 入力テキスト・名簿・金額・ファイル名・検索クエリ本文・PII は GA4 に送らない
- コアの無料利用メーターと Sync 課金メーターは別物
- キーストローク連打・DnD毎イベントは禁止（input_kind はページあたり kind 最大1回）
- 主張してよいのは「閲覧・操作の統計のみ」

# CURRENT FRAMEWORK（レビュー対象）

## VC 6軸（MECE 主張）

A Acquisition — 流入・発見
B Activation — 開封→着手→完了（価値体験）
C Retention — 再訪・リピート
D Monetization — Sync/課金（コアGA4外が主）
E Unit/Scale — 成長・ツール集中度・新ツール寄与
F Trust/Risk — プライバシー整合・失敗・計測カバレッジ

## GA4 コアファネル（実装契約）

product_opened (tool_id)
→ tool_job_started (tool_id, input_kind)
→ tool_job_done (tool_id, outcome)
(± tool_job_failed)

outcome ∈ {copy, pdf, download, print}
input_kind ∈ {file_drop, file_pick, paste, clipboard_image, type, camera, load_session, generate}

カスタムディメンション登録済: Tool ID, Job outcome, Input kind

## 意図的に空いているもの

- GSC（SEO）は後段
- Sync 課金は別レーン
- NPS・インタビューは定性別
- 入力内容・品質スコアは憲法上しない

# QUESTIONS（すべてに答えよ）

1. **MECE 妥当性:** 上記 A–F はシード期の業務SaaS/ツール集デューデリとして相互排他・全体網羅か？ 過剰な軸・不足な軸は？
2. **ヌケモレ:** VCが必ず聞くがこの枠に入っていない指標を列挙し、A–Fのどこに入れるか／別枠にするかを示せ。
3. **GA4境界:** 「測れるものはMECEに測る」方針は正しいか？ コアGA4に足すべきイベント/ディメンションがあれば、憲法制約下で最大3つまで。
4. **ストーリー:** 投資家スライド1枚用に、このメーターで言えること／言えないことを各3点。
5. **優先順位:** 次の90日で埋めるべきギャップを優先度順に最大5つ（本番デプロイ・Exploration・ADC・GSC・Sync等を含む）。

# OUTPUT FORMAT（厳守）

## Verdict
- Overall: Strong / Adequate / Weak
- MECE: Pass / Pass-with-gaps / Fail
- 一文総評

## Gap table
| ID | 抜け・問題 | 深刻度(H/M/L) | 提案（Adopt/Reject/Defer） | 入れ先の軸 |

## Max-3 GA4 additions（憲法適合のみ）
| 追加案 | 理由 | 送ってはいけないもの |

## 90-day priority
1. …
2. …

## Do NOT
- 入力本文を送れ、という提案
- Sync課金をコアGA4に混ぜろ、という提案
- 新しい憲法・義解文書の新設

日本語で簡潔に。
````

---

## 反映ルール（提督）

| 外部AIの提案 | 扱い |
|--------------|------|
| A–F の統合・改名 | 妥当なら `VC_DUE_DILIGENCE_METRICS.md` §1 を1行修正 |
| GA4イベント追加 | 憲法チェック後のみ `PRODUCT_USAGE_ANALYTICS.md` へ |
| Sync計測の詳細 | Sync SSOT へ · 本ドキュメントはリンクのみ |
| 制度・新文書の提案 | Reject |

### 反映済（2026-08-10 セカンドオピニオン）

- Adopt: 転換率明示 · Cコホート/New-Returning · E内部2層 · Dに広告構造 · failed必須 · カバレッジ · Pareto/新ツール純増分析 · CACはAの効率（別データ）
- Defer: 完了時間バケット · 性能ログ · NPS · GSC分析（蓄積は先行可）
- Reject: サイト指標としてのTAM · イベント増殖 · 入力本文
- Backlog: `P2-VC-REVIEW` 完了 · `P0-USAGE-DEPLOY` 等を追加
