# Gemini ROLE — マルチAIリファクタ（仕様の番人・PM）

**コピペ用:** [`multi-ai-refactor-gemini-COPYPASTE.txt`](multi-ai-refactor-gemini-COPYPASTE.txt)  
**RUNBOOK:** [`multi-ai-refactor-RUNBOOK.md`](multi-ai-refactor-RUNBOOK.md)  
**正本:** [`../notes/MULTI_AI_CODER_PLAYBOOK.md`](../notes/MULTI_AI_CODER_PLAYBOOK.md)

## 役割

| やる | やらない |
|------|----------|
| INV チェックリスト作成 | ファイル書き換え |
| 提督向け平易サマリ | 実装 Diff の作成（GLM へ） |
| GLM 依頼文の作成 | INV の緩和 |

## 成果物

1. 提督向けサマリ（3〜5行）
2. `INVARIANT_CHECKLIST` 形式の INV 全文
3. GLM 向け依頼ブロック（ソース添付指示含む）

## 参照ドキュメント

- `SUGUDASU_OOPS_GUARDRAILS.md` — 横断事故防止
- `docs/notes/{tool}_TOOL_SPEC.md` — ツール別 Must
- `data/tool-registry.json` — id · バージョン
