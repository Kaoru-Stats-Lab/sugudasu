import assert from 'node:assert/strict';
import {
  classifyCategory,
  fillTemplate,
  formatStars,
  normalizeSignals,
  runActionEngine,
  selectActions,
  starsVariant,
} from '../extensions/mention/lib/action-engine.js';
import { DEFAULT_TEMPLATES } from '../extensions/mention/lib/templates-default.js';

assert.equal(formatStars(5), '★★★★★');
assert.equal(formatStars(3), '★★★☆☆');
assert.equal(formatStars(null), '');

assert.equal(
  fillTemplate('Hi {{customer}} / {{missing}} / {{store}}', { customer: '太郎', store: '本店' }),
  'Hi 太郎 /  / 本店'
);

{
  const signals = normalizeSignals({
    adapterId: 'google_maps',
    author: '花子',
    stars: 5,
    hasReply: false,
    title: 'レビュー',
    url: 'https://maps.google.com/?q=1',
    body: '最高でした',
  });
  assert.equal(classifyCategory(signals), 'google_review');
  assert.equal(starsVariant(signals), 'stars_45');
  assert.deepEqual(selectActions(signals), ['google_reply', 'slack_share', 'done']);

  const engine = runActionEngine(signals, { brand: 'SUGUDASU', store: '渋谷' }, DEFAULT_TEMPLATES);
  assert.equal(engine.category, 'google_review');
  assert.ok(engine.filled.google_reply.includes('花子'));
  assert.ok(engine.filled.google_reply.includes('SUGUDASU'));
  assert.ok(engine.filled.google_reply.includes('渋谷'));
  assert.ok(engine.filled.google_reply.includes('★★★★★'));
}

{
  const signals = normalizeSignals({
    adapterId: 'google_maps',
    stars: 1,
    hasReply: false,
    author: '不満',
    body: '待ち時間が長い',
    url: 'https://maps.google.com/?q=2',
  });
  assert.deepEqual(selectActions(signals), ['internal_share', 'note_template', 'done']);
  const engine = runActionEngine(signals, { brand: '店' }, DEFAULT_TEMPLATES);
  assert.ok(engine.filled.internal_share.includes('要確認') || engine.filled.internal_share.includes('社内'));
  assert.equal(engine.actions.includes('google_reply'), false);
}

{
  const signals = normalizeSignals({
    adapterId: 'google_maps',
    stars: 5,
    hasReply: true,
    url: 'https://maps.google.com/?q=3',
  });
  assert.deepEqual(selectActions(signals), ['slack_share', 'done']);
}

{
  const signals = normalizeSignals({
    adapterId: 'web',
    title: '紹介記事',
    url: 'https://example.com/a',
    body: '便利でした',
  });
  assert.equal(classifyCategory(signals), 'web_article');
  assert.deepEqual(selectActions(signals), ['quote_post', 'thanks_mail', 'slack_share', 'done']);
}

{
  const signals = normalizeSignals({
    adapterId: '',
    supported: false,
    url: 'https://example.com/x',
  });
  assert.equal(classifyCategory(signals), 'other');
  assert.deepEqual(selectActions(signals), ['slack_share', 'done']);
}

console.log('mention-action-engine.test.mjs OK');
