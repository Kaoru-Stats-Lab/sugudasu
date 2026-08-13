/**
 * SUGUDASU プロダクト利用計測（開封→着手→完了）
 * SSOT: docs/notes/PRODUCT_USAGE_ANALYTICS.md
 * 憲法: 入力・名簿・検索語・プレビュー本文は送らない（メタのみ）
 */

const OUTCOMES = new Set(['copy', 'pdf', 'download', 'print']);
const FAIL_REASONS = new Set(['gate', 'empty', 'other']);
const INPUT_KINDS = new Set([
  'file_drop',
  'file_pick',
  'paste',
  'clipboard_image',
  'type',
  'camera',
  'load_session',
  'generate',
]);

/** @type {Set<string>} ページ寿命 · input_kind ごと最大1回 */
const startedOnce = new Set();

/** @type {WeakMap<Element, ReturnType<typeof setTimeout>>} */
const textTimers = new WeakMap();

/**
 * @returns {string}
 */
export function resolveToolId() {
  try {
    const top = typeof document !== 'undefined' ? document.getElementById('sg-chrome-top') : null;
    const fromDom = top && top.getAttribute('data-sg-tool-id');
    if (fromDom) return String(fromDom).trim();
  } catch (_) {
    /* ignore */
  }
  try {
    const seg =
      (typeof location !== 'undefined' && location.pathname
        ? String(location.pathname).split('/').filter(Boolean).pop()
        : '') || '';
    if (!seg || seg === 'index.html') return 'hub';
    return seg.replace(/\.html$/i, '') || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

/**
 * 作業着手（ジャーニー中間）。本文・ファイル名は送らない。
 * ページ表示あたり同一 input_kind は最大1回。
 * @param {string} inputKind
 * @param {Record<string, string | number | boolean> | null | undefined} [extra]
 */
export function notifyJobStarted(inputKind, extra) {
  const kind = String(inputKind || '');
  if (!INPUT_KINDS.has(kind)) return;
  if (startedOnce.has(kind)) return;
  const toolId = resolveToolId();
  if (!toolId || toolId === 'unknown' || toolId === 'hub') return;
  startedOnce.add(kind);
  const params = Object.assign(
    {
      tool_id: toolId,
      input_kind: kind,
      event_source: 'sg_analytics',
    },
    sanitizeExtra(extra),
  );
  track('tool_job_started', params);
}

/**
 * @param {string} outcome
 * @param {Record<string, string | number | boolean> | null | undefined} [extra]
 */
export function notifyJobDone(outcome, extra) {
  const o = String(outcome || '');
  if (!OUTCOMES.has(o)) return;
  const toolId = resolveToolId();
  if (!toolId || toolId === 'unknown') return;
  const params = Object.assign(
    {
      tool_id: toolId,
      outcome: o,
      event_source: 'sg_analytics',
    },
    sanitizeExtra(extra),
  );
  track('tool_job_done', params);
  // DECISION: 編集固定の次の1本のみ。履歴推薦禁止 — TOOL_NEXT_PATH_SPEC.md
  import('./sg-tool-next-path.js')
    .then(function (m) {
      if (m && typeof m.offerToolNextPath === 'function') m.offerToolNextPath(toolId);
    })
    .catch(function () {
      /* ignore */
    });
}

/**
 * @param {string} reasonCode
 * @param {Record<string, string | number | boolean> | null | undefined} [extra]
 */
export function notifyJobFailed(reasonCode, extra) {
  let reason = String(reasonCode || 'other');
  if (!FAIL_REASONS.has(reason)) reason = 'other';
  const toolId = resolveToolId();
  if (!toolId || toolId === 'unknown') return;
  track(
    'tool_job_failed',
    Object.assign(
      {
        tool_id: toolId,
        reason_code: reason,
        event_source: 'sg_analytics',
      },
      sanitizeExtra(extra),
    ),
  );
  // DECISION: 定性受け皿 — GA には本文を載せない。UI は CustomEvent で起動（QUALITATIVE_FEEDBACK_INTAKE）
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sg:job-failed', { detail: { tool_id: toolId, reason_code: reason } }),
      );
    }
  } catch (_) {
    /* ignore */
  }
}

/**
 * Blob ダウンロード + tool_job_done
 * @param {Blob} blob
 * @param {string} filename
 * @param {'download' | 'pdf'} [outcome]
 */
export function downloadBlobTracked(blob, filename, outcome = 'download') {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  notifyJobDone(outcome === 'pdf' ? 'pdf' : 'download');
}

/** 印刷ダイアログ + tool_job_done（onclick="window.print()" の代替） */
export function printTracked() {
  notifyJobDone('print');
  try {
    window.print();
  } catch (_) {
    /* ignore */
  }
}

