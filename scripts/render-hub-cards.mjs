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

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  const parts = ['<section id="sg-hub-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="ツール一覧">'];
  for (const card of cards) {
    const tool = registry.tools[card.toolId];
    if (!tool) continue;
    const title = tool.conceptName || tool.navLabel || card.toolId;
    const searchBits = [
      tool.conceptName,
      tool.navLabel,
      tool.productName,
      tool.name,
      card.blurb,
      card.eyebrow,
      ...(synByTool.get(card.toolId) || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    parts.push(
      `<a href="${esc(card.href)}" class="sg-hub-card sg-card p-5" data-tool-id="${esc(card.toolId)}" data-category-id="${esc(tool.categoryId || '')}" data-search="${esc(searchBits)}">`
    );
    parts.push(
      `<button type="button" class="sg-hub-fav" data-fav-toggle="${esc(card.toolId)}" aria-label="お気に入り" aria-pressed="false" title="お気に入り">☆</button>`
    );
    if (card.eyebrow) {
      parts.push(`<p class="sg-hub-card__eyebrow">${esc(card.eyebrow)}</p>`);
    }
    parts.push(`<h3 class="sg-hub-card__title">${esc(title)}</h3>`);
    parts.push(`<p class="text-xs text-slate-500 mt-2">${esc(card.blurb)}</p>`);
    if (card.meta) {
      parts.push(`<p class="sg-hub-card__meta">${esc(card.meta)}</p>`);
    }
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
