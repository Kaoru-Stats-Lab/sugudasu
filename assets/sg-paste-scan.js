/**
 * 貼付時スキャン — 文字化け・改行リスク（T03 Phase A）
 * SSOT: docs/notes/SUGUDASU_OOPS_GUARDRAILS.md
 */

const REPLACEMENT = '\uFFFD';

/**
 * @param {string} text
 * @returns {{ banners: Array<{ id: string, level: 'warn' | 'info', message: string }>, replacementLines: number[], hasLeadingZero: boolean }}
 */
export function scanPasteWarnings(text) {
  const raw = String(text ?? '');
  /** @type {Array<{ id: string, level: 'warn' | 'info', message: string }>} */
  const banners = [];
  const replacementLines = [];

  if (raw.includes('\r')) {
    banners.push({
      id: 'crlf',
      level: 'info',
      message: 'Windows形式の改行（CRLF）を検知しました。変換時に LF に統一します。',
    });
  }

  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(REPLACEMENT)) {
      replacementLines.push(idx + 1);
    }
  });

  if (replacementLines.length > 0) {
    banners.push({
      id: 'replacement',
      level: 'warn',
      message: `【文字化けの可能性】${replacementLines.slice(0, 3).join('・')}行目付近に欠落文字（�）があります。元のテキストを確認してください。`,
    });
  }

  if (/\?\?/.test(raw) && replacementLines.length === 0) {
    banners.push({
      id: 'question-marks',
      level: 'warn',
      message: '連続した「?」が含まれています。OS間コピペで文字が化けていないか確認してください。',
    });
  }

  const hasLeadingZero = lines.some((line) => /^0\d/.test(line.trim()));

  return { banners, replacementLines, hasLeadingZero };
}
