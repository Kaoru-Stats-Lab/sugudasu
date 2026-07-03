/**
 * テスト用ダミーデータ生成 — 純関数（非送信 · T10）
 * SSOT: docs/notes/TEST_DATA_TOOL_SPEC.md
 */

export const CHUNK_MAX = 5000;
/** @deprecated 互換 alias — 1チャンク上限 */
export const MAX_ROWS = CHUNK_MAX;
export const DOMAIN_MAX_EMPLOYEE = 250_000;
export const ROW_RNG_SALT = 1_000_003;
export const COUNT_OPTIONS = [100, 500, 5000];
export const BULK_EMPLOYEE_OPTIONS = [25_000, 100_000, 250_000];
/** 社員マスタの件数セグメント（COUNT + BULK） */
export const EMPLOYEE_COUNT_OPTIONS = [...COUNT_OPTIONS, ...BULK_EMPLOYEE_OPTIONS];

/** @typedef {'slash'|'dash'|'compact'} DateFormatStyle */

/** @typedef {'employee'|'payroll'|'customer'|'transaction'} DataPreset */

/** @typedef {{ preset: DataPreset, count: number, seed: number, startIndex?: number, idPrefix: string, emailDomain: string, mineRate: number, referenceYear?: number, hireYearMin?: number, hireYearMax?: number, exportHeaders?: string[], birthDateFormat?: DateFormatStyle, hireDateFormat?: DateFormatStyle, quoteZipInCsv?: boolean, roundSalaryTo1000?: boolean, includeForeignNames?: boolean, spaceInDiverseNames?: boolean, payrollMonthlyVariation?: boolean }} GenerateOptions */

export const PRESET_META = {
  employee: {
    label: '社員マスタ',
    description: '氏名 · フリガナ · 給与 · 住所。給与SaaS・労務システムのインポート検証向け。',
  },
  payroll: {
    label: '給与明細',
    description: '社員番号に紐づく3ヶ月分。件数＝社員数（出力行数は×3）。',
  },
  customer: {
    label: '顧客マスタ',
    description: '氏名 · 住所 · 口座番号風 · メール。画面・マニュアル向け（金融風）。',
  },
  transaction: {
    label: '取引明細',
    description: '入出金 · 金額 · 摘要（個人通帳風デモ · 摘要と入出金は整合）。一覧・集計の確認向け。',
  },
};

/** 社員マスタ — 日本語ヘッダー（給与SaaSインポート想定） */
export const EMPLOYEE_HEADERS = [
  '社員番号',
  '氏名',
  'フリガナ',
  '性別',
  '生年月日',
  '入社年月日',
  '雇用形態',
  '基本給',
  '通勤手当',
  '扶養人数',
  '郵便番号',
  '住所',
  'メールアドレス',
];

/**
 * 社員マスタ列名テンプレート（完全互換保証ではない · 手直し前提）
 * @type {Record<string, Record<string, string>>}
 */
export const EMPLOYEE_HEADER_TEMPLATES = {
  default: {},
  jugyoin: {
    社員番号: '従業員番号',
    フリガナ: 'フリガナ（全角）',
    メールアドレス: 'メールアドレス1',
  },
  kyuyo_saas: {
    社員番号: '従業員番号',
    氏名: '氏名',
    フリガナ: 'フリガナ（全角カタカナ）',
    基本給: '基本給（月額）',
    通勤手当: '通勤手当（月額）',
    扶養人数: '扶養親族等の数',
    メールアドレス: 'メール',
  },
};

export const EMPLOYEE_HEADER_TEMPLATE_LABELS = {
  default: 'SUGUDASU標準',
  jugyoin: '従業員番号表記',
  kyuyo_saas: '給与SaaS寄り',
};

/** 給与明細 — 社員マスタと社員番号で連動 */
export const PAYROLL_HEADERS = [
  '給与明細ID',
  '社員番号',
  '支給年月',
  '基本給',
  '通勤手当',
  '残業時間',
  '残業代',
  '支給合計',
  '源泉徴収税額',
  '雇用形態',
];

export const PAYROLL_MONTHS_PER_EMPLOYEE = 3;

export const DATE_FORMAT_LABELS = {
  slash: 'YYYY/MM/DD',
  dash: 'YYYY-MM-DD',
  compact: 'YYYYMMDD',
};

/** 生年月日・入社日を同時に揃えるUIプリセット用 */
export const DATE_FORMAT_PRESETS = [
  { id: 'slash', label: '両方スラッシュ' },
  { id: 'dash', label: '両方ハイフン' },
  { id: 'compact', label: '両方コンパクト' },
];

/**
 * 郵便番号 · 都道府県 · 市区町村 · 市外局番 — 整合マスタ
 * [zip, pref, city, telPref]
 */
const ADDRESS_SEEDS = [
  ['100-0005', '東京都', '千代田区丸の内', '03'],
  ['100-0011', '東京都', '千代田区内幸町', '03'],
  ['102-0082', '東京都', '千代田区一番町', '03'],
  ['104-0061', '東京都', '中央区銀座', '03'],
  ['105-0001', '東京都', '港区虎ノ門', '03'],
  ['150-0001', '東京都', '渋谷区神宮前', '03'],
  ['150-0043', '東京都', '渋谷区道玄坂', '03'],
  ['160-0022', '東京都', '新宿区新宿', '03'],
  ['170-0013', '東京都', '豊島区東池袋', '03'],
  ['180-0004', '東京都', '武蔵野市吉祥寺本町', '0422'],
  ['220-0011', '神奈川県', '横浜市西区高島', '045'],
  ['231-0023', '神奈川県', '横浜市中区山下町', '045'],
  ['251-0055', '神奈川県', '藤沢市南藤沢', '0466'],
  ['260-0015', '千葉県', '千葉市中央区富士見', '043'],
  ['330-0063', '埼玉県', 'さいたま市浦和区高砂', '048'],
  ['530-0001', '大阪府', '大阪市北区梅田', '06'],
  ['542-0081', '大阪府', '大阪市中央区南船場', '06'],
  ['550-0014', '大阪府', '大阪市西区北堀江', '06'],
  ['564-0051', '大阪府', '吹田市豊津町', '06'],
  ['460-0008', '愛知県', '名古屋市中区栄', '052'],
  ['450-0002', '愛知県', '名古屋市中村区名駅', '052'],
  ['420-0858', '静岡県', '静岡市葵区紺屋町', '054'],
  ['422-8067', '静岡県', '静岡市駿河区南町', '054'],
  ['600-8216', '京都府', '京都市下京区烏丸通', '075'],
  ['604-8152', '京都府', '京都市中京区寺町通', '075'],
  ['650-0021', '兵庫県', '神戸市中央区三宮町', '078'],
  ['730-0011', '広島県', '広島市中区基町', '082'],
  ['700-0827', '岡山県', '岡山市北区本町', '086'],
  ['760-0019', '香川県', '高松市サンポート', '087'],
  ['810-0001', '福岡県', '福岡市中央区天神', '092'],
  ['812-0011', '福岡県', '福岡市博多区博多駅前', '092'],
  ['980-0811', '宮城県', '仙台市青葉区一番町', '022'],
  ['060-0001', '北海道', '札幌市中央区北一条西', '011'],
  ['010-0001', '秋田県', '秋田市中通', '018'],
  ['950-0088', '新潟県', '新潟市中央区万代', '025'],
  ['380-0823', '長野県', '長野市南千歳', '026'],
  ['321-0964', '栃木県', '宇都宮市今泉', '028'],
  ['890-0053', '鹿児島県', '鹿児島市中央町', '099'],
  ['900-0015', '沖縄県', '那覇市久茂地', '098'],
  ['980-0021', '宮城県', '仙台市青葉区中央', '022'],
  ['260-0028', '千葉県', '千葉市中央区新町', '043'],
  ['810-0041', '福岡県', '福岡市中央区大名', '092'],
  ['920-0961', '石川県', '金沢市本町', '076'],
  ['030-0801', '青森県', '青森市新町', '017'],
  ['020-0022', '岩手県', '盛岡市内丸', '019'],
  ['990-0042', '山形県', '山形市七日町', '023'],
  ['963-8002', '福島県', '郡山市虎丸町', '024'],
  ['310-0015', '茨城県', '水戸市宮町', '029'],
  ['371-0024', '群馬県', '前橋市本町', '027'],
  ['400-0031', '山梨県', '甲府市丸の内', '055'],
  ['520-0043', '滋賀県', '大津市中央', '077'],
  ['630-8115', '奈良県', '奈良市法蓮町', '0742'],
  ['640-8331', '和歌山県', '和歌山市美園', '073'],
  ['680-0831', '鳥取県', '鳥取市永楽温泉町', '0857'],
  ['690-0003', '島根県', '松江市朝日町', '0852'],
  ['730-0051', '広島県', '広島市中区大手町', '082'],
  ['770-0831', '徳島県', '徳島市南常三島町', '088'],
  ['780-0870', '高知県', '高知市本町', '088'],
  ['860-0845', '熊本県', '熊本市中央区上通町', '096'],
  ['870-0021', '大分県', '大分市府内町', '097'],
  ['880-0805', '宮崎県', '宮崎市橘通東', '0985'],
  ['900-0032', '沖縄県', '那覇市松山', '098'],
];

