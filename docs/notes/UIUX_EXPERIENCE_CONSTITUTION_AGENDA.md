# SUGUDASU Experience Implementation Review v1 — 役員アジェンダ

**旧称:** Experience Constitution Review（E-CONST で改称 · 2026-07-30 — **新憲法は作らない**）  
**Identity 正本:** Brand Constitution · Case Law · 存在様式  
**HOW 正本:** `UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md` · `DESIGN_GUIDELINE.md`

**更新:** 2026-08-05（§3.5 Surface / VH **決議済** · S-PILOT 残）  
**状態:** v1 決議済み · **S-SURFACE Closed**（Hub 検索パイロットのみ実装許可）
**監査表:** [`UIUX_EXPERIENCE_AUDIT_MATRIX.md`](UIUX_EXPERIENCE_AUDIT_MATRIX.md)  
**決定論契約:** [`UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`](UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md)  
**判断ログ:** [`UIUX_EXPERIENCE_JUDGMENT_LOG.md`](UIUX_EXPERIENCE_JUDGMENT_LOG.md)  
**Surface 議決票:** [`UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md)  
**マルチAI前段:** [`../prompts/uiux-experience-constitution-RUNBOOK.md`](../prompts/uiux-experience-constitution-RUNBOOK.md) · 合成 [`uiux-experience-research/SYNTHESIS.md`](uiux-experience-research/SYNTHESIS.md) · Surface [`SYNTHESIS_SURFACE_HIERARCHY.md`](uiux-experience-research/SYNTHESIS_SURFACE_HIERARCHY.md)

> Agent: **CTA・コピー演出・DnD・「サクサク」の全面統一は、本 Review の決議前に勝手に実装しない。**  
> 「延長で寄せる」だけのパッチは禁止。色の意味・成功の伝え方・仕事の終わり方を先に合意する。  
> マルチAI出力は **材料**。憲法・DESIGNへの昇格と最終決定は **役員会のみ**。

---

## 0. 現状の一文（事実）

**思想・仕様はかなり揃っている。体験は揃っていない。**

| 言っていること | 現場 |
|----------------|------|
| DESIGN §3.2 L1/L2/L3 · §3.8 コピー契約 | 黒主ボタン · 緑の非印刷利用 · 独自トースト / `alert` 残 |
| `sg-copy-feedback`（「コピーしました」+ emerald flash） | 多数は共有、一部 raw / 二重配線 |
| Copy-First（CASE-2026-007 · チャネル非接続） | 体験スローガンと混同されやすい |
| Calm UX（pdf-fill 等） | 全ツールの知覚レイテンシ契約なし |
| `.sg-file-drop` | CSS Pattern のみ。JS DnD はツールごと |

だから「いまの実装の延長で統一する」だけでは足りない。**完了モデルと色の意味**を一度憲法レベルで再合意する。

```text
Copy-First / L1-L2-L3 / Calm UX
        ↓ 仕様はある
青・黒・緑混在 / 共有と独自コピー / CSSのみDnD / 体感の濃淡
        ↓ 認知のズレ
ブランド信頼の摩耗
```

---

## 1. MECE 問題地図（P1–P8）

会議では「ボタン色」から入らない。下の **8層** で漏れなく挙げる。

| # | 層 | 問うこと | 既知の濃淡（監査スナップショット） |
|---|-----|----------|-----------------------------------|
| **P1** | **仕事の終わり方** | コピー / 印刷 / PDFDL / 続きを開く / 何もしない — どれが「完了」か | Copy-First vs 帳票の印刷完了 vs pdf-fill の提出完成 vs Continue Later が同居 |
| **P2** | **成功の知覚** | どう伝われば「終わった」か（色・文言・フラッシュ・音なし） | §3.8 は emerald done。緑は同時に **印刷CTA・ローカル完結バッジ・コピー成功** に使われ意味が衝突 |
| **P3** | **アクション色の意味** | L1/L2/L3/黒の意味論は憲法か、慣習か | 正本: 青=主、緑=印刷1つ、黒=小操作可。現場: `invoice`/`stamp`/`label` 等に黒、`timeline` の +5分が emerald、`fair-draw` 名簿反映も emerald |
| **P4** | **入力の取り方** | 貼る / 置く / 選ぶ / 打つ — 入口の文法 | `.sg-file-drop` は CSS Pattern。JS DnD はツールごと。webp/video は独自破線 |
| **P5** | **Copy-First の射程** | 「チャットに送らない」と「コピー体験統一」は別問題 | 前者は判例済み。後者は実装ゲート不足（`search-query` 独自、一部 `alert`、仕様に `Copied!` 英語残） |
| **P6** | **時間・体感** | サクサク＝何 ms / 何フレーム / 何フィードバックか | Calm UX は局所。全ツールの知覚レイテンシ契約なし |
| **P7** | **情報設計・言葉** | 同じ行為のラベルゆれ | 「コピー」「クリップボードにコピー」「コピー（最新の出力）」「保存」（成果物 vs Continue Later） |
| **P8** | **世代格差（技術負債 UX）** | 初期アジャイル vs 後発憲法準拠 | 帳票系・変換系・Canvas系・Sync系でデザイン成熟度が違う |

### スコープ外（この会議では扱わない）

- Sync 専用ランタイム詳細
- 個別機能追加
- AdSense 配置最適化単体
- 新ツール提案

### 完了系統（仮説ラベル · 採否は会議）

会議で公式化する候補。監査表の「完了系統」列もこれに合わせる。

| 系統 | 完了の感じ | 代表 |
|------|------------|------|
| **Transform-Copy** | 変換 → コピーして終わる | normalize · report · reverse · warikan |
| **Print-Finish** | 帳票を印刷/PDFして終わる | invoice · receipt · label · shift |
| **Bake-Download** | 提出物を固めて DL | pdf-fill · watermark · pdf-images |
| **Canvas-Copy** | 画像をクリップボードへ | annotate · stamp · clipboard-trim · image-trim |
| **Continue-Later** | 途中再開（完了ではない） | pdf-fill 下書き · shift 等（CL=YES） |
| **Session-Ephemeral** | その場で終わり永続しない | planning-poker · qr-reader · uragami |

---

## 1.5 マルチAI前段（任意 · 役員会の前）

**目的:** 世の中の総意の集約にとどまらず、**尖った意見**と **低学習コストの類推**（メジャーWeb · TVリモコン · ゲームパッド等）を材料にする。  
**使わない自由:** Claude / ChatGPT / Gemini / Grok / Perplexity / Cursor は全部必須ではない。

| AI | ROLE（要約） | 目的 |
|----|--------------|------|
| Claude | 体験アーキテクト | 完了モデル · Copy-First 再定義 · 意図的非統一 |
| ChatGPT | HCI / DS | 色の意味表 · CTA文法 · デフォルトと反論 |
| Gemini | パターン司書 | 低学習コスト類推のカタログ |
| Grok | 反ジェネリック | 刺す・削る · 中庸への先回り反論 |
| Perplexity | 出典調査 | URL付き裏取り |
| Cursor | 監査 | マトリクス事実のみ（依頼時） |

手順・COPYPASTE: [`../prompts/uiux-experience-constitution-RUNBOOK.md`](../prompts/uiux-experience-constitution-RUNBOOK.md)  
合成: [`uiux-experience-research/SYNTHESIS.md`](uiux-experience-research/SYNTHESIS.md)（総意候補 / 尖り / 却下）

**役員会での扱い:** Framing（§2.0）の前に SYNTHESIS を1枚配る。AIの多数決で決めない。

---

## 2. 役割別アジェンダ（会議の進め方）

**会議名:** SUGUDASU Experience Implementation Review v1（旧 Constitution Review）
**成果物:** P1–P8 に Keep / Change / Defer + P0–P2。Change は 憲法候補 / DESIGN のみ / 実装のみ に分類。  
**昇格経路:** 合意後 → DESIGN §3.2/§3.8 · 必要なら Case Law / Product Constitution（憲法は勝手に書き換えない）。

### 0. Framing（10分 · CPO）

- 目的: 「統一する」は既知。**何を統一し、何を意図的に分けるか**を決める
- 任意: マルチAI `SYNTHESIS.md` を共有（総意と尖りを分けて読む）
- 禁止: いきなりコンポーネント名議論、流行UI提案、1ツールのパッチ談義、**AI出力の多数決**
- 成功条件: P1–P8 に **Keep / Change / Defer** と優先順位（P0–P2）が付く

### 1. CPO — 仕事の完了モデル（25分 · P1, P5, P7）

**議題**

- SUGUDASU コアの完了動詞は何か（コピー完了 / 印刷完了 / ファイル完成 / 続き可能）
- Copy-First は **チャネル非接続の憲法**か、**コピーを主CTAにする憲法**か（現状は前者寄り・CASE-2026-007）
- 帳票（印刷緑）と変換（コピー青）と Canvas（画像コピー）を **同じ完了言語**で語るか、**系統別完了言語**にするか

**決めること**

- 完了モデルの公式分類（上表の採否・改名）
- 「Copy-First」の再定義文（1文）

### 2. 認知科学者 — 成功知覚と色の意味負荷（25分 · P2, P3, P6）

**議題**

- 緑が「成功」「印刷」「安全（非送信）」を兼任している認知コスト
- 一時状態（コピーしました 2秒）と恒常CTA（印刷）の混同リスク
- サクサクの定義: 操作応答・コピー成功・PDF読込の **知覚レイテンシ帯**（例: &lt;100ms / &lt;300ms / プログレス必須）

**決めること**

- 色の意味表（恒常 vs 一時）を1枚に固定するか、緑成功をやめて別チャネル（文言+弱フラッシュ）にするか
- 体感 SLA の「憲法級」か「ガイドライン級」か

### 3. シニア UIUX — コンポーネント文法（25分 · P3, P4, P7, P8）

**議題**

- L2 青 / L3 緑 / slate 黒の **許容表**（いつ黒が主に見えてよいか）
- DnD: 見た目 Pattern だけでよいか、薄い `sg-file-drop` JS を抽出するか（Tech Adoption 3回目ルールと接続）
- 世代ツールの「寄せ方」: 全ツール同時 vs 完了系統ごとにウェーブ

**決めること**

- UI Kit 最小セット（ボタン3種 · drop · copy feedback · busy）の境界
- **意図的に揃えない**もの（例: pdf-fill の紙感、裏紙の意図的非永続）

### 4. CTO — 実装契約とゲート（20分 · P5, P6, P8 + Tech）

**議題**

- §3.8 は文書義務だが機械ゲートが弱い（naming/tech-adoption はある、copy/CTA 監査は弱い）
- shared: `sg-copy-feedback` はある。DnD/busy/primary CTA は未抽出が多い
- 「英語 Copied!」は実行コードから消えているが仕様残骸あり → docs 掃除 vs 実装監査の優先

**決めること**

- 回帰防止を **contracts + verify スクリプト**にするか、カタログ監査列（Copy/CTA/DnD）にするか
- P0 実装ウェーブの技術上限（Platform SDK 禁止は維持）

### 5. CMO — ブランド知覚と対外コピー（15分 · P1, P2, P7）

**議題**

- Hub / statements / LP で「一瞬で終わる」「コピーして終わり」と書いてよい条件
- 緑フラッシュや「コピーしました」が **安っぽい成功演出**に見えないか（流行UI禁止との整合）
- 認知獲得（BACKLOG §14）と製品内体験の一貫: 広告で約束した体験がツールで裏切られないか

**決めること**

- 対外で使ってよい完了フレーズのホワイトリスト
- 「サクサク」をマーケ語として残すか、計測可能な体験語に置換するか

### 6. 統合決議（20分 · 全員）

- Keep / Change / Defer を P1–P8 に割付
- Change は **憲法改正候補 / DESIGN のみ / 実装のみ** に分類
- 次の作業物: ~~Experience Constitution 草案~~ → **実装契約 + DESIGN が HOW 正本**（E-CONST）· 監査マトリクス更新 · P0 ウェーブ定義
- この議題の位置づけ（憲法化 or ガイドライン運用）は、`UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md` を叩き台に役員会で決定

---

## 3. 立ち止まって決める論点（仮説 · 採否は会議）

| # | 論点 | 状態 |
|---|------|------|
| 1 | 緑成功フィードバック（印刷緑との衝突） | **決議済 C+** — [`UIUX_EXPERIENCE_TOAST_FLASH_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_TOAST_FLASH_BOARD_DISCUSSION.md) |
| 2 | 黒ボタン（小操作許容 vs 主CTA化禁止 · 帳票例外） | **決議済 E-BLACK** — 小操作黒残す · フル幅/handoff は青 · 契約 §2.1 |
| 3 | Copy-First の**呼称**（意味=チャネル非接続は決議済） | **決議済 E-NAME** — スローガン取り下げ · 差別化新語は持ち越し |
| 4 | 系統別完了 UX | **決議済**（P1 · 6系統） |
| 5 | 体感 busy/skeleton | **決議済 E-SLA** — 契約原則 + DESIGN 目安 · 憲法に上げない |
| 6 | ツール `sg-tool-lead` | **決議済**（L1–L6） |
| 7 | リード vs FAQ の差別化置き場 | **決議済** |
| 8 | スグダス誤訪問注意 | **Defer** → **E-SUBARU** |
| 9 | **Visual Hierarchy / Surface（のっぺり）** | **決議済 S-SURFACE** — [`UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md) · 契約 §2.4 · DESIGN §2.3.1 · 実装は Hub パイロットのみ |

**未決バックログ正本:** [`UIUX_EXPERIENCE_JUDGMENT_LOG.md`](UIUX_EXPERIENCE_JUDGMENT_LOG.md) · ID: E-* · S-*（S-SURFACE **Closed** · パイロット残）

---

## 3.5 Surface / VH ウェーブ（2026-08-05 · **決議済**）

**採択要約:** HOW のみ · 検索ファースト＋検索一段上げ · カード同型 · Hub で Operate 禁止 · Orient 折りは product_voice 方針 · **S-PILOT=Hub 検索のみ**。  
**議決票:** [`UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md)

