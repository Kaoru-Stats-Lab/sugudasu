/**
 * SUGUDASU ツール開発段階ラベル（アルファ → ベータ → ガンマ → 安定）
 * 安定版はバッジ非表示。
 */

/** @type {Record<string, { label: string, cssClass: string, hint: string }>} */
export const DEV_STAGES = {
  alpha: {
    label: 'アルファ版',
    cssClass: 'sg-dev-stage--alpha',
    hint: '骨格確認中。欠落・不具合があり得ます。',
  },
  beta: {
    label: 'ベータ版',
    cssClass: 'sg-dev-stage--beta',
    hint: '主要機能は動きますが、仕様変更・未実装があります。',
  },
  gamma: {
    label: 'ガンマ版',
    cssClass: 'sg-dev-stage--gamma',
    hint: 'リリース候補。最終調整中です。',
  },
  stable: {
    label: '安定版',
    cssClass: 'sg-dev-stage--stable',
    hint: '安定運用。大きな仕様変更は changelog で告知。',
  },
};

/**
 * @param {string} stage
 * @param {{ version?: string, title?: string }} [opts]
 */
export function formatDevStageBadge(stage, opts = {}) {
  const meta = DEV_STAGES[stage] || DEV_STAGES.stable;
  if (!meta.label) return '';
  const ver = opts.version ? ` v${opts.version}` : '';
  const title = opts.title ? `${opts.title} — ` : '';
  const note = opts.statusNote ? ` · ${opts.statusNote}` : '';
  return `<span class="sg-dev-stage ${meta.cssClass}" title="${title}${meta.hint}${note}">${meta.label}${ver}</span>`;
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
  const meta = DEV_STAGES[stage];
  if (!meta?.label) return `v${version}`;
  return `${meta.label} v${version}`;
}
