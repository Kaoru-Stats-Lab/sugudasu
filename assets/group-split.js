/**
 * グループ分け（T11 · Phase A/B/C）— シードシャッフル + ラウンドロビン / 制約ソルバ
 * SSOT: docs/notes/GROUP_SPLIT_TOOL_SPEC.md
 */
import {
  createSeedMaterial,
  sha256Hex,
} from './prize-law-eval.js';
import {
  assignWithConstraints,
  classifyConstraintPre,
  entriesToNameSet,
  hasActiveConstraints,
  parseBundlesText,
  parseFixedText,
  parsePairsText,
  parseRosterRich,
  shuffleUnits,
  willLikelyOverflow,
} from './group-split-constraints.js';
import {
  guessColumnMapping,
  isMultiColumnTable,
  normalizeAttrRules,
  parseRosterPhaseC,
  parseTableText,
} from './group-split-columns.js';

export const TOOL_VERSION = '1.2.4';
export const SESSION_SNAPSHOT_VERSION = 1;
/** 硬上限 FIX（Phase C · 2026-06-20）— 複数属性ソルバ · 研修規模 */
export const ROSTER_MAX = 250;
/** 典型ブレイクアウト — 超えたら TSV 推奨のソフト警告 */
export const ROSTER_SOFT_WARN = 200;
/** Slack 1メッセージ上限（公式 40,000 · 余裕を見て 38,000） */
export const SLACK_CHAR_SAFE = 38000;
/** 結果一覧の DOM 表示上限（以降は TSV/コピーで確認） */
export const DOM_GROUP_PREVIEW_MAX = 40;
/** この組数以下はスクロール枠なし（全組をそのまま表示） */
export const DOM_GROUP_PREVIEW_SCROLL_THRESHOLD = 10;
/** スクロール時に画面内に見せる概算組数 */
export const DOM_GROUP_PREVIEW_VIEWPORT_GROUPS = 10;
/** 1組カードの概算高さ（rem · 超過理由1行込み） */
export const DOM_GROUP_PREVIEW_ROW_REM = 4.25;
export const GROUP_MIN = 2;
/** 「M グループ」モードでユーザーが選べる上限 */
export const GROUP_MAX = 50;
export const MIN_PER_GROUP = 2;

export {
  PHASE_C_ATTR_MAX,
  parseTableText,
  isMultiColumnTable,
  guessColumnMapping,
  collectAttrValues,
} from './group-split-columns.js';

/**
 * @param {string | string[]} rosterInput
 * @param {{ columnMapping?: import('./group-split-columns.js').ColumnMapping | null }} [opts]
 */
export function parseRosterEntries(rosterInput, opts = {}) {
  if (Array.isArray(rosterInput)) {
    return {
      entries: rosterInput.map((s, i) => ({
        name: String(s).trim(),
        tag: '',
        attrs: {},
        line: i + 1,
      })).filter((e) => e.name),
      duplicates: [],
      rawLineCount: rosterInput.length,
      phaseC: false,
      columnMapping: null,
      attrLabels: [],
    };
  }

  const text = String(rosterInput ?? '');
  const table = parseTableText(text);
  if (isMultiColumnTable(table)) {
    const mapping = opts.columnMapping || guessColumnMapping(table);
    const built = parseRosterPhaseC(text, mapping);
    if (built) {
      return {
        entries: built.entries,
        duplicates: built.duplicates,
        rawLineCount: built.rawLineCount,
        phaseC: true,
        columnMapping: built.mapping,
        attrLabels: built.mapping.attrRules.map((r) => r.label),
      };
    }
  }

  const rich = parseRosterRich(text);
  return {
    entries: rich.entries.map((e) => ({
      ...e,
      attrs: e.attrs || (e.tag ? { タグ: e.tag } : {}),
    })),
    duplicates: rich.duplicates,
    rawLineCount: rich.rawLineCount,
    phaseC: false,
    columnMapping: null,
    attrLabels: [],
  };
}

/**
 * シードから決定論的乱数（同 seed → 同 shuffle）
 * @param {Uint8Array} seedBuf
 * @returns {(n: number) => Uint32Array}
 */
