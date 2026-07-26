import assert from 'node:assert/strict';
import {
  TEXT_PREVIEW_CHARS,
  TEXT_PREVIEW_LINES,
  TABLE_PREVIEW_ROWS,
  buildCardFromPaste,
  copyPayload,
  imageFormatLabel,
  classifyInputBridge,
  inputBridgeMessage,
  primaryInputBridge,
  INPUT_BRIDGE_MESSAGES,
  isAcceptedLocalFile,
  isHexColor,
  isPdfFile,
  resolveFileMime,
  isSingleUrl,
  isSupportedImageMime,
  isTablePaste,
  nextSlotIndex,
  normalizeTableTsv,
  slotIndices,
  planMoveToSlot,
  tablePreview,
  textPreview,
  urlDisplayTitle,
  formatTimestamp,
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
assert.equal(isSupportedImageMime('image/gif'), true);
assert.equal(isSupportedImageMime('image/jpeg'), true);
assert.equal(isSupportedImageMime('video/mp4'), false);

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
assert.equal(imageFormatLabel('image/gif'), 'GIF');
assert.equal(isSupportedImageMime('image/gif'), true);
assert.equal(isSupportedImageMime('image/png'), true);
assert.equal(isSupportedImageMime('video/mp4'), false);
assert.equal(isPdfFile('a.pdf', ''), true);
assert.equal(isPdfFile('a.png', 'application/pdf'), true);
assert.equal(isPdfFile('report.pdf', 'image/png'), false);
assert.equal(resolveFileMime({ name: 'x.pdf', type: '' }, 'application/pdf'), 'application/pdf');
assert.equal(resolveFileMime({ name: 'x.pdf', type: 'image/png' }, ''), 'image/png');
assert.equal(isAcceptedLocalFile({ name: 'x.png', type: 'image/png' }), true);
assert.equal(isAcceptedLocalFile({ name: 'x.pdf', type: 'application/pdf' }), true);
assert.equal(isAcceptedLocalFile({ name: 'x.docx', type: '' }), false);
assert.equal(classifyInputBridge({ name: 'sheet.xlsx', type: '' }), 'excel');
assert.equal(classifyInputBridge({ name: 'doc.docx', type: '' }), 'word');
assert.equal(classifyInputBridge({ name: 'deck.pptx', type: '' }), 'powerpoint');
assert.equal(classifyInputBridge({ name: 'pack.zip', type: '' }), 'zip');
assert.equal(classifyInputBridge({ isDirectory: true }), 'folder');
assert.equal(classifyInputBridge({ name: 'shot.png', type: 'image/png' }), null);
assert.equal(
  inputBridgeMessage('excel'),
  INPUT_BRIDGE_MESSAGES.excel,
);
assert.equal(primaryInputBridge(['zip', 'excel']), 'excel');
assert.match(INPUT_BRIDGE_MESSAGES.word, /置けます/);
assert.equal(/非対応/.test(Object.values(INPUT_BRIDGE_MESSAGES).join('')), false);
assert.equal(/\.(png|xlsx|docx)/i.test(Object.values(INPUT_BRIDGE_MESSAGES).join('')), false);

{
  const card = buildCardFromPaste(
    { kind: 'pdf', pdfData: new ArrayBuffer(8), pdfBytes: 8, pdfName: 'brief' },
    0,
  );
  assert.equal(card.type, 'pdf');
  assert.equal(card.pdfName, 'brief');
  assert.equal(card.pdfBytes, 8);
}

assert.equal(nextSlotIndex([]), 0);
assert.equal(nextSlotIndex([{ order: 0 }, { order: 2 }]), 1);
assert.equal(nextSlotIndex([{ order: 0 }, { order: 1 }]), 2);

assert.deepEqual(slotIndices([{ order: 0 }, { order: 2 }]), [0, 1, 2]);
assert.deepEqual(slotIndices([]), []);

{
  // A B C D E _ G H → H を空白(5)へ → A B C D E H G _（他は動かない）
  const board = [
    { id: 'A', order: 0 },
    { id: 'B', order: 1 },
    { id: 'C', order: 2 },
    { id: 'D', order: 3 },
    { id: 'E', order: 4 },
    { id: 'G', order: 6 },
    { id: 'H', order: 7 },
  ];
  const planned = planMoveToSlot(board, 'H', 5);
  assert.deepEqual(
    planned.sort((a, b) => a.order - b.order).map((p) => `${p.id}:${p.order}`),
    ['A:0', 'B:1', 'C:2', 'D:3', 'E:4', 'H:5', 'G:6'],
  );
}

{
  // 占有スロットへは入れ替え（詰めない）
  const board = [
    { id: 'A', order: 0 },
    { id: 'B', order: 1 },
    { id: 'C', order: 2 },
  ];
  assert.deepEqual(
    planMoveToSlot(board, 'A', 2).sort((a, b) => a.order - b.order).map((p) => p.id),
    ['C', 'B', 'A'],
  );
}

{
  // 途中空白を作る移動も許可（B を末尾へ → A _ C）
  const board = [
    { id: 'A', order: 0 },
    { id: 'B', order: 1 },
    { id: 'C', order: 2 },
  ];
  const planned = planMoveToSlot(board, 'B', 3);
  assert.deepEqual(
    planned.sort((a, b) => a.order - b.order).map((p) => `${p.id}:${p.order}`),
    ['A:0', 'C:2', 'B:3'],
  );
}

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

{
  const now = new Date('2026-07-26T12:00:00');
  assert.equal(formatTimestamp(new Date(now.getTime() - 10_000).toISOString(), now), 'たった今');
  assert.equal(formatTimestamp(new Date(now.getTime() - 3 * 60_000).toISOString(), now), '3分前');
  assert.equal(formatTimestamp(new Date(now.getTime() - 15 * 60_000).toISOString(), now), '15分前');
  assert.equal(formatTimestamp(new Date(now.getTime() - 2 * 3600_000).toISOString(), now), '2時間前');
  assert.equal(formatTimestamp(new Date('2026-07-25T18:00:00').toISOString(), now), '昨日');
}

console.log('clip-stash-engine.test.mjs: ok');
