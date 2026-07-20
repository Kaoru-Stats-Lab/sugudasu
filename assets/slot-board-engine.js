/**
 * SUGUDASU 枠取りパレット — 純ロジック
 * docs/notes/SLOT_BOARD_SPEC.md v0.2
 */

export const CODE_PREFIX = 'SUGUDASU-SLOT-';
export const UNKNOWN_LANE = '不明';
export const SCHEMA_VERSION = 2;
export const LEGACY_SCHEMA_VERSION = 1;
export const HISTORY_MAX = 100;
export const STATUSES = Object.freeze(['pool', 'pending', 'assigned', 'removed']);

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
 * Box1: `最優秀賞=1` / `優秀賞:3` / `S	3` → { title, capacity }[]
 * @param {string} text
 * @returns {{ title: string, capacity: number|null }[]}
 */
export function parseBox1Rules(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r\n|\n|\r/);
  /** @type {{ title: string, capacity: number|null }[]} */
  const out = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;
    let title = '';
    let capRaw = '';

    if (line.includes('\t')) {
      const parts = line.split('\t').map(detoxCell);
      title = parts[0] || '';
      capRaw = parts[1] || '';
    } else {
      const m = line.trim().match(/^(.+?)\s*[=:：]\s*(.*)$/);
      if (m) {
        title = detoxCell(m[1]);
        capRaw = detoxCell(m[2]);
      } else {
        const m2 = line.trim().match(/^(.+?)\s+(\d+)\s*$/);
        if (m2) {
          title = detoxCell(m2[1]);
          capRaw = detoxCell(m2[2]);
        } else {
          title = detoxCell(line);
          capRaw = '';
        }
      }
    }

    if (!title || seen.has(title)) continue;
    seen.add(title);
    let capacity = null;
    if (capRaw !== '') {
      const n = Number(capRaw.replace(/[^\d.-]/g, ''));
      capacity = Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    }
    out.push({ title, capacity });
  }
  return out;
}

/**
 * Box2: 候補リスト → pool 用行（rawText 非破壊）
 * @param {string} text
 * @returns {{ name: string, rawText: string }[]}
 */
export function parseBox2Candidates(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r\n|\n|\r/);
  /** @type {{ name: string, rawText: string }[]} */
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const rawText = line;
    let name;
    if (line.includes('\t')) {
      name = detoxCell(line.split('\t')[0]) || detoxCell(line) || '(空行)';
    } else {
      name = detoxCell(line) || '(空行)';
    }
    rows.push({ name, rawText });
  }
  return rows;
}

/**
 * 旧: Excel/TSV貼付 → { name, laneName }[]（互換）
 * @param {string} text
 * @returns {{ name: string, laneName: string, rawText: string }[]}
 */
export function parsePasteRows(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r\n|\n|\r/);
  /** @type {{ name: string, laneName: string, rawText: string }[]} */
  const rows = [];

  for (const line of lines) {
    if (!line.trim()) continue;
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
    rows.push({ name, laneName, rawText: line });
  }
  return rows;
}

/**
 * @param {object[]} lanes { id, capacity }
 * @param {object[]} candidates
 * @returns {{ laneId: string, count: number, capacity: number|null, over: number }[]}
 */
export function computeLaneStats(lanes, candidates) {
  return lanes.map((lane) => {
    const count = candidates.filter(
      (c) => c.status === 'assigned' && c.laneId === lane.id
    ).length;
    const capacity =
      lane.capacity == null || lane.capacity === ''
        ? lane.limit == null || lane.limit === ''
          ? null
          : Number(lane.limit)
        : Number(lane.capacity);
    const lim = Number.isFinite(capacity) && capacity >= 0 ? capacity : null;
    const over = lim == null ? 0 : Math.max(0, count - lim);
    return { laneId: lane.id, count, capacity: lim, limit: lim, over };
  });
}

/**
 * @param {{ over: number }[]} stats
 */
export function isAllWithinLimits(stats) {
  return stats.every((s) => s.over === 0);
}

