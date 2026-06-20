/**
 * group-split — 制約テキスト欄の件数集計 · 追記ヘルパ
 */

export const CONSTRAINT_SOFT_WARN = {
  bundles: 5,
  pairs: 10,
  fixed: 10,
};

/**
 * @param {string} bundlesText
 * @param {string} fixedText
 * @param {string} pairsText
 */
export function countNameConstraints(bundlesText, fixedText, pairsText) {
  const bundles = String(bundlesText ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const fixed = String(fixedText ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pairs = String(pairsText ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { bundles: bundles.length, fixed: fixed.length, pairs: pairs.length };
}

/**
 * @param {{ bundles: number, fixed: number, pairs: number }} counts
 */
export function formatConstraintSummary(counts) {
  const parts = [];
  if (counts.bundles) parts.push(`固定班 ${counts.bundles}件`);
  if (counts.fixed) parts.push(`固定配置 ${counts.fixed}件`);
  if (counts.pairs) parts.push(`離すペア ${counts.pairs}件`);
  if (!parts.length) return '名前ルール: 未設定（属性条件だけでも実行できます）';
  let msg = `名前ルール: ${parts.join(' · ')}`;
  const warns = [];
  if (counts.bundles > CONSTRAINT_SOFT_WARN.bundles) {
    warns.push(`固定班が${counts.bundles}件（目安${CONSTRAINT_SOFT_WARN.bundles}件以下）`);
  }
  if (counts.pairs > CONSTRAINT_SOFT_WARN.pairs) {
    warns.push(`離すペアが${counts.pairs}件（目安${CONSTRAINT_SOFT_WARN.pairs}件以下）`);
  }
  if (warns.length) msg += ` — ${warns.join(' · ')}`;
  return msg;
}

/**
 * @param {string} text
 * @param {string} line
 */
export function appendConstraintLine(text, line) {
  const t = String(text ?? '').trim();
  const l = String(line ?? '').trim();
  if (!l) return t;
  return t ? `${t}\n${l}` : l;
}

/**
 * @param {string} a
 * @param {string} b
 */
export function formatPairLine(a, b) {
  return `${String(a).trim()}, ${String(b).trim()}`;
}

/**
 * @param {string[]} members
 */
export function formatBundleLine(members) {
  return members.map((m) => String(m).trim()).filter(Boolean).join(', ');
}

/**
 * @param {string} name
 * @param {number} groupNum
 */
export function formatFixedLine(name, groupNum) {
  return `${String(name).trim()}=${Math.floor(Number(groupNum) || 0)}`;
}

/**
 * 名簿から除外した名前を制約欄からも落とす（M02 Resilience）
 * @param {{ bundlesText?: string, fixedText?: string, pairsText?: string, spreadTags?: boolean, requiredTag?: string, hardMax?: number, attrRules?: unknown[] }} input
 * @param {string[]} removedNames
 */
export function pruneConstraintsAfterNameRemoval(input, removedNames) {
  const removed = new Set(
    (removedNames || []).map((n) => String(n).trim()).filter(Boolean),
  );
  if (!removed.size) return { ...input };

  const bundlesText = String(input.bundlesText ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(/[,、\t]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((m) => !removed.has(m)),
    )
    .filter((members) => members.length >= 2)
    .map((members) => members.join(', '))
    .join('\n');

  const fixedText = String(input.fixedText ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((line) => {
      const eq = line.match(/^(.+?)\s*[=→]\s*(\d+)\s*$/);
      const name = eq ? eq[1].trim() : line.split(/[,、\t]/)[0]?.trim();
      return name && !removed.has(name);
    })
    .join('\n');

  const pairsText = String(input.pairsText ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((line) => {
      const parts = line.split(/[,、\t]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) return false;
      return !removed.has(parts[0]) && !removed.has(parts[1]);
    })
    .join('\n');

  return {
    ...input,
    bundlesText,
    fixedText,
    pairsText,
  };
}
