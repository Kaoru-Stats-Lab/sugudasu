# Smart Diff — Wave 6.3 Focus & Decision Prep

| 項目 | 値 |
|------|-----|
| **Status** | Active — Persona Session（実施可 · **実装タスクなし**） |
| **Date** | 2026-08-06 |
| **Phase** | 技術検証ではなく **信頼できる承認支援ツールか** の検証 |
| **Protocol** | [`SESSION_PROTOCOL.md`](SESSION_PROTOCOL.md) |
| **Assignment** | [`SESSION_ASSIGNMENT.md`](SESSION_ASSIGNMENT.md) |
| **実装** | **変更禁止継続**（Redline / Cell Diff / AI は **6.4 後**） |

> **Validation 目的（確定 · 1問）:**  
> 承認者は、差分一覧を見ることで全文確認から解放され、承認判断できるか。  
> MVP 評価軸: 「読む量を減らし、承認判断を可能にするツール」になっているか。  
> **MVP 判断は Trust 層を中心に行う**（Detection / Presentation と混ぜない）。  
> **今やることは唯一: 実際の承認行動を観測すること。** 追加設計・実装不要。  
> **次成果物:** 実施ログ + [`SESSION_RESULTS_ROLLUP.md`](SESSION_RESULTS_ROLLUP.md) 実データ。

| 層 | 今回見るもの | 見ないもの |
|----|--------------|------------|
| Detection | 変更を拾えているか | アルゴリズム改善案 |
| Presentation | 差分が理解できるか | UI 追加要望 |
| **Trust** | **承認判断できるか** | 高度機能要求 |

```text
Architecture Freeze → Implementation Freeze → Validation Freeze
  → Persona Session ▶ → GO / STOP / Re-scope
```

---

## アーキテクチャ状態（設計リスク大なし · 確認）

パイプライン（成立済み）:

```text
DOCX / PDF → Parser → Raw → Normalizer → SLIR
  → Matcher → Delta → Projection → Change Navigator
  → Review View → Diff Report Export
```

| Layer | 状態 | 判断 |
|-------|------|------|
| Parser … Export（上図） | 境界成立 | OK |
| Validation | **差分精度 → 承認信頼** へ移行 | OK |

### 凍結（Wave 6.3 中 · 変更禁止）

| 領域 | 状態 | 判断 |
|------|------|------|
| SLIR | Freeze | 変更禁止 |
| Stable ID | Freeze | Matcher 責務 |
| Delta Tree | Freeze | UI 都合で変更禁止 |
| Table Atomic | Freeze | Cell Diff 要求は Phase2 |
| Candidate | Freeze | ChangeKind へ昇格禁止 |
| Loss Report | Freeze | PDF 万能化禁止 |
| Renderer | Freeze | 見た目改善は 6.4 結果後 |

Freeze 正本: [`../ARCHITECTURE_FREEZE.md`](../ARCHITECTURE_FREEZE.md)。  
**ここで実装追加へ戻ると判断を誤る。** 価値検証対象は差分精度ではなく **承認信頼**。

---

## 0. 開始前ロック（Architect · 確認済）

設計コンフリクトではなく、**Validation 精度**のための確認。

| 論点 | 判断 | 理由 |
|------|------|------|
| Freeze 維持 · Ledger 非公開 · ログ粒度 | ✅ | 検証対象を動かさない · 答え合わせにしない · 認知負荷のみ |
| 成功指標＝判断成功 | ✅ | 価値は Diff 表示ではなく承認判断コスト削減。クリック数は二次 |
| Participant 説明＝承認判断 | ✅ | 「探す」は探索タスク。「承認してよいか」は実務タスク |
| STOP 先行判定 | ✅ | **見逃しリスクが最大の失敗。** 便利さより信頼性を優先 |

### 失敗パターン（STOP が先である理由）

```text
差分検出できなかった
  ↓
ユーザーが安心して承認
  ↓
重要変更を見落とす
```

Validation では「便利だったか」より **「この結果を信じて承認できるか」** を測る。

---

## 1. 成功条件 = 判断成功 · Primary は「戻らない」

「速い」ではなく **「戻らない」** を見る。

見るべき失敗（速度問題ではない · **Trust Failure**）:

