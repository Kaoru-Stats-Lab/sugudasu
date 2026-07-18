/**
 * SUGUDASU 枠取りパレット — UI
 * docs/notes/SLOT_BOARD_SPEC.md
 */
import {
  parsePasteRows,
  buildStateFromRows,
  encodeRestoreCode,
  decodeRestoreCode,
  computeLaneStats,
  isAllWithinLimits,
  deleteLaneMovingToUnknown,
  buildTsv,
  newId,
  UNKNOWN_LANE,
  CODE_PREFIX,
} from './slot-board-engine.js';

const $ = (id) => document.getElementById(id);

/** @type {{ id: string, name: string, limit: number|null }[]} */
let lanes = [];
/** @type {{ id: string, name: string, laneId: string }[]} */
let items = [];
/** @type {Map<string, boolean>} laneId → wasOver */
const wasOver = new Map();
/** @type {Set<string>} */
const flashLaneIds = new Set();

function setActionMsg(msg) {
  const el = $('sb-action-msg');
  if (el) el.textContent = msg || '';
}

function setImportMsg(msg) {
  const el = $('sb-import-msg');
  if (el) el.textContent = msg || '';
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function renderSummary() {
  const stats = computeLaneStats(lanes, items);
  const badge = $('sb-summary-badge');
  const box = $('sb-summary');
  if (!badge || !box) return;

  const hasData = lanes.length > 0 || items.length > 0;
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
    if (st && st.over > 0) overNames.push(lane.name);
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
    // 上限未設定のみ等 — 超過ではないので中立表示
    badge.textContent = '配置を確認中（上限未設定のレーンあり）';
  }
}

function render() {
  const stats = computeLaneStats(lanes, items);
  const statsById = new Map(stats.map((s) => [s.laneId, s]));

  for (const st of stats) {
    const prev = wasOver.get(st.laneId) === true;
    const now = st.over > 0;
    if (now && !prev) {
      flashLaneIds.add(st.laneId);
      setTimeout(() => {
        flashLaneIds.delete(st.laneId);
        renderLanesOnly();
      }, 1200);
    }
    wasOver.set(st.laneId, now);
  }

  renderSummary();
  renderLanesOnly(statsById);
}

