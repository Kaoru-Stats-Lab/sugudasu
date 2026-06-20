/**
 * SUGUDASU フォーム検証（EFO）— 必須フィールドのハイライト
 * SSOT: docs/DESIGN_GUIDELINE.md §3.4
 */

const ERROR_CLASS = 'sg-field--error';
const MSG_CLASS = 'sg-field-error-msg';

/**
 * @param {HTMLElement} fieldEl
 */
function ensureErrorEl(fieldEl) {
  const parent = fieldEl.parentElement;
  if (!parent) return null;
  let msg = parent.querySelector(`.${MSG_CLASS}`);
  if (!msg) {
    msg = document.createElement('p');
    msg.className = `${MSG_CLASS} hidden`;
    msg.setAttribute('role', 'alert');
    if (fieldEl.id) {
      msg.id = `${fieldEl.id}-error`;
      fieldEl.setAttribute('aria-describedby', msg.id);
    }
    fieldEl.insertAdjacentElement('afterend', msg);
  }
  return msg;
}

/**
 * @param {HTMLElement} fieldEl
 * @param {string} message
 */
export function setFieldError(fieldEl, message) {
  if (!fieldEl) return;
  fieldEl.classList.add(ERROR_CLASS);
  fieldEl.setAttribute('aria-invalid', 'true');
  const msg = ensureErrorEl(fieldEl);
  if (msg) {
    msg.textContent = message;
    msg.classList.remove('hidden');
  }
}

/**
 * @param {HTMLElement} fieldEl
 */
export function clearFieldError(fieldEl) {
  if (!fieldEl) return;
  fieldEl.classList.remove(ERROR_CLASS);
  fieldEl.setAttribute('aria-invalid', 'false');
  const parent = fieldEl.parentElement;
  const msg = parent?.querySelector(`.${MSG_CLASS}`);
  if (msg) {
    msg.textContent = '';
    msg.classList.add('hidden');
  }
}

/**
 * @param {HTMLElement | Document | null} [root]
 */
export function clearAllFieldErrors(root = document) {
  root.querySelectorAll(`.${ERROR_CLASS}`).forEach((el) => clearFieldError(el));
}

/**
 * @param {HTMLElement} fieldEl
 */
export function bindFieldErrorClear(fieldEl) {
  if (!fieldEl || fieldEl.dataset.sgFieldBound) return;
  fieldEl.dataset.sgFieldBound = '1';
  const handler = () => clearFieldError(fieldEl);
  fieldEl.addEventListener('input', handler);
  fieldEl.addEventListener('change', handler);
}

/**
 * @param {Array<{ el: HTMLElement | null, message: string, test?: (el: HTMLElement) => boolean }>} rules
 * @returns {boolean}
 */
export function validateFields(rules) {
  clearAllFieldErrors();
  /** @type {HTMLElement | null} */
  let firstFail = null;

  for (const rule of rules) {
    const el = rule.el;
    if (!el) continue;
    const ok = rule.test ? rule.test(el) : Boolean(String(el.value ?? '').trim());
    if (!ok) {
      setFieldError(el, rule.message);
      if (!firstFail) firstFail = el;
    }
  }

  if (firstFail) {
    firstFail.focus({ preventScroll: false });
    firstFail.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

if (typeof globalThis !== 'undefined') {
  globalThis.SG_FORM_VALIDATE = {
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    bindFieldErrorClear,
    validateFields,
  };
}
