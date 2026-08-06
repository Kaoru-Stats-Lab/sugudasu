# Smart Diff — Core packages (Wave 0–5 · MVP Freeze)

```text
DOCX/PDF → Raw → Normalizer → SLIR → Matcher → Delta → Projection → UI / Export
```

| Package | Role |
|---------|------|
| `export/` | Projection → DiffReport → pdf-lib PDF（全変更 · Filter 無視） |

## Verify

```bash
npm run test:smart-diff-wave1
npm run test:smart-diff-wave2
npm run test:smart-diff-wave2.5
npm run test:smart-diff-wave3
npm run test:smart-diff-wave4
npm run test:smart-diff-wave5
```

## Next

実務ユーザーテスト（3分確認）· Phase2 は Freeze 外
