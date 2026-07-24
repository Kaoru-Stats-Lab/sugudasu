# SUGUDASU Legal System

**更新:** 2026-07-24  
**役割:** ブランド憲法を頻繁に改正せず、**義解 · 判例 · 解釈手順**で運用する法体系の入口

## 法体系

```
Brand Constitution          … 最高規範（WHAT）
        ↓
Constitution Commentary     … 公式逐条解説 · 立法意思（Intent）
        ↓
Case Law                    … 判例（Judicial Decision）
        ↓
ADR                         … 設計選択のみ（HOW · Architecture Decision）
        ↓
Product Specification       … 製品仕様
        ↓
Implementation              … 実装
```

| 文書 | 役割 |
|------|------|
| [`CONSTITUTION_COMMENTARY.md`](./CONSTITUTION_COMMENTARY.md) | 公式義解 · 条文ごとの趣旨 · 保護法益 · 許容/禁止例 |
| [`PERSONA_CONSTITUTION_TRAITS.md`](./PERSONA_CONSTITUTION_TRAITS.md) | Persona 振る舞い規範（PCT）· **PCT-6 任意性** |
| [`CASE_LAW.md`](./CASE_LAW.md) | 判例集 · 憲法判断はここに蓄積 |
| [`LEGAL_INTERPRETATION_GUIDE.md`](./LEGAL_INTERPRETATION_GUIDE.md) | 解釈手順 · Guard Rails · ADR との境界 |
| [`logs/`](./logs/) | 解釈変更 · 追加判例のレビューログ |

## 憲法本文（変更しない場所）

- [`../brand/BRAND_CONSTITUTION.md`](../brand/BRAND_CONSTITUTION.md)
- [`../brand/ANTI_PRINCIPLES.md`](../brand/ANTI_PRINCIPLES.md)
- [`../product/PRODUCT_CONSTITUTION.md`](../product/PRODUCT_CONSTITUTION.md)

## 旧義解

[`../brand/CONSTITUTIONAL_INTERPRETATION.md`](../brand/CONSTITUTIONAL_INTERPRETATION.md) は **本ディレクトリへ移管済みのポインタ**。逐条の正本は `CONSTITUTION_COMMENTARY.md`。

## Agent Guard Rails（要約）

条文だけを読んで仕様を変更してはならない。必ず Commentary → Case Law → Product Constitution を確認する。判例矛盾 · 義解反解釈は禁止。憲法改正は最後の手段。
