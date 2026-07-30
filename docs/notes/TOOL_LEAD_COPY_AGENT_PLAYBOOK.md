# SUGUDASU ツールリード文（Agent 必読）

**更新:** 2026-07-30  
**状態:** 決議済み（提督委任）  
**実装契約:** `UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md` **§4.1**  
**分類 SSOT:** `data/tool-lead-profiles.json`  
**討議・決定票:** `UIUX_EXPERIENCE_LEAD_COPY_BOARD_DISCUSSION.md`  
**Hub カード文案は別レイヤ:** `TOOL_CARD_WRITING_GUIDELINE.md`（混同禁止）

> 新規ツール · 既存ツールの `sg-tool-lead` を触る Agent は、本ファイルを **着手前に読む**。  
> 文面の機械的同一化や、FAQ への丸投げで What を省略してはならない。

---

## 1. 役割（リード vs FAQ）

| | リード（`sg-tool-lead`） | FAQ |
|--|-------------------------|-----|
| ユーザー状態 | まだ使うか決めていない · スキャン | 迷っている · 該当項目を探す |
| 向き | Push（自己選別） | Pull（境界・誤解解消） |
| 必須 | **What**（何か・誰向け）1〜2文 | 疑問が実在するツールで厚く |
| 禁止 | **How（操作手順）** をリードに書く | リード What の完全代替 |

同じ事実の「要約」と「詳細」の二重化は可。長文のコピペ二重化は不可。断定度・語尾は揃える。

---

## 2. `lead_profile`（第一軸 = 複雑度）

| 値 | リード構成 |
|----|------------|
| `light` | What 1〜2文のみ。長い Why / How を置かない |
| `heavy` | What +（任意）シナリオ1句 +（任意）Boundary予防線1句（「〜の代替ではない」等） |

- **完了系統**（`completion_model`）は CTA 軸。リード型の主軸にしない。
- 分類は `data/tool-lead-profiles.json` を更新してから HTML を書く。
- トップ · statements · Hub は対象外（価値観 / 約束 / カード文案）。

---

## 3. マークアップ（固定）

```html
<header class="sg-tool-intro space-y-2 no-print">
  <div class="sg-tool-lead-deck">
    <p class="sg-tool-lead"><strong>…What…</strong> — …</p>
    <!-- heavy のみ任意: Boundary 1句 -->
  </div>
  <!-- 任意: 関連ツール導線 -->
  <p class="sg-tool-lead sg-tool-lead--meta">…</p>
</header>
```

- チャネル名付き**共有 CTA**は禁止（CASE-2026-007）。貼付先例は FAQ / disclosure。
- コピー成功文言は `コピーしました`（§3.8 / 実装契約 §4）。

---

## 4. Agent 手順（固定）

1. `data/tool-lead-profiles.json` に `lead_profile: light|heavy` を書く / 確認
2. 契約 §4.1 と本ファイルの表に照らして文案を確定（FAQ にだけ書いてリード省略は禁止）
3. `tools/{id}.html` の `sg-tool-lead` を更新
4. `UIUX_DECISION_BLOCK` に `lead_profile` を含める（新規・全面改修時）
5. 公開時は `TOOL_NAMING_AGENT_PLAYBOOK.md` **§1.5** も YES/NA

---

## 5. やってはいけないこと

- 全ツール同一テンプレ文面への一括置換（型の予測可能性 ≠ 文面同一性）
- light ツールへの長い競合比較・操作手順のリード載せ
- Hub blurb と tool lead を同じ文で兼用
- mask（リダイレクト）· present（終了告知）への無理なリード追加
- スグダス誤訪問注意の勝手な露出増（Defer · ブランド別議題）
