# TOOL_FACTS: fair-draw

status: **reviewed** · updated: 2026-06-22
productName: SUGUDASU 抽選 · stage: beta · URL: https://sugudasu.com/fair-draw

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: キャンペーンの抽選で「内定・サクラ」を疑われる恐怖
- 最優先の型: 型D
- △相当: キャンペーンが「一般消費者向け」か「社内身内向け」かの境界
- 聞き直し例: 「このアマギフ抽選、対外キャンペーン用の法律上限って何円だっけ？」

## 一行

景表法の一次チェックと公平抽選・証跡PDFをブラウザ内で生成

## 実装済み（reviewed のみ Gemini が断定可）

- 景品表示法ルール表による一次スクリーニング（合法/違法断定なし）
- Web Crypto ベースの公平抽選（シード再現）
- キャンペーン識別名（必須）
- 監査PDF（印刷）・結果JSONダウンロード
- 名簿スナップショットダウンロード
- TSVコピー（Excel貼付向け）
- 社内イベント / 対外キャンペーンの Step0 分岐
- sessionStorage に実施者名のみ短期保持（CP名は毎回入力）

## 未実装 / 言い過ぎ注意

- 社内統制システム・操作ログ・権限管理
- 応募フォーム・応募者取得
- コース選択UI（コースごとに名簿を分ける運用推奨）
- 法的助言の代替

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: なし
- retention: sessionStorage: 実施者名のみ。名簿・結果はユーザーがPDF/JSONで自行保管

## 信頼 FAQ 素材

- 保存: 名簿はブラウザ内シャッフル。サーバー非送信。
- 編集: 抽選前なら名簿修正可。確定後は証跡を新規実行で残す運用。
- 保持: 90日自動削除などのサーバー保持なし。PDF/JSONは幹事保管。

## 完了後導線

- 監査PDF保存
- 名簿スナップショット・JSON保存
- TSVをExcelへ

## Gemini メモ

「合法」「違法」断定禁止。統制システムの代替ではないと明記。

## Gemini 添付ブロック（1ツール）

```text
【fair-draw 事実 · status=reviewed】
SUGUDASU 抽選 / https://sugudasu.com/fair-draw
Pain: キャンペーンの抽選で「内定・サクラ」を疑われる恐怖
実装: 景品表示法ルール表による一次スクリーニング（合法/違法断定なし）
実装: Web Crypto ベースの公平抽選（シード再現）
実装: キャンペーン識別名（必須）
実装: 監査PDF（印刷）・結果JSONダウンロード
実装: 名簿スナップショットダウンロード
実装: TSVコピー（Excel貼付向け）
実装: 社内イベント / 対外キャンペーンの Step0 分岐
実装: sessionStorage に実施者名のみ短期保持（CP名は毎回入力）
未実装: 社内統制システム・操作ログ・権限管理
未実装: 応募フォーム・応募者取得
未実装: コース選択UI（コースごとに名簿を分ける運用推奨）
未実装: 法的助言の代替
データ: upload=false serverSave=false retention=sessionStorage: 実施者名のみ。名簿・結果はユーザーがPDF/JSONで自行保管
```

