# Gemini 協業ガイド — 聞き方・API 展開（SUGUDASU / 個人開発）

**更新:** 2026-06-18  
**正本プロンプト例:** `docs/prompts/zenn-editorial-gemini.md`  
**API 技術:** Colab / `GOOGLE_API_KEY` · 無料枠内（ASL §79 / sugudasu 方針）

---

## 1. 基本方針（Cursor との役割分担）

| 層 | Gemini | Cursor / Claude |
|----|--------|-----------------|
| 企画表・スケジュール | ◎ | △（突合のみ） |
| 記事・コード本文 | ✕ 禁止 | ◎ |
| changelog 事実チェック | △（添付必須） | ◎ |
| PR・法務の短文化 | ○（批判的リライト） | ○（SSOT 照合） |

**鉄則:** 1 セッション = 1 役割。企画と実装を混ぜない。

---

## 2. 聞き方のコツ（チャット UI）

### 2.1 依頼文の型（5ブロック）

```text
① 役割（1行）— 「編集プランナー」「監査のみ」など
② 禁止（箇条書き）— 本文執筆 · 礼賛 · 未実装 · 社名推測
③ コンテキスト（添付）— changelog 5件 · operator-profile · 既存方針
④ タスク（動詞1つ）— 「表を出せ」「§2のみ更新せよ」
⑤ 出力フォーマット — 見出し名・列名を固定（コピペ検証しやすい）
```

### 2.2 効くフレーズ

| 言い方 | 効果 |
|--------|------|
| 「**本文は書くな**」 | 長文ハルシネーション抑制 |
| 「**§N のみ**出力せよ」 | 余計な礼賛段落を削る |
| 「**捏造禁止。不明は『要確認』**」 | 数字・機能の盛り防止 |
| 「**比較表のみ**」 | Gemini の得意領域に寄せる |
| 「**礼賛・前置き不要**」 | 冒頭の無駄を減らす |

### 2.3 効きにくい / 避ける

| 言い方 | 理由 |
|--------|------|
| 「最高のプロンプトで覚醒させて」 | 抽象的 · 長文ルールのコピペを誘発 |
| 「全部任せた」 | 企画と実装の混線 |
| チャット履歴だけ渡す | 陳腐化 · `GEMINI_SESSION_SNAPSHOT.md` を添付 |
| 同じ質問を何度も | レート・クォータ消費 |

### 2.4 添付の順序

1. **依頼文**（`zenn-editorial-gemini.md` のブロック）
2. **添付ブロック**（固定コンテキスト）
3. **差分だけ**（changelog 直近5件 · 今回の論点1行）
4. （ASL のみ）`docs/GEMINI_INFORMATION_SOURCES.md` 索引

---

## 3. ユースケース別プロンプト入口

| 用途 | ファイル |
|------|----------|
| **チャネル ROLE 索引（入口）** | `docs/prompts/editorial-roles-gemini.md` |
| Zenn 編集カレンダー | `docs/prompts/zenn-editorial-gemini.md` |
| Zenn 記事アウトライン拡張 | `docs/prompts/zenn-article-draft-gemini.md` |
| WebP→JPG/PNG リサーチ | `docs/prompts/webp-to-jpg-gemini-research.md` |
| PNG/JPEG→WebP 逆方向リサーチ | `docs/prompts/png-to-webp-gemini-research.md` |
| **note「引き算の記録」原稿** | `docs/prompts/note-editorial-gemini.md`（第1パス） |
| **note AI 味除去（Grok）** | `docs/prompts/note-deai-grok.md`（第2パス） |
| **X 文案生成・監査** | `docs/prompts/x-editorial-gemini.md` |
| **Qiita 短記事構成** | `docs/prompts/qiita-editorial-gemini.md` |
| **スマホキラープロダクト・ブレスト** | `docs/prompts/mobile-killer-product-gemini.md` + `docs/GEMINI_SESSION_SNAPSHOT.md` |
| X 文案のトーンチェック | 依頼文 + `docs/x_guideline.md` 抜粋 |
| PR TIMES メタ（表のみ） | `docs/PR_TIMES_LAUNCH_2026.md` §6 手順 |
| 記事ドラフト監査 | 下記「監査用ミニプロンプト」 |

### 監査用ミニプロンプト（コピペ）

