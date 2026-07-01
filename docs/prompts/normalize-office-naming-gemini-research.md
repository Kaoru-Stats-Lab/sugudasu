# Gemini依頼用: normalize（T03）事務OL訴求 — 命名・プリセット・検索語リサーチ

**用途:** `normalize.html` の **productName / navLabel / hub コピー** 再設計（§1-15 Seikei 再ポジション）· **調査表のみ**（本文執筆禁止）  
**SSOT（実装は変えない）:** [`docs/notes/NORMALIZE_TEXT_TOOL_SPEC.md`](../notes/NORMALIZE_TEXT_TOOL_SPEC.md) · `id=normalize` 固定  
**更新:** 2026-07-01

**禁止候補（提督メモ）:** 「SUGUDASU 整形」— `report`（議事録整形）と混同 · 製造業の「成形」連想 · 何をするツールか不明

---

## Gemini への依頼文（コピペ用）

```text
あなたは日本語の業務効率化・総務・EC登録・検索意図（SEO）に詳しい調査アシスタントです。
礼賛・前置き・記事本文・LP全文は不要。指定フォーマットの表と箇条書きのみ出力してください。
捏造禁止。数値・検索ボリュームは分からなければ「要確認（Keyword Planner等）」と書く。

【プロダクト現状（id は変えない）】
- URL: https://sugudasu.com/normalize
- registry id: normalize（変更不可）
- 現 productName: SUGUDASU 正規化
- 現 navLabel: 正規化
- 一言: Excel/スプシから1列コピーしたテキストを用途別プリセットで整える（全角半角・空白・ハイフン）。500行cap。入力N行→出力M行表示。ブラウザ内のみ・非送信。
- 現プリセット3種: EC登録 / CSV名簿 / 全角英数
- Phase A 実装済。未実装の事務向け案: 姓名スペース削除 · 改行→カンマ区切り 等

【同ポータル内の競合語（使うと衝突）】
- /report = 議事録・報告書の「整形」（メモ→ビジネス文面）
- 「成形」= 製造・Seikeiブレストの別名（製品名に使わない）

【ペルソナ（今回の主軸）】
- 総務 · 営業事務 · 人事補助 · EC登録担当（副）
- Pain: 社内規程で無料の全角半角変換サイトに顧客リストを貼れない。Excel関数は面倒。行ズレ・先頭ゼロ消失が怖い。

【命名の制約（SUGUDASU 3層）】
- id: normalize 固定
- conceptName: 本文・説明で使う短い概念名（例: 文字列正規化 · テキスト整え 等）
- productName: 白ヘッダー・hub（「SUGUDASU 」接頭辞可）
- navLabel: ナビ短ラベル（接頭辞なし · 6字前後が望ましい）
- トーン: 1機能特化 · 1秒で解決 · 手軽でポップ。エンジニア用語だけに寄せすぎない。

【依頼1】productName 候補 — 比較表（8案以内）
列: 候補productName | navLabel案 | 一言で伝わるか(1-5) | reportと混同リスク | 非エンジニア理解度 | SEO寄りキーワード | 懸念

必ず含める比較軸:
- 現状維持「SUGUDASU 正規化」
- 「社外秘テキスト」「全角半角」「Excel列」「名簿」系の案
- 「整形」「成形」を含む案は **衝突理由付きで低評価** すること

【依頼2】検索意図・口語 — 事務OLが実際に検索/社内で言う言い方（表 · 最大20行）
列: シーン | ユーザーの言い方（口語） | 検索クエリ候補（2〜4語） | normalizeが刺さるか | 競合（一般カテゴリのみ · 固有名最大3）

シーン例: 顧客リスト · 名簿 · メール一括 · CRMインポート · 全角半角 · 姓と名のスペース · 改行をカンマに · 先頭ゼロ · 社内規程で変換サイト禁止

【依頼3】用途プリセット — ラベル案（現3種 + 事務向け追加案）
列: preset_id（英小文字） | UIラベル（12字以内） | 想定貼り先 | 裏処理の要約（非エンジニア向け1行） | 既存3種との重複度

追加検討プリセット例:
- roster_office（総務名簿）
- crm_import（CRM/メールツール向け）
- comma_join（改行→カンマ）
- name_trim（姓名スペース整理）

【依頼4】訴求コピー — hub 1行 · バッジ文言（各3案）
- hub カード説明（80字以内）×3 — ECのみ / 事務のみ / 両方
- 画面上部バッジ（「外部通信していません」系）×3 — 堅め · ポップ · 事務OL向け

【依頼5】推奨パッケージ（箇条書き · 断定弱め）
- 推奨 productName + navLabel + conceptName の1組み合わせ
- 理由（3行以内）
- 採用しない名前トップ3と理由（「整形」が含まれるなら必ず1つ）
- registry / URL を変えずにやるべきこと（プリセット追加 · コピー変更のみ等）

【出力ルール】
- 日本語
- 表はMarkdown
- 記事本文・礼賛・「最強」「No.1」禁止
- SUGUDASU未実装機能を実装済みと書かない
```

---

## 調査後の正本更新先（提督・Agent）

| 成果物 | 更新先 |
|--------|--------|
| Gemini 出力 | `docs/notes/normalize-office-naming-gemini-RESULT.md`（新規） |
| 採用命名 | `data/tool-registry.json` → `TOOL_NAMING_AGENT_PLAYBOOK` 順 |
| プリセット追加 | `NORMALIZE_TEXT_TOOL_SPEC.md` §3 · `assets/text-normalize.js` |
| 事務OL訴求 | `BACKLOG.md` §1-15-1 TODO · hub · normalize.html リード |

---

## 提督が決めること（リサーチ前でも固定）

- [ ] **id `normalize` は変えない**
- [ ] **別ツール「Seikei」「整形」は作らない**（§1-15 採否FIX）
- [ ] `report` との語彙分離 — 「整形」は議事録側に寄せる