/** @type {{ zip: string, pref: string, city: string, telPref: string }[]} */
export const ADDRESS_MASTER = ADDRESS_SEEDS.map(([zip, pref, city, telPref]) => ({
  zip,
  pref,
  city,
  telPref,
}));

/** { name, weight } — 出現確率の重み */
export const SURNAME_WEIGHTED = [
  { name: '佐藤', weight: 14 },
  { name: '鈴木', weight: 12 },
  { name: '高橋', weight: 10 },
  { name: '田中', weight: 9 },
  { name: '伊藤', weight: 8 },
  { name: '渡辺', weight: 7 },
  { name: '山本', weight: 6 },
  { name: '中村', weight: 5 },
  { name: '小林', weight: 5 },
  { name: '加藤', weight: 4 },
  { name: '吉田', weight: 4 },
  { name: '山田', weight: 4 },
  { name: '佐々木', weight: 3 },
  { name: '山口', weight: 3 },
  { name: '松本', weight: 3 },
  { name: '井上', weight: 3 },
  { name: '木村', weight: 2 },
  { name: '林', weight: 2 },
  { name: '斎藤', weight: 2 },
  { name: '清水', weight: 2 },
  { name: '森', weight: 1 },
  { name: '池田', weight: 1 },
  { name: '橋本', weight: 1 },
  { name: '阿部', weight: 1 },
  { name: '石川', weight: 1 },
  { name: '山下', weight: 1 },
  { name: '中島', weight: 1 },
  { name: '石井', weight: 1 },
  { name: '小川', weight: 1 },
  { name: '前田', weight: 1 },
];

export const SURNAME_KANA = {
  佐藤: 'サトウ',
  鈴木: 'スズキ',
  高橋: 'タカハシ',
  田中: 'タナカ',
  伊藤: 'イトウ',
  渡辺: 'ワタナベ',
  山本: 'ヤマモト',
  中村: 'ナカムラ',
  小林: 'コバヤシ',
  加藤: 'カトウ',
  吉田: 'ヨシダ',
  山田: 'ヤマダ',
  佐々木: 'ササキ',
  山口: 'ヤマグチ',
  松本: 'マツモト',
  井上: 'イノウエ',
  木村: 'キムラ',
  林: 'ハヤシ',
  斎藤: 'サイトウ',
  清水: 'シミズ',
  森: 'モリ',
  池田: 'イケダ',
  橋本: 'ハシモト',
  阿部: 'アベ',
  石川: 'イシカワ',
  山下: 'ヤマシタ',
  中島: 'ナカジマ',
  石井: 'イシイ',
  小川: 'オガワ',
  前田: 'マエダ',
};

export const SURNAME_ROMAJI = {
  佐藤: 'sato',
  鈴木: 'suzuki',
  高橋: 'takahashi',
  田中: 'tanaka',
  伊藤: 'ito',
  渡辺: 'watanabe',
  山本: 'yamamoto',
  中村: 'nakamura',
  小林: 'kobayashi',
  加藤: 'kato',
  吉田: 'yoshida',
  山田: 'yamada',
  佐々木: 'sasaki',
  山口: 'yamaguchi',
  松本: 'matsumoto',
  井上: 'inoue',
  木村: 'kimura',
  林: 'hayashi',
  斎藤: 'saito',
  清水: 'shimizu',
  森: 'mori',
  池田: 'ikeda',
  橋本: 'hashimoto',
  阿部: 'abe',
  石川: 'ishikawa',
  山下: 'yamashita',
  中島: 'nakajima',
  石井: 'ishii',
  小川: 'ogawa',
  前田: 'maeda',
};

export const GIVEN_NAMES = {
  male: ['太郎', '健一', '翔太', '大輔', '誠', '拓也', '亮', '直樹', '悠斗', '和也'],
  female: ['花子', '美咲', '陽子', '恵', '真由美', '彩', '結衣', 'さくら', '愛', '優子'],
};

export const GIVEN_KANA = {
  male: ['タロウ', 'ケンイチ', 'ショウタ', 'ダイスケ', 'マコト', 'タクヤ', 'リョウ', 'ナオキ', 'ユウト', 'カズヤ'],
  female: ['ハナコ', 'ミサキ', 'ヨウコ', 'メグミ', 'マユミ', 'アヤ', 'ユイ', 'サクラ', 'アイ', 'ユウコ'],
};

export const GIVEN_ROMAJI = {
  male: ['taro', 'kenichi', 'shota', 'daisuke', 'makoto', 'takuya', 'ryo', 'naoki', 'yuto', 'kazuya'],
  female: ['hanako', 'misaki', 'yoko', 'megumi', 'mayumi', 'aya', 'yui', 'sakura', 'ai', 'yuko'],
};

/** @type {{ label: string, weight: number, salaryMin: number, salaryMax: number, silver?: boolean }[]} */
export const EMPLOYMENT_TYPES = [
  { label: '正社員', weight: 48, salaryMin: 250000, salaryMax: 650000 },
  { label: '契約社員', weight: 18, salaryMin: 200000, salaryMax: 450000 },
  { label: 'パート', weight: 18, salaryMin: 180000, salaryMax: 280000 },
  { label: '派遣スタッフ', weight: 9, salaryMin: 180000, salaryMax: 320000 },
  { label: '再雇用', weight: 7, salaryMin: 120000, salaryMax: 220000, silver: true },
];

/** 生年の帯域（再雇用以外の一般分布） */
export const BIRTH_YEAR_BANDS = [
  { min: 1948, max: 1964, weight: 4 },
  { min: 1965, max: 1979, weight: 26 },
  { min: 1980, max: 1994, weight: 40 },
  { min: 1995, max: 2005, weight: 30 },
];

/** ブラウザの現在年（テストでは options.referenceYear で上書き） */
export function getDefaultReferenceYear() {
  return new Date().getFullYear();
}

export const DEPENDENT_WEIGHTS = [
  { n: 0, weight: 35 },
  { n: 1, weight: 30 },
  { n: 2, weight: 20 },
  { n: 3, weight: 10 },
  { n: 4, weight: 5 },
];

/**
 * 在留外国人数の国籍構成 + 日本国籍ハイブリッド風氏名（帰化・二世等の表記ゆらぎ）。
 * 在留統計は会社員専用ではない — テストデータの「少し反映」用。
 */
