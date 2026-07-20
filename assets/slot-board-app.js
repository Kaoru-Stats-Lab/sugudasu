/**
 * SUGUDASU 枠取りパレット — UI
 * docs/notes/SLOT_BOARD_SPEC.md v0.2
 */
import {
  parseBox1Rules,
  parseBox2Candidates,
  parsePasteRows,
  buildStateFromRows,
  lanesFromBox1,
  candidatesFromBox2,
  createEmptyProject,
  encodeRestoreCode,
  decodeRestoreCode,
  computeLaneStats,
  isAllWithinLimits,
  deleteLaneMovingToPool,
  moveCandidate,
  undoLast,
  appendHistory,
  buildOutputText,
  exportProjectJson,
  importProjectJson,
  shouldMaskEvidence,
  newId,
  CODE_PREFIX,
} from './slot-board-engine.js';
import {
  openDb,
  loadProjectBundle,
  putProjectBundle,
  listProjects,
  deleteProjectBundle,
} from './slot-board-db.js';

const $ = (id) => document.getElementById(id);
const ACTIVE_KEY = 'sugudasu-slot-active-project';

/** @type {IDBDatabase|null} */
let db = null;
/** @type {ReturnType<typeof createEmptyProject>} */
let project = createEmptyProject();
/** @type {object[]} */
let lanes = [];
/** @type {object[]} */
let candidates = [];
/** @type {object[]} */
let historyLogs = [];

/** uiState — DB に保存しない */
let selectedCandidateId = null;
/** @type {Map<string, boolean>} */
const wasOver = new Map();
/** @type {Set<string>} */
const flashLaneIds = new Set();
let persistTimer = null;
let dragCandidateId = null;

function setActionMsg(msg) {
  const el = $('sb-action-msg');
  if (el) el.textContent = msg || '';
}

function setImportMsg(msg) {
  const el = $('sb-import-msg');
  if (el) el.textContent = msg || '';
}

function actor() {
  const v = String($('sb-actor')?.value || '').trim();
  return v || null;
}

function bundle() {
  return { project, lanes, candidates, historyLogs };
}

function schedulePersist() {
  project.updatedAt = Date.now();
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistNow().catch((err) => console.error(err));
  }, 200);
}

