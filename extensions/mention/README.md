# Mention by SUGUDASU — Chrome Extension

**Mission:** Find it. Done.  
**正本:** [`docs/products/mention/`](../../docs/products/mention/)

## ローカル読込

1. Chrome で `chrome://extensions`
2. 「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」
4. このフォルダ `extensions/mention` を選択
5. ツールバーのアイコンをクリック → Side Panel が開く

## 使い方

1. Google 口コミや記事をブラウザで開く
2. Side Panel で Action を押す
3. 定型をコピー（または Webhook 送信）→ 完了

## 構成

| パス | 役割 |
|------|------|
| `lib/action-engine.js` | 構造シグナル → Action · テンプレ展開 |
| `lib/templates-default.js` | 既定定型 |
| `lib/idb.js` | IndexedDB（templates / settings / done） |
| `content/extract.js` | DOM 抽出（端末内） |
| `sidepanel.*` | Inbox / Done / Template / Setting |

## テスト

```bash
npm run test:mention
```