export function createDeterministicRandomFn(seedBuf) {
  let state = 0;
  for (let i = 0; i < seedBuf.length; i++) {
    state = (Math.imul(state ^ seedBuf[i], 0x01000193)) >>> 0;
  }
  if (!state) state = 0x9747b28c;

  return (n) => {
    const buf = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
      buf[i] = t;
    }
    return buf;
  };
}

/**
 * @param {(n: number) => Uint32Array} randomFn
 * @param {number} max
 */
function secureRandomIndex(randomFn, max) {
  if (max <= 1) return 0;
  return randomFn(1)[0] % max;
}

/**
 * Fisher-Yates full shuffle
 * @param {string[]} arr
 * @param {(n: number) => Uint32Array} randomFn
 */
export function seededFullShuffle(arr, randomFn) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = secureRandomIndex(randomFn, i + 1);
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/**
 * @param {string} text
 */
export function parseRosterText(text) {
  const raw = String(text ?? '').split(/\r?\n/);
  const lines = raw.map((s) => String(s).trim()).filter(Boolean);
  const dupMap = new Map();
  for (const name of lines) {
    dupMap.set(name, (dupMap.get(name) || 0) + 1);
  }
  /** @type {string[]} */
  const duplicates = [];
  dupMap.forEach((count, name) => {
    if (count > 1) duplicates.push(name);
  });
  return {
    lines,
    rawLineCount: raw.length,
    duplicates,
    duplicateCount: lines.length - new Set(lines).size,
  };
}

/**
 * @param {'perSize' | 'groupCount'} mode
 * @param {number} rosterCount
 * @param {number} param
 */
export function resolveGroupCount(mode, rosterCount, param) {
  const n = Math.max(0, rosterCount);
  const p = Math.max(1, Math.floor(Number(param) || 1));
  if (mode === 'perSize') {
    return Math.max(1, Math.ceil(n / p));
  }
  return Math.max(GROUP_MIN, Math.min(GROUP_MAX, p));
}

/**
 * @param {string[]} lines
 * @param {'perSize' | 'groupCount'} mode
 * @param {number} param
 */
export function validateSplitInput(lines, mode, param) {
  const n = lines.length;
  if (n === 0) {
    return { ok: false, code: 'empty', message: '名簿を1行1名で入力してください。' };
  }
  if (n > ROSTER_MAX) {
    return { ok: false, code: 'over_max', message: `名簿は最大 ${ROSTER_MAX} 名までです（現在 ${n} 名）。` };
  }

  const p = Math.floor(Number(param) || 0);
  if (mode === 'perSize') {
    if (p < MIN_PER_GROUP) {
      return { ok: false, code: 'bad_param', message: `1組あたりは ${MIN_PER_GROUP} 名以上にしてください。` };
    }
  } else if (p < GROUP_MIN || p > GROUP_MAX) {
    return { ok: false, code: 'bad_param', message: `グループ数は ${GROUP_MIN}〜${GROUP_MAX} にしてください。` };
  }

  const groupCount = resolveGroupCount(mode, n, param);
  if (groupCount < GROUP_MIN) {
    return {
      ok: false,
      code: 'too_few_groups',
      message: `グループ数が ${GROUP_MIN} 未満になります。名簿を増やすか、1組あたりの人数を減らしてください。`,
    };
  }
  if (mode === 'groupCount' && groupCount > GROUP_MAX) {
    return {
      ok: false,
      code: 'too_many_groups',
      message: `グループ数は ${GROUP_MIN}〜${GROUP_MAX} にしてください（現在 ${groupCount} 組相当）。`,
    };
  }

  const minSize = Math.floor(n / groupCount);
  if (minSize < MIN_PER_GROUP) {
    return {
      ok: false,
      code: 'min_size',
      message: `各グループ ${MIN_PER_GROUP} 名以上にするには、名簿 ${groupCount * MIN_PER_GROUP} 名以上が必要です（現在 ${n} 名）。`,
    };
  }

  return { ok: true, groupCount, minSize, maxSize: Math.ceil(n / groupCount) };
}

/**
 * @param {string[]} shuffled
 * @param {number} groupCount
 */
