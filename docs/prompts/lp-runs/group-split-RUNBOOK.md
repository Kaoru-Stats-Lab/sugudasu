# group-split — LP型 実行順（1プロンプトずつ）

**全8ステップ:** Gemini 型A → Grok 型A → Gemini 型B → Grok 型B → Gemini 型C → Grok 型C → Gemini 型D → Grok 型D  
**結果保存:** `docs/notes/lp-runs/group-split-type{X}-{gemini|grok}-RESULT.md`

**事前:** `npm run generate:marketing-context`（`group-split.generated.md` 更新）

---

## ステップ1 / 8 — **Gemini** · 型A（痛み）

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeA-gemini-RESULT.md`

---

## ステップ2 / 8 — **Grok** · 型A

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeA-grok-RESULT.md`

---

## ステップ3 / 8 — **Gemini** · 型B（削減されるやり取り）

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeB-gemini-RESULT.md`

---

## ステップ4 / 8 — **Grok** · 型B

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeB-grok-RESULT.md`

---

## ステップ5 / 8 — **Gemini** · 型C（完了導線）

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeC-gemini-RESULT.md`

---

## ステップ6 / 8 — **Grok** · 型C

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeC-grok-RESULT.md`

---

## ステップ7 / 8 — **Gemini** · 型D（信頼・FAQ）

**状態:** ✅ 完了（2026-06-26）  
**保存先:** `docs/notes/lp-runs/group-split-typeD-gemini-RESULT.md`

---

## ステップ8 / 8 — **Grok** · 型D（最終）

**状態:** ✅ 完了（2026-06-26） · **HTML反映済**  
**保存先:** `docs/notes/lp-runs/group-split-typeD-grok-RESULT.md`

---

## RUNBOOK 完了後

1. `docs/notes/lp-runs/group-split-*-RESULT.md` 8本 — ✅ 保存済
2. 採用文案 — ✅ `tools/group-split.html`（FV · 3ステップ · 信頼バッジ · FAQ · JSON-LD）
3. `data/changelog.json` — 反映時に追記 · commit/push は提督判断
