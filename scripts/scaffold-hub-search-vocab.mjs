#!/usr/bin/env node
/**
 * Hub 検索語彙の欠落検知 · Gemini COPYPASTE 生成
 *
 *   node scripts/scaffold-hub-search-vocab.mjs           # 欠落一覧（あれば exit 1）
 *   node scripts/scaffold-hub-search-vocab.mjs --write-prompt
 *   node scripts/scaffold-hub-search-vocab.mjs --check   # verify 用（欠落で fail）
 *
 * 正本プロンプト: docs/prompts/search-dictionary-prompt-v2.md
 * 欠落埋め: docs/prompts/hub-search-synonyms-intent-gap-gemini.md
 * Intent MECE: docs/research/search/Gemini-Intent-Dictionary-Prompt.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function coverage() {
  const registry = loadJson('data/tool-registry.json');
  const hubCards = loadJson('data/hub-cards.json');
  const synonyms = loadJson('data/synonyms.json');
  const intentMap = loadJson('data/tool-intent-map.json');
  const dictDir = path.join(ROOT, 'data/search-dictionary');

  const hubIds = [...new Set((hubCards.cards || []).map((c) => c.toolId))].sort();
  const dictIds = new Set(
    fs.existsSync(dictDir)
      ? fs.readdirSync(dictDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : []
  );
  const synCover = new Set();
  for (const e of synonyms.entries || []) {
    for (const id of e.toolIds || []) synCover.add(id);
  }
  const intentCover = new Set();
  for (const e of intentMap.entries || []) {
    for (const id of e.toolIds || []) intentCover.add(id);
  }

  const missingDict = hubIds.filter((id) => !dictIds.has(id));
  const missingSyn = hubIds.filter((id) => !synCover.has(id));
  const missingIntent = hubIds.filter((id) => !intentCover.has(id));

  const cards = Object.fromEntries((hubCards.cards || []).map((c) => [c.toolId, c]));
  const tools = registry.tools || {};

  return { hubIds, missingDict, missingSyn, missingIntent, cards, tools };
}

function productBlock(id, tools, cards) {
  const t = tools[id] || {};
  const card = cards[id] || {};
  return [
    `## ${id} / ${t.conceptName || id}`,
    `- productName: ${t.productName || ''}`,
    `- navLabel: ${t.navLabel || ''}`,
    `- categoryId: ${t.categoryId || ''}`,
    `- hub blurb: ${card.blurb || '（未記入）'}`,
    `- 機能捏造禁止。blurb と仕様に無い能力を語彙に入れない。`,
    '',
  ].join('\n');
}

function buildPrompt(cov) {
  const needDict = cov.missingDict;
  const needSyn = cov.missingSyn;
  const needIntent = cov.missingIntent;
  const all = [...new Set([...needDict, ...needSyn, ...needIntent])].sort();

  const sections = all.map((id) => productBlock(id, cov.tools, cov.cards)).join('\n');

  return `# ROLE

あなたは Information Architecture、Search UX、日本語情報検索、JTBD、UX Writing の専門家です。
礼賛・前置き・Markdown 解説は不要です。指定の JSON だけ出力してください。

# プロダクト

SUGUDASU（すぐだす）https://sugudasu.com/
- 登録不要 · ブラウザ完結 · 原則非送信 · 無料の実務 Web 工具集
- Hub 検索は AI / Embedding ではない。辞書・同義語・意図マップの部分一致検索
- 正本プロンプト: search-dictionary-prompt-v2 · Intent MECE 4バケツ必須

# 今回の仕事（MECE）

欠落ツール向けに次を作る（存在する toolId のみ）。

1. search-dictionary/{toolId}.json 用（欠落がある場合のみ）
2. synonyms.json 追記 … { "terms": string[], "toolIds": string[] }
3. tool-intent-map.json 追記 … { "keyword": string, "toolIds": string[], "weight": number }

# Intent / terms の MECE 4バケツ（必須）

terms / keyword を出す前に次へ分類すること。
1. やりたいこと（動詞・JTBD）
2. 対象物・成果物（名詞）
3. 表記ゆれ・口語・略称
4. 取り違え防止（commonMistakes · 他ツールへ誤ルーティングしうる語）

# 絶対禁止

1. 存在しない toolId
2. 機能捏造（クラウド同期・ログイン・AI要約等）
3. マーケ空語 alone
4. 英語偏重（PDF/JSON/CSV/QR 等は可）
5. 1 toolId に無関係 terms を大量付着
6. weight は 80〜100 の整数
7. 前置き・コードフェンス禁止。**JSON オブジェクト 1 個だけ**

# 出力フォーマット

{
  "dictionaries": [
    {
      "toolId": "…",
      "aliases": [],
      "jobsShort": [],
      "jobsLong": [],
      "keywords": [],
      "hiddenKeywords": [],
      "commonMistakes": [{ "query": "…", "meant": "…", "note": "…" }],
      "priority": {},
      "relatedProducts": []
    }
  ],
  "synonymsAdd": [
    { "terms": ["…"], "toolIds": ["…"] }
  ],
  "intentAdd": [
    { "keyword": "…", "toolIds": ["…"], "weight": 100 }
  ],
  "notes": []
}

制約:
- dictionaries: 欠落 dict の toolId をすべてカバー（不要なら []）
- synonymsAdd: 欠落 synonyms の toolId をすべて最低1エントリ
- intentAdd: 欠落 intent の toolId をすべてカバー（各2〜5 keyword）
- 1 synonyms エントリの terms は 3〜8 語

# 欠落一覧

- search-dictionary 欠落: ${needDict.length ? needDict.join(', ') : '（なし）'}
- synonyms 欠落: ${needSyn.length ? needSyn.join(', ') : '（なし）'}
- tool-intent-map 欠落: ${needIntent.length ? needIntent.join(', ') : '（なし）'}

# 製品カード（機能はこれ以外捏造しない）

${sections || '（欠落なし）'}

# 作業開始

上記フォーマットの JSON のみ出力せよ。
`;
}

function main() {
  const cov = coverage();
  const gaps =
    cov.missingDict.length + cov.missingSyn.length + cov.missingIntent.length;

  console.log(
    `[hub-search-vocab] hub=${cov.hubIds.length} missing dict=${cov.missingDict.length} syn=${cov.missingSyn.length} intent=${cov.missingIntent.length}`
  );
  if (cov.missingDict.length) console.log('  dict:', cov.missingDict.join(', '));
  if (cov.missingSyn.length) console.log('  syn:', cov.missingSyn.join(', '));
  if (cov.missingIntent.length) console.log('  intent:', cov.missingIntent.join(', '));

  if (args.has('--write-prompt')) {
    const outDir = path.join(ROOT, 'docs/prompts/generated');
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const outPath = path.join(outDir, `hub-search-vocab-gap-${stamp}.md`);
    const body = [
      '# 自動生成 · Hub 検索語彙ギャップ COPYPASTE',
      '',
      `生成: ${new Date().toISOString()}`,
      '手順: 下記を Gemini に貼る → JSON を Cursor で data/ へマージ → `npm run validate:hub-ia`',
      '正本: `docs/prompts/hub-search-vocab-on-new-tool.md`',
      '',
      '---',
      '',
      '```text',
      buildPrompt(cov).trimEnd(),
      '```',
      '',
    ].join('\n');
    fs.writeFileSync(outPath, body, 'utf8');
    console.log(`[hub-search-vocab] wrote ${path.relative(ROOT, outPath)}`);
  }

  if (gaps) {
    console.error(
      '[hub-search-vocab] FAIL: Hub 検索語彙欠落。新規ツールは search-dictionary + synonyms + intent が必須（Playbook §1.5 A15）'
    );
    if (!args.has('--write-prompt')) {
      console.error('  → npm run scaffold:hub-search-vocab -- --write-prompt で Gemini 用プロンプトを生成');
    } else {
      console.error('  → 生成プロンプトを Gemini に渡し、JSON を data/ へマージして再実行');
    }
    process.exit(1);
  }

  console.log('[hub-search-vocab] OK: coverage complete');
}

main();
