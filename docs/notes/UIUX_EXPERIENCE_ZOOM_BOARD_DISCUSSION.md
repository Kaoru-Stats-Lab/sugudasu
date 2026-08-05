# S-ZOOM — Canvas Paper Zoom（経営会議決議）

**日付:** 2026-08-05  
**状態:** **決議済み**（パイロット実装: `pdf-fill`）  
**未決ID:** S-ZOOM → **Closed（方針）** · 横展開は条件付き  
**親:** Experience Implementation Review · Surface（紙に近づく）  
**関連:** 裏紙 ADR-007 · [`URAGAMI_SPEC.md`](URAGAMI_SPEC.md) · pdf-fill ADR-032 · [`CAPABILITY_INVENTORY.md`](CAPABILITY_INVENTORY.md)

> Agent: **全ツール一括ズーム UI は禁止。** 許可はジェスチャ正本＋ `pdf-fill` パイロット。annotate / mask 横展開は別票。画面内＋−％の常設はしない。

---

## 0. Framing（確定）

**Pain:** モザイク・黒塗り・記入など visual_workbench で、紙面上の細かい領域を見る／置くために拡大縮小が要る。  
**採択方針:** ブラウザ全体ズームに任せない。裏紙と同型の **Paper Zoom（見る距離）**。表示変更は編集に数えない（pdf-fill 仕様どおり）。

---

## 1. 確認票

| ID | 提案 | 票 | 昇格 |
|----|------|-----|------|
| **S-ZOOM-SCOPE** | 対象は visual_workbench（記入 · 赤入れ · 秘匿）。帳票/変換は対象外 | **Keep** | 本討議 · Inventory |
| **S-ZOOM-GESTURE** | **Ctrl/Meta+wheel = 表示拡大**（机の中心基準）。%常時表示なし | **Keep** | 裏紙 ADR-007 と揃える |
| **S-ZOOM-UI** | 画面内＋−は任意・初回パイロットでは **無し** | **Keep** | Calm |
| **S-ZOOM-PDF-FILL** | 旧 Ctrl+wheel「文字サイズ」は **Alt+wheel**（および既存 −＋）へ移す | **Keep · 必須** | pdf-fill ADR-019 改訂 · ADR-032 |
| **S-ZOOM-PAN** | 拡大後の到達のため **Space / 中ボタン pan** を同梱（ミニマップなし） | **Keep** | 裏紙と同型 |
| **S-ZOOM-EXTRACT** | 3本目実装時に薄い `sg-paper-zoom` 候補。いまは **Dup 観察** | **条件付き** | Capability Inventory |
| **S-ZOOM-REJECT** | 全ツール一律 · ブラウザ任せのみ · ミニマップ · %ダッシュボード | **Reject** | — |

---

## 2. ジェスチャ正本（横断契約 · HOW）

| 操作 | 意味 | 備考 |
|------|------|------|
| **Ctrl/Meta + wheel** | Paper Zoom（見る距離） | 机の中心基準。ブラウザズームを `preventDefault` |
| **Alt + wheel**（pdf-fill） | 選択 Object の大きさ（文字 · 記号 · Strip） | 旧 Ctrl+wheel。ツールバー −＋も維持 |
| **Space ドラッグ / 中ボタン** | Pan | ズーム≠1 で実質必須 |
| **机ダブルクリック**（任意） | 表示リセット | 裏紙と同型可 |
| 画面内＋− · %表示 | 既定なし | 学習コストより Calm 優先 |

**対象外:** invoice / receipt / 変換系 · Hub。

---

## 3. パイロット

| ID | 内容 |
|----|------|
| **S-ZOOM-PILOT** | `pdf-fill` に Viewport（CSS transform）+ Ctrl+wheel Zoom + Space/中ボタン Pan + Alt+wheel 文字サイズ |

**やらない（本票）:** annotate / mask への一括横展開 · shared 抽出 · 画面内ズームボタン。

**判定:** `/pdf-fill` で Ctrl+wheel が紙を拡大し、選択文字のサイズは Alt+wheel / −＋で変わること。焼き付け座標は表示ズーム非依存のまま。

---

## 4. 各員見解（要約）

| 役割 | 見解 |
|------|------|
| **認知** | Workspace の次は「紙に近づく」。一覧ツールには不要 |
| **UIUX** | ジェスチャ主 · ＋−常設は Calm を削る |
| **CPO** | visual_workbench 限定。訴求は「Acrobatズーム」にしない |
| **CTO** | 裏紙・切り出しと Dup。3本目で抽出検討。座標正本は触らない |
| **CMO** | 非送信・提出完了の脇役 |

---

## 5. Agent 禁止（決議後も）

- 全 canvas ツールへの一括 Paper Zoom PR  
- Ctrl+wheel を文字サイズのまま残した表示ズーム二重定義  
- % / ミニマップ / ズームツールバーの常設化（別票なし）  
- pdf-fill ↔ annotate 座標モデル統一に便乗

**許可:** `pdf-fill` パイロット · 本ジェスチャ正本に沿った文書更新 · Inventory 1行追記。
