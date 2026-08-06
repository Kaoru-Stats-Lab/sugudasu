# Cursor Task: ADR-010 Renderer Architecture CREATE TASK

**用途:** Cursor 投入用 COPYPASTE  
**成果物:**
- `docs/architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md`
- `docs/architecture/renderer/renderer-design.md`

**前提ゲート（閉じ済み）:** SLIR Accepted（009 Adopt）· Matcher/Delta Accepted · Parser/Normalizer Proposed  
**既存:** ADR-005 Renderer Pack は先行草案 → **ADR-010 を Renderer 正本候補**とし整合更新

**プロダクト転換点:** 「正しく比較できるか」→「人間が3分で確認できるか」

---

# 以下を Cursor に投入

```markdown
# Smart Diff ADR-010 Renderer Architecture CREATE TASK

## Role

UI / HCI Architecture。Delta Tree を人間確認可能な表示へ変換する Renderer Architecture v0.1 を Proposed ADR として定義する。
実装コード・React コンポーネント実装は禁止。Design Document のみ。

---

# 絶対条件（Architect 固定）

## 1. 入力は Delta Tree のみ

禁止:
- Renderer が SLIR を見る
- Parser Origin を差分判断に使う
- 独自 Diff / Score 再計算

採用:
Delta Tree → Renderer → View Model（Render Projection）→ UI

Renderer の仕事: 見せ方 · ナビゲーション · ハイライト · 同期 · 折りたたみ。
「何が変更か」の判断禁止（Delta の責務）。

Origin（page/bbox）は **Overlay 配置のみ**（ADR-001）。比較し直さない。

## 2. View Model 層を必須にする

禁止: Delta Tree → 直接 React Component（表示状態の混入）

必須:
Delta Tree → Render Projection Model → UI Component

Delta = 比較結果。View = expanded / selected / scroll / filter / density。別物。

## 3. Review View と Redline View を分離

### Review View（Phase1 優先）
目的: 何を確認すべきか分かる（旧/新の確認単位）

### Redline View（Phase1 必須でない）
目的: 文字レベル変更。Word Compare 完全再現ではない。

SUGUDASU 価値 = 確認時間短縮 → Phase1 は Review First。

---

# 参照

- Accepted ADR-004 Delta
- Accepted ADR-002 SLIR（Renderer は直接消費しない）
- ADR-001 Origin
- ADR-006 Export（印刷生成は Export · Renderer は表示）
- 既存 ADR-005 Pack（整合・重複整理）

---

# 必須決定

## Renderer 責務
Delta 入力 · View Projection · 表示状態管理 · Export 境界

## UI モデル
Delta → Render Model → Component

## Phase1 表示
対象: Added / Deleted / Modified / style_only / Candidate  
非対象: Move / Table Cell Diff / Auto Merge / Conflict UI

## PDF / DOCX 表示方針
原本ビュー · 差分ビュー · 座標 Map · BoundingBox 利用範囲（配置のみ）

## Accessibility
色だけ禁止 · ラベル/記号 · キーボード移動

## Layout（既存判断との整合）
2 ペイン Before|After + Change Navigator 推奨（Before/Diff/After 3 等分は不採用）
Difference First · Delta Anchor Sync · PC First

---

# 出力

1. docs/prompts/smart-diff-adr-010-renderer-architecture-CREATE-TASK.md
2. docs/architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md
3. docs/architecture/renderer/renderer-design.md
4. Manifest / ARCHITECTURE 入口更新（ADR-010 = Renderer 正本候補 · ADR-005 は先行草案と注記）

---

# 禁止

- SLIR 直接描画
- Diff 再計算
- View 状態を Delta に書き戻す
- Word クローン / Infinite Canvas / AI 要約 Diff
- Mobile 最適化を Phase1 必須にする

---

# 完了条件

1. Delta-only 入力が明記
2. Render Projection Model が定義されている
3. Review vs Redline 分離 · Phase1 Review 優先
4. Phase1 表示範囲が固定
5. PDF bbox は配置のみ
6. A11y 最低限
7. Export と責務分離
8. 「3分確認」HCI が原則として書かれている
```