| Keep | Defer / 後段 |
|------|----------------|
| S-Q3 · S-NO-* · Q1-A＋ · モード表 · S-PILOT(Hub) | Q1-G（要 Hub IA ADR）· 色トークン · 全ツール Orient 実装 · 横展開 |

**Agent:** 一括 Surface / 色 / カード廃止は **引き続き禁止**。許可は Hub 検索一段上げのみ。

---

## 4. 決議記入欄（会議後に埋める）

| # | Keep / Change / Defer | 優先 | 昇格先（憲法候補 / DESIGN / 実装） | メモ |
|---|------------------------|------|-----------------------------------|------|
| P1 | **Change** | P0 | DESIGN + 実装 | 完了は系統別で明示（Transform / Print / Bake / Canvas / Continue / Ephemeral）。単一「完了」へ潰さない。 |
| P2 | **Change** | P0 | DESIGN | Action（押す）と Feedback（成功）を分離。成功通知の一時緑と恒常CTA緑を分ける。 |
| P3 | **Change** | P0 | DESIGN + 実装 | 青=主CTAを維持。L3緑は「成果物を外へ出す」に限定。内部操作（+5分・名簿反映）から緑を剥奪。 |
| P4 | **Keep+Change** | P1 | 実装 | `.sg-file-drop` の見た目共通は維持。DnD JS は個別維持。ただし見た目だけドロップ可は解消。 |
| P5 | **Change** | P0 | 憲法候補 + DESIGN | Copy-First は「チャネル非接続/手動持ち帰り」（CASE-2026-007整合）へ固定。コピー主CTA化とは切り分ける。 |
| P6 | **Change** | P1 | DESIGN | 体感SLAはガイドライン級で定義（憲法級には上げない）。「サクサク」は対外コピーから段階的に置換。 |
| P7 | **Change** | P0 | DESIGN + 実装 | コピー成功文言を「コピーしました」に統一。`alert` / 英語 `Copied!` / 独自トーストを段階廃止。 |
| P8 | **Keep+Change** | P1 | 実装 + 運用 | 全面一括改修はしない。完了系統ごとのウェーブ移行（P0→P1）で世代差を収束させる。 |

