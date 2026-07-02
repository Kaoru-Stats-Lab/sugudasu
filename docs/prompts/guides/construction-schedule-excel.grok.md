# Grok依頼: construction-schedule-excel — 口語トーン 第2パス

**slug:** `construction-schedule-excel`  
**URL:** `https://sugudasu.com/guides/construction-schedule-excel`  
**入力:** 現行 `tools/guides/construction-schedule-excel.html` の `<article>` 内テキスト  
**参考（任意）:** `docs/notes/schedule-construction-seo-gemini-RESULT.md` · `schedule-construction-seo-gemini-RESULT-SUPPLEMENT.md` · `SYNC_SCHEDULE_SEO_KEYWORDS.md` §1-2b  
**出力先:** `docs/notes/guides-brushup/construction-schedule-excel-grok-RESULT.md`

**パイプライン位置:** Gemini SEO 深掘り（依頼1–6）+ 補完（印刷・週間）統合済み HTML → **Grok 第2パス** → Cursor statements 突合 → HTML 反映

---

## Grok への依頼文（コピペ用）

```text
あなたは小規模内装・リフォーム現場を回してきた「現場監督兼事務」寄りの日本語編集者です。
表・FAQ・「この記事でわかること」・見出しの順序は**そのまま維持**し、散文（p タグ部分）だけ人間味を上げてください。

【記事の前提】
- 読者: 内装・リフォームの現場監督 / 小規模工務店（ITリテラシー低〜中 · Excel・紙・LINE 慣習）
- 主題: 工事工程表を Excel で回すときの提出用/現場用の二重管理 · 週間配布 · 印刷（A3/A4/掲示）
- 建設現場では工程表の**印刷が MUST**。URL 共有は併用で、紙を置き換える話ではない
- 本記事はイベント当日の分単位進行表ではない（末尾の timeline 言及は維持）
- ANDPAD 代替の乗り換え煽りではない。Excel を捨てる話ではない

【やること】
1. リード（sg-info-page__lead 相当）を punchy に
   - 冒頭は「工程表は Excel で十分では？」系の問いへの返答でもよい
   - 核心ペイン: 提出用と週間が別ファイル · 掲示の紙と Excel がズレる · 雨天で手ずらし
2. 各 H2 直下の導入 p（1〜3段落）を口語リズムで短く
3. 失敗5パターン + 印刷3パターン（H3）各セクション:
   - 冒頭に監督現場の一言を1文（例: 「掲示板、昨日のままだと思ってた」）
   - 症状→原因の流れは維持。2段落構成は崩さない
4. 表A / 表B / 運用パターン表 / 典型列表の**直前**に導入1文ずつ（表の中身は触らない）
5. FAQ の**回答文（p のみ）**を口語化。質問文（H3）は**一字一句変えない**（SEO・構造化データ用 · 8問すべて）
6. 「本記事では〜」「〜することが重要です」「劇的に」などのAI定型句を削る
7. 次の語を散文に**自然に**1回ずつ程度は残してよい（無理な詰め込み禁止）:
   工事工程表 · 内装工事 工程表 · 週間工程 · 住宅リフォーム スケジュール表 · 工事 進行表 作成 · 現場監督

【やらないこと】
- title / meta description の変更案を出さない
- H1 / H2 / H3 の追加・削除・順序変更・文言変更（FAQ質問の H3 含む）
- 表の行・列・セル内容・◎○△×の変更
- 「この記事でわかること」ul の項目変更
- ANDPAD を主語にした比較煽り（既存の「代替ではない」文脈内のみ可）
- 除外KWを主語にしない: 次世代 · 劇的 · 5選 · 施工管理アプリ 乗り換え
- Sync / SUGUDASU の礼賛追加。「準備中」「一般論」「実装予定」は既存の誠実線を維持
- 未実装機能の断定（自動連動が今すぐ使える、等）
- 数値・調査結果の捏造
- WBS · カンバン · WEB制作の語彙

【トーン】
- 現場の監督。威張らないが、愚痴ではなく実務メモ。
- Excel を悪者にしない。「提出用と週間の1本を分ける」「紙と URL を併用」が現実解。
- 締めの「ぜひお試しください」系は禁止

【出力フォーマット】
### リード（改訂版 · 1段落 · strong タグ位置は維持可）
### H2「なぜ〜」— 改訂段落（p のみ · 3段落まで）
### H2「現場工程でよくある失敗」— 各H3名 → 改訂2段落（冒頭一言含む）
### H2「印刷・週間配布でよくある失敗」— 導入p + 各H3名 → 改訂2段落
### H2「表A」— 表直前導入1文
### H2「表B」— 表直前導入1文
### H2「おすすめの運用パターン」— 表直前導入1文 + 表後の締めp改訂
### H2「工程表の典型列」— 表直前導入1文 + 表後p改訂
### H2「向いていないケース」— ul 各 li の文言は維持 · 必要なら直前に1文
### H2「よくある質問」— 各FAQ: 質問文はそのまま列挙 → 回答pのみ改訂（8問）
### 変更メモ（bullet 5つ以内 · トーン判断の理由）
```

---

## Cursor 突合チェック（Grok 返答後）

| 項目 | 確認 |
|------|------|
| FAQ 質問文 | HTML の H3 と完全一致（8問） |
| Sync CTA | 「準備中」「実装予定」維持 · `/timeline` 混同なし |
| 表 | tbody 変更なし |
| 印刷 MUST | 紙を URL で置き換えるトーンになっていないか |
| 誠実線 | 図面・日報はスコープ外のまま |
| ANDPAD | 正面比較・代替煽りなし |

---

## 関連

- 親 Gemini: `docs/prompts/schedule-construction-seo-gemini-prompt.md` · 補完 `schedule-construction-seo-gemini-SUPPLEMENT-prompt.md`
- 型本: `web-production-schedule-excel.grok.md`
- SEO SSOT: `docs/notes/SYNC_SCHEDULE_SEO_KEYWORDS.md` §1-2b · §11-5