/**
 * @param {string} str
 */
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * @param {string} b64
 */
export function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * @param {string} [name]
 */
export function createEmptyProject(name = '枠取りボード') {
  const now = Date.now();
  return {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    isReadOnly: false,
    hideEvidence: false,
    participants: [],
  };
}

/**
 * @param {string} projectId
 * @param {{ title: string, capacity: number|null }[]} rules
 */
export function lanesFromBox1(projectId, rules) {
  return rules.map((r, i) => ({
    id: newId(),
    projectId,
    title: r.title,
    capacity: r.capacity,
    order: i,
  }));
}

/**
 * @param {string} projectId
 * @param {{ name: string, rawText: string }[]} rows
 * @param {number} [orderStart]
 */
export function candidatesFromBox2(projectId, rows, orderStart = 0) {
  return rows.map((r, i) => ({
    id: newId(),
    projectId,
    laneId: null,
    status: 'pool',
    name: r.name,
    rawText: r.rawText,
    order: orderStart + i,
    isMaskedOverride: null,
  }));
}

/**
 * 旧 TSV → lanes + assigned candidates
 * @param {string} projectId
 * @param {{ name: string, laneName: string, rawText?: string }[]} rows
 */
export function buildStateFromRows(projectId, rows) {
  // 互換: 旧 signature buildStateFromRows(rows)
  if (typeof projectId === 'object' || Array.isArray(projectId)) {
    rows = /** @type {any} */ (projectId);
    projectId = newId();
  }
  /** @type {Map<string, string>} */
  const laneIds = new Map();
  /** @type {object[]} */
  const lanes = [];
  /** @type {object[]} */
  const items = [];
  /** @type {object[]} */
  const candidates = [];

  const ensureLane = (laneName) => {
    const key = laneName || UNKNOWN_LANE;
    if (laneIds.has(key)) return laneIds.get(key);
    const id = newId();
    laneIds.set(key, id);
    const lane = {
      id,
      projectId,
      title: key,
      name: key,
      capacity: null,
      limit: null,
      order: lanes.length,
    };
    lanes.push(lane);
    return id;
  };

  for (const row of rows) {
    const laneId = ensureLane(row.laneName || UNKNOWN_LANE);
    const id = newId();
    items.push({ id, name: row.name, laneId });
    candidates.push({
      id,
      projectId,
      laneId,
      status: 'assigned',
      name: row.name,
      rawText: row.rawText ?? row.name,
      order: candidates.length,
      isMaskedOverride: null,
    });
  }

  return { projectId, lanes, items, candidates };
}

/**
 * @param {object[]} historyLogs
 * @param {object} entryFields
 * @param {string} projectId
 */
export function appendHistory(historyLogs, projectId, entryFields) {
  const seq =
    historyLogs.reduce((m, h) => Math.max(m, Number(h.seq) || 0), 0) + 1;
  const entry = {
    id: newId(),
    projectId,
    seq,
    timestamp: Date.now(),
    candidateId: null,
    candidateName: '',
    fromStatus: null,
    fromLaneId: null,
    fromLaneLabel: null,
    toStatus: null,
    toLaneId: null,
    toLaneLabel: null,
    action: 'move',
    actor: null,
    ...entryFields,
  };
  const next = [...historyLogs, entry];
  while (next.length > HISTORY_MAX) next.shift();
  return { historyLogs: next, entry };
}

/**
 * @param {object[]} lanes
 * @param {string|null} laneId
 */
export function laneLabel(lanes, laneId) {
  if (!laneId) return null;
  const l = lanes.find((x) => x.id === laneId);
  return l ? l.title || l.name || null : null;
}

/**
 * 候補を移動（超過ブロックしない）
 * @returns {{ candidates: object[], historyLogs: object[], entry: object }|null}
 */
