# SUGUDASU リンク集QR — ツール仕様 SSOT

**更新**: 2026-07-03  
**id**: `link-qr` · **URL**: `/link-qr`  
**判定**: `PRODUCT_IDEA_JUDGMENT_LEDGER.md` — 適合◎ · 市場△（会場拡散 + Zenn）  
**ペルソナ**: **話した人にあとから連絡**（Slack · メール）> テックSNSフォロー交換 · Linktree 未所持 · **その場30秒**

---

## 1. 目的

テックイベント（アイデアソン · 勉強会）で **話した人とだけあとから連絡**したいとき、Slack プロフィール URL やメールを QR で渡す。フォロー交換向けには **テックSNS** プリセットも選べる。Linktree のような **アカウント登録・サーバー保存はしない**。

---

## 2. ペルソナ · Pain

| 誰 | Pain |
|----|------|
| アイデアソン参加者 | プロダクト実装者に **あとからプラスアルファ** を Slack で送りたい · 名刺は切れている |
| 懇親会参加者 | 「X は？」「GitHub は？」の往復 |
| 幹事 | 全員が各自30秒で QR を作るようアナウンスしたい（一括発行ではない） |

**差別化1文:** 入力は URL の `#` フラグメントに圧縮エンコードされるだけ。サーバーはリンク集を知らない。

---

## 3. スコープ

### Must（v0.1）

| 機能 | 内容 |
|------|------|
| プリセット | **イベント連絡**（既定）: Slack · Discord · メール · X/GH 任意 · その他 / **テックSNS**: X · GH · Zenn · Qiita · Web · その他 |
| 入力 | 表示名（40字）+ プリセットごと最大6枠 |
| 正規化 | `@handle` → 各サービス URL · `mailto:` · Slack/Discord は `https` + ドメイン検証 |
| 幹事 | `ORGANIZER_COPY` — Slack/LINE 用アナウンス文をワンクリックコピー |
| エンコード | JSON 短キー → UTF-8 → base64url → `#p=...` |
| デコード | 同一ページで hash から読み取り専用カード表示 |
| 出力 | 共有 URL コピー · QR（PNG 保存）· プレビュー |
| 非送信 | 外部 API なし（QR 生成は CDN `qrcode` を動的 import · ペイロードは送らない） |

### Must not

- 「暗号化」と謳わない（誰でも decode 可能）
- 動的 QR · サーバー短縮 URL · アカウント
- 秘密情報（API キー等）の入力を推奨しない

### OUT（v2以降）

- カメラスキャン · デザインテーマ · vCard 統合 · 分析

---

## 4. ペイロード

```json
{ "v": 1, "pr": "event_contact", "n": "表示名", "l": [["slack","https://..."], ["mail","mailto:a@b.c"]] }
```

| キー | 意味 |
|------|------|
| `v` | スキーマ版 |
| `pr` | プリセット id（省略時 decode は `tech_sns` 扱い — 旧 QR 互換） |
| `n` | 表示名 |
| `l` | `[slotId, url][]` — 空枠は含めない |

**上限:** UTF-8 実バイト **1200**（超過時は QR 生成をブロック · リンク数を減らすよう案内）

---

## 5. UI（Tier B LP）

1. バッジ — 非送信 · その場30秒  
2. FV — **話した人にあとから連絡** Pain  
3. 本体 — プリセット切替 / 入力 / プレビュー / QR  
4. 幹事向けコピー文案  
5. FAQ + JSON-LD  
6. 完了導線 — `/sns` · `/label`

**閲覧モード:** `#p=` ありで有効 decode → カード一覧を主表示 · 編集は「自分用に作る」で hash クリア

---

## 6. 競合 · Prior Art

| 層 | 例 |
|----|-----|
| SaaS | lit.link · Linktree |
| QR 汎用 | Abundera · Go Tools · vCard QR |
| OSS | [linkdance](https://github.com/anshxs/linkdance)（TinyURL 依存）· [qrshare](https://github.com/jacksoncurrie/qrshare) |

---

## 7. マーケ

- **SEO:** ニッチ（登録不要 QR リンク集）— 主戦場ではない  
- **Zenn:** lz-string / `#` フラグメント · 非送信 link hub 実装記  
- **guides:** `tech-event-follow-exchange`（P2）  
- **束:** 登壇者束 — `sns` + `link-qr`

---

*End of SSOT*
