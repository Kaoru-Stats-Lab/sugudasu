# SUGUDASU — おっちょこちょい事故・UXガードレール SSOT

**更新**: 2026-06-19  
**起源**: Gemini 調査（事例カタログ A01–E02 + 追加深掘り10件）  
**方針**: 高リテラシーほどノールックでコピーする → **中身を読まなくても構造破壊・変質に気づけるUI**

> ツール個別の実装詳細は各 SSOT へ。本ファイルは **横断Must/Should** と **事例ID→対策** の索引。

---

## 1. 三大事故タイプ（エグゼクティブ）

| # | タイプ | 典型 | 代表事例ID |
|---|--------|------|------------|
| ① | **行・行対応のズレ** | 空行削除 · セル内改行分裂 · 分割貼付漏れ | A01, A02, C03, D01 |
| ② | **意図しないデータ変質** | NFKC · 長音→ハイフン · 先頭ゼロ · 姓名スペース | B01–B04 |
| ③ | **クリップボード先祖返り** | 変換前をコピー · Clibor履歴 · 変換クリック忘れ | C01, C02 |

**UI Top3（全ツール共通の思想）**

1. **入力 N 行 → 出力 M 行** — 不一致は赤 · コピーゲート
2. **限定差分ハイライト** — 先頭5行 + 危険パターン（先頭ゼロ・化け文字）
3. **コピー成功の明示** — 緑フラッシュ · Copied! · 数秒ロック · 先頭プレビュー1行

---

## 2. 実装フェーズ（提督承認用）

### Phase A — normalize v1 と共有ユーティリティ（**今すぐ OK**）

コスト低 · 効果大 · T03未実装なので最初から入れる。

| ID | 対策 | モジュール案 |
|----|------|-------------|
| §2-3 | 行数一致 · 不一致コピーゲート | `text-normalize.js` + UI |
| C01 | **コピー押下時に最新変換を実行してから clipboard**（変換ボタン単独コピー禁止） | normalize UI |
| C02 | コピー成功: 緑フラッシュ + `Copied!` + 2s ロック | `assets/sg-copy-feedback.js`（共有） |
| B04 | 処理は **常に string** · `parseInt` / `Number()` 禁止 | `text-normalize.js` |
| B01 | NFKC **全体適用禁止** · 英数帯のみ | `text-normalize.js` |
| B02 | ハイフン統一: **直前がカタカナの `ー` は除外** | `text-normalize.js` |
| B03 | `csv_roster`: trim は行頭行末のみ · 行内スペース維持 | `text-normalize.js` |
| A01 | 貼付時: 行内 `\n` が「列1セル相当」か警告（タブなし複数行） | paste hook |
| E02 | 貼付時: `�` `?`（連続）等の **置換文字スキャン** → 上部固定警告 | `sg-paste-scan.js` |
| — | コピー完了文に **フィルター/非表示行リマインド** 1行 | 全ツール共通フッター |

**競合UXで避ける:** 変換と同時の **自動クリップボード上書き**（確認チャンスを奪う）

### Phase B — normalize v1.1 / fair-draw 追補（**次のスプリント**）

| ID | 対策 | ツール |
|----|------|--------|
| A03 | 先頭行が典型ヘッダー語 → 警告（変換対象外オプション v2） | normalize · label |
| E01 | 制御文字・サロゲート異常 → 行番号付き上部警告 | normalize |
| D01 | 名簿 **行数巨大バッジ** + 「Excel最終行と一致？」 | fair-draw |
| D03 | テスト/本番 **ヘッダ色**（黄/青） | fair-draw |
| D02 | 重複除去 = **全列一致のみ**（T06 まで） | CSV · fair-draw前段 |

### Phase C — 既存ツール監査（**個別チケット**）

| ツール | Must（調査より） | 状態 |
|--------|------------------|------|
| `warikan.html` | 端数過不足の巨大表示 | **v1.1 実装済** |
| `label.html` | 姓名間スペース保護 · ヘッダー除外 | **v1.1 実装済** |
| T06 CSV | 全列一致重複除去デフォルト | 未実装 |

