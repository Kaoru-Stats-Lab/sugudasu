/**
 * SUGUDASU 定性フィードバック（インページ · 遷移なし）
 * SSOT: docs/notes/QUALITATIVE_FEEDBACK_INTAKE.md
 * 送信: POST /api/feedback → GitHub Issues（メタ＋短文のみ）
 */

const KINDS = [
  { id: 'bug', label: '動作不具合' },
  { id: 'ux', label: '使いにくさ' },
  { id: 'feature', label: '機能の要望' },
  { id: 'other', label: 'その他' },
];

const MAX_MESSAGE = 500;

/** @type {HTMLElement | null} */
let panelEl = null;
/** @type {HTMLElement | null} */
let failStripEl = null;

/**
 * @param {{ source?: string, error_code?: string, tool_id?: string }} [opts]
 */
export function openFeedbackPanel(opts = {}) {
  ensurePanel();
  const source = opts.source || 'footer';
  const form = panelEl.querySelector('[data-sg-fb-form]');
  form.dataset.source = source;
  form.dataset.errorCode = opts.error_code || '';
  if (opts.tool_id) form.dataset.toolId = opts.tool_id;
  const status = panelEl.querySelector('[data-sg-fb-status]');
  if (status) {
    status.textContent = '';
    status.hidden = true;
  }
  const ta = panelEl.querySelector('textarea');
  if (ta) ta.value = '';
  panelEl.hidden = false;
  ta && ta.focus();
  hideFailStrip();
}

export function closeFeedbackPanel() {
  if (panelEl) panelEl.hidden = true;
}

/**
 * 失敗時の控えめストリップ（エラー隣ではなくフッタ直上）
 * @param {{ error_code?: string }} [detail]
 */
export function offerFailureFeedback(detail = {}) {
  ensureFailStrip();
  failStripEl.dataset.errorCode = detail.error_code || 'other';
  failStripEl.hidden = false;
}

export function hideFailStrip() {
  if (failStripEl) failStripEl.hidden = true;
}

/** shell / updates から呼ぶ初期化 */
export function initFeedbackChrome() {
  document.addEventListener('click', onDocClick);
  window.addEventListener('sg:job-failed', function (ev) {
    const d = (ev && ev.detail) || {};
    offerFailureFeedback({ error_code: d.reason_code || d.error_code || 'other' });
  });
}

function onDocClick(ev) {
  const t = ev.target;
  if (!(t instanceof Element)) return;
  const openBtn = t.closest('[data-sg-feedback-open]');
  if (openBtn) {
    ev.preventDefault();
    openFeedbackPanel({
      source: openBtn.getAttribute('data-sg-feedback-source') || 'footer',
      error_code: openBtn.getAttribute('data-sg-feedback-error') || '',
    });
    return;
  }
  if (t.closest('[data-sg-feedback-close]')) {
    ev.preventDefault();
    closeFeedbackPanel();
    hideFailStrip();
    return;
  }
  const failBtn = t.closest('[data-sg-feedback-fail-open]');
  if (failBtn) {
    ev.preventDefault();
    openFeedbackPanel({
      source: 'failure_inline',
      error_code: (failStripEl && failStripEl.dataset.errorCode) || 'other',
    });
  }
}

function ensurePanel() {
  if (panelEl) return;
  panelEl = document.createElement('div');
  panelEl.id = 'sg-feedback-panel';
  panelEl.className = 'sg-feedback-panel no-print';
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('aria-label', 'フィードバック');
  panelEl.hidden = true;
  panelEl.innerHTML = `
    <div class="sg-feedback-panel__card" data-sg-fb-form data-source="footer">
      <div class="sg-feedback-panel__head">
        <p class="sg-feedback-panel__title">フィードバック</p>
        <button type="button" class="sg-feedback-panel__x" data-sg-feedback-close aria-label="閉じる">×</button>
      </div>
      <p class="sg-feedback-panel__hint">任意送信です。返信はしません。名簿・請求・ファイル内容は書かないでください。</p>
      <fieldset class="sg-feedback-panel__kinds">
        <legend class="sr-only">分類</legend>
        ${KINDS.map(
          (k, i) => `
          <label class="sg-feedback-panel__kind">
            <input type="radio" name="sg-fb-kind" value="${k.id}" ${i === 0 ? 'checked' : ''}>
            <span>${k.label}</span>
          </label>`,
        ).join('')}
      </fieldset>
      <label class="sg-feedback-panel__label" for="sg-fb-message">内容</label>
      <textarea id="sg-fb-message" class="sg-input sg-feedback-panel__ta" rows="4" maxlength="${MAX_MESSAGE}"
        placeholder="例: コピーしたら改行が崩れた（環境: Chrome / Windows）"></textarea>
      <div class="sg-feedback-panel__actions">
        <button type="button" class="sg-btn-primary text-sm" data-sg-fb-submit>送信する</button>
        <button type="button" class="sg-btn-secondary text-sm" data-sg-feedback-close>閉じる</button>
      </div>
      <p class="sg-feedback-panel__status" data-sg-fb-status hidden role="status"></p>
    </div>
  `;
  document.body.appendChild(panelEl);
  panelEl.querySelector('[data-sg-fb-submit]').addEventListener('click', onSubmit);
}