export function moveCandidate(state, candidateId, toStatus, toLaneId, actor = null) {
  const { project, lanes, candidates, historyLogs } = state;
  if (project?.isReadOnly) return null;
  const idx = candidates.findIndex((c) => c.id === candidateId);
  if (idx < 0) return null;
  const c = candidates[idx];
  let status = toStatus;
  let laneId = toLaneId;

  if (status === 'assigned') {
    if (!laneId) return null;
    if (!lanes.some((l) => l.id === laneId)) return null;
  } else {
    laneId = null;
    if (status !== 'pool' && status !== 'pending' && status !== 'removed') {
      status = 'pool';
    }
  }

  if (c.status === status && c.laneId === laneId) return null;

  const { historyLogs: nextHist, entry } = appendHistory(historyLogs, project.id, {
    action: 'move',
    candidateId: c.id,
    candidateName: c.name,
    fromStatus: c.status,
    fromLaneId: c.laneId,
    fromLaneLabel: laneLabel(lanes, c.laneId),
    toStatus: status,
    toLaneId: laneId,
    toLaneLabel: laneLabel(lanes, laneId),
    actor,
  });

  const nextCand = candidates.map((x, i) =>
    i === idx ? { ...x, status, laneId } : x
  );
  return { candidates: nextCand, historyLogs: nextHist, entry };
}

/**
 * history 最新1件を Undo
 */
export function undoLast(state) {
  const { project, lanes, candidates, historyLogs } = state;
  if (project?.isReadOnly) return null;
  if (!historyLogs.length) return null;
  const last = historyLogs[historyLogs.length - 1];
  const rest = historyLogs.slice(0, -1);

  if (last.action === 'move') {
    const nextCand = candidates.map((c) => {
      if (c.id !== last.candidateId) return c;
      return {
        ...c,
        status: last.fromStatus || 'pool',
        laneId: last.fromLaneId ?? null,
      };
    });
    return { candidates: nextCand, historyLogs: rest, lanes, undone: last };
  }

  if (last.action === 'capacity_change') {
    const nextLanes = lanes.map((l) =>
      l.id === last.toLaneId
        ? { ...l, capacity: last.fromCapacity ?? null }
        : l
    );
    return { candidates, historyLogs: rest, lanes: nextLanes, undone: last };
  }

  if (last.action === 'lane_create') {
    const nextLanes = lanes.filter((l) => l.id !== last.toLaneId);
    const nextCand = candidates.map((c) =>
      c.laneId === last.toLaneId
        ? { ...c, laneId: null, status: c.status === 'assigned' ? 'pool' : c.status }
        : c
    );
    return { candidates: nextCand, historyLogs: rest, lanes: nextLanes, undone: last };
  }

  if (last.action === 'lane_delete' && last.snapshotLane) {
    const restored = { ...last.snapshotLane };
    const nextLanes = [...lanes, restored].sort((a, b) => (a.order || 0) - (b.order || 0));
    const moves = last.movedCandidateIds || [];
    const nextCand = candidates.map((c) => {
      if (!moves.includes(c.id)) return c;
      return {
        ...c,
        laneId: restored.id,
        status: 'assigned',
      };
    });
    return { candidates: nextCand, historyLogs: rest, lanes: nextLanes, undone: last };
  }

  return { candidates, historyLogs: rest, lanes, undone: last };
}

/**
 * @param {object[]} lanes
 * @param {object[]} candidates
 * @param {string} laneIdToDelete
 * @param {string} projectId
 * @param {object[]} historyLogs
 */
export function deleteLaneMovingToPool(lanes, candidates, laneIdToDelete, projectId, historyLogs, actor = null) {
  const lane = lanes.find((l) => l.id === laneIdToDelete);
  if (!lane) return null;
  const movedIds = candidates.filter((c) => c.laneId === laneIdToDelete).map((c) => c.id);
  const nextLanes = lanes.filter((l) => l.id !== laneIdToDelete);
  const nextCand = candidates.map((c) =>
    c.laneId === laneIdToDelete
      ? { ...c, laneId: null, status: c.status === 'assigned' ? 'pool' : c.status }
      : c
  );
  const { historyLogs: nextHist } = appendHistory(historyLogs, projectId, {
    action: 'lane_delete',
    toLaneId: laneIdToDelete,
    toLaneLabel: lane.title || lane.name,
    snapshotLane: { ...lane },
    movedCandidateIds: movedIds,
    actor,
  });
  return { lanes: nextLanes, candidates: nextCand, historyLogs: nextHist };
}