```text
Smart Diff を見る
  ↓
「あれ、本当に全部出てる？」
  ↓
結局元文書を最初から読む
```

### 行動コード（結果記録で必ず分ける）

| 行動 | 解釈 |
|------|------|
| 差分一覧 → 該当箇所確認 → 承認 | **成功** |
| 差分一覧 → 念のため全文確認 | **STOP 候補**（Trust） |
| 差分一覧 → 理解不能 → 全文確認 | **STOP**（Presentation → Trust） |
| 差分一覧 → 安心して承認 | **GO** 寄与 |

| 指標 | 判定 |
|------|------|
| First Change Discovery Time | 主要 |
| Miss Count | **最重要** |
| False Alarm | 重要 |
| 「全文を読んだ」 · 全文へ戻る · 「念のため全部」 | **赤信号 / Trust** |
| 操作迷子 | UI改善候補（主軸外） |

**ノイズ:** クリック数 · スクロール · 滞在ヒートマップ · マウス · 座標 · 詳細操作イベント。

---

## 2. Participant 説明文（固定）

**開始はこれだけ:**

> この文書変更を承認してよいか判断してください。

| 避ける（探索タスク化） | 理由 |
|------------------------|------|
| 「変更箇所を探してください」 | 検索性能評価になる |
| 「差分を確認してください」 | 承認支援から逸脱 |
| 「Smart Diff を使ってください」 | ツール使用を強制し観測を歪める |

正本・Fixture 別役割文: [`SESSION_PROTOCOL.md`](SESSION_PROTOCOL.md) §2。

---

## 2b. Evaluator が見る順序（崩さない）

### ① 最終判断（まず結果）

```text
承認 / 保留 / 不承認
```

### ② Trust（最重要）

```text
Smart Diff だけで判断できたか → YES / NO
```

NO のとき必ず残す: 何が不安だったか · 何を確認しに戻ったか · 戻ったことで判断できたか。

### ③ 全文復帰（MVP 判定ポイント）

見るのは「全文を見たか」ではない。

> **全文に戻らないと判断できなかったか**

「全文に戻った」＝ Trust Failure 候補（人格・職種で補正しない）。

---

## 3. 実施中の観測（技術指標ではない）

見ない: 差分検出率だけ · クリック数 · 操作時間だけ · UI 好感度。

| 観測 | 判定 |
|------|------|
| 差分一覧だけで承認判断できたか | **最重要** |
| 全文確認へ戻ったか | STOP 候補 |
| 「見逃していないか不安」が出たか | Trust 失敗 |
| Candidate 説明を理解できたか | Scope / UX 判断 |
| PDF Loss 説明を受容できたか | PDF 適用範囲判断 |

---

## 3c. 記録時の注意（Evaluator · 追加仕様ではない）

### Participant の沈黙も記録対象

例: 差分一覧を見る → 少し迷う → **何も言わず全文へ移動**

発言がなくても行動結果は:

```text
一覧だけでは判断できなかった
```

沈黙＝データなし、にしない。

### 「確認した」と「不安で確認した」を分ける

全文へ戻った場合、同じ「全文を見る」でも意味が違う:

| 行動 | 分類 |
|------|------|
| 変更内容を理解するため **一部参照** | **正常確認** |
| 本当に全部合っているか不安で **全文確認** | **Trust Failure 候補** |

記録欄で `正常確認` / `Trust Failure 候補` を必ず分ける。

### Candidate / Loss の扱い

**失敗にしない:** Candidate があること自体 · PDF Loss があること自体。

**見る:** ユーザーがその境界を理解して判断できたか。

| 例 | 扱い |
|----|------|
| 「PDF なのでこの部分は確認対象外だと理解した」 | **成功** |
| 「何か欠けていそうで怖い」 | **失敗**（Trust / Scope） |

### Participant の発言を解釈しない

例: 「念のため全部見ます」

| しない | する |
|--------|------|
| 「慎重な人だから」と補正 | 記録上 **`Trust Failure 候補`** |
| 「普段の習慣」「法務だから仕方ない」 | 理由分析は **6.4** まで持ち越す |

セッション中に人格・職種で正当化しない。

### 「欲しい機能」は Feature Request へ隔離