function ensureFailStrip() {
  if (failStripEl) return;
  failStripEl = document.createElement('div');
  failStripEl.id = 'sg-feedback-fail-strip';
  failStripEl.className = 'sg-feedback-fail-strip no-print';
  failStripEl.hidden = true;
  failStripEl.innerHTML = `
    <p class="sg-feedback-fail-strip__text">うまくいかなかった場合は、状況だけ送れます。</p>
    <button type="button" class="sg-feedback-fail-strip__btn" data-sg-feedback-fail-open>不具合を報告</button>
    <button type="button" class="sg-feedback-fail-strip__x" data-sg-feedback-close aria-label="閉じる">×</button>
  `;
  const bottom = document.getElementById('sg-chrome-bottom');
  if (bottom && bottom.parentNode) {
    bottom.parentNode.insertBefore(failStripEl, bottom);
  } else {
    document.body.appendChild(failStripEl);
  }
}

async function onSubmit() {
  const form = panelEl.querySelector('[data-sg-fb-form]');
  const status = panelEl.querySelector('[data-sg-fb-status]');
  const ta = panelEl.querySelector('textarea');
  const kindInput = panelEl.querySelector('input[name="sg-fb-kind"]:checked');
  const message = String(ta && ta.value ? ta.value : '').trim();
  if (message.length < 3) {
    showStatus(status, 'もう少し具体的に書いてください。', true);
    return;
  }
  const submitBtn = panelEl.querySelector('[data-sg-fb-submit]');
  submitBtn.disabled = true;
  showStatus(status, '送信中…', false);

  const payload = {
    tool_id: form.dataset.toolId || resolveToolId(),
    source: form.dataset.source || 'footer',
    kind: (kindInput && kindInput.value) || 'other',
    message: message.slice(0, MAX_MESSAGE),
    error_code: form.dataset.errorCode || undefined,
    ua_short: uaShort(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    page_path: location.pathname || '/',
  };

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const err = data.error || `http_${res.status}`;
      showStatus(
        status,
        err === 'feedback_not_configured'
          ? 'いま送信できません。更新履歴のメール窓口をご利用ください。'
          : err === 'rate_limited'
            ? '送信上限に達しました。しばらくしてから再度お試しください。'
            : '送信に失敗しました。メール窓口をご利用ください。',
        true,
      );
      submitBtn.disabled = false;
      return;
    }
    showStatus(status, '送りました。ありがとうございます。', false);
    setTimeout(() => {
      closeFeedbackPanel();
      submitBtn.disabled = false;
    }, 900);
  } catch {
    showStatus(status, '送信に失敗しました。メール窓口をご利用ください。', true);
    submitBtn.disabled = false;
  }
}

function showStatus(el, text, isError) {
  if (!el) return;
  el.hidden = false;
  el.textContent = text;
  el.classList.toggle('sg-feedback-panel__status--err', !!isError);
}

function resolveToolId() {
  try {
    const top = document.getElementById('sg-chrome-top');
    const fromDom = top && top.getAttribute('data-sg-tool-id');
    if (fromDom) return String(fromDom).trim();
  } catch {
    /* ignore */
  }
  try {
    const seg = String(location.pathname || '')
      .split('/')
      .filter(Boolean)
      .pop() || '';
    if (!seg || seg === 'index.html') return 'hub';
    return seg.replace(/\.html$/i, '') || 'unknown';
  } catch {
    return 'unknown';
  }
}

function uaShort() {
  try {
    const ua = navigator.userAgent || '';
    const browser = /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Other';
    const os = /Windows/.test(ua)
      ? 'Windows'
      : /Mac OS X|Macintosh/.test(ua)
        ? 'macOS'
        : /Android/.test(ua)
          ? 'Android'
          : /iPhone|iPad/.test(ua)
            ? 'iOS'
            : 'Other';
    return `${browser} / ${os}`;
  } catch {
    return '';
  }
}

initFeedbackChrome();
