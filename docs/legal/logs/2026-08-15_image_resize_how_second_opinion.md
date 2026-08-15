# 2026-08-15 — 画像提出 HOW セカンドオピニオン合成

**正本:** [`../../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md`](../../notes/IMAGE_BATCH_RESIZE_SUBMIT_HOW_20261115.md) §9.5  
**プロンプト:** [`../../prompts/image-batch-resize-how-second-opinion-COPYPASTE.md`](../../prompts/image-batch-resize-how-second-opinion-COPYPASTE.md)  
**材料:** Claude · Gemini 各1通（Overall Adequate · 一次一致 High）

## 役員会着地（一文）

骨格は維持。抜けていたのは「正しく完了したと嘘をつかない」系（EXIF正立 · 透過の白背景 · 容量未達の状態表示）だけなので、HOW に行を足して閉じる。製品コードはまだ書かない。

## 食い違いの決着

| 論点 | 着地 |
|------|------|
| 短辺 | **Reject**（Gemini の Park は採らない。縦長は長辺で足りる） |
| `_{W}x{H}` | 寸法変化時のみ（web_long_edge 常時付与は緩和） |
| stem | **48文字**（30と80の間） |
| Hub並置プロト | 必須にしない。画面は数値・容量主体 |

## 憲法

改正しない。新判例不要。
