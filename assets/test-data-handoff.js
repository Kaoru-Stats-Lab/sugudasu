/**
 * テストデータ CSV → 全角半角整え handoff（sessionStorage · 1回限り）
 */

export const TEST_DATA_HANDOFF_KEY = 'sg-test-data-handoff-v1';
export const TEST_DATA_HANDOFF_VERSION = 1;

/**
 * @param {string} csv BOM 付き可
 * @param {string} [normalizePreset]
 */
export function writeTestDataHandoff(csv, normalizePreset = 'csv_roster') {
  if (!csv) return false;
  try {
    sessionStorage.setItem(
      TEST_DATA_HANDOFF_KEY,
      JSON.stringify({
        v: TEST_DATA_HANDOFF_VERSION,
        csv: String(csv).replace(/^\uFEFF/, ''),
        normalizePreset,
        createdAt: new Date().toISOString(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {{ csv: string, normalizePreset: string } | null}
 */
export function readTestDataHandoff() {
  try {
    const raw = sessionStorage.getItem(TEST_DATA_HANDOFF_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.v !== TEST_DATA_HANDOFF_VERSION || !data.csv) return null;
    return {
      csv: String(data.csv),
      normalizePreset: String(data.normalizePreset || 'csv_roster'),
    };
  } catch {
    return null;
  }
}

export function clearTestDataHandoff() {
  try {
    sessionStorage.removeItem(TEST_DATA_HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}