**Copy-First 再定義（1文 · 意味の正本 · 呼称は E-NAME でスローガン取り下げ）:** SUGUDASUはチャネルへ自動送信せず、成果物をユーザーが手で持ち帰る体験を提供する。対外スローガンに「Copy-First」は使わない（[`UIUX_EXPERIENCE_NAME_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_NAME_BOARD_DISCUSSION.md)）。

**完了モデル公式分類:** Transform-Copy / Print-Finish / Bake-Download / Canvas-Copy / Continue-Later / Session-Ephemeral（Continue は再開系統として扱い、完了とは混同しない）。

**P0 ウェーブ:** 1) コピー成功文言統一と `alert` 廃止 2) 内部緑CTA剥奪 3) Copy-First 文言の憲法整合化（CASE-2026-007） 4) 見た目だけDnD可の解消。

---

## 5. 会議前に読む最小セット

- [`../DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §1 · §3.2 · §3.8
- [`../brand/BRAND_CONSTITUTION.md`](../brand/BRAND_CONSTITUTION.md) · [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md) F5
- [`../legal/CASE_LAW.md`](../legal/CASE_LAW.md) CASE-2026-007
- [`PAGE_LAYOUT_SELECTOR.md`](PAGE_LAYOUT_SELECTOR.md) · [`UI_LAYOUT_REFRESH_GUIDE.md`](UI_LAYOUT_REFRESH_GUIDE.md)
- [`TECH_ADOPTION_NOTE.md`](TECH_ADOPTION_NOTE.md)
- [`CONTINUE_LATER_SPEC.md`](CONTINUE_LATER_SPEC.md) §8.1（完了 ≠ 続き）
- 実装: [`../../assets/sg-copy-feedback.js`](../../assets/sg-copy-feedback.js) · [`../../assets/sugudasu.css`](../../assets/sugudasu.css)
- 監査: [`UIUX_EXPERIENCE_AUDIT_MATRIX.md`](UIUX_EXPERIENCE_AUDIT_MATRIX.md)
- マルチAI: [`../prompts/uiux-experience-constitution-RUNBOOK.md`](../prompts/uiux-experience-constitution-RUNBOOK.md) · [`uiux-experience-research/SYNTHESIS.md`](uiux-experience-research/SYNTHESIS.md)
- Surface/VH: [`UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_SURFACE_BOARD_DISCUSSION.md) · [`uiux-experience-research/SYNTHESIS_SURFACE_HIERARCHY.md`](uiux-experience-research/SYNTHESIS_SURFACE_HIERARCHY.md)

---

## 6. Agent 禁止（Review 進行中）

- CTA色・コピー成功演出・DnD の **全ツール一括統一 PR**
- Surface / 背景・カード見た目の **Hub・全ツール一括**（S-SURFACE 後も禁止 · **許可は Hub 検索一段上げのみ**）
- Primary 色一括変更 · カードUI廃止を「のっぺり解消」として先走る PR
- Q1-G タスク文脈アコーディオンの先走り（Hub IA ADR 未改訂）
- 「Copied!」英語への先祖返り
- Platform SDK / 巨大共通化の先作り
- 憲法本文の勝手な改正（判例候補は `docs/legal/logs/`）
- マルチAI出力を **多数決やそのまま憲法貼付**すること