例: 表セル差分 · 色変更をもっと · Word みたいに · AI で要約  

→ すべて一旦 **`Feature Request`**。**MVP 失敗と直結させない。**  
（理解不能で全文へ戻った場合だけ失敗側 · 「細かくしたい」は wish）

### 成功コメントも失敗コメントも同じ重み

| 例 | 扱い |
|----|------|
| 「ここだけ見ればよいと思った」 | 成功 · Trust 形成 |
| 「一応全部読んだ」 | **Trust 形成失敗**（操作ミスではない） |

### 最重要観測は1行（MVP 核心データ）

| 項目 | 記録 |
|------|------|
| **最終判断** | 承認 / 保留 / 不承認 |
| **全文へ戻ったか** | Yes / No |
| **戻った理由** | |
| **Smart Diff だけで判断できたか** | Yes / No |

速さより先にこの4つを読む。記録順は §2b（①判断 → ②Trust → ③全文復帰）。

---

## 3d. Wave 6.4 · 最初に見る集計 → ケース → 禁止分析

### 最初にここだけ確認（時間短縮はその後）

| 指標 | 目的 |
|------|------|
| Smart Diff だけで承認可能だった人数 | MVP 価値 |
| 全文復帰人数 | Trust Failure 検出 |
| 戻った理由（正常確認 vs 不安全文） | 改善方向判断 |
| Miss | 安全性確認 |

### ケース

| ケース | パターン | 判断 |
|--------|----------|------|
| **A** | 時間短縮 + 全文復帰なし + 承認可能 | **GO 候補** |
| **B** | 時間短縮 + 最後に全文確認 | **注意** · 便利だが承認保証になっていない可能性（STOP/Re-scope 寄り） |
| **C** | 表セルが欲しい · PDFもっと正確に · AI要約 | **直ちに STOP ではない** · **`Scope Gap`** / Feature Request |

### 見る順（固定）

```text
1. Trust Failure の有無
2. Miss Count
3. False Alarm
4. Time Shortening
5. Feature Request / Scope Gap
```

### やらない分析（禁止）

| 分析 | 理由 |
|------|------|
| もっと精度を上げれば解決する | Trust → Detection 誤変換 |
| AI 追加すれば安心する | 信頼形成とは別問題 |
| Cell Diff を作れば解決する | 表対応範囲の問題 |
| 操作時間だけ比較する | 判断品質を見失う |

---

## 3b. 6.3 終了後の判断分岐（6.4）

### GO（MVP 成立）

* 全文確認に戻らなくても承認できた  
* 重要変更を見逃していない  
* 差分一覧への信頼が形成された  

→ 次: リリース準備 · 対象文書拡大 · SEO/導線（**まだ Phase2 実装ではない**）

### STOP（失敗寄り）

典型: **「便利だけど最後に全文を見る」**

価値は「差分を表示すること」ではなく **全文確認という心理的負担を消すこと**。  
便利さがあっても全文に戻るなら STOP 寄り。

### Re-scope（即 Detection/AI/Cell に行かない）

| 問題 | 対応 |
|------|------|
| 表が怖い | 表対応範囲を明示 |
| PDF が怖い | PDF 対象限定 |
| Candidate が怖い | 表現改善 |
| 差分一覧が多い | Navigator 改善 |

**禁止の即座ジャンプ:** 「もっと高精度に」「AI で判断」「セル差分を作ろう」  
→ Trust 問題を Detection 問題へ **誤変換**しやすい。Phase2 候補整理は判定後。

---

## 4. Architect 確認ポイント（Session 別 · 成功条件を混ぜない）

| Scenario | 見るもの | 見ないもの |
|----------|----------|------------|
| **V-A** 契約書 | 条番号単位の判断（あり/なし → 承認） | Parser 精度 · 変更件数ゲーム |
| **V-B** 規程 | style 変更の意味理解 | Cell Diff |
| **V-C** PDF | **限界説明への信頼**（境界評価） | 完全抽出 · 「PDFでも万能」 |

### S1 · V-A（契約書）

**見ない:** 「10個見つけたか」。  
**見る:** 条番号を追いながら変更あり/なしを判断できたか → 一覧 → 第○条 → 内容 → 承認。

