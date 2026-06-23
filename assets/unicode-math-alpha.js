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

/** @param {number} upper @param {number} lower @param {number|null} digit */
export function buildMathDest(upper, lower, digit) {
  return [...MATH_SRC]
    .map((c) => {
      const n = c.codePointAt(0);
      if (n >= 0x41 && n <= 0x5A) return String.fromCodePoint(upper + (n - 0x41));
      if (n >= 0x61 && n <= 0x7A) return String.fromCodePoint(lower + (n - 0x61));
      if (digit != null && n >= 0x30 && n <= 0x39) return String.fromCodePoint(digit + (n - 0x30));
      return c;
    })
    .join('');
}

export function mapMathAlpha(s, upperBase, lowerBase, digitBase) {
  return [...s]
    .map((c) => {
      const n = c.codePointAt(0);
      if (n >= 0x41 && n <= 0x5A) return String.fromCodePoint(upperBase + (n - 0x41));
      if (n >= 0x61 && n <= 0x7A) return String.fromCodePoint(lowerBase + (n - 0x61));
      if (digitBase != null && n >= 0x30 && n <= 0x39) return String.fromCodePoint(digitBase + (n - 0x30));
      return c;
    })
    .join('');
}

export function mapCircled(s) {
  return [...s].map((c) => {
    const n = c.codePointAt(0);
    if (n >= 0x41 && n <= 0x5A) return String.fromCodePoint(0x24b6 + (n - 0x41));
    if (n >= 0x61 && n <= 0x7A) return String.fromCodePoint(0x24d0 + (n - 0x61));
    if (n >= 0x30 && n <= 0x39) {
      if (n === 0x30) return '\u24ea';
      return String.fromCodePoint(0x2460 + (n - 0x31));
    }
    return c;
  }).join('');
}

/** JSON の壊れた dest（U+Dxxx ハングル）を実行時に正規化 */
export function repairMathStyleMap(key, map) {
  const bands = MATH_BANDS[key];
  if (!bands || !map?.src) return map;
  const [upper, lower, digit] = bands;
  return { src: map.src, dest: buildMathDest(upper, lower, digit) };
}

/** dest 先頭英字がハングル帯（U+AC00–U+D7AF）なら壊れている */
export function isCorruptMathDest(map) {
  if (!map?.dest) return false;
  const cp = map.dest[0]?.codePointAt(0);
  return cp != null && cp >= 0xac00 && cp <= 0xd7af;
}
