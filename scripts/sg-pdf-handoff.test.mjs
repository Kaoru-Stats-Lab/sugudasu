#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  isAllowedPdfHandoffTo,
  sanitizePdfHandoffFileName,
  isPdfHandoffExpired,
  PDF_HANDOFF_TTL_MS,
} from '../assets/sg-pdf-handoff.js';

assert.equal(isAllowedPdfHandoffTo('pdf-fill'), true);
assert.equal(isAllowedPdfHandoffTo('annotate'), true);
assert.equal(isAllowedPdfHandoffTo('pdf-images'), false);
assert.equal(isAllowedPdfHandoffTo(''), false);

assert.equal(sanitizePdfHandoffFileName('a/b:c.pdf'), 'a_b_c.pdf');
assert.equal(sanitizePdfHandoffFileName('scan'), 'scan.pdf');
assert.equal(sanitizePdfHandoffFileName(''), 'document.pdf');

assert.equal(isPdfHandoffExpired(Date.now()), false);
assert.equal(isPdfHandoffExpired(Date.now() - PDF_HANDOFF_TTL_MS - 1), true);
assert.equal(isPdfHandoffExpired(0), true);

console.log('sg-pdf-handoff.test.mjs: OK');
