/**
 * ai-cleaner — string-only cleaning (no DOM · no AI)
 */

/**
 * 連続空行を最大1空行（改行2つ）に削減
 * @param {string} text
 */
export function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/**
 * 行単位でコードフェンス外だけ変換
 * @param {string} text
 * @param {(line: string, inFence: boolean) => string|null} mapLine
 *   null を返すとその行を削除
 */
function mapLinesRespectingFences(text, mapLine) {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  /** @type {string[]} */
  const out = [];
  let inFence = false;
  /** @type {string|null} */
  let fenceClose = null;

  for (const line of lines) {
    if (!inFence) {
      const open = line.match(/^(`{3,}|~{3,})(.*)$/);
      if (open) {
        inFence = true;
        const ch = open[1][0];
        fenceClose = ch.repeat(open[1].length);
        const mapped = mapLine(line, true);
        if (mapped != null) out.push(mapped);
        continue;
      }
      const mapped = mapLine(line, false);
      if (mapped != null) out.push(mapped);
      continue;
    }

    if (fenceClose && new RegExp(`^${fenceClose[0] === '`' ? '`'.repeat(fenceClose.length) : '~'.repeat(fenceClose.length)}\\s*$`).test(line)) {
      inFence = false;
      fenceClose = null;
    }
    const mapped = mapLine(line, true);
    if (mapped != null) out.push(mapped);
  }

  return out.join('\n');
}

/**
 * Markdown汚れ除去（意味理解なし）
 * @param {string} text
 */
export function cleanMarkdown(text) {
  let out = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // HTML: b / strong / span のみ除去（中身は残す）
  out = out.replace(/<\/?(?:b|strong|span)\b[^>]*>/gi, '');

  // コードフェンス外の --- 行のみ除去
  out = mapLinesRespectingFences(out, (line, inFence) => {
    if (!inFence && /^[ \t]*---[ \t]*$/.test(line)) return null;
    return line;
  });

  return normalizeWhitespace(out);
}

/**
 * fenced code block をすべて抽出して連結
 * @param {string} text
 * @returns {string}
 */
export function extractCode(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  /** @type {string[]} */
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const open = lines[i].match(/^(`{3,}|~{3,})(.*)$/);
    if (!open) {
      i += 1;
      continue;
    }
    const marker = open[1];
    const closeRe = new RegExp(`^${marker[0].repeat(marker.length)}\\s*$`);
    i += 1;
    /** @type {string[]} */
    const body = [];
    while (i < lines.length) {
      if (closeRe.test(lines[i])) {
        i += 1;
        break;
      }
      body.push(lines[i]);
      i += 1;
    }
    blocks.push(body.join('\n'));
  }

  return blocks.join('\n\n');
}

/**
 * @param {string} text
 * @returns {{ ok: true, text: string } | { ok: false, error: string }}
 */
export function cleanJson(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'JSONとして解析できません' };
  }
  try {
    const value = JSON.parse(trimmed);
    return { ok: true, text: JSON.stringify(value, null, 2) };
  } catch {
    return { ok: false, error: 'JSONとして解析できません' };
  }
}

/**
 * @param {'markdown'|'code'|'json'} mode
 * @param {string} text
 * @returns {{ ok: true, text: string } | { ok: false, error: string }}
 */
export function runClean(mode, text) {
  if (mode === 'markdown') {
    return { ok: true, text: cleanMarkdown(text) };
  }
  if (mode === 'code') {
    const code = extractCode(text);
    if (!code) {
      return { ok: false, error: 'コードブロックが見つかりません' };
    }
    return { ok: true, text: code };
  }
  if (mode === 'json') {
    return cleanJson(text);
  }
  return { ok: false, error: '不明なモードです' };
}