/**
 * ファイル受理（DnD / ピッカー / 画像クリップボード）
 * @param {'file_drop' | 'file_pick' | 'clipboard_image'} kind
 */
export function trackFileAccepted(kind) {
  if (kind === 'file_drop' || kind === 'file_pick' || kind === 'clipboard_image') {
    notifyJobStarted(kind);
  }
}

/**
 * テキスト貼り付け着手（本文は送らない）
 */
export function trackPasteEngaged() {
  notifyJobStarted('paste');
}

/**
 * フォーム/テキストの初回有意入力（debounce · 本文なし）
 * @param {string | { value?: string } | null | undefined} valueOrEl
 * @param {{ debounceMs?: number, minLength?: number }} [opts]
 */
export function trackTextEngaged(valueOrEl, opts = {}) {
  const debounceMs = opts.debounceMs ?? 400;
  const minLength = opts.minLength ?? 1;
  let raw = '';
  if (typeof valueOrEl === 'string') raw = valueOrEl;
  else if (valueOrEl && typeof valueOrEl.value === 'string') raw = valueOrEl.value;
  const trimmed = String(raw || '').trim();
  if (trimmed.length < minLength) return;

  const el = valueOrEl && typeof valueOrEl === 'object' ? /** @type {Element} */ (valueOrEl) : null;
  if (el) {
    const prev = textTimers.get(el);
    if (prev) clearTimeout(prev);
    textTimers.set(
      el,
      setTimeout(() => {
        textTimers.delete(el);
        if (String(/** @type {{ value?: string }} */ (el).value || '').trim().length >= minLength) {
          notifyJobStarted('type');
        }
      }, debounceMs),
    );
    return;
  }
  notifyJobStarted('type');
}

/**
 * input / paste を要素にバインド（本文は読まない · 有無と trim 長だけ）
 * @param {Element | null | undefined} el
 * @param {{ debounceMs?: number, minLength?: number }} [opts]
 */
export function bindTextJobStarted(el, opts = {}) {
  if (!el || typeof el.addEventListener !== 'function') return;
  el.addEventListener('input', () => {
    trackTextEngaged(/** @type {{ value?: string }} */ (el), opts);
  });
  el.addEventListener('paste', () => {
    // DECISION: paste イベント時点では value 未反映のため paste kind を先に送る
    trackPasteEngaged();
  });
}

/**
 * @param {Record<string, string | number | boolean> | null | undefined} extra
 */
function sanitizeExtra(extra) {
  if (!extra || typeof extra !== 'object') return {};
  /** @type {Record<string, string | number | boolean>} */
  const out = {};
  // DECISION: surface 等の短い列挙のみ許可。自由文・プレビューは落とす。
  const allow = new Set(['surface']);
  for (const key of Object.keys(extra)) {
    if (!allow.has(key)) continue;
    const v = extra[key];
    if (typeof v === 'string' && v.length <= 32) out[key] = v;
    else if (typeof v === 'number' || typeof v === 'boolean') out[key] = v;
  }
  return out;
}

/**
 * @param {string} name
 * @param {Record<string, string | number | boolean>} params
 */
function track(name, params) {
  try {
    const shell = typeof globalThis !== 'undefined' ? globalThis.SUGUDASU_SHELL : null;
    if (shell && typeof shell.trackGaEvent === 'function') {
      shell.trackGaEvent(name, params);
      return;
    }
  } catch (_) {
    /* ignore */
  }
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.gtag === 'function') {
      globalThis.gtag('event', name, params);
    }
  } catch (_) {
    /* noop */
  }
}

const api = {
  resolveToolId,
  notifyJobStarted,
  notifyJobDone,
  notifyJobFailed,
  downloadBlobTracked,
  printTracked,
  trackFileAccepted,
  trackPasteEngaged,
  trackTextEngaged,
  bindTextJobStarted,
  trackToolJobDone: notifyJobDone,
  trackToolJobStarted: notifyJobStarted,
};

if (typeof globalThis !== 'undefined') {
  const prev = globalThis.SG_ANALYTICS;
  globalThis.SG_ANALYTICS = api;
  // shell のキュー stub をフラッシュ（HTML インラインが module より先に bind した場合）
  try {
    const q = prev && Array.isArray(prev.__queue) ? prev.__queue : [];
    for (let i = 0; i < q.length; i++) {
      const pair = q[i];
      const name = pair && pair[0];
      const args = (pair && pair[1]) || [];
      if (name && typeof api[name] === 'function') {
        api[name].apply(null, args);
      }
    }
  } catch (_) {
    /* ignore */
  }
  try {
    globalThis.dispatchEvent(new CustomEvent('sg-analytics-ready'));
  } catch (_) {
    /* ignore */
  }
}

export default api;
