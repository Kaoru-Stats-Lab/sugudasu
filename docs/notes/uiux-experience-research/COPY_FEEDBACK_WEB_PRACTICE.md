# リサーチ — Copy 成功 Toast / Flash（Webサービス慣行）

**日付:** 2026-07-30  
**目的:** E-TOAST / E-FLASH 役員会の入力。Copy-First（憲法・判例）は妥協しない前提。  
**親討議:** [`UIUX_EXPERIENCE_TOAST_FLASH_BOARD_DISCUSSION.md`](UIUX_EXPERIENCE_TOAST_FLASH_BOARD_DISCUSSION.md)

---

## 0. 憲法前提（妥協禁止）

| 正本 | 含意（本リサーチへの拘束） |
|------|---------------------------|
| `BRAND_CONSTITUTION` 存在様式 | 結果を**持ち帰り**、すぐ元の仕事へ戻る。滞在させない |
| Domain | 「受け渡せる状態」までが担当。コピーはその受け渡しの本体になり得る |
| `PRODUCT_CONSTITUTION` F5 | コピペ → 結果 → **コピー/PDF** |
| **CASE-2026-007** | 共有UIは **Copy-First（コピー動詞）を主CTA**。チャネル名付き送付は Reject。合憲に残るのは送付文面コピー・共有URLコピー・印刷/PDF |

**したがって:** 「Toastを減らして静かに見せる」ために **成功が不確実になる設計は憲法違反寄り**。気持ちよさは「派手な演出」ではなく **持ち帰れた確信が速いこと**。

---

## 1. サービス／DS別パターン（実測・公開仕様）

| 出典 | パターン | Toast | Flash | 備考 |
|------|----------|-------|-------|------|
| **GitHub Primer — Copy pattern** | アイコン clipboard→**check（success色）** · tooltip「Copied!」~2s · focus維持 · **live region 必須** · 失敗は alert アイコン | **使わない**（コピー標準） | なし | 「確認で待たせない」「沈黙コピー禁止」「楽観的 Copied 禁止」 |
| **GitHub / コードブロック一般** | 同上 · nodejs.org は **グローバル Toast → inline へ是正中**（視線外・a11y） | 廃止方向 | なし | 頻出コピーに Toast は過剰 |
| **Stripe（ダッシュボード / テンプレ）** | APIキー等: **Copied tooltip** · テンプレはラベル Copy→Copied ~2.5s + check | 高リスク時は明示確認 | なし | 高ステークスは確認を厚く |
| **Linear 系実装例** | メッセージコピー: icon→check +「Copied!」tooltip ~3s | なし | なし | チャット頻出コピー |
| **Font Awesome 等** | アイコン上 / tooltip「Copied」 | なし | なし | UX.SE 推奨例 |
| **Figma** | **対象範囲**の一瞬ハイライト（Canvas-Copy） | なし（コピーそのもの） | **対象限定** | 全面フラッシュではない |
| **Material Snackbar** | 底辺・中立暗色・短文 · 任意1アクション | **システム通知向け** | なし | コピー専用の第一選択ではない |
| **Notion** | 同期・編集は静か · リンクコピーはプロダクトごとに軽確認 | 控えめ | なし | 「滞在プロダクト」側の文法 |

### 評論・ガイドライン（横断）

| 出典 | 要点 |
|------|------|
| cr0x.net — Copy button states | idle/copying/copied/failed 状態機械。**頻出・密集UIは Toast 避け、icon+tooltip**。**トークン等ハイステークスは Toast or 強い inline** |
| Vitaly Friedman / NN系 Toast指針 | 重要情報を Toast のみに載せない。**可能な限りアクション地点の inline**。エラーを消える Toast にしない |
| 72Technologies | Toast 削減の第一候補は **inline へ戻す**。永続が要る結果は ambient tray |
| WCAG 2.1 **4.1.3** Status Messages | 成功は `role="status"` / `aria-live="polite"`。**フォーカスを奪わない**。アイコン変化だけでは不十分 |
| UX Stack Exchange | Toast はコピーには過剰。**必ず何らかの確認**（checkmark or「copied」） |

---

## 2. 「気持ちよい」の分解（業界合意）

業界が「良いコピー体験」と呼ぶものの中身は、ほぼ次の4点。SUGUDASU の「気持ちよさ」もここに合わせる。

1. **即時** — クリックと確認が同じ場所（視線移動ゼロ〜最小）
2. **確実** — 沈黙禁止 · 失敗も同チャネルで知らせる · 楽観的成功禁止（Primer）
3. **短い** — 1.5〜3秒で戻る · 作業を止めない · `alert`/モーダル禁止
4. **意味が残る** — 色だけに依存しない（形✓ + 文言）。色覚・印刷緑との干渉を避ける

**気持ちよくないもの（業界で忌避されがち）:**

- 画面端のグローバル Toast（視線外 · 見逃し · a11y 失敗しやすい）
- ページ全体の色フラッシュ（何が成功したか不明 · 驚愕 · Calm 破壊）
- 成功でボタンが「別の主CTA色」に化ける（役割学習の干渉）
- フィードバックなし / 英語のみ / 成功の嘘（書けてないのに Copied）

---

## 3. SUGUDASU 固有の差分（業界テンプレをそのまま貼らない）

| 業界の「軽いコピー」 | SUGUDASU Copy-First |
|---------------------|---------------------|
| ブランチ名 · コード1ブロック · チャット一文 | **変換結果一式 · 送付文面 · 共有URL · 行構造データ** |
| ペイロード品質はユーザーが既に見ている | **N→M · フィルター注意 · 最新出力再計算**（§3.8 A/B/D）が価値 |
| 持ち帰り先は IDE / ターミナル | Excel / チャット / 印刷前の手元化（判例の合憲残） |

→ GitHub 型の **操作点✓** は「気持ちよさの核」として採る。  
→ 同時に、Transform-Copy では **ペイロード確認（行数・先頭行）** が「ハイステークス inline」に相当。これを Toastレスで捨てるのは Copy-First の妥協。

---

## 4. リサーチ結論（役員会への入力）

| 結論 | 内容 |
|------|------|
| **R1** | コピー成功の第一チャネルは **操作点フィードバック**（✓ +「コピーしました」）。グローバル Toast / 全面フラッシュはベストプラクティスではない |
| **R2** | Copy-First を妥協しない = **確認を薄くしない**。薄くしてよいのは「視線外の派手さ」だけ |
| **R3** | ハイステークス（変換結果・送付文面）は Primer の「軽いコピー」より厚い確認が正当。厚さは **近接の行数/プレビュー**で出す（画面端 Snack ではない） |
| **R4** | 成功色は **チェック／文言アクセント**。ボタン全体を印刷 emerald にするのは業界にも憲法色文法にも反する |
| **R5** | a11y: 可視確認 + `role="status"` 必須。失敗は同系統で明示（沈黙失敗禁止） |
| **R6** | Canvas の範囲フラッシュは別系統（Figma）。`body` 全面 flash の代替にはならない |

---

## 5. 参照URL

- https://primer-docs-preview.github.com/product/scenario-patterns/copy/
- https://github.com/nodejs/nodejs.org/issues/8357
- https://cr0x.net/en/copy-to-clipboard-button-states/
- https://ux.stackexchange.com/questions/149304/should-i-issue-a-toast-when-something-is-copied-to-clipboard
- https://www.stellae.design/en/ux/copy-to-clipboard
- https://accessibility.build/wcag/4-1-3
- Material snackbars: https://m1.material.io/components/snackbars-toasts.html
