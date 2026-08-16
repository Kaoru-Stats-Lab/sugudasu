# 2026-08-15 — TXT-Crypter 型テキスト暗号URL（役員会評価）

**判例:** [CASE-2026-012](../CASE_LAW.md#case-2026-012)  
**対象サービス（競合観測）:** [TXT-Crypter](https://tc.chigusa-web.com/) · 復号 OSS [TXT-Crypter-decryption](https://github.com/chigusa-web/TXT-Crypter-decryption)  
**決定ログ:** [`../../brand-project/DECISION_LOG.md`](../../brand-project/DECISION_LOG.md)  
**台帳:** [`../../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) §24

## 材料

TXT-Crypter は DB/サーバー保存なしで、暗号化データを復号URLに埋め込むステートレス構造。FAQ 主座は Notion 等への平文回避・パスフレーズ復号。登録不要 · ブラウザ完結 · 完全無料。

提案側は「F2/F3 と完全一致」とし、SUGUDASU への応用として次を挙げた。

1. 機密の一時共有（Secret Copy Link · Slack/Teams）
2. 仮置きカードの離席・画面共有ロック（暗号退避）
3. Wiki/手順書への使い捨て暗号パラメータ埋め込み

Vault UI（フォルダ・検索・マスターPW）は提案側も Reject。

## この会議で決めたこと

**コア新規 HTML「テキスト暗号URL / 伏字リンク」は Reject。**  
F1〜F4 の技法相似は認めるが、製品採用の起点にしない（Persona → Pain → 市場 → F）。

| 項目 | 判定 |
|------|------|
| Hub / registry への新規暗号URLツール | **Reject** |
| パスワードマネージャ / Vault UI | **Reject**（提案と一致） |
| 仮置きへの暗号退避・伏字ロック | **Reject**（CASE-010/011 · 加工導線） |
| Wiki/Notion 埋め込み主座 | **Reject**（競合の本丸 JTBD · 保管隣接） |
| チャット用 Secret Copy Link をコアに載せる | **Reject**（コア）。Secret / 別置きの再審は立法事実必須 |
| クライアント AES + URL ペイロードという **技法** | Sync / Secret 既存線で必要なときのみ再利用可 · コア製品 GO の根拠にしない |

## 判定順の所見

| 軸 | 所見 |
|----|------|
| Persona | パスフレーズ忘れ · 復号確認 · 鍵の別経路共有はセキュリティ運用。教え込み Anti |
| Pain | Slack 平文は実在。解は会社公認転送 · Vault Send · マスクして持ち帰り等。暗号URLが唯一解ではない |
| 市場 | 同型が既に無料で存在（本サービス）。CASE-009 型 |
| C-10 | 「テキスト暗号ユーティリティ」カテゴリ期待 |
| F5 | 暗号儀式は 3分 Calm より重い |
| F7 | 「安全・機密」の過剰断定リスク |

## ユーザ文脈（再確認）

SUGUDASU ユーザの標準は **整える → コピー/DL で手元へ戻す**。秘密の長期保管・暗号共有は製品が代替しない。マスク/赤入れは「見せない」画像処理であり、テキスト暗号保管とは別 JTBD。

## 再提案防止

- 「非送信・ステートレスだから GO」で始めない
- Vault UI を削っただけでは Wiki 埋め込み JTBD は Reject のまま
- 仮置きに暗号ボタンを足さない
- 競合が F1〜F5 を満たす領域では Hub Value で足さない（CASE-009）
