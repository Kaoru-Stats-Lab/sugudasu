# UIUX Experience Judgment Log

**更新:** 2026-07-30  
**目的:** Experience Review の思想・背景・証拠・判断を時系列で残し、後で同じ基準に立ち戻れるようにする。  
**扱い:** ここは運用ログ（HOW/WHY）。憲法判断（Judicial Decision）は確定後に `docs/legal/CASE_LAW.md` へ昇格。

---

## 2026-07-30 — Experience Constitution Review 初回決議（実装契約化）

### 1) 背景（Pain）

- DESIGN 正本（L1/L2/L3・コピー契約）はあるが、実装は濃淡がある
- コピー成功導線で `shared` / `raw` / `alert` / 独自トーストが混在
- 緑の意味が衝突（印刷CTA・成功通知・一部内部操作）
- DnD は CSS 共通だが JS 実装が個別で、見た目だけ drop 可の箇所が発生

### 2) 証拠（Evidence）

- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md`
- 合成: `uiux-experience-research/SYNTHESIS.md`
- 判例: `docs/legal/CASE_LAW.md` CASE-2026-007（Copy-First = チャネル非接続）
- 仕様: `docs/DESIGN_GUIDELINE.md` §3.2 / §3.8

### 3) 判断（この時点）

1. 新規プロダクト実装は **決定論** で行う（自由裁量を最小化）
2. 入力パラメータ（completion_model / product_voice 等）を固定し、CTA 配列を機械的に決める
3. Copy-First は「コピー主CTA化」ではなく「自動送信しない責任分界」として扱う
4. 完了モデルは系統別（Transform/Print/Bake/Canvas/Continue/Session）を維持
5. Continue-Later と Session-Ephemeral は統合しない（約束が異なる）

### 4) 実装物

- 決定論契約: `UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md`
- 役員会決議欄: `UIUX_EXPERIENCE_CONSTITUTION_AGENDA.md` §4

### 5) 未決（役員会で再審）

- L3 緑の範囲を「印刷専用」に閉じるか、「成果物を外へ出す」に広げるか
- コピー成功を Toast ありにするか、Toast レスへ寄せるか
- 帳票系の黒CTAを例外として追認するか
- 体感SLAを憲法級に上げるか（現状はガイドライン級）

### 6) 再発防止ルール

- 新規実装は `UIUX_DECISION_BLOCK` を必須化（契約 §5）
- ブロックが無い PR/実装提案はレビューしない
- 仕様変更は「契約更新 → 実装変更」の順を守る

---

## 追記テンプレート

```text
## YYYY-MM-DD — タイトル

### 背景
-

### 証拠
-

### 判断
-

### 未決
-

### 次アクション
-
```

---

## 2026-07-30 — P0 Pilot #1 `search-query`

### 背景

- 監査で `search-query` は `Copy=raw`（共有コピー契約未適用）
- P0-1（コピー導線統一）の最小対象として安全に着手できる

### 証拠

- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md`（`search-query` 行）
- 実装: `tools/search-query.html` のコピー処理

### 判断

- `completion_model=transform_copy`
- `product_voice=fast_utility`
- `cta_order=S1 > S2 > S4`
- コピー処理を `SG_COPY_FEEDBACK.copyWithFeedback()` へ移行
- 独自成功表示（素朴な `span` 切替）を廃止し、共通 toast へ統一

### 未決

- `S4` の明示アクション（入力クリア）をUIに出すかは別PRで判断

### 次アクション

- `timeline` で P0-2（内部緑CTA剥奪）を次パイロット候補にする

---

## 2026-07-30 — P0 Pilot #2 `timeline`（内部緑CTA剥奪）

### 背景

- `timeline` は内部操作（`+5分` と `行追加`）に緑CTAを使用していた
- P0決議（P3）では、緑CTAを「成果物を外へ出す」用途に限定する

### 証拠

- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md` `timeline` 行（旧: emerald600=2）
- 実装: `tools/timeline.html` フッター操作ボタン・テンプレート読込ボタン

### 判断

- `+5分`: `bg-emerald-600` → `bg-blue-600`（内部調整はL2青）
- `行追加`: emerald border/text → slate系セカンダリ
- `サンプル読込`: emerald系強調 → slate系セカンダリ
- 非送信バッジ等の説明用途緑は維持（P0-2 対象外）

### 未決

- `timeline` の P0-1（コピー導線監査の再確認）は次ウェーブで判定

### 次アクション

- `fair-draw` の内部緑CTA（名簿反映）を次の P0-2 候補として処理

---

## 2026-07-30 — P0 Pilot #3 `fair-draw`（内部緑CTA剥奪）

### 背景

- `fair-draw` で内部操作 `名簿に反映` が緑CTAだった
- P0決議では緑CTAを成果物外部化（印刷/DL等）用途へ限定する

### 証拠

- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md` `fair-draw` 行（旧: emerald600=3）
- 実装: `tools/fair-draw.html` `btn-fd-csv-apply`

### 判断

- `名簿に反映` を `bg-emerald-600` から `bg-blue-600` へ変更
- 監査PDF（印刷）ボタンの緑は維持（成果物を外へ出す導線）
- これにより非印刷系の緑CTA疑いを解消

### 未決

- `fair-draw` の `alert` 文言系（コピー失敗など）は P0-1/P0-7 波で別途整理

### 次アクション

- `report` / `reverse` の二重配線疑いを P0-1 で精査

---

## 2026-07-30 — P0 Pilot #4 `report`（コピー前ガイドの alert 廃止）

### 背景

- `report` はコピー前の未生成状態で `alert` に依存していた
- P0-1 ではコピー導線を `sg-copy-feedback` 契約 + 非ブロッキング通知へ寄せる

### 証拠

- 実装: `tools/report.html` の `btn-copy-local` / `btn-gemini` ハンドラ
- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md` `report` 行（旧 `alert=Y`）

### 判断

- 未生成時ガイドを `alert` から inline toast（amber）へ変更
- コピー成功経路は既存の `sg-copy-feedback` 利用を維持
- ブロッキング通知を避け、作業フローを止めない

### 未決

- `reverse` の同系統確認は次ウェーブ

### 次アクション

- `reverse` の alert / コピー導線を同方針で是正

---

## 2026-07-30 — P0 Pilot #5 `reverse`（コピー前ガイドの alert 廃止）

### 背景

- `reverse` の Gemini 導線で未生成時に `alert` を使用
- P0-1 方針ではコピー周辺の通知を非ブロッキング（inline）へ寄せる

### 証拠

- 実装: `tools/reverse.html` `copyAndOpenGemini()`
- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md` `reverse` 行（旧 `alert=Y`）

### 判断

- 未生成時ガイドを `alert` から amber の inline toast へ変更
- コピー成功経路は `sg-copy-feedback` 利用を維持

### 未決

- 他 Transform 系で `alert` が残るツール（`normalize` など）は次ウェーブ

### 次アクション

- Transform-Copy 群の `alert` 一掃（`normalize`/`warikan`/`invoice`優先）をP0-1継続

---

## 2026-07-30 — P0 Pilot #6 `normalize`（コピー系 alert 廃止）

### 背景

- `normalize` のコピー例外処理で `alert` を使用していた
- P0-1 方針に合わせ、コピー体験を非ブロッキング通知に統一する

### 判断

- コピー失敗・空データ・行数ゲート警告を amber の inline toast へ統一
- 既存の `sg-copy-feedback` 連携は維持

### 未決

- なし（`normalize` の alert は解消）

---

## 2026-07-30 — P0 Pilot #7 `warikan` / `invoice`（コピー失敗通知の toast 化）

### 背景

- `warikan` / `invoice` でコピー失敗時の `alert` が残っていた
- P0-1 の対象を「コピー周辺の体験」に限定して先行是正

### 判断

- `warikan`: コピー失敗・未計算時ガイド・成功通知を `copy-toast-warikan` へ寄せた
- `invoice`: 送付文面コピー失敗と mixed-tax TSV コピー失敗を toast 化
- どちらもコピー成功経路の `sg-copy-feedback` は維持

### 未決

- `warikan` の入力ガード alert（最低グループ数・未計算X共有）は残存
- `invoice` の下書き保存/読込フロー alert（確認・成功・失敗）は残存

### 次アクション

- 次ウェーブで「コピー周辺以外の alert」をEFO方針に沿って段階置換する

---

## 2026-07-30 — P0 Pilot #8 `receipt`（共有URLコピー失敗通知の alert 廃止）

### 背景

- `receipt` の共有URLコピー失敗時に `alert` を使用していた
- P0-1 ルールに合わせ、コピー系通知を非ブロッキング化する

