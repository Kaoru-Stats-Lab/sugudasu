/**
 * Mention by SUGUDASU — Action Engine（純関数 · LLM なし）
 * ContextEnvelope.adapterId で Scenario 表を選ぶ（specification.md §3.1 / §5）
 */

/** @typedef {{ adapterId: string, title: string, url: string, author: string, datetime: string, body: string, brand: string, stars: number|null, hasImages: boolean, hasReply: boolean, domain?: string, ogTitle?: string, ogImage?: string, supported?: boolean }} ContextEnvelope */

export const ACTION_LABELS = {
  google_reply: 'Google返信',
  google_reply_improve: '改善付き返信',
  internal_share: '社内共有',
  note_template: '確認メモ',
  quote_post: '引用ポスト',
  thanks_mail: 'お礼メール',
  slack_share: 'Slack共有',
  correction_request: '修正依頼',
  pr_log: 'PRログ',
  sns_share: 'SNS共有',
  done: '完了',
};

export const CATEGORY_LABELS = {
  google_review: 'Google口コミ',
  web_article: 'Web記事',
  sns_post: 'SNS投稿',
  news: 'ニュース',
  other: 'その他',
};

const ADAPTER_SITE = {
  google_maps: 'Google マップ',
  x: 'X',
  web: 'Web',
  news: 'ニュース',
  google_search: 'Google 検索',
};

/**
 * Scenario 表のキー（表示用 category）を adapterId から選ぶ
 * @param {ContextEnvelope} envelope
 * @returns {string}
 */
export function classifyCategory(envelope) {
  if (!envelope || envelope.supported === false) return 'other';
  const id = envelope.adapterId || '';
  if (id === 'google_maps') return 'google_review';
  if (id === 'x') return 'sns_post';
  if (id === 'news') return 'news';
  if (id === 'google_search' || id === 'web') return 'web_article';
  return 'other';
}

/**
 * @param {ContextEnvelope} envelope
 * @returns {string}
 */
export function starsVariant(envelope) {
  const s = envelope?.stars;
  if (s == null) return 'default';
  if (s >= 4) return 'stars_45';
  if (s === 3) return 'stars_3';
  if (s <= 2) return 'stars_12';
  return 'default';
}

/**
 * @param {ContextEnvelope} envelope
 * @returns {string[]}
 */
export function selectActions(envelope) {
  const category = classifyCategory(envelope);
  const stars = envelope?.stars;
  const hasReply = Boolean(envelope?.hasReply);

  if (category === 'google_review') {
    if (hasReply) return ['slack_share', 'done'];
    if (stars != null && stars >= 4) return ['google_reply', 'slack_share', 'done'];
    if (stars === 3) return ['google_reply_improve', 'slack_share', 'done'];
    if (stars != null && stars <= 2) return ['internal_share', 'note_template', 'done'];
    return ['google_reply', 'slack_share', 'done'];
  }

  if (category === 'web_article') {
    return ['quote_post', 'thanks_mail', 'slack_share', 'done'];
  }

  if (category === 'news') {
    return ['pr_log', 'sns_share', 'done'];
  }

  if (category === 'sns_post') {
    return ['quote_post', 'slack_share', 'done'];
  }

  return ['slack_share', 'done'];
}

/**
 * @param {number|null|undefined} stars
 * @returns {string}
 */
export function formatStars(stars) {
  if (stars == null || Number.isNaN(stars)) return '';
  const n = Math.max(0, Math.min(5, Math.round(Number(stars))));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/**
 * @param {ContextEnvelope} envelope
 * @param {{ store?: string, brand?: string }} [settings]
 * @returns {Record<string, string>}
 */
export function buildTemplateVars(envelope, settings = {}) {
  const s = envelope || {};
  return {
    customer: s.author || '',
    store: settings.store || '',
    article_title: s.ogTitle || s.title || '',
    url: s.url || '',
    site: s.domain || ADAPTER_SITE[s.adapterId] || '',
    date: s.datetime || '',
    stars: formatStars(s.stars),
    body: s.body || '',
    brand: settings.brand || s.brand || '',
  };
}

/**
 * @param {string} template
 * @param {Record<string, string>} vars
 * @returns {string}
 */
export function fillTemplate(template, vars) {
  if (!template) return '';
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key] == null ? '' : String(vars[key]);
    }
    return '';
  });
}

/**
 * @param {ContextEnvelope} envelope
 * @param {{ store?: string, brand?: string, brands?: string[] }} [settings]
 * @param {Record<string, string>} [templates]
 */
export function runActionEngine(envelope, settings = {}, templates = {}) {
  const category = classifyCategory(envelope);
  const actions = selectActions(envelope);
  const variant = starsVariant(envelope);
  const brand =
    settings.brand ||
    (Array.isArray(settings.brands) && settings.brands[0]) ||
    envelope.brand ||
    '';
  const vars = buildTemplateVars(envelope, { store: settings.store || '', brand });

  const filled = {};
  for (const actionId of actions) {
    if (actionId === 'done') {
      filled[actionId] = '';
      continue;
    }
    const body =
      templates[`${actionId}|${variant}`] ||
      templates[`${actionId}|default`] ||
      templates[actionId] ||
      '';
    filled[actionId] = fillTemplate(body, vars);
  }

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    actions,
    variant,
    vars,
    filled,
    unsupportedPage: category === 'other' && envelope?.supported === false,
  };
}

/**
 * @param {Partial<ContextEnvelope> & { platform?: string }} partial
 * @returns {ContextEnvelope}
 */
export function normalizeSignals(partial = {}) {
  return {
    adapterId: partial.adapterId || partial.platform || '',
    title: partial.title || '',
    url: partial.url || '',
    author: partial.author || '',
    datetime: partial.datetime || '',
    body: partial.body || '',
    brand: partial.brand || '',
    stars: partial.stars == null || partial.stars === '' ? null : Number(partial.stars),
    hasImages: Boolean(partial.hasImages),
    hasReply: Boolean(partial.hasReply),
    domain: partial.domain || '',
    ogTitle: partial.ogTitle || '',
    ogImage: partial.ogImage || '',
    supported: partial.supported !== false,
  };
}