async function persistNow() {
  if (!db) return;
  await putProjectBundle(db, project, lanes, candidates, historyLogs);
  try {
    localStorage.setItem(ACTIVE_KEY, project.id);
  } catch {
    /* ignore */
  }
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function clearSelection() {
  selectedCandidateId = null;
}

function guardReadonly() {
  if (project.isReadOnly) {
    setActionMsg('読み取り専用です。解除すると編集できます。');
    return true;
  }
  return false;
}

function renderSummary() {
  const stats = computeLaneStats(lanes, candidates);
  const badge = $('sb-summary-badge');
  const box = $('sb-summary');
  if (!badge || !box) return;

  const hasData = lanes.length > 0 || candidates.length > 0;
  if (!hasData) {
    box.classList.add('hidden');
    box.classList.remove('sb-summary--ok', 'sb-summary--over');
    badge.textContent = '';
    return;
  }

  box.classList.remove('hidden');
  const overNames = [];
  for (const lane of lanes) {
    const st = stats.find((s) => s.laneId === lane.id);
    if (st && st.over > 0) overNames.push(lane.title || lane.name);
  }
  const anyOver = overNames.length > 0;
  const ok = isAllWithinLimits(stats);

  box.classList.remove('sb-summary--ok', 'sb-summary--over');
  if (anyOver) {
    box.classList.add('sb-summary--over');
    badge.textContent = `🚨 枠内超過あり（${overNames.join(' · ')}）`;
  } else if (ok) {
    box.classList.add('sb-summary--ok');
    badge.textContent = '✅ 全レーン枠内';
  } else {
    badge.textContent = '配置を確認中（上限未設定のレーンあり）';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardHtml(c) {
  const selected = c.id === selectedCandidateId ? ' sb-item--selected' : '';
  const mask = shouldMaskEvidence(project, c);
  const evidence =
    c.rawText && c.rawText !== c.name
      ? `<span class="sb-item__evidence${mask ? ' sb-item__evidence--masked' : ''}">${escapeHtml(
          mask ? '████████' : c.rawText
        )}</span>`
      : '';
  const placeBtn =
    selectedCandidateId && selectedCandidateId !== c.id
      ? ''
      : selectedCandidateId === c.id
        ? ''
        : '';
  return `<div class="sb-item${selected}" draggable="${project.isReadOnly ? 'false' : 'true'}" data-cand="${c.id}" tabindex="0" role="button">
    <span class="sb-item__name">${escapeHtml(c.name)}</span>${evidence}${placeBtn}
  </div>`;
}

function zonePlaceBtn(targetStatus, laneId) {
  if (!selectedCandidateId || project.isReadOnly) return '';
  return `<button type="button" class="sb-place-btn" data-place-status="${targetStatus}" data-place-lane="${laneId || ''}">ここへ配置</button>`;
}

function renderPools() {
  const root = $('sb-pools');
  if (!root) return;
  const pool = candidates.filter((c) => c.status === 'pool');
  const pending = candidates.filter((c) => c.status === 'pending');
  const selClass = selectedCandidateId ? ' sb-zone--place-target' : '';

  root.innerHTML = `
    <div class="sb-zone${selClass}" data-drop-status="pool">
      <div class="sb-zone__head">未配置（pool）· ${pool.length} 人 ${zonePlaceBtn('pool', null)}</div>
      <div class="sb-zone__body" data-drop-status="pool">${pool.map(cardHtml).join('') || '<p class="text-[11px] text-slate-400 px-1">候補を Box2 から追加</p>'}</div>
    </div>
    <div class="sb-zone${selClass}" data-drop-status="pending">
      <div class="sb-zone__head">保留（pending）· ${pending.length} 人 ${zonePlaceBtn('pending', null)}</div>
      <div class="sb-zone__body" data-drop-status="pending">${pending.map(cardHtml).join('') || ''}</div>
    </div>
  `;
}

function renderLanes() {
  const root = $('sb-lanes');
  const empty = $('sb-empty');
  if (!root) return;

  const stats = computeLaneStats(lanes, candidates);
  const statsById = new Map(stats.map((s) => [s.laneId, s]));
  const hasData = lanes.length > 0 || candidates.length > 0;
  if (empty) empty.classList.toggle('hidden', hasData);

  for (const st of stats) {
    const prev = wasOver.get(st.laneId) === true;
    const now = st.over > 0;
    if (now && !prev) {
      flashLaneIds.add(st.laneId);
      setTimeout(() => {
        flashLaneIds.delete(st.laneId);
        render();
      }, 1200);
    }
    wasOver.set(st.laneId, now);
  }

  const placeClass = selectedCandidateId ? ' sb-lane--place-target' : '';

  root.innerHTML = lanes
    .map((lane) => {
      const st = statsById.get(lane.id) || { count: 0, capacity: null, over: 0 };
      const over = st.over > 0;
      const flash = flashLaneIds.has(lane.id);
      const list = candidates
        .filter((c) => c.status === 'assigned' && c.laneId === lane.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const capLabel =
        st.capacity == null ? `${st.count} 人（上限なし）` : `${st.count} / ${st.capacity}人`;
      const overLabel = over ? `<span class="sb-lane__over-label">${st.over}人超過</span>` : '';

      return `<div class="sb-lane${over ? ' sb-lane--over' : ''}${flash ? ' sb-lane--flash' : ''}${placeClass}" data-lane-id="${lane.id}">
        <div class="sb-lane__head">
          <input class="sb-inline sb-lane__title-input" data-lane-title="${lane.id}" value="${escapeHtml(lane.title || '')}" ${project.isReadOnly ? 'readonly' : ''}>
          <label class="text-[11px] text-slate-600">上限
            <input type="number" min="0" class="sb-inline sb-inline--limit" data-lane-cap="${lane.id}" value="${st.capacity == null ? '' : st.capacity}" placeholder="—" ${project.isReadOnly ? 'readonly' : ''}>
          </label>
          <span class="sb-lane__meta">${over ? '🚨 ' : '✅ '}${capLabel}</span>
          ${overLabel}
          ${zonePlaceBtn('assigned', lane.id)}
          <div class="sb-lane__actions">
            <button type="button" data-del-lane="${lane.id}" ${project.isReadOnly ? 'disabled' : ''}>削除</button>
          </div>
        </div>
        <div class="sb-lane__body" data-drop-status="assigned" data-drop-lane="${lane.id}">
          ${list.map(cardHtml).join('')}
        </div>
      </div>`;
    })
    .join('');
}

function bindBoardEvents() {
  const main = $('sb-lanes')?.parentElement;
  if (!main || main.dataset.sbBound) return;
  main.dataset.sbBound = '1';

  document.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.closest('#sb-toolbar') || t.closest('textarea') || t.closest('input') || t.closest('button') || t.closest('label')) {
      // fall through for buttons handled below
    }

    const place = t.closest('[data-place-status]');
    if (place) {
      e.preventDefault();
      e.stopPropagation();
      if (guardReadonly()) return;
      const status = place.getAttribute('data-place-status');
      const laneId = place.getAttribute('data-place-lane') || null;
      if (selectedCandidateId) {
        applyMove(selectedCandidateId, status, status === 'assigned' ? laneId : null);
        clearSelection();
        render();
      }
      return;
    }

    const del = t.closest('[data-del-lane]');
    if (del) {
      e.preventDefault();
      if (guardReadonly()) return;
      const lid = del.getAttribute('data-del-lane');
      if (!lid || !confirm('このレーンを削除しますか？候補は未配置へ戻ります。')) return;
      const next = deleteLaneMovingToPool(lanes, candidates, lid, project.id, historyLogs, actor());
      if (next) {
        lanes = next.lanes;
        candidates = next.candidates;
        historyLogs = next.historyLogs;
        schedulePersist();
        render();
      }
      return;
    }

    const card = t.closest('[data-cand]');
    if (card) {
      e.preventDefault();
      e.stopPropagation();
      if (project.isReadOnly) return;
      const id = card.getAttribute('data-cand');
      selectedCandidateId = selectedCandidateId === id ? null : id;
      render();
      return;
    }

    const laneBody = t.closest('[data-drop-lane]');
    const zoneBody = t.closest('[data-drop-status]');
    if (selectedCandidateId && laneBody && laneBody.classList.contains('sb-lane__body')) {
      const laneId = laneBody.getAttribute('data-drop-lane');
      applyMove(selectedCandidateId, 'assigned', laneId);
      clearSelection();
      render();
      return;
    }
    if (selectedCandidateId && zoneBody && zoneBody.classList.contains('sb-zone__body')) {
      const st = zoneBody.getAttribute('data-drop-status');
      applyMove(selectedCandidateId, st, null);
      clearSelection();
      render();
      return;
    }

    if (!t.closest('[data-cand]') && !t.closest('.sb-lane') && !t.closest('.sb-zone')) {
      if (selectedCandidateId) {
        clearSelection();
        render();
      }
    }
  });

  document.addEventListener('change', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const titleInp = t.closest('[data-lane-title]');
    if (titleInp) {
      if (guardReadonly()) return;
      const id = titleInp.getAttribute('data-lane-title');
      lanes = lanes.map((l) =>
        l.id === id ? { ...l, title: /** @type {HTMLInputElement} */ (titleInp).value } : l
      );
      schedulePersist();
      return;
    }
    const capInp = t.closest('[data-lane-cap]');
    if (capInp) {
      if (guardReadonly()) return;
      const id = capInp.getAttribute('data-lane-cap');
      const raw = /** @type {HTMLInputElement} */ (capInp).value;
      const prev = lanes.find((l) => l.id === id);
      const capacity = raw === '' ? null : Math.max(0, Math.floor(Number(raw)));
      const { historyLogs: h } = appendHistory(historyLogs, project.id, {
        action: 'capacity_change',
        toLaneId: id,
        toLaneLabel: prev ? prev.title : null,
        fromCapacity: prev?.capacity ?? null,
        toCapacity: Number.isFinite(capacity) ? capacity : null,
        actor: actor(),
      });
      historyLogs = h;
      lanes = lanes.map((l) =>
        l.id === id ? { ...l, capacity: Number.isFinite(capacity) ? capacity : null } : l
      );
      schedulePersist();
      render();
    }
  });

  document.addEventListener('dragstart', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const card = t.closest?.('[data-cand]');
    if (!card || project.isReadOnly) {
      e.preventDefault();
      return;
    }
    dragCandidateId = card.getAttribute('data-cand');
    card.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', dragCandidateId || '');
    e.dataTransfer.effectAllowed = 'move';
  });

  document.addEventListener('dragend', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    t.closest?.('[data-cand]')?.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    dragCandidateId = null;
  });

  document.addEventListener('dragover', (e) => {
    const body = /** @type {HTMLElement} */ (e.target).closest?.('.sb-lane__body, .sb-zone__body');
    if (!body || project.isReadOnly) return;
    e.preventDefault();
    body.classList.add('drag-over');
  });

  document.addEventListener('dragleave', (e) => {
    const body = /** @type {HTMLElement} */ (e.target).closest?.('.sb-lane__body, .sb-zone__body');
    if (body) body.classList.remove('drag-over');
  });

  document.addEventListener('drop', (e) => {
    const body = /** @type {HTMLElement} */ (e.target).closest?.('.sb-lane__body, .sb-zone__body');
    if (!body || project.isReadOnly) return;
    e.preventDefault();
    body.classList.remove('drag-over');
    const id = dragCandidateId || e.dataTransfer?.getData('text/plain');
    if (!id) return;
    const status = body.getAttribute('data-drop-status');
    const laneId = body.getAttribute('data-drop-lane');
    applyMove(id, status, status === 'assigned' ? laneId : null);
    clearSelection();
    render();
  });
}

