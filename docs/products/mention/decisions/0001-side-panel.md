# ADR-0001 Side Panel

**Status:** Accepted  
**Date:** 2026-07-27

## Context

Mention の価値は「今見ているページの横で終わらせる」こと。  
Web の `/mention` 作業 UI やポップアップ単体では、閲覧コンテキストと分断される。

## Decision

本命 Surface は **Chrome Extension Side Panel**。  
`/mention` は LP · インストール導線のみ。

## Consequences

- ブラウザのみの貼り付け製品は作らない（ADR-0006）
- Store 審査・権限説明が必須ゲートになる
- 実装レーンは `extensions/mention/`（コア `tools/*.html` と同列ではない）
