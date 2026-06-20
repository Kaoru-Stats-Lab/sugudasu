/**
 * group-split Phase B — 制約パース · 割当ソルバ
 * SSOT: docs/notes/GROUP_SPLIT_TOOL_SPEC.md §2-4 · §4
 */

/**
 * @typedef {Object} RosterEntry
 * @property {string} name
 * @property {string} tag
 * @property {Record<string, string>} [attrs]
 * @property {number} line
 */

/**
 * @typedef {Object} AttrColumnRule
 * @property {number} columnIndex
 * @property {string} label
 * @property {boolean} spread
 * @property {string[]} requiredEach
 */

/**
 * @typedef {Object} GroupSplitConstraints
 * @property {string[][]} [bundles]
 * @property {Map<string, number>} [fixedToGroup]
 * @property {Array<[string, string]>} [separatePairs]
 * @property {boolean} [spreadTags]
 * @property {string} [requiredTag]
 * @property {number} [hardMax]
 * @property {AttrColumnRule[]} [attrRules]
 */

/**
 * @param {string} text
 */
export function parseRosterRich(text) {
  const raw = String(text ?? '').split(/\r?\n/);
  /** @type {RosterEntry[]} */
  const entries = [];
  const dupMap = new Map();

  raw.forEach((line, idx) => {
    const trimmed = String(line).trim();
    if (!trimmed) return;
    let name = trimmed;
    let tag = '';
    if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t').map((s) => s.trim()).filter(Boolean);
      name = parts[0] || '';
      tag = parts[1] || '';
    } else if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length === 2 && !/^\d+$/.test(parts[1])) {
        name = parts[0];
        tag = parts[1];
      }
    }
    if (!name) return;
    entries.push({ name, tag, attrs: tag ? { タグ: tag } : {}, line: idx + 1 });
    dupMap.set(name, (dupMap.get(name) || 0) + 1);
  });

  const duplicates = [...dupMap.entries()].filter(([, c]) => c > 1).map(([n]) => n);
  return { entries, duplicates, rawLineCount: raw.length };
}

/**
 * @param {string} text
 * @param {Set<string>} nameSet
 */
