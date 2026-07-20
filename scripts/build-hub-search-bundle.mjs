#!/usr/bin/env node
/**
 * data/search-dictionary/*.json + synonyms + registry → data/hub-search-bundle.json
 * Hub は実行時にこの1本だけ fetch する。
 *
 *   node scripts/build-hub-search-bundle.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../assets/hub-search-engine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'hub-search-bundle.json');
const DICT = path.join(ROOT, 'data', 'search-dictionary');

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-registry.json'), 'utf8'));
  const synonyms = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/synonyms.json'), 'utf8'));
  const brandNormalize = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/brand-normalize.json'), 'utf8'));
  const thesaurus = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/search-thesaurus.json'), 'utf8'));
  const intentMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-intent-map.json'), 'utf8'));
  const hubCards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-cards.json'), 'utf8'));
  const categories = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/categories.json'), 'utf8'));

  const docs = fs
    .readdirSync(DICT)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const doc = JSON.parse(fs.readFileSync(path.join(DICT, f), 'utf8'));
      // DECISION: バンドルは検索用フィールドだけ。reviewNotes / source は載せない（転送量・漏洩リスク）。
      return {
        toolId: doc.toolId,
        aliases: doc.aliases || [],
        jobsShort: doc.jobsShort || [],
        jobsLong: doc.jobsLong || [],
        keywords: doc.keywords || [],
        hiddenKeywords: doc.hiddenKeywords || [],
        commonMistakes: (doc.commonMistakes || []).map((m) => ({
          query: m.query,
          meant: m.meant,
        })),
        priority: doc.priority || {},
        relatedProducts: (doc.relatedProducts || []).map((r) => ({
          toolId: r.toolId,
          conceptName: r.conceptName,
        })),
      };
    });

  const hubIds = new Set((hubCards.cards || []).map((c) => c.toolId));
  const missing = [...hubIds].filter((id) => !docs.some((d) => d.toolId === id));
  if (missing.length) {
    console.error('[hub-search-bundle] FAIL: hub にあって辞書がない:', missing.join(', '));
    process.exit(1);
  }

  const identities = Object.entries(registry.tools || {})
    .filter(([id]) => hubIds.has(id) || id === 'font-converter')
    .map(([toolId, t]) => ({
      toolId,
      productName: t.productName,
      conceptName: t.conceptName,
      navLabel: t.navLabel,
      name: t.name,
      categoryId: t.categoryId,
    }));

  const categoryLabels = (categories.categories || []).map((c) => ({
    id: c.id,
    label: c.label,
  }));

  const hubBlurbs = [];
  const seenBlurb = new Set();
  for (const card of hubCards.cards || []) {
    if (!card.toolId || !card.blurb || seenBlurb.has(card.toolId)) continue;
    seenBlurb.add(card.toolId);
    hubBlurbs.push({ toolId: card.toolId, blurb: card.blurb });
  }

  const index = buildIndex(docs, {
    identities,
    synonymEntries: synonyms.entries || [],
    hubBlurbs,
    brandNormalizeEntries: brandNormalize.entries || [],
    thesaurusEntries: thesaurus.entries || [],
    intentEntries: intentMap.entries || [],
    categoryLabels,
  });

  const bundle = {
    version: 3,
    generatedAt: new Date().toISOString(),
    termCount: index.terms.length,
    brandRuleCount: (index.brandRules || []).length,
    thesaurusRuleCount: (index.thesaurusRules || []).length,
    intentRuleCount: (index.intentRules || []).length,
    toolIds: index.toolIds.filter((id) => hubIds.has(id) || id === 'font-converter'),
    terms: index.terms,
    brandRules: index.brandRules || [],
    thesaurusRules: index.thesaurusRules || [],
    intentRules: index.intentRules || [],
  };

  fs.writeFileSync(OUT, JSON.stringify(bundle), 'utf8');
  console.log(
    `[hub-search-bundle] OK: tools=${bundle.toolIds.length} terms=${bundle.termCount} brand=${bundle.brandRuleCount} thesaurus=${bundle.thesaurusRuleCount} intent=${bundle.intentRuleCount} → data/hub-search-bundle.json`
  );
}

main();
