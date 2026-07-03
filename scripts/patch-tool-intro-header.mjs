import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'tools');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const p = path.join(dir, f);
  const orig = fs.readFileSync(p, 'utf8');
  const next = orig.replace(/<header class="max-w-3xl /g, '<header class="sg-tool-intro ');
  if (next !== orig) {
    fs.writeFileSync(p, next, 'utf8');
    console.log('updated:', f);
  }
}