function applyMove(candidateId, toStatus, toLaneId) {
  const next = moveCandidate(bundle(), candidateId, toStatus, toLaneId, actor());
  if (!next) return;
  candidates = next.candidates;
  historyLogs = next.historyLogs;
  schedulePersist();
}

function render() {
  document.body.classList.toggle('sb-readonly', !!project.isReadOnly);
  const ro = $('sb-readonly');
  const he = $('sb-hide-evidence');
  if (ro) ro.checked = !!project.isReadOnly;
  if (he) he.checked = !!project.hideEvidence;
  renderSummary();
  renderPools();
  renderLanes();
}

function applyBox1() {
  if (guardReadonly()) return;
  const rules = parseBox1Rules($('sb-box1')?.value || '');
  if (!rules.length) {
    setImportMsg('Box1 に枠ルールを入れてください。');
    return;
  }
  const created = lanesFromBox1(project.id, rules);
  for (const lane of created) {
    const { historyLogs: h } = appendHistory(historyLogs, project.id, {
      action: 'lane_create',
      toLaneId: lane.id,
      toLaneLabel: lane.title,
      actor: actor(),
    });
    historyLogs = h;
  }
  // 同名があれば capacity 更新、なければ追加
  for (const lane of created) {
    const existing = lanes.find((l) => l.title === lane.title);
    if (existing) {
      existing.capacity = lane.capacity;
    } else {
      lanes = [...lanes, lane];
    }
  }
  lanes = lanes.map((l, i) => ({ ...l, order: i }));
  schedulePersist();
  setImportMsg(`枠を反映しました（${rules.length}）`);
  render();
}

