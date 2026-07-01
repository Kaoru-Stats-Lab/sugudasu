# SUGUDASU Sync — URL / IA / SEO SSOT

**更新:** 2026-06-29（§2-1 Schedule 旗艦ハブ）  
**対象:** `sync.sugudasu.com` の全 Sync 系プロダクト  
**関連:** `SUGUDASU_SYNC_LINE.md` §3-0c · `SYNC_CAPACITY_AND_PRICING_POLICY.md` · `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md`

---

## 0. 背景（なぜ先にURLを固定するか）

Sync 系は「有料で導入する理由」を説明しないと購入に至らない。  
そのため、実作業画面（アプリ）と販売説明画面（LP）を混在させると、次の問題が起きる。

- 検索エンジンが「何のページか」を判定しづらい
- 薄いアプリUIページが先に評価され、LPが埋もれる
- 将来プロダクト増加時に URL と導線が破綻する

この文書は、**ユーザー体験より先に検索意図を整理する**ための IA 正本である。

---

## 1. 設計思想（原則）

| 原則 | 内容 |
|------|------|
| 意図分離 | 無料コアの探索意図と、有料Syncの導入意図をURLで分離する |
| 役割分離 | LP（説明・比較・価格）と App（実作業）をURLで分離する |
| 拡張一貫 | 新しいSyncアプリが増えても同じ規則で増設できる |
| SEO制御 | Index対象はLP、Appは原則 noindex で重複評価を防ぐ |

---

## 2. ドメイン責務

| ドメイン | 責務 |
|---------|------|
| `sugudasu.com` | 無料コア製品の獲得（登録不要・非送信の価値） |
| `sync.sugudasu.com` | Sync有料製品の説明・比較・導入・課金 — **旗艦は Schedule**（§2-1） |

### 2-1. ハブ LP — Schedule 中心（提督 2026-06-29）

[`SUGUDASU_SYNC_LINE.md`](SUGUDASU_SYNC_LINE.md) §3-0c と同型。**Google カレンダーが製品群の時間軸ハブになるように、`/` は工程表（Schedule）を主役にする。**

| 要素 | 方針 |
|------|------|
| **URL** | `https://sync.sugudasu.com/` = Sync **ハブ LP**（index） |
| **主 CTA** | `/schedule` → `/schedule/app` |
| **副導線** | `/timeline` · `/group-split` 等 — 「イベント当日向け」カード |
| **ログイン後既定** | Schedule entitlement あり → `/schedule/app` · 進行のみ → `/timeline/app` |
| **sitemap 優先** | `/` · `/schedule` を最優先 · `/timeline` は衛星 LP |

**暫定（S1）:** ハブ未整備の間は `/timeline/app` が実質入口 — **Schedule 出荷時にハブを Schedule 主に組み替える**（破壊的変更はハブのみ · 既存 timeline URL は維持）。

**正規URL（現行）**

- コア無料アプリ: `https://sugudasu.com/timeline`
- Sync LP（ハブ）: `https://sync.sugudasu.com/`
- Sync 実作業アプリ（**本番 S1 · 2026-06-26**）: `https://sync.sugudasu.com/timeline/app`
- Sync 実作業（入口/リダイレクト）: `https://sync.sugudasu.com/timeline`

---

## 3. URL ルール（プロダクト増加前提）

各 Sync 製品は次の2層で固定する。

- LP: `https://sync.sugudasu.com/{product}`
- App: `https://sync.sugudasu.com/{product}/app`
- 共有URL（固定）: `https://sync.sugudasu.com/e/{event_public_id}`

**命名原則:** ユーザー向け文言は `event`（イベント）で統一。  
`room` は内部DB実装名（互換目的）としてのみ残す。  
公開IDは `SYNC_EVENT_ID_AND_DASHBOARD_POLICY.md` に従い `se_` 名前空間を使う。

### 3-1. 既存 T13-S への適用（破壊的変更回避）

