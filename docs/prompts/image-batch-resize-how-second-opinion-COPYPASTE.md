# COPYPASTE — 画像一括リサイズ / 提出容量 HOW · セカンドオピニオン

**用途:** 他 AI（Claude / GPT / Grok / Gemini 別スレ等）に、SUGUDASU の **提出直前画像 HOW** の採用／非採用判定を批判的に再評価させる。  
**正本（レビュー対象）:** [`../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md)  
**関連議論:** [`../legal/logs/2026-08-15_image_compress_submit_pain.md`](../legal/logs/2026-08-15_image_compress_submit_pain.md) · CASE-2026-009 / 011  
**一次意見:** HOW §8（Imgix）· §9（枚数・命名）· §9.4（Gemini カタログ）— **盲信禁止**  
**更新:** 2026-08-15

---

## 使い方

1. 下の「コピペ用」を外部 AI に貼る  
2. 可能なら HOW 全文（少なくとも §1–2 · §4 · §9 · §9.4）を添付  
3. 返ってきた **Adopt / Reject / Gap / Rename** だけを提督が HOW へ最小差分で反映（新憲法・新規HTMLの量産禁止）

---

## コピペ用

````text
# ROLE

あなたは B2C/B2B 業務ツールのプロダクト監査役です。次の6視点をすべて使い、互いに矛盾する点も明示してください。

1. CTO（技術負債 · ブラウザ制約 · 既存コードとの整合）
2. CPO（JTBD · カタログ境界 · 既存ツールとの重複）
3. CMO（訴求 · SEO土俵 · 競合ポジション）
4. HCI（認知負荷 · ヒックの法則 · 既定動作の可視化）
5. 認知科学（ファイル名の再認 · スキーマ · 完了感の嘘）
6. シニアUI/UX（画面分割 · 既存 image-trim との視覚的区別）

対象は日本の無料ブラウザツール集「SUGUDASU」（sugudasu.com）。
コアは登録不要・入力データをサーバーに送らない・静的配信。
礼賛禁止。「よくあるから採用」は禁止。競合が既に満たす憲法適合を差別化と呼ぶな。

# HARD CONSTRAINTS（破ってはならない）

- CASE-2026-009: Hub「あるかも」期待で新規ツール GO にしない
- CASE-2026-011: PowerToys一式移植しない。仮置きにリサイズ/圧縮を入れない。新規「画像圧縮」HTMLは今作らない
- この HOW の JTBD は「提出・添付・フォームの容量または長辺条件に画像を載せる」一件だけ
- SNS固定枠・余白パディングで枠に揃える仕事は既存 `image-trim` の領域
- 形式変換（WebP→JPEG等）の主座は既存 `webp-to-jpg`
- 複数枚上限の既定案は既存どおり MAX_FILES=20 · 1ファイル25MB
- 出力は元を上書きしない。コーデック名（MozJPEG等）をUI/ファイル名に出さない
- 設定ダイアログ・命名テンプレのユーザー編集 UI を増やさない
- 新しいブランド憲法や判例を勝手に作るな。ギャップは HOW 修正提案に閉じる

# CURRENT DECISIONS（一次意見・批判対象）

## プリセット（最大3）

- mail_attach（メールに付けやすく）
- form_2mb（フォームの2MB以内）
- web_long_edge（Web用長辺1200）
- 縦横比維持・拡大防止は既定（トグルに出さない）
- 短辺指定・余白パディング・SNSサイズ表・一括形式変換は「このHOW」では非採用
- PPT 16:9 は PARK（観測。今期3枠を増やさない）

## 出力ファイル名テンプレ

{sanitize(元stem)}_{presetTag}[_{W}x{H}][_{nn}].jpg

- presetTag ∈ {mail, 2mb, w1200}
- _{W}x{H} は辺を落としたとき、または web_long_edge では常時
- 衝突時のみ _02 ゼロ埋め
- Reject: 元名を捨てた連番のみ（image_001）、_resized / _small / _compressed、instagram 等の媒体名（trim側）

## Geminiが挙げた「よくある」カタログ（再判定せよ）

仕様: 縦横比維持 / 長辺・短辺 / 拡大防止 / 余白（白黒） / 一括形式変換 / SNS・PPT推奨サイズ表
命名: (1)サイズ接尾 (2)用途・メディア名 (3)連番で元名破棄 (4)ステータス語（_resized等）

# QUESTIONS（すべてに答えよ）

1. **JTBD境界:** 提出容量 HOW と image-trim（SNS/枠）と webp-to-jpg（形式）の三分割は妥当か？ 統合または第4ツールが必要なら、憲法制約下で最小案を1つだけ。
2. **仕様Adopt/Reject:** Geminiの仕様リストを1行ずつ Adopt / Reject / Park / Belong-elsewhere で判定し、理由を1文。一次意見と違う行だけ太く論じよ。
3. **命名Adopt/Reject:** 命名4型を同様に判定。一次テンプレの弱点（可読性・Windows禁則文字・日本語・バッチ衝突・メール添付後の可読性）を最大3つ。
4. **プリセット:** mail / 2mb / w1200 の3つはMECEか？ 足すなら最大1つ、削るならどれか。PPT 16:9 を今足すべきか。
5. **ヌケモレ:** 「よくあるが一覧に無いが実務で致命」な仕様を最大5つ。それぞれ Adopt せず観測だけにするか、HOWに1行足すかを示せ。
6. **実装順序:** 11/15レビューまでに文書だけで固めること / プロトタイプが要ること / 製品コード禁止のままを、各3点以内。

# OUTPUT FORMAT（厳守）

## Verdict
- Overall: Strong / Adequate / Weak
- 一次意見との一致: High / Medium / Low
- 一文総評（日本語）

## By Role（各5行以内）
### CTO
### CPO
### CMO
### HCI
### 認知科学
### シニアUIUX

## Spec Table
| 項目 | Adopt/Reject/Park/Elsewhere | 一次と違う? | 一文 |

## Naming Table
| 型 | Adopt/Reject/Park | 一次と違う? | 一文 |

## Gaps（最大5）
- ...

## Minimal HOW edits（最大7箇条・箇条書き）
実装コードや新HTML id を提案するな。文書修正だけ。

## Do Not Do（再確認）
憲法・仮置き・Hub Value・アップロード型・コーデックUI について、やってはいけないことを5つ。
````

---

## 回収後

- Adopt/Reject の差分だけ HOW §9.4 / §4 に追記  
- 新判例が必要なら `docs/legal/logs/` に候補（憲法本文は改正しない）  
- 製品コードは **① 2026-11-15 HOW レビュー → ② その後 Hub/GSC** まで書かない（Hub/GSC 単独で 11/15 前に解禁しない）
