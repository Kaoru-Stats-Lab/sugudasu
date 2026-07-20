/**
 * 壊れ入力 — 固定プリセット（実行時ランダム禁止）
 * 表示（preview）とコピー（value）を分離する。
 * SSOT: docs/notes/BROKEN_INPUT_SPEC.md
 */

/** @typedef {{ id: string, label: string }} ChaosCategory */
/**
 * @typedef {{
 *   id: string,
 *   category: string,
 *   title: string,
 *   description: string,
 *   value: string,
 *   preview?: string,
 *   omitPreview?: boolean,
 * }} ChaosPreset
 */

/** @type {ChaosCategory[]} */
export const CATEGORIES = [
  { id: 'length', label: '長さ' },
  { id: 'i18n', label: '多言語' },
  { id: 'chars', label: '文字' },
  { id: 'marks', label: '記号・制御' },
];

/** @param {string} seed @param {number} n */
function repeatToLength(seed, n) {
  let out = '';
  while ([...out].length < n) out += seed;
  return [...out].slice(0, n).join('');
}

const LEN_100_EN = 'A'.repeat(100);
const LEN_100_JA = repeatToLength('あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほ', 100);
const LEN_1000 = 'A'.repeat(1000);
const LEN_10000 = 'A'.repeat(10000);

