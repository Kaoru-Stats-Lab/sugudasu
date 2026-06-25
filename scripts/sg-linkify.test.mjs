#!/usr/bin/env node
import assert from 'node:assert/strict';
import { linkifyHttpHtml, linkifyHttpHtmlIfPresent } from '../assets/sg-linkify.js';

assert.equal(linkifyHttpHtml(''), '');
assert.equal(linkifyHttpHtml('音響キュー only'), '音響キュー only');

const linked = linkifyHttpHtml('資料 https://example.com/path へ');
assert.ok(linked.includes('href="https://example.com/path"'));
assert.ok(linked.includes('target="_blank"'));
assert.ok(linked.includes('rel="noopener noreferrer"'));
assert.ok(linked.includes('資料 '));
assert.ok(linked.includes(' へ'));

const trailing = linkifyHttpHtml('末尾 https://meet.google.com/abc-defg-hij。');
assert.ok(trailing.includes('meet.google.com'));
assert.ok(trailing.includes('。'));

const xss = linkifyHttpHtml('<script>alert(1)</script> https://safe.test/x');
assert.ok(!xss.includes('<script>'));
assert.ok(xss.includes('&lt;script&gt;'));
assert.ok(xss.includes('safe.test'));

assert.equal(linkifyHttpHtml('javascript:alert(1)'), 'javascript:alert(1)');
assert.equal(linkifyHttpHtmlIfPresent('no url'), 'no url');
assert.ok(linkifyHttpHtmlIfPresent('see https://x.test').includes('<a '));

console.log('sg-linkify: all tests passed');