function applyBox2() {
  if (guardReadonly()) return;
  const rows = parseBox2Candidates($('sb-box2')?.value || '');
  if (!rows.length) {
    setImportMsg('Box2 に候補を入れてください。');
    return;
  }
  const start = candidates.length;
  const added = candidatesFromBox2(project.id, rows, start);
  candidates = [...candidates, ...added];
  schedulePersist();
  setImportMsg(`${added.length} 人を未配置に追加しました`);
  render();
}

function doLegacyImport() {
  if (guardReadonly()) return;
  const text = $('sb-import')?.value || '';
  const trimmed = text.trim();
  if (!trimmed) return;

  if (trimmed.startsWith(CODE_PREFIX)) {
    const decoded = decodeRestoreCode(trimmed);
    if (!decoded.ok) {
      setImportMsg('復元コードを読めませんでした。');
      return;
    }
    replaceBundle(decoded.state);
    setImportMsg('復元コードから盤面を復元しました');
    render();
    return;
  }

  const rows = parsePasteRows(text);
  const built = buildStateFromRows(project.id, rows);
  lanes = built.lanes;
  candidates = built.candidates;
  historyLogs = [];
  schedulePersist();
  setImportMsg(`${candidates.length} 人を読み込みました`);
  render();
}

function replaceBundle(state) {
  project = {
    ...createEmptyProject(state.project?.name || project.name),
    ...state.project,
    id: state.project?.id || newId(),
    isReadOnly: false,
  };
  // ensure projectId on children
  lanes = (state.lanes || []).map((l, i) => ({
    ...l,
    projectId: project.id,
    order: l.order ?? i,
  }));
  candidates = (state.candidates || []).map((c, i) => ({
    ...c,
    projectId: project.id,
    order: c.order ?? i,
  }));
  historyLogs = state.historyLogs || [];
  clearSelection();
  schedulePersist();
}

