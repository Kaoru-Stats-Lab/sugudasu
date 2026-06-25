import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../tools/statements.html');
let h = fs.readFileSync(p, 'utf8');

const reps = [
  [/ class="text-xs text-slate-600"/g, ''],
  [/ class="text-xs"/g, ''],
  [/ class="text-\[10px\] text-slate-500 leading-relaxed"/g, ' class="sg-info-caption"'],
  [/ class="text-blue-600 hover:underline font-semibold"/g, ''],
  [/ class="text-blue-600 hover:underline"/g, ''],
  [/ w-full text-\[(10|11)px\]/g, ' w-full'],
  [/<footer class="pt-4 border-t border-slate-200 space-y-2 text-xs">/g, '<footer class="space-y-2">'],
  [/<p class="font-semibold text-slate-800">関連ページ<\/p>/g, '<p><strong>関連ページ</strong></p>'],
  [/<p class="text-slate-600">/g, '<p>'],
  [/<p class="text-\[10px\] text-slate-500 pt-2">/g, '<p class="sg-info-caption pt-2">'],
  [/<summary class="font-bold text-xs text-slate-800 cursor-pointer select-none"/g, '<summary class="font-bold cursor-pointer select-none"'],
];

for (const [from, to] of reps) h = h.replace(from, to);

fs.writeFileSync(p, h);
console.log('[clean-statements] done');
