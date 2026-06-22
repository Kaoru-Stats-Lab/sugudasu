# Gemini依頼用: PNG/JPEG→WebP（逆方向 · T09b 候補）リサーチ

**用途:** 製品判断（別ツール化 vs 既存拡張）· Zenn / SEO · **調査表のみ**（本文執筆禁止）  
**関連実装:** `tools/webp-to-jpg.html`（WebP→PNG/JPEG · 非送信 · 逆方向は未実装）  
**更新:** 2026-06-21

**既存調査（逆方向）:** [`docs/notes/webp-to-jpg-gemini-research-RESULT.md`](../notes/webp-to-jpg-gemini-research-RESULT.md)

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本語の業務効率化・Web制作・画像フォーマット周辺UXに詳しい調査アシスタントです。
礼賛・前置き・記事本文は不要。指定フォーマットの表と箇条書きのみ出力してください。

【背景（調査の前提）】
- 既存ツール SUGUDASU webp-to-jpg: WebP → PNG/JPEG のみ · ブラウザ内 Canvas · 画像非送信 · 最大20枚
- 痛点（逆方向）: PNG/JPEG を WebP に変換して容量削減・Web/LP/CMS 向けに軽量化したい
- 競合例（ブラウザ内）: サルワカWebツール等も PNG/JPEG→WebP を提供（要調査）
- 競合例（アップロード型）: Convertio · iLoveIMG · Squoosh（Google）等
- 方針候補: (A) 別URL `png-to-webp` (B) 既存 webp-to-jpg を双方向化 (C) 見送り
- 技術メモ: ブラウザ Canvas の toBlob('image/webp') は Chrome/Edge/Firefox で一般に可。Safari/iOS の WebP **エンコード**対応は要確認（2026年時点）

【依頼1】PNG/JPEG→WebP まわりの「ユーザーあるある」表
次の列で **最大15行**（各セル100字以内）。

列: シーン | 困りごと | よく使う回避策 | 回避策の弱点 | ブラウザ内変換が効く条件

シーン例: WordPress/LP画像 / ブログサムネ / EC商品画像 / 社内Wiki / メール添付容量 / スマホアップロード上限 / OGP・SNS / スクリーンショット共有 / 印刷用→Web用 等

【依頼2】WebP→JPG 痛点 vs PNG→WebP 痛点 — 比較表
「同じツールにまとめるべきか」の材料にする。

列: 観点 | WebP→PNG/JPEG（既存） | PNG/JPEG→WebP（逆方向） | 同一URLに載せると起きうる混乱

観点例: 典型ユーザー / 緊急度 / 入力ファイル / 出力期待 / 透過PNG / 品質・容量トレードオフ / 失敗時の害 / SEO検索語の分離度

【依頼3】アップロード型 vs ブラウザ内処理（PNG/JPEG→WebP 専用）— 比較表
**特定サービス名は最大4つまで**（例: サルワカWebツール · Squoosh · Convertio · iLoveIMG 程度）。それ以外は「一般」。

列: 観点 | アップロード型（一般） | ブラウザ内Canvas（一般） | 向いている人

観点例: データの行き先 / 一括・ZIP / 品質スライダー / 待ち時間 / 機密画像 / オフライン / 枚数上限 / HEIC・AVIF / Safari/iOS / 透過PNG→WebP

【依頼4】ブラウザ内 PNG/JPEG→WebP — 技術・制約メモ（箇条書き 8〜12項目）
- Canvas toBlob image/webp の主要ブラウザ対応（**エンコード**側。デコードとは別）
- 透過 PNG → WebP で失う/残るもの
- 品質パラメータの有無・デフォルト挙動
- 巨大画像・メモリ上限の典型
- CORS/URL取込がある場合の注意（webp-to-jpg と共通か）
- 不明点は「要確認」と明記（捏造禁止）

【依頼5】SUGUDASU 向け — 製品判断材料（箇条書き）
- (A) 別URL `png-to-webp` を選ぶ合理的理由（最大5）
- (B) 既存 webp-to-jpg を双方向化する合理的理由（最大5）
- (C) 見送る合理的理由（最大5）
- **推奨:** A/B/C のいずれか1つ + 理由3行以内（断定ではなく「調査時点の推奨」）
- **やってはいけない** 約束（PDF · 一括ZIP · AI upscale · リサイズ必須機能 等）

【依頼6】検索意図・キーワード候補
日本語ロングテール **10〜15件** · 形式: キーワード | 検索意図（1行）| 記事/ツールで触れるべき注意（1行）

例: png webp 変換 / jpeg webp 変換 オンライン / 画像 圧縮 webp ブラウザ / png webp 変換 アップロード しない 等

【禁止】
- 記事本文・Zenn下書き・Markdown記事
- 未確認の統計数字（「〇%のユーザーが」等）。不明は「要確認」
- SUGUDASU の礼賛文
- 「100%安全」「完全非送信保証」等の断定
- webp-to-jpg に既にある機能（WebP→PNG）を逆方向リサーチに混同しないこと
- 競合を「劣っている」と決めつけない（住み分けで書く）

【出力順】
§1 あるある表 → §2 WebP→JPG vs PNG→WebP → §3 アップロード vs ブラウザ内 → §4 技術制約 → §5 製品判断 → §6 キーワード表
```

---

## 添付推奨（Gemini チャットに同梱）

1. 本プロンプト（依頼文ブロック）
2. [`docs/GEMINI_SESSION_SNAPSHOT.md`](../GEMINI_SESSION_SNAPSHOT.md) — SUGUDASU 前提
3. [`docs/notes/webp-to-jpg-gemini-research-RESULT.md`](../notes/webp-to-jpg-gemini-research-RESULT.md) — 逆方向の既調査（重複させない）
4. [`docs/DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) §1.1 · §1.3 — 1 URL · 1 Pain · 命名

---

## 出力の扱い

1. Gemini の返答 → [`docs/notes/png-to-webp-gemini-research-RESULT.md`](../notes/png-to-webp-gemini-research-RESULT.md) **保存済（2026-06-21）**
2. 製品判断 → `docs/BACKLOG.md` §1 または T09b として起票（提督突合後）
3. 実装する場合 → `docs/notes/TOOL_NAMING_AGENT_PLAYBOOK.md` に従い id は `png-to-webp` 等

---

## 突合チェック（結果受取後）

- [ ] Safari/iOS の WebP **エンコード**が「要確認」か確度付きか
- [ ] WebP→JPG 痛点と PNG→WebP 痛点が **別 Pain** と書き分けられているか
- [ ] A/B/C 推奨に根拠がある（検索語の分離 · UI混乱 · 開発コスト）
- [ ] サルワカ等を「唯一の非送信」と断定していないか
- [ ] 架空の利用統計がないか
- [ ] HEIC/AVIF 等スコープ外が §5「やってはいけない」にあるか