function initControls() {
  $('sb-apply-box1')?.addEventListener('click', applyBox1);
  $('sb-apply-box2')?.addEventListener('click', applyBox2);
  $('sb-import-btn')?.addEventListener('click', doLegacyImport);
  $('sb-add-lane')?.addEventListener('click', () => {
    if (guardReadonly()) return;
    const lane = {
      id: newId(),
      projectId: project.id,
      title: `レーン${lanes.length + 1}`,
      capacity: null,
      order: lanes.length,
    };
    const { historyLogs: h } = appendHistory(historyLogs, project.id, {
      action: 'lane_create',
      toLaneId: lane.id,
      toLaneLabel: lane.title,
      actor: actor(),
    });
    historyLogs = h;
    lanes = [...lanes, lane];
    schedulePersist();
    render();
  });

  $('sb-readonly')?.addEventListener('change', (e) => {
    project.isReadOnly = /** @type {HTMLInputElement} */ (e.target).checked;
    clearSelection();
    schedulePersist();
    render();
    setActionMsg(project.isReadOnly ? '読み取り専用にしました' : '編集可能にしました');
  });

  $('sb-hide-evidence')?.addEventListener('change', (e) => {
    project.hideEvidence = /** @type {HTMLInputElement} */ (e.target).checked;
    schedulePersist();
    render();
  });

  $('sb-undo')?.addEventListener('click', () => {
    if (guardReadonly()) return;
    const next = undoLast(bundle());
    if (!next) {
      setActionMsg('取り消す操作がありません');
      return;
    }
    candidates = next.candidates;
    historyLogs = next.historyLogs;
    if (next.lanes) lanes = next.lanes;
    schedulePersist();
    render();
    setActionMsg('Undo しました');
  });

  $('sb-copy-code')?.addEventListener('click', async () => {
    try {
      await copyText(encodeRestoreCode(bundle()));
      setActionMsg('復元コードをコピーしました');
    } catch {
      setActionMsg('コピーに失敗しました');
    }
  });

  const outInclude = () => ({
    assigned: !!$('sb-out-assigned')?.checked,
    pool: !!$('sb-out-pool')?.checked,
    pending: !!$('sb-out-pending')?.checked,
  });

  $('sb-copy-tsv')?.addEventListener('click', async () => {
    try {
      await copyText(buildOutputText(candidates, lanes, outInclude(), 'tsv'));
      setActionMsg('TSV をコピーしました');
    } catch {
      setActionMsg('コピーに失敗しました');
    }
  });

  $('sb-copy-ppt')?.addEventListener('click', async () => {
    try {
      await copyText(buildOutputText(candidates, lanes, outInclude(), 'ppt'));
      setActionMsg('パワポ用テキストをコピーしました');
    } catch {
      setActionMsg('コピーに失敗しました');
    }
  });

  $('sb-export-json')?.addEventListener('click', () => {
    const blob = new Blob([exportProjectJson(bundle())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sugudasu-slot-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setActionMsg('JSON をダウンロードしました');
  });

  $('sb-import-json')?.addEventListener('change', async (e) => {
    const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
    /** @type {HTMLInputElement} */ (e.target).value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const state = importProjectJson(text);
      if (db) {
        await deleteProjectBundle(db, project.id).catch(() => {});
      }
      replaceBundle(state);
      await persistNow();
      setActionMsg('JSON から新規プロジェクトとして復元しました');
      render();
    } catch (err) {
      console.error(err);
      setActionMsg('JSON の読み込みに失敗しました');
    }
  });

  $('sb-clear')?.addEventListener('click', async () => {
    if (!confirm('盤面をクリアしますか？')) return;
    if (db) await deleteProjectBundle(db, project.id).catch(() => {});
    project = createEmptyProject();
    lanes = [];
    candidates = [];
    historyLogs = [];
    clearSelection();
    await persistNow();
    setActionMsg('クリアしました');
    render();
  });
}

async function boot() {
  bindBoardEvents();
  initControls();
  try {
    db = await openDb();
    const activeId = localStorage.getItem(ACTIVE_KEY);
    let loaded = activeId ? await loadProjectBundle(db, activeId) : null;
    if (!loaded) {
      const all = await listProjects(db);
      if (all.length) {
        all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        loaded = await loadProjectBundle(db, all[0].id);
      }
    }
    if (loaded) {
      project = loaded.project;
      lanes = loaded.lanes;
      candidates = loaded.candidates;
      historyLogs = loaded.historyLogs;
    } else {
      await persistNow();
    }
  } catch (err) {
    console.error(err);
    setActionMsg('端末内保存を開始できませんでした（メモリのみで動作します）');
  }
  render();
}

boot();