/**
 * 旧: 不明レーンへ（レガシー互換）
 */
export function deleteLaneMovingToUnknown(lanes, items, laneIdToDelete) {
  const nextLanes = lanes.filter((l) => l.id !== laneIdToDelete);
  let unknown = nextLanes.find((l) => (l.title || l.name) === UNKNOWN_LANE);
  if (!unknown) {
    unknown = {
      id: newId(),
      name: UNKNOWN_LANE,
      title: UNKNOWN_LANE,
      limit: null,
      capacity: null,
      order: nextLanes.length,
    };
    nextLanes.push(unknown);
  }
  const nextItems = items.map((it) =>
    it.laneId === laneIdToDelete ? { ...it, laneId: unknown.id } : it
  );
  return { lanes: nextLanes, items: nextItems };
}

/**
 * @param {object} bundle { project, lanes, candidates, historyLogs }
 */
export function encodeRestoreCode(bundle) {
  // 旧: { lanes, items }（project なし）
  const isLegacy = !bundle.project && Array.isArray(bundle.items);
  if (isLegacy) {
    const payload = {
      version: LEGACY_SCHEMA_VERSION,
      lanes: bundle.lanes.map((l) => ({
        id: l.id,
        name: l.title || l.name,
        limit: l.capacity ?? l.limit ?? null,
      })),
      items: bundle.items.map((it) => ({
        id: it.id,
        name: it.name,
        laneId: it.laneId,
      })),
    };
    return CODE_PREFIX + utf8ToBase64(JSON.stringify(payload));
  }

  const payload = {
    version: SCHEMA_VERSION,
    project: {
      name: bundle.project.name,
      isReadOnly: false,
      hideEvidence: !!bundle.project.hideEvidence,
      participants: bundle.project.participants || [],
    },
    lanes: bundle.lanes.map((l) => ({
      id: l.id,
      title: l.title || l.name,
      capacity: l.capacity ?? l.limit ?? null,
      order: l.order ?? 0,
    })),
    candidates: bundle.candidates.map((c) => ({
      id: c.id,
      laneId: c.laneId,
      status: c.status,
      name: c.name,
      rawText: c.rawText,
      order: c.order ?? 0,
      isMaskedOverride: c.isMaskedOverride ?? null,
    })),
    historyLogs: (bundle.historyLogs || []).slice(-HISTORY_MAX),
  };
  return CODE_PREFIX + utf8ToBase64(JSON.stringify(payload));
}

/**
 * @param {string} code
 */
