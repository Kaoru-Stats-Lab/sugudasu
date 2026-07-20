/**
 * Hub 辞書ベース検索エンジン（Embedding / AI なし）
 * SSOT: data/search-dictionary/{toolId}.json（hiddenKeywords はツール単位）
 *
 * UI 非依存。ブラウザ / Node 両方で使える ESM。
 *
 * Phase1 検索順位:
 *   入力 → normalizeKeyword() → ① title → ② hiddenKeywords → ③ category → ④ description → ⑤ ゼロ件
 *
 * TODO(Phase2): Gemini 生成ブランド辞書 · normalizeKeyword() 本実装（search-thesaurus）
 * TODO(Phase3): ゼロ件UX改善 · 検索候補表示 · 検索チップ（本ファイル外 · UI）
 */

/** @typedef {{ toolId: string, aliases?: string[], jobsShort?: string[], jobsLong?: string[], keywords?: string[], hiddenKeywords?: string[], commonMistakes?: { query?: string, meant?: string, note?: string }[], priority?: { high?: string[], medium?: string[], low?: string[] }, relatedProducts?: { toolId?: string, conceptName?: string, reason?: string }[] }} SearchDictDoc */

/** @typedef {{ toolId: string, productName?: string, conceptName?: string, navLabel?: string, name?: string, categoryId?: string }} ToolIdentity */

/** @typedef {{ terms: string[], toolIds: string[] }} SynonymEntry */

/** @typedef {{ from: string, to: string, category?: string }} BrandNormalizeEntry */

/**
 * @typedef {Object} ScoredHit
 * @property {string} toolId
 * @property {number} score
 * @property {string[]} matchedTerms
 * @property {string[]} matchKinds
 * @property {number} [tier]
 */

/** description / jobsLong / hubBlurb — title·hidden·category より必ず下 */
const DESCRIPTION_KINDS = Object.freeze({
  description: true,
  hubBlurb: true,
  jobsLong: true,
});

/** フィールド種別の重み（Phase1 順位: title > hidden > category > description） */
// DECISION: Embeddingではなく明示重み。description 単独が title 一致を上回らないよう桁を分離する。
export const FIELD_WEIGHTS = Object.freeze({
  titleExact: 1000,
  titlePartial: 700,
  identity: 700,
  hiddenKeyword: 500,
  category: 300,
  description: 50,
  /** 既存 JTBD · 互換（hidden 付近 · titleExact 未満） */
  alias: 480,
  priorityHigh: 450,
  keyword: 420,
  jobsShort: 400,
  commonMistake: 460,
  meantRedirect: 470,
  priorityMedium: 350,
  synonym: 340,
  priorityLow: 280,
  /** Hub カード blurb（description 帯） */
  hubBlurb: 50,
  jobsLong: 40,
});

/** ソート用ティア（小さいほど優先） */
export const MATCH_TIER = Object.freeze({
  title: 0,
  hiddenKeyword: 1,
  category: 2,
  primaryOther: 3,
  description: 4,
});

/**
 * @param {string} kind
 * @returns {number}
 */