/** @type {ChaosPreset[]} */
export const PRESETS = [
  // —— 長さ（全文は画面に出さない） ——
  {
    id: 'len-100-en',
    category: 'length',
    title: '100文字（英字）',
    description: '上限付近の確認用',
    value: LEN_100_EN,
    omitPreview: true,
  },
  {
    id: 'len-100-ja',
    category: 'length',
    title: '100文字（日本語）',
    description: '全角幅の上限付近の確認用',
    value: LEN_100_JA,
    omitPreview: true,
  },
  {
    id: 'len-1000',
    category: 'length',
    title: '1000文字',
    description: '長文・折り返し崩れの確認用',
    value: LEN_1000,
    omitPreview: true,
  },
  {
    id: 'len-10000',
    category: 'length',
    title: '10000文字',
    description: '最大長確認用',
    value: LEN_10000,
    omitPreview: true,
  },

  // —— 多言語（説明は「何が壊れるか」＝確認ポイント） ——
  {
    id: 'i18n-ja',
    category: 'i18n',
    title: '日本語',
    description: '確認: 全角幅・全角スペース',
    value: '東京都渋谷区神宮前一丁目　テスト株式会社　山田太郎',
  },
  {
    id: 'i18n-en',
    category: 'i18n',
    title: '英語',
    description: '確認: 半角英数の基準表示',
    value: 'New York Test Street 12 ACME Corp John Smith',
  },
  {
    id: 'zh-cn',
    category: 'i18n',
    title: '中国語（簡体字）',
    description: '確認: 中国語フォント・文字幅',
    value: '中华人民共和国北京市朝阳区测试路88号 张伟',
  },
  {
    id: 'zh-tw',
    category: 'i18n',
    title: '中国語（繁体字）',
    description: '確認: 異体字・文字数の増加',
    value: '臺灣資訊系統測試臺北市信義區測試路88號 陳建宏',
  },
  {
    id: 'i18n-ko',
    category: 'i18n',
    title: '韓国語',
    description: '確認: ハングルの字形・幅',
    value: '서울특별시 강남구 테스트로 12 김민수',
  },
  {
    id: 'i18n-th',
    category: 'i18n',
    title: 'タイ語',
    description: '確認: 文字の上下配置・行間崩れ',
    value: 'กรุงเทพมหานคร ถนนทดสอบ บริษัท ทดสอบ จำกัด',
  },
  {
    id: 'i18n-ar',
    category: 'i18n',
    title: 'アラビア語',
    description: '確認: 右→左（RTL）と数字混在の整列',
    value: 'الرياض شارع الاختبار رقم 12 شركة اختبار',
  },
  {
    id: 'i18n-he',
    category: 'i18n',
    title: 'ヘブライ語',
    description: '確認: RTL（アラビア語と別字体）',
    value: 'תל אביב רחוב בדיקה מספר 12 חברת מבחן',
  },
  {
    id: 'i18n-hi',
    category: 'i18n',
    title: 'ヒンディー語',
    description: '確認: 結合文字・行の高さ',
    value: 'नई दिल्ली टेस्ट रोड 12 परीक्षण प्राइवेट लिमिटेड',
  },
  {
    id: 'i18n-vi',
    category: 'i18n',
    title: 'ベトナム語',
    description: '確認: 文字の高さ（ダイアクリティカル）',
    value: 'Tôi đang kiểm tra hệ thống nhập liệu',
  },
  {
    id: 'i18n-de-long',
    category: 'i18n',
    title: 'ドイツ語（長単語）',
    description: '確認: 横幅崩れ・word-break漏れ',
    value: 'Donaudampfschifffahrtsgesellschaftskapitän',
  },
  {
    id: 'i18n-ru',
    category: 'i18n',
    title: 'ロシア語',
    description: '確認: キリル文字のフォント・幅',
    value: 'Москва Тестовая улица 12 ООО Проверка',
  },

  // —— 文字 ——
  {
    id: 'emoji-single',
    category: 'chars',
    title: '絵文字',
    description: '確認: 見た目の文字数と内部の文字数の差',
    value: '😀🎉🚀',
  },
  {
    id: 'emoji-family',
    category: 'chars',
    title: '家族絵文字',
    description: '確認: 結合絵文字の文字数計算ズレ',
    value: '👨‍👩‍👧‍👦',
  },
  {
    id: 'chars-variant',
    category: 'chars',
    title: '異体字',
    description: '確認: 一般的な漢字と異なるUnicode',
    value: '𠮷田 髙橋 﨑山',
  },
  {
    id: 'chars-zwsp',
    category: 'chars',
    title: '見えない文字入り',
    description: '確認: 検索・一致判定のズレ（見た目は普通の氏名）',
    value: '山田\u200B太郎',
    preview: '山田太郎',
  },
  {
    id: 'chars-nfd-ja',
    category: 'chars',
    title: '分解文字（が）',
    description: '確認: 見た目は「が」、内部は「か」＋濁点',
    value: '\u304B\u3099',
    preview: 'が',
  },
  {
    id: 'chars-nfd-latin',
    category: 'chars',
    title: '分解文字（ラテン）',
    description: '確認: アクセント付きの分解形',
    value: 'a\u0301e\u0301o\u0301',
    preview: 'áéó',
  },

  // —— 記号・制御 ——
  {
    id: 'marks-newlines',
    category: 'marks',
    title: '改行入り',
    description: '確認: 1行欄への貼り付け・送信エラー',
    value: '一行目\n二行目\n三行目',
    preview: '一行目↵二行目↵三行目',
  },
  {
    id: 'marks-tabs',
    category: 'marks',
    title: 'タブ入り',
    description: '確認: CSV・表計算の列ズレ',
    value: '氏名\t部署\tメール',
    preview: '氏名⇥部署⇥メール',
  },
  {
    id: 'marks-html',
    category: 'marks',
    title: 'HTML記号',
    description: '確認: HTMLエスケープ・サニタイズ・表示処理',
    value: '<>&"\'`',
  },
  {
    id: 'marks-null',
    category: 'marks',
    title: 'NULL文字入り',
    description:
      '見えない制御文字を含みます。貼り付け先の反応を見る用です（ブラウザやOSが除去することもあります）',
    value: 'ABC\u0000DEF',
    preview: 'ABC…DEF',
  },
];

/**
 * @param {string} categoryId
 * @returns {ChaosPreset[]}
 */
export function presetsForCategory(categoryId) {
  return PRESETS.filter((p) => p.category === categoryId);
}

/** 表示用とコピー用が違う（見えない文字など） */
export function displayDiffersFromCopy(preset) {
  if (preset.omitPreview) return false;
  return preset.preview != null && preset.preview !== preset.value;
}

/**
 * UI 用プレビュー（preview 優先。長い value は全文を出さない）
 * @param {ChaosPreset} preset
 * @param {number} [maxChars]
 * @returns {string|null} null = プレビュー非表示
 */
export function previewText(preset, maxChars = 48) {
  if (preset.omitPreview) return null;
  if (preset.preview != null) return preset.preview;
  const chars = [...preset.value];
  if (chars.length <= maxChars) return preset.value;
  return `${chars.slice(0, maxChars).join('')}…（${chars.length}文字）`;
}