### 判断

- `copy-toast-receipt` を使って失敗通知を inline toast 化
- 既存の `sg-copy-feedback` 成功通知は維持

### 未決

- なし（`receipt` のコピー系 alert は解消）

---

## 2026-07-30 — P0 Pilot #9 `warikan` / `invoice`（残存 alert の解消）

### 背景

- P0 Pilot #7 時点で、`warikan` と `invoice` に非コピー系 alert が残っていた
- MECE台帳の保留を減らすため、着手済みツールを優先して完了させる

### 判断

- `warikan`: グループ最小数ガードと X共有前ガードを amber toast に置換
- `invoice`: 下書き保存成功・読込成功・読込失敗を toast 化（確認ダイアログは維持）

### 未決

- なし（`warikan` / `invoice` の `alert()` は解消）

### 次アクション

- 次ウェーブは `label` / `shift` / `annotate` / `group-split` / `fair-draw` / `webp-to-jpg` の順で alert 残を削減

---

## 2026-07-30 — P0 Pilot #10 `label`（履歴保存/復元系 alert 廃止）

### 背景

- `label` で保存/復元/取込失敗などの運用通知に `alert` が残っていた
- MECE台帳の次優先として着手し、P0-1 の非ブロッキング通知へ統一する

### 判断

- `label-action-toast` を追加し、次を inline toast 化:
  - 一括解析失敗
  - 履歴保存完了
  - バックアップ復元完了
  - バックアップ読込失敗
- 既存の確認ダイアログ（confirm）は維持

### 未決

- なし（`label` の `alert()` は解消）

---

## 2026-07-30 — P0 Pilot #11 `shift` / `annotate` / `group-split` / `fair-draw` / `webp-to-jpg`（alert 残の連続解消）

### 背景

- 前ウェーブで `label` まで完了し、次順は `shift` → `annotate` → `group-split` → `fair-draw` → `webp-to-jpg`
- P0-1 の非ブロッキング通知統一を、指定順で一気通貫させる必要があった

### 証拠

- 実装: `tools/shift.html`, `assets/annotate-app.js`, `tools/group-split.html`, `tools/fair-draw.html`, `tools/webp-to-jpg.html`
- 監査: `UIUX_EXPERIENCE_AUDIT_MATRIX.md` の `alert` 列と横断サマリ

### 判断

- `shift`: LocalStorage 保存完了の `alert` を `shift-action-toast` へ置換
- `annotate`: 入力検証・読込失敗・PDF出力失敗を `alert` から `editor-status`（非blocking）へ統一
- `group-split`: 制約入力ガイド・コピー失敗・セッションJSON読込失敗を `gs-copy-toast` へ統一
- `fair-draw`: CSV取込エラーは `fd-csv-warn`、コピー失敗/実行前ガードは toast 表示へ統一
- `webp-to-jpg`: 枚数上限・部分追加・入力不正を `webp-action-toast` へ統一

### 未決

- `confirm()`（破壊的操作や重大確認）は保持。P0-1 の対象外

### 次アクション

- `UIUX_EXPERIENCE_AUDIT_MATRIX.md` と `UIUX_EXPERIENCE_MECE_TOOL_CHECKLIST.md` の残 `hold` を次ウェーブで消化

---

## 2026-07-30 — P0 hold 消化ウェーブ（P0-1/P0-2 横断クローズ）

### 背景

- 指定順の alert 解消後、MECE台帳に多数の `hold` が残り、P0-1/P0-2 の実態と台帳が乖離していた
- 実コード監査では多くのツールが既に `sg-copy-feedback` 済みで、残 alert は資産側に集中

### 証拠

- `tools/*.html` の `alert(` は updates 以外ほぼ 0（更新後は 0）
- 残 alert の実装箇所: `group-split-assign-app.js` · `mask-app.js` · `sugudasu-growth.js` · `sticky-room-app.js` · `updates.html`

### 判断

- P0-1: 残 alert を非blocking通知へ置換し、コピー契約済ツールは台帳で `done`/`na` に精査更新
- P0-2: `bg-emerald-600` の内部操作CTAは実質解消済み（印刷/shellのみ）として横断 `done`
- P0-3 / P0-4 は次ウェーブ（文言監査 · DnD目視）へ持ち越し

### 未決

