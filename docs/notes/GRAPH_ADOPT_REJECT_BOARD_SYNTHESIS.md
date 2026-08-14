# Graph 採用／非採用 — 役員会 SYNTHESIS（ChatGPT · Claude · Gemini DR）

**更新:** 2026-08-14（Gemini Deep Research 追記）  
**一次:** Cursor キャンバス `graph-adopt-reject-by-role` · 共通バケツ A–F  
**セカンド:** ChatGPT Pack A · Claude Pack A · **Gemini Deep Research**  
**プロンプト:** [`../prompts/graph-adopt-reject-roles-second-opinion-COPYPASTE.md`](../prompts/graph-adopt-reject-roles-second-opinion-COPYPASTE.md)  
**既存ゲート（崩さない）:** [`../graph/GRAPH_STATUS_GATE.md`](../graph/GRAPH_STATUS_GATE.md) · R2/R3 HOLD · 達成色 REJECT · Dual_Axis 非ゴール

**Pack A 対応:** A1=二重軸6パネル（自己NG）· A2=Waterfall · A3=Donut · A4=積上棒＋コールアウト

---

## 0. 一文総意

四者とも **共有軸・ゼロ基線・1図1主張・二重軸拒否・達成色拒否・DB/装飾図形拒否** で一致。  
ChatGPT が付けた定義が総意の芯になる。

> 次の価値はチャート種類の追加より **壊れない資料構造**。競争相手は Excel のグラフメニューではなく **貼付後の資料化15–30分**。

**唯一の大きな分岐は Waterfall「今すぐ実装するか」。**  
Claude + Gemini = Adopt今 · ChatGPT = Next（Narrative）· 既存 STATUS = R2 HOLD。  
役員会はゲートを破らず **「需要は確定 · 実装は Next（別ジャッジで解禁）」** とする。R1 品質と Grammar 文書化を本線に据える。

---

## 1. 四者比較（採否の芯）

| 論点 | Cursor | ChatGPT | Claude | Gemini DR | 役員会案 |
|------|--------|---------|--------|-----------|----------|
| Dual Axis | Reject | Reject | Reject | **Reject（強い）** | **Reject** |
| ゼロ基線・共有軸 | Adopt | Adopt+不変 | Adopt | **Adopt今（+10%余白）** | **Adopt今** |
| 達成色自動 | Reject | Reject | Reject | Reject | **Reject** |
| DB格子 / Pyramid / Funnel | Reject | Reject | Reject | Reject | **Reject** |
| R1 資料品質 | 点半径メモ | **P0本線** | 支持 | （種類より構造） | **Adopt今（本線）** |
| Waterfall | Next | **Next** | **Adopt今** | **Adopt今（P0）** | **Next（需要確定 · R2 HOLD維持）** |
| Donut/Pie | Hold | Hold | Hold（101%） | Hold（≤4・100%） | **Hold** |
| 増減符号色 ≠ 達成色 | — | 弱 | **分離** | 2値分離として採用 | **設計 Adopt · 実装は WF 時** |
| 直接ラベル | — | — | — | **末端/合計のみ · 引出線Hold** | **Adopt今（既定OFF維持可）** |
| SM（同尺2–3） | SMは単位違い用 | — | — | **Next（二重軸の逃げ道）** | **Next（既存SMと混同注意）** |
| Presentation Grammar | 暗黙 | **正本化** | テンプレ | Intent→イディオム | **Adopt今（文書）** |
| Pack B | — | — | T5/T4任意 | **不要** | **不要（本線確定）** |

---

## 2. Gemini 固有の寄与

| ID | 内容 | 役員会扱い |
|----|------|------------|
| G-SO-8 | A1 の **中部パネル軸切断（180起点）** を明示（二重軸＋切り詰めの二重誤読） | Dual/ゼロ基線 Reject・Adopt の証拠強化 |
| G-SO-9 | スケール自動余白 **`[0, max×1.1]`** を標準案 | G-SO-C に数値候補として採録（確定は Acceptance） |
| G-SO-10 | 引出線アノテは Hold · **直接ラベルのみ**を先に | G-SO-D を「自由引出線なし」に寄せる |
| G-SO-11 | SM を二重軸代替の **Next（2–3面・同尺）** | 既存 Small_Multiples（単位違い上下分離）と **別要件**としてメモ。混同禁止 |
| G-SO-12 | コンフリクト表で Dual を「CMO/CPOが実務要望」と記載しつつ製品は Reject | **要望があっても出さない**を明文化（憲法・誤読） |
| G-SO-13 | Pack B 不要 · 実装・回帰テストへ移行 | 採用（本線は確定） |
| G-SO-14 | 追加文献: Heer–Bostock 2010 · Correll–Gleicher · Sweller CLT | 任意読書 |

