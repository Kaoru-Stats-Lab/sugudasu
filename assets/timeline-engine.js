/**
 * イベント進行タイムライン — 純関数エンジン（DOM 非依存）
 *
 * SSOT: docs/notes/TIMELINE_TOOL_SPEC.md
 * 思想メモ: 当日幹事は「1コマずらすと後ろ全部手計算」を Excel でやって破綻する。
 * 本モジュールは **累積分数モデル（案3）** で連鎖再計算だけを担う。Gantt/カレンダー同期は別製品。
 *
 * コメント方針（提督 2026-06-24）:
 * - 「なぜそうしたか」「なぜその値か」を関数・定数の直上に書く（仕様書の再掲ではなく現場理由）
 * - Sync(T13-S) も同一エンジンを import する前提 — サーバ側ロジックを増やさない
 */

// --- 上限・既定値（TIMELINE_TOOL_SPEC §4-2 · §5-1）---

/** 1日イベントで現実的な上限。それ以上は DOM・スクロールが司会の操作を阻害する。 */
export const ROW_MAX = 80;

/**
 * ソフト警告閾値。超えても動くが「セクション見出し行で分割」を促す。
 * 80 硬上限の半分 — 長い合宿でも 1 画面運用を意識した目安。
 */
export const ROW_SOFT_WARN = 40;

/**
 * 0 分コマは連鎖式が「何も進まない行」になり、+5 操作や差し込み（S7）のテストが曖昧になる。
 * 最短 1 分 = 「とりあえず枠だけ確保」の現場感覚に合わせた。
 */
export const DURATION_MIN = 1;

/**
 * 8 時間。誤入力（4800 など）で終了時刻が数日先に飛ぶのを防ぐ。
 * 合宿の「睡眠」ダミー行は意図的に長いが、通常コマでは異常値扱い。
 */
export const DURATION_MAX = 480;

/** タイトル上限。Slack コピー 1 行の可読性と、スマホ一覧の折り返しを考慮。 */
export const TITLE_MAX = 80;

/**
 * note は音響キュー・担当者名程度。100 字 = 一覧省略表示（…）しても
 * タップで全文読める量。独立 speaker 列は MVP 不要（後援差し込みは note で足す — §4-2 Sync）。
 */
export const NOTE_MAX = 100;

/**
 * 当日 UX の「3タップ以内」（§2-4）: 選択 → +5 → コピー。
 * 現場で最頻の調整が 5 分単位（司会・音響の感覚）なので delta は 5 固定。
 */
export const DURATION_DELTA = 5;

/** イベント開始のデフォルト。社内研修・勉強会の典型的な午前開始に合わせた。 */
export const DEFAULT_EVENT_START = '09:00';

/** 1 日内の分（0–1439）。日跨ぎは dayIndex で表し、翌日セクション自動挿入はしない（案3）。 */
export const MINUTES_PER_DAY = 1440;

/** localStorage 下書き（v1.1 予定）。コア MVP は非永続 — F1 非送信のまま端末内。 */
export const DRAFT_STORAGE_KEY = 'sg-timeline-draft-v1';

/**
 * @typedef {Object} TimelineEvent
 * @property {string} title
 * @property {string} dateIso YYYY-MM-DD
 * @property {string} startAt HH:mm
 * @property {string} [targetEndAt] 目標終了（撤収デッドライン）· HH:mm · 未設定ならサマリなし
 */

/**
 * @typedef {Object} TimelineRow
 * @property {string} id
 * @property {string} title
 * @property {number} durationMin
 * @property {boolean} [anchored]
 * @property {string} [anchorAt] HH:mm
 * @property {string} [note]
 * @property {number} [offsetMin] 算出 · イベント開始瞬間からの経過分
 * @property {string} [startAt] 算出
 * @property {string} [endAt] 算出
 * @property {number} [dayIndex] 算出 · 0=開始日
 * @property {boolean} [conflict] アンカー侵害
 */

