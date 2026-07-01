/** Schedule Gantt PoC — parent/child color families (SUGUDASU palette) */

export const DEFAULT_PARENT_PALETTE = [
  { id: 'blue', label: '青', hex: '#2563EB' },
  { id: 'emerald', label: '緑', hex: '#059669' },
  { id: 'orange', label: '橙', hex: '#EA580C' },
  { id: 'violet', label: '紫', hex: '#7C3AED' },
  { id: 'rose', label: '赤', hex: '#E11D48' },
  { id: 'slate', label: '灰', hex: '#64748B' },
];

const HEX6 = /^#?([0-9a-f]{6})$/i;
const HEX8 = /^#?([0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i;

export function parseColor(input) {
  if (input == null || input === '') return null;
  const raw = String(input).trim().toLowerCase();
  if (raw === 'transparent' || raw === 'none') {
    return { r: 255, g: 255, b: 255, a: 0, css: 'transparent' };
  }
  const m8 = HEX8.exec(raw);
  if (m8) {
    const h = m8[1];
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return rgbObj(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a);
  }
  const m6 = HEX6.exec(raw.startsWith('#') ? raw : `#${raw}`);
  if (m6) {
    const h = m6[1];
    return rgbObj(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1);
  }
  const mr = RGB.exec(raw);
  if (mr) {
    const a = mr[4] != null ? Number(mr[4]) : 1;
    return rgbObj(Number(mr[1]), Number(mr[2]), Number(mr[3]), a);
  }
  return null;
}

function rgbObj(r, g, b, a) {
  const css = a <= 0 ? 'transparent' : a < 1 ? `rgba(${r},${g},${b},${a})` : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return { r, g, b, a, css };
}

function toHex(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

export function isTransparent(color) {
  const p = typeof color === 'string' ? parseColor(color) : color;
  return !p || p.a <= 0;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
  h /= 360;
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

/** Child bars: same hue as parent, progressively lighter */
export function childColorFromParent(parentHex, childIndex, childOverride) {
  if (childOverride) {
    const parsed = parseColor(childOverride);
    if (parsed) return parsed.css;
  }
  const base = parseColor(parentHex);
  if (!base || base.a <= 0) return 'transparent';
  const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
  const step = 0.07;
  const nextL = Math.min(0.88, l + step * (childIndex + 1));
  const nextS = Math.max(0.35, s * (1 - childIndex * 0.04));
  const { r, g, b } = hslToRgb(h, nextS, nextL);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function strokeForBar(fillCss) {
  if (isTransparent(fillCss)) return '#94A3B8';
  const p = parseColor(fillCss);
  if (!p) return '#64748B';
  const { h, s, l } = rgbToHsl(p.r, p.g, p.b);
  const { r, g, b } = hslToRgb(h, s, Math.max(0.15, l - 0.22));
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
