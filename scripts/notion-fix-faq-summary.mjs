import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools');

const BROKEN =
  /<summary>([\s\S]*?)<\/span>\s*(?:<svg class="w-5 h-5[\s\S]*?<\/svg>\s*)?<\/summary>/g;

for (const name of fs.readdirSync(TOOLS)) {
  if (!name.endsWith('.html')) continue;
  const fp = path.join(TOOLS, name);
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;
  html = html.replace(BROKEN, (_, text) => `<summary>${text.trim()}</summary>`);
  if (html !== before) fs.writeFileSync(fp, html, 'utf8');
}
console.log('[faq-fix] cleaned broken summary markup');
