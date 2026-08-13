#!/usr/bin/env node
/**
 * search-query — 単体テスト
 * Run: node scripts/search-query.test.mjs
 */
import assert from 'node:assert/strict';
import {
  normalizeHost,
  toHalfWidthSpace,
  buildSearchQuery,
  googleSearchUrl,
  SEARCH_PRESETS,
  SITE_CHIPS,
} from '../assets/search-query.js';

{
  const n = normalizeHost('https://www.example.co.jp/path?x=1');
  assert.equal(n.host, 'example.co.jp');
  assert.equal(n.ok, true);
}

{
  const n = normalizeHost('www.go.jp');
  assert.equal(n.host, 'go.jp');
}

{
  const n = normalizeHost('pref.hokkaido.lg.jp');
  assert.equal(n.host, 'pref.hokkaido.lg.jp');
}

{
  assert.equal(toHalfWidthSpace('競合　料金'), '競合 料金');
}

{
  const q = buildSearchQuery({
    keywords: '競合A　料金表',
    filetype: 'pdf',
  });
  assert.equal(q.query, '競合A 料金表 filetype:pdf');
  assert.equal(q.conflict, false);
}

{
  const q = buildSearchQuery({
    keywords: '法令',
    site: 'https://www.go.jp/docs',
    excludes: ['matome.example'],
  });
  assert.ok(q.query.includes('site:go.jp'));
  assert.ok(q.query.includes('-site:matome.example'));
}

{
  const q = buildSearchQuery({
    keywords: 'x',
    site: 'example.co.jp',
    excludes: ['example.co.jp'],
  });
  assert.equal(q.conflict, true);
  assert.ok(!q.query.includes('site:'));
  assert.ok(!q.query.includes('-site:'));
}

{
  const q = buildSearchQuery({
    keywords: '料金',
    filetype: 'pdf',
    intitle: '事例',
  });
  assert.ok(q.query.includes('intitle:事例'));
  // v0.1: 単一 filetype のみ（スペースAND事故を避ける）
  assert.equal((q.query.match(/filetype:/g) || []).length, 1);
}

{
  const url = googleSearchUrl('foo filetype:pdf');
  assert.ok(url.startsWith('https://www.google.com/search?q='));
  assert.ok(url.includes(encodeURIComponent('foo filetype:pdf')));
}

{
  assert.equal(Object.keys(SEARCH_PRESETS).length, 6);
  assert.ok(!Object.keys(SEARCH_PRESETS).some((id) => /subsid|hojo|補助/i.test(id)));
  assert.equal(SEARCH_PRESETS.estat_stats.site, 'e-stat.go.jp');
  assert.equal(SEARCH_PRESETS.illust_sites.site, 'irasutoya.com');
}

{
  const hosts = SITE_CHIPS.map((c) => c.host);
  assert.ok(hosts.includes('elaws.e-gov.go.jp'));
  assert.ok(hosts.includes('ndl.go.jp'));
  assert.ok(hosts.includes('irasutoya.com'));
  const q = buildSearchQuery({
    keywords: '改正',
    site: 'elaws.e-gov.go.jp',
  });
  assert.ok(q.query.includes('site:elaws.e-gov.go.jp'));
}

console.log('search-query.test.mjs: OK');