```text
あなたは編集者です。礼賛禁止。事実追加禁止。
添付ドラフトについて、次のみ出力:
§1 誇大表現（行番号付き最大5件）
§2 実装未確認の主張（changelog と不一致）
§3 削れる冗長段落（見出し名のみ）
本文のリライトはしない。
```

---

## 4. Gemini API への展開

チャット UI と **同じ役割分担** を API でも再現する。本文生成 API は使わない。

### 4.1 API が向くタスク

| タスク | 理由 |
|--------|------|
| 編集カレンダー表の再生成 | `response_schema` で列固定 |
| changelog 差分の要約（5行） | 入力 JSON を毎回同じ形で |
| X 投稿 140字チェック | 出力 max token 制限 |
| 複数案の採点表 | temperature 低め |

### 4.2 API でやらない

- 記事全文・HTML 量産
- 本番サイトからの直叩き（ユーザー向け）
- リークした system prompt の再注入

### 4.3 最小構成（Node / 無料枠想定）

**環境:** `GOOGLE_API_KEY`（`.env.local` · Git 禁止）

**スクリプト雛形:** `scripts/gemini/editorial-plan.mjs`（下記）

```javascript
// 雛形 — 実行前に npm install @google/genai
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const systemInstruction = `編集プランナー。礼賛禁止。記事本文禁止。指定フォーマットの表のみ。`;

const userPrompt = fs.readFileSync('docs/prompts/zenn-editorial-gemini.md', 'utf8')
  .split('## Gemini への依頼文')[1]
  .slice(0, 4000); // 依頼文+添付のみ

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: userPrompt,
  config: {
    systemInstruction,
    temperature: 0.3,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              axis: { type: 'string' },
              tool: { type: 'string' },
              priority: { type: 'string' },
            },
            required: ['title', 'axis', 'tool', 'priority'],
          },
        },
      },
      required: ['themes'],
    },
  },
});

console.log(response.text);
```

**運用:** 出力は必ず **Claude/Cursor で突合** → `ZENN_EDITORIAL_PLAN.md` に反映。API は下書き生成器ではなく **表のたたき台**。

### 4.4 Colab との使い分け

| 場所 | 用途 | 自動トリガー |
|------|------|--------------|
| **Colab** | 叙述生成（ASL 作品ナラティブ）· バッチ | 既存 GHA パイプライン |
| **sugudasu `scripts/gemini/`** | マーケ企画表 · X 字数監査 | **なし（手動）** — 四半期 or 新マイルストーン時のみ |
| **Gemini チャット** | 対話的な §7 確認質問 · 表の手直し | **なし** |

**自動化しない理由:** 企画表は採否が人間判断。API を cron すると Token 消費とハルシネーション表のゴミが溜まるだけ。Programming で足りるのは **公開予定日のカレンダー** と **changelog ファイル監視**（既にビルド側）。

---

## 5. クォータ・安全

- **1日の API 呼び出し**は企画再生成 1〜2 回まで（無料枠防衛）
- 添付に **秘密・Form の private URL・API キー** を入れない
- 出力をそのまま公開しない — 必ず人間 or Cursor が 1 パス

---

## 6. 関連ファイル

| ファイル | 内容 |
|----------|------|
| `docs/GEMINI_SESSION_SNAPSHOT.md` | チャット開始用スナップショット（陳腐化防止） |
| `docs/prompts/mobile-killer-product-gemini.md` | スマホキラー企画ブレスト |
| `docs/prompts/editorial-roles-gemini.md` | **チャネル ROLE 索引**（note / Zenn / X / Qiita） |
| `docs/prompts/zenn-editorial-gemini.md` | Zenn 企画（チャット正本） |
| `docs/prompts/zenn-article-draft-gemini.md` | Zenn 記事アウトライン拡張 |
| `docs/prompts/note-editorial-gemini.md` | note 下書き |
| `docs/prompts/x-editorial-gemini.md` | X 文案 |
| `docs/prompts/qiita-editorial-gemini.md` | Qiita 構成 |
| `docs/notes/ZENN_EDITORIAL_PLAN.md` | 採用済み企画 SSOT |
| `docs/operator-profile.md` | 公開境界 |
| `docs/x_guideline.md` | X トーン |
| `scripts/gemini/editorial-plan.mjs` | API 雛形（任意実行） |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-18 | 初版（聞き方 + API 展開） |