function renderLanesOnly(statsById) {
  const root = $('sb-lanes');
  const empty = $('sb-empty');
  if (!root) return;
  if (!statsById) {
    statsById = new Map(computeLaneStats(lanes, items).map((s) => [s.laneId, s]));
  }
  root.innerHTML = '';

  if (!lanes.length) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  lanes.forEach((lane, idx) => {
    const st = statsById.get(lane.id) || { count: 0, limit: null, over: 0 };
    const laneEl = document.createElement('div');
    laneEl.className = 'sb-lane';
    if (st.over > 0) laneEl.classList.add('sb-lane--over');
    if (flashLaneIds.has(lane.id)) laneEl.classList.add('sb-lane--flash');
    laneEl.dataset.laneId = lane.id;

    const headTitle =
      st.limit == null
        ? `${lane.name} [${st.count}]`
        : `${lane.name} [${st.count} / ${st.limit}]`;

    const head = document.createElement('div');
    head.className = 'sb-lane__head';
    head.innerHTML = `
      <input type="text" class="sb-inline sb-lane-name" value="${escapeAttr(lane.name)}" aria-label="レーン名">
      <label class="text-[11px] text-slate-600">上限
        <input type="number" class="sb-inline sb-inline--limit sb-lane-limit" min="0" step="1" value="${st.limit == null ? '' : st.limit}" placeholder="無制限" aria-label="上限人数">
      </label>
      <span class="sb-lane__meta">${escapeHtml(headTitle)}</span>
      ${st.over > 0 ? `<span class="sb-lane__over-label">${st.over}人超過</span>` : ''}
      <div class="sb-lane__actions">
        <button type="button" data-act="up" ${idx === 0 ? 'disabled' : ''}>上へ</button>
        <button type="button" data-act="down" ${idx === lanes.length - 1 ? 'disabled' : ''}>下へ</button>
        <button type="button" data-act="del">削除</button>
      </div>
    `;
    laneEl.appendChild(head);

    const body = document.createElement('div');
    body.className = 'sb-lane__body';
    body.dataset.laneId = lane.id;

    const laneItems = items.filter((it) => it.laneId === lane.id);
    for (const it of laneItems) {
      const card = document.createElement('div');
      card.className = 'sb-item';
      card.draggable = true;
      card.dataset.itemId = it.id;
      card.textContent = it.name;
      body.appendChild(card);
    }
    laneEl.appendChild(body);
    root.appendChild(laneEl);

    head.querySelector('.sb-lane-name')?.addEventListener('change', (e) => {
      const v = e.target.value.trim() || lane.name;
      lane.name = v;
      render();
    });
    head.querySelector('.sb-lane-limit')?.addEventListener('change', (e) => {
      const raw = e.target.value.trim();
      if (raw === '') {
        lane.limit = null;
      } else {
        const n = Number(raw);
        lane.limit = Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
      }
      render();
    });
    head.querySelector('[data-act="up"]')?.addEventListener('click', () => {
      if (idx <= 0) return;
      const tmp = lanes[idx - 1];
      lanes[idx - 1] = lanes[idx];
      lanes[idx] = tmp;
      render();
    });
    head.querySelector('[data-act="down"]')?.addEventListener('click', () => {
      if (idx >= lanes.length - 1) return;
      const tmp = lanes[idx + 1];
      lanes[idx + 1] = lanes[idx];
      lanes[idx] = tmp;
      render();
    });
    head.querySelector('[data-act="del"]')?.addEventListener('click', () => {
      const count = items.filter((it) => it.laneId === lane.id).length;
      const ok = window.confirm(
        `このレーンを削除しますか？\n\n所属する${count}件は「${UNKNOWN_LANE}」へ移動します。`
      );
      if (!ok) return;
      const next = deleteLaneMovingToUnknown(lanes, items, lane.id);
      lanes = next.lanes;
      items = next.items;
      wasOver.delete(lane.id);
      render();
    });

    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('drag-over');
    });
    body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
    body.addEventListener('drop', (e) => {
      e.preventDefault();
      body.classList.remove('drag-over');
      const itemId = e.dataTransfer?.getData('text/plain');
      if (!itemId) return;
      const it = items.find((x) => x.id === itemId);
      if (!it) return;
      it.laneId = lane.id;
      // 末尾へ
      items = [...items.filter((x) => x.id !== itemId), it];
      render();
    });
  });

  root.querySelectorAll('.sb-item').forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', card.dataset.itemId || '');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function doImport() {
  const text = $('sb-import')?.value || '';
  const trimmed = text.trim();
  if (!trimmed) {
    setImportMsg('貼り付けてから実行してください。');
    return;
  }

  if (trimmed.startsWith(CODE_PREFIX) || trimmed.includes(CODE_PREFIX)) {
    const codeLine = trimmed.split(/\r\n|\n|\r/).find((l) => l.trim().startsWith(CODE_PREFIX)) || trimmed;
    const decoded = decodeRestoreCode(codeLine.trim());
    if (!decoded.ok) {
      setImportMsg('復元コードを読めませんでした。');
      return;
    }
    lanes = decoded.state.lanes;
    items = decoded.state.items;
    wasOver.clear();
    flashLaneIds.clear();
    setImportMsg(`復元しました（${items.length}人 · ${lanes.length}レーン）。`);
    render();
    return;
  }

  const rows = parsePasteRows(trimmed);
  if (!rows.length) {
    setImportMsg('行がありません。');
    return;
  }
  const built = buildStateFromRows(rows);
  lanes = built.lanes;
  items = built.items;
  wasOver.clear();
  flashLaneIds.clear();
  setImportMsg(`取り込みました（${items.length}人 · ${lanes.length}レーン）。パース不能行は「${UNKNOWN_LANE}」へ。`);
  render();
}

function init() {
  $('sb-import-btn')?.addEventListener('click', doImport);
  $('sb-add-lane')?.addEventListener('click', () => {
    lanes.push({ id: newId(), name: `レーン${lanes.length + 1}`, limit: null });
    render();
  });
  $('sb-copy-code')?.addEventListener('click', async () => {
    if (!lanes.length && !items.length) {
      setActionMsg('コピーする状態がありません。');
      return;
    }
    const code = encodeRestoreCode({ lanes, items });
    try {
      await copyText(code);
      setActionMsg('下書きコードをコピーしました。');
    } catch {
      setActionMsg('コピーに失敗しました。');
    }
  });
  $('sb-copy-tsv')?.addEventListener('click', async () => {
    if (!items.length) {
      setActionMsg('コピーする行がありません。');
      return;
    }
    try {
      await copyText(buildTsv(items, lanes));
      setActionMsg('TSVをコピーしました。Excelに貼れます。');
    } catch {
      setActionMsg('コピーに失敗しました。');
    }
  });
  $('sb-clear')?.addEventListener('click', () => {
    lanes = [];
    items = [];
    wasOver.clear();
    flashLaneIds.clear();
    if ($('sb-import')) $('sb-import').value = '';
    setImportMsg('');
    setActionMsg('');
    render();
  });
  render();
}

if (typeof document !== 'undefined') init();
