/**
 * DONE 後の「次の1本」（編集固定）
 * SSOT: docs/notes/TOOL_NEXT_PATH_SPEC.md · data/tool-next-path.json
 * ページ反映: tools/{id}.html の data-sg-next-*（scripts/sync-tool-next-path-html.mjs）
 * 履歴推薦・relations 多対多とは別。主完了を塞がない。
 */

const DATA_URL = '/data/tool-next-path.json';
const DISMISS_PREFIX = 'sg-next-path-dismiss:';

/** @type {Promise<{ paths: Record<string, { type: string, nextId: string, reason: string, linkLabel: string }> }> | null} */
let catalogPromise = null;

/** @type {string | null} */
let shownForTool = null;

/** @returns {string} */
function resolveToolIdLocal() {
  try {
    var top = document.getElementById('sg-chrome-top');
    var fromDom = top && top.getAttribute('data-sg-tool-id');
    if (fromDom) return String(fromDom).trim();
  } catch (_) {
    /* ignore */
  }
  try {
    var seg = (location.pathname || '').split('/').filter(Boolean).pop() || '';
    if (!seg || seg === 'index.html') return 'hub';
    return seg.replace(/\.html$/i, '') || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

/**
 * HTML に同期された Next（from ページのみ）。無ければ null。
 * @returns {{ nextId: string, linkLabel: string, reason: string, type: string } | null}
 */
function pathFromChrome() {
  try {
    var top = document.getElementById('sg-chrome-top');
    if (!top) return null;
    var nextId = (top.getAttribute('data-sg-next-id') || '').trim();
    var linkLabel = (top.getAttribute('data-sg-next-label') || '').trim();
    var reason = (top.getAttribute('data-sg-next-reason') || '').trim();
    if (!nextId || !linkLabel) return null;
    return { nextId: nextId, linkLabel: linkLabel, reason: reason || '', type: 'page' };
  } catch (_) {
    return null;
  }
}

/**
 * @returns {Promise<{ paths: Record<string, { type: string, nextId: string, reason: string, linkLabel: string }> } | null>}
 */
function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(DATA_URL, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('next-path fetch ' + r.status);
        return r.json();
      })
      .catch(function () {
        catalogPromise = null;
        return null;
      });
  }
  return catalogPromise;
}

/**
 * @param {string} toolId
 * @returns {boolean}
 */
function isDismissed(toolId) {
  try {
    return sessionStorage.getItem(DISMISS_PREFIX + toolId) === '1';
  } catch (_) {
    return false;
  }
}

/**
 * @param {string} toolId
 */
function setDismissed(toolId) {
  try {
    sessionStorage.setItem(DISMISS_PREFIX + toolId, '1');
  } catch (_) {
    /* ignore */
  }
}

/**
 * @param {string} eventName
 * @param {Record<string, string>} params
 */
function trackMeta(eventName, params) {
  try {
    if (typeof globalThis.gtag === 'function') {
      globalThis.gtag('event', eventName, params);
    }
  } catch (_) {
    /* ignore */
  }
}

/**
 * @param {{ type: string, nextId: string, reason: string, linkLabel: string }} path
 * @param {string} fromId
 */
function renderFloatingBar(path, fromId) {
  var existing = document.getElementById('sg-tool-next-path');
  if (existing) existing.remove();

  var bar = document.createElement('aside');
  bar.id = 'sg-tool-next-path';
  bar.className = 'sg-tool-next-path';
  bar.setAttribute('role', 'complementary');
  bar.setAttribute('aria-label', '次の作業');

  var reason = document.createElement('p');
  reason.className = 'sg-tool-next-path__reason';
  reason.textContent = path.reason;

  var link = document.createElement('a');
  link.className = 'sg-tool-next-path__link';
  link.href = '/' + encodeURIComponent(path.nextId);
  link.textContent = path.linkLabel;
  link.addEventListener('click', function () {
    trackMeta('tool_next_path_click', {
      tool_id: fromId,
      next_id: path.nextId,
      path_type: path.type,
    });
  });

  var dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'sg-tool-next-path__dismiss';
  dismiss.setAttribute('aria-label', '閉じる');
  dismiss.textContent = '×';
  dismiss.addEventListener('click', function () {
    setDismissed(fromId);
    bar.remove();
  });

  bar.appendChild(reason);
  bar.appendChild(link);
  bar.appendChild(dismiss);
  document.body.appendChild(bar);
}

/**
 * @param {string} toolId
 * @returns {Promise<{ type: string, nextId: string, reason: string, linkLabel: string } | null>}
 */
function resolvePath(toolId) {
  var fromPage = pathFromChrome();
  if (fromPage) return Promise.resolve(fromPage);
  return loadCatalog().then(function (doc) {
    if (!doc || !doc.paths) return null;
    var path = doc.paths[toolId];
    if (!path || !path.nextId || !path.linkLabel) return null;
    return path;
  });
}

/**
 * tool_job_done 成功後に呼ぶ。該当 path が無ければ何もしない。
 * @param {string} [toolId]
 */
export function offerToolNextPath(toolId) {
  var id = String(toolId || resolveToolIdLocal() || '').trim();
  if (!id || id === 'unknown' || id === 'hub') return;
  if (shownForTool === id) return;
  if (isDismissed(id)) return;

  resolvePath(id).then(function (path) {
    if (!path) return;
    shownForTool = id;
    renderFloatingBar(path, id);
  });
}

export default { offerToolNextPath };
