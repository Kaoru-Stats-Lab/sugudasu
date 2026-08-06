# SUGUDASU 変更確認 — Product Naming（SSOT）

| 項目 | 値 |
|------|-----|
| **Date** | 2026-08-06 |
| **Architect** | 命名採用 · デプロイ可 |

## 固定

```yaml
name: 変更確認
product_name: SUGUDASU 変更確認（Smart Diff）
concept_name: 変更確認
nav_label: 変更確認
id: smart-diff
url: /smart-diff
english_name: Smart Diff
description: 文書の変更箇所を確認し、承認判断を助けるツール
```

## 表記

| 推奨 | 非推奨 |
|------|--------|
| **SUGUDASU 変更確認（Smart Diff）** | SUGUDASU Smart Diff（変更確認） |

日本語タイトルが主。Smart Diff は技術・補助名称。

## 価値との一致

差分ツールではなく、**変更確認を安心して終えるためのツール**。  
Validation 問い: 承認者は差分一覧で全文確認から解放され承認判断できるか。

## 隣接ツール

| id | 役割 |
|----|------|
| `smart-diff` | 文書変更確認 · 承認支援 |
| `diff` | 貼り付けテキストの差分チェック |
