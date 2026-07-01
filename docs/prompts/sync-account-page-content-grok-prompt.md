# Grok依頼用: アカウントページ表示内容 — ピアレビュー（Gemini 突合）

**用途:** Gemini 初稿（[`sync-account-page-content-gemini-RESULT.md`](../notes/sync-account-page-content-gemini-RESULT.md)）への**反証・盲点・当日オペ視点**の第2意見  
**保存先（Grok 出力）:** `docs/notes/sync-account-page-content-grok-RESULT.md`  
**更新:** 2026-06-26（§8 提督3件確定後）

---

## パイプライン

```text
sync-account-page-content-gemini-prompt.md（Gemini 初稿）
  → 本ファイル（Grok ピアレビュー · 礼賛禁止）
  → Agent §11 照合 → SYNC_AUTH_POLICY §5-5 確定
```

---

## Grok への依頼文（コピペ用）

```text
【役割】個人開発 SaaS とイベント現場オペに詳しい、懐疑的なプロダクトレビュアー。礼賛禁止。
【タスク】添付の Gemini 調査結果を突合し、盲点・反証・当日幹事視点のリスクを洗い出す。
【禁止】全体の書き直し / 「画期的」 / 提督方針（最小開示・β課金なし）の無断 overturn / 新機能の大量追加提案
【必須】指定フォーマットのみ。挨拶不要。日本語。
【文脈】SUGUDASU Sync β · sync.sugudasu.com · イベント幹事が年数回使う進行表クラウド同期

---

## 提督が既に確定したこと（変更提案する場合は §4 で反証必須）

| 項目 | 決定 |
|------|------|
| アカウント情報量 | **最小開示** — アクセス数・UUID・quota 哲学 FAQ は載せない |
| アカウント P0 | メール（表示+変更）· PW変更 · ログアウト（**灰テキスト**）· 退会（赤・危険ゾーン） |
| フィードバック | [Google Forms](https://docs.google.com/forms/d/e/1FAIpQLSchvqtu9j3FL4KTxSG70txXwbREaJFZ-IrdwAKjuCRWz5jaPw/viewform?usp=publish-editor) を正本 · ラベル「改善を提案する ↗」 |
| ビルド番号 | フッター右下 **極小**（非表示はしない） |
| インフラ逼迫 | **アカウントに載せない** — ルーム行/編集画面（B）+ 全局バナー（C）ハイブリッド |
| β | Stripe · プラン · 請求 UI **なし** |

---

## あなたにやってほしいこと

1. Gemini §3（B+C ハイブリッド）を **イベント当日の幹事** 視点で攻撃する — 何が足りない/過剰か
2. §4 表示項目表の **「出さない」判断** で、反証がある行だけ列挙（無ければ「反証なし」と明記）
3. §8 で確定した3件について **賛成/条件付き賛成/反対** と1文理由
4. Gemini が見落とした **アカウントページに載せるべき1項目**（あれば最大3 · なければ「追加不要」）
5. **載せすぎリスク** Top 3（幹事がパニックするパターン）

---

## 出力フォーマット（この順・見出し固定）

### §1 総評（200字 · 賛否を明示）

### §2 Gemini §3（B+C）への反証チェック

| 論点 | 判定（支持/修正/却下） | 理由（1文） | 代替案（あれば） |

最低5行（容量メーター配置 · 障害バナー · Status ページ · Supabase Paused · trial 枠の見せ方）

### §3 §4「出さない」への反証（該当行のみ）

| 表示項目 | 反証あり/なし | 理由 |

該当なしなら表1行「反証なし — 最小開示で妥当」

### §4 提督確定3件のレビュー

| # | 決定内容 | 判定 | 理由 |

### §5 見落とし候補（最大3 · なければ「追加不要」）

| 候補 | 載せ場所 | 優先度 | 採用すべきか |

### §6 載せすぎリスク Top 3

bullet · 幹事の心理状態（当日直前/本番中）を添える

### §7 実装時の落とし穴（エンジニア向け · bullet 5つ以内）

### §8 最終推奨（変更するなら1つだけ · なければ「Gemini+提督案を維持」）

---

## 添付（Gemini 結果全文）

（ここに sync-account-page-content-gemini-RESULT.md の §1〜§6 を貼る。
 §8 提督決定・§10 Agent照合 も含めてよい）

---

## 参考キーワード（Browse 可）

- Notion account settings minimal
- SaaS account page what to show users
- infrastructure status banner vs settings page UX
- event day coordinator software panic UX
```

---

## Agent 照合（Grok 受取後）

- [ ] §4 で提督確定3件を overturn していないか（overturn なら §8 に根拠付きで提督再判断）
- [ ] β 課金 UI の追加提案が紛れ込んでいないか
- [ ] `SYNC_AUTH_POLICY.md` §5-5 と矛盾する P0 変更がないか
- [ ] 結果を `docs/notes/sync-account-page-content-grok-RESULT.md` に保存 · §11 照合行を追記

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-06-26 | 初版 · §8 提督3件確定後の Grok ピアレビュー用 |
