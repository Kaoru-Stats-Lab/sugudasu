/**
 * SNS / フォント変換エンジン（ブラウザ完結）
 */
import { MATH_BANDS, buildMathDest, isCorruptMathDest } from './unicode-math-alpha.js';

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
  hiraganaDecor: 'ひらがな',
};

export const JAPANESE_STYLE_KEYS = new Set(['gal', 'small', 'hankaku', 'hiraganaDecor']);
export const FEATURED_COUNT = 3;

/** 空欄プレビュー・font-converter デフォルト */
export const DEFAULT_PREVIEW = 'minimal / archive';

/** /sns 初期値（1行目＝名前、2行目＝キャッチ） */
export const SNS_DEFAULT_LINES = ['MY ROOM', 'SLOW COFFEE, SLOW LIFE.'];
export const SNS_DEFAULT_TEXT = SNS_DEFAULT_LINES.join('\n');

/** ワンタップサンプル（バイオ・見出し・ワンワード） */
export const SAMPLE_TEXTS = [
  { label: 'Bio', text: 'MY ROOM / MY LIFE' },
  { label: 'Cafe', text: 'SLOW COFFEE, SLOW LIFE.' },
  { label: 'minimal', text: 'minimal / neutral / edit' },
  { label: 'archive', text: 'tokyo / 2026 / archive' },
  { label: 'Insight', text: "TODAY'S INSIGHT" },
  { label: 'Memo', text: 'CREATIVE MEMO' },
  { label: 'Weekend', text: 'Weekend Log' },
  { label: 'Collection', text: 'New Collection' },
  { label: 'ANCHOR', text: 'A N C H O R' },
  { label: 'find', text: 'f i n d .' },
  { label: 'blank', text: 'b l a n k' },
  { label: 'SEED', text: 'S E E D' },
];

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

function normalizeFontStyles(styles) {
  return styles.map((style) => {
    const bands = MATH_BANDS[style.key];
    if (!bands || !style.map?.src) return style;
    if (!isCorruptMathDest(style.map)) return style;
    const [upper, lower, digit] = bands;
    return {
      ...style,
      map: { src: style.map.src, dest: buildMathDest(upper, lower, digit) },
    };
  });
}

export async function loadHiraganaDecor() {
  const res = await fetch('/data/hiragana-decor.json');
  if (!res.ok) throw new Error('hiragana-decor.json load failed');
  return res.json();
}

export async function loadFontStyles() {
  if (stylesCache) return stylesCache;
  const [styles, hira] = await Promise.all([
    fetch('/data/font-styles.json').then((r) => {
      if (!r.ok) throw new Error('font-styles.json load failed');
      return r.json();
    }),
    loadHiraganaDecor(),
  ]);
  stylesCache = normalizeFontStyles([
    ...styles,
    { name: hira.name, key: hira.key, map: hira.map },
  ]);
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