### Phase OUT（v1 スコープ外）

- クリップボード履歴ソフト連携
- 500行全文 diff
- AI階層推測（Slack議事録 E03 系）
- インボイス0円明細（請求ツール未計画）

---

## 3. 事例カタログ索引

| ID | 要約 | Phase | 正本ツールSSOT |
|----|------|-------|----------------|
| A01 | セル内改行で行分裂 | A | `NORMALIZE_TEXT_TOOL_SPEC.md` §4-5 |
| A02 | 空行削除で貼戻しズレ | A | normalize §2-3 |
| A03 | ヘッダー行をデータ処理 | B | label |
| B01 | NFKCで丸数字→数字 | A | normalize §4-1 |
| B02 | 長音→ハイフン | A | normalize §4-3 |
| B03 | 姓名スペースtrim | A | normalize §4-2 |
| B04 | 先頭ゼロ消失 | A | normalize §4-4 |
| C01 | 変換前をコピー | A | normalize §5 |
| C02 | Clibor先祖返り | A | 共有 copy feedback |
| C03 | 分割処理で漏れ | A | 500行cap既存 |
| D01 | 抽選名簿1行漏れ | B | `LOTTERY_PRIZE_LAW_TOOL_SPEC.md` |
| D02 | 同姓同名重複削除 | B | T06 |
| D03 | テスト結果を本番共有 | B | fair-draw |
| E01 | 下部文字化け未確認 | B | normalize |
| E02 | Mac↔Win 化け | A | paste scan |

---

## 4. FAQ（うっかり防止 · 全ツール共通候補）

normalize SSOT §9 に Q1–Q6 を実装。残りは fair-draw / hub FAQ へ分散可。

| Q | テーマ |
|---|--------|
| Q1 | Excel貼戻しで行ズレ（セル内改行） |
| Q2 | 長音がハイフンに |
| Q3 | 先頭ゼロ |
| Q4 | 下部の文字化け不安 |
| Q5 | 行数1行ズレ（ヘッダー含む？） |
| Q6 | 変換前データをコピーした |
| Q7 | 同姓同名と重複除去 |
| Q8 | Mac→Win 化け |
| Q9 | 抽選テストと本番 |
| Q10 | データ送信なし |

---

## 5. 共有実装メモ

### `sg-copy-feedback.js`（§3.8 全ツール共通 SSOT）

```text
copyWithFeedback(text, buttonEl, { toastEl, lineCount, previewLine, toastPrefix })
  → navigator.clipboard.writeText
  → document.body classList.add('sg-copy-flash') // 320ms
  → button: Copied! disabled 2s
  → toast: 「クリップボード更新 · 〇行 · 先頭: …」

copyLatestTransform({ computeOutput, buttonEl, gate }) // 変換系: コピー直前に再計算
updateLineMatchDisplay / syncCopyGate // 入力 N 行 → 出力 M 行（normalize）
```

**適用済み:** normalize · report · reverse · warikan · fair-draw · invoice · receipt · updates · sns

### `sg-paste-scan.js`（新規 · Phase A）

```text
scanPasteWarnings(text) → { replacementChars[], suspiciousLines[] }
  U+FFFD, 連続 ?, 私用領域外の孤立サロゲート 等（v1は保守的リスト）
```

### 貼付リマインド（全ツール · コピー成功時1行）

> ⚠ スプシ/Excelで **フィルター・非表示行** があると、貼り付け時に行が詰まってズレます。解除してから貼ってください。

---

## 6. 意思決定ログ

| 日付 | 決定 |
|------|------|
| 2026-06-19 | Gemini調査を SSOT化 · Phase A/B/C 分割 |
| 2026-06-19 | **§3.8 コピー契約を DESIGN_GUIDELINE に昇格** · 全コピーUIツールへ横展開 |
| 2026-06-19 | 既存設計（500行·空行保持·行数チェック）**全面肯定** |

---

*End of SSOT*
