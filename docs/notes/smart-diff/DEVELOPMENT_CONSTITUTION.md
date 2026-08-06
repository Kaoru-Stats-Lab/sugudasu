# Smart Diff Development Constitution v1（開発プロセス）

**更新:** 2026-08-06  
**成熟度:** Review · **Identity は J-04 未決**（本ファイル名は仮の作業メモ）  
**Governance:** [`../ENGINEERING_GOVERNANCE.md`](../ENGINEERING_GOVERNANCE.md)（v0.9 Pilot · **議論凍結** · 卒業条件は **J-05**）  
**Manifest:** [`DESIGN_PACK_MANIFEST.md`](DESIGN_PACK_MANIFEST.md)（正本性は **J-01 未決**）  
**未決判断:** [`../../prompts/engineering-governance-open-judgments-COPYPASTE.md`](../../prompts/engineering-governance-open-judgments-COPYPASTE.md)  
**対象:** 既存「差分チェック」（`/diff`）強化。新規 URL は作らない想定。

> ガバナンス文書・義解は増やさない。Smart Diff 実装で制度を検証する。  
> 衝突の最終裁定は未決プロンプト（**J-01〜J-05**）。閉じるまで本ファイルは作業メモ扱い。

### 旧メモとの差分（参考 · 未決あり）

| 論点 | 扱い |
|------|------|
| Manifest 正本 vs 目次 | **J-01** |
| Product = 独立サービス / Board | EG Art.3 を採用（Gate と混同しない） |
| Checklist = 人間管理 · AI 非生成 | EG Art.5 を採用 |
| 法体系の適用範囲 | **J-03**（優先順位の勝負ではない） |
| 本文書の Identity | **J-04**（Product / Development / Architecture · Version 対象外） |
| Pilot 卒業条件 | **J-05** |
| 次成果物 | Identity 確定後の Constitution → Architecture Pack → Validation → 実装 |

Board 承認なしに本メモを全面書き換えない。Identity 決定（J-04）後に最小差分で揃える。

---

## Hypothesis（Product Validation 用 · Constitution 本文ではない）

感情・安心系は Product Constitution 本文に入れない。Pilot / Product Validation の仮説としてのみ扱う。

| Hypothesis | 扱い |
|------------|------|
| 安心できる / 自信を持って提出できる | 検証仮説。Success 指標にしない |
| 怒られたくない | 検証仮説。採否理由・JTBD 本文にしない |

正本の判定本文: [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md)（Persona → JTBD → Market → Constraints）。

---

## 目的

Smart Diff を単発開発ではなく、10 年以上保守可能なプロダクトとして育てるための設計・監査・実装プロセスを定義する。

---

## 基本思想

### 1. 設計と実装を分離する

設計レビューとコードレビューは別物である。

| ゲート | 見るもの |
|--------|----------|
| Architecture Validation | 設計品質 |
| Code Review | 実装品質 |

混在させない。

### 2. Product と Architecture を分離する

| Architecture Validation | Product Validation |
|-------------------------|-------------------|
| 責務分離 | MVP か |
| データフロー | Phase2 か |
| メモリ | Enterprise か |
| Security | Sync へ逃がすべきか |
| Interface | ROI はあるか |
| Export | JTBD に合っているか |
| Error | Browser を肥大化させていないか |
| Worker | |

> **技術的に正しい** と **作る価値がある** は別の質問。

### 3. Browser First は守るが Browser Dogma にはしない

Browser で十分なものは Browser。Browser では破綻するものは Sync。これを Constitution として固定する。

### 4. Sync は Browser の敗北ではない

Sync は Browser 版の制約を突破するための Enterprise Runtime。Browser を肥大化させないための逃げ道である。

### 5. 成熟モデルを採用する

設計書は最初から Official にしない。

```text
Draft → Review → Pilot → Stable → LTS
```

Architecture Validation 自体も同じ成熟モデルで育てる。

---

## Design Pack

監査対象となる設計書。最低限必要なのは:

- Constitution（本ファイル = Development Constitution）
- Architecture
- Interface Contract
- ADR
- UI Constitution
- Performance Budget
- Security Constitution

Manifest（[`DESIGN_PACK_MANIFEST.md`](DESIGN_PACK_MANIFEST.md)）は入口索引。**正本性は J-01 未決**（複写はしない）。  
README · roadmap · `.cursorrules` 等は Manifest / EG へのリンクのみ。義解・新 Governance は作らない。

---

## Validation Checklist

Architecture Validation が参照する静的チェックリスト。

Checklist は万能ではない。Checklist は「何を見るか」しか定義できない。「十分に設計されているか」は Checklist だけでは保証できない。

したがって Checklist は次の 3 つで育てる:

1. Validation Prompt
2. Architecture Review
3. 実案件レビュー

Checklist も Pilot → Stable → LTS で成熟する。

---

## Validation Gate

Product Validation は Architecture Validation の後工程ではない。**独立ゲート**である。

```text
             Product Validation
                    ↑
                    │
Constitution
        │
        ▼
Architecture Pack
        │
        ├──────────────┐
        ▼              │
Architecture Validation │
        │              │
        └──────┬───────┘
               ▼
         Cursor実装
               │
               ▼
         Code Review
               │
               ▼
    Performance Validation
               │
               ▼
            Release
```

Product Validation は Architecture を書く前でも、書いた後でも、新機能追加時でも、何度でも呼び出せる。

---

## Browser と Sync の境界

| Browser | Sync |
|---------|------|
| 通常 DOCX | 大容量 |
| 通常 PDF | Batch |
| Local Diff | Enterprise DMS |
| Local Export | Team Review |
| | 高度 OCR |
| | 重い AI |
| | 高度 Table 解析 |

Browser を守るために Sync が存在する。

---

## Cursor 投入条件

Cursor へ投入してよいのは、次が **Stable** になってから:

- Constitution（本 Development Constitution）
- Architecture
- ADR
- Interface Contract

Pilot 段階では実案件で検証する。

---

## 今回確定したこと / 凍結後に残すもの

- [x] Architecture Validation と Code Review は分離する
- [x] Product Validation を独立サービスにする（Gate と混同しない）
- [x] Browser と Sync の責務を固定する（製品境界）
- [x] Design Pack / Manifest を導入する（正本性は **J-01**）
- [x] Checklist は人間管理 · AI 非生成
- [x] ガバナンス議論凍結 · 義解新設禁止 · Smart Diff 実装で制度を検証
- [ ] Smart Diff Constitution（Identity = J-04）
- [ ] Architecture Pack v0.9
- [ ] Architecture Validation 1 回
- [ ] Pilot 卒業（J-05）

---

## 次のステップ（推奨順）

**ガバナンス議論は凍結。** 制度完成が目的ではない。

1. **J-01〜J-05** を Board で閉じる（矛盾だけ）  
2. **Smart Diff Constitution**（Identity = J-04 · Version 論争しない）  
3. **Architecture Pack v0.9**（Architecture / Interface / ADR · Intent 必須）  
4. Architecture Validation を 1 回通す → Critical 修正  
5. Cursor 実装開始  
6. 実装中の問題だけを判例として追加（J-02）  
7. **J-05 卒業条件** 達成後に初めて Governance v1.0  

旧「Phase 2 で Checklist を AI と育てる」は **撤回**（Checklist は人間管理）。

---

## 現時点の判断

機能議論・ガバナンス増設より、**Interface / Validation** が先の残り。  
SLIR 正本は [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md)。Matcher は [`../../architecture/adr/ADR-003-matcher-engine.md`](../../architecture/adr/ADR-003-matcher-engine.md)。Delta Tree は [`../../architecture/adr/ADR-004-delta-tree-model.md`](../../architecture/adr/ADR-004-delta-tree-model.md)。次は ADR-005 Renderer。Architecture Approved 前に実装しない（EG-ADR-001）。
