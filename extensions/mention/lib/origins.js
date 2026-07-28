/** ADR-0007 · google_maps Adapter（GBP / Maps）optional origins */
export const OPTIONAL_MAPS_ORIGINS = [
  'https://www.google.com/maps/*',
  'https://maps.google.com/*',
  'https://www.google.co.jp/maps/*',
  'https://maps.google.co.jp/*',
  'https://business.google.com/*',
];

/**
 * @param {string} [url]
 * @returns {boolean}
 */
export function isMapsRelatedUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.hostname.includes('business.google.com')) return true;
    if (/maps\.google\./i.test(u.hostname)) return true;
    if (/google\./i.test(u.hostname) && u.pathname.startsWith('/maps')) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function hasMapsPermission() {
  return chrome.permissions.contains({ origins: OPTIONAL_MAPS_ORIGINS });
}

/**
 * ユーザー操作（click）内からのみ呼ぶこと
 * @returns {Promise<boolean>}
 */
export async function requestMapsPermission() {
  return chrome.permissions.request({ origins: OPTIONAL_MAPS_ORIGINS });
}
