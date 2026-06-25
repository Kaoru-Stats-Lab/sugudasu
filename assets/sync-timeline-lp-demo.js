/**
 * Sync LP Hero — +5分連動ミニデモ（MOC）
 * prefers-reduced-motion 時は即時置換
 */
function parseHm(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatHm(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function bumpRow(el, baseHm, reduced) {
  const next = formatHm(baseHm + 5);
  if (reduced) {
    el.textContent = next;
    el.classList.add('text-emerald-700', 'font-semibold');
    return;
  }
  el.classList.add('transition-transform', 'duration-150');
  el.style.transform = 'translateX(4px)';
  requestAnimationFrame(() => {
    el.textContent = next;
    el.classList.add('text-emerald-700', 'font-semibold');
    el.style.transform = '';
  });
}

export function initSyncTimelineLpDemo() {
  const btn = document.getElementById('stlp-demo-plus5');
  const versionEls = document.querySelectorAll('[data-stlp-version]');
  if (!btn) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let played = false;

  btn.addEventListener('click', () => {
    if (played) return;
    played = true;
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');

    const groups = document.querySelectorAll('[data-stlp-demo-group]');
    groups.forEach((group) => {
      const rows = group.querySelectorAll('[data-stlp-time]');
      rows.forEach((row, i) => {
        const base = parseHm(row.dataset.stlpTime);
        const delay = reduced ? 0 : i * 180;
        setTimeout(() => bumpRow(row, base, reduced), delay);
      });
    });

    versionEls.forEach((el) => {
      const apply = () => {
        el.textContent = 'v12（最新）';
        el.classList.remove('text-slate-500');
        el.classList.add('text-violet-700', 'font-bold');
      };
      if (reduced) apply();
      else {
        el.style.transition = 'opacity 200ms';
        el.style.opacity = '0';
        setTimeout(() => {
          apply();
          el.style.opacity = '1';
        }, 360);
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSyncTimelineLpDemo());
} else {
  initSyncTimelineLpDemo();
}
