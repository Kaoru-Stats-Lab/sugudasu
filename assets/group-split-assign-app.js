/**
 * 希望順位割当 UI — Pragmatic Drag and Drop + プール＆スロット
 * SSOT: draft_meeting.md · DRAFT_ASSIGNMENT_PRODUCT_NOTE.md
 */
import {
  ASSIGN_PRESETS,
  POOL_ID,
  UNDO_MAX,
  applyCommand,
  buildAssignFromInput,
  exportAssignSnapshot,
  filterSlots,
  formatAssignTsv,
  importAssignSnapshot,
  movePerson,
  prefRankClass,
  revertCommand,
  satisfactionPercent,
  slotStatus,
} from './group-split-assign-engine.js';
import { copyWithFeedback } from './sg-copy-feedback.js';

// DECISION: Pragmatic Drag and Drop のプール→スロット→確定パターンを採用。静的配信のためネイティブ HTML5 DnD で実装（@atlaskit/pragmatic-drag-and-drop は devDependency に保持し将来 vendor 化）。

/**
 * @param {HTMLElement} root
 * @param {{ onError?: (msg: string) => void }} [opts]
 */
export function mountGroupSplitAssign(root, opts = {}) {
  const els = {
    preset: root.querySelector('#gsa-preset'),
    session: root.querySelector('#gsa-session'),
    slots: root.querySelector('#gsa-slots'),
    roster: root.querySelector('#gsa-roster'),
    seedMode: root.querySelector('#gsa-seed-mode'),
    draftMode: root.querySelector('#gsa-draft-mode'),
    turnCurrent: root.querySelector('#gsa-turn-current'),
    turnIndex: root.querySelector('#gsa-turn-index'),
    turnPolicy: root.querySelector('#gsa-turn-policy'),
    turnNext: root.querySelector('#gsa-turn-next'),
    turnPass: root.querySelector('#gsa-turn-pass'),
    turnLock: root.querySelector('#gsa-turn-lock'),
    run: root.querySelector('#gsa-run'),
    error: root.querySelector('#gsa-error'),
    board: root.querySelector('#gsa-board'),
    empty: root.querySelector('#gsa-empty'),
    sat: root.querySelector('#gsa-sat'),
    poolCount: root.querySelector('#gsa-pool-count'),
    undo: root.querySelector('#gsa-undo'),
    redo: root.querySelector('#gsa-redo'),
    filter: root.querySelector('#gsa-filter'),
    pool: root.querySelector('#gsa-pool'),
    slotsArea: root.querySelector('#gsa-slots-area'),
    detail: root.querySelector('#gsa-detail'),
    copyTsv: root.querySelector('#gsa-copy-tsv'),
    copyJson: root.querySelector('#gsa-copy-json'),
    dlJson: root.querySelector('#gsa-dl-json'),
    jsonPaste: root.querySelector('#gsa-json-paste'),
    jsonLoad: root.querySelector('#gsa-json-load'),
  };

  /** @type {ReturnType<import('./group-split-assign-engine.js').createAssignState> | null} */
  let state = null;
  /** @type {{ personId: string, fromSlotId: string, toSlotId: string }[]} */
  let undoStack = [];
  /** @type {{ personId: string, fromSlotId: string, toSlotId: string }[]} */
  let redoStack = [];
  let slotFilter = 'all';
  let draftMode = 'free';
  let turnIndex = 0;
  let turnStep = 1;
  /** @type {string[]} */
  let turnOrder = [];
  /** @type {(() => void)[]} */
  let dndCleanups = [];

  function setError(msg) {
    if (!els.error) return;
    if (!msg) {
      els.error.classList.add('hidden');
      els.error.textContent = '';
      return;
    }
    els.error.textContent = msg;
    els.error.classList.remove('hidden');
    opts.onError?.(msg);
  }

  function applyPreset(id) {
    const p = ASSIGN_PRESETS[id] || ASSIGN_PRESETS.hr;
    if (els.slots && !els.slots.value.trim()) els.slots.placeholder = p.slotsPlaceholder;
    if (els.roster && !els.roster.value.trim()) els.roster.placeholder = p.rosterPlaceholder;
  }

  function updateHistoryButtons() {
    if (els.undo) els.undo.disabled = undoStack.length === 0;
    if (els.redo) els.redo.disabled = redoStack.length === 0;
  }

  function pushUndo(command) {
    if (!command) return;
    undoStack.push(command);
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
  }

  function doMove(personId, toSlotId) {
    if (!state) return;
    if (els.turnLock?.checked && draftMode !== 'free') {
      const current = turnOrder[turnIndex] || null;
      if (toSlotId !== current) {
        setError('ターン制御ONです。現在ターンの部署にのみ配置できます。');
        return;
      }
    }
    const { state: next, command } = movePerson(state, personId, toSlotId);
    state = next;
    pushUndo(command);
    renderBoard();
  }

  function buildTurnOrder(slots, mode) {
    const ids = slots.map((s) => s.id);
    if (mode === 'free') return ids;
    if (mode === 'snake') return ids;
    if (mode === 'z') {
      const order = [];
      let l = 0;
      let r = ids.length - 1;
      while (l <= r) {
        if (l === r) order.push(ids[l]);
        else {
          order.push(ids[l]);
          order.push(ids[r]);
        }
        l += 1;
        r -= 1;
      }
      return order;
    }
    return ids;
  }

  function updateTurnUi() {
    if (!state) return;
    draftMode = els.draftMode?.value || 'free';
    turnOrder = buildTurnOrder(state.slots, draftMode);
    if (!turnOrder.length) return;
    turnIndex = ((turnIndex % turnOrder.length) + turnOrder.length) % turnOrder.length;
    const currentId = turnOrder[turnIndex];
    const slot = state.slots.find((s) => s.id === currentId);
    if (els.turnCurrent) els.turnCurrent.textContent = slot?.name || '—';
    if (els.turnIndex) els.turnIndex.textContent = `${turnIndex + 1} / ${turnOrder.length}`;
    if (els.turnPolicy) {
      const map = {
        free: 'フリー（順番なし）',
        snake: `スネーク（${turnStep > 0 ? '→' : '←'}）`,
        z: 'Z型（左右交互）',
      };
      els.turnPolicy.textContent = map[draftMode] || 'フリー';
    }
  }

  function moveTurn(passOnly = false) {
    if (!state || !turnOrder.length) return;
    if (draftMode === 'free') {
      turnIndex = (turnIndex + 1) % turnOrder.length;
    } else if (draftMode === 'snake') {
      if (turnOrder.length === 1) {
        turnIndex = 0;
      } else if (turnIndex === turnOrder.length - 1 && turnStep > 0) {
        turnStep = -1;
        turnIndex -= 1;
      } else if (turnIndex === 0 && turnStep < 0) {
        turnStep = 1;
        turnIndex += 1;
      } else {
        turnIndex += turnStep;
      }
    } else {
      turnIndex = (turnIndex + 1) % turnOrder.length;
    }
    updateTurnUi();
    if (passOnly) setError('');
  }

  function teardownDnd() {
    dndCleanups.forEach((fn) => {
      try { fn(); } catch { /* noop */ }
    });
    dndCleanups = [];
  }

  function setupDnd() {
    teardownDnd();
    if (!state || !els.board) return;

    const onDragStart = (e) => {
      const card = e.currentTarget;
      const personId = card.getAttribute('data-gsa-person-id');
      if (!personId || !e.dataTransfer) return;
      e.dataTransfer.setData('application/x-gsa-person', personId);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('gsa-card--dragging');
    };
    const onDragEnd = (e) => {
      e.currentTarget.classList.remove('gsa-card--dragging');
      els.board.querySelectorAll('.gsa-drop--active').forEach((el) => el.classList.remove('gsa-drop--active'));
    };

    els.board.querySelectorAll('[data-gsa-person-id]').forEach((cardEl) => {
      cardEl.addEventListener('dragstart', onDragStart);
      cardEl.addEventListener('dragend', onDragEnd);
      dndCleanups.push(() => {
        cardEl.removeEventListener('dragstart', onDragStart);
        cardEl.removeEventListener('dragend', onDragEnd);
      });
    });

    const bindDrop = (zoneEl, slotId) => {
      const onDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        zoneEl.classList.add('gsa-drop--active');
      };
      const onDragLeave = () => zoneEl.classList.remove('gsa-drop--active');
      const onDrop = (e) => {
        e.preventDefault();
        zoneEl.classList.remove('gsa-drop--active');
        const personId = e.dataTransfer?.getData('application/x-gsa-person');
        if (personId) doMove(personId, slotId);
      };
      zoneEl.addEventListener('dragover', onDragOver);
      zoneEl.addEventListener('dragleave', onDragLeave);
      zoneEl.addEventListener('drop', onDrop);
      dndCleanups.push(() => {
        zoneEl.removeEventListener('dragover', onDragOver);
        zoneEl.removeEventListener('dragleave', onDragLeave);
        zoneEl.removeEventListener('drop', onDrop);
      });
    };

    bindDrop(els.pool, POOL_ID);
    els.slotsArea.querySelectorAll('[data-gsa-slot-id]').forEach((slotEl) => {
      bindDrop(slotEl, slotEl.getAttribute('data-gsa-slot-id'));
    });
  }

  function renderDetail() {
    if (!els.detail || !state) return;
    const pid = state.selectedPersonId;
    const sid = state.selectedSlotId;
    if (pid) {
      const person = state.people.find((p) => p.id === pid);
      const slotId = state.assignment.get(pid) || POOL_ID;
      const slot = state.slots.find((s) => s.id === slotId);
      const prefs = person.prefs.map((name, i) => `<li>第${i + 1}希望: ${esc(name)}</li>`).join('');
      const attrs = Object.entries(person.attrs || {})
        .map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`)
        .join('');
      els.detail.innerHTML = `
        <p class="text-xs font-bold text-slate-900">${esc(person.name)}</p>
        <p class="text-[11px] text-slate-600 mt-1">現在: <strong>${slotId === POOL_ID ? '未配属' : esc(slot?.name || '')}</strong></p>
        <ul class="text-[11px] text-slate-700 mt-2 space-y-0.5 list-disc list-inside">${prefs || '<li>希望未入力</li>'}</ul>
        ${attrs ? `<div class="mt-2 border-t border-slate-200 pt-2"><p class="text-[11px] font-semibold text-slate-700">属性</p><ul class="text-[11px] text-slate-600 mt-1 space-y-0.5 list-disc list-inside">${attrs}</ul></div>` : ''}
      `;
      return;
    }
    if (sid) {
      const slot = state.slots.find((s) => s.id === sid);
      const st = slotStatus(state, sid);
      const alerts = [];
      if (st.over) alerts.push(`定員を ${st.count - st.capacity} 名超過しています`);
      if (st.empty) alerts.push('まだ誰も割り当てられていません');
      els.detail.innerHTML = `
        <p class="text-xs font-bold text-slate-900">${esc(slot?.name || '')}</p>
        <p class="text-[11px] text-slate-600 mt-1">定員 ${st.capacity} / 現在 ${st.count}</p>
        ${alerts.length ? `<p class="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">${alerts.map(esc).join('<br>')}</p>` : ''}
      `;
      return;
    }
    els.detail.innerHTML = '<p class="text-[11px] text-slate-500">カードまたは枠を選択すると詳細が表示されます。</p>';
  }

  function renderBoard() {
    if (!state) {
      els.board?.classList.add('hidden');
      els.empty?.classList.remove('hidden');
      return;
    }
    els.board?.classList.remove('hidden');
    els.empty?.classList.add('hidden');

    if (els.sat) els.sat.textContent = String(satisfactionPercent(state));
    if (els.poolCount) els.poolCount.textContent = String(state.poolCount);

    const poolPeople = state.people.filter((p) => (state.assignment.get(p.id) || POOL_ID) === POOL_ID);
    els.pool.innerHTML = poolPeople.map((p) => cardHtml(state, p)).join('') || '<span class="text-[11px] text-slate-400">未配属なし</span>';

    const slots = filterSlots(state, slotFilter);
    els.slotsArea.innerHTML = slots.map((slot) => {
      const st = slotStatus(state, slot.id);
      const members = state.people.filter((p) => state.assignment.get(p.id) === slot.id);
      const overCls = st.over ? ' gsa-slot--over' : '';
      const lowCls = slotFilter === 'unpopular' && st.fillRatio < 0.3 ? ' gsa-slot--stale' : '';
      const activeCls = (turnOrder[turnIndex] === slot.id && draftMode !== 'free') ? ' gsa-slot--active-turn' : '';
      return `
        <div class="gsa-slot${overCls}${lowCls}${activeCls}" data-gsa-slot-id="${escAttr(slot.id)}" role="list">
          <div class="gsa-slot__head">
            <span class="gsa-slot__name">${esc(slot.name)}</span>
            <span class="gsa-slot__cap ${st.over ? 'text-rose-700' : 'text-slate-500'}">${st.count} / ${st.capacity}</span>
          </div>
          <div class="gsa-slot__body">
            ${members.map((p) => cardHtml(state, p)).join('')}
            ${Array.from({ length: Math.max(0, slot.capacity - members.length) }, () => '<span class="gsa-slot__empty" aria-hidden="true"></span>').join('')}
          </div>
        </div>
      `;
    }).join('');

    els.board.querySelectorAll('[data-gsa-person-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedPersonId = el.getAttribute('data-gsa-person-id');
        state.selectedSlotId = null;
        renderDetail();
      });
    });
    els.board.querySelectorAll('[data-gsa-slot-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-gsa-person-id]')) return;
        state.selectedSlotId = el.getAttribute('data-gsa-slot-id');
        state.selectedPersonId = null;
        renderDetail();
      });
    });

    renderDetail();
    updateTurnUi();
    setupDnd();
    enableClickToMove();
  }

  /** クリック選択 → 枠クリックで移動（D&D フォールバック） */
  let clickMovePersonId = null;
  function enableClickToMove() {
    if (!state) return;
    root.querySelectorAll('[data-gsa-move-target]').forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.getAttribute('data-gsa-move-target');
        if (!clickMovePersonId || !target) return;
        doMove(clickMovePersonId, target);
        clickMovePersonId = null;
      });
    });
    root.querySelectorAll('[data-gsa-person-id]').forEach((el) => {
      el.addEventListener('dblclick', () => {
        clickMovePersonId = el.getAttribute('data-gsa-person-id');
        els.detail.innerHTML = `<p class="text-[11px] text-violet-800">「${esc(el.textContent.trim())}」を移動先の枠をダブルクリックしてください。</p>`;
      });
    });
  }

  function cardHtml(st, person) {
    const cls = prefRankClass(st, person.id);
    const attrHint = Object.entries(person.attrs || {})
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    const title = attrHint ? `${person.name}\n${attrHint}` : person.name;
    return `<button type="button" class="gsa-card gsa-card--${cls}" data-gsa-person-id="${escAttr(person.id)}" draggable="true" title="${escAttr(title)}">${esc(person.name)}</button>`;
  }

  function runAssign() {
    setError('');
    const preset = /** @type {import('./group-split-assign-engine.js').AssignPresetId} */ (
      els.preset?.value || 'hr'
    );
    const built = buildAssignFromInput(
      els.slots?.value || '',
      els.roster?.value || '',
      {
        preset,
        sessionName: els.session?.value?.trim() || '',
        seedMode: els.seedMode?.value || 'greedy',
      },
    );
    if (!built.ok) {
      setError(built.errors.join(' '));
      return;
    }
    state = built.state;
    undoStack = [];
    redoStack = [];
    turnIndex = 0;
    turnStep = 1;
    updateHistoryButtons();
    renderBoard();
  }

  els.preset?.addEventListener('change', () => applyPreset(els.preset.value));
  els.run?.addEventListener('click', runAssign);
  els.filter?.addEventListener('change', () => {
    slotFilter = els.filter.value;
    renderBoard();
  });
  els.draftMode?.addEventListener('change', () => {
    turnIndex = 0;
    turnStep = 1;
    renderBoard();
  });
  els.turnNext?.addEventListener('click', () => moveTurn(false));
  els.turnPass?.addEventListener('click', () => moveTurn(true));

  els.undo?.addEventListener('click', () => {
    const cmd = undoStack.pop();
    if (!cmd || !state) return;
    state = revertCommand(state, cmd);
    redoStack.push(cmd);
    updateHistoryButtons();
    renderBoard();
  });

  els.redo?.addEventListener('click', () => {
    const cmd = redoStack.pop();
    if (!cmd || !state) return;
    state = applyCommand(state, cmd);
    undoStack.push(cmd);
    updateHistoryButtons();
    renderBoard();
  });

  els.copyTsv?.addEventListener('click', async () => {
    if (!state) return;
    try {
      await copyWithFeedback(formatAssignTsv(state), els.copyTsv, { copiedLabel: 'TSVをコピーしました' });
    } catch {
      setError('コピーに失敗しました');
    }
  });

  els.copyJson?.addEventListener('click', async () => {
    if (!state) return;
    try {
      await copyWithFeedback(JSON.stringify(exportAssignSnapshot(state), null, 2), els.copyJson, { copiedLabel: 'JSONをコピーしました' });
    } catch {
      setError('コピーに失敗しました');
    }
  });

  els.dlJson?.addEventListener('click', () => {
    if (!state) return;
    const blob = new Blob([JSON.stringify(exportAssignSnapshot(state), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `match-board-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  els.jsonLoad?.addEventListener('click', () => {
    setError('');
    try {
      state = importAssignSnapshot(els.jsonPaste?.value || '');
      undoStack = [];
      redoStack = [];
      turnIndex = 0;
      turnStep = 1;
      updateHistoryButtons();
      renderBoard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSONの読み込みに失敗しました');
    }
  });

  applyPreset(els.preset?.value || 'hr');
  updateHistoryButtons();

  return {
    getState: () => state,
    runAssign,
  };
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}
