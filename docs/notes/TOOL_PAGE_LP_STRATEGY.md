# ツールページ内 LP 戦略 — SSOT（2026-07-01）

**方針:** 別URLの LP は作らない。**`/{tool}` 同一URL** に Pain · 3ステップ · 信頼 · FAQ を載せる。hub は **発見専用**。

**関連:** `docs/BACKLOG.md` §14-9 · `data/lp-marketing-matrix.json` · `docs/prompts/kanji-san-lp-patterns-gemini.md`

---

## IA（MECE）

| 入口 | 役割 | SEO / Ads |
|------|------|-----------|
| `/` hub | ブランド · 回遊 · 全ツール目次 | ポータル語（弱い） |
| `/{tool}` | **LP + 本体** | **1 Pain = 1 URL** |
| `/guides/{slug}` | 長文判断材料 → ツール CTA | ロングテール |

---

## Tier（LP 厚み）

| Tier | 要件（N9） | ツール例 |
|------|------------|----------|
| **S** | 型A FV · 3ステップ · 信頼3点 · FAQ型D · 完了導線 | warikan · group-split · **normalize**（2026-07-01）· timeline · fair-draw（未） |
| **A** | FV Pain · 3ステップ · 非送信 · FAQ | invoice · mask（予定） |
| **B** | 短 FV + FAQ のみ | sns · reverse · font-converter |
| **C** | クラスタ内相互リンクが LP 代わり | invoice · stamp · receipt |

---

## `tools/{id}.html` 必須ブロック（Tier S/A）

1. **バッジ** — 非送信 / ペルソナ（1行）
2. **FV（型A）** — `sg-tool-lead` · △相当の Pain → 解消を1段落
3. **本体 UI**
4. **3ステップ** — warikan 同型 `ol` 3列
5. **信頼行** — 非送信 · 保存なし · 行数チェック等
6. **FAQ** — 型D + 使い方 · JSON-LD 同期
7. **完了導線（型C）** — 関連ツール1リンク（本文内で可）

---

## 新規ツール DoD

registry 登録と **同 PR / 同デプロイ** で N9 まで。hub カードだけ先行は **禁止**（検索流入が hub に落ちるため）。

---

## ロールアウト順（2026-07-01 FIX）

1. ✅ **normalize** — 事務OL · 非送信（Tier S）
2. **timeline** · **fair-draw** — 幹事束 Tier S 残
3. **invoice** — Tier A
4. hub リード短縮（発見専用化）
