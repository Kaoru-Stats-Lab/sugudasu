# ADR-0003 Local First

**Status:** Accepted  
**Date:** 2026-07-27

## Context

監視 SaaS はクラウド蓄積が価値の証明になる。Mention は時間短縮へ課金し、業務データを SUGUDASU 管理下に置かない（C-05）。

## Decision

- **Non-Exfiltration:** SUGUDASU へ業務データを送らない · クラウドに溜めない  
- 端末内 IndexedDB（Done / Template / Settings）は「終わらせた痕跡」のみ  
- ネットワークは Webhook の**明示押下時のみ**

## Consequences

- 「保存ゼロ」字面で端末内 Done を否定しない  
- Sync / クラウド監視は Constitution 破壊 → Reject  
- 関連: philosophy P3 · P4
