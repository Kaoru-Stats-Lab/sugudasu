import assert from 'node:assert/strict';
import {
  TEXT_PREVIEW_CHARS,
  TEXT_PREVIEW_LINES,
  TABLE_PREVIEW_ROWS,
  buildCardFromPaste,
  copyPayload,
  imageFormatLabel,
  isHexColor,
  isSingleUrl,
  isSupportedImageMime,
  isTablePaste,
  nextSlotIndex,
  normalizeTableTsv,
  slotIndices,
  tablePreview,
  textPreview,
  urlDisplayTitle,
} from '../assets/clip-stash-engine.js';

assert.equal(isHexColor('#abc'), true);
assert.equal(isHexColor('#AABBCC'), true);
assert.equal(isHexColor('abc'), false);
assert.equal(isHexColor('#ghijkl'), false);

assert.equal(isSingleUrl('https://example.com/path'), true);
assert.equal(isSingleUrl('not a url'), false);
assert.equal(isSingleUrl('https://a.com\nhttps://b.com'), false);

assert.equal(isTablePaste('a\tb\nc\td'), true);
assert.equal(isTablePaste('single line'), false);

assert.equal(isSupportedImageMime('image/png'), true);
assert.equal(isSupportedImageMime('image/gif'), false);
assert.equal(isSupportedImageMime('image/jpeg'), true);

{
  const { tsv, rows, cols } = normalizeTableTsv('a,b\nc,d');
  assert.equal(tsv, 'a\tb\nc\td');
  assert.equal(rows, 2);
  assert.equal(cols, 2);
}

{
  const long = 'x'.repeat(400);
  const p = textPreview(`${long}\nline2`);
  assert.ok(p.body.length <= TEXT_PREVIEW_CHARS + 1);
  assert.equal(p.charCount, 406);
  assert.equal(p.lineCount, 2);
}

{
  const lines = Array.from({ length: 20 }, (_, i) => `r${i}\tc${i}`).join('\n');
  const p = tablePreview(lines);
  assert.equal(p.rows, 20);
  assert.equal(p.cols, 2);
  assert.equal(p.body.split('\n').length, TABLE_PREVIEW_ROWS);
}

assert.match(urlDisplayTitle('https://www.example.com/x'), /^example\.com$/);

assert.equal(imageFormatLabel('image/png'), 'PNG');
assert.equal(imageFormatLabel('image/gif'), 'Image');

assert.equal(nextSlotIndex([]), 0);
assert.equal(nextSlotIndex([{ order: 0 }, { order: 2 }]), 1);
assert.equal(nextSlotIndex([{ order: 0 }, { order: 1 }]), 2);

assert.deepEqual(slotIndices([{ order: 0 }, { order: 2 }]), [0, 1, 2]);
assert.deepEqual(slotIndices([]), []);

{
  const card = buildCardFromPaste({ kind: 'text', text: 'hello' }, 0);
  assert.equal(card.type, 'text');
  assert.equal(card.text, 'hello');
  assert.equal(card.order, 0);
  assert.ok(card.id);
}

{
  const card = buildCardFromPaste(
    { kind: 'table', tableTsv: 'a\tb', tableRows: 1, tableCols: 2 },
    1,
  );
  assert.equal(copyPayload(card), 'a\tb');
}

{
  const card = buildCardFromPaste({ kind: 'color', colorHex: '#ff00aa' }, 2);
  assert.equal(copyPayload(card), '#ff00aa');
}

console.log('clip-stash-engine.test.mjs: ok');
