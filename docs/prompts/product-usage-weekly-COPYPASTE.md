# COPYPASTE — 週次プロダクト利用サマリ（開封→完了）

**用途:** Cursor Agent + Analytics MCP で「直近のツール利用状況」を経営判断用に要約する。  
**SSOT:** [`docs/notes/PRODUCT_USAGE_ANALYTICS.md`](../notes/PRODUCT_USAGE_ANALYTICS.md)  
**前提:** `gcloud auth application-default login` 済み（BACKLOG P2-MCP-GA-2）· MCP `user-analytics-mcp` が credentials で応答すること。

---

## 提督がやること（初回のみ）

```powershell
# Analytics 読み取り + ディメンション作成（edit）まで含める
# PowerShell: --scopes の値はダブルクォート必須（カンマで引数が割れ cloud-platform 欠落になる）
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/analytics.edit"
```

Cursor を再起動し、Agent に「GA4 のアカウント一覧を取って」と試し、`get_account_summaries` が通れば OK。  
（素の `application-default login` だけだと `ACCESS_TOKEN_SCOPE_INSUFFICIENT` になることがある）

---

## Agent に貼る本文

```text
SUGUDASU コアの週次利用サマリを出してください。

Property: GA4 Measurement ID G-WBB6PTTYF7（sugudasu.com）
SSOT: docs/notes/PRODUCT_USAGE_ANALYTICS.md

期間: 直近 7 日（足りなければ 28 日も併記）

欲しい表（tool_id 別）:
1. product_opened 件数
2. tool_job_started 件数（可能なら input_kind 別）
3. tool_job_done 件数（可能なら outcome 別: copy / pdf / download / print）
4. tool_job_failed 件数（可能なら reason_code 別）
5. 着手率 ≈ started / opened
6. 完了率（着手後）≈ done / started ＝ 価値到達の主指標の一つ
7. 完了率（開封）≈ done / opened ＝ 価値到達率
8. 失敗率 ≈ failed / started（取れる場合）

併記（取れる範囲で）:
- New vs Returning（サイト全体 · 可能なら主要 tool）
- ツール集中度の目安（完了件数上位ツールのシェア）

並べ替え: 開封数降順、および「開いたが着手なし」「着手したが完了なし」の両方。

解釈:
- Drop_no_engage（opened 多く started 少）→ リード文 / Pain ミスマッチ
- Drop_no_export（started 多く done 少）→ UX / 出力 CTA
- failed が多い → ゲート/空出力の監査（本文は見ない）
- VC価値メーター: docs/notes/VC_DUE_DILIGENCE_METRICS.md

制約:
- 入力データ・検索語・プレビュー文字列はレポートに出さない（そもそもイベントに無い）
- Sync 課金メーターとは混ぜない（コア無料ツールの利用状況）
- 数字が取れない場合は ADC / カスタムディメンション未登録（tool_id · outcome · input_kind）や未デプロイの可能性を手順付きで指摘

出力形式:
- 3〜5 行の経営向け要約（何を伸ばす/直す候補か）
- Markdown 表
- 次の一手（実装 or コピー or 降格）を 1〜3 個
```

---

## うまくいかないとき

| 症状 | 対処 |
|------|------|
| credentials were not found | §「提督がやること」の ADC |
| イベントはあるが tool_id が見えない | GA4 カスタムディメンション登録（PRODUCT_USAGE_ANALYTICS §4.1）· 反映待ち 24–48h |
| tool_job_done が 0 | DebugView でコピー/DL を1回試し、本番ホストか確認（localhost は送らない） |
