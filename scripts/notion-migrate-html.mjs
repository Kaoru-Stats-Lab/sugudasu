/**
 * Notion Like rollout — FAQ HTML cleanup · hint · segment · eyebrow
 * DESIGN_NOTION_SUGUDASU_ADAPT.md §7 · Phase B/C
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = path.join(ROOT, 'tools');

const CHEVRON =
  /<span class="ml-1\.5 shrink-0 transition-transform duration-200"><svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"\/><\/svg><\/span>\s*/g;

const SUMMARY_FLEX =
  /<summary class="flex justify-between items-center font-bold text-xs sm:text-sm text-slate-800 cursor-pointer select-none">\s*\n?\s*<span>([\s\S]*?)<\/span>\s*\n?\s*(?:<span class="ml-1\.5[\s\S]*?<\/span>\s*)?<\/summary>/g;

function migrateFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;

  html = html.replace(/<details class="sg-faq[^"]*">/g, '<details class="sg-faq">');
  html = html.replace(SUMMARY_FLEX, '<summary>$1</summary>');
  html = html.replace(CHEVRON, '');

  html = html.replace(
    /<div class="mt-3 text-xs leading-relaxed text-slate-600 space-y-2 pt-2 border-t border-slate-200\/60">/g,
    '<div class="text-xs leading-relaxed text-slate-600 space-y-2">',
  );
  html = html.replace(
    /<div class="mt-3 text-xs leading-relaxed text-slate-600 space-y-2">/g,
    '<div class="text-xs leading-relaxed text-slate-600 space-y-2">',
  );

  html = html.replace(
    /<p class="text-xs text-slate-500 text-center mb-6 -mt-2">/g,
    '<p class="sg-faq-lead text-xs text-slate-500 mb-6 -mt-2">',
  );
  html = html.replace(/sg-faq-list space-y-3 max-w-3xl mx-auto/g, 'sg-faq-list');
  html = html.replace(/sg-faq-list space-y-3/g, 'sg-faq-list');

  html = html.replace(/class="text-indigo-950"/g, '');
  html = html.replace(/class="text-blue-900"/g, '');
  html = html.replace(/<strong class="text-slate-800">/g, '<strong>');
  html = html.replace(/\sclass=""/g, '');
  html = html.replace(/ sg-notion-callout/g, '');

  html = html.replace(
    /<p class="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">([\s\S]*?)<\/p>/g,
    '<p class="sg-notion-eyebrow mb-2">$1</p>',
  );

  html = html.replace(/class="(sg-segment sg-[^"]*)"/g, (match, cls) => {
    if (cls.includes('sg-segment--notion-soft')) return match;
    return `class="${cls} sg-segment--notion-soft"`;
  });

  if (html !== before) {
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

const changed = [];
for (const name of fs.readdirSync(TOOLS)) {
  if (!name.endsWith('.html')) continue;
  const fp = path.join(TOOLS, name);
  if (migrateFile(fp)) changed.push(name);
}

console.log(`[notion-migrate] updated ${changed.length} files:`);
changed.forEach((f) => console.log(`  - ${f}`));
