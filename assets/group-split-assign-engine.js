/**
 * 希望順位割当（match-board）— エンジン
 * SSOT: docs/notes/DRAFT_ASSIGNMENT_PRODUCT_NOTE.md · draft_meeting.md
 */
export const ASSIGN_TOOL_VERSION = '0.1.0';
export const ASSIGN_SNAPSHOT_VERSION = 1;
export const UNDO_MAX = 100;
/** @typedef {'empty' | 'firstChoice' | 'greedy'} SeedMode */

/** @typedef {'hr' | 'edu' | 'mkt' | 'evt'} AssignPresetId */

export const ASSIGN_PRESETS = {
  hr: {
    id: 'hr',
    label: '人事 · 新卒配属',
    slotNoun: '部署',
    personNoun: '新卒',
    slotsPlaceholder: '部署A\t4\n部署B\t2\n部署C\t2',
    rosterPlaceholder:
      '氏名\t第1希望\t第2希望\t第3希望\t所属\t成績\t前上長評価\n佐藤\t部署A\t部署B\t部署C\t営業\tA\t4.5\n田中\t部署B\t部署A\t部署C\tCS\tB+\t4.0',
  },
  edu: {
    id: 'edu',
    label: '教育 · ゼミ配属',
    slotNoun: '研究室',
    personNoun: '学生',
    slotsPlaceholder: '研究室A\t3\n研究室B\t2\n研究室C\t2',
    rosterPlaceholder:
      '氏名\t第1希望\t第2希望\t第3希望\t所属\t成績\t研究テーマ\n山田\t研究室A\t研究室B\t研究室C\t経済\tA\t計量分析',
  },
  mkt: {
    id: 'mkt',
    label: 'マーケ · 景品棚割',
    slotNoun: 'SKU',
    personNoun: 'セグメント',
    slotsPlaceholder: '人気景品A\t50\n標準景品B\t80\n余りがち景品C\t30',
    rosterPlaceholder:
      'セグメント\t第1希望\t第2希望\t第3希望\t会員ランク\tLTV\t購入頻度\nゴールド会員\t人気景品A\t標準景品B\t余りがち景品C\tGOLD\t高\t週1',
  },
  evt: {
    id: 'evt',
    label: 'イベント · 分科会',
    slotNoun: 'セッション',
    personNoun: '参加者',
    slotsPlaceholder: '分科会A\t20\n分科会B\t15\n分科会C\t15',
    rosterPlaceholder:
      '氏名\t第1希望\t第2希望\t第3希望\t所属\t役割\t経験年数\n鈴木\t分科会A\t分科会C\t分科会B\t開発\tTL\t7',
  },
};

const POOL_ID = '__pool__';

/**
 * @param {string} text
 * @returns {{ id: string, name: string, capacity: number, popularity: number }[]}
 */