export function assignRoundRobin(shuffled, groupCount) {
  /** @type {string[][]} */
  const groups = Array.from({ length: groupCount }, () => []);
  shuffled.forEach((name, i) => {
    groups[i % groupCount].push(name);
  });
  return groups;
}

/**
 * @param {Date} [d]
 */
export function jstNow(d = new Date()) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * @param {string} seedHex
 */
export function seedBufFromHex(seedHex) {
  const hex = String(seedHex).replace(/\s/g, '');
  const buf = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    buf[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return buf;
}

/**
 * @param {ReturnType<typeof parseRosterEntries>} parsed
 * @param {import('./group-split-constraints.js').GroupSplitConstraints} [baseConstraints]
 * @param {{ constraints?: import('./group-split-constraints.js').GroupSplitConstraints, constraintsInput?: { bundlesText?: string, fixedText?: string, pairsText?: string, spreadTags?: boolean, requiredTag?: string, hardMax?: number, attrRules?: import('./group-split-constraints.js').AttrColumnRule[] } }} opts
 * @param {number} groupCount
 */
function resolveConstraintsForRun(parsed, opts, groupCount, baseConstraints = {}) {
  /** @type {import('./group-split-constraints.js').GroupSplitConstraints} */
  let constraints = opts.constraints || baseConstraints;
  if (opts.constraintsInput) {
    const nameSet = entriesToNameSet(parsed.entries);
    const ci = opts.constraintsInput;
    const attrRules = ci.attrRules?.length
      ? normalizeAttrRules(ci.attrRules)
      : (parsed.columnMapping?.attrRules || []);
    constraints = {
      bundles: ci.bundlesText ? parseBundlesText(ci.bundlesText, nameSet) : [],
      fixedToGroup: ci.fixedText ? parseFixedText(ci.fixedText, nameSet, groupCount) : new Map(),
      separatePairs: ci.pairsText ? parsePairsText(ci.pairsText, nameSet) : [],
      spreadTags: !!ci.spreadTags && !attrRules.some((r) => r.spread),
      requiredTag: attrRules.length ? '' : String(ci.requiredTag || '').trim(),
      hardMax: Number(ci.hardMax) || 0,
      attrRules,
    };
  } else if (parsed.columnMapping?.attrRules?.length) {
    constraints = {
      ...constraints,
      attrRules: normalizeAttrRules(parsed.columnMapping.attrRules),
    };
  }
  return constraints;
}

/**
 * 実行前の各組必須可否（UI ヒント用）
 * @param {string[] | string} rosterInput
 * @param {{ mode?: 'perSize' | 'groupCount', param?: number, columnMapping?: import('./group-split-columns.js').ColumnMapping | null, constraints?: import('./group-split-constraints.js').GroupSplitConstraints, constraintsInput?: { bundlesText?: string, fixedText?: string, pairsText?: string, spreadTags?: boolean, requiredTag?: string, hardMax?: number, attrRules?: import('./group-split-constraints.js').AttrColumnRule[] } }} [opts]
 */
export function previewConstraintFeasibility(rosterInput, opts = {}) {
  const mode = opts.mode === 'groupCount' ? 'groupCount' : 'perSize';
  const param = Number(opts.param) || (mode === 'perSize' ? 4 : 5);
  const parsed = parseRosterEntries(rosterInput, { columnMapping: opts.columnMapping });
  const lines = parsed.entries.map((e) => e.name);
  const validation = validateSplitInput(lines, mode, param);
  if (!validation.ok) {
    return { ok: false, validationError: validation.message, blocking: [], warnings: [], groupCount: 0 };
  }
  const constraints = resolveConstraintsForRun(parsed, opts, validation.groupCount);
  if (!hasActiveConstraints(constraints)) {
    return { ok: true, blocking: [], warnings: [], groupCount: validation.groupCount };
  }
  const { blocking, warnings } = classifyConstraintPre(parsed.entries, validation.groupCount, constraints);
  return { ok: blocking.length === 0, blocking, warnings, groupCount: validation.groupCount };
}

/**
 * @param {string[] | string} rosterInput
 * @param {{ mode?: 'perSize' | 'groupCount', param?: number, sessionLabel?: string, seedHex?: string, seedBuf?: Uint8Array, columnMapping?: import('./group-split-columns.js').ColumnMapping | null, constraints?: import('./group-split-constraints.js').GroupSplitConstraints, constraintsInput?: { bundlesText?: string, fixedText?: string, pairsText?: string, spreadTags?: boolean, requiredTag?: string, hardMax?: number, attrRules?: import('./group-split-constraints.js').AttrColumnRule[] }, relaxRequiredEach?: boolean }} [opts]
 */
export async function runGroupSplit(rosterInput, opts = {}) {
  const mode = opts.mode === 'groupCount' ? 'groupCount' : 'perSize';
  const param = Number(opts.param) || (mode === 'perSize' ? 4 : 5);
  const sessionLabel = String(opts.sessionLabel ?? '').trim();

  const parsed = parseRosterEntries(rosterInput, { columnMapping: opts.columnMapping });
  const rich = { entries: parsed.entries, duplicates: parsed.duplicates, rawLineCount: parsed.rawLineCount };

  const lines = rich.entries.map((e) => e.name);
  const duplicates = rich.duplicates;
  const memberAttrs = Object.fromEntries(
    rich.entries.map((e) => [e.name, e.attrs || {}]),
  );
  const tagByName = new Map(
    rich.entries.map((e) => [e.name, e.tag || e.attrs?.['タグ'] || '']),
  );

  const validation = validateSplitInput(lines, mode, param);
  if (!validation.ok) {
    const err = new Error(validation.message);
    err.code = validation.code;
    throw err;
  }

  const groupCount = validation.groupCount;
  const targetSize = mode === 'perSize' ? param : Math.ceil(lines.length / groupCount);

  /** @type {import('./group-split-constraints.js').GroupSplitConstraints} */
  const constraints = resolveConstraintsForRun(rich, opts, groupCount);

  const constrained = hasActiveConstraints(constraints);
  const usesMultiAttr = (constraints.attrRules || []).length > 0;
  const relaxRequiredEach = !!opts.relaxRequiredEach;

  let seedBuf = opts.seedBuf;
  let seedHex = opts.seedHex;
  if (seedHex && !seedBuf) seedBuf = seedBufFromHex(seedHex);
  if (!seedBuf || !seedHex) {
    const material = createSeedMaterial();
    seedBuf = material.seedBuf;
    seedHex = material.seedHex;
  }

  const randomFn = createDeterministicRandomFn(seedBuf);
  /** @type {string[][]} */
  let buckets;
  /** @type {string[][]} */
  let overflowReasons = Array.from({ length: groupCount }, () => []);
  let algorithm = 'deterministic-seed-shuffle-round-robin-v1';

  /** @type {Array<{ groupId: number, label: string, value: string }>} */
  let unmetRequired = [];
  /** @type {string[]} */
  let relaxedWarnings = [];

  if (constrained) {
    const result = assignWithConstraints(
      rich.entries,
      groupCount,
      targetSize,
      constraints,
      randomFn,
      shuffleUnits,
      { relaxRequiredEach },
    );
    buckets = result.groups;
    overflowReasons = result.overflowReasons;
    unmetRequired = result.unmetRequired || [];
    relaxedWarnings = result.relaxedWarnings || [];
    algorithm = 'deterministic-seed-constraint-greedy-v1';
    if (usesMultiAttr) algorithm = 'deterministic-seed-constraint-multi-attr-v1';
  } else {
    const shuffled = seededFullShuffle(lines, randomFn);
    buckets = assignRoundRobin(shuffled, groupCount);
  }

  const unmetByGroup = new Map();
  for (const u of unmetRequired) {
    const list = unmetByGroup.get(u.groupId) || [];
    list.push({ label: u.label, value: u.value });
    unmetByGroup.set(u.groupId, list);
  }

  const groups = buckets.map((members, i) => {
    const size = members.length;
    const reasons = [...new Set(overflowReasons[i] || [])];
    const overflow = size > targetSize;
    return {
      id: i + 1,
      label: `グループ${i + 1}`,
      members,
      size,
      targetSize,
      overflow,
      overflowDelta: overflow ? size - targetSize : 0,
      overflowReasons: reasons,
      unmetRequired: unmetByGroup.get(i + 1) || [],
    };
  });

  const rosterCanonical = lines.join('\n');
  const rosterSha256 = await sha256Hex(rosterCanonical);
  const sizes = groups.map((g) => g.members.length);

  let phase = 'A';
  if (constrained) phase = usesMultiAttr || parsed.phaseC ? 'C' : 'B';

  return {
    tool: 'group-split',
    toolVersion: TOOL_VERSION,
    phase,
    mode,
    param,
    targetSize,
    targetLabel: mode === 'perSize' ? `${param}人1組` : `${param}グループ`,
    groupCount,
    groups,
    seedHex,
    rosterSha256,
    rosterCount: lines.length,
    duplicates,
    hasTags: tagByName.size > 0 || usesMultiAttr,
    memberTags: Object.fromEntries([...tagByName.entries()].filter(([, t]) => t)),
    memberAttrs,
    attrLabels: parsed.attrLabels.length
      ? parsed.attrLabels
      : [...new Set((constraints.attrRules || []).map((r) => r.label))],
    columnMapping: parsed.columnMapping,
    sessionLabel,
    splitAtJst: jstNow(),
    sizes,
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    algorithm,
    constraintsApplied: constrained ? {
      bundles: constraints.bundles?.length || 0,
      fixed: constraints.fixedToGroup?.size || 0,
      separatePairs: constraints.separatePairs?.length || 0,
      spreadTags: !!constraints.spreadTags,
      requiredTag: constraints.requiredTag || null,
      hardMax: constraints.hardMax || null,
      attrRules: (constraints.attrRules || []).map((r) => ({
        label: r.label,
        spread: r.spread,
        requiredEach: r.requiredEach || [],
      })),
    } : null,
    overflowGroups: groups.filter((g) => g.overflow).map((g) => g.id),
    preOverflowHint: constrained && willLikelyOverflow(constraints, targetSize),
    constraintRelaxed: relaxRequiredEach && relaxedWarnings.length > 0,
    relaxedWarnings,
    unmetRequired,
  };
}

export function formatTsvLong(result) {
  const tagMap = result.memberTags || {};
  const attrMap = result.memberAttrs || {};
  const attrLabels = result.attrLabels?.length
    ? result.attrLabels
    : [...new Set(Object.values(attrMap).flatMap((a) => Object.keys(a)))];
  const withTags = result.hasTags && attrLabels.length === 0 && Object.keys(tagMap).length > 0;
  const withAttrs = attrLabels.length > 0;

  const header = ['グループ', '氏名'];
  if (withAttrs) header.push(...attrLabels);
  else if (withTags) header.push('タグ');
  const rows = [header.join('\t')];

  for (const g of result.groups) {
    for (const name of g.members) {
      const cols = [`${g.id}`, name];
      if (withAttrs) {
        const a = attrMap[name] || {};
        for (const label of attrLabels) cols.push(a[label] || '');
      } else if (withTags) {
        cols.push(tagMap[name] || '');
      }
      rows.push(cols.join('\t'));
    }
  }
  return rows.join('\n');
}

/**
 * @param {{ groups: Array<{ id: number, label: string, members: string[] }> }} result
 */
export function formatCsvUtf8Bom(result) {
  const body = ['グループ,氏名', ...result.groups.flatMap((g) =>
    g.members.map((name) => `${g.id},${escapeCsvField(name)}`),
  )].join('\r\n');
  return `\uFEFF${body}`;
}

/**
 * @param {string} s
 */
function escapeCsvField(s) {
  const t = String(s);
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

/**
 * @param {{ groups: Array<{ label: string, members: string[] }>, sessionLabel?: string, seedHex?: string }} result
 */
export function formatSlack(result) {
  const title = result.sessionLabel || 'グループ分け結果';
  const target = result.targetSize;
  const blocks = result.groups.map((g) => {
    const list = g.members.map((m) => `・${m}`).join('\n');
    const badge = g.overflow && target
      ? ` (${g.size}名 · 目標+${g.overflowDelta})`
      : ` (${g.size}名)`;
    const reason = g.overflowReasons?.length ? `\n_${g.overflowReasons[0]}_` : '';
    return `*${g.label}*${badge}${reason}\n${list}`;
  });
  const fp = result.rosterSha256 ? `${result.rosterSha256.slice(0, 8)}…` : '—';
  return [
    `*【${title}】*`,
    result.splitAtJst || '',
    '',
    blocks.join('\n\n'),
    '',
    `seed: \`${result.seedHex?.slice(0, 12) || '—'}…\` · 名簿指紋 ${fp}`,
  ].filter(Boolean).join('\n');
}

/**
 * @param {{ groups: Array<{ label: string, members: string[] }> }} result
 */
export function formatLinePlain(result) {
  return result.groups
    .map((g) => `【${g.label}】${g.members.join('、')}`)
    .join('\n');
}

/**
 * @param {{ groups: Array<{ label: string, members: string[] }>, sessionLabel?: string, seedHex?: string }} result
 */
export function formatAnnounce(result) {
  const title = result.sessionLabel || 'ブレイクアウト班割り';
  const lines = result.groups.map((g) =>
    `${g.label}: ${g.members.join(' / ')}`,
  );
  const seedShort = result.seedHex ? `${result.seedHex.slice(0, 12)}…` : '—';
  return [
    `【${title}】`,
    ...lines,
    '',
    `(seed: ${seedShort} · SUGUDASU group-split)`,
  ].join('\n');
}

/**
 * @param {Record<string, unknown>} result
 */
export function formatJson(result) {
  const payload = {
    tool: result.tool,
    toolVersion: result.toolVersion,
    phase: result.phase,
    sessionLabel: result.sessionLabel,
    splitAtJst: result.splitAtJst,
    mode: result.mode,
    param: result.param,
    targetSize: result.targetSize,
    groupCount: result.groupCount,
    seedHex: result.seedHex,
    rosterSha256: result.rosterSha256,
    rosterCount: result.rosterCount,
    duplicates: result.duplicates,
    sizes: result.sizes,
    constraintsApplied: result.constraintsApplied,
    overflowGroups: result.overflowGroups,
    groups: result.groups,
    algorithm: result.algorithm,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * @param {{ groups: Array<{ label: string, members: string[] }>, maxSize?: number, minSize?: number }} result
 */
export function formatTsvWide(result) {
  if (result.maxSize != null && result.minSize != null && result.maxSize - result.minSize > 1) {
    return null;
  }
  const headers = result.groups.map((g) => g.label);
  const maxRows = Math.max(...result.groups.map((g) => g.members.length), 0);
  const rows = [headers.join('\t')];
  for (let r = 0; r < maxRows; r++) {
    rows.push(result.groups.map((g) => g.members[r] || '').join('\t'));
  }
  return rows.join('\n');
}

/** @type {Record<string, (r: Record<string, unknown>) => string | null>} */
export const OUTPUT_FORMATTERS = {
  tsv: formatTsvLong,
  csv: formatCsvUtf8Bom,
  slack: formatSlack,
  line: formatLinePlain,
  announce: formatAnnounce,
  json: formatJson,
  wide: formatTsvWide,
};

export const OUTPUT_LABELS = {
  tsv: 'Excel用 TSV',
  csv: 'CSV（BOM）',
  slack: 'Slack / Teams',
  line: 'LINE / プレーン',
  announce: '告知ブロック',
  json: 'JSON',
  wide: 'TSV（横並び）',
};

/**
 * 2次利用の文字数チェック（Slack 1投稿上限など）
 * @param {{ groups: Array<{ label: string, members: string[] }>, sessionLabel?: string, seedHex?: string, rosterSha256?: string, splitAtJst?: string, rosterCount?: number }} result
 */
export function assessOutputLimits(result) {
  const slack = formatSlack(result);
  const line = formatLinePlain(result);
  const announce = formatAnnounce(result);
  const rosterCount = result.rosterCount ?? result.groups.reduce((s, g) => s + g.members.length, 0);
  return {
    slackChars: slack.length,
    slackOverLimit: slack.length > SLACK_CHAR_SAFE,
    lineChars: line.length,
    announceChars: announce.length,
    tsvRecommended: slack.length > SLACK_CHAR_SAFE || rosterCount > ROSTER_SOFT_WARN,
  };
}

/**
 * 結果一覧 DOM のスクロール枠を組数に応じて決める。
 * @param {number} visibleCount 描画する組数（≤ DOM_GROUP_PREVIEW_MAX）
 * @returns {{ scroll: boolean, maxHeightRem: number | null }}
 */
export function resolveGroupsPreviewLayout(visibleCount) {
  const n = Math.max(0, Math.floor(Number(visibleCount) || 0));
  if (n <= DOM_GROUP_PREVIEW_SCROLL_THRESHOLD) {
    return { scroll: false, maxHeightRem: null };
  }
  return {
    scroll: true,
    maxHeightRem: DOM_GROUP_PREVIEW_VIEWPORT_GROUPS * DOM_GROUP_PREVIEW_ROW_REM,
  };
}

/**
 * @param {string} line
 */
function nameFromPlainRosterLine(line) {
  const trimmed = String(line).trim();
  if (!trimmed) return '';
  if (trimmed.includes('\t')) {
    return trimmed.split('\t')[0].trim();
  }
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    return parts[0] || '';
  }
  return trimmed;
}

/**
 * 名簿テキストから指定氏名の行を除去（M02 · 属性列付き対応）
 * @param {string} rosterText
 * @param {string | string[]} namesToRemove
 * @param {import('./group-split-columns.js').ColumnMapping | null} [columnMapping]
 */
export function removeNamesFromRoster(rosterText, namesToRemove, columnMapping = null) {
  const remove = new Set(
    (Array.isArray(namesToRemove) ? namesToRemove : [namesToRemove])
      .map((n) => String(n).trim())
      .filter(Boolean),
  );
  if (!remove.size) return String(rosterText ?? '');

  const text = String(rosterText ?? '');
  const table = parseTableText(text);
  if (isMultiColumnTable(table)) {
    const map = columnMapping || guessColumnMapping(table);
    const ni = map.nameColumnIndex;
    const delim = table.delimiter === 'comma' ? ',' : '\t';
    const out = [];
    if (table.hasHeader) {
      out.push(table.headers.join(delim));
    }
    for (const row of table.rows) {
      const name = (row[ni] || '').trim();
      if (name && remove.has(name)) continue;
      out.push(row.join(delim));
    }
    return out.join('\n');
  }

  const kept = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const name = nameFromPlainRosterLine(trimmed);
    if (name && remove.has(name)) continue;
    kept.push(trimmed);
  }
  return kept.join('\n');
}

/**
 * @param {Record<string, unknown>} state
 */
export function buildSessionSnapshot(state) {
  return {
    version: SESSION_SNAPSHOT_VERSION,
    tool: 'group-split',
    toolVersion: TOOL_VERSION,
    roster: state.roster ?? '',
    sessionLabel: state.sessionLabel ?? '',
    mode: state.mode === 'groupCount' ? 'groupCount' : 'perSize',
    param: Number(state.param) || 4,
    constraints: state.constraints ?? {},
    columnMapping: state.columnMapping ?? null,
    attrSlotCols: Array.isArray(state.attrSlotCols) ? state.attrSlotCols : [-1, -1, -1],
    seedHex: state.seedHex ?? null,
  };
}

/**
 * @param {string | Record<string, unknown>} raw
 */
export function parseSessionSnapshot(raw) {
  const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!o || o.tool !== 'group-split') {
    throw Object.assign(new Error('group-split のセッションJSONではありません'), { code: 'session_invalid' });
  }
  if (Number(o.version) !== SESSION_SNAPSHOT_VERSION) {
    throw Object.assign(new Error(`セッション version ${o.version} は未対応です`), { code: 'session_version' });
  }
  return /** @type {ReturnType<typeof buildSessionSnapshot>} */ (o);
}

export { willLikelyOverflow } from './group-split-constraints.js';