| STOP（S1） | |
|------------|--|
| 一覧後も全文を最初から読む | STOP 候補 |
| 「念のため全部確認します」 | STOP 候補 |
| Modified の意味が理解できない | Presentation / Trust |

### S2 · V-B（就業規則）

`style_only` = ChangeKind **Modified** + `changeDetail: style_only`。  
確認: 「太字になった」≠「重要な規則変更」として誤認しないか。表は Atomic（セル Diff 評価しない）。

| STOP（S2） | |
|------------|--|
| style のため全文へ戻る | STOP 候補 |
| 太字だけを重要変更として扱う | Trust / Presentation |
| 表 Atomic で不安 | Presentation（メモ · Cell Diff 要望は **Scope**） |

### S3 · V-C（建設 PDF）— 境界評価

期待を作ると失敗: 「PDF なのに全部比較できます」。

**成功:** 「この PDF はここまで比較できる。ここは注意が必要。」と承認者が理解できること。  
（Loss を見た上で、この範囲なら承認判断できる）

| STOP（S3） | |
|------------|--|
| 比較結果を信用できない | Trust · Scope 再検討 |
| 「結局 PDF は全部見る」 | STOP 候補 |
| Loss 表示が不安を増やす | PDF Scope / UX |

### Candidate 観察（必須 · UX 判断）

技術: `Candidate ≠ Modified`（正しい）。利用者心理では危険。

| 強調しすぎ | 弱めすぎ |
|------------|----------|
| 不安が増える | 見逃す |

**観察質問（B 直後）:**

> 「候補」と表示された変更は、確認対象として十分理解できましたか？

バランスは技術ではなく UX。メモ → 6.4。実装はその場で触らない。

---

## 5. 6.4 判定軸（4軸 · 混ぜない）

```text
Detection   → 変更箇所を見つけられるか
Presentation → 何が変わったか理解できるか
Trust       → 全文確認なしで承認できるか  ← 最重要
Scope       → できないことを許容できるか
```

| 分類 | 意味 | 例 |
|------|------|-----|
| **Detection Failure** | 差分を出せなかった | 一覧に出てこない |
| **Presentation Failure** | 差分はあるが理解できない | Modified / Candidate の意味不明 |
| **Trust Failure** | 理解できるが信用できない | 「念のため全文」· 速いのに戻る |
| **Scope Failure** | そもそも対象外だった | 「表セル差分が欲しい」＝**Scope 不足**（Detection 不足ではない） |

「表セルが欲しい」を Detection Failure と混ぜない。Phase2（Cell Diff / Redline / AI）は **6.4 の結果を見てから**。

集約: [`SESSION_RESULTS_ROLLUP.md`](SESSION_RESULTS_ROLLUP.md)。

---

## 操作ログの粒度

必須: 開始 · 最初の発見 · 完了 · Miss · 誤認 · 全文へ戻ったか · コメント ·（任意）失敗分類タグ。  
不要: 座標 · 操作テレメトリ · 滞在ヒートマップ。

---

## 検証しているもの

```text
Architecture Freeze
  → 6.1 Golden → 6.2 Protocol → 6.3 Persona Session → 6.4 Analysis
  → GO / STOP / Re-scope
```

```text
SLIR → Matcher → Delta → Projection → 人間判断
```

ここで Redline · Cell Diff · AI 補助などの **実装追加に行かない**（追加 ADR / CREATE-TASK も不要）。

```text
Wave 6.3 Persona Session
  → SESSION_RESULTS_ROLLUP 実データ記入
  → Wave 6.4 Analysis
  → GO / STOP / Re-scope
  → Phase2 候補整理（判定後のみ）
```

**次に作る成果物はコードではない。SESSION_RESULTS_ROLLUP の実データ。**

---

## 実施チェック（セッション当日）

- [ ] 凍結表（SLIR … Renderer）を触らない宣言を共有した  
- [ ] 「速い」ではなく「戻らない」· 行動コードを共有した  
- [ ] V-A / V-B / V-C の成功条件を混ぜないことを確認した  
- [ ] Candidate 観察質問を Interview に入れた  
- [ ] Participant View に Ledger / Manifest が混入していない  
- [ ] Log · Rollup 担当が決まっている · 機能追加しない  