**Gemini の P0「Waterfall 即正式採用」は採らない。** 需要シグナルとしては Claude と同方向だが、STATUS_GATE R2 HOLD・判断系クローズを破る。代わりに **G-SO-F を「需要確定・解禁条件メモ」へ格上げ**する。

---

## 3. セカンド横断の新規論点（一次からの差分）

| ID | 論点 | 由来 | 扱い |
|----|------|------|------|
| G-SO-1 | Presentation Grammar | ChatGPT | **Adopt今（文書）** |
| G-SO-2 | 競争＝資料化時間の削除 | ChatGPT | **Adopt（コピー）** |
| G-SO-3 | Waterfall = Narrative | ChatGPT · Claude · Gemini | **Next（需要確定）** |
| G-SO-4 | Donut ％合計ゲート | Claude · Gemini | **Hold条件** |
| G-SO-5 | 符号色 ≠ 達成色 | Claude · Gemini | **設計 Adopt** |
| G-SO-6 | 状態空間爆発を Spec で閉じる | ChatGPT | **Adopt** |
| G-SO-7 | Pack B T5/T4 | Claude | **任意（Gemini=不要）→ 本線では不要** |
| G-SO-8〜14 | 上表 | Gemini | 上記 |

---

## 4. 先行研究 — 合意

| 枠組み | 合意 | 効き |
|--------|------|------|
| Cleveland & McGill | 強く適応 | 共有軸・棒/線 · Dual/Pie 抑制 |
| Few（dual-axis） | 強く適応 | A1 排除の理論根拠 |
| Bertin | 適応 | 位置・長さ主 |
| Munzner Why | 適応 | Intent→イディオム |
| Tufte | 適応〜部分 | Chartjunk削減 · ただし結論見出しは残す |
| 色覚 / WCAG | 適応 | 達成赤緑禁止 · 明度差 |

---

## 5. 役員会バックログ（確定版）

| ID | 優先 | 打ち手 | 置き場 | 今やらない |
|----|------|--------|--------|------------|
| **G-SO-A** | P0 | R1 資料品質（軸・余白・単位・線幅・折れ点・限定直接ラベル） | Renderer · Palette | 新タイプ実装 |
| **G-SO-B** | P0 | Presentation Grammar 文書化 | `docs/graph/` | 判断系再オープン |
| **G-SO-C** | P0 | ゼロ基線・共有軸・（候補）上限余白を不変条件化 | Validator · STATUS | 軸切断UI |
| **G-SO-D** | P1 | 固定コールアウト／見出し枠（引出線Editorなし） | deck slot | 衝突回避アノテ |
| **G-SO-E** | P1 | 符号色トークン ≠ 達成色（1節） | Palette | 達成色解禁 |
| **G-SO-F** | P1 | Waterfall **需要確定メモ**（開始→要因→終了 · 解禁条件） | RESEARCH/Parking | **即 Renderer 実装** |
| **G-SO-G** | P2 | Donut/Pie Hold条件（≤4 · 合計100% · Intent） | STATUS R3 | 必須化 |
| **G-SO-I** | P2 | SM「二重軸代替・同尺2–3面」は既存 MULTI_METRIC SM と別チケット | メモのみ | Dual の裏口 |

**やらない（いま）:** Dual 解禁 · Dashboard · Pyramid/Funnel · 達成色 · Waterfall 即実装 · Pack B 必須化 · 判断系再設計。

---

## 6. 提督への明示選択（Waterfall）

セカンド 2/3（Claude·Gemini）が **Adopt今**。ChatGPT と STATUS_GATE は **Next/HOLD**。

| 選択肢 | 意味 |
|--------|------|
| **A** | 需要は確定と宣言し、実装は R2 解禁ジャッジ後。いまは G-SO-A/B/C |
| **B（採択 · 2026-08-14）** | STATUS を更新して Waterfall を R1.x+ GO（BRIDGE 限定）· Acceptance 必須 |

**採択: B。** 実装正本 [`../graph/GRAPH_WATERFALL_SPEC.md`](../graph/GRAPH_WATERFALL_SPEC.md)。

---

## 7. コピー（採用可）

| 採用可 | 禁止 |
|--------|------|
| 「貼って資料になる」「資料化の手間を減らす」 | 「何でも描ける」「Excelより賢い」 |
| 「種類より壊れない構図」 | 「ダッシュボード編集」 |
| 「目標・達成は位置で示す」 | 「未達を赤で自動」 |
| 「要望があっても二重軸は出さない」 | — |

---

## 8. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-08-14 | Gemini DR 追記 · 四者比較 · Waterfall は需要確定だが実装 Next（案A） |
| 2026-08-14 | 初版 · ChatGPT A / Claude A |