export const FOREIGN_REGION_WEIGHTS = [
  { region: 'hybrid_jp', weight: 35 },
  { region: 'china', weight: 18 },
  { region: 'vietnam', weight: 13 },
  { region: 'korea', weight: 8 },
  { region: 'philippines', weight: 7 },
  { region: 'nepal', weight: 6 },
  { region: 'indonesia', weight: 5 },
  { region: 'other', weight: 8 },
];

/** 社員マスタ行の約4%を外国籍風・ハイブリッド風氏名にする */
export const FOREIGN_EMPLOYEE_RATE = 0.04;

/** @type {Record<string, { surnames: { kanji: string, kana: string, romaji: string }[], givens: { kanji: string, kana: string, romaji: string, female: boolean }[] }>} */
const FOREIGN_HAN_PROFILES = {
  china: {
    surnames: [
      { kanji: '王', kana: 'オウ', romaji: 'wang' },
      { kanji: '李', kana: 'リ', romaji: 'li' },
      { kanji: '張', kana: 'チョウ', romaji: 'zhang' },
      { kanji: '劉', kana: 'リュウ', romaji: 'liu' },
    ],
    givens: [
      { kanji: '偉', kana: 'イ', romaji: 'wei', female: false },
      { kanji: '芳', kana: 'ホウ', romaji: 'fang', female: true },
      { kanji: '明', kana: 'メイ', romaji: 'ming', female: false },
      { kanji: '静', kana: 'セイ', romaji: 'jing', female: true },
    ],
  },
  korea: {
    surnames: [
      { kanji: '金', kana: 'キン', romaji: 'kim' },
      { kanji: '朴', kana: 'パク', romaji: 'park' },
      { kanji: '崔', kana: 'チェ', romaji: 'choi' },
    ],
    givens: [
      { kanji: '民洙', kana: 'ミンス', romaji: 'minsoo', female: false },
      { kanji: '智媛', kana: 'ジウォン', romaji: 'jiwon', female: true },
      { kanji: '浩', kana: 'ホ', romaji: 'ho', female: false },
    ],
  },
};

/** @type {{ region: string, display: string, kana: string, romaji: string, female: boolean }[]} */
const FOREIGN_KATAKANA_NAMES = [
  { region: 'vietnam', display: 'グエン・ヴァン・トゥアン', kana: 'グエンヴァントゥアン', romaji: 'nguyen_van_tuan', female: false },
  { region: 'vietnam', display: 'チャン・ティ・フォン', kana: 'チャンティフォン', romaji: 'tran_thi_phong', female: true },
  { region: 'vietnam', display: 'ファム・ミン・ドゥック', kana: 'ファムミンドゥック', romaji: 'pham_minh_duc', female: false },
  { region: 'philippines', display: 'マリア・サントス', kana: 'マリアサントス', romaji: 'maria_santos', female: true },
  { region: 'philippines', display: 'ジョセ・レイエス', kana: 'ジョセレイエス', romaji: 'jose_reyes', female: false },
  { region: 'nepal', display: 'ラジュ・タパ', kana: 'ラジュタパ', romaji: 'raju_thapa', female: false },
  { region: 'nepal', display: 'スニタ・グルン', kana: 'スニタグルン', romaji: 'sunita_gurung', female: true },
  { region: 'indonesia', display: 'ブディ・サントソ', kana: 'ブディサントソ', romaji: 'budi_santoso', female: false },
  { region: 'indonesia', display: 'スリ・ワヒュ', kana: 'スリワヒュ', romaji: 'sri_wahyu', female: true },
  { region: 'other', display: 'ミャン・スー・チー', kana: 'ミャンスーチー', romaji: 'myint_su_chi', female: false },
  { region: 'other', display: 'アン・ペレイラ', kana: 'アンペレイラ', romaji: 'ann_pereira', female: true },
  { region: 'other', display: 'ジョン・ミラー', kana: 'ジョンミラー', romaji: 'john_miller', female: false },
];

/** 日本国籍・ハイブリッド風氏名（例: 小久保玲央ブライアン · 望月 ヘンリー海輝） */
const HYBRID_JP_SURNAMES = [
  { kanji: '小久保', kana: 'コクボ', romaji: 'kokubo' },
  { kanji: '長田', kana: 'オサダ', romaji: 'osada' },
  { kanji: '望月', kana: 'モチヅキ', romaji: 'mochizuki' },
  { kanji: '木村', kana: 'キムラ', romaji: 'kimura' },
  { kanji: '田中', kana: 'タナカ', romaji: 'tanaka' },
  { kanji: '山本', kana: 'ヤマモト', romaji: 'yamamoto' },
];

const HYBRID_KANJI_GIVENS = [
  { kanji: '玲央', kana: 'レイオウ', romaji: 'reo', female: false },
  { kanji: '澪', kana: 'ミオ', romaji: 'mio', female: true },
  { kanji: '海輝', kana: 'カイキ', romaji: 'kaiki', female: false },
  { kanji: '陽翔', kana: 'ハルト', romaji: 'haruto', female: false },
  { kanji: '結衣', kana: 'ユイ', romaji: 'yui', female: true },
  { kanji: '健太', kana: 'ケンタ', romaji: 'kenta', female: false },
  { kanji: '美月', kana: 'ミヅキ', romaji: 'mizuki', female: true },
];

const HYBRID_WESTERN_SUFFIXES = [
  { kanji: 'ブライアン', kana: 'ブライアン', romaji: 'brian', female: false },
  { kanji: 'マイケル', kana: 'マイケル', romaji: 'michael', female: false },
  { kanji: 'エミリー', kana: 'エミリー', romaji: 'emily', female: true },
  { kanji: 'ジェームズ', kana: 'ジェームズ', romaji: 'james', female: false },
  { kanji: 'ソフィア', kana: 'ソフィア', romaji: 'sophia', female: true },
  { kanji: 'ダニエル', kana: 'ダニエル', romaji: 'daniel', female: false },
];

const HYBRID_LOAN_PARTS = [
  { kanji: 'ハウスバック', kana: 'ハウスバック', romaji: 'houseback' },
  { kanji: 'グリーン', kana: 'グリーン', romaji: 'green' },
  { kanji: 'ローズ', kana: 'ローズ', romaji: 'rose' },
];

const HYBRID_KATAKANA_MIDDLE = [
  { kanji: 'ヘンリー', kana: 'ヘンリー', romaji: 'henry' },
  { kanji: 'ジョン', kana: 'ジョン', romaji: 'john' },
  { kanji: 'メアリー', kana: 'メアリー', romaji: 'mary' },
  { kanji: 'デビッド', kana: 'デビッド', romaji: 'david' },
];

const HYBRID_JP_PATTERN_WEIGHTS = [
  { pattern: 'suffix', weight: 50 },
  { pattern: 'spaced', weight: 35 },
  { pattern: 'loan', weight: 15 },
];

/**
 * 日本国籍のハイブリッド風氏名（日系姓 + 洋名カタカナ等）。
 * @param {() => number} rng
 */
