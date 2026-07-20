#!/usr/bin/env node
/**
 * data/hub-cards.json + tool-registry → tools/hub.html のカードグリッドを生成
 * （Hub UI にカテゴリ名・検索語をハードコードしない）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HUB = path.join(ROOT, 'tools', 'hub.html');
const START = '<!-- hub-cards:start -->';
const END = '<!-- hub-cards:end -->';

const STATUS_LABEL = { new: 'NEW', beta: 'Beta', ga: '正式' };
const SPEC_LABEL = { local: '完全ローカル', pc: 'PC推奨' };

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgesHtml(badges) {
  if (!badges || typeof badges !== 'object') return '';
  const bits = [];
  const st = badges.status;
  if (st && STATUS_LABEL[st]) {
    // DECISION: status のみ強調。popular バッジは一覧で押し売りしない（data-popular は残す）。
    bits.push(
      `<span class="sg-hub-badge sg-hub-badge--status sg-hub-badge--${esc(st)}">${STATUS_LABEL[st]}</span>`
    );
  }
  for (const sp of badges.spec || []) {
    if (SPEC_LABEL[sp]) {
      // 仕様は弱表示（階層を落とす）。カードサイズは変えない。
      bits.push(
        `<span class="sg-hub-badge sg-hub-badge--spec sg-hub-badge--${esc(sp)}">${SPEC_LABEL[sp]}</span>`
      );
    }
  }
  if (!bits.length) return '';
  return `<div class="sg-hub-card__badges">${bits.join('')}</div>`;
}

function renderCards() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-registry.json'), 'utf8'));
  const { cards } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-cards.json'), 'utf8'));
  const synonyms = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/synonyms.json'), 'utf8'));
  const synByTool = new Map();
  for (const e of synonyms.entries || []) {
    for (const tid of e.toolIds || []) {
      const arr = synByTool.get(tid) || [];
      arr.push(...(e.terms || []));
      synByTool.set(tid, arr);
    }
  }

  const parts = [
    '<section id="sg-hub-grid" class="sg-hub-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="すべてのツール">',
  ];
  for (const card of cards) {
    const tool = registry.tools[card.toolId];
    if (!tool) continue;
    const title = tool.conceptName || tool.navLabel || card.toolId;
    const badgeBits = [];
    const b = card.badges || {};
    if (b.status) badgeBits.push(b.status);
    if (Array.isArray(b.spec)) badgeBits.push(...b.spec);
    if (b.popular) badgeBits.push('人気');
    const searchBits = [
      tool.conceptName,
      tool.navLabel,
      tool.productName,
      tool.name,
      card.blurb,
      ...badgeBits,
      ...(synByTool.get(card.toolId) || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    parts.push(
      `<a href="${esc(card.href)}" class="sg-hub-card sg-card p-5" data-tool-id="${esc(card.toolId)}" data-category-id="${esc(tool.categoryId || '')}" data-search="${esc(searchBits)}" data-popular="${b.popular ? '1' : '0'}">`
    );
    parts.push(
      `<button type="button" class="sg-hub-fav" data-fav-toggle="${esc(card.toolId)}" aria-label="お気に入り" aria-pressed="false" title="お気に入り">☆</button>`
    );
    parts.push(badgesHtml(card.badges));
    parts.push(`<h3 class="sg-hub-card__title">${esc(title)}</h3>`);
    parts.push(`<p class="sg-hub-card__blurb">${esc(card.blurb)}</p>`);
    parts.push('</a>');
  }
  parts.push('</section>');
  return parts.join('\n        ');
}

function main() {
  let html = fs.readFileSync(HUB, 'utf8');
  if (!html.includes(START) || !html.includes(END)) {
    console.error('[render-hub-cards] hub.html に hub-cards:start/end マーカーがありません');
    process.exit(1);
  }
  const block = `${START}\n        ${renderCards()}\n        ${END}`;
  html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  fs.writeFileSync(HUB, html, 'utf8');
  console.log('[render-hub-cards] OK');
}

main();
