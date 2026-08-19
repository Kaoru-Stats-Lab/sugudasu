#!/usr/bin/env node
import assert from 'node:assert/strict';
import { PDF_DOC_MAX_FILE_BYTES, PDF_DOC_MAX_PAGES } from '../assets/sg-pdf-limits.js';
import { buildPartialAnnotatedPdf } from '../assets/sg-pdf-partial.js';
import { applyBlackRect, applyMosaicRect } from '../assets/sg-canvas-mask.js';
import { MAX_FILE_BYTES as fillMax, MAX_PAGES as fillPages } from '../assets/pdf-fill-engine.js';
import { MAX_FILE_BYTES as imgMax, MAX_PAGES as imgPages } from '../assets/pdf-images-engine.js';
import { MAX_FILE_BYTES as pickMax, MAX_PAGES as pickPages } from '../assets/pdf-pick-engine.js';
import { MAX_PDF_PAGES } from '../assets/annotate-engine.js';
import {
  applyBlackRect as maskBlack,
  applyMosaicRect as maskMosaic,
} from '../assets/mask-engine.js';

assert.equal(PDF_DOC_MAX_FILE_BYTES, 40 * 1024 * 1024);
assert.equal(PDF_DOC_MAX_PAGES, 50);
assert.equal(fillMax, PDF_DOC_MAX_FILE_BYTES);
assert.equal(fillPages, PDF_DOC_MAX_PAGES);
assert.equal(imgMax, PDF_DOC_MAX_FILE_BYTES);
assert.equal(imgPages, PDF_DOC_MAX_PAGES);
assert.equal(pickMax, PDF_DOC_MAX_FILE_BYTES);
assert.equal(pickPages, PDF_DOC_MAX_PAGES);
assert.equal(MAX_PDF_PAGES, PDF_DOC_MAX_PAGES);

assert.equal(typeof applyBlackRect, 'function');
assert.equal(typeof applyMosaicRect, 'function');
assert.equal(maskBlack, applyBlackRect);
assert.equal(maskMosaic, applyMosaicRect);

{
  const pages = [];
  const sizes = [
    { width: 200, height: 100 },
    { width: 200, height: 100 },
  ];
  const fakePdfLib = {
    PDFDocument: {
      async load() {
        return {
          getPage(i) {
            return { getSize: () => sizes[i] };
          },
        };
      },
      async create() {
        return {
          async embedJpg(bytes) {
            return { __jpg: bytes };
          },
          async embedPng(bytes) {
            return { __png: bytes };
          },
          async copyPages(_src, idxs) {
            return idxs.map((i) => ({ __copied: i }));
          },
          addPage(dims) {
            const page = { dims, draws: [] };
            pages.push(page);
            return {
              drawImage(img, opts) {
                page.draws.push({ img, opts });
              },
            };
          },
          async save() {
            return new Uint8Array([1, 2, 3]);
          },
        };
      },
    },
  };

  const out = await buildPartialAnnotatedPdf(
    new Uint8Array([9]),
    2,
    async (i) => {
      if (i !== 0) return null;
      return {
        bytes: new Uint8Array([7]),
        width: 999,
        height: 888,
        mime: 'image/jpeg',
      };
    },
    {
      importPdfLib: async () => fakePdfLib,
      pageSize: 'source',
    },
  );
  assert.deepEqual([...out], [1, 2, 3]);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].dims, [200, 100]);
  assert.equal(pages[0].draws.length, 1);
  assert.equal(pages[0].draws[0].opts.width, 200);
}

console.log('sg-pdf-shared.test.mjs: all tests passed');
