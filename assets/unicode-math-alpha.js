/** Mathematical Alphanumeric Symbols — must use fromCodePoint (not fromCharCode). */

export function mapMathAlpha(s, upperBase, lowerBase, digitBase) {
  return [...s].map((c) => {
    const n = c.codePointAt(0);
    if (n >= 0x41 && n <= 0x5A) return String.fromCodePoint(upperBase + (n - 0x41));
    if (n >= 0x61 && n <= 0x7A) return String.fromCodePoint(lowerBase + (n - 0x61));
    if (digitBase != null && n >= 0x30 && n <= 0x39) return String.fromCodePoint(digitBase + (n - 0x30));
    return c;
  }).join('');
}

export function mapCircled(s) {
  return [...s].map((c) => {
    const n = c.codePointAt(0);
    if (n >= 0x41 && n <= 0x5A) return String.fromCodePoint(0x24B6 + (n - 0x41));
    if (n >= 0x61 && n <= 0x7A) return String.fromCodePoint(0x24D0 + (n - 0x61));
    if (n >= 0x30 && n <= 0x39) {
      if (n === 0x30) return '\u24EA';
      return String.fromCodePoint(0x2460 + (n - 0x31));
    }
    return c;
  }).join('');
}
