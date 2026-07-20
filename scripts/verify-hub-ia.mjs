#!/usr/bin/env node
/**
 * Hub IA / カテゴリ SSOT 検証
 * — categories · hub-config · synonyms · registry.categoryId
 * — Hub UI へカテゴリ名をハードコードしない前提の静的チェック
 *
 *   node scripts/verify-hub-ia.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SUPPORT_IDS = new Set([
  'hub',
  'updates',
  'roadmap',
  'statements',
  'privacy',
  'terms',
  'disclaimer',
  'not-a-car',
  'guides',
  'contact',
  'brand-logo-preview',
]);

function fail(msg) {
  console.error(`[hub-ia] FAIL: ${msg}`);
  process.exitCode = 1;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-registry.json'), 'utf8'));
  const catDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/categories.json'), 'utf8'));
  const hubConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-config.json'), 'utf8'));
  const synonyms = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/synonyms.json'), 'utf8'));
  const brandNormalize = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/brand-normalize.json'), 'utf8'));
  const hubCards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-cards.json'), 'utf8'));
  const relations = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/relations.json'), 'utf8'));
  const bundlePath = path.join(ROOT, 'data/hub-search-bundle.json');
  const dictDir = path.join(ROOT, 'data/search-dictionary');

  const catIds = new Set((catDoc.categories || []).map((c) => c.id));
  for (const c of catDoc.categories || []) {
    if (!c.id || !c.label || c.order == null || !c.description) {
      fail(`categories.json 必須: id/label/order/description (${c.id || '?'})`);
    }
    if (c.hub || c.compare || c.blurb || c.chipLabel || c.mobilePrimary) {
      fail(`categories.json はドメインのみ。UI/compare は別ファイル (${c.id})`);
    }
  }

  for (const id of hubConfig.chipOrder || []) {
    if (!catIds.has(id)) fail(`hub-config.chipOrder 未知: ${id}`);
  }
  for (const id of hubConfig.primaryCategories || []) {
    if (!catIds.has(id)) fail(`hub-config.primaryCategories 未知: ${id}`);
  }
  for (const [id, label] of Object.entries(hubConfig.chipLabels || {})) {
    if (!catIds.has(id)) fail(`hub-config.chipLabels 未知: ${id}`);
    if (!label) fail(`hub-config.chipLabels[${id}] が空`);
  }

  for (const [id, tool] of Object.entries(registry.tools || {})) {
    if (SUPPORT_IDS.has(id)) continue;
    if (tool.inNav !== true) continue;
    if (!tool.categoryId) fail(`registry ${id}: categoryId 必須`);
    if (!catIds.has(tool.categoryId)) fail(`registry ${id}: 未知の categoryId=${tool.categoryId}`);
    if (tool.tags) fail(`registry ${id}: tags 禁止（検索は synonyms.json）`);
  }

  for (const entry of synonyms.entries || []) {
    for (const tid of entry.toolIds || []) {
      if (!registry.tools[tid]) fail(`synonyms: 未知の toolId=${tid}`);
    }
    if (!entry.terms || !entry.terms.length) fail('synonyms: terms が空のエントリ');
  }

  {
    const brandPath = path.join(ROOT, 'data/brand-normalize.json');
    const thesaurusPath = path.join(ROOT, 'data/search-thesaurus.json');
    const intentPath = path.join(ROOT, 'data/tool-intent-map.json');
    if (!fs.existsSync(brandPath)) fail('brand-normalize.json が無い');
    if (!fs.existsSync(thesaurusPath)) fail('search-thesaurus.json が無い');
    if (!fs.existsSync(intentPath)) fail('tool-intent-map.json が無い');

    const thesaurus = JSON.parse(fs.readFileSync(thesaurusPath, 'utf8'));
    const intentMap = JSON.parse(fs.readFileSync(intentPath, 'utf8'));
    const brandSet = new Set(brandNormalize.brandTerms || []);
    if (brandSet.size < 10) fail('brand-normalize.brandTerms が少なすぎる');

    const seenFrom = new Set();
    for (const e of brandNormalize.entries || []) {
      if (!e.from || !e.to) fail('brand-normalize: from/to 必須');
      if (seenFrom.has(e.from)) fail(`brand-normalize: from 重複 ${e.from}`);
      seenFrom.add(e.from);
      if (e.from === e.to) fail(`brand-normalize: from===to 禁止 (${e.from})`);
      if (!brandSet.has(e.to)) fail(`brand-normalize: to が brandTerms 外 (${e.from}→${e.to})`);
    }
    if ((brandNormalize.entries || []).length < 80) {
      fail(`brand-normalize: エントリ不足 (${(brandNormalize.entries || []).length})`);
    }

    const mustBrand = [
      ['スクショ', '画像'],
      ['写真', '画像'],
      ['ハンコ', '印鑑'],
      ['PDFファイル', 'PDF'],
      ['文章', 'テキスト'],
      ['二次元コード', 'QRコード'],
      ['ホームページ', 'Webサイト'],
      ['エクセル', 'Excel'],
    ];
    const brandMap = new Map((brandNormalize.entries || []).map((e) => [e.from, e.to]));
    for (const [from, to] of mustBrand) {
      if (brandMap.get(from) !== to) fail(`brand-normalize: 必須 ${from}→${to}（got ${brandMap.get(from)}）`);
    }

    for (const e of thesaurus.entries || []) {
      if (!e.from || !e.to) fail('search-thesaurus: from/to 必須');
      if (seenFrom.has(e.from)) fail(`search-thesaurus: brand と from 重複 ${e.from}`);
    }
    if ((thesaurus.entries || []).length < 80) {
      fail(`search-thesaurus: エントリ不足 (${(thesaurus.entries || []).length})`);
    }

    for (const e of intentMap.entries || []) {
      if (!e.keyword || !e.toolIds || !e.toolIds.length) fail('tool-intent-map: keyword/toolIds 必須');
      for (const tid of e.toolIds) {
        if (!registry.tools[tid]) fail(`tool-intent-map: 未知 toolId=${tid} (keyword=${e.keyword})`);
      }
    }
    if ((intentMap.entries || []).length < 30) {
      fail(`tool-intent-map: エントリ不足 (${(intentMap.entries || []).length})`);
    }
  }

  const cardToolIds = new Set();
  for (const card of hubCards.cards || []) {
    if (!registry.tools[card.toolId]) fail(`hub-cards: 未知の toolId=${card.toolId}`);
    if (!card.blurb) fail(`hub-cards: blurb 必須 (${card.toolId})`);
    cardToolIds.add(card.toolId);
  }
  for (const [id, tool] of Object.entries(registry.tools || {})) {
    if (id === 'hub' || !tool.inNav) continue;
    if (!cardToolIds.has(id)) fail(`hub-cards に inNav ツールが無い: ${id}`);
  }

  for (const [from, tos] of Object.entries(relations.relations || {})) {
    if (!registry.tools[from]) fail(`relations: 未知 from=${from}`);
    for (const to of tos) {
      if (!registry.tools[to]) fail(`relations: 未知 to=${to} (from ${from})`);
    }
  }

  for (const id of hubConfig.popularToolIds || []) {
    if (!registry.tools[id]) fail(`hub-config.popularToolIds 未知: ${id}`);
    if (!cardToolIds.has(id)) fail(`hub-config.popularToolIds が hub-cards に無い: ${id}`);
  }

  const STATUS = new Set(['new', 'beta', 'ga', null]);
  const SPEC = new Set(['local', 'pc']);
  for (const card of hubCards.cards || []) {
    if (card.eyebrow) fail(`hub-cards: eyebrow 廃止 (${card.toolId})`);
    if (card.meta) fail(`hub-cards: meta 廃止・内部文言禁止 (${card.toolId})`);
    const b = card.badges;
    if (!b || typeof b !== 'object') fail(`hub-cards: badges 必須 (${card.toolId})`);
    if (b.status != null && !STATUS.has(b.status)) fail(`hub-cards badges.status 不正: ${card.toolId}=${b.status}`);
    for (const sp of b.spec || []) {
      if (!SPEC.has(sp)) fail(`hub-cards badges.spec 不正: ${card.toolId}=${sp}`);
    }
  }

  const hubHtml = fs.readFileSync(path.join(ROOT, 'tools/hub.html'), 'utf8');
  if (!hubHtml.includes('data-sg-nav="hub"')) fail('hub.html: data-sg-nav="hub" が無い');
  const shellSrc = fs.readFileSync(path.join(ROOT, 'assets/sugudasu-shell.js'), 'utf8');
  if (!shellSrc.includes('resolveNavMode')) fail('sugudasu-shell.js: resolveNavMode が無い');
  if (!shellSrc.includes('navLinksForMode')) fail('sugudasu-shell.js: navLinksForMode が無い');
  if (!shellSrc.includes('ツール横並びナビは廃止')) {
    fail('sugudasu-shell.js: ツール横並びナビ廃止の痕跡が無い');
  }
  if (!hubHtml.includes('sg-hub-search-panel')) fail('hub.html: 検索結果パネルが無い');
  if (!hubHtml.includes('sg-hub-popular-grid')) fail('hub.html: 人気グリッドが無い');
  if (!hubHtml.includes('sg-hub-search-example-chips')) fail('hub.html: 検索例チップ容器が無い');
  if (!hubHtml.includes('sg-hub-empty-recommend')) fail('hub.html: 0件おすすめ容器が無い');
  if (!Array.isArray(hubConfig.searchExampleChips) || !hubConfig.searchExampleChips.length) {
    fail('hub-config.searchExampleChips が空');
  }

  if (!fs.existsSync(bundlePath)) {
    fail('hub-search-bundle.json が無い（npm run build:hub-search を先に実行）');
  } else {
    const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    if (!bundle.terms || !bundle.terms.length) fail('hub-search-bundle.terms が空');
    if (!Array.isArray(bundle.brandRules) || bundle.brandRules.length < 50) {
      fail('hub-search-bundle.brandRules 不足（build:hub-search を再実行）');
    }
    if (!Array.isArray(bundle.thesaurusRules) || bundle.thesaurusRules.length < 50) {
      fail('hub-search-bundle.thesaurusRules 不足');
    }
    if (!Array.isArray(bundle.intentRules) || bundle.intentRules.length < 20) {
      fail('hub-search-bundle.intentRules 不足');
    }
    const dictFiles = fs.existsSync(dictDir)
      ? fs.readdirSync(dictDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
      : [];
    for (const id of cardToolIds) {
      if (!dictFiles.includes(id)) fail(`search-dictionary 欠落: ${id}`);
      const doc = JSON.parse(fs.readFileSync(path.join(dictDir, `${id}.json`), 'utf8'));
      if (!Array.isArray(doc.hiddenKeywords) || !doc.hiddenKeywords.length) {
        fail(`search-dictionary/${id}: hiddenKeywords 必須（検索専用・画面非表示）`);
      }
    }
    // Phase1: 「グループ」→ 班分けは hiddenKeywords で担保（中央巨大JSONに都度追記しない）
    {
      const gs = JSON.parse(fs.readFileSync(path.join(dictDir, 'group-split.json'), 'utf8'));
      if (!(gs.hiddenKeywords || []).includes('グループ')) {
        fail('group-split.hiddenKeywords に「グループ」が無い');
      }
    }
  }

  if (process.exitCode) {
    console.error('[hub-ia] 検証失敗');
    process.exit(1);
  }
  console.log(
    `[hub-ia] OK: categories=${catIds.size} · cards=${(hubCards.cards || []).length} · synonyms=${(synonyms.entries || []).length} · brand=${(brandNormalize.entries || []).length}`
  );
}

main();