export function pickHybridJapaneseIdentity(rng) {
  const pattern = weightedPick(rng, HYBRID_JP_PATTERN_WEIGHTS, 'pattern');
  const female = rng() < 0.45;
  const surname =
    rng() < 0.55
      ? HYBRID_JP_SURNAMES[randInt(rng, 0, HYBRID_JP_SURNAMES.length - 1)]
      : (() => {
          const sn = weightedPick(rng, SURNAME_WEIGHTED, 'name');
          return { kanji: sn, kana: SURNAME_KANA[sn] || sn, romaji: SURNAME_ROMAJI[sn] || 'user' };
        })();
  const givenPool = HYBRID_KANJI_GIVENS.filter((g) => g.female === female);
  const given = givenPool[randInt(rng, 0, givenPool.length - 1)];

  if (pattern === 'suffix') {
    const westPool = HYBRID_WESTERN_SUFFIXES.filter((w) => w.female === female);
    const west = westPool[randInt(rng, 0, westPool.length - 1)];
    return {
      kanji: `${surname.kanji}${given.kanji}${west.kanji}`,
      kana: `${surname.kana}${given.kana}${west.kana}`,
      romaji: `${surname.romaji}_${given.romaji}_${west.romaji}`,
      gender: female ? '女性' : '男性',
      surnamePart: surname.kanji,
    };
  }
  if (pattern === 'spaced') {
    const mid = HYBRID_KATAKANA_MIDDLE[randInt(rng, 0, HYBRID_KATAKANA_MIDDLE.length - 1)];
    return {
      kanji: `${surname.kanji} ${mid.kanji}${given.kanji}`,
      kana: `${surname.kana}${mid.kana}${given.kana}`,
      romaji: `${surname.romaji}_${mid.romaji}_${given.romaji}`,
      gender: female ? '女性' : '男性',
      surnamePart: surname.kanji,
    };
  }
  const loan = HYBRID_LOAN_PARTS[randInt(rng, 0, HYBRID_LOAN_PARTS.length - 1)];
  return {
    kanji: `${surname.kanji}${given.kanji}${loan.kanji}`,
    kana: `${surname.kana}${given.kana}${loan.kana}`,
    romaji: `${surname.romaji}_${given.romaji}_${loan.romaji}`,
    gender: female ? '女性' : '男性',
    surnamePart: surname.kanji,
  };
}

/**
 * 多様な氏名のSaaSインポート向け表示（姓と名の間に半角スペース · 中黒→スペース）。
 * @param {string} kanji
 * @param {string|null|undefined} surnamePart
 * @param {boolean} [enabled=true]
 */
export function formatDiverseDisplayName(kanji, surnamePart, enabled = true) {
  if (!enabled) return kanji;
  if (kanji.includes('・')) return kanji.replace(/・/g, ' ');
  if (kanji.includes(' ')) return kanji;
  if (surnamePart && kanji.startsWith(surnamePart) && kanji.length > surnamePart.length) {
    return `${surnamePart} ${kanji.slice(surnamePart.length)}`;
  }
  return kanji;
}

/**
 * @param {() => number} rng
 */
export function pickForeignEmployeeIdentity(rng) {
  const region = weightedPick(rng, FOREIGN_REGION_WEIGHTS, 'region');
  if (region === 'hybrid_jp') {
    return pickHybridJapaneseIdentity(rng);
  }
  const han = FOREIGN_HAN_PROFILES[region];
  if (han) {
    const sn = han.surnames[randInt(rng, 0, han.surnames.length - 1)];
    const female = rng() < 0.45;
    const pool = han.givens.filter((g) => g.female === female);
    const gn = pool[randInt(rng, 0, pool.length - 1)];
    return {
      kanji: `${sn.kanji}${gn.kanji}`,
      kana: `${sn.kana}${gn.kana}`,
      romaji: `${sn.romaji}_${gn.romaji}`,
      gender: female ? '女性' : '男性',
      surnamePart: sn.kanji,
    };
  }
  const pool = FOREIGN_KATAKANA_NAMES.filter((n) => n.region === region);
  const names = pool.length > 0 ? pool : FOREIGN_KATAKANA_NAMES;
  const entry = names[randInt(rng, 0, names.length - 1)];
  return {
    kanji: entry.display,
    kana: entry.kana,
    romaji: entry.romaji,
    gender: entry.female ? '女性' : '男性',
    surnamePart: null,
  };
}

const MINE_NAMES = ['𠮷田', '髙橋', '轟', '南　太郎'];

export const STATUSES = ['有効', '有効', '有効', '休止', '解約申請中', '要確認'];

/**
 * 取引明細 — 入出金と摘要のペア（個人通帳風デモ · §6.7.2）
 * @type {{ type: '入金'|'出金', description: string, amountMin: number, amountMax: number, weight?: number }[]}
 */
export const TXN_PATTERNS = [
  { type: '入金', description: '給与振込', amountMin: 180_000, amountMax: 450_000, weight: 3 },
  { type: '入金', description: '還付金', amountMin: 1_000, amountMax: 80_000, weight: 1 },
  { type: '入金', description: '年金受取', amountMin: 50_000, amountMax: 120_000, weight: 1 },
  { type: '入金', description: '利息', amountMin: 10, amountMax: 3_000, weight: 1 },
  { type: '出金', description: '家賃引落', amountMin: 55_000, amountMax: 130_000, weight: 2 },
  { type: '出金', description: '公共料金', amountMin: 3_000, amountMax: 25_000, weight: 2 },
  { type: '出金', description: 'カード利用', amountMin: 500, amountMax: 85_000, weight: 3 },
  { type: '出金', description: 'ATM出金', amountMin: 10_000, amountMax: 100_000, weight: 1 },
  { type: '出金', description: '振込手数料', amountMin: 110, amountMax: 880, weight: 1 },
  { type: '出金', description: '保険料', amountMin: 5_000, amountMax: 35_000, weight: 1 },
];

/** @deprecated TXN_PATTERNS を正本 */
export const TXN_TYPES = TXN_PATTERNS.map((p) => p.type);

/** @deprecated TXN_PATTERNS を正本 */
export const TXN_DESCRIPTIONS = TXN_PATTERNS.map((p) => p.description);

const MINE_EMAILS = ['test..double@example.com', 'a@', 'toolonglocalpart'.repeat(3) + '@example.com'];

/** 全角カタカナ → 半角カタカナ（地雷用 · 主要文字のみ） */
const KATAKANA_HALF_MAP = {
  ア: 'ｱ', イ: 'ｲ', ウ: 'ｳ', エ: 'ｴ', オ: 'ｵ',
  カ: 'ｶ', キ: 'ｷ', ク: 'ｸ', ケ: 'ｹ', コ: 'ｺ',
  サ: 'ｻ', シ: 'ｼ', ス: 'ｽ', セ: 'ｾ', ソ: 'ｿ',
  タ: 'ﾀ', チ: 'ﾁ', ツ: 'ﾂ', テ: 'ﾃ', ト: 'ﾄ',
  ナ: 'ﾅ', ニ: 'ﾆ', ヌ: 'ﾇ', ネ: 'ﾈ', ノ: 'ﾉ',
  ハ: 'ﾊ', ヒ: 'ﾋ', フ: 'ﾌ', ヘ: 'ﾍ', ホ: 'ﾎ',
  マ: 'ﾏ', ミ: 'ﾐ', ム: 'ﾑ', メ: 'ﾒ', モ: 'ﾓ',
  ヤ: 'ﾔ', ユ: 'ﾕ', ヨ: 'ﾖ',
  ラ: 'ﾗ', リ: 'ﾘ', ル: 'ﾙ', レ: 'ﾚ', ロ: 'ﾛ',
  ワ: 'ﾜ', ヲ: 'ｦ', ン: 'ﾝ',
  ガ: 'ｶﾞ', ギ: 'ｷﾞ', グ: 'ｸﾞ', ゲ: 'ｹﾞ', ゴ: 'ｺﾞ',
  ザ: 'ｻﾞ', ジ: 'ｼﾞ', ズ: 'ｽﾞ', ゼ: 'ｾﾞ', ゾ: 'ｿﾞ',
  ダ: 'ﾀﾞ', ヂ: 'ﾁﾞ', ヅ: 'ﾂﾞ', デ: 'ﾃﾞ', ド: 'ﾄﾞ',
  バ: 'ﾊﾞ', ビ: 'ﾋﾞ', ブ: 'ﾌﾞ', ベ: 'ﾍﾞ', ボ: 'ﾎﾞ',
  パ: 'ﾊﾟ', ピ: 'ﾋﾟ', プ: 'ﾌﾟ', ペ: 'ﾍﾟ', ポ: 'ﾎﾟ',
  ァ: 'ｧ', ィ: 'ｨ', ゥ: 'ｩ', ェ: 'ｪ', ォ: 'ｫ',
  ャ: 'ｬ', ュ: 'ｭ', ョ: 'ｮ', ッ: 'ｯ', ー: 'ｰ',
};