/**
 * @typedef {Object} TimelineState
 * @property {TimelineEvent} event
 * @property {TimelineRow[]} rows
 * @property {1} version
 */

/**
 * HH:mm → 0–1439。24h 表記のみ（秒単位は MVP 外 — 司会は分で足りる）。
 * @param {string} hhmm
 */
export function parseTimeToMinutes(hhmm) {
  const m = String(hhmm ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return NaN;
  return h * 60 + min;
}

/**
 * 日内分 → HH:mm。recalc 後の表示専用（タイムゾーンは端末ローカル — 海外イベントは v1.1）。
 * @param {number} minutesInDay 0–1439 想定
 */
export function formatMinutesToTime(minutesInDay) {
  const n = ((minutesInDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(n / 60);
  const mm = n % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * @param {TimelineEvent} event
 * @returns {Date}
 */
function eventAnchorDate(event) {
  const [y, mo, d] = String(event.dateIso).split('-').map(Number);
  const startMin = parseTimeToMinutes(event.startAt);
  const date = new Date(y, mo - 1, d, 0, 0, 0, 0);
  date.setMinutes(startMin);
  return date;
}

/**
 * 累積 offsetMin → カレンダー表示。
 * 案3: フラット配列 + dayIndex バッジ。翌日見出し行の自動挿入はしない（手動で睡眠ダミー行可）。
 *
 * @param {TimelineEvent} event
 * @param {number} offsetMin
 * @returns {{ dayIndex: number, clockMin: number }}
 */
export function offsetToCalendar(event, offsetMin) {
  const base = eventAnchorDate(event);
  const instant = new Date(base.getTime() + offsetMin * 60_000);
  const dayStart = new Date(base);
  dayStart.setHours(0, 0, 0, 0);
  const instantDay = new Date(instant);
  instantDay.setHours(0, 0, 0, 0);
  const dayIndex = Math.round((instantDay.getTime() - dayStart.getTime()) / 86_400_000);
  const clockMin = instant.getHours() * 60 + instant.getMinutes();
  return { dayIndex, clockMin, startAt: formatMinutesToTime(clockMin) };
}

/**
 * イベント開始から「dayIndex 日目の hh:mm」までの経過分。
 * @param {TimelineEvent} event
 * @param {number} dayIndex
 * @param {string} hhmm
 */
function minutesFromEventStartTo(event, dayIndex, hhmm) {
  const base = eventAnchorDate(event);
  const target = new Date(base);
  target.setDate(target.getDate() + dayIndex);
  const t = parseTimeToMinutes(hhmm);
  if (Number.isNaN(t)) return 0;
  target.setHours(Math.floor(t / 60), t % 60, 0, 0);
  return Math.round((target.getTime() - base.getTime()) / 60_000);
}

/**
 * @returns {string}
 */
export function createRowId() {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 空状態。version:1 は将来 JSON import の互換ガード。
 * @param {Partial<TimelineEvent>} [eventPartial]
 * @returns {TimelineState}
 */
export function createEmptyState(eventPartial = {}) {
  const today = new Date();
  const dateIso =
    eventPartial.dateIso ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  /** @type {TimelineState} */
  const state = {
    event: {
      title: eventPartial.title ?? '',
      dateIso,
      startAt: eventPartial.startAt ?? DEFAULT_EVENT_START,
    },
    rows: [],
    version: 1,
  };
  return recalcTimeline(state);
}

/**
 * 連鎖再計算の心臓。
 *
 * なぜ immutable: UI が React でなくても、差し込み（S7）と ±5 が連続すると
 * ミュータブルだと「どの版をコピーしたか」が壊れる。Sync でも同じ state を渡す。
 *
 * アンカー衝突時に自動圧縮しない理由（Gemini §3 · 提督確定）:
 * 機械的に前コマを削ると司会が知らないうちに登壇時間が短くなる — 事故る。
 * conflict フラグだけ立て、人が手で直す。
 *
 * @param {TimelineState} state
 * @param {number} [fromIndex=0]
 * @returns {TimelineState}
 */
export function recalcTimeline(state, fromIndex = 0) {
  const event = state.event;
  const rows = state.rows.map((row) => ({ ...row }));
  const start = Math.max(0, Math.min(fromIndex, rows.length));

  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    let offsetMin = 0;
    let conflict = false;

    if (i === 0) {
      offsetMin = 0;
    } else {
      offsetMin = (rows[i - 1].offsetMin ?? 0) + rows[i - 1].durationMin;
    }

    if (row.anchored && row.anchorAt) {
      // 自然連鎖が到達する日付に、アンカー時刻を「釘で打つ」
      const chainCal = offsetToCalendar(event, offsetMin);
      offsetMin = minutesFromEventStartTo(event, chainCal.dayIndex, row.anchorAt);

      if (i > 0) {
        const prevEndOffset = (rows[i - 1].offsetMin ?? 0) + rows[i - 1].durationMin;
        const prevEnd = offsetToCalendar(event, prevEndOffset);
        const anchorStart = offsetToCalendar(event, offsetMin);
        const anchorClock = parseTimeToMinutes(row.anchorAt);
        const prevEndClock = prevEnd.clockMin;
        if (
          prevEnd.dayIndex > anchorStart.dayIndex ||
          (prevEnd.dayIndex === anchorStart.dayIndex && prevEndClock > anchorClock)
        ) {
          conflict = true;
        }
      }
    }

    const startCal = offsetToCalendar(event, offsetMin);
    const endCal = offsetToCalendar(event, offsetMin + row.durationMin);

    row.offsetMin = offsetMin;
    row.dayIndex = startCal.dayIndex;
    row.startAt = startCal.startAt;
    row.endAt = endCal.startAt;
    row.conflict = conflict;
  }

  return { ...state, rows };
}

/**
 * ±5 分クイック調整（§2-4 · DURATION_DELTA）。
 * @param {TimelineState} state
 * @param {string} rowId
 * @param {number} delta
 */
export function applyDurationDelta(state, rowId, delta) {
  const rows = state.rows.map((row) => {
    if (row.id !== rowId) return row;
    const next = row.durationMin + delta;
    const clamped = Math.min(DURATION_MAX, Math.max(DURATION_MIN, next));
    return { ...row, durationMin: clamped };
  });
  const idx = rows.findIndex((r) => r.id === rowId);
  return recalcTimeline({ ...state, rows }, idx >= 0 ? idx : 0);
}

/**
 * 差し込み（S7）— 選択行の直後に空コマ。Excel の行挿入で式が壊れる問題の正攻法。
 * @param {TimelineState} state
 * @param {string} afterRowId
 * @param {Partial<TimelineRow>} [partial]
 */
export function insertRowAfter(state, afterRowId, partial = {}) {
  if (state.rows.length >= ROW_MAX) return state;
  const idx = state.rows.findIndex((r) => r.id === afterRowId);
  const insertAt = idx < 0 ? state.rows.length : idx + 1;
  /** @type {TimelineRow} */
  const newRow = {
    id: partial.id ?? createRowId(),
    title: partial.title ?? '新しいコマ',
    durationMin: partial.durationMin ?? 5,
    note: partial.note ?? '',
    anchored: partial.anchored ?? false,
    anchorAt: partial.anchorAt,
  };
  const rows = [...state.rows.slice(0, insertAt), newRow, ...state.rows.slice(insertAt)];
  return recalcTimeline({ ...state, rows }, insertAt);
}

/**
 * セッション飛ばし（S7）— 削除後は後続が繰り上がる。
 * @param {TimelineState} state
 * @param {string} rowId
 */
export function deleteRow(state, rowId) {
  const idx = state.rows.findIndex((r) => r.id === rowId);
  if (idx < 0) return state;
  const rows = state.rows.filter((r) => r.id !== rowId);
  return recalcTimeline({ ...state, rows }, idx);
}

/**
 * ↑↓ 並べ替え（DnD は v1.1 — まずボタンで十分）。
 * @param {TimelineState} state
 * @param {number} fromIndex
 * @param {number} toIndex
 */
export function moveRow(state, fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= state.rows.length) return state;
  if (toIndex < 0 || toIndex >= state.rows.length) return state;
  if (fromIndex === toIndex) return state;
  const rows = [...state.rows];
  const [item] = rows.splice(fromIndex, 1);
  rows.splice(toIndex, 0, item);
  const start = Math.min(fromIndex, toIndex);
  return recalcTimeline({ ...state, rows }, start);
}

/**
 * @param {TimelineRow} row
 * @returns {{ ok: true } | { ok: false, code: string }}
 */
export function validateRow(row) {
  const title = String(row.title ?? '').trim();
  if (!title) return { ok: false, code: 'title_empty' };
  if (title.length > TITLE_MAX) return { ok: false, code: 'title_long' };
  const d = row.durationMin;
  if (!Number.isFinite(d) || d < DURATION_MIN || d > DURATION_MAX) {
    return { ok: false, code: 'duration_range' };
  }
  const note = String(row.note ?? '');
  if (note.length > NOTE_MAX) return { ok: false, code: 'note_long' };
  if (row.anchored && row.anchorAt && Number.isNaN(parseTimeToMinutes(row.anchorAt))) {
    return { ok: false, code: 'anchor_invalid' };
  }
  return { ok: true };
}

/**
 * Slack/LINE 貼り付け用（O1）。note 括弧は司会台本にそのまま読める形。
 * @param {TimelineState} state
 * @param {boolean} [includeDay=false]
 */
export function formatPlain(state, includeDay = false) {
  return state.rows
    .map((row) => {
      const day = includeDay && (row.dayIndex ?? 0) > 0 ? `Day${(row.dayIndex ?? 0) + 1} ` : '';
      const core = `${day}${row.startAt}–${row.endAt}  ${row.title}`;
      const note = String(row.note ?? '').trim();
      return note ? `【${row.startAt}–${row.endAt}】${row.title} （備考：${note}）` : core;
    })
    .join('\n');
}

/**
 * スプレッドシート貼り付け（O2）。BOM は UI 層で付与可。
 * @param {TimelineState} state
 * @param {boolean} [includeDay=false]
 */
export function formatTsv(state, includeDay = false) {
  const header = includeDay ? 'Day\t開始\t終了\t分\tタイトル' : '開始\t終了\t分\tタイトル';
  const lines = state.rows.map((row) => {
    const base = `${row.startAt}\t${row.endAt}\t${row.durationMin}\t${row.title}`;
    return includeDay ? `${(row.dayIndex ?? 0) + 1}\t${base}` : base;
  });
  return [header, ...lines].join('\n');
}

/**
 * 進行中コマの推定。半開区間 [start, end) — end ちょうどは「次」に入る（司会の感覚）。
 * @param {TimelineState} state
 * @param {Date} now
 * @returns {number} index or -1
 */
export function getCurrentRowIndex(state, now) {
  const base = eventAnchorDate(state.event);
  const nowOffset = Math.round((now.getTime() - base.getTime()) / 60_000);
  for (let i = 0; i < state.rows.length; i++) {
    const row = state.rows[i];
    const start = row.offsetMin ?? 0;
    const end = start + row.durationMin;
    if (nowOffset >= start && nowOffset < end) return i;
  }
  return -1;
}

/**
 * タップ行の「開始まで」（§5-1b 残り時間 · 任意モード）。
 * @param {TimelineState} state
 * @param {string} rowId
 * @param {Date} now
 */
export function minutesUntilRowStart(state, rowId, now) {
  const row = state.rows.find((r) => r.id === rowId);
  if (!row) return null;
  const base = eventAnchorDate(state.event);
  const nowOffset = Math.round((now.getTime() - base.getTime()) / 60_000);
  return Math.max(0, (row.offsetMin ?? 0) - nowOffset);
}

/**
 * デフォルト残り時間 = 進行中コマの終了まで。
 * @param {TimelineState} state
 * @param {Date} now
 */
export function minutesUntilCurrentRowEnd(state, now) {
  const idx = getCurrentRowIndex(state, now);
  if (idx < 0) return null;
  const row = state.rows[idx];
  const base = eventAnchorDate(state.event);
  const nowOffset = Math.round((now.getTime() - base.getTime()) / 60_000);
  const end = (row.offsetMin ?? 0) + row.durationMin;
  return Math.max(0, end - nowOffset);
}

/**
 * 初回入力の摩擦削減用テンプレ（Phase B · T0-10）。
 * 3h 研修想定 — 実装時 UI の「読み込み」は v1.1。
 * @returns {TimelineState}
 */
export function defaultTimelineTemplate() {
  const state = createEmptyState({
    title: '社内研修（3h）',
    startAt: '13:00',
  });
  const seeds = [
    { title: '開会・趣旨説明', durationMin: 15 },
    { title: '講義', durationMin: 60 },
    { title: '休憩', durationMin: 10 },
    { title: 'ワーク', durationMin: 45 },
    { title: '発表・質疑', durationMin: 40 },
    { title: '閉会', durationMin: 10 },
  ];
  let s = state;
  for (const seed of seeds) {
    const afterId = s.rows.length > 0 ? s.rows[s.rows.length - 1].id : '';
    s = insertRowAfter(s, afterId, seed);
  }
  return s;
}

/**
 * 終了予定 vs 目標終了（Rundown early/over 相当 · §5-2）。
 *
 * deltaMin = 目標終了オフセット − 終了予定オフセット。
 * 正 = 余裕（early）· 負 = オーバー。
 *
 * 比較は **終了予定と同じ dayIndex** 上の targetEndAt — 複数日は終了日に合わせる。
 *
 * @param {TimelineState} state
 * @returns {null | {
 *   plannedEndAt: string,
 *   plannedDayIndex: number,
 *   hasTarget: boolean,
 *   targetEndAt?: string,
 *   deltaMin?: number,
 *   status?: 'early' | 'over' | 'on_time',
 *   labelJa?: string,
 * }}
 */
export function getDeadlineSummary(state) {
  if (!state.rows.length) return null;
  const last = state.rows[state.rows.length - 1];
  const plannedEndOffset = (last.offsetMin ?? 0) + last.durationMin;
  const planned = offsetToCalendar(state.event, plannedEndOffset);
  const targetRaw = String(state.event.targetEndAt ?? '').trim();
  if (!targetRaw || Number.isNaN(parseTimeToMinutes(targetRaw))) {
    return {
      plannedEndAt: planned.startAt,
      plannedDayIndex: planned.dayIndex,
      hasTarget: false,
    };
  }
  const targetOffset = minutesFromEventStartTo(state.event, planned.dayIndex, targetRaw);
  const deltaMin = targetOffset - plannedEndOffset;
  if (deltaMin > 0) {
    return {
      plannedEndAt: planned.startAt,
      plannedDayIndex: planned.dayIndex,
      hasTarget: true,
      targetEndAt: targetRaw,
      deltaMin,
      status: 'early',
      labelJa: `${formatRemainingShort(deltaMin)} 余裕`,
    };
  }
  if (deltaMin < 0) {
    const over = Math.abs(deltaMin);
    return {
      plannedEndAt: planned.startAt,
      plannedDayIndex: planned.dayIndex,
      hasTarget: true,
      targetEndAt: targetRaw,
      deltaMin,
      status: 'over',
      labelJa: `+${over}分 オーバー`,
    };
  }
  return {
    plannedEndAt: planned.startAt,
    plannedDayIndex: planned.dayIndex,
    hasTarget: true,
    targetEndAt: targetRaw,
    deltaMin: 0,
    status: 'on_time',
    labelJa: 'ぴったり',
  };
}

/**
 * @param {number} totalMin
 */
function formatRemainingShort(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}時間${m}分`;
  if (h > 0) return `${h}時間`;
  return `${m}分`;
}
