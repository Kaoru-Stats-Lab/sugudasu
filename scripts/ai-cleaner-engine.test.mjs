import assert from 'node:assert/strict';
import {
  cleanJson,
  cleanMarkdown,
  extractCode,
  normalizeWhitespace,
  runClean,
} from '../assets/ai-cleaner-engine.js';

assert.equal(normalizeWhitespace('a\n\n\n\nb'), 'a\n\nb');

{
  const input = 'hello\n\n\n\n---\n\nworld\n\n```\nkeep\n---\nhere\n```\n\n<strong>bold</strong> and <span>x</span>';
  const out = cleanMarkdown(input);
  assert.ok(!out.includes('---\n\nworld') || !/^---$/m.test(out.split('```')[0]));
  assert.ok(out.includes('keep\n---\nhere'));
  assert.ok(out.includes('bold'));
  assert.ok(out.includes('x'));
  assert.ok(!out.includes('<strong>'));
  assert.ok(!out.includes('<span>'));
}

{
  const input = [
    '説明:',
    '',
    '```javascript',
    'const app = {}',
    '```',
    '',
    '補足',
    '',
    '```',
    'second()',
    '```',
  ].join('\n');
  const code = extractCode(input);
  assert.equal(code, 'const app = {}\n\nsecond()');
}

{
  const ok = cleanJson('{"name":"test"}');
  assert.equal(ok.ok, true);
  assert.equal(ok.text, '{\n  "name": "test"\n}');

  const bad = cleanJson('{bad}');
  assert.equal(bad.ok, false);
  assert.equal(bad.error, 'JSONとして解析できません');
}

{
  const r = runClean('code', 'no fences here');
  assert.equal(r.ok, false);
}

{
  // Case1-ish
  const chatgpt = 'もちろんです。\n\n```js\nconst a = 1;\n```\n\nご確認ください。';
  const r = runClean('code', chatgpt);
  assert.equal(r.ok, true);
  assert.equal(r.text, 'const a = 1;');
}

console.log('ai-cleaner-engine.test: ok');
