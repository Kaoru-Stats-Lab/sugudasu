# 実装パケット（GLM → Cursor）

**パケット ID:** `PKG-{REFタスクID}-{nn}`  
**対応 INV:** `docs/notes/...` または `INVARIANT_CHECKLIST` のパス  
**変更種別:** A / B / C / D / E / F（`MULTI_AI_CODER_PLAYBOOK.md` §5）

---

## 1. スコープ（厳守）

```text
変更してよいファイル:
  - C:\asl_dev\sugudasu\assets\test-data-engine.js

変更してはいけないもの:
  - 上記以外のすべてのファイル
  - 公開関数のシグネチャ変更
  - 依存パッケージの追加

1タスクの上限: 1ファイル · 約50行以内
```

---

## 2. 変更概要（1 段落）

{何を · なぜ · 挙動はどう保つか}

---

## 3. 変更詳細

### 3.1 変更 1 — `{関数名}`

**ファイル:** `assets/test-data-engine.js`

**変更前（関数全文）:**

```javascript
// ここに現行 main の全文を貼る（行番号不可のみ禁止）
```

**変更後（関数全文）:**

```javascript
// 完成形の全文
```

**呼び出し元（影響調査）:**

| 呼び出し元 | 影響 |
|------------|------|
| `generateDataset` | なし |
| `scripts/test-data-engine.test.mjs` | なし |

---

## 4. 実行後ゲート（Cursor がそのまま実行）

```bash
cd C:\asl_dev\sugudasu
npm run test:test-data
```

期待: **exit 0** · 既存アサーションすべて pass

該当する場合のみ追加:

```bash
npm run validate:tool-naming
npm run build:pages
```

---

## 5. 禁止事項

- リネーム · 共通化 · フォーマット全体 · コメント大量追加
- 設計図にない `export` の追加・削除
- テスト期待値の変更（INV 更新が先）

---

## 6. パッチ不整合時

**即 BLOCKED。** 推測で実装しない。`MULTI_AI_CODER_PLAYBOOK.md` §6.2 の形式で報告。