export function parseSlotsText(text) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  /** @type {{ id: string, name: string, capacity: number, popularity: number }[]} */
  const slots = [];
  const seen = new Set();
  lines.forEach((line, i) => {
    const parts = line.split(/\t|,/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const name = parts[0];
    const capacity = Math.max(0, Number(parts[1]) || 0);
    // DECISION: 第3列を人気スコア（高いほど人気）として任意入力。マーケ棚割フィルタ用。
    const popularity = parts[2] != null && parts[2] !== '' ? Number(parts[2]) || 0 : slots.length + 1;
    const baseId = slugId(name) || `slot-${i + 1}`;
    let id = baseId;
    let n = 2;
    while (seen.has(id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }
    seen.add(id);
    slots.push({ id, name, capacity, popularity });
  });
  return slots;
}

/**
 * @param {string} text
 * @param {{ slotNameToId?: Map<string, string> }} [opts]
 */
export function parseAssignRosterText(text, opts = {}) {
  const nameToId = opts.slotNameToId || new Map();
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { people: [], errors: ['名簿が空です'] };
  }

  const headerParts = lines[0].split(/\t/).map((p) => p.trim());
  const hasHeader = /希望|第[123123]|preference/i.test(headerParts.slice(1).join(' '))
    || (headerParts.length >= 4 && !nameToId.has(headerParts[1]));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  /** @type {{ id: string, name: string, prefs: string[], attrs: Record<string,string>, prefRankBySlot: Map<string, number> }[]} */
  const people = [];
  const seen = new Set();
  /** @type {string[]} */
  const errors = [];

  const prefIdx = hasHeader
    ? detectPreferenceColumns(headerParts)
    : [1, 2, 3];
  const attrCols = hasHeader
    ? headerParts
      .map((h, idx) => ({ h, idx }))
      .filter((x) => x.idx !== 0 && !prefIdx.includes(x.idx) && x.h)
    : [];

  dataLines.forEach((line, i) => {
    const parts = line.split(/\t/).map((p) => p.trim());
    const name = parts[0];
    if (!name) return;
    const prefs = prefIdx.map((idx) => parts[idx] || '').filter(Boolean);
    const baseId = slugId(name) || `person-${i + 1}`;
    let id = baseId;
    let n = 2;
    while (seen.has(id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }
    seen.add(id);

    /** @type {Map<string, number>} */
    const prefRankBySlot = new Map();
    prefs.forEach((prefName, idx) => {
      const slotId = nameToId.get(prefName) || prefName;
      if (slotId) prefRankBySlot.set(slotId, idx + 1);
    });

    /** @type {Record<string, string>} */
    const attrs = {};
    attrCols.forEach(({ h, idx }) => {
      const v = (parts[idx] || '').trim();
      if (v) attrs[h] = v;
    });

    people.push({ id, name, prefs, attrs, prefRankBySlot });
  });

  if (!people.length) errors.push('有効な行がありません');
  return { people, errors };
}

/**
 * @param {ReturnType<typeof parseSlotsText>} slots
 * @param {ReturnType<typeof parseAssignRosterText>['people']} people
 */
export function buildGreedyAssignment(slots, people) {
  /** @type {Map<string, string>} */
  const assignment = new Map();
  const slotCounts = new Map(slots.map((s) => [s.id, 0]));
  const slotByName = new Map(slots.map((s) => [s.name, s.id]));

  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  for (const person of sorted) {
    let placed = false;
    for (const prefName of person.prefs) {
      const slotId = slotByName.get(prefName) || prefName;
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) continue;
      const count = slotCounts.get(slot.id) || 0;
      if (count < slot.capacity) {
        assignment.set(person.id, slot.id);
        slotCounts.set(slot.id, count + 1);
        placed = true;
        break;
      }
    }
    if (!placed) assignment.set(person.id, POOL_ID);
  }
  return assignment;
}

/**
 * 第1希望のみ先に入れる（超過・未配属は許容）
 * @param {ReturnType<typeof parseSlotsText>} slots
 * @param {ReturnType<typeof parseAssignRosterText>['people']} people
 */
export function buildFirstChoiceAssignment(slots, people) {
  const slotByName = new Map(slots.map((s) => [s.name, s.id]));
  const assignment = new Map();
  for (const person of people) {
    const first = person.prefs[0];
    if (!first) {
      assignment.set(person.id, POOL_ID);
      continue;
    }
    const slotId = slotByName.get(first) || first;
    const exists = slots.some((s) => s.id === slotId);
    assignment.set(person.id, exists ? slotId : POOL_ID);
  }
  return assignment;
}

/**
 * @param {ReturnType<typeof parseAssignRosterText>['people']} people
 */
export function buildEmptyAssignment(people) {
  const assignment = new Map();
  for (const person of people) assignment.set(person.id, POOL_ID);
  return assignment;
}

/**
 * @param {{ slots: ReturnType<typeof parseSlotsText>, people: ReturnType<typeof parseAssignRosterText>['people'], assignment?: Map<string, string>, preset?: AssignPresetId, sessionName?: string }} input
 */
export function createAssignState(input) {
  const { slots, people } = input;
  const assignment = input.assignment || buildGreedyAssignment(slots, people);
  const slotCounts = new Map(slots.map((s) => [s.id, 0]));
  let poolCount = 0;
  let satisfactionTotal = 0;
  let satisfactionMax = people.length * 3;

  for (const person of people) {
    const slotId = assignment.get(person.id) || POOL_ID;
    if (slotId === POOL_ID) {
      poolCount += 1;
    } else {
      slotCounts.set(slotId, (slotCounts.get(slotId) || 0) + 1);
    }
    satisfactionTotal += prefScore(person, slotId);
  }

  return {
    version: ASSIGN_SNAPSHOT_VERSION,
    preset: input.preset || 'hr',
    sessionName: input.sessionName || '',
    seedMode: input.seedMode || 'greedy',
    slots,
    people,
    assignment: new Map(assignment),
    slotCounts,
    poolCount,
    satisfactionTotal,
    satisfactionMax,
    selectedPersonId: null,
    selectedSlotId: null,
  };
}

/**
 * @param {{ prefRankBySlot: Map<string, number> }} person
 * @param {string} slotId
 */
