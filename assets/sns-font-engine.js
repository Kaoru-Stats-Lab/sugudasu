/**
 * SNS / フォント変換エンジン（ブラウザ完結）
 */

export const STYLE_BADGES = {
  double: '定番',
  script: 'やわらかめ',
  boldScript: '甘め',
  hane: '勢い',
  fraktur: 'クラシック',
  boldFraktur: '強め',
  mono: 'こなれ感',
  serifBold: '見やすい',
  serifItalic: '上品',
  serifBoldItalic: '華やか',
  sansBold: '今っぽい',
  sansBoldItalic: 'スタイリッシュ',
  squared: 'アクセント',
  filledSquared: '目立つ',
  circled: 'かわいめ',
  filledCircled: 'ポップ',
  cuteBlock: 'ゆるポップ',
  superscript: 'さりげない',
  upsideDown: '遊び心',
  smallCaps: 'おしゃれ',
  gal: '平成レトロ',
  small: 'ゆるかわ',
  hankaku: 'ミニマル',
};

export const JAPANESE_STYLE_KEYS = new Set(['gal', 'small', 'hankaku']);
export const FEATURED_COUNT = 3;
export const DEFAULT_PREVIEW = 'mio ୨୧ cafe time';

/** @param {string} str @param {Record<string,string>|{src:string,dest:string}} mapObj @param {{forceLowercase?:boolean}} [options] */
export function convertString(str, mapObj, options = {}) {
  const sourceText = options.forceLowercase
    ? str.replace(/[A-Z]/g, (c) => c.toLowerCase())
    : str;

  if (!mapObj.src) {
    let result = '';
    for (let i = 0; i < sourceText.length; i++) {
      const char = sourceText[i];
      result += mapObj[char] || char;
    }
    return result;
  }

  const destArray = [...mapObj.dest];
  let result = '';
  for (let i = 0; i < sourceText.length; i++) {
    const char = sourceText[i];
    const index = mapObj.src.indexOf(char);
    result += index !== -1 ? (destArray[index] || char) : char;
  }
  return result;
}

/** @param {string} text @param {{key:string,map:object,forceLowercase?:boolean}} style */
export function convertWithStyle(text, style) {
  return convertString(text, style.map, { forceLowercase: style.forceLowercase });
}

/** @param {Array<{key:string}>} styles @param {'all'|'featured'|'japanese'|'latin'} filter */
export function filterStyles(styles, filter) {
  if (filter === 'all') return styles;
  if (filter === 'featured') return styles.slice(0, FEATURED_COUNT);
  if (filter === 'japanese') return styles.filter((s) => JAPANESE_STYLE_KEYS.has(s.key));
  return styles.filter((s) => !JAPANESE_STYLE_KEYS.has(s.key));
}

let stylesCache = null;

export async function loadFontStyles() {
  if (stylesCache) return stylesCache;
  const res = await fetch('/data/font-styles.json');
  if (!res.ok) throw new Error('font-styles.json load failed');
  stylesCache = await res.json();
  return stylesCache;
}

export async function loadSymbolCatalog() {
  const res = await fetch('/data/font-symbols.json');
  if (!res.ok) throw new Error('font-symbols.json load failed');
  return res.json();
}

export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
