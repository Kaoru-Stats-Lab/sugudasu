#!/usr/bin/env node
/**
 * pdf-fill-engine — 単体テスト（純関数）
 * Run: node scripts/pdf-fill-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  softSnap,
  hardSnap1D,
  snapBox,
  collectGuideLines,
  buildSuggestedFileName,
  sanitizeFilePart,
  checkLimits,
  pushUndo,
  editedPageIndexes,
  isPageEdited,
  clampFontSize,
  fontFamilyCss,
  resizeKeepingAspect,
  resizeFree,
  restoreClipboardBlackBackground,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_DEFAULT,
  MAX_FILE_BYTES,
  MAX_PAGES,
  buildInputStrip,
  parseDatetimeInput,
  applyDatetimeToSlots,
  looksLikeDatetimeBundle,
  snapStrengthForSpeed,
  buildMarker,
  reflowInputStripX,
  SNAP_STRENGTH_FAST,
  SNAP_STRENGTH_SLOW,
  SNAP_ENTER_PX,
  SNAP_EXIT_PX,
  clampSlotDxPreserveOrder,
  normalizeEraYearInput,
} from '../assets/pdf-fill-engine.js';

{
  // Hard Snap: enter 内はほぼ100%吸着
  const near = softSnap(98, [0, 100, 200], SNAP_ENTER_PX, SNAP_STRENGTH_SLOW);
  assert.equal(near.snapped, true);
  assert.equal(near.value, 100);
  assert.equal(near.guide, 100);

  const far = softSnap(50, [0, 100], SNAP_ENTER_PX, SNAP_STRENGTH_SLOW);
  assert.equal(far.snapped, false);
  assert.equal(far.value, 50);
}

{
  // ヒステリシス: enter 9 / exit 15
  const enter = hardSnap1D(98, [100], [], null, SNAP_STRENGTH_SLOW, SNAP_ENTER_PX, SNAP_EXIT_PX);
  assert.equal(enter.value, 100);
  assert.equal(enter.held, 100);
  const hold = hardSnap1D(110, [100], [], 100, SNAP_STRENGTH_SLOW, SNAP_ENTER_PX, SNAP_EXIT_PX);
  assert.equal(hold.value, 100);
  assert.equal(hold.snapped, true);
  const release = hardSnap1D(120, [100], [], 100, SNAP_STRENGTH_SLOW, SNAP_ENTER_PX, SNAP_EXIT_PX);
  assert.equal(release.snapped, false);
  assert.equal(release.value, 120);
}

{
  // 紙優先（Object が近くても page center を取る）
  const guides = collectGuideLines(
    { width: 200, height: 100 },
    [{ id: 'a', x: 95, y: 10, w: 10, h: 10 }],
    'moving'
  );
  assert.ok(guides.pageXs.includes(100));
  assert.ok(guides.objectXs.includes(95));
  const snapped = snapBox(
    { x: 96, y: 40, w: 20, h: 10 },
    guides,
    SNAP_ENTER_PX,
    SNAP_STRENGTH_SLOW,
    { x: null, y: null }
  );
  assert.equal(snapped.x, 100);
  assert.ok(snapped.guidesX.includes(100));
}

{
  assert.equal(clampFontSize(16), 16);
  assert.equal(clampFontSize(3), FONT_SIZE_MIN);
  assert.equal(clampFontSize(999), FONT_SIZE_MAX);
  assert.equal(clampFontSize(NaN), FONT_SIZE_DEFAULT);
  assert.ok(fontFamilyCss('gothic').includes('sans-serif'));
  assert.ok(fontFamilyCss('mincho').includes('serif'));
  assert.ok(fontFamilyCss('gothic').includes('BIZ UD'));
  assert.ok(fontFamilyCss('mincho').includes('BIZ UD'));
}

{
  const w = 8;
  const h = 8;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }
  const mid = ((h / 2) | 0) * w + ((w / 2) | 0);
  data[mid * 4] = 200;
  data[mid * 4 + 1] = 40;
  data[mid * 4 + 2] = 40;
  data[mid * 4 + 3] = 255;
  const imageData = { data, width: w, height: h };
  assert.equal(restoreClipboardBlackBackground(imageData), true);
  assert.equal(data[3], 0);
  assert.equal(data[mid * 4 + 3], 255);
}

{
  const locked = resizeKeepingAspect(
    { x: 10, y: 10, w: 100, h: 50 },
    'se',
    { x: 210, y: 200 },
    { min: 8, maxW: 400, maxH: 400 }
  );
  assert.ok(Math.abs(locked.w / locked.h - 2) < 0.01);
  const free = resizeFree(
    { x: 10, y: 10, w: 100, h: 50 },
    'se',
    { x: 210, y: 80 },
    { min: 8, maxW: 400, maxH: 400 }
  );
  assert.equal(free.w, 200);
  assert.equal(free.h, 70);
}

{
  const guides = collectGuideLines(
    { width: 200, height: 100 },
    [{ id: 'a', x: 40, y: 20, w: 20, h: 10 }],
    null
  );
  assert.ok(guides.xs.includes(0));
  assert.ok(guides.xs.includes(100));
  assert.ok(guides.xs.includes(40));
  assert.ok(guides.ys.includes(50));
  assert.ok(guides.pageXs.includes(100));
  assert.ok(guides.objectXs.includes(40));
}

{
  const snapped = snapBox(
    { x: 98, y: 48, w: 20, h: 10 },
    { xs: [0, 100, 200], ys: [0, 50, 100] },
    SNAP_ENTER_PX,
    SNAP_STRENGTH_SLOW
  );
  assert.ok(Math.abs(snapped.x - 100) < 0.01 || Math.abs(snapped.x + 10 - 100) < 0.01);
  assert.ok(snapped.guidesX.length + snapped.guidesY.length >= 1);
}

{
  assert.equal(sanitizeFilePart('契約 書*A'), '契約_書_A');
  const name = buildSuggestedFileName({
    date: new Date(2026, 6, 22),
    docType: '住所変更申請書',
    personName: '薫',
  });
  assert.equal(name, '2026-07-22_住所変更申請書_薫.pdf');
  assert.equal(
    buildSuggestedFileName({ date: new Date(2026, 0, 5), docType: '書類' }),
    '2026-01-05_書類.pdf'
  );
}

{
  assert.equal(checkLimits(100).ok, true);
  assert.equal(checkLimits(MAX_FILE_BYTES + 1).ok, false);
  assert.equal(checkLimits(10, MAX_PAGES + 1).ok, false);
  assert.equal(checkLimits(10, MAX_PAGES).ok, true);
}

{
  const stack = [];
  pushUndo(stack, [{ id: '1' }], 2);
  pushUndo(stack, [{ id: '2' }], 2);
  pushUndo(stack, [{ id: '3' }], 2);
  assert.equal(stack.length, 2);
  assert.equal(stack[0][0].id, '2');
}

{
  const pages = editedPageIndexes([
    { page: 3 },
    { page: 1 },
    { page: 3 },
    { page: 1 },
  ]);
  assert.deepEqual(pages, [1, 3]);
  assert.equal(isPageEdited([{ page: 1 }], 1), true);
  assert.equal(isPageEdited([{ page: 1 }], 0), false);
  assert.deepEqual(editedPageIndexes([]), []);
}

{
  const strip = buildInputStrip('datetime', { page: 0, x: 10, y: 20, fontSize: 14 });
  assert.equal(strip.type, 'input-strip');
  assert.equal(strip.template, 'datetime');
  assert.equal(strip.slots.length, 5);
  assert.deepEqual(strip.slots.map((s) => s.id), ['year', 'month', 'day', 'hour', 'minute']);
  assert.ok(strip.w > strip.slots[0].w);
  assert.equal(strip.slots[0].dx, 0);
  assert.ok(strip.slots[1].dx > strip.slots[0].dx);
}

{
  assert.deepEqual(parseDatetimeInput('2026/07/22'), {
    year: '2026', month: '07', day: '22', hour: '', minute: '',
  });
  assert.deepEqual(parseDatetimeInput('2026-07-22'), {
    year: '2026', month: '07', day: '22', hour: '', minute: '',
  });
  assert.deepEqual(parseDatetimeInput('2026/07/22 14:30'), {
    year: '2026', month: '07', day: '22', hour: '14', minute: '30',
  });
  assert.deepEqual(parseDatetimeInput('202607221430'), {
    year: '2026', month: '07', day: '22', hour: '14', minute: '30',
  });
  assert.deepEqual(parseDatetimeInput('14:30'), {
    year: '', month: '', day: '', hour: '14', minute: '30',
  });
  assert.deepEqual(parseDatetimeInput('1430'), {
    year: '', month: '', day: '', hour: '14', minute: '30',
  });
  assert.deepEqual(parseDatetimeInput('令和7年7月22日'), {
    year: '令和7', month: '07', day: '22', hour: '', minute: '',
  });
  assert.deepEqual(parseDatetimeInput('令和7年7月22日14時30分'), {
    year: '令和7', month: '07', day: '22', hour: '14', minute: '30',
  });
}

{
  assert.equal(looksLikeDatetimeBundle('2026/07/22'), true);
  assert.equal(looksLikeDatetimeBundle('14:30'), true);
  assert.equal(looksLikeDatetimeBundle('7'), false);
  assert.equal(looksLikeDatetimeBundle('令和7'), false);
  assert.equal(looksLikeDatetimeBundle('令和7年7月22日'), true);
  const slots = [
    { id: 'year', value: '2020' },
    { id: 'month', value: '01' },
    { id: 'day', value: '01' },
    { id: 'hour', value: '09' },
    { id: 'minute', value: '00' },
  ];
  const next = applyDatetimeToSlots(slots, parseDatetimeInput('14:30'));
  assert.equal(next.find((s) => s.id === 'year').value, '2020');
  assert.equal(next.find((s) => s.id === 'hour').value, '14');
  assert.equal(next.find((s) => s.id === 'minute').value, '30');
}

{
  const slow = snapStrengthForSpeed(0);
  const fast = snapStrengthForSpeed(2000);
  assert.ok(slow > fast);
  assert.ok(slow <= SNAP_STRENGTH_SLOW + 0.001);
  assert.ok(fast >= SNAP_STRENGTH_FAST - 0.001);
}

{
  const m = buildMarker('oval', { page: 0, x: 10, y: 20 });
  assert.equal(m.type, 'marker');
  assert.equal(m.marker, 'oval');
  assert.equal(m.w, m.h);
}

{
  const strip = {
    x: 100,
    w: 50,
    slots: [
      { dx: 10, w: 20 },
      { dx: 40, w: 20 },
    ],
  };
  reflowInputStripX(strip);
  assert.equal(strip.slots[0].dx, 0);
  assert.equal(strip.x, 110);
  assert.equal(strip.w, 50);
}

{
  const slots = [
    { id: 'year', dx: 0, w: 40 },
    { id: 'month', dx: 50, w: 30 },
    { id: 'day', dx: 90, w: 30 },
  ];
  // 月を年の左側へは越えられない
  assert.equal(clampSlotDxPreserveOrder(slots, 'month', -10), 46);
  // 月を日の右側へは越えられない
  assert.equal(clampSlotDxPreserveOrder(slots, 'month', 200), 54);
  assert.equal(normalizeEraYearInput('令和7'), '令和7');
  assert.equal(normalizeEraYearInput('れいわ７年'), '令和7');
  assert.equal(normalizeEraYearInput('2026'), '2026');
}

console.log('[pdf-fill-engine.test] OK');