/**
 * Mulberry32 — シード固定で再現可能
 * @param {number} seed
 */
export function createSeededRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {number} seed
 * @param {number} rowIndex 1-based employee index
 */
export function createEmployeeRowRng(seed, rowIndex) {
  return createSeededRng((seed + rowIndex * ROW_RNG_SALT) >>> 0);
}

/**
 * @param {number} count
 * @param {number} seed
 * @param {{ referenceYear?: number, hireYearMin?: number, hireYearMax?: number, preset?: DataPreset, startIndex?: number }} [yearOpts]
 */
export function validateGenerateOptions(count, seed, yearOpts = {}) {
  const preset = yearOpts.preset ?? 'employee';
  const startIndex = yearOpts.startIndex ?? 1;
  const rowCount = preset === 'payroll' ? count * PAYROLL_MONTHS_PER_EMPLOYEE : count;
  if (!Number.isFinite(count) || count < 1) {
    return { ok: false, message: '件数は 1 以上で指定してください。' };
  }
  if (!Number.isFinite(startIndex) || startIndex < 1 || startIndex % 1 !== 0) {
    return { ok: false, message: '開始番号は 1 以上の整数で指定してください。' };
  }
  if (preset === 'employee' && startIndex + count - 1 > DOMAIN_MAX_EMPLOYEE) {
    return {
      ok: false,
      message: `社員番号は ${DOMAIN_MAX_EMPLOYEE.toLocaleString()} までです（開始 ${startIndex.toLocaleString()} + ${count.toLocaleString()} 件）。`,
    };
  }
  if (preset === 'payroll' && count > Math.floor(MAX_ROWS / PAYROLL_MONTHS_PER_EMPLOYEE)) {
    return {
      ok: false,
      message: `給与明細は社員数×${PAYROLL_MONTHS_PER_EMPLOYEE}ヶ月です。社員数は ${Math.floor(MAX_ROWS / PAYROLL_MONTHS_PER_EMPLOYEE).toLocaleString()} 以下にしてください。`,
    };
  }
  if (rowCount > MAX_ROWS) {
    return { ok: false, message: `件数は 1〜${MAX_ROWS.toLocaleString()} 行相当です。` };
  }
  if (!Number.isFinite(seed)) {
    return { ok: false, message: 'シード値は数値で指定してください。' };
  }
  const referenceYear = yearOpts.referenceYear ?? getDefaultReferenceYear();
  const hireYearMin = yearOpts.hireYearMin ?? 2000;
  const hireYearMax = yearOpts.hireYearMax ?? referenceYear;
  if (!Number.isFinite(referenceYear) || referenceYear < 1980 || referenceYear > 2100) {
    return { ok: false, message: '基準年は 1980〜2100 の範囲で指定してください。' };
  }
  if (!Number.isFinite(hireYearMin) || !Number.isFinite(hireYearMax)) {
    return { ok: false, message: '入社年の範囲は数値で指定してください。' };
  }
  if (hireYearMin > hireYearMax) {
    return { ok: false, message: '入社開始年は入社上限年以下にしてください。' };
  }
  if (hireYearMax > referenceYear) {
    return { ok: false, message: `入社上限年は基準年（${referenceYear}）以下にしてください。` };
  }
  return { ok: true };
}

/**
 * @param {number} totalCount
 * @param {number} seed
 * @param {{ referenceYear?: number, hireYearMin?: number, hireYearMax?: number }} [yearOpts]
 */
export function validateBulkEmployeeOptions(totalCount, seed, yearOpts = {}) {
  if (!Number.isFinite(totalCount) || totalCount < 1) {
    return { ok: false, message: '件数は 1 以上で指定してください。' };
  }
  if (totalCount > DOMAIN_MAX_EMPLOYEE) {
    return {
      ok: false,
      message: `社員マスタの一括出力は最大 ${DOMAIN_MAX_EMPLOYEE.toLocaleString()} 件です。`,
    };
  }
  return validateGenerateOptions(
    Math.min(totalCount, CHUNK_MAX),
    seed,
    { ...yearOpts, preset: 'employee', startIndex: 1 },
  );
}

/**
 * @param {GenerateOptions} options
 */
export function resolveEmployeeYearOptions(options) {
  const referenceYear = options.referenceYear ?? getDefaultReferenceYear();
  const hireYearMin = options.hireYearMin ?? 2000;
  const hireYearMax = options.hireYearMax ?? referenceYear;
  return { referenceYear, hireYearMin, hireYearMax };
}

/**
 * @param {string} value
 */
export function escapeCsvField(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {string} value
 */
export function escapeCsvFieldQuoted(value) {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * @param {string|number} value
 * @param {boolean} [forceQuote]
 */
export function formatCsvCell(value, forceQuote = false) {
  if (forceQuote) return escapeCsvFieldQuoted(value);
  return escapeCsvField(value);
}

/**
 * @param {number} n
 */
export function roundTo1000(n) {
  return Math.round(n / 1000) * 1000;
}

/**
 * @param {DataPreset} preset
 * @param {boolean} quoteZipInCsv
 */
export function resolveCsvQuoteKeys(preset, quoteZipInCsv) {
  if (!quoteZipInCsv) return [];
  if (preset === 'employee') return ['郵便番号'];
  if (preset === 'customer') return ['zip'];
  return [];
}

/**
 * @param {string[]} headers
 * @param {Record<string, string|number>[]} rows
 * @param {string[]} [quoteKeys]
 */
export function rowsToCsv(headers, rows, quoteKeys = []) {
  const quoteSet = new Set(quoteKeys);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => formatCsvCell(row[h], quoteSet.has(h))).join(','));
  }
  return lines.join('\r\n');
}

/**
 * 内部キーと出力ヘッダーを分離してCSV化
 * @param {string[]} internalHeaders
 * @param {string[]} exportHeaders
 * @param {Record<string, string|number>[]} rows
 * @param {string[]} [quoteKeys]
 */
export function rowsToCsvWithExportHeaders(internalHeaders, exportHeaders, rows, quoteKeys = []) {
  const quoteSet = new Set(quoteKeys);
  const lines = [exportHeaders.join(',')];
  for (const row of rows) {
    lines.push(internalHeaders.map((k) => formatCsvCell(row[k], quoteSet.has(k))).join(','));
  }
  return lines.join('\r\n');
}

/**
 * @param {DataPreset} preset
 */
export function getInternalHeaders(preset) {
  if (preset === 'employee') return [...EMPLOYEE_HEADERS];
  if (preset === 'payroll') return [...PAYROLL_HEADERS];
  if (preset === 'customer') {
    return [
      'customer_id',
      'name_kanji',
      'name_kana',
      'birth_date',
      'zip',
      'address',
      'phone',
      'email',
      'account_no',
      'status',
    ];
  }
  return ['txn_id', 'customer_id', 'txn_date', 'txn_type', 'amount', 'description'];
}

/**
 * @param {string[]} internalHeaders
 * @param {string[]|undefined} exportHeaders
 */
export function resolveExportHeaders(internalHeaders, exportHeaders) {
  if (!exportHeaders || exportHeaders.length === 0) {
    return [...internalHeaders];
  }
  if (exportHeaders.length !== internalHeaders.length) {
    throw new Error(`列名は ${internalHeaders.length} 列必要です（現在 ${exportHeaders.length} 列）。`);
  }
  return exportHeaders.map((label, i) => {
    const trimmed = String(label ?? '').trim();
    return trimmed || internalHeaders[i];
  });
}

/**
 * @param {string[]} internalHeaders
 * @param {string} templateId
 */
export function applyEmployeeHeaderTemplate(internalHeaders, templateId) {
  const map = EMPLOYEE_HEADER_TEMPLATES[templateId] || {};
  return internalHeaders.map((key) => map[key] ?? key);
}