export function matchKindTier(kind) {
  if (kind === 'titleExact' || kind === 'titlePartial' || kind === 'identity') return MATCH_TIER.title;
  if (kind === 'hiddenKeyword') return MATCH_TIER.hiddenKeyword;
  if (kind === 'category') return MATCH_TIER.category;
  if (DESCRIPTION_KINDS[kind]) return MATCH_TIER.description;
  return MATCH_TIER.primaryOther;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function normalizeText(s) {
  if (s == null) return '';
  let t = String(s);
  try {
    t = t.normalize('NFKC');
  } catch (_) {
    /* older engines */
  }
  return t
    .toLowerCase()
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[「」『』【】［］()（）\[\]{}<>『』"'`]/g, ' ')
    .replace(/[、。，．・…‥:/／\\|＿_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * brand-normalize.json の entries → 最長一致用リスト
 * @param {BrandNormalizeEntry[]} entries
 * @returns {{ fromNorm: string, toNorm: string, toRaw: string }[]}
 */
export function buildBrandNormalizeRules(entries) {
  /** @type {Map<string, { fromNorm: string, toNorm: string, toRaw: string, len: number }>} */
  const byFrom = new Map();
  (entries || []).forEach(function (e) {
    if (!e || !e.from || !e.to) return;
    const fromNorm = normalizeText(e.from);
    const toRaw = String(e.to).trim();
    if (!fromNorm || fromNorm.length < 2 || !toRaw) return;
    if (fromNorm === normalizeText(toRaw)) return;
    // 先勝ち（同一 fromNorm）
    if (byFrom.has(fromNorm)) return;
    byFrom.set(fromNorm, {
      fromNorm: fromNorm,
      toNorm: normalizeText(toRaw),
      toRaw: toRaw,
      len: fromNorm.length,
    });
  });
  return Array.from(byFrom.values())
    .sort(function (a, b) {
      return b.len - a.len;
    })
    .map(function (r) {
      return { fromNorm: r.fromNorm, toNorm: r.toNorm, toRaw: r.toRaw };
    });
}

/**
 * クエリをブランド語彙へ正規化（表示名は変えない · 検索マッチ用）
 * DECISION: Layer1/2 の from→to 置換。toolId ルーティングは Layer3（tool-intent-map）。
 * @param {string} query
 * @param {{ fromNorm: string, toNorm: string, toRaw?: string }[]|null|undefined} rules
 * @returns {string} normalizeText 済みの正規化クエリ
 */
export function applyBrandNormalize(query, rules) {
  let q = normalizeText(query);
  if (!q || !rules || !rules.length) return q;
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule || !rule.fromNorm || !rule.toNorm) continue;
    if (rule.fromNorm.length < 2) continue;
    if (q.indexOf(rule.fromNorm) === -1) continue;
    q = q.split(rule.fromNorm).join(rule.toNorm);
  }
  return normalizeText(q);
}

/**
 * Layer1 → Layer2 を順に適用
 * @param {string} query
 * @param {{ brandRules?: { fromNorm: string, toNorm: string }[], thesaurusRules?: { fromNorm: string, toNorm: string }[] }} layers
 * @returns {string}
 */
export function prepareSearchQuery(query, layers) {
  layers = layers || {};
  let q = applyBrandNormalize(query, layers.brandRules);
  q = applyBrandNormalize(q, layers.thesaurusRules);
  return q;
}

/**
 * 検索入口の正規化フック。
 * Phase1: テキスト正規化 +（辞書が渡された場合のみ）既存 Layer1/2。
 * TODO(Phase2): Gemini 生成ブランド辞書 · search-thesaurus 本格投入（グループ→班分け 等）
 * TODO(Phase3): ゼロ件UX · 検索候補 · 検索チップ（呼び出し側 UI）
 *
 * @param {string} query
 * @param {{ brandRules?: { fromNorm: string, toNorm: string }[], thesaurusRules?: { fromNorm: string, toNorm: string }[] }|null|undefined} [layers]
 * @returns {string}
 */
export function normalizeKeyword(query, layers) {
  layers = layers || {};
  const hasRules =
    (layers.brandRules && layers.brandRules.length) ||
    (layers.thesaurusRules && layers.thesaurusRules.length);
  // DECISION: Phase1 はフック固定。辞書が空なら NFKC のみ（ダミー正規化）。辞書があれば既存パイプラインを壊さない。
  if (hasRules) return prepareSearchQuery(query, layers);
  return normalizeText(query);
}

/**
 * @typedef {{ keyword: string, toolIds: string[], weight?: number }} IntentEntry
 */

/**
 * @param {IntentEntry[]} entries
 * @returns {{ keywordNorm: string, toolIds: string[], weight: number }[]}
 */
export function buildIntentRules(entries) {
  /** @type {Map<string, { keywordNorm: string, toolIds: string[], weight: number }>} */
  const byKey = new Map();
  (entries || []).forEach(function (e) {
    if (!e || !e.keyword || !e.toolIds || !e.toolIds.length) return;
    const keywordNorm = normalizeText(e.keyword);
    if (!keywordNorm || keywordNorm.length < 2) return;
    if (byKey.has(keywordNorm)) return;
    const weight = typeof e.weight === 'number' ? e.weight : 80;
    byKey.set(keywordNorm, {
      keywordNorm: keywordNorm,
      toolIds: e.toolIds.slice(),
      weight: weight,
    });
  });
  return Array.from(byKey.values()).sort(function (a, b) {
    return b.keywordNorm.length - a.keywordNorm.length;
  });
}

/**
 * @param {string} query
 * @returns {string[]}
 */
export function tokenizeQuery(query) {
  const n = normalizeText(query);
  if (!n) return [];
  const parts = n.split(' ').filter(Boolean);
  // DECISION: 空白なし日本語1フレーズはそのまま1トークン。空白区切りは AND ボーナス用の複数トークン。
  return parts.length ? parts : [n];
}

/**
 * @param {string} hay
 * @param {string} needle
 * @returns {boolean}
 */
function includesNorm(hay, needle) {
  if (!needle) return false;
  return hay.indexOf(needle) !== -1;
}

/**
 * meant（productName / conceptName / toolId）→ toolId
 * @param {string} meant
 * @param {Map<string, string>} labelToId
 * @returns {string|null}
 */
export function resolveMeantToolId(meant, labelToId) {
  const n = normalizeText(meant);
  if (!n || !labelToId) return null;
  if (labelToId.has(n)) return labelToId.get(n);
  // "SUGUDASU 請求書" や余分な空白ゆれ
  const stripped = n.replace(/^sugudasu\s+/, '');
  if (stripped && labelToId.has(stripped)) return labelToId.get(stripped);
  return null;
}

/**
 * @param {ToolIdentity[]} [identities]
 * @returns {Map<string, string>}
 */
export function buildLabelToToolId(identities) {
  /** @type {Map<string, string>} */
  const map = new Map();
  function put(label, toolId) {
    const k = normalizeText(label);
    if (!k || !toolId) return;
    if (!map.has(k)) map.set(k, toolId);
  }
  (identities || []).forEach(function (id) {
    if (!id || !id.toolId) return;
    put(id.toolId, id.toolId);
    put(id.productName, id.toolId);
    put(id.conceptName, id.toolId);
    put(id.navLabel, id.toolId);
    put(id.name, id.toolId);
    if (id.conceptName) put('sugudasu ' + id.conceptName, id.toolId);
    if (id.productName) put(id.productName.replace(/^SUGUDASU\s+/i, ''), id.toolId);
  });
  return map;
}

/**
 * @typedef {Object} IndexTerm
 * @property {string} toolId
 * @property {string} norm
 * @property {string} kind
 * @property {number} weight
 */

/**
 * @typedef {Object} SearchIndex
 * @property {IndexTerm[]} terms
 * @property {string[]} toolIds
 * @property {Map<string, string>} labelToId
 * @property {{ fromNorm: string, toNorm: string, toRaw: string }[]} [brandRules]
 * @property {{ fromNorm: string, toNorm: string, toRaw: string }[]} [thesaurusRules]
 * @property {{ keywordNorm: string, toolIds: string[], weight: number }[]} [intentRules]
 */

/**
 * @param {SearchDictDoc[]} docs
 * @param {{ identities?: ToolIdentity[], synonymEntries?: SynonymEntry[], hubBlurbs?: { toolId: string, blurb: string }[], brandNormalizeEntries?: BrandNormalizeEntry[], thesaurusEntries?: BrandNormalizeEntry[], intentEntries?: IntentEntry[], categoryLabels?: { id: string, label: string }[] }} [opts]
 * @returns {SearchIndex}
 */
export function buildIndex(docs, opts) {
  opts = opts || {};
  const labelToId = buildLabelToToolId(opts.identities || []);
  /** @type {IndexTerm[]} */
  const terms = [];
  /** @type {Set<string>} */
  const toolIds = new Set();
  const brandRules = buildBrandNormalizeRules(opts.brandNormalizeEntries || []);
  const thesaurusRules = buildBrandNormalizeRules(opts.thesaurusEntries || []);
  const intentRules = buildIntentRules(opts.intentEntries || []);
  /** @type {Map<string, string>} */
  const catLabelById = new Map();
  (opts.categoryLabels || []).forEach(function (c) {
    if (c && c.id && c.label) catLabelById.set(c.id, c.label);
  });

  function addTerm(toolId, raw, kind, weight) {
    const norm = normalizeText(raw);
    if (!toolId || !norm || norm.length < 2) return;
    toolIds.add(toolId);
    terms.push({ toolId: toolId, norm: norm, kind: kind, weight: weight });
  }

  (docs || []).forEach(function (doc) {
    if (!doc || !doc.toolId) return;
    const id = doc.toolId;
    toolIds.add(id);
    addTerm(id, id, 'identity', FIELD_WEIGHTS.identity);

    (doc.aliases || []).forEach(function (a) {
      addTerm(id, a, 'alias', FIELD_WEIGHTS.alias);
    });
    (doc.keywords || []).forEach(function (k) {
      addTerm(id, k, 'keyword', FIELD_WEIGHTS.keyword);
    });
    // 画面非表示 · 検索専用（ツール自身が語を持つ）
    (doc.hiddenKeywords || []).forEach(function (k) {
      addTerm(id, k, 'hiddenKeyword', FIELD_WEIGHTS.hiddenKeyword);
    });
    (doc.jobsShort || []).forEach(function (j) {
      addTerm(id, j, 'jobsShort', FIELD_WEIGHTS.jobsShort);
    });
    (doc.jobsLong || []).forEach(function (j) {
      addTerm(id, j, 'jobsLong', FIELD_WEIGHTS.jobsLong);
    });

    const pr = doc.priority || {};
    (pr.high || []).forEach(function (j) {
      addTerm(id, j, 'priorityHigh', FIELD_WEIGHTS.priorityHigh);
    });
    (pr.medium || []).forEach(function (j) {
      addTerm(id, j, 'priorityMedium', FIELD_WEIGHTS.priorityMedium);
    });
    (pr.low || []).forEach(function (j) {
      addTerm(id, j, 'priorityLow', FIELD_WEIGHTS.priorityLow);
    });

    (doc.commonMistakes || []).forEach(function (m) {
      if (!m || !m.query) return;
      addTerm(id, m.query, 'commonMistake', FIELD_WEIGHTS.commonMistake);
      const target = resolveMeantToolId(m.meant || '', labelToId);
      if (target && target !== id) {
        addTerm(target, m.query, 'meantRedirect', FIELD_WEIGHTS.meantRedirect);
      }
    });

    (doc.relatedProducts || []).forEach(function (r) {
      if (r && r.conceptName) addTerm(id, r.conceptName, 'keyword', Math.min(FIELD_WEIGHTS.keyword, 200));
    });
  });

  (opts.synonymEntries || []).forEach(function (entry) {
    if (!entry) return;
    (entry.terms || []).forEach(function (term) {
      (entry.toolIds || []).forEach(function (tid) {
        addTerm(tid, term, 'synonym', FIELD_WEIGHTS.synonym);
      });
    });
  });

  // identities = title 層（productName / conceptName / navLabel）
  (opts.identities || []).forEach(function (ident) {
    if (!ident || !ident.toolId) return;
    addTerm(ident.toolId, ident.productName, 'identity', FIELD_WEIGHTS.identity);
    addTerm(ident.toolId, ident.conceptName, 'identity', FIELD_WEIGHTS.identity);
    addTerm(ident.toolId, ident.navLabel, 'identity', FIELD_WEIGHTS.identity);
    addTerm(ident.toolId, ident.name, 'identity', FIELD_WEIGHTS.identity);
    const catLabel = ident.categoryId ? catLabelById.get(ident.categoryId) : '';
    if (catLabel) addTerm(ident.toolId, catLabel, 'category', FIELD_WEIGHTS.category);
  });

  // description 層（フォールバック用 · ノイズ抑制のため重み低）
  (opts.hubBlurbs || []).forEach(function (row) {
    if (!row || !row.toolId || !row.blurb) return;
    addTerm(row.toolId, row.blurb, 'description', FIELD_WEIGHTS.description);
    addTerm(row.toolId, row.blurb, 'hubBlurb', FIELD_WEIGHTS.hubBlurb);
  });

  return {
    terms: terms,
    toolIds: Array.from(toolIds),
    labelToId: labelToId,
    brandRules: brandRules,
    thesaurusRules: thesaurusRules,
    intentRules: intentRules,
  };
}

/**
 * @param {SearchIndex} index
 * @param {string} query
 * @param {{ limit?: number, minScore?: number, skipBrandNormalize?: boolean }} [opts]
 * @returns {ScoredHit[]}
 */
export function search(index, query, opts) {
  opts = opts || {};
  const limit = opts.limit == null ? 20 : opts.limit;
  const minScore = opts.minScore == null ? 1 : opts.minScore;
  // 入力 → normalizeKeyword() → 検索
  const prepared = opts.skipBrandNormalize
    ? normalizeText(query)
    : normalizeKeyword(query, {
        brandRules: index && index.brandRules,
        thesaurusRules: index && index.thesaurusRules,
      });
  const tokens = tokenizeQuery(prepared);
  if (!tokens.length || !index || !index.terms) return [];

  const full = prepared;
  /** @type {Map<string, { score: number, matched: Set<string>, kinds: Set<string>, tokenHits: Set<number>, bestTier: number }>} */
  const byId = new Map();

  function bump(toolId, points, matchedRaw, kind, tokenIdx) {
    let row = byId.get(toolId);
    if (!row) {
      row = {
        score: 0,
        matched: new Set(),
        kinds: new Set(),
        tokenHits: new Set(),
        bestTier: MATCH_TIER.description,
      };
      byId.set(toolId, row);
    }
    row.score += points;
    if (matchedRaw) row.matched.add(matchedRaw);
    if (kind) {
      row.kinds.add(kind);
      const tier = matchKindTier(kind);
      if (tier < row.bestTier) row.bestTier = tier;
    }
    if (tokenIdx != null) row.tokenHits.add(tokenIdx);
  }

  function scoreTerm(term, allowDescription) {
    if (!allowDescription && DESCRIPTION_KINDS[term.kind]) return;

    let matched = false;
    if (full.length >= 2 && (includesNorm(term.norm, full) || includesNorm(full, term.norm))) {
      matched = true;
      let weight = term.weight;
      let kind = term.kind;
      // title 完全一致を部分一致より上へ
      if (
        (term.kind === 'identity' || term.kind === 'titlePartial') &&
        term.norm === full
      ) {
        weight = FIELD_WEIGHTS.titleExact;
        kind = 'titleExact';
      } else if (term.kind === 'identity' && (includesNorm(term.norm, full) || includesNorm(full, term.norm))) {
        weight = Math.max(weight, FIELD_WEIGHTS.titlePartial);
        kind = 'titlePartial';
      }
      const lenBonus = Math.min(12, Math.floor(full.length / 2));
      bump(term.toolId, weight + lenBonus, term.norm, kind, null);
    }
    tokens.forEach(function (tok, ti) {
      if (tok.length < 2) return;
      if (!(includesNorm(term.norm, tok) || (tok.length >= 3 && includesNorm(tok, term.norm)))) return;
      if (matched && tok === full) return;
      let weight = term.weight;
      let kind = term.kind;
      if (term.kind === 'identity' && term.norm === tok) {
        weight = FIELD_WEIGHTS.titleExact;
        kind = 'titleExact';
      } else if (term.kind === 'identity') {
        weight = Math.max(weight, FIELD_WEIGHTS.titlePartial);
        kind = 'titlePartial';
      }
      bump(term.toolId, weight, tok, kind, ti);
    });
  }

  // Pass1: title / hiddenKeywords / category / 既存 primary（description 除外）
  index.terms.forEach(function (term) {
    scoreTerm(term, false);
  });

  (index.intentRules || []).forEach(function (rule) {
    if (!rule || !rule.keywordNorm) return;
    const hit =
      includesNorm(full, rule.keywordNorm) ||
      tokens.some(function (tok) {
        return tok === rule.keywordNorm || includesNorm(tok, rule.keywordNorm) || includesNorm(rule.keywordNorm, tok);
      });
    if (!hit) return;
    const points = Math.max(8, Math.round((rule.weight || 80) * 0.55));
    (rule.toolIds || []).forEach(function (tid) {
      bump(tid, points, rule.keywordNorm, 'intent', null);
    });
  });

  function collectHits(requirePrimary) {
    /** @type {ScoredHit[]} */
    const hits = [];
    byId.forEach(function (row, toolId) {
      let score = row.score;
      if (tokens.length > 1 && row.tokenHits.size === tokens.length) {
        score += 25 * tokens.length;
      } else if (tokens.length > 1 && row.tokenHits.size > 0) {
        score += 5 * row.tokenHits.size;
      }
      if (score < minScore) return;
      const isPrimary = row.bestTier < MATCH_TIER.description;
      if (requirePrimary && !isPrimary) return;
      if (!requirePrimary && isPrimary) return;
      hits.push({
        toolId: toolId,
        score: score,
        matchedTerms: Array.from(row.matched).slice(0, 8),
        matchKinds: Array.from(row.kinds),
        tier: row.bestTier,
      });
    });
    hits.sort(function (a, b) {
      const ta = a.tier == null ? 99 : a.tier;
      const tb = b.tier == null ? 99 : b.tier;
      if (ta !== tb) return ta - tb;
      if (b.score !== a.score) return b.score - a.score;
      return a.toolId < b.toolId ? -1 : a.toolId > b.toolId ? 1 : 0;
    });
    return hits;
  }

  let hits = collectHits(true);
  // Pass2: title·hidden·category でゼロ件のときだけ description
  // DECISION: description だけで大量ヒットさせない（ノイズ抑制）。
  if (!hits.length) {
    byId.clear();
    index.terms.forEach(function (term) {
      if (!DESCRIPTION_KINDS[term.kind]) return;
      scoreTerm(term, true);
    });
    hits = [];
    byId.forEach(function (row, toolId) {
      let score = row.score;
      if (tokens.length > 1 && row.tokenHits.size === tokens.length) {
        score += 25 * tokens.length;
      } else if (tokens.length > 1 && row.tokenHits.size > 0) {
        score += 5 * row.tokenHits.size;
      }
      if (score < minScore) return;
      hits.push({
        toolId: toolId,
        score: score,
        matchedTerms: Array.from(row.matched).slice(0, 8),
        matchKinds: Array.from(row.kinds),
        tier: MATCH_TIER.description,
      });
    });
    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.toolId < b.toolId ? -1 : a.toolId > b.toolId ? 1 : 0;
    });
  }

  return hits.slice(0, limit);
}

/**
 * Hub カード絞り込み用: スコア付き結果から toolId の優先順位 Map を返す
 * @param {ScoredHit[]} hits
 * @returns {Map<string, number>}
 */
export function hitScoreMap(hits) {
  /** @type {Map<string, number>} */
  const m = new Map();
  (hits || []).forEach(function (h, i) {
    m.set(h.toolId, h.score);
    // 同点時の安定ソート用に順位も残したい場合は呼び出し側で i を使う
    void i;
  });
  return m;
}

/** ブラウザ classic script からの参照用 */
if (typeof globalThis !== 'undefined') {
  globalThis.SUGUDASU_HUB_SEARCH = {
    FIELD_WEIGHTS: FIELD_WEIGHTS,
    MATCH_TIER: MATCH_TIER,
    normalizeText: normalizeText,
    normalizeKeyword: normalizeKeyword,
    tokenizeQuery: tokenizeQuery,
    buildBrandNormalizeRules: buildBrandNormalizeRules,
    applyBrandNormalize: applyBrandNormalize,
    prepareSearchQuery: prepareSearchQuery,
    matchKindTier: matchKindTier,
    buildIntentRules: buildIntentRules,
    buildLabelToToolId: buildLabelToToolId,
    resolveMeantToolId: resolveMeantToolId,
    buildIndex: buildIndex,
    search: search,
    hitScoreMap: hitScoreMap,
  };
}
