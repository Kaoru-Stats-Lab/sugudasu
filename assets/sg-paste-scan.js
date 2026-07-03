/**
 * 貼付時スキャン — 文字化け・改行リスク（T03 Phase A）
 * SSOT: docs/notes/SUGUDASU_OOPS_GUARDRAILS.md
 */

const REPLACEMENT = '\uFFFD';

/** 典型ヘッダー語（A03 · 先頭行警告） */
const HEADER_ROW_RE = /^(名前|氏名|フリガナ|ふりがな|メール|mail|e-?mail|email|id|code|番号|電話|tel|phone|住所|address|name|氏名カナ|社員番号|従業員番号|user_?id|customer_?id)$/i;

/** 制御文字・サロゲート異常（E01） */
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/;

/**
 * @param {string} text
 * @returns {{ banners: Array<{ id: string, level: 'warn' | 'info', message: string }>, replacementLines: number[], controlLines: number[], hasLeadingZero: boolean, hasHeaderRow: boolean }}
 */
export function scanPasteWarnings(text) {
  const raw = String(text ?? '');
  /** @type {Array<{ id: string, level: 'warn' | 'info', message: string }>} */
  const banners = [];
  const replacementLines = [];
  const controlLines = [];

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
    if (CONTROL_CHAR_RE.test(line)) {
      controlLines.push(idx + 1);
    }
  });

  if (replacementLines.length > 0) {
    banners.push({
      id: 'replacement',
      level: 'warn',
      message: `【文字化けの可能性】${replacementLines.slice(0, 3).join('・')}行目付近に欠落文字（�）があります。元のテキストを確認してください。`,
    });
  }

  if (controlLines.length > 0) {
    banners.push({
      id: 'control-chars',
      level: 'warn',
      message: `【制御文字】${controlLines.slice(0, 3).join('・')}行目付近に見えない制御文字があります。コピー元のファイルを確認してください。`,
    });
  }

  if (/\?\?/.test(raw) && replacementLines.length === 0) {
    banners.push({
      id: 'question-marks',
      level: 'warn',
      message: '連続した「?」が含まれています。OS間コピペで文字が化けていないか確認してください。',
    });
  }

  let hasHeaderRow = false;
  if (lines.length > 1 && lines[0].trim()) {
    const firstCells = lines[0].includes('\t')
      ? lines[0].split('\t').map((c) => c.trim())
      : [lines[0].trim()];
    hasHeaderRow = firstCells.some((cell) => HEADER_ROW_RE.test(cell));
    if (hasHeaderRow) {
      banners.push({
        id: 'header-row',
        level: 'info',
        message: '先頭行が見出し語（名前・メール等）のようです。データ行だけを貼るか、変換後に先頭行を削除してください。',
      });
    }
  }

  const hasLeadingZero = lines.some((line) => /^0\d/.test(line.trim()));

  return { banners, replacementLines, controlLines, hasLeadingZero, hasHeaderRow };
}
