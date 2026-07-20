/**
 * SUGUDASU ツール開発段階ラベル（一般向け文言）
 * 安定版はバッジ非表示。版数・Backlog・内部ステージ名は出さない。
 */

/** @type {Record<string, { label: string, cssClass: string, hint: string }>} */
export const DEV_STAGES = {
  alpha: {
    label: '新しい機能を試験公開しています',
    cssClass: 'sg-dev-stage--alpha',
    hint: '試験公開中の機能です。フィードバックを歓迎します。',
  },
  beta: {
    label: '試験公開中です',
    cssClass: 'sg-dev-stage--beta',
    hint: '主要機能は使えます。仕様が変わる場合があります。',
  },
  gamma: {
    label: '新しい機能を試験公開しています',
    cssClass: 'sg-dev-stage--gamma',
    hint: '試験公開中の機能です。',
  },
  stable: {
    label: '',
    cssClass: 'sg-dev-stage--stable',
    hint: '',
  },
};

/**
 * @param {string} stage
 * @param {{ version?: string, title?: string }} [opts]
 */
export function formatDevStageBadge(stage, opts = {}) {
  void opts;
  const meta = DEV_STAGES[stage] || DEV_STAGES.stable;
  if (!meta.label) return '';
  return `<span class="sg-dev-stage ${meta.cssClass}" title="${meta.hint}">${meta.label}</span>`;
}

/**
 * @param {string} url
 */
export async function fetchToolRegistry(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`tool-registry fetch failed: ${res.status}`);
  return res.json();
}

/**
 * @param {object} registry
 * @param {string} toolId
 */
export function getToolFromRegistry(registry, toolId) {
  return registry?.tools?.[toolId] || null;
}

/**
 * @param {string} stage
 * @param {string} version
 */
export function formatToolVersionLabel(stage, version) {
  void version;
  const meta = DEV_STAGES[stage];
  return meta?.label || '公開中';
}
