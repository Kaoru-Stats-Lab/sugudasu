import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools');

for (const name of fs.readdirSync(TOOLS)) {
  if (!name.endsWith('.html')) continue;
  const fp = path.join(TOOLS, name);
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;
  html = html
    .split('\n')
    .map((line) => {
      if (!line.includes('sg-segment--notion-soft')) return line;
      if (/class="sg-segment sg-/.test(line)) return line;
      return line.replace(/ sg-segment--notion-soft/g, '');
    })
    .join('\n');
  if (html !== before) fs.writeFileSync(fp, html, 'utf8');
}
console.log('[notion-fix] cleaned misplaced sg-segment--notion-soft');