- Bake系（video-frame / watermark / pdf-*）の Copy列（maybe）の最終ラベル
- sticky-room を MECE台帳へ正式行追加するか（Sync帯）

### 次アクション

- P0-3: Copy-First 文言の横断監査
- P0-4: `.sg-file-drop` / custom drop の実装有無ゲート

---

## 2026-07-30 — リード文一貫性は未決 · P0-3/P0-4 実行

### 背景

- 各プロダクトの `sg-tool-lead` が、競合差分 · 機能説明 · 使い方 · Pain→完了 を混在させており、**役割が憲法定義されていない**
- カオル指摘: 「後逸されていない。まだ決めていない気がする。議論は必要」
- 同時に P0-3（Copy-First 文言）· P0-4（DnD目視）を優先実行する指示

### 証拠

- Agenda §3 に論点追加（リード文の役割）
- CASE-2026-007: Copy-First = チャネル非接続 / 手動持ち帰り（コピー主CTA化ではない）
- チャネル名付き共有CTA残: annotate lead · fair-draw ボタン · warikan 見出し 等
- DnD: `.sg-file-drop` 全件に click + drop + file input 同居をコード確認。custom（webp / video-frame / fair-draw CSV）も drop 実装あり。見た目だけ詐欺は未検出

### 判断

1. **リード文の統一は今やらない** — 役員会/議論議題。一括 rewrite 禁止
2. **P0-3** は CASE 整合のみ: チャネル名付き**共有CTA/リードの送付示唆**を除去 · statements の Copy-first 定義を責任分界へ寄せる · 仕様の `Copied!` 残骸掃除
3. **貼付先の例**（disclosure · FAQ · 形式タブ `data-segment-value=slack`）は CASE 上許容。ボタン文言を「Slack用…」にするのは NG
4. **P0-4** は監査合格（見た目だけドロップ可なし）。行/枠 DnD（invoice · slot-board）はファイル入口ではないため P0-4 対象外（`na`）

### 未決

- リード文の第一声テンプレ（競合 / 機能 / 使い方 / Pain）
- group-split の形式タブ表示名「Slack」「LINE」を「チャット用」等へ改称するか（値は `slack`/`line` のまま可）
- Hub カード vs tool lead の責務分担をガイドラインに書くか

### 次アクション

- 役員会で Agenda §3 #6 を討議
- group-split SEO/lead のチャネル語はリード文議題に合流（P0-3 では触らない）

---

## 2026-07-30 — リード文 · FAQ 役員会討議（決定前）

### 背景

- たたき台提出: 現状は未決定ではなく型の無自覚共存。リード/FAQは時系列役割が違う。差別化の置き場は少数意見が対立

### 証拠

- 討議録: `UIUX_EXPERIENCE_LEAD_COPY_BOARD_DISCUSSION.md`
- 実地型: `/` 価値観 · `/invoice` 機能直答（What欠落）· `/timeline` シナリオ+FAQ · `/pdf-fill` 非代替宣言

### 判断（仮総意 · 未決議）

1. 第一軸は **複雑度（軽/重）**。完了系統は CTA 軸のまま（リードに1:1しない）
2. **What 全ツール必須**。単純ツールのリード全廃は採らない
3. リード=自己選別 Push / FAQ=境界 Pull。予防線1句はリード可、詳細はFAQ、長文重複禁止
4. How はリードに置かない
5. 一括 rewrite 禁止。契約に `lead_profile` を足すのは **決議後**

### 未決（決定票）

- L1–L6（討議録 §4）— 提督記入待ち

### 次アクション

- 提督が L1–L6 に Keep/Change/Defer
- 採択後のみ実装契約追記 · 重量スポット是正（例: invoice に What 1文）

---

## 2026-07-30 — リード文全製品適用（提督委任採択）

### 背景

- 仮総意を提督委任で採択し、全製品ツールへ `sg-tool-lead` を適用する指示

### 証拠

- 契約 §4.1 · `data/tool-lead-profiles.json`
- 実装: 欠落だった invoice/receipt/label/shift/report/reverse/warikan/diff/planning-poker 等を追加
- light 圧縮: normalize/test-data/time-calc/link-qr/budget-trim/sns/webp-to-jpg 等
- heavy 圧縮: clip-stash/slot-board/group-split
- Sync/Mention も What+Boundary を追加（mask/present/トップ/statements は対象外）

