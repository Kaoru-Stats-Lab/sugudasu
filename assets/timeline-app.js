/**
 * /timeline — イベント進行 UI
 *
 * SSOT: docs/notes/TIMELINE_TOOL_SPEC.md
 * コメント方針: docs/notes/TIMELINE_IMPLEMENTATION_SLICES.md §0
 *
 * なぜ engine と UI を分けるか:
 * - 単体テスト可能 · Sync(T13-S) が同じ recalc をサーバ/クライアントで共有するため
 * UI 層にビジネスルールを書かない
 */
import {
  DURATION_DELTA,
  ROW_SOFT_WARN,
  applyDurationDelta,
  defaultTimelineTemplate,
  deleteRow,
  formatPlain,
  formatTsv,
  getCurrentRowIndex,
  getDeadlineSummary,
  insertRowAfter,
  minutesUntilCurrentRowEnd,
  minutesUntilRowStart,
  moveRow,
  recalcTimeline,
} from './timeline-engine.js';
import { copyWithFeedback } from './sg-copy-feedback.js';
import { linkifyHttpHtml, linkifyHttpHtmlIfPresent } from './sg-linkify.js';

/** @param {string} id */
const $ = (id) => document.getElementById(id);

/** ドメイン state — 進行表の正本 */
let state = defaultTimelineTemplate();

/** 選択行 — ±5・行編集の対象（§2-4） */
let selectedRowId = null;

/**
 * 残り時間の「任意コマ」モード（§5-1b）。
 * null = 進行中コマの終了まで。行タップでその行の開始まで。
 */
let focusRowId = null;

/** スマホ < lg のタブ。PC は常時2カラムなので preview も常に DOM に存在 */
let mobileTab = 'edit';

/** @type {number | undefined} */
let clockTimer;

/**
 * @param {number} totalMin
 */
