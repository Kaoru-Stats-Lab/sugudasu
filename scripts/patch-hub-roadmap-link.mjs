import fs from 'node:fs';

const path = 'tools/hub.html';
let s = fs.readFileSync(path, 'utf8');

const old = /            <a href="updates\.html" class="text-blue-600 hover:underline font-semibold">更新履歴・改善レポート<\/a>\r?\n            <span class="text-slate-400 mx-2">·<\/span>\r?\n            不具合報告・要望も受け付けています/;

const neu = `            <a href="updates.html" class="text-blue-600 hover:underline font-semibold">更新履歴</a>
            <span class="text-slate-400 mx-2">·</span>
            <a href="roadmap.html" class="text-blue-600 hover:underline font-semibold">開発ロードマップ</a>
            <span class="text-slate-400 mx-2">·</span>
            不具合報告・要望も受け付けています`;

if (!old.test(s)) {
  console.error('hub link block not found');
  process.exit(1);
}

fs.writeFileSync(path, s.replace(old, neu), 'utf8');
console.log('hub roadmap link ok');