### 判断

1. L1–L6 を採択（複雑度第一軸 · What必須 · Why折衷 · How禁止）
2. サイト文法の予測可能性を優先し、文面の機械的同一化はしない
3. Hub カードは別レイヤのまま

### 未決

- スグダス誤訪問注意の露出（Defer）
- FAQ 断定度の横断監査（リードと矛盾がないかの二次パス）

### 次アクション

- 必要なら `verify` スクリプトで `sg-tool-lead` 欠落を機械ゲート化
- FAQ とリードの断定度揃えは別ウェーブ

---

## 2026-07-30 — 役員会未決バックログ（Experience）を固定 · #1 着手

### 背景

- リード文 L1–L6 · P0-1〜4 は採択・実装済み
- 残論点をログに残したうえで、優先 #1（帳票系黒CTA例外）から役員会討議へ入る指示

### 証拠

- Agenda §3 · 判断ログ初回未決 · SYNTHESIS 尖り① · 契約 §2「黒=小操作のみ · 例外表なし」
- 実測 `bg-slate-900` ボタン例: invoice（+行 · URLコピー）· stamp（請求書へ）· receipt（共有URL）· label（一括反映 · 履歴）· shift（+スタッフ）

### 役員会未決（優先順 · 2026-07-30 固定）

| 優先 | ID | 論点 | 昇格先候補 | 状態 |
|------|-----|------|------------|------|
| **1** | **E-BLACK** | 帳票系の黒CTAを例外として追認するか | DESIGN §3.2 · 契約 §2.1 | **Closed 2026-07-30**（小操作黒 · フル幅/handoff→青） |
| 2 | E-TOAST | コピー成功: Toast あり / Toastレス（ボタン上のみ） | DESIGN §3.8 · 契約 §2.2 | **Closed 2026-07-30（案 C+）** |
| 3 | E-FLASH | 成功フィードバックの緑: 文言+弱フラッシュのみか、一時緑を残すか | DESIGN · P2 | **Closed**（全面flash廃止 · ボタン印刷緑化廃止 · `--sg-copy-ok`） |
| 4 | E-L3 | ヘッダー印刷廃止 · Copy-First · ダイアログ受容 | DESIGN §3.2 · 契約 §2.0 | **Closed（配置）** · 色は E-L3-COLOR 延期 |
| 5 | E-SLA | 体感SLAを憲法級に上げるか | DESIGN §3.9 · 契約 §2.3 | **Closed 2026-07-30（H · 憲法に上げない）** |
| 6 | E-NAME | 「Copy-First」呼称 | ブランド · CASE | **Closed** — スローガン取り下げ · 意味維持 · 差別化新語は持ち越し · [`UIUX_EXPERIENCE_NAME_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_NAME_BOARD_DISCUSSION.md) |
| 7 | E-SUBARU | スグダス誤訪問注意の露出 | ブランドトーン | **Defer** |
| 8 | E-CONST | Experience 憲法条文化 | — | **Closed 2026-07-30（H · 新憲法なし · HOW維持）** |

### 議決不要（実装・運用）

- FAQ↔リード断定度の横断監査
- 完了系統ごとの P1 ウェーブ（世代差 · P8）
- `sg-tool-lead` 欠落の機械ゲート
- Zenn 等の `Copied!` 仕様残骸掃除

### 次アクション

- ~~E-BLACK 討議~~ → **Closed**（下記）

---

## 2026-07-30 — E-BLACK 採択（小操作黒 · フル幅/handoff→青）

### 背景

- 提督が仮総意をそのまま決定: 小操作黒は残す · フル幅／handoff 級は青へ · 契約に例外表 · 一括置換はしない

### 判断

1. 契約 §2.1 例外表を追加、「例外表なし」を廃止
2. DESIGN §3.2 を同期
3. 是正ウェーブ: stamp handoff · invoice 送付文面 · receipt 共有URL · label 一括/履歴 · updates メール送信 → L2 青
4. 残す: invoice +行 · shift +スタッフ · warikan +グループ

### 次アクション

- ~~E-TOAST / E-FLASH~~ → **Closed（案 C+）**（下記）

---

## 2026-07-30 — E-TOAST / E-FLASH 採択（案 C+）

### 背景

- Web慣行リサーチ（Primer / Stripe / nodejs.org 等）+ Copy-First 非妥協を入力に、提督が案 C+ を採択

### 判断

1. 操作点「コピーしました」（ボタン色据え置き）· Transform は近接ペイロード必須
2. 全面 flash 廃止 · ボタン印刷 emerald 一時化廃止 · グローバル成功 Toast 禁止 · 確認薄化禁止
3. アクセントは `--sg-copy-ok`（印刷と別トークン）
4. 共通層 `sg-copy-feedback.js` + CSS を先行反映（`triggerCopyFlash` は no-op 互換）

### 次アクション

- ~~E-L3 色票の前に~~ ヘッダー印刷廃止は部分採択（下記）

---

## 2026-07-30 — E-L3 部分採択（ヘッダー印刷廃止 · Copy-First 優先）

### 背景

- 提督: Output によっては DL 後に印刷する。印刷は shortcut。製品全体は Copy-First。印刷をヘッダーに置かないことは確定

### 判断

1. sticky ヘッダーに印刷ボタンを置かない（Lh · Lc 採択）
2. 印刷は紙経路の shortcut · chrome 級の主完了にしない
3. L3 色の集合（印刷のみ vs DL/ZIP 共有）はヘッダー廃止前提で**未決のまま**
4. DESIGN §3.2 の「ヘッダー印刷CTA」文言を文脈内へ先に改訂。shell 実装は別ウェーブ

### 次アクション

- ~~shell 実装~~ → 実施済（下記更新）
- 次議題 **E-NAME**（#6）· E-CONST（#8）· E-L3-COLOR（延期）· E-SUBARU（Defer）

---

## 2026-07-30 — E-SLA 採択（ハイブリッド · 憲法に上げない）

### 背景

- 提督が層の差を確認: 憲法＝何者か · SLA＝出来のよさ → FIX

### 判断

1. 案 **H**: 原則3行は契約 §2.3 · 目安表は DESIGN §3.9
2. 憲法級（案 C）不採択
3. 「サクサク」新規禁止 · 既存は段階置換
4. ms 未達は下手であり違憲ではない（Interpretation Guide §2.1）

### 次アクション

- 役員会 Experience 未決は概ね消化（E-SUBARU Defer · E-L3-COLOR · 差別化コピー持ち越しは残）

---

## 2026-07-30 — E-CONST 採択（体験を新憲法にしない · HOW 維持）

### 背景

- 憲法＝identity · Experience 成果の大半は quality/HOW（§2.1 · E-SLA 先例）
- 持ち帰り等の本意は既存 Brand/Case に既載

### 判断

1. 新「体験憲法」は作らない
2. Identity 正本 = Brand + Case + 存在様式
3. 実装契約 + DESIGN = HOW
4. レビュー呼称を Implementation Review へ
5. identity 穴は Case/Commentary（体験憲法へ追記しない）

### 次アクション

- E-SUBARU（Defer）· E-L3-COLOR · 差別化コピー持ち越しは必要時のみ

---

## 2026-07-30 — E-NAME 採択（Copy-First スローガン取り下げ · 新語持ち越し）

### 背景

- 呼称が clipboard / コピー主CTAに誤読される。意味（チャネル非接続）は維持したい
- CMO: 対外は用事・安心・非代理配送。「持って戻る」は本意に近いが時間的距離感あり → 新語は急がない

### 判断

1. 体験スローガンとしての Copy-First は **取り下げ**
2. 意味は維持（CASE-2026-007 · 手動持ち帰り）
3. 差別化の言葉は **持ち越し**（誤スローガン量産禁止）
4. 「あなたが持って戻る」は不採用寄り（距離感メモ）

### 次アクション

- statements 等の見出し寄せは低優先ウェーブ
- 差別化コピーは別セッション

---

## 2026-07-30 — E-L3 FIX 完了（ヘッダー印刷撤去 · 文脈内 CTA）

### 判断（確定）

1. sticky ヘッダー印刷禁止 · Copy-First 優先 · 印刷＝紙 shortcut · 印刷ダイアログ不可避は受容
2. shell 非表示 + invoice/shift/label/receipt/timeline 文脈内緑CTA · uragami ツールバー維持
3. Bake ZIP の L3 化は延期（契約 `bake_download` は暫定 L2）

### 次アクション

- ~~E-SLA~~ → **Closed**（上記）
- 呼び出し側の冗長 `triggerCopyFlash()` 行の任意掃除は低優先

