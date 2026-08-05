# Hub 検索語彙 — 新規ツール公開時（Agent SSOT）

**更新:** 2026-08-05  
**目的:** 新プロダクトを Hub に出すたびに検索語彙が増えることを **機械ゲートで強制**する。  
**背景:** S-SURFACE 決議「検索ファースト」。辞書が無いツールは探せない。

---

## 正本プロンプト（探索結果 · 2026-08-05 検証）

| 世代 | ファイル | 役割 |
|------|----------|------|
| 旧入口 | `docs/Gemimi辞書生成テンプレート.md` | → prompts へ移行済みの案内のみ |
| **v2 正本** | [`search-dictionary-prompt-v2.md`](search-dictionary-prompt-v2.md) | `data/search-dictionary/{id}.json` 新規 |
| Intent MECE | [`../research/search/Gemini-Intent-Dictionary-Prompt.md`](../research/search/Gemini-Intent-Dictionary-Prompt.md) | 4バケツ（JTBD / 対象 / ゆれ / 取り違え） |
| synonyms+intent 欠落埋め | [`hub-search-synonyms-intent-gap-gemini.md`](hub-search-synonyms-intent-gap-gemini.md) | Layer 補助の追記専用 |
| **ギャップ自動生成** | `npm run scaffold:hub-search-vocab -- --write-prompt` | 欠落 toolId 向け COPYPASTE を `docs/prompts/generated/` に出力 |

v1 は使わない。Intent を把握するときは **v2 + Intent MECE 4バケツ**（または scaffold 生成文）を使う。

---

## 新規ツール時の固定手順（MECE A15）

1. registry · hub-cards · HTML を置いたら、**同じ PR / 同じ公開ウェーブで**:
   - `data/search-dictionary/{id}.json`（v2）
   - `data/synonyms.json` に `{id}` を含むエントリ ≥1
   - `data/tool-intent-map.json` に `{id}` を含むエントリ ≥1（keyword 2+ 推奨）
2. `npm run build:hub-search`
3. `npm run validate:hub-ia`（**語彙カバレッジ含む · 欠落で fail**）
4. 欠落があるときだけ:
   ```bash
   npm run scaffold:hub-search-vocab -- --write-prompt
   ```
   生成プロンプトを Gemini に貼り、JSON をマージして再 validate

---

## 機械ゲート

| コマンド | 検査 |
|----------|------|
| `scripts/verify-hub-ia.mjs` | Hub カード全 id に dict · synonyms · intent が載っていること |
| `scripts/scaffold-hub-search-vocab.mjs --check` | 同上（単体） |
| `build:pages` / `validate:hub-ia` | 上記を通過しないと公開ビルド不可 |

---

## 禁止

- Hub カードだけ出して辞書なしで公開
- 「あとで語彙」を別 PR に先送り（ゲートが止める）
- Embedding / AI 検索への置換を語彙欠落の言い訳にする
