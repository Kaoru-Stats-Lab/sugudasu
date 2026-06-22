# TOOL_FACTS: hub

status: **reviewed** · updated: 2026-06-22
productName: ツール一覧 · stage: gamma · URL: https://sugudasu.com/

## マーケ（matrix 参照 · 捏造禁止）

- 主Pain: 要確認
- 最優先の型: 要確認
- △相当: 要確認
- 聞き直し例: 要確認

## 一行

SUGUDASU全ツールの入口・回遊ハブ（登録不要・静的ポータル）

## 実装済み（reviewed のみ Gemini が断定可）

- 全ツールカード一覧・ナビ連動
- FAQ回遊導線
- homonym注意バナー（localStorage で dismiss）
- statements / updates への導線

## 未実装 / 言い過ぎ注意

- ユーザーアカウント・お気に入り
- ツール横断の統合検索

## データ取り扱い

- upload: false
- serverSave: false
- localStorage: sg-homonym-dismiss のみ
- retention: ポータル自体はデータを保持しない

## 信頼 FAQ 素材

- 保存: ポータルは各ツールへリンクするのみ。
- 編集: —
- 保持: —

## 完了後導線

- 各ツールページへ遷移
- statements で設計原則確認

## Gemini メモ

ポータル単体のPainコピーは作らない。各ツールへ誘導。

## Gemini 添付ブロック（1ツール）

```text
【hub 事実 · status=reviewed】
ツール一覧 / https://sugudasu.com/
Pain: 要確認
実装: 全ツールカード一覧・ナビ連動
実装: FAQ回遊導線
実装: homonym注意バナー（localStorage で dismiss）
実装: statements / updates への導線
未実装: ユーザーアカウント・お気に入り
未実装: ツール横断の統合検索
データ: upload=false serverSave=false retention=ポータル自体はデータを保持しない
```