function formatRemaining(totalMin) {
  if (totalMin == null || totalMin < 0) return '—';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

/**
 * type="time" は "HH:mm" — engine は同形式
 * @param {string} value
 */
function timeInputToHhmm(value) {
  const v = String(value ?? '').trim();
  if (!v) return '09:00';
  return v.length === 5 ? v : v.slice(0, 5);
}

function syncEventFromForm() {
  const title = $('tl-event-title')?.value ?? '';
  const dateIso = $('tl-event-date')?.value ?? state.event.dateIso;
  const startAt = timeInputToHhmm($('tl-event-start')?.value);
  const targetEndRaw = $('tl-event-target-end')?.value ?? '';
  const targetEndAt = targetEndRaw ? timeInputToHhmm(targetEndRaw) : undefined;
  state = recalcTimeline({
    ...state,
    event: { ...state.event, title, dateIso, startAt, targetEndAt },
  });
}

function syncFormFromEvent() {
  const ev = state.event;
  if ($('tl-event-title')) $('tl-event-title').value = ev.title;
  if ($('tl-event-date')) $('tl-event-date').value = ev.dateIso;
  if ($('tl-event-start')) $('tl-event-start').value = ev.startAt;
  if ($('tl-event-target-end')) {
    $('tl-event-target-end').value = ev.targetEndAt ?? '';
  }
}

/**
 * @param {import('./timeline-engine.js').TimelineRow} row
 */
function dayBadge(row) {
  const d = row.dayIndex ?? 0;
  if (d <= 0) return '';
  return `<span class="text-[10px] font-bold text-violet-700 bg-violet-50 px-1 rounded">Day${d + 1}</span> `;
}

/** @param {string} dateIso */
function formatEventDateJa(dateIso) {
  const [y, mo, d] = String(dateIso).split('-').map(Number);
  if (!y || !mo || !d) return String(dateIso);
  return `${y}年${mo}月${d}日`;
}

/** @param {import('./timeline-engine.js').TimelineRow} row */
function dayLabelPrint(row) {
  const di = row.dayIndex ?? 0;
  return di > 0 ? `D${di + 1} ` : '';
}

/**
 * A4 印刷用テーブル — 画面プレビューと分離（備考列は常時出力 · §5-1 O3）
 */
function renderPrintSheet() {
  const titleEl = $('tl-print-title');
  const metaEl = $('tl-print-meta');
  const tbody = $('tl-print-tbody');
  const footEl = $('tl-print-foot');
  if (!tbody) return;

  const ev = state.event;
  const summary = getDeadlineSummary(state);

  if (titleEl) titleEl.textContent = ev.title || '進行表';
  if (metaEl) {
    const parts = [formatEventDateJa(ev.dateIso), `開始 ${ev.startAt}`];
    if (summary?.plannedEndAt) {
      const day = summary.plannedDayIndex > 0 ? ` (Day${summary.plannedDayIndex + 1})` : '';
      parts.push(`終了予定 ${summary.plannedEndAt}${day}`);
    }
    metaEl.textContent = parts.join(' · ');
  }

  tbody.innerHTML = state.rows
    .map((row) => {
      const note = String(row.note ?? '').trim();
      const timeCell = `${dayLabelPrint(row)}${row.startAt}–${row.endAt}`;
      const anchorMark = row.anchored ? ' <span class="tl-print-anchor" title="固定時刻">⚓</span>' : '';
      const conflictMark = row.conflict ? ' <span class="tl-print-conflict">※衝突</span>' : '';
      return `<tr class="${row.conflict ? 'tl-print-row--conflict' : ''}">
        <td class="font-mono tabular-nums">${escapeHtml(timeCell)}${anchorMark}${conflictMark}</td>
        <td class="tabular-nums">${row.durationMin}</td>
        <td>${escapeHtml(row.title)}</td>
        <td class="tl-print-note">${note ? escapeHtml(note) : '—'}</td>
      </tr>`;
    })
    .join('');

  if (footEl) {
    if (summary?.hasTarget && summary.labelJa) {
      footEl.hidden = false;
      footEl.textContent = `目標終了 ${summary.targetEndAt} — ${summary.labelJa}`;
    } else {
      footEl.hidden = true;
      footEl.textContent = '';
    }
  }
}

function renderRowList() {
  const list = $('tl-row-list');
  const empty = $('tl-row-empty');
  const countEl = $('tl-row-count');
  if (!list) return;

  const now = new Date();
  const currentIdx = getCurrentRowIndex(state, now);

  if (countEl) {
    const n = state.rows.length;
    countEl.textContent = `${n} 行${n > ROW_SOFT_WARN ? ' — 長い進行は分割を推奨' : ''}`;
  }

  if (empty) empty.classList.toggle('hidden', state.rows.length > 0);

  list.innerHTML = state.rows
    .map((row, idx) => {
      const selected = row.id === selectedRowId;
      const current = idx === currentIdx;
      const conflict = row.conflict;
      const note = String(row.note ?? '').trim();
      const noteShort = note.length > 24 ? `${note.slice(0, 24)}…` : note;
      const classes = [
        'tl-row-item block w-full text-left rounded-lg border px-3 py-2 transition-colors',
        selected ? 'tl-row--selected border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300',
        current ? 'tl-row--current' : '',
        conflict ? 'tl-row--conflict' : '',
        current ? 'tl-now-marker' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<li>
        <button type="button" class="${classes}" data-row-id="${row.id}" aria-pressed="${selected}">
          <span class="font-mono text-[11px] text-slate-500">${dayBadge(row)}${row.startAt}–${row.endAt}</span>
          <span class="font-semibold text-slate-900 ml-1">${escapeHtml(row.title)}</span>
          <span class="text-[11px] text-slate-500 ml-1">${row.durationMin}分</span>
          ${noteShort ? `<span class="block text-[10px] text-slate-500 mt-0.5">${escapeHtml(noteShort)}</span>` : ''}
          ${conflict ? '<span class="block text-[10px] font-bold text-rose-700 mt-0.5">アンカー衝突</span>' : ''}
        </button>
      </li>`;
    })
    .join('');

  list.querySelectorAll('[data-row-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-row-id');
      if (!id) return;
      // 同一行再タップでフォーカス解除 — §5-1b デフォルト残り時間に戻す
      if (selectedRowId === id && focusRowId === id) {
        focusRowId = null;
      } else if (selectedRowId === id) {
        focusRowId = id;
      } else {
        selectedRowId = id;
        focusRowId = null;
      }
      renderRowEditor();
      renderPreview();
    });
  });
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderRowEditor() {
  const panel = $('tl-row-editor');
  const row = state.rows.find((r) => r.id === selectedRowId);
  if (!panel) return;
  if (!row) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  $('tl-row-title').value = row.title;
  $('tl-row-duration').value = String(row.durationMin);
  $('tl-row-note').value = row.note ?? '';
  $('tl-row-anchored').checked = Boolean(row.anchored);
  $('tl-row-anchor-at').value = row.anchorAt ?? row.startAt ?? '12:00';
  $('tl-anchor-wrap')?.classList.toggle('hidden', !row.anchored);

  const idx = state.rows.findIndex((r) => r.id === row.id);
  $('tl-row-up').disabled = idx <= 0;
  $('tl-row-down').disabled = idx < 0 || idx >= state.rows.length - 1;
  renderRowNoteLinks();
}

/** 運営メモ内 https — 表示のみ linkify（§5-1b · v1.1 · sg-linkify） */
function renderRowNoteLinks() {
  const el = $('tl-row-note-links');
  if (!el) return;
  const note = String($('tl-row-note')?.value ?? '').trim();
  if (!note) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  const html = linkifyHttpHtmlIfPresent(note);
  if (!html.includes('<a ')) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = html;
}

function applyRowEditorToState() {
  const row = state.rows.find((r) => r.id === selectedRowId);
  if (!row) return;
  const idx = state.rows.findIndex((r) => r.id === selectedRowId);
  const title = String($('tl-row-title')?.value ?? '').trim() || '無題';
  const durationMin = Math.min(480, Math.max(1, Number($('tl-row-duration')?.value) || 5));
  const note = String($('tl-row-note')?.value ?? '').slice(0, 100);
  const anchored = Boolean($('tl-row-anchored')?.checked);
  const anchorAt = timeInputToHhmm($('tl-row-anchor-at')?.value);
  const rows = state.rows.map((r) =>
    r.id === row.id ? { ...r, title, durationMin, note, anchored, anchorAt: anchored ? anchorAt : undefined } : r,
  );
  state = recalcTimeline({ ...state, rows }, idx);
}

function renderPreview() {
  const now = new Date();
  const currentIdx = getCurrentRowIndex(state, now);
  const clock = $('tl-preview-clock');
  if (clock) {
    clock.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }

  let remainMin = null;
  let remainLabel = '';
  if (focusRowId) {
    remainMin = minutesUntilRowStart(state, focusRowId, now);
    const row = state.rows.find((r) => r.id === focusRowId);
    remainLabel = row ? `${row.title}まで` : '';
  } else {
    remainMin = minutesUntilCurrentRowEnd(state, now);
    remainLabel = currentIdx >= 0 ? 'このコマの残り' : '進行中のコマなし';
  }

  const remEl = $('tl-preview-remaining');
  if (remEl) {
    remEl.textContent = remainMin != null ? `あと ${formatRemaining(remainMin)}` : '—';
    remEl.setAttribute('aria-label', remainLabel);
  }

  const nextEl = $('tl-preview-next');
  if (nextEl) {
    let nextTitle = null;
    if (currentIdx >= 0 && currentIdx < state.rows.length - 1) {
      nextTitle = state.rows[currentIdx + 1].title;
    } else if (currentIdx < 0 && state.rows.length > 0) {
      nextTitle = state.rows[0].title;
    }
    nextEl.textContent = nextTitle ? `次: ${nextTitle}` : '次: —';
  }

  const endEl = $('tl-preview-end');
  const deadlineEl = $('tl-deadline-summary');
  const summary = getDeadlineSummary(state);
  if (endEl && summary) {
    const day = summary.plannedDayIndex > 0 ? ` Day${summary.plannedDayIndex + 1}` : '';
    endEl.textContent = `終了予定: ${day} ${summary.plannedEndAt}`;
  } else if (endEl) {
    endEl.textContent = '';
  }
  if (deadlineEl) {
    if (summary?.hasTarget && summary.labelJa) {
      deadlineEl.hidden = false;
      deadlineEl.textContent = `目標 ${summary.targetEndAt} — ${summary.labelJa}`;
      deadlineEl.className =
        summary.status === 'over'
          ? 'text-sm font-bold rounded-lg px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200'
          : summary.status === 'early'
            ? 'text-sm font-bold rounded-lg px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'text-sm font-bold rounded-lg px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200';
    } else {
      deadlineEl.hidden = true;
      deadlineEl.textContent = '';
    }
  }

  const list = $('tl-preview-list');
  if (!list) {
    renderPrintSheet();
    return;
  }
  list.innerHTML = state.rows
    .map((row, idx) => {
      const current = idx === currentIdx;
      const note = String(row.note ?? '').trim();
      return `<li class="py-1.5 border-b border-slate-100 ${current ? 'tl-row--current tl-now-marker pl-2 font-semibold' : ''}">
        <span class="font-mono text-xs text-slate-500">${dayBadge(row)}${row.startAt}–${row.endAt}</span>
        <span class="ml-2">${escapeHtml(row.title)}</span>
        ${note ? `<span class="block text-[11px] text-slate-500 mt-0.5">${linkifyHttpHtml(note)}</span>` : ''}
      </li>`;
    })
    .join('');
  renderPrintSheet();
}

function renderConflictBanner() {
  const banner = $('tl-conflict-banner');
  if (!banner) return;
  const has = state.rows.some((r) => r.conflict);
  banner.classList.toggle('hidden', !has);
}

function renderMobilePanels() {
  const isLg = window.matchMedia('(min-width: 1024px)').matches;
  const edit = $('tl-panel-edit');
  const preview = $('tl-panel-preview');
  if (isLg) {
    edit?.classList.remove('hidden');
    preview?.classList.remove('hidden');
    return;
  }
  edit?.classList.toggle('hidden', mobileTab !== 'edit');
  preview?.classList.toggle('hidden', mobileTab !== 'preview');
}

function renderTabs() {
  const editTab = $('tl-tab-edit');
  const prevTab = $('tl-tab-preview');
  if (!editTab || !prevTab) return;
  const onEdit = mobileTab === 'edit';
  editTab.setAttribute('aria-selected', onEdit ? 'true' : 'false');
  prevTab.setAttribute('aria-selected', onEdit ? 'false' : 'true');
  editTab.className = onEdit
    ? 'flex-1 text-sm font-bold py-2 rounded-md bg-white shadow-sm text-emerald-800'
    : 'flex-1 text-sm font-bold py-2 rounded-md text-slate-600';
  prevTab.className = onEdit
    ? 'flex-1 text-sm font-bold py-2 rounded-md text-slate-600'
    : 'flex-1 text-sm font-bold py-2 rounded-md bg-white shadow-sm text-emerald-800';
}

function renderFooterButtons() {
  const hasSel = Boolean(selectedRowId);
  $('tl-btn-minus5').disabled = !hasSel;
  $('tl-btn-plus5').disabled = !hasSel;
}

function renderAll() {
  syncFormFromEvent();
  renderRowList();
  renderRowEditor();
  renderPreview();
  renderConflictBanner();
  renderMobilePanels();
  renderTabs();
  renderFooterButtons();
}

function setMobileTab(tab) {
  mobileTab = tab;
  renderMobilePanels();
  renderTabs();
}

async function doCopy(mode) {
  const text = mode === 'tsv' ? formatTsv(state, state.rows.some((r) => (r.dayIndex ?? 0) > 0)) : formatPlain(state, state.rows.some((r) => (r.dayIndex ?? 0) > 0));
  if (!text.trim()) return;
  const btn = mode === 'tsv' ? $('tl-btn-copy-tsv') : $('tl-btn-copy-plain') || $('tl-btn-copy-plain-desk');
  try {
    await copyWithFeedback(text, btn, {
      toastEl: $('tl-copy-toast'),
      toastPrefix: mode === 'tsv' ? 'TSV' : 'プレーン',
      previewLine: text.split('\n')[0],
    });
  } catch {
    /* empty */
  }
}

function bind() {
  $('tl-event-title')?.addEventListener('input', () => {
    syncEventFromForm();
    renderPreview();
  });
  $('tl-event-date')?.addEventListener('change', () => {
    syncEventFromForm();
    renderAll();
  });
  $('tl-event-start')?.addEventListener('change', () => {
    syncEventFromForm();
    renderAll();
  });
  $('tl-event-target-end')?.addEventListener('change', () => {
    syncEventFromForm();
    renderPreview();
  });

  $('tl-load-template')?.addEventListener('click', () => {
    state = defaultTimelineTemplate();
    selectedRowId = state.rows[0]?.id ?? null;
    focusRowId = null;
    renderAll();
  });

  $('tl-row-title')?.addEventListener('change', () => {
    applyRowEditorToState();
    renderAll();
  });
  $('tl-row-duration')?.addEventListener('change', () => {
    applyRowEditorToState();
    renderAll();
  });
  $('tl-row-note')?.addEventListener('input', () => {
    applyRowEditorToState();
    renderRowNoteLinks();
    renderRowList();
    renderPreview();
  });
  $('tl-row-anchored')?.addEventListener('change', () => {
    $('tl-anchor-wrap')?.classList.toggle('hidden', !$('tl-row-anchored')?.checked);
    applyRowEditorToState();
    renderAll();
  });
  $('tl-row-anchor-at')?.addEventListener('change', () => {
    applyRowEditorToState();
    renderAll();
  });

  $('tl-row-delete')?.addEventListener('click', () => {
    if (!selectedRowId) return;
    state = deleteRow(state, selectedRowId);
    selectedRowId = state.rows[0]?.id ?? null;
    focusRowId = null;
    renderAll();
  });

  $('tl-row-up')?.addEventListener('click', () => {
    const idx = state.rows.findIndex((r) => r.id === selectedRowId);
    if (idx > 0) {
      state = moveRow(state, idx, idx - 1);
      renderAll();
    }
  });
  $('tl-row-down')?.addEventListener('click', () => {
    const idx = state.rows.findIndex((r) => r.id === selectedRowId);
    if (idx >= 0 && idx < state.rows.length - 1) {
      state = moveRow(state, idx, idx + 1);
      renderAll();
    }
  });

  $('tl-btn-minus5')?.addEventListener('click', () => {
    if (!selectedRowId) return;
    state = applyDurationDelta(state, selectedRowId, -DURATION_DELTA);
    renderAll();
  });
  $('tl-btn-plus5')?.addEventListener('click', () => {
    if (!selectedRowId) return;
    state = applyDurationDelta(state, selectedRowId, DURATION_DELTA);
    renderAll();
  });

  $('tl-btn-add')?.addEventListener('click', () => {
    const after = selectedRowId ?? state.rows[state.rows.length - 1]?.id ?? '';
    state = insertRowAfter(state, after, { title: '新しいコマ', durationMin: 5 });
    if (after) {
      const i = state.rows.findIndex((r) => r.id === after);
      selectedRowId = state.rows[i + 1]?.id ?? state.rows[state.rows.length - 1]?.id ?? null;
    } else {
      selectedRowId = state.rows[0]?.id ?? null;
    }
    renderAll();
  });

  $('tl-btn-copy-plain')?.addEventListener('click', () => doCopy('plain'));
  $('tl-btn-copy-plain-desk')?.addEventListener('click', () => doCopy('plain'));
  $('tl-btn-copy-tsv')?.addEventListener('click', () => doCopy('tsv'));

  $('tl-tab-edit')?.addEventListener('click', () => setMobileTab('edit'));
  $('tl-tab-preview')?.addEventListener('click', () => setMobileTab('preview'));

  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => {
    renderMobilePanels();
  });
}

function init() {
  selectedRowId = state.rows[0]?.id ?? null;
  bind();
  renderAll();
  // 秒単位は MVP 外（§5-1b）— 1分 tick で司会の残り時間と「今」線を十分に更新できる
  clockTimer = window.setInterval(() => {
    renderPreview();
    renderRowList();
  }, 60_000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { state };