export function prefScore(person, slotId) {
  if (slotId === POOL_ID) return 0;
  const rank = person.prefRankBySlot.get(slotId);
  if (rank === 1) return 3;
  if (rank === 2) return 2;
  if (rank === 3) return 1;
  return 0;
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 * @param {string} personId
 * @param {string} toSlotId — slot id or POOL_ID
 */
export function movePerson(state, personId, toSlotId) {
  const fromSlotId = state.assignment.get(personId) || POOL_ID;
  if (fromSlotId === toSlotId) return { state, command: null };

  const person = state.people.find((p) => p.id === personId);
  if (!person) return { state, command: null };

  if (toSlotId !== POOL_ID) {
    const slot = state.slots.find((s) => s.id === toSlotId);
    if (!slot) return { state, command: null };
    const count = state.slotCounts.get(toSlotId) || 0;
    // DECISION: 定員超過も会議調整で許容。警告はUI側。カウントは実数を反映。
  }

  const next = cloneState(state);
  const oldScore = prefScore(person, fromSlotId);
  const newScore = prefScore(person, toSlotId);

  if (fromSlotId !== POOL_ID) {
    next.slotCounts.set(fromSlotId, (next.slotCounts.get(fromSlotId) || 1) - 1);
  } else {
    next.poolCount -= 1;
  }

  if (toSlotId !== POOL_ID) {
    next.slotCounts.set(toSlotId, (next.slotCounts.get(toSlotId) || 0) + 1);
  } else {
    next.poolCount += 1;
  }

  next.assignment.set(personId, toSlotId);
  next.satisfactionTotal += newScore - oldScore;

  const command = { personId, fromSlotId, toSlotId };
  return { state: next, command };
}

/** @param {ReturnType<typeof createAssignState>} state */
export function applyCommand(state, command) {
  return movePerson(state, command.personId, command.toSlotId).state;
}

/** @param {ReturnType<typeof createAssignState>} state */
export function revertCommand(state, command) {
  return movePerson(state, command.personId, command.fromSlotId).state;
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 */
export function satisfactionPercent(state) {
  if (!state.satisfactionMax) return 0;
  return Math.round((state.satisfactionTotal / state.satisfactionMax) * 100);
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 * @param {string} personId
 */
export function prefRankClass(state, personId) {
  const person = state.people.find((p) => p.id === personId);
  if (!person) return 'neutral';
  const slotId = state.assignment.get(personId) || POOL_ID;
  if (slotId === POOL_ID) return 'pool';
  const rank = person.prefRankBySlot.get(slotId);
  if (rank === 1) return 'rank1';
  if (rank === 2 || rank === 3) return 'rank23';
  return 'mismatch';
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 * @param {string} slotId
 */
export function slotStatus(state, slotId) {
  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) return { count: 0, capacity: 0, over: false, empty: true };
  const count = state.slotCounts.get(slotId) || 0;
  return {
    count,
    capacity: slot.capacity,
    over: count > slot.capacity,
    empty: count === 0,
    fillRatio: slot.capacity ? count / slot.capacity : 0,
  };
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 * @param {'all' | 'popular' | 'unpopular' | 'low-stock'} filter
 */
export function filterSlots(state, filter) {
  const slots = [...state.slots];
  if (filter === 'all') return slots;
  if (filter === 'popular') {
    return [...slots].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }
  if (filter === 'unpopular') {
    return [...slots].sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
  }
  if (filter === 'low-stock') {
    return [...slots].sort((a, b) => {
      const ra = slotStatus(state, a.id).fillRatio;
      const rb = slotStatus(state, b.id).fillRatio;
      return rb - ra;
    });
  }
  return slots;
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 */
export function formatAssignTsv(state) {
  const slotName = new Map(state.slots.map((s) => [s.id, s.name]));
  const lines = ['氏名\t割当先\t希望順位'];
  for (const person of state.people) {
    const slotId = state.assignment.get(person.id) || POOL_ID;
    const dest = slotId === POOL_ID ? '（未配属）' : (slotName.get(slotId) || slotId);
    const rank = slotId === POOL_ID ? '' : String(person.prefRankBySlot.get(slotId) || '—');
    lines.push(`${person.name}\t${dest}\t${rank}`);
  }
  return lines.join('\n');
}

/**
 * @param {ReturnType<typeof createAssignState>} state
 */
export function exportAssignSnapshot(state) {
  return {
    tool: 'match-board',
    version: ASSIGN_SNAPSHOT_VERSION,
    engineVersion: ASSIGN_TOOL_VERSION,
    preset: state.preset,
    sessionName: state.sessionName,
    slots: state.slots,
    people: state.people.map((p) => ({
      id: p.id,
      name: p.name,
      prefs: p.prefs,
      attrs: p.attrs || {},
    })),
    assignment: Object.fromEntries(state.assignment),
    // DECISION: 会議文化に合わせた再開のため、初期たたき台方式をJSONに保持。
    seedMode: state.seedMode || 'greedy',
    satisfactionTotal: state.satisfactionTotal,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * @param {unknown} raw
 */
export function importAssignSnapshot(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!data || data.tool !== 'match-board') {
    throw new Error('match-board の JSON ではありません');
  }
  const slots = (data.slots || []).map((s, i) => ({
    id: s.id || slugId(s.name) || `slot-${i + 1}`,
    name: s.name,
    capacity: Math.max(0, Number(s.capacity) || 0),
    popularity: s.popularity != null ? Number(s.popularity) || 0 : i + 1,
  }));
  if (!slots.length) throw new Error('枠データがありません');
  const nameToId = new Map(slots.map((s) => [s.name, s.id]));
  const rosterText = (data.people || [])
    .map((p) => [p.name, ...(p.prefs || []), ...Object.values(p.attrs || {})].join('\t'))
    .join('\n');
  const { people, errors } = parseAssignRosterText(rosterText, { slotNameToId: nameToId });
  if (errors.length) throw new Error(errors[0]);

  for (const p of people) {
    const src = data.people.find((x) => x.id === p.id || x.name === p.name);
    if (!src) continue;
    p.prefs = src.prefs || p.prefs;
    p.attrs = src.attrs || p.attrs || {};
    p.prefRankBySlot = new Map();
    p.prefs.forEach((prefName, idx) => {
      const slotId = nameToId.get(prefName) || prefName;
      p.prefRankBySlot.set(slotId, idx + 1);
    });
  }

  const assignment = new Map(
    Object.entries(data.assignment || {}).map(([k, v]) => [k, String(v)]),
  );

  return createAssignState({
    slots,
    people,
    assignment,
    preset: data.preset || 'hr',
    sessionName: data.sessionName || '',
    seedMode: data.seedMode || 'greedy',
  });
}

/**
 * @param {string} slotsText
 * @param {string} rosterText
 * @param {{ preset?: AssignPresetId, sessionName?: string, seedMode?: SeedMode }} [opts]
 */
export function buildAssignFromInput(slotsText, rosterText, opts = {}) {
  const slots = parseSlotsText(slotsText);
  if (!slots.length) return { ok: false, errors: ['枠（部署・SKU等）を1行以上入力してください'] };
  const nameToId = new Map(slots.map((s) => [s.name, s.id]));
  const { people, errors } = parseAssignRosterText(rosterText, { slotNameToId: nameToId });
  if (errors.length) return { ok: false, errors };
  if (!people.length) return { ok: false, errors: ['名簿を入力してください'] };

  for (const p of people) {
    p.prefRankBySlot = new Map();
    p.prefs.forEach((prefName, idx) => {
      const slotId = nameToId.get(prefName) || prefName;
      p.prefRankBySlot.set(slotId, idx + 1);
    });
  }

  const seedMode = opts.seedMode || 'greedy';
  let assignment;
  if (seedMode === 'empty') assignment = buildEmptyAssignment(people);
  else if (seedMode === 'firstChoice') assignment = buildFirstChoiceAssignment(slots, people);
  else assignment = buildGreedyAssignment(slots, people);

  const state = createAssignState({
    slots,
    people,
    assignment,
    preset: opts.preset || 'hr',
    sessionName: opts.sessionName || '',
    seedMode,
  });
  return { ok: true, state };
}

/** @param {ReturnType<typeof createAssignState>} state */
function cloneState(state) {
  return {
    ...state,
    assignment: new Map(state.assignment),
    slotCounts: new Map(state.slotCounts),
    people: state.people.map((p) => ({
      ...p,
      attrs: { ...(p.attrs || {}) },
      prefRankBySlot: new Map(p.prefRankBySlot),
    })),
    slots: state.slots.map((s) => ({ ...s })),
  };
}

function slugId(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff-]/g, '')
    .slice(0, 48);
}

export { POOL_ID };

/**
 * @param {string[]} headers
 */
function detectPreferenceColumns(headers) {
  const picks = [];
  const rx = /(第?\s*[123１２３]\s*希望|希望\s*[123１２３]|pref(erence)?\s*[123]?)/i;
  headers.forEach((h, idx) => {
    if (idx === 0) return;
    if (rx.test(h || '')) picks.push(idx);
  });
  if (!picks.length) return [1, 2, 3];
  return picks.slice(0, 3);
}