export function decodeRestoreCode(code) {
  const raw = String(code ?? '').trim();
  if (!raw.startsWith(CODE_PREFIX)) {
    return { ok: false, reason: 'prefix' };
  }
  try {
    const json = base64ToUtf8(raw.slice(CODE_PREFIX.length));
    const data = JSON.parse(json);
    if (!data) return { ok: false, reason: 'shape' };

    if (data.version === LEGACY_SCHEMA_VERSION) {
      if (!Array.isArray(data.lanes) || !Array.isArray(data.items)) {
        return { ok: false, reason: 'shape' };
      }
      const project = createEmptyProject('復元（旧コード）');
      const lanes = data.lanes.map((l, i) => ({
        id: String(l.id),
        projectId: project.id,
        title: String(l.name ?? ''),
        capacity: l.limit == null || l.limit === '' ? null : Number(l.limit),
        order: i,
      }));
      const candidates = data.items.map((it, i) => ({
        id: String(it.id),
        projectId: project.id,
        laneId: String(it.laneId),
        status: 'assigned',
        name: String(it.name ?? ''),
        rawText: String(it.name ?? ''),
        order: i,
        isMaskedOverride: null,
      }));
      return {
        ok: true,
        state: { project, lanes, candidates, historyLogs: [], version: SCHEMA_VERSION },
      };
    }

    if (data.version !== SCHEMA_VERSION) return { ok: false, reason: 'version' };
    if (!Array.isArray(data.lanes) || !Array.isArray(data.candidates)) {
      return { ok: false, reason: 'shape' };
    }
    const project = {
      ...createEmptyProject(data.project?.name || '復元'),
      hideEvidence: !!data.project?.hideEvidence,
      participants: Array.isArray(data.project?.participants)
        ? data.project.participants.map(String)
        : [],
      isReadOnly: false,
    };
    const lanes = data.lanes.map((l, i) => ({
      id: String(l.id),
      projectId: project.id,
      title: String(l.title ?? l.name ?? ''),
      capacity: l.capacity == null || l.capacity === '' ? null : Number(l.capacity),
      order: l.order ?? i,
    }));
    const idMap = new Map(lanes.map((l) => [l.id, l.id]));
    const candidates = data.candidates.map((c, i) => ({
      id: String(c.id),
      projectId: project.id,
      laneId: c.laneId && idMap.has(String(c.laneId)) ? String(c.laneId) : null,
      status: STATUSES.includes(c.status) ? c.status : c.laneId ? 'assigned' : 'pool',
      name: String(c.name ?? ''),
      rawText: String(c.rawText ?? c.name ?? ''),
      order: c.order ?? i,
      isMaskedOverride:
        c.isMaskedOverride === true || c.isMaskedOverride === false
          ? c.isMaskedOverride
          : null,
    }));
    return {
      ok: true,
      state: {
        project,
        lanes,
        candidates,
        historyLogs: Array.isArray(data.historyLogs) ? data.historyLogs : [],
        version: SCHEMA_VERSION,
      },
    };
  } catch {
    return { ok: false, reason: 'decode' };
  }
}

/**
 * JSON エクスポート（ファイル用）
 */
export function exportProjectJson(bundle) {
  return JSON.stringify(
    {
      schema: 'sugudasu-slot-board',
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      project: {
        name: bundle.project.name,
        hideEvidence: !!bundle.project.hideEvidence,
        participants: bundle.project.participants || [],
      },
      lanes: bundle.lanes,
      candidates: bundle.candidates,
      historyLogs: bundle.historyLogs || [],
    },
    null,
    2
  );
}

/**
 * インポート: ID 再採番して新規プロジェクト
 * @param {string|object} json
 */
export function importProjectJson(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || (data.schema && data.schema !== 'sugudasu-slot-board')) {
    if (data?.version === LEGACY_SCHEMA_VERSION || data?.version === SCHEMA_VERSION) {
      // restore-code 形 or bare
    } else if (!Array.isArray(data.lanes)) {
      throw new Error('invalid-json');
    }
  }
  const project = createEmptyProject(data.project?.name || 'インポート');
  project.hideEvidence = !!data.project?.hideEvidence;
  project.participants = Array.isArray(data.project?.participants)
    ? data.project.participants.map(String)
    : [];

  /** @type {Map<string, string>} */
  const laneIdMap = new Map();
  const lanes = (data.lanes || []).map((l, i) => {
    const nid = newId();
    laneIdMap.set(String(l.id), nid);
    return {
      id: nid,
      projectId: project.id,
      title: String(l.title ?? l.name ?? ''),
      capacity:
        l.capacity == null && l.limit == null
          ? null
          : Number(l.capacity ?? l.limit),
      order: l.order ?? i,
    };
  });

  /** @type {Map<string, string>} */
  const candIdMap = new Map();
  const candidates = (data.candidates || data.items || []).map((c, i) => {
    const nid = newId();
    candIdMap.set(String(c.id), nid);
    const oldLane = c.laneId != null ? String(c.laneId) : null;
    const laneId = oldLane && laneIdMap.has(oldLane) ? laneIdMap.get(oldLane) : null;
    let status = c.status;
    if (!STATUSES.includes(status)) {
      status = laneId ? 'assigned' : 'pool';
    }
    if (status === 'assigned' && !laneId) status = 'pool';
    return {
      id: nid,
      projectId: project.id,
      laneId: status === 'assigned' ? laneId : null,
      status,
      name: String(c.name ?? ''),
      rawText: String(c.rawText ?? c.name ?? ''),
      order: c.order ?? i,
      isMaskedOverride:
        c.isMaskedOverride === true || c.isMaskedOverride === false
          ? c.isMaskedOverride
          : null,
    };
  });

  const historyLogs = (data.historyLogs || [])
    .slice(-HISTORY_MAX)
    .map((h, i) => ({
      ...h,
      id: newId(),
      projectId: project.id,
      seq: i + 1,
      candidateId: h.candidateId && candIdMap.has(String(h.candidateId))
        ? candIdMap.get(String(h.candidateId))
        : null,
      fromLaneId:
        h.fromLaneId && laneIdMap.has(String(h.fromLaneId))
          ? laneIdMap.get(String(h.fromLaneId))
          : null,
      toLaneId:
        h.toLaneId && laneIdMap.has(String(h.toLaneId))
          ? laneIdMap.get(String(h.toLaneId))
          : null,
    }));

  return { project, lanes, candidates, historyLogs };
}

