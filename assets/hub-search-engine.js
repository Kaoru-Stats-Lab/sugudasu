/**
 * Hub 辞書ベース検索エンジン（Embedding / AI なし）
 * SSOT: data/search-dictionary/{toolId}.json · 任意で data/synonyms.json
 *
 * UI 非依存。ブラウザ / Node 両方で使える ESM。
 */

/** @typedef {{ toolId: string, aliases?: string[], jobsShort?: string[], jobsLong?: string[], keywords?: string[], commonMistakes?: { query?: string, meant?: string, note?: string }[], priority?: { high?: string[], medium?: string[], low?: string[] }, relatedProducts?: { toolId?: string, conceptName?: string, reason?: string }[] }} SearchDictDoc */

/** @typedef {{ toolId: string, productName?: string, conceptName?: string, navLabel?: string, name?: string }} ToolIdentity */

/** @typedef {{ terms: string[], toolIds: string[] }} SynonymEntry */

/**
 * @typedef {Object} ScoredHit
 * @property {string} toolId
 * @property {number} score
 * @property {string[]} matchedTerms
 * @property {string[]} matchKinds
 */

/** フィールド種別の重み（高いほど「その Job でこのツール」とみなす） */
// DECISION: Embeddingではなく明示重み。priority.high ≈ alias と同等に扱い「何をしたいか」検索を優先する。
export const FIELD_WEIGHTS = Object.freeze({
  identity: 55,
  alias: 40,
  priorityHigh: 38,
  keyword: 32,
  jobsShort: 28,
  priorityMedium: 22,
  synonym: 20,
  commonMistake: 42,
  meantRedirect: 48,
  jobsLong: 10,
  priorityLow: 12,
  /** Hub カード blurb（JTBD 説明）。一覧コピーを検索に載せる */
  hubBlurb: 24,
});

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
 */

/**
 * @param {SearchDictDoc[]} docs
 * @param {{ identities?: ToolIdentity[], synonymEntries?: SynonymEntry[], hubBlurbs?: { toolId: string, blurb: string }[] }} [opts]
 * @returns {SearchIndex}
 */
export function buildIndex(docs, opts) {
  opts = opts || {};
  const labelToId = buildLabelToToolId(opts.identities || []);
  /** @type {IndexTerm[]} */
  const terms = [];
  /** @type {Set<string>} */
  const toolIds = new Set();

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
      // 誤検索語でも「このツールに辿り着きたい」ケース → 自ツールを載せる
      addTerm(id, m.query, 'commonMistake', FIELD_WEIGHTS.commonMistake);
      const target = resolveMeantToolId(m.meant || '', labelToId);
      if (target && target !== id) {
        // DECISION: meant が別ツールならリダイレクト候補として別 toolId にも同じ誤検索語を載せる
        addTerm(target, m.query, 'meantRedirect', FIELD_WEIGHTS.meantRedirect);
      }
    });

    (doc.relatedProducts || []).forEach(function (r) {
      if (r && r.conceptName) addTerm(id, r.conceptName, 'keyword', Math.min(FIELD_WEIGHTS.keyword, 18));
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

  // identities からも productName 等を載せる（辞書に無い短縮表記の保険）
  (opts.identities || []).forEach(function (ident) {
    if (!ident || !ident.toolId) return;
    addTerm(ident.toolId, ident.productName, 'identity', FIELD_WEIGHTS.identity);
    addTerm(ident.toolId, ident.conceptName, 'identity', FIELD_WEIGHTS.identity);
    addTerm(ident.toolId, ident.navLabel, 'identity', FIELD_WEIGHTS.identity);
  });

  // Hub カード blurb（JTBD）を検索対象へ（UI 文言と検索のズレを防ぐ）
  (opts.hubBlurbs || []).forEach(function (row) {
    if (!row || !row.toolId || !row.blurb) return;
    addTerm(row.toolId, row.blurb, 'hubBlurb', FIELD_WEIGHTS.hubBlurb);
  });

  return {
    terms: terms,
    toolIds: Array.from(toolIds),
    labelToId: labelToId,
  };
}

/**
 * @param {SearchIndex} index
 * @param {string} query
 * @param {{ limit?: number, minScore?: number }} [opts]
 * @returns {ScoredHit[]}
 */
export function search(index, query, opts) {
  opts = opts || {};
  const limit = opts.limit == null ? 20 : opts.limit;
  const minScore = opts.minScore == null ? 1 : opts.minScore;
  const tokens = tokenizeQuery(query);
  if (!tokens.length || !index || !index.terms) return [];

  const full = normalizeText(query);
  /** @type {Map<string, { score: number, matched: Set<string>, kinds: Set<string>, tokenHits: Set<number> }>} */
  const byId = new Map();

  function bump(toolId, points, matchedRaw, kind, tokenIdx) {
    let row = byId.get(toolId);
    if (!row) {
      row = { score: 0, matched: new Set(), kinds: new Set(), tokenHits: new Set() };
      byId.set(toolId, row);
    }
    row.score += points;
    if (matchedRaw) row.matched.add(matchedRaw);
    if (kind) row.kinds.add(kind);
    if (tokenIdx != null) row.tokenHits.add(tokenIdx);
  }

  index.terms.forEach(function (term) {
    // 全文句が用語に含まれる / 用語が全文句に含まれる
    if (full.length >= 2) {
      if (includesNorm(term.norm, full) || includesNorm(full, term.norm)) {
        const lenBonus = Math.min(12, Math.floor(full.length / 2));
        bump(term.toolId, term.weight + lenBonus, term.norm, term.kind, null);
      }
    }
    tokens.forEach(function (tok, ti) {
      if (tok.length < 2) return;
      if (includesNorm(term.norm, tok) || (tok.length >= 3 && includesNorm(tok, term.norm))) {
        bump(term.toolId, term.weight, tok, term.kind, ti);
      }
    });
  });

  /** @type {ScoredHit[]} */
  const hits = [];
  byId.forEach(function (row, toolId) {
    let score = row.score;
    // DECISION: 複数トークンは「全部ヒット」でボーナス。「全部必須」にすると日本語複合語で落ちやすいため OR+ボーナス。
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
    });
  });

  hits.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.toolId < b.toolId ? -1 : a.toolId > b.toolId ? 1 : 0;
  });

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
    normalizeText: normalizeText,
    tokenizeQuery: tokenizeQuery,
    buildLabelToToolId: buildLabelToToolId,
    resolveMeantToolId: resolveMeantToolId,
    buildIndex: buildIndex,
    search: search,
    hitScoreMap: hitScoreMap,
  };
}