/**
 * @param {string[]} internalHeaders
 * @param {Record<string, string|number>[]} rows
 * @param {string[]|undefined} exportHeaders
 * @param {string[]} [quoteKeys]
 */
function packageDataset(internalHeaders, rows, exportHeaders, quoteKeys = []) {
  const headers = resolveExportHeaders(internalHeaders, exportHeaders);
  const csv = rowsToCsvWithExportHeaders(internalHeaders, headers, rows, quoteKeys);
  return { headers, internalHeaders, rows, csv };
}

/**
 * @param {string} csv
 */
export function csvWithBom(csv) {
  return `\uFEFF${csv}`;
}

/**
 * @param {() => number} rng
 * @param {{ name?: string, label?: string, weight: number, n?: number }[]} items
 * @param {'name'|'label'|'n'} key
 */
function weightedPick(rng, items, key = 'name') {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item[key];
  }
  const last = items[items.length - 1];
  return last[key];
}

/**
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 */
function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * @param {() => number} rng
 */
function pickTxnPattern(rng) {
  const total = TXN_PATTERNS.reduce((s, p) => s + (p.weight ?? 1), 0);
  let r = rng() * total;
  for (const p of TXN_PATTERNS) {
    r -= p.weight ?? 1;
    if (r <= 0) return p;
  }
  return TXN_PATTERNS[TXN_PATTERNS.length - 1];
}

/**
 * @param {() => number} rng
 */
function pickAddress(rng) {
  return ADDRESS_MASTER[randInt(rng, 0, ADDRESS_MASTER.length - 1)];
}

/**
 * @param {() => number} rng
 * @param {number} telPref
 */
function formatPhone(rng, telPref) {
  const a = String(randInt(rng, 1000, 9999));
  const b = String(randInt(rng, 1000, 9999));
  return `${telPref}-${a}-${b}`;
}

/**
 * @param {() => number} rng
 * @param {number} minYear
 * @param {number} maxYear
 */
function pickYmd(rng, minYear, maxYear) {
  const year = randInt(rng, minYear, maxYear);
  const month = randInt(rng, 1, 12);
  const day = randInt(rng, 1, 28);
  return { year, month, day };
}

/**
 * @param {{ year: number, month: number, day: number }} ymd
 * @param {'slash'|'dash'|'compact'} style
 */
function formatYmd(ymd, style) {
  const m = String(ymd.month).padStart(2, '0');
  const d = String(ymd.day).padStart(2, '0');
  if (style === 'slash') return `${ymd.year}/${m}/${d}`;
  if (style === 'compact') return `${ymd.year}${m}${d}`;
  return `${ymd.year}-${m}-${d}`;
}

/**
 * @param {() => number} rng
 */
function formatBirthDate(rng) {
  return formatYmd(pickYmd(rng, 1955, 2005), 'dash');
}

/**
 * @param {() => number} rng
 * @param {boolean} silverBias 再雇用など高齢層向け
 */
function pickEmployeeBirthYmd(rng, silverBias = false) {
  if (silverBias) {
    return pickYmd(rng, 1948, 1964);
  }
  const band = weightedPickBand(rng, BIRTH_YEAR_BANDS);
  return pickYmd(rng, band.min, band.max);
}

/**
 * @param {() => number} rng
 * @param {{ min: number, max: number, weight: number }[]} bands
 */
function weightedPickBand(rng, bands) {
  const total = bands.reduce((s, b) => s + b.weight, 0);
  let r = rng() * total;
  for (const band of bands) {
    r -= band.weight;
    if (r <= 0) return band;
  }
  return bands[bands.length - 1];
}

/**
 * @param {() => number} rng
 * @param {{ year: number, month: number, day: number }} birth
 * @param {{ hireYearMin: number, hireYearMax: number, silver: boolean }} opts
 * @param {DateFormatStyle} [dateFormat]
 */
function formatHireDate(rng, birth, opts, dateFormat = 'dash') {
  const { hireYearMin, hireYearMax, silver } = opts;
  const minAge = silver ? 60 : 18;
  const minYear = Math.max(hireYearMin, birth.year + minAge);
  const maxYear = hireYearMax;
  if (minYear > maxYear) {
    return formatYmd(pickYmd(rng, maxYear, maxYear), dateFormat);
  }
  const year = randInt(rng, minYear, maxYear);
  const month = randInt(rng, 1, 12);
  const day = randInt(rng, 1, 28);
  return formatYmd({ year, month, day }, dateFormat);
}

/**
 * @param {number} referenceYear
 */
function payrollYearMonths(referenceYear) {
  return [1, 2, 3].map((m) => `${referenceYear}-${String(m).padStart(2, '0')}`);
}

/**
 * @param {object} opts
 * @param {number} opts.count
 * @param {number} opts.startIndex
 * @param {number} opts.seed
 * @param {string} opts.idPrefix
 * @param {string} opts.emailDomain
 * @param {number} opts.mineRate
 * @param {number} opts.hireYearMin
 * @param {number} opts.hireYearMax
 * @param {DateFormatStyle} opts.birthDateFormat
 * @param {DateFormatStyle} opts.hireDateFormat
 * @param {boolean} opts.roundSalaryTo1000
 * @param {boolean} opts.includeForeignNames
 * @param {boolean} opts.spaceInDiverseNames
 */
function generateEmployeeRows(opts) {
  const {
    count,
    startIndex = 1,
    seed,
    idPrefix,
    emailDomain,
    mineRate,
    hireYearMin,
    hireYearMax,
    birthDateFormat = 'slash',
    hireDateFormat = 'dash',
    roundSalaryTo1000 = true,
    includeForeignNames = true,
    spaceInDiverseNames = true,
  } = opts;
  const rows = [];
  const endIndex = startIndex + count - 1;
  for (let i = startIndex; i <= endIndex; i += 1) {
    const rng = createEmployeeRowRng(seed, i);
    const addr = pickAddress(rng);
    const useForeign = includeForeignNames && rng() < FOREIGN_EMPLOYEE_RATE;
    let genderLabel;
    let nameKanji;
    let furigana;
    let romajiBase;
    if (useForeign) {
      const foreign = pickForeignEmployeeIdentity(rng);
      nameKanji = formatDiverseDisplayName(foreign.kanji, foreign.surnamePart, spaceInDiverseNames);
      furigana = foreign.kana;
      romajiBase = foreign.romaji;
      genderLabel = foreign.gender;
    } else {
      const female = rng() < 0.45;
      const genderKey = female ? 'female' : 'male';
      genderLabel = female ? '女性' : '男性';
      const surname = weightedPick(rng, SURNAME_WEIGHTED, 'name');
      const surnameKana = SURNAME_KANA[surname] || surname;
      const surnameRomaji = SURNAME_ROMAJI[surname] || 'user';
      const gi = randInt(rng, 0, GIVEN_NAMES[genderKey].length - 1);
      nameKanji = `${surname}${GIVEN_NAMES[genderKey][gi]}`;
      furigana = `${surnameKana}${GIVEN_KANA[genderKey][gi]}`;
      romajiBase = `${surnameRomaji}_${GIVEN_ROMAJI[genderKey][gi]}`;
    }
    const employmentLabel = weightedPick(rng, EMPLOYMENT_TYPES, 'label');
    const employment = EMPLOYMENT_TYPES.find((e) => e.label === employmentLabel);
    const isSilver = Boolean(employment?.silver);
    const salaryMin = employment?.salaryMin ?? 180000;
    const salaryMax = employment?.salaryMax ?? 650000;
    let baseSalary = randInt(rng, salaryMin, salaryMax);
    let commute = rng() < 0.7 ? randInt(rng, 5000, 30000) : 0;
    if (roundSalaryTo1000) {
      baseSalary = roundTo1000(baseSalary);
      commute = roundTo1000(commute);
    }
    const dependents = weightedPick(rng, DEPENDENT_WEIGHTS, 'n');
    const birthYmd = pickEmployeeBirthYmd(rng, isSilver);
    const street = `${randInt(rng, 1, 30)}-${randInt(rng, 1, 20)}-${randInt(rng, 1, 15)}`;
    /** @type {Record<string, string|number>} */
    const row = {
      社員番号: formatEmployeeId(idPrefix, i),
      氏名: nameKanji,
      フリガナ: furigana,
      性別: genderLabel,
      生年月日: formatYmd(birthYmd, birthDateFormat),
      入社年月日: formatHireDate(
        rng,
        birthYmd,
        { hireYearMin, hireYearMax, silver: isSilver },
        hireDateFormat,
      ),
      雇用形態: employment?.label ?? '正社員',
      基本給: String(baseSalary),
      通勤手当: String(commute),
      扶養人数: String(dependents),
      郵便番号: addr.zip,
      住所: `${addr.pref}${addr.city}${street}`,
      メールアドレス: formatEmployeeEmail(romajiBase, i, emailDomain),
    };
    rows.push(row);
  }
  return rows;
}

