/**
 * SUGUDASU mode segment — sliding pill · hints · preview pulse
 * docs/DESIGN_GUIDELINE.md §3.3
 */
(function (global) {
  function syncPill(segmentEl) {
    if (!segmentEl) return;
    const pill = segmentEl.querySelector('.sg-segment__pill');
    const active = segmentEl.querySelector('.sg-segment__btn[aria-selected="true"]');
    if (!pill || !active) return;
    pill.style.left = `${active.offsetLeft}px`;
    pill.style.top = `${active.offsetTop}px`;
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.height = `${active.offsetHeight}px`;
    pill.style.transform = 'none';
  }

  function updateHint(hintEl, html) {
    if (!hintEl || hintEl.innerHTML === html) return;
    if (global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hintEl.innerHTML = html;
      return;
    }
    hintEl.classList.add('is-fading');
    global.setTimeout(() => {
      hintEl.innerHTML = html;
      hintEl.classList.remove('is-fading');
    }, 150);
  }

  function pulsePreview(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el || global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('is-updating');
    global.setTimeout(() => el.classList.remove('is-updating'), 220);
  }

  function applyModeClass(segmentEl, modeClassMap, value) {
    if (!segmentEl || !modeClassMap) return;
    Object.values(modeClassMap).forEach((cls) => segmentEl.classList.remove(cls));
    if (modeClassMap[value]) segmentEl.classList.add(modeClassMap[value]);
  }

  function setAriaSelected(segmentEl, value) {
    segmentEl.querySelectorAll('.sg-segment__btn').forEach((btn) => {
      const v = btn.getAttribute('data-segment-value');
      btn.setAttribute('aria-selected', v === value ? 'true' : 'false');
    });
  }

  /**
   * @param {object} config
   * @param {string} config.segmentId
   * @param {string[]} config.order
   * @param {string} [config.initial]
   * @param {(value: string) => void} [config.onChange]
   * @param {string} [config.hintId]
   * @param {Record<string, string>} [config.hints]
   * @param {Record<string, string>} [config.modeClassMap]
   * @param {string} [config.previewSelector]
   */
  function mount(config) {
    const segment = document.getElementById(config.segmentId);
    if (!segment) return null;

    const hintEl = config.hintId ? document.getElementById(config.hintId) : null;
    let current = config.initial || config.order[0];

    function select(value, options) {
      const silent = options && options.silent;
      if (!config.order.includes(value) || value === current) {
        if (value === current) syncPill(segment);
        return;
      }
      current = value;
      setAriaSelected(segment, value);
      applyModeClass(segment, config.modeClassMap, value);
      syncPill(segment);
      if (config.hints && hintEl && config.hints[value]) {
        updateHint(hintEl, config.hints[value]);
      }
      if (config.previewSelector) pulsePreview(config.previewSelector);
      if (!silent && config.onChange) config.onChange(value);
    }

    segment.querySelectorAll('.sg-segment__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-segment-value');
        if (v) select(v);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const idx = config.order.indexOf(current);
        const next = e.key === 'ArrowRight'
          ? config.order[(idx + 1) % config.order.length]
          : config.order[(idx + config.order.length - 1) % config.order.length];
        select(next);
        segment.querySelector(`[data-segment-value="${next}"]`)?.focus();
      });
    });

    const onResize = () => syncPill(segment);
    global.addEventListener('resize', onResize);

    setAriaSelected(segment, current);
    applyModeClass(segment, config.modeClassMap, current);
    if (config.hints && hintEl && config.hints[current]) {
      hintEl.innerHTML = config.hints[current];
    }
    global.requestAnimationFrame(() => syncPill(segment));

    return {
      select,
      syncPill: () => syncPill(segment),
      getValue: () => current,
    };
  }

  global.SUGUDASU_SEGMENT = {
    mount,
    syncPill,
    updateHint,
    pulsePreview,
  };
})(window);
