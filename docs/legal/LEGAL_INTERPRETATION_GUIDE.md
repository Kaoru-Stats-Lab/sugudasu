# SUGUDASU Legal Interpretation Guide（憲法解釈手順）

**役割:** 合憲性・仕様判断の **手順** と Guard Rails を定義する  
**更新:** 2026-07-24  
**義解:** [`CONSTITUTION_COMMENTARY.md`](./CONSTITUTION_COMMENTARY.md)  
**判例:** [`CASE_LAW.md`](./CASE_LAW.md)

---

## 1. 判断順序（必須）

仕様変更 · 新機能 · コピー · Hub UI · データ取得は、必ず次の順で判断する。

```
WHY
  ↓
Persona
  ↓
Anti Principles
  ↓
Brand Constitution（条文）
  ↓
Constitution Commentary（義解）
  ↓
Case Law（判例）
  ↓
Product Constitution（F1〜F7 · 採用判定）
  ↓
ADR（設計選択 · HOW のみ）
  ↓
Product Specification
  ↓
Implementation
```

### 禁止

- **F1〜F7 だけで合憲性を判断する**
- **条文の字面だけ読んで仕様を変える**
- **判例に矛盾する提案**
- **Commentary に反する解釈**
- **憲法本文の勝手な改正**（改正は最後の手段 · 立法者判断）

---

## 2. 各層の問い

| 層 | 問うこと |
|----|----------|
| WHY | 前工程か。仕事の本体（判断·創造·評価）に踏み込まないか |
| Persona | 隣の同僚として、邪魔·聴取·自己改善介入をしていないか |
| Anti | Reject 基準に触れていないか |
| Constitution | 条文 WHAT に反していないか |
| Commentary | 立法意思 · 保護法益に沿っているか（コピーの字面ではない） |
| Case Law | 既存判例と矛盾しないか。無いなら判例候補か |
| Product Constitution | F1〜F7 · Sync 分岐 |
| ADR | **設計の選択肢**のみ（憲法判決を ADR に書かない） |
| Spec / Impl | 正本どおりか |

---

## 3. ADR と Case Law の境界

| | Case Law（Judicial Decision） | ADR（Architecture Decision） |
|--|------------------------------|------------------------------|
| 書くこと | 合憲 / 違憲 / 条件付き · 保護法益 · 今後への影響 | 実装の選択肢 · 技術トレードオフ |
| 書かないこと | ライブラリ選定の詳細 | 「憲法上 OK」の宣言だけで終わること |
| 例 | テキスト注釈 Reject · F2 の真意 · アンケート条件 | IndexedDB vs localStorage · バンドル分割 |

**憲法判断は ADR へ書かない。Case Law へ移す。**  
製品 `decisions.md` に憲法判決がある場合は、Case Law へ要約し、製品側は Case ID をリンクする。

---

## 4. Agent / Cursor Guard Rails

今後、Agent は次を守る。

1. 条文だけを読んで仕様を変更してはならない。
2. 必ず確認する:
   - ① [`CONSTITUTION_COMMENTARY.md`](./CONSTITUTION_COMMENTARY.md)
   - ② [`CASE_LAW.md`](./CASE_LAW.md)
   - ③ [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)
3. Case Law に矛盾する提案は **禁止**。
4. Commentary に反する解釈は **禁止**。
5. 判例が存在しない場合のみ、「新しい判例候補」として [`logs/`](./logs/) に記録する。
6. 勝手に憲法を書き換えない。憲法改正は最後の手段である。

---

## 5. 新しい判例候補の出し方

```markdown
## 判例候補（未採択）

**日付:**  
**争点:**  
**仮の適用条文:**  
**仮の判決案:**  
**立法事実:**  
**既存判例との関係:** （矛盾 / 空白 / 拡張）
```

採択されたら `CASE_LAW.md` に正式番号を付し、同日の `logs/YYYY-MM-DD_constitution_review.md` に残す。

---

## 6. 憲法改正が許される場合（最後の手段）

次のすべてを満たすときのみ、憲法本文の変更を検討する。

1. Commentary の追記では立法意思を表現できない
2. 複数判例が矛盾し、上位規範の修正が不可避
3. 立法者（プロジェクトオーナー）が明示的に改正を指示
4. `logs/` に改正理由 · 影響範囲を記録

通常は **Commentary 追記** または **新判例** で足りる。

---

## 7. 関連入口

| 文書 | 用途 |
|------|------|
| [`README.md`](./README.md) | 法体系の入口 |
| [`../brand/BRAND_CONSTITUTION.md`](../brand/BRAND_CONSTITUTION.md) | 憲法本文 |
| [`../brand/CONSTITUTIONAL_INTERPRETATION.md`](../brand/CONSTITUTIONAL_INTERPRETATION.md) | 旧義解ポインタ → Commentary |
| [`.cursorrules`](../../.cursorrules) | Agent SSOT 表 |
