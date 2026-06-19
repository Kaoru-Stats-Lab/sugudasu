# press/ — PR・メディア用素材（本番ビルド対象外）

**用途:** PR TIMES アイキャッチ · 記者配布 · ローカル入稿  
**配置:** `press/assets/`  
**本番:** `build-pages.mjs` は **コピーしない**（`sugudasu.com/data/` に載らない）

## ファイル

| ファイル | 用途 |
|----------|------|
| `logo-sugudasu.png` | ロゴ（高解像度 · PR TIMES ①） |
| `logo-type-sugudasu.png` | ロゴタイプ（横組み等） |
| `invoice-sugudasu01.png` | 請求書ツール画面スクショ ① |
| `invoice-sugudasu02.png` | 請求書ツール画面スクショ ② |
| `x-pin-hub-v2.png` | **X 固定ピン用**（1200×675 · §8 オーダー · 未作成可） |

サイト用の軽量ロゴは `assets/logo-mark.png` · `assets/sugudasu-logo.png` を正とする。  
ファビコンは `assets/favicon-master-384.png`（タブ16/32）· `favicon-master-416.png`（48/180）から `npm run generate:favicons` で生成。  
**SNS / OGP 共通** は `assets/og-card.png`（1200×630 · 白背景 · 全ツール共通 `og:image`）。

## 関連

- 入稿: `docs/PR_TIMES_LAUNCH_2026.md` §0 アイキャッチ
- `data/` は **JSON のみ**（changelog · cta · x_posts 等）