/**
 * PPT 階層テキスト / TSV
 * @param {object[]} candidates
 * @param {object[]} lanes
 * @param {{ assigned?: boolean, pool?: boolean, pending?: boolean }} include
 * @param {'ppt'|'tsv'} format
 */
export function buildOutputText(candidates, lanes, include, format = 'tsv') {
  const want = {
    assigned: include?.assigned !== false,
    pool: !!include?.pool,
    pending: !!include?.pending,
  };
  const titleOf = (id) => {
    const l = lanes.find((x) => x.id === id);
    return l ? l.title || l.name : UNKNOWN_LANE;
  };

  const lines = [];
  if (want.assigned) {
    const byLane = new Map(lanes.map((l) => [l.id, []]));
    for (const c of candidates) {
      if (c.status !== 'assigned' || !c.laneId) continue;
      if (!byLane.has(c.laneId)) byLane.set(c.laneId, []);
      byLane.get(c.laneId).push(c);
    }
    for (const lane of lanes) {
      const list = byLane.get(lane.id) || [];
      if (!list.length) continue;
      if (format === 'ppt') {
        lines.push(lane.title || lane.name);
        for (const c of list) lines.push(`\t${c.name}`);
      } else {
        for (const c of list) lines.push(`${c.name}\t${titleOf(lane.id)}`);
      }
    }
  }
  if (want.pool) {
    const list = candidates.filter((c) => c.status === 'pool');
    if (format === 'ppt' && list.length) {
      lines.push('未配置');
      for (const c of list) lines.push(`\t${c.name}`);
    } else if (format === 'tsv') {
      for (const c of list) lines.push(`${c.name}\t(未配置)`);
    }
  }
  if (want.pending) {
    const list = candidates.filter((c) => c.status === 'pending');
    if (format === 'ppt' && list.length) {
      lines.push('保留');
      for (const c of list) lines.push(`\t${c.name}`);
    } else if (format === 'tsv') {
      for (const c of list) lines.push(`${c.name}\t(保留)`);
    }
  }
  return lines.join('\n');
}

/**
 * @param {object[]} items
 * @param {object[]} lanes
 */
export function buildTsv(items, lanes) {
  // 旧 items または candidates
  if (items[0] && 'status' in items[0]) {
    return buildOutputText(items, lanes, { assigned: true, pool: true, pending: true }, 'tsv');
  }
  const nameById = new Map(lanes.map((l) => [l.id, l.title || l.name]));
  return items.map((it) => `${it.name}\t${nameById.get(it.laneId) || UNKNOWN_LANE}`).join('\n');
}

/**
 * 目隠し表示するかどうか
 */
export function shouldMaskEvidence(project, candidate) {
  if (candidate.isMaskedOverride === true) return true;
  if (candidate.isMaskedOverride === false) return false;
  return !!project.hideEvidence;
}
