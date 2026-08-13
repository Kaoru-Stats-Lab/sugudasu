# Gemini COPYPASTE — AdSense「有用性の低いコンテンツ」第2回（SUGUDASU）

**更新:** 2026-08-13  
**背景ログ:** [`../notes/ADSENSE_REJECTION_LOG_20260813.md`](../notes/ADSENSE_REJECTION_LOG_20260813.md)  
**前回監査:** [`../notes/ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md`](../notes/ADSENSE_LOW_VALUE_CONTENT_AUDIT_20260715.md)  
**ガイド戦略:** [`../notes/GUIDES_CONTENT_STRATEGY.md`](../notes/GUIDES_CONTENT_STRATEGY.md)  
**公式:** [Publisher Policies](https://support.google.com/adsense/answer/10502938) · [Content & UX](https://support.google.com/adsense/answer/10015918) · [thin content](https://support.google.com/webmasters/answer/9044175) · [Spam policies](https://support.google.com/publisherpolicies/answer/11035931)

---

## コピペ本文

````text
あなたは Google AdSense 審査（「有用性の低いコンテンツ」）と、日本の「登録不要ブラウザ実務ツール」サイトのコンテンツ設計に詳しい監査役です。
礼賛・精神論禁止。表を多用。推測は「推測」、不明は「要確認」。最終決定はしない（役員会提案まで）。

# 事実（崩さない）

- ドメイン: https://sugudasu.com （静的 · Cloudflare Pages）
- 正体: 登録不要・ブラウザ完結の実務ツール集 + /guides 実務記事
- 2026-07-15: 初回不合格「有用性の低いコンテンツ」→ /contact 新設 · /guides 強化（当時8本前後）
- 2026-08-13: **同じラベルで再不合格**（所有権・ads.txt はOK）
- 現在ガイド: **14本**（tools/guides）。日記ブログではない
- 信頼ページ: /privacy /terms /disclaimer /statements /updates /contact（運営メールは審査用に当面残置）
- 運営実名は公開しない方針（statements で代替）
- 同日近く: 一部ツールを Reject（提供終了ページ化）
- 自動広告タグは全ページ注入済み
- やってはいけない一般論: 「とにかくブログ15本」「サイト削除して再登録」「空カテゴリ整理（WP前提）」

# 参照した公式論点（審査官視点）

1. 十分な独自コンテンツ・再訪理由（Content & UX）
2. 重複・薄いページ・ドアウェイ回避（thin / spam）
3. ナビで約束した情報に到達できるUX
4. 広告はスパムポリシー違反面に載せない

# あなたの仕事

前回「ガイドを増やした」のに再不合格、という前提で、**何がまだ NG に見えるか**を MECE で断定候補付きで洗い、打ち手を優先順位付けする。

## 出力1 — MECE 診断表（必須）

列: 軸ID(A〜G) | 仮説（審査官がサイトで見ているもの） | SUGUDASUでの証拠/反証 | 深刻度(H/M/L) | ガイド増だけでは足りない理由1行

軸は次を使え（不足があれば追加して明示）:
- A 量・深さ（ツール殻 vs ガイド）
- B 独自性・重複・終了ページ
- C 入口（Hub）の価値認識
- D 信頼・ナビ
- E ドアウェイ/スパム匂い
- F インデックス・再申請タイミング・アカウント側
- G 薄いURL上の広告面

## 出力2 — 主因トップ3（必須）

各行: 順位 | 主因1文 | 反証があれば | 最初の実験（1〜2週間で検証可能なこと）

## 出力3 — 打ち手バックログ（必須 · 優先度付き最大12行）

列: 優先(P0/P1/P2) | 打ち手 | 置き場(/ · /guides · /{tool} · GSC · AdSense画面 · 触らない) | 期待効果 | 工数(S/M/L) | ブランドリスク(低/中/高)

制約:
- 「日記量産」禁止
- 運営実名公開を必須にしない
- ツールを減らしてコンテンツサイトに作り替える案は **最終手段** として末尾のみ可
- Reject/提供終了URLの扱いは必ず1行以上

## 出力4 — Hub / ツールページの最小強化案（必須）

- Hub: 「カタログ感」を下げ、guides・statements の価値が初見で読める案を最大3つ（コピー案つき）
- ツール: 審査官が見る代表3ツールについて、追加すべきプレーンテキスト要素（導入・手順・FAQ・ガイドリンク）を表で

## 出力5 — 再申請ゲート（必須）

- 再申請前に必須なこと（最大10）
- やってはいけないこと（最大8）
- 「問題を修正しました」を押してよい条件を1段落

## 出力6 — Cursor 実装チケット案（任意だが推奨）

各チケット: タイトル | 変更ファイル候補 | Done定義 | AdSense仮説ID(A〜G)

# 品質

- 一般ブログ合格テンプレの焼き直し禁止
- 「コンテンツを増やせ」だけで終わらせない（比率・入口・thin URL を必ず扱う）
- 日本語
````

---

## 提督チェックリスト

1. 上記を Gemini に投げる（必要なら `ADSENSE_REJECTION_LOG_20260813.md` も添付）  
2. 結果を `docs/notes/adsense-r2-gemini-RESULT.md` に保存  
3. Cursor で主因トップ3だけ実装バックログ化  
4. **再申請はゲート達成後**  
