/**
 * SUGUDASU 枠取りパレット — 純ロジック
 * docs/notes/SLOT_BOARD_SPEC.md
 */
export const CODE_PREFIX = 'SUGUDASU-SLOT-';
export const UNKNOWN_LANE = '不明';
export const SCHEMA_VERSION = 1;

/**
 * @returns {string}
 */
export function newId() {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function detoxCell(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .trim();
}

/**
 * Excel/TSV貼付 → { name, laneName }[]
 * パース不能でも捨てない（laneName = 不明）
 * @param {string} text
 * @returns {{ name: string, laneName: string }[]}
 */
export function parsePasteRows(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r\n|\n|\r/);
  /** @type {{ name: string, laneName: string }[]} */
  const rows = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // タブ優先。なければ連続空白で2列っぽく分割
    let parts;
    if (line.includes('\t')) {
      parts = line.split('\t').map(detoxCell);
    } else {
      const m = line.trim().match(/^(.+?)(?:\s{2,}|\s+)(.+)$/);
      parts = m ? [detoxCell(m[1]), detoxCell(m[2])] : [detoxCell(line)];
    }
    parts = parts.filter((p, i) => !(i > 0 && p === ''));
    const name = parts[0] || detoxCell(line) || '(空行)';
    const laneName = parts.length >= 2 && parts[1] ? parts[1] : UNKNOWN_LANE;
    rows.push({ name, laneName });
  }
  return rows;
}

/**
 * @param {{ id: string, name: string, limit: number|null }[]} lanes
 * @param {{ id: string, name: string, laneId: string }[]} items
 * @returns {{ laneId: string, count: number, limit: number|null, over: number }[]}
 */
export function computeLaneStats(lanes, items) {
  return lanes.map((lane) => {
    const count = items.filter((it) => it.laneId === lane.id).length;
    const limit = lane.limit == null || lane.limit === '' ? null : Number(lane.limit);
    const lim = Number.isFinite(limit) && limit >= 0 ? limit : null;
    const over = lim == null ? 0 : Math.max(0, count - lim);
    return { laneId: lane.id, count, limit: lim, over };
  });
}

/**
 * @param {{ over: number }[]} stats
 * @returns {boolean}
 */
export function isAllWithinLimits(stats) {
  return stats.every((s) => s.over === 0);
}

/**
 * @param {string} str
 * @returns {string}
 */
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * @param {string} b64
 * @returns {string}
 */
export function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * @param {{ lanes: any[], items: any[] }} state
 * @returns {string}
 */
export function encodeRestoreCode(state) {
  const payload = {
    version: SCHEMA_VERSION,
    lanes: state.lanes.map((l) => ({
      id: l.id,
      name: l.name,
      limit: l.limit == null || l.limit === '' ? null : Number(l.limit),
    })),
    items: state.items.map((it) => ({
      id: it.id,
      name: it.name,
      laneId: it.laneId,
    })),
  };
  return CODE_PREFIX + utf8ToBase64(JSON.stringify(payload));
}

/**
 * @param {string} code
 * @returns {{ ok: true, state: { version: number, lanes: any[], items: any[] } } | { ok: false, reason: string }}
 */
export function decodeRestoreCode(code) {
  const raw = String(code ?? '').trim();
  if (!raw.startsWith(CODE_PREFIX)) {
    return { ok: false, reason: 'prefix' };
  }
  try {
    const json = base64ToUtf8(raw.slice(CODE_PREFIX.length));
    const data = JSON.parse(json);
    if (!data || data.version !== SCHEMA_VERSION) {
      return { ok: false, reason: 'version' };
    }
    if (!Array.isArray(data.lanes) || !Array.isArray(data.items)) {
      return { ok: false, reason: 'shape' };
    }
    const lanes = data.lanes.map((l) => ({
      id: String(l.id),
      name: String(l.name ?? ''),
      limit: l.limit == null || l.limit === '' ? null : Number(l.limit),
    }));
    const items = data.items.map((it) => ({
      id: String(it.id),
      name: String(it.name ?? ''),
      laneId: String(it.laneId),
    }));
    return { ok: true, state: { version: SCHEMA_VERSION, lanes, items } };
  } catch {
    return { ok: false, reason: 'decode' };
  }
}

/**
 * @param {{ name: string, laneName: string }[]} rows
 * @returns {{ lanes: { id: string, name: string, limit: null }[], items: { id: string, name: string, laneId: string }[] }}
 */
export function buildStateFromRows(rows) {
  /** @type {Map<string, string>} */
  const laneIds = new Map();
  /** @type {{ id: string, name: string, limit: null }[]} */
  const lanes = [];
  /** @type {{ id: string, name: string, laneId: string }[]} */
  const items = [];

  const ensureLane = (laneName) => {
    const key = laneName || UNKNOWN_LANE;
    if (laneIds.has(key)) return laneIds.get(key);
    const id = newId();
    laneIds.set(key, id);
    lanes.push({ id, name: key, limit: null });
    return id;
  };

  // 不明を先に確保してもよいが、出現順を保つため出現時に作成
  for (const row of rows) {
    const laneId = ensureLane(row.laneName || UNKNOWN_LANE);
    items.push({ id: newId(), name: row.name, laneId });
  }

  if (!lanes.some((l) => l.name === UNKNOWN_LANE) && rows.some((r) => (r.laneName || UNKNOWN_LANE) === UNKNOWN_LANE)) {
    // already created via ensureLane when needed
  }

  return { lanes, items };
}

/**
 * @param {{ id: string, name: string, limit: number|null }[]} lanes
 * @param {{ id: string, name: string, laneId: string }[]} items
 * @param {string} laneIdToDelete
 * @returns {{ lanes: typeof lanes, items: typeof items }}
 */
export function deleteLaneMovingToUnknown(lanes, items, laneIdToDelete) {
  const nextLanes = lanes.filter((l) => l.id !== laneIdToDelete);
  let unknown = nextLanes.find((l) => l.name === UNKNOWN_LANE);
  if (!unknown) {
    unknown = { id: newId(), name: UNKNOWN_LANE, limit: null };
    nextLanes.push(unknown);
  }
  const nextItems = items.map((it) =>
    it.laneId === laneIdToDelete ? { ...it, laneId: unknown.id } : it
  );
  return { lanes: nextLanes, items: nextItems };
}

/**
 * @param {{ id: string, name: string, laneId: string }[]} items
 * @param {{ id: string, name: string }[]} lanes
 * @returns {string}
 */
export function buildTsv(items, lanes) {
  const nameById = new Map(lanes.map((l) => [l.id, l.name]));
  return items.map((it) => `${it.name}\t${nameById.get(it.laneId) || UNKNOWN_LANE}`).join('\n');
}