/**
 * @param {Record<string, string|number>[]} employeeRows
 * @param {number} referenceYear
 * @param {number} seed
 * @param {{ payrollMonthlyVariation?: boolean, roundSalaryTo1000?: boolean }} [opts]
 */
function generatePayrollRows(employeeRows, referenceYear, seed, opts = {}) {
  const { payrollMonthlyVariation = true, roundSalaryTo1000 = true } = opts;
  const payRng = createSeededRng(seed + 800_001);
  const months = payrollYearMonths(referenceYear);
  const rows = [];
  let lineNo = 1;
  for (const emp of employeeRows) {
    const base = Number.parseInt(String(emp['基本給']), 10) || 0;
    const commute = Number.parseInt(String(emp['通勤手当']), 10) || 0;
    for (let mi = 0; mi < months.length; mi += 1) {
      const ym = months[mi];
      let overtimeHours = 0;
      if (payrollMonthlyVariation) {
        const roll = payRng();
        if (mi === 1 && roll < 0.55) overtimeHours = randInt(payRng, 5, 30);
        else if (mi === 2 && roll < 0.45) overtimeHours = randInt(payRng, 0, 20);
        else if (mi === 0 && roll < 0.15) overtimeHours = randInt(payRng, 1, 10);
      }
      const hourlyBase = Math.max(1000, roundSalaryTo1000 ? roundTo1000(base / 160) : Math.round(base / 160));
      let overtimePay = overtimeHours > 0 ? Math.round(overtimeHours * hourlyBase * 1.25) : 0;
      if (roundSalaryTo1000) overtimePay = roundTo1000(overtimePay);
      const gross = base + commute + overtimePay;
      let withholding = 0;
      if (payrollMonthlyVariation && gross > 0) {
        const taxRate = 0.05 + payRng() * 0.1;
        withholding = roundSalaryTo1000 ? roundTo1000(gross * taxRate) : Math.round(gross * taxRate);
      }
      rows.push({
        給与明細ID: `PAY-${String(lineNo).padStart(6, '0')}`,
        社員番号: emp['社員番号'],
        支給年月: ym,
        基本給: String(base),
        通勤手当: String(commute),
        残業時間: String(overtimeHours),
        残業代: String(overtimePay),
        支給合計: String(gross),
        源泉徴収税額: String(withholding),
        雇用形態: emp['雇用形態'],
      });
      lineNo += 1;
    }
  }
  return rows;
}

/**
 * @param {() => number} rng
 * @param {string} prefix
 * @param {number} index
 */
function formatCustomerId(prefix, index) {
  const clean = (prefix || 'CUST').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12) || 'CUST';
  return `${clean}-${String(index).padStart(5, '0')}`;
}

/**
 * @param {string} prefix
 * @param {number} index
 */
function formatEmployeeId(prefix, index) {
  const clean = (prefix || 'EMP-2026').trim().replace(/\s+/g, '').slice(0, 16) || 'EMP-2026';
  return `${clean}-${String(index).padStart(4, '0')}`;
}

/**
 * @param {() => number} rng
 */
function formatAccountNo(rng) {
  const branch = String(randInt(rng, 100, 999));
  const body = String(randInt(rng, 1000000, 9999999));
  return `${branch}-${body}`;
}

/**
 * @param {string} domain
 * @param {number} index
 */
function formatEmail(domain, index) {
  const d = (domain || 'test.example.co.jp').replace(/^@/, '').trim() || 'test.example.co.jp';
  return `user${String(index).padStart(4, '0')}@${d}`;
}

/**
 * @param {string} romajiBase surname_given 形式のローカル部プレフィックス
 * @param {number} index
 * @param {string} domain
 */
function formatEmployeeEmail(romajiBase, index, domain) {
  const d = (domain || 'example.com').replace(/^@/, '').trim() || 'example.com';
  const local = `${romajiBase}_${String(index).padStart(3, '0')}`;
  return `${local}@${d}`;
}

/**
 * @param {string} katakana
 */
function toHalfWidthKatakana(katakana) {
  return String(katakana)
    .split('')
    .map((ch) => KATAKANA_HALF_MAP[ch] || ch)
    .join('');
}

/**
 * @param {Record<string, string|number>[]} rows
 * @param {number} seed
 * @param {number} mineRate
 * @param {DataPreset} preset
 */
function applyMinesToRows(rows, seed, mineRate, preset, startIndex = 1) {
  if (!mineRate || mineRate <= 0) return rows;
  for (let j = 0; j < rows.length; j += 1) {
    const employeeIndex = startIndex + j;
    const mineRng = createSeededRng((seed + 900_001 + employeeIndex * 17) >>> 0);
    if (mineRng() < mineRate) applyMineRow(rows[j], mineRng, preset);
  }
  return rows;
}

/**
 * @param {() => number} rng
 * @param {number} mineRate 0–1
 * @deprecated 主乱数と分離済み。applyMinesToRows を使用。
 */
function shouldMine(rng, mineRate) {
  return mineRate > 0 && rng() < mineRate;
}

/**
 * @param {Record<string, string|number>} row
 * @param {() => number} rng
 * @param {DataPreset} preset
 */
