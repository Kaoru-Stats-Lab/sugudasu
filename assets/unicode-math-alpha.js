/** Mathematical Alphanumeric Symbols — must use fromCodePoint (not fromCharCode). */

export const MATH_SRC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** @type {Record<string, [number, number, number|null]>} */
export const MATH_BANDS = {
  double: [0x1d538, 0x1d552, 0x1d7d8],
  script: [0x1d49c, 0x1d4b6, null],
  boldScript: [0x1d4d0, 0x1d4ea, null],
  fraktur: [0x1d504, 0x1d51e, null],
  boldFraktur: [0x1d56c, 0x1d586, null],
  mono: [0x1d670, 0x1d68a, 0x1d7f6],
  serifBold: [0x1d400, 0x1d41a, 0x1d7ce],
  serifItalic: [0x1d434, 0x1d44e, null],
  serifBoldItalic: [0x1d468, 0x1d482, null],
  sansBold: [0x1d5d4, 0x1d5ee, 0x1d7ec],
  sansBoldItalic: [0x1d63c, 0x1d656, null],
};

/**
 * Mathematical Alphanumeric の intentional holes → Letterlike Symbols 等。
 * 連続帯を単純加算すると未割当 CP になり □ になる（SNS / フォント変換）。
 * @type {Record<string, Record<string, number>>}
 */
export const MATH_HOLES = {
  serifItalic: { h: 0x210e },
  script: {
    e: 0x212f,
    g: 0x210a,
    o: 0x2134,
    B: 0x212c,
    E: 0x2130,
    F: 0x2131,
    H: 0x210b,
    I: 0x2110,
    L: 0x2112,
    M: 0x2133,
    R: 0x211b,
  },
  // Bold Script も同じ穴位置。Letterlike（非太字）が Unicode の代替。
  boldScript: {
    e: 0x212f,
    g: 0x210a,
    o: 0x2134,
    B: 0x212c,
    E: 0x2130,
    F: 0x2131,
    H: 0x210b,
    I: 0x2110,
    L: 0x2112,
    M: 0x2133,
    R: 0x211b,
  },
  double: {
    C: 0x2102,
    H: 0x210d,
    N: 0x2115,
    P: 0x2119,
    Q: 0x211a,
    R: 0x211d,
    Z: 0x2124,
  },
  fraktur: {
    C: 0x212d,
    H: 0x210c,
    I: 0x2111,
    R: 0x211c,
    Z: 0x2128,
  },
  boldFraktur: {
    C: 0x212d,
    H: 0x210c,
    I: 0x2111,
    R: 0x211c,
    Z: 0x2128,
  },
};

/** Negative Squared Latin（🅰–🆉）を a–z / A–Z に二重割当 + 数字は ASCII */
export function buildFilledSquaredDest() {
  const A = 0x1f170;
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(A + i)).join('');
  return letters + letters + '0123456789';
}

/**
 * @param {number} upper
 * @param {number} lower
 * @param {number|null} digit
 * @param {string} [styleKey]
 */
export function buildMathDest(upper, lower, digit, styleKey) {
  const holes = (styleKey && MATH_HOLES[styleKey]) || {};
  return [...MATH_SRC]
    .map((c) => {
      if (holes[c] != null) return String.fromCodePoint(holes[c]);
      const n = c.codePointAt(0);
      if (n >= 0x41 && n <= 0x5a) return String.fromCodePoint(upper + (n - 0x41));
      if (n >= 0x61 && n <= 0x7a) return String.fromCodePoint(lower + (n - 0x61));
      if (digit != null && n >= 0x30 && n <= 0x39) return String.fromCodePoint(digit + (n - 0x30));
      return c;
    })
    .join('');
}

export function mapMathAlpha(s, upperBase, lowerBase, digitBase, styleKey) {
  const holes = (styleKey && MATH_HOLES[styleKey]) || {};
  return [...s]
    .map((c) => {
      if (holes[c] != null) return String.fromCodePoint(holes[c]);
      const n = c.codePointAt(0);
      if (n >= 0x41 && n <= 0x5a) return String.fromCodePoint(upperBase + (n - 0x41));
      if (n >= 0x61 && n <= 0x7a) return String.fromCodePoint(lowerBase + (n - 0x61));
      if (digitBase != null && n >= 0x30 && n <= 0x39) return String.fromCodePoint(digitBase + (n - 0x30));
      return c;
    })
    .join('');
}

export function mapCircled(s) {
  return [...s]
    .map((c) => {
      const n = c.codePointAt(0);
      if (n >= 0x41 && n <= 0x5a) return String.fromCodePoint(0x24b6 + (n - 0x41));
      if (n >= 0x61 && n <= 0x7a) return String.fromCodePoint(0x24d0 + (n - 0x61));
      if (n >= 0x30 && n <= 0x39) {
        if (n === 0x30) return '\u24ea';
        return String.fromCodePoint(0x2460 + (n - 0x31));
      }
      return c;
    })
    .join('');
}

/** JSON の壊れた dest を実行時に正規化（穴埋め込み） */
export function repairMathStyleMap(key, map) {
  if (key === 'filledSquared') {
    return { src: MATH_SRC, dest: buildFilledSquaredDest() };
  }
  const bands = MATH_BANDS[key];
  if (!bands || !map?.src) return map;
  const [upper, lower, digit] = bands;
  return { src: map.src, dest: buildMathDest(upper, lower, digit, key) };
}

/** dest 先頭英字がハングル帯（U+AC00–U+D7AF）なら壊れている */
export function isCorruptMathDest(map) {
  if (!map?.dest) return false;
  const cp = map.dest[0]?.codePointAt(0);
  return cp != null && cp >= 0xac00 && cp <= 0xd7af;
}