export function parseBundlesText(text, nameSet) {
  /** @type {string[][]} */
  const bundles = [];
  for (const line of String(text ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
    const members = line.split(/[,、\t]/).map((s) => s.trim()).filter(Boolean);
    if (members.length < 2) continue;
    const unknown = members.filter((m) => !nameSet.has(m));
    if (unknown.length) {
      throw Object.assign(new Error(`固定班に名簿にない名前: ${unknown.join('、')}`), { code: 'bundle_unknown' });
    }
    bundles.push(members);
  }
  return bundles;
}

/**
 * @param {string} text
 * @param {Set<string>} nameSet
 * @param {number} groupCount
 */
export function parseFixedText(text, nameSet, groupCount) {
  /** @type {Map<string, number>} */
  const fixed = new Map();
  for (const line of String(text ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
    let name = '';
    let gid = 0;
    const eq = line.match(/^(.+?)\s*[=→]\s*(\d+)\s*$/);
    if (eq) {
      name = eq[1].trim();
      gid = Number(eq[2]);
    } else {
      const parts = line.split(/[,、\t]/).map((s) => s.trim());
      if (parts.length >= 2) {
        name = parts[0];
        gid = Number(parts[1]);
      }
    }
    if (!name || !gid) continue;
    if (!nameSet.has(name)) {
      throw Object.assign(new Error(`固定配置に名簿にない名前: ${name}`), { code: 'fixed_unknown' });
    }
    if (gid < 1 || gid > groupCount) {
      throw Object.assign(new Error(`固定配置のグループ番号が範囲外: ${name} → ${gid}（1〜${groupCount}）`), { code: 'fixed_range' });
    }
    if (fixed.has(name)) {
      throw Object.assign(new Error(`固定配置が重複: ${name}`), { code: 'fixed_dup' });
    }
    fixed.set(name, gid);
  }
  return fixed;
}

/**
 * @param {string} text
 * @param {Set<string>} nameSet
 */
export function parsePairsText(text, nameSet) {
  /** @type {Array<[string, string]>} */
  const pairs = [];
  for (const line of String(text ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
    const parts = line.split(/[,、\t]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const [a, b] = parts;
    for (const n of [a, b]) {
      if (!nameSet.has(n)) {
        throw Object.assign(new Error(`離すペアに名簿にない名前: ${n}`), { code: 'pair_unknown' });
      }
    }
    pairs.push([a, b]);
  }
  return pairs;
}

/**
 * @param {RosterEntry[]} entries
 */
export function entriesToNameSet(entries) {
  return new Set(entries.map((e) => e.name));
}

/**
 * @param {RosterEntry[]} entries
 */
export function entryTagMap(entries) {
  /** @type {Map<string, string>} */
  const m = new Map();
  for (const e of entries) {
    if (e.tag) m.set(e.name, e.tag);
  }
  return m;
}

/**
 * @param {GroupSplitConstraints} c
 */
export function hasActiveConstraints(c) {
  const attrActive = (c.attrRules || []).some(
    (r) => r.spread || (r.requiredEach && r.requiredEach.length > 0),
  );
  return !!(
    (c.bundles && c.bundles.length)
    || (c.fixedToGroup && c.fixedToGroup.size)
    || (c.separatePairs && c.separatePairs.length)
    || c.spreadTags
    || (c.requiredTag && c.requiredTag.trim())
    || (c.hardMax && c.hardMax > 0)
    || attrActive
  );
}

/**
 * @param {string} a
 * @param {string} b
 * @param {Array<[string, string]>} pairs
 */
function arePaired(a, b, pairs) {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * @param {string[]} members
 * @param {string[]} groupMembers
 * @param {Array<[string, string]>} pairs
 */
function pairConflictIfAdded(members, groupMembers, pairs) {
  for (const m of members) {
    for (const g of groupMembers) {
      if (arePaired(m, g, pairs)) return true;
    }
  }
  return false;
}

/**
 * 制約の事前検証 — blocking（矛盾）と warnings（各組必須の人数不足）
 * @returns {{ blocking: string[], warnings: string[] }}
 */
export function classifyConstraintPre(entries, groupCount, constraints) {
  /** @type {string[]} */
  const blocking = [];
  /** @type {string[]} */
  const warnings = [];
  const bundles = constraints.bundles || [];
  const fixed = constraints.fixedToGroup || new Map();
  const pairs = constraints.separatePairs || [];

  for (const bundle of bundles) {
    for (let i = 0; i < bundle.length; i++) {
      for (let j = i + 1; j < bundle.length; j++) {
        if (arePaired(bundle[i], bundle[j], pairs)) {
          blocking.push(`固定班（${bundle.join('、')}）に離すペア ${bundle[i]}・${bundle[j]} が含まれています。`);
        }
      }
    }
  }

  for (const [a, b] of pairs) {
    const ga = fixed.get(a);
    const gb = fixed.get(b);
    if (ga != null && gb != null && ga === gb) {
      blocking.push(`離すペア ${a}・${b} が同じ固定グループ ${ga} に指定されています。`);
    }
  }

  if (constraints.requiredTag) {
    const rt = constraints.requiredTag.trim();
    const count = entries.filter((e) => e.tag === rt || e.attrs?.['タグ'] === rt).length;
    if (count < groupCount) {
      warnings.push(`タグ「${rt}」が ${count} 名 · グループ ${groupCount} 組 — 各組1名以上を満たせません。`);
    }
  }

  for (const rule of constraints.attrRules || []) {
    for (const reqVal of rule.requiredEach || []) {
      const count = entries.filter((e) => e.attrs?.[rule.label] === reqVal).length;
      if (count < groupCount) {
        warnings.push(`「${rule.label}=${reqVal}」が ${count} 名 · グループ ${groupCount} 組 — 各組1名以上を満たせません。`);
      }
    }
  }

  if (constraints.hardMax && constraints.hardMax > 0) {
    for (const bundle of bundles) {
      const unassigned = bundle.filter((m) => !fixed.has(m));
      if (unassigned.length > constraints.hardMax) {
        blocking.push(`固定班（${unassigned.join('、')}）が物理上限 ${constraints.hardMax} 名を超えています。`);
      }
    }
  }

  return { blocking, warnings };
}

/**
 * @param {RosterEntry[]} entries
 * @param {number} groupCount
 * @param {GroupSplitConstraints} constraints
 */
export function validateConstraintsPre(entries, groupCount, constraints) {
  const { blocking, warnings } = classifyConstraintPre(entries, groupCount, constraints);
  return [...blocking, ...warnings];
}

/**
 * @typedef {{ members: string[], kind: 'bundle'|'solo', tags: string[], attrValues: Record<string, string[]> }} AssignUnit
 */

/**
 * @param {RosterEntry[]} entries
 */
export function entryAttrsMap(entries) {
  /** @type {Map<string, Record<string, string>>} */
  const m = new Map();
  for (const e of entries) {
    const attrs = { ...(e.attrs || {}) };
    if (e.tag && !attrs['タグ']) attrs['タグ'] = e.tag;
    m.set(e.name, attrs);
  }
  return m;
}

/**
 * @param {string} name
 * @param {Map<string, Record<string, string>>} attrsByName
 * @param {string} label
 */
function attrValueOf(name, attrsByName, label) {
  return attrsByName.get(name)?.[label] || '';
}

/**
 * @param {string[]} members
 * @param {Map<string, Record<string, string>>} attrsByName
 * @param {string} label
 */
function memberAttrValues(members, attrsByName, label) {
  return [...new Set(members.map((m) => attrValueOf(m, attrsByName, label)).filter(Boolean))];
}

/**
 * @param {RosterEntry[]} entries
 * @param {GroupSplitConstraints} constraints
 * @param {Map<string, number>} fixed
 * @param {Map<string, string>} tagByName
 */
function buildUnits(entries, constraints, fixed, tagByName) {
  const attrsByName = entryAttrsMap(entries);
  /** @type {AssignUnit[]} */
  const units = [];
  const used = new Set([...fixed.keys()]);

  for (const bundle of constraints.bundles || []) {
    const members = bundle.filter((m) => !fixed.has(m));
    if (!members.length) continue;
    members.forEach((m) => used.add(m));
    /** @type {Record<string, string[]>} */
    const attrValues = {};
    for (const m of members) {
      const a = attrsByName.get(m) || {};
      for (const [k, v] of Object.entries(a)) {
        if (!v) continue;
        if (!attrValues[k]) attrValues[k] = [];
        if (!attrValues[k].includes(v)) attrValues[k].push(v);
      }
    }
    units.push({
      members,
      kind: members.length > 1 ? 'bundle' : 'solo',
      tags: [...new Set(members.map((m) => tagByName.get(m)).filter(Boolean))],
      attrValues,
    });
  }

  for (const e of entries) {
    if (!used.has(e.name) && !fixed.has(e.name)) {
      const a = attrsByName.get(e.name) || {};
      /** @type {Record<string, string[]>} */
      const attrValues = {};
      for (const [k, v] of Object.entries(a)) {
        if (v) attrValues[k] = [v];
      }
      used.add(e.name);
      units.push({
        members: [e.name],
        kind: 'solo',
        tags: e.tag ? [e.tag] : [],
        attrValues,
      });
    }
  }
  return units;
}

/**
 * @param {string[][]} groups
 * @param {Map<string, string>} tagByName
 * @param {number} g
 */
function groupTagSet(groups, tagByName, g) {
  const s = new Set();
  for (const m of groups[g]) {
    const t = tagByName.get(m);
    if (t) s.add(t);
  }
  return s;
}

/**
 * @param {string[][]} groups
 * @param {AssignUnit} unit
 * @param {number} g
 * @param {GroupSplitConstraints} constraints
 * @param {number} targetSize
 * @param {Map<string, string>} tagByName
 */
function scoreGroupForUnit(groups, unit, g, constraints, targetSize, tagByName, attrsByName) {
  const cur = groups[g].length;
  const next = cur + unit.members.length;
  const hardMax = constraints.hardMax && constraints.hardMax > 0 ? constraints.hardMax : Infinity;
  if (next > hardMax) return null;
  if (pairConflictIfAdded(unit.members, groups[g], constraints.separatePairs || [])) return null;

  let score;
  if (next <= targetSize) {
    score = cur * 1000 + Math.abs(next - targetSize) * 10;
  } else {
    score = 100000 + (next - targetSize) * 100 + next;
  }

  if (constraints.spreadTags && unit.tags.length) {
    const gTags = groupTagSet(groups, tagByName, g);
    for (const t of unit.tags) {
      if (gTags.has(t)) score += 500;
    }
  }

  for (const rule of constraints.attrRules || []) {
    if (!rule.spread) continue;
    const gVals = new Set(memberAttrValues(groups[g], attrsByName, rule.label));
    const unitVals = unit.attrValues[rule.label] || [];
    for (const v of unitVals) {
      if (gVals.has(v)) score += 500;
    }
  }

  return score;
}

/**
 * @param {string[][]} groups
 * @param {string} requiredTag
 * @param {Map<string, string>} tagByName
 * @param {Array<[string, string]>} pairs
 * @param {number} hardMax
 */
function repairRequiredTag(groups, requiredTag, tagByName, pairs, hardMax) {
  const gCount = groups.length;
  for (let g = 0; g < gCount; g++) {
    if (groups[g].some((m) => tagByName.get(m) === requiredTag)) continue;
    for (let h = 0; h < gCount; h++) {
      if (h === g) continue;
      const donorIdx = groups[h].findIndex((m) => tagByName.get(m) === requiredTag);
      if (donorIdx < 0) continue;
      const recvIdx = groups[g].findIndex((m) => tagByName.get(m) !== requiredTag);
      if (recvIdx < 0) continue;
      const donor = groups[h][donorIdx];
      const recv = groups[g][recvIdx];
      if (pairConflictIfAdded([donor], groups[g].filter((m) => m !== recv), pairs)) continue;
      if (pairConflictIfAdded([recv], groups[h].filter((m) => m !== donor), pairs)) continue;
      if (groups[g].length >= hardMax || groups[h].length >= hardMax) continue;
      groups[g][recvIdx] = donor;
      groups[h][donorIdx] = recv;
      break;
    }
  }
}

/**
 * @param {string[][]} groups
 * @param {AttrColumnRule} rule
 * @param {string} reqVal
 * @param {Map<string, Record<string, string>>} attrsByName
 * @param {Array<[string, string]>} pairs
 * @param {number} hardMax
 */
function repairRequiredAttr(groups, rule, reqVal, attrsByName, pairs, hardMax) {
  const gCount = groups.length;
  for (let g = 0; g < gCount; g++) {
    if (groups[g].some((m) => attrValueOf(m, attrsByName, rule.label) === reqVal)) continue;
    for (let h = 0; h < gCount; h++) {
      if (h === g) continue;
      const donorIdx = groups[h].findIndex((m) => attrValueOf(m, attrsByName, rule.label) === reqVal);
      if (donorIdx < 0) continue;
      const recvIdx = groups[g].findIndex((m) => attrValueOf(m, attrsByName, rule.label) !== reqVal);
      if (recvIdx < 0) continue;
      const donor = groups[h][donorIdx];
      const recv = groups[g][recvIdx];
      if (pairConflictIfAdded([donor], groups[g].filter((m) => m !== recv), pairs)) continue;
      if (pairConflictIfAdded([recv], groups[h].filter((m) => m !== donor), pairs)) continue;
      if (groups[g].length >= hardMax || groups[h].length >= hardMax) continue;
      groups[g][recvIdx] = donor;
      groups[h][donorIdx] = recv;
      break;
    }
  }
}

function countRequiredInGroup(grp, rule, reqVal, attrsByName) {
  return grp.filter((m) => attrValueOf(m, attrsByName, rule.label) === reqVal).length;
}

/** 余剰組から不足組へ required 値を移し、各組1名カバーを最大化 */
function maximizeRequiredAttrCoverage(groups, rule, reqVal, attrsByName, pairs, hardMax) {
  const gCount = groups.length;
  for (let round = 0; round < gCount; round++) {
    const deficit = [];
    const surplus = [];
    for (let i = 0; i < gCount; i++) {
      const c = countRequiredInGroup(groups[i], rule, reqVal, attrsByName);
      if (c === 0) deficit.push(i);
      else if (c > 1) surplus.push(i);
    }
    if (!deficit.length || !surplus.length) break;
    let moved = false;
    for (const g of deficit) {
      for (const h of surplus) {
        const donorIdx = groups[h].findIndex((m) => attrValueOf(m, attrsByName, rule.label) === reqVal);
        if (donorIdx < 0) continue;
        const recvIdx = groups[g].findIndex((m) => attrValueOf(m, attrsByName, rule.label) !== reqVal);
        if (recvIdx < 0) continue;
        const donor = groups[h][donorIdx];
        const recv = groups[g][recvIdx];
        if (pairConflictIfAdded([donor], groups[g].filter((m) => m !== recv), pairs)) continue;
        if (pairConflictIfAdded([recv], groups[h].filter((m) => m !== donor), pairs)) continue;
        if (groups[g].length >= hardMax || groups[h].length >= hardMax) continue;
        groups[g][recvIdx] = donor;
        groups[h][donorIdx] = recv;
        moved = true;
        break;
      }
      if (moved) break;
    }
    if (!moved) break;
  }
}

/**
 * @param {RosterEntry[]} entries
 * @param {number} groupCount
 * @param {number} targetSize
 * @param {GroupSplitConstraints} constraints
 * @param {(n: number) => Uint32Array} randomFn
 * @param {(arr: AssignUnit[], fn: (n: number) => Uint32Array) => AssignUnit[]} shuffleUnits
 * @param {{ relaxRequiredEach?: boolean }} [assignOpts]
 */
export function assignWithConstraints(entries, groupCount, targetSize, constraints, randomFn, shuffleUnits, assignOpts = {}) {
  const tagByName = entryTagMap(entries);
  const attrsByName = entryAttrsMap(entries);
  const fixed = constraints.fixedToGroup || new Map();
  const pairs = constraints.separatePairs || [];
  const relax = !!assignOpts.relaxRequiredEach;

  const { blocking, warnings } = classifyConstraintPre(entries, groupCount, constraints);
  if (blocking.length) {
    const err = new Error(blocking.join('\n'));
    err.code = 'constraint_invalid';
    err.details = blocking;
    throw err;
  }
  if (warnings.length && !relax) {
    const err = new Error(warnings.join('\n'));
    err.code = 'constraint_soft';
    err.details = warnings;
    throw err;
  }

  /** @type {Array<{ groupId: number, label: string, value: string }>} */
  const unmetRequired = [];

  /** @type {string[][]} */
  const groups = Array.from({ length: groupCount }, () => []);
  /** @type {string[][]} */
  const overflowReasons = Array.from({ length: groupCount }, () => []);

  fixed.forEach((gid, name) => {
    groups[gid - 1].push(name);
  });

  const units = buildUnits(entries, constraints, fixed, tagByName);
  const shuffledUnits = shuffleUnits(units, randomFn);

  for (const unit of shuffledUnits) {
    /** @type {{ g: number, score: number }[]} */
    const candidates = [];
    for (let g = 0; g < groupCount; g++) {
      const score = scoreGroupForUnit(groups, unit, g, constraints, targetSize, tagByName, attrsByName);
      if (score != null) candidates.push({ g, score });
    }

    let chosen = -1;
    if (candidates.length) {
      candidates.sort((a, b) => a.score - b.score || a.g - b.g);
      chosen = candidates[0].g;
    } else {
      let best = Infinity;
      for (let g = 0; g < groupCount; g++) {
        const next = groups[g].length + unit.members.length;
        const hardMax = constraints.hardMax && constraints.hardMax > 0 ? constraints.hardMax : Infinity;
        if (next > hardMax) continue;
        if (pairConflictIfAdded(unit.members, groups[g], pairs)) continue;
        if (next < best) {
          best = next;
          chosen = g;
        }
      }
    }

    if (chosen < 0) {
      const err = new Error('制約を満たす配置が見つかりません（物理上限または離すペア）。設定を見直してください。');
      err.code = 'constraint_infeasible';
      throw err;
    }

    const before = groups[chosen].length;
    groups[chosen].push(...unit.members);
    const after = groups[chosen].length;
    if (unit.kind === 'bundle' && after > targetSize) {
      overflowReasons[chosen].push(`固定班${unit.members.length}名を分割しないため`);
    } else if (after > targetSize && before <= targetSize) {
      overflowReasons[chosen].push('定員調整');
    }
  }

  if (constraints.requiredTag) {
    const rt = constraints.requiredTag.trim();
    const hardMax = constraints.hardMax && constraints.hardMax > 0 ? constraints.hardMax : Infinity;
    for (let pass = 0; pass < groupCount; pass++) {
      repairRequiredTag(groups, rt, tagByName, pairs, hardMax);
      const stillMissing = groups.some((grp) => !grp.some((m) => tagByName.get(m) === rt));
      if (!stillMissing) break;
    }
    for (let g = 0; g < groupCount; g++) {
      if (!groups[g].some((m) => tagByName.get(m) === rt)) {
        if (relax) {
          unmetRequired.push({ groupId: g + 1, label: 'タグ', value: rt });
        } else {
          const err = new Error(`グループ${g + 1}にタグ「${rt}」を配置できませんでした。`);
          err.code = 'required_tag_fail';
          throw err;
        }
      }
    }
  }

  const hardMax = constraints.hardMax && constraints.hardMax > 0 ? constraints.hardMax : Infinity;
  for (const rule of constraints.attrRules || []) {
    for (const reqVal of rule.requiredEach || []) {
      for (let pass = 0; pass < groupCount; pass++) {
        repairRequiredAttr(groups, rule, reqVal, attrsByName, pairs, hardMax);
        const stillMissing = groups.some(
          (grp) => !grp.some((m) => attrValueOf(m, attrsByName, rule.label) === reqVal),
        );
        if (!stillMissing) break;
      }
      maximizeRequiredAttrCoverage(groups, rule, reqVal, attrsByName, pairs, hardMax);
      for (let g = 0; g < groupCount; g++) {
        if (!groups[g].some((m) => attrValueOf(m, attrsByName, rule.label) === reqVal)) {
          if (relax) {
            unmetRequired.push({ groupId: g + 1, label: rule.label, value: reqVal });
          } else {
            const err = new Error(`グループ${g + 1}に「${rule.label}=${reqVal}」を配置できませんでした。`);
            err.code = 'required_attr_fail';
            throw err;
          }
        }
      }
    }
  }

  return { groups, overflowReasons, targetSize, unmetRequired, relaxedWarnings: relax ? warnings : [] };
}

/**
 * @param {AssignUnit[]} units
 * @param {(n: number) => Uint32Array} randomFn
 */
export function shuffleUnits(units, randomFn) {
  const a = units.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomFn(1)[0] % (i + 1);
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/**
 * @param {GroupSplitConstraints} constraints
 * @param {number} targetSize
 */
export function willLikelyOverflow(constraints, targetSize) {
  if (!constraints.bundles?.length) return false;
  return constraints.bundles.some((b) => b.length > targetSize);
}