function applyMineRow(row, rng, preset) {
  if (preset === 'employee') {
    const kind = randInt(rng, 0, 6);
    if (kind === 0) {
      row['氏名'] = MINE_NAMES[randInt(rng, 0, MINE_NAMES.length - 1)];
      row['フリガナ'] = 'ミナヨウデータ';
    } else if (kind === 1) {
      row['フリガナ'] = toHalfWidthKatakana(String(row['フリガナ']));
    } else if (kind === 2) {
      row['郵便番号'] = String(row['郵便番号']).replace(/-/g, '');
    } else if (kind === 3) {
      row['住所'] = `${row['住所']}〜第10ビル1001号室の隣の突き当たりまでお越しください`;
    } else if (kind === 4) {
      row['メールアドレス'] = MINE_EMAILS[randInt(rng, 0, MINE_EMAILS.length - 1)];
    } else if (kind === 5) {
      row['生年月日'] = String(row['生年月日']).replace(/\//g, '').replace(/-/g, '');
    } else {
      row['入社年月日'] = String(row['入社年月日']).replace(/-/g, '/');
    }
    return row;
  }

  const kind = randInt(rng, 0, 3);
  if (preset === 'customer') {
    if (kind === 0) {
      row.name_kanji = MINE_NAMES[randInt(rng, 0, MINE_NAMES.length - 1)];
      row.name_kana = 'ミナヨウデータ';
    } else if (kind === 1) {
      row.address = `${row.address}〜ビル10階1001号室の隣の突き当たりの部屋までお越しください`;
    } else if (kind === 2) {
      row.email = MINE_EMAILS[randInt(rng, 0, MINE_EMAILS.length - 1)];
    } else {
      row.name_kanji = 'あ'.repeat(40);
    }
  } else if (kind === 0) {
    row.description = `${row.description}／${'超長摘要テスト'.repeat(8)}`;
  } else if (kind === 1) {
    row.amount = String(randInt(rng, 999999999, 9999999999));
  } else {
    row.txn_type = '不明区分';
  }
  return row;
}

/**
 * @param {GenerateOptions} options
 * @returns {{ headers: string[], internalHeaders: string[], rows: Record<string, string|number>[], csv: string }}
 */
export function generateDataset(options) {
  const yearOpts = resolveEmployeeYearOptions(options);
  const {
    preset,
    count,
    seed,
    idPrefix = preset === 'employee' || preset === 'payroll' ? `EMP-${yearOpts.referenceYear}` : 'CUST',
    emailDomain = 'test.example.co.jp',
    mineRate = 0,
    exportHeaders,
    birthDateFormat = 'slash',
    hireDateFormat = 'dash',
    quoteZipInCsv = true,
    roundSalaryTo1000 = true,
    includeForeignNames = true,
    spaceInDiverseNames = true,
    payrollMonthlyVariation = true,
  } = options;

  const check = validateGenerateOptions(count, seed, { ...yearOpts, preset, startIndex: options.startIndex ?? 1 });
  if (!check.ok) throw new Error(check.message);

  const startIndex = options.startIndex ?? 1;
  const rng = createSeededRng(seed);
  const quoteKeys = resolveCsvQuoteKeys(preset, quoteZipInCsv);

  if (preset === 'employee') {
    const rows = generateEmployeeRows({
      count,
      startIndex,
      seed,
      idPrefix,
      emailDomain,
      mineRate: 0,
      hireYearMin: yearOpts.hireYearMin,
      hireYearMax: yearOpts.hireYearMax,
      birthDateFormat,
      hireDateFormat,
      roundSalaryTo1000,
      includeForeignNames,
      spaceInDiverseNames,
    });
    applyMinesToRows(rows, seed, mineRate, 'employee', startIndex);
    return packageDataset(EMPLOYEE_HEADERS, rows, exportHeaders, quoteKeys);
  }

  if (preset === 'payroll') {
    const employeeRows = generateEmployeeRows({
      count,
      startIndex,
      seed,
      idPrefix,
      emailDomain,
      mineRate: 0,
      hireYearMin: yearOpts.hireYearMin,
      hireYearMax: yearOpts.hireYearMax,
      birthDateFormat,
      hireDateFormat,
      roundSalaryTo1000,
      includeForeignNames,
      spaceInDiverseNames,
    });
    const rows = generatePayrollRows(employeeRows, yearOpts.referenceYear, seed, {
      payrollMonthlyVariation,
      roundSalaryTo1000,
    });
    return packageDataset(PAYROLL_HEADERS, rows, exportHeaders, quoteKeys);
  }

  const rows = [];

  if (preset === 'customer') {
    const internalHeaders = getInternalHeaders('customer');
    for (let i = 1; i <= count; i += 1) {
      const addr = pickAddress(rng);
      const female = rng() < 0.45;
      const gender = female ? 'female' : 'male';
      const surname = weightedPick(rng, SURNAME_WEIGHTED, 'name');
      const surnameKana = SURNAME_KANA[surname] || surname;
      const gi = randInt(rng, 0, GIVEN_NAMES[gender].length - 1);
      const street = `${randInt(rng, 1, 30)}-${randInt(rng, 1, 20)}-${randInt(rng, 1, 15)}`;
      /** @type {Record<string, string|number>} */
      const row = {
        customer_id: formatCustomerId(idPrefix, i),
        name_kanji: `${surname}${GIVEN_NAMES[gender][gi]}`,
        name_kana: `${surnameKana}${GIVEN_KANA[gender][gi]}`,
        birth_date: formatBirthDate(rng),
        zip: addr.zip,
        address: `${addr.pref}${addr.city}${street}`,
        phone: formatPhone(rng, addr.telPref),
        email: formatEmail(emailDomain, i),
        account_no: formatAccountNo(rng),
        status: STATUSES[randInt(rng, 0, STATUSES.length - 1)],
      };
      rows.push(row);
    }
    applyMinesToRows(rows, seed, mineRate, 'customer');
    return packageDataset(internalHeaders, rows, exportHeaders, quoteKeys);
  }

  const internalHeaders = getInternalHeaders('transaction');
  for (let i = 1; i <= count; i += 1) {
    const custIndex = randInt(rng, 1, Math.min(count, 99999));
    const year = randInt(rng, 2024, 2026);
    const month = String(randInt(rng, 1, 12)).padStart(2, '0');
    const day = String(randInt(rng, 1, 28)).padStart(2, '0');
    const pattern = pickTxnPattern(rng);
    /** @type {Record<string, string|number>} */
    const row = {
      txn_id: `TXN-${String(i).padStart(6, '0')}`,
      customer_id: formatCustomerId(idPrefix, custIndex),
      txn_date: `${year}-${month}-${day}`,
      txn_type: pattern.type,
      amount: String(randInt(rng, pattern.amountMin, pattern.amountMax)),
      description: pattern.description,
    };
    rows.push(row);
  }
  applyMinesToRows(rows, seed, mineRate, 'transaction');
  return packageDataset(internalHeaders, rows, exportHeaders, quoteKeys);
}

/**
 * 社員マスタを CHUNK_MAX 単位で結合した CSV（ヘッダー1回 · BOMなし）
 * @param {GenerateOptions} options
 * @param {number} totalCount
 */
export function generateBulkEmployeeCsv(options, totalCount) {
  const yearOpts = resolveEmployeeYearOptions(options);
  const check = validateBulkEmployeeOptions(totalCount, options.seed, yearOpts);
  if (!check.ok) throw new Error(check.message);

  const {
    seed,
    idPrefix,
    emailDomain,
    exportHeaders,
    birthDateFormat = 'slash',
    hireDateFormat = 'dash',
    quoteZipInCsv = true,
    roundSalaryTo1000 = true,
    includeForeignNames = true,
    spaceInDiverseNames = true,
  } = options;

  const internalHeaders = EMPLOYEE_HEADERS;
  const headers = resolveExportHeaders(internalHeaders, exportHeaders);
  const quoteKeys = resolveCsvQuoteKeys('employee', quoteZipInCsv !== false);
  const quoteSet = new Set(quoteKeys);
  const lines = [headers.join(',')];

  for (let startIndex = 1; startIndex <= totalCount; startIndex += CHUNK_MAX) {
    const chunkCount = Math.min(CHUNK_MAX, totalCount - startIndex + 1);
    const rows = generateEmployeeRows({
      count: chunkCount,
      startIndex,
      seed,
      idPrefix,
      emailDomain,
      mineRate: 0,
      hireYearMin: yearOpts.hireYearMin,
      hireYearMax: yearOpts.hireYearMax,
      birthDateFormat,
      hireDateFormat,
      roundSalaryTo1000,
      includeForeignNames,
      spaceInDiverseNames,
    });
    for (const row of rows) {
      lines.push(internalHeaders.map((k) => formatCsvCell(row[k], quoteSet.has(k))).join(','));
    }
  }

  return lines.join('\r\n');
}

/**
 * @param {string} csv
 * @param {string} filename
 */
export function downloadCsvBlob(csv, filename = 'test-data.csv') {
  const blob = new Blob([csvWithBom(csv)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * @param {string} prefix
 * @param {DataPreset} preset
 * @param {number} [totalCount]
 */
export function defaultFilename(prefix, preset, totalCount) {
  const stem = (prefix || 'test').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'test';
  if (preset === 'employee' && totalCount && totalCount > CHUNK_MAX) {
    return `${stem}-employee-${totalCount}.csv`;
  }
  return `${stem}-${preset}-${Date.now()}.csv`;
}