| 役割 | URL |
|------|-----|
| 現行 App（本番） | `https://sync.sugudasu.com/timeline/app` |
| 現行 App（入口） | `https://sync.sugudasu.com/timeline` |
| 目標 LP | `https://sync.sugudasu.com/timeline` |
| 目標 App | `https://sync.sugudasu.com/timeline/app` |
| 共有URL（新設） | `https://sync.sugudasu.com/e/{event_public_id}` |

**重要:** 既存共有リンク破壊を避けるため、`/e/{event_public_id}` を先に導入してから `/timeline` の LP 化を行う。

### 3-1b. `/e/{event_public_id}` ルーティング責務

- `/e/{event_public_id}` は検索対象ではなく、現場共有専用の安定URL。
- サーバ/エッジで `event_public_id` を内部 `room_id` に解決し、`product_type` に応じて適切な App へ 302:
  - 例: `/timeline/app?event={event_public_id}`
- このルートは将来の IA 変更の影響を受けない「共有リンク保護層」とする。

### 3-2. 将来製品の例

- `https://sync.sugudasu.com/group-split` / `.../group-split/app`
- `https://sync.sugudasu.com/schedule` / `.../schedule/app`

---

## 4. SEO 運用ポリシー（必須）

| 対象 | index方針 | 理由 |
|------|-----------|------|
| ハブLP `/` | index | 指名検索・比較導線 |
| 各製品LP `/{product}` | index | 課題/料金/FAQの主着地 |
| App `/{product}/app` | noindex,nofollow | 薄いUIページの評価流入を防ぐ |
| 共有URL `/e/{event_public_id}` | noindex,nofollow | 動的・短命URLの誤indexを防ぐ |

### 4-1. 技術ルール

- LPページは canonical 自己参照（`sugudasu.com` と `sync.sugudasu.com` を跨いで混在させない）
- Appページは **`X-Robots-Tag: noindex, nofollow`** を優先（`meta robots` は補助）
- `/e/*` も `X-Robots-Tag: noindex, nofollow`
- sitemap は LP優先で収載（Appは原則除外）
- 広告・記事・SNS流入は LP を着地にする
- LPには `SoftwareApplication` JSON-LD（価格/提供形態）を出力する

---

## 5. LP の最低要件（課金公開ゲート）

課金導線を本番公開する前に、LPに以下が存在すること。

- 課題→解決（誰のどんな痛みを減らすか）
- 料金（Base + 追加端末パック）
- 同時端末上限と技術上限
- 保存期限（**日付の事実** · 運用内訳の説教はしない）
- 導入手順（開始まで3ステップ）
- FAQ（無料版との差 · 同期範囲 · 返金・解約 — **grace 日数 · quota 内訳は載せない** · [`SYNC_RETENTION_POLICY.md`](SYNC_RETENTION_POLICY.md) §3-2）
- 構造化データ（`SoftwareApplication` + `Offer`）

---

## 6. リダイレクト方針（移行時）

- 旧URLから新URLへ 301 を使用
- App URL を LP へ寄せるリダイレクトはしない（役割が異なるため）
- App 直リンク流入は許可しつつ noindex で評価対象外にする

---

## 7. 受け入れ基準

- [ ] `sync.sugudasu.com/` が Sync ハブLPとして機能する
- [x] Timeline App URL が本番で到達可能（`/timeline/app` · S1 ログイン UI · 2026-06-26）
- [ ] 各 Sync 製品に LP と App の2層URLがある（timeline 以外）
- [ ] App URL は noindex,nofollow（X-Robots-Tag）
- [ ] `/e/{event_public_id}` が共有専用URLとして動作し、Appへ 302 される
- [ ] sitemap が LP中心で構成される
- [ ] 課金CTAは LP から開始される
- [ ] LPに `SoftwareApplication` JSON-LD が埋め込まれている

---

## 8. 思想メモ（運用判断の基準）

- ユーザーは URL を細かく見ないが、検索エンジンは URL と文脈を重視する
- したがって IA は「人の見た目」より「検索意図の機械可読性」を優先する
- Sync は機能販売ではなく「事故回避の安心」を売る。LP はその翻訳装置であり必須資産
- SEO キーワード正本: [`SYNC_TIMELINE_SEO_KEYWORDS.md`](SYNC_TIMELINE_SEO_KEYWORDS.md)
