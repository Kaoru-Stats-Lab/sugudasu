/**
 * 景品表示法 一次スクリーニング + 公平抽選（Fisher-Yates）
 * SSOT: docs/notes/LOTTERY_PRIZE_LAW_TOOL_SPEC.md
 */

const LEVEL_RANK = { ok: 0, yellow: 1, red: 2 };

/**
 * @param {number} levelA
 * @param {number} levelB
 */
function maxLevel(levelA, levelB) {
  return LEVEL_RANK[levelA] >= LEVEL_RANK[levelB] ? levelA : levelB;
}

/**
 * @param {object} rules
 * @param {number} maxTransactionYen
 */
export function calcGeneralLotteryMaxPrize(rules, maxTransactionYen) {
  const gl = rules.generalLottery;
  const threshold = gl.transactionThresholdYen ?? 5000;
  const tx = Math.max(0, Number(maxTransactionYen) || 0);
  if (tx < threshold) {
    const mult = gl.maxPrizeUnderThreshold?.multiplier ?? 20;
    return { maxAllowedYen: tx * mult, basis: `取引額 ${tx.toLocaleString('ja-JP')}円 × ${mult}倍` };
  }
  const cap = gl.maxPrizeFromThreshold?.capYen ?? 100000;
  return { maxAllowedYen: cap, basis: `取引額 ${threshold.toLocaleString('ja-JP')}円以上の上限 ${cap.toLocaleString('ja-JP')}円` };
}

/**
 * @param {object} rules
 * @param {number} maxTransactionYen
 */
export function calcLumpSumMaxPremium(rules, maxTransactionYen) {
  const ls = rules.lumpSumPremium;
  const threshold = ls.transactionThresholdYen ?? 1000;
  const tx = Math.max(0, Number(maxTransactionYen) || 0);
  if (tx < threshold) {
    const cap = ls.underThresholdCapYen ?? 200;
    return { maxAllowedYen: cap, basis: `取引額 ${threshold.toLocaleString('ja-JP')}円未満の上限 ${cap.toLocaleString('ja-JP')}円` };
  }
  const ratio = ls.fromThresholdRatio ?? 0.2;
  return { maxAllowedYen: Math.floor(tx * ratio), basis: `取引額 ${tx.toLocaleString('ja-JP')}円の10分の2（${Math.round(ratio * 100)}%）` };
}

/**
 * @param {object} input
 * @param {object} rules
 * @param {object} patternsDoc
 */
export function evaluatePrizeLaw(input, rules, patternsDoc) {
  const audience = input.audience === 'internal' ? 'internal' : 'consumer';
  const selectedPatterns = Array.isArray(input.patternIds) ? input.patternIds : [];
  const maxTransactionYen = Number(input.maxTransactionYen) || 0;
  const maxPrizeYen = Number(input.maxPrizeYen) || 0;
  const totalPrizeYen = Number(input.totalPrizeYen) || 0;
  const expectedSalesYen = Number(input.expectedSalesYen) || 0;
  const winnerCount = Number(input.winnerCount) || 0;
  const isPaid = !!input.isPaid;

  /** @type {Array<{id: string, level: 'yellow'|'red', message: string, action: string}>} */
  const flags = [];
  /** @type {Array<{id: string, level: string, message: string, detail?: string}>} */
  const numericChecks = [];

  const patternMap = new Map((patternsDoc.patterns || []).map((p) => [p.id, p]));

  for (const id of selectedPatterns) {
    const p = patternMap.get(id);
    if (!p) continue;
    if (audience === 'internal' && !p.audience.includes('internal') && id !== 'P11') continue;
    if (audience === 'consumer' && !p.audience.includes('consumer')) continue;
    flags.push({
      id: p.id,
      level: p.defaultLevel === 'red' ? 'red' : 'yellow',
      message: p.summary,
      action: p.action,
      nextSteps: Array.isArray(p.nextSteps) ? p.nextSteps : [],
      patternLabel: p.label,
    });
  }

  if (audience === 'consumer') {
    const { maxAllowedYen, basis } = calcGeneralLotteryMaxPrize(rules, maxTransactionYen);
    if (maxPrizeYen > maxAllowedYen) {
      numericChecks.push({
        id: 'general-lottery-max',
        level: 'red',
        message: `景品最高額 ${maxPrizeYen.toLocaleString('ja-JP')}円が、一般懸賞の目安上限 ${maxAllowedYen.toLocaleString('ja-JP')}円を超えています。`,
        detail: basis,
      });
    } else if (maxPrizeYen > 0) {
      numericChecks.push({
        id: 'general-lottery-max',
        level: 'ok',
        message: `景品最高額は一般懸賞の目安上限内です（上限 ${maxAllowedYen.toLocaleString('ja-JP')}円）。`,
        detail: basis,
      });
    }

    if (expectedSalesYen > 0 && totalPrizeYen > 0) {
      const ratio = rules.generalLottery?.totalPrizeCapRatio ?? 0.02;
      const cap = Math.floor(expectedSalesYen * ratio);
      if (totalPrizeYen > cap) {
        numericChecks.push({
          id: 'general-lottery-total',
          level: 'red',
          message: `景品総額 ${totalPrizeYen.toLocaleString('ja-JP')}円が、売上見込みの ${Math.round(ratio * 100)}%（${cap.toLocaleString('ja-JP')}円）を超えています。`,
          detail: `売上見込み ${expectedSalesYen.toLocaleString('ja-JP')}円`,
        });
      } else {
        numericChecks.push({
          id: 'general-lottery-total',
          level: 'ok',
          message: `景品総額は売上見込みの ${Math.round(ratio * 100)}% 目安内です（上限 ${cap.toLocaleString('ja-JP')}円）。`,
          detail: `売上見込み ${expectedSalesYen.toLocaleString('ja-JP')}円`,
        });
      }
    }

    const lumpSumPatterns = selectedPatterns.some((id) => id === 'P02' || id === 'P05');
    if (lumpSumPatterns || input.checkLumpSum) {
      const { maxAllowedYen: lumpMax, basis: lumpBasis } = calcLumpSumMaxPremium(rules, maxTransactionYen);
      if (maxPrizeYen > lumpMax) {
        numericChecks.push({
          id: 'lump-sum-max',
          level: 'red',
          message: `総付景品の目安上限 ${lumpMax.toLocaleString('ja-JP')}円を超える可能性があります（景品最高額 ${maxPrizeYen.toLocaleString('ja-JP')}円）。`,
          detail: lumpBasis,
        });
      } else if (maxPrizeYen > 0) {
        numericChecks.push({
          id: 'lump-sum-max',
          level: 'ok',
          message: `総付景品の目安上限内です（上限 ${lumpMax.toLocaleString('ja-JP')}円）。`,
          detail: lumpBasis,
        });
      }
    }

    if (isPaid && maxTransactionYen <= 0) {
      numericChecks.push({
        id: 'paid-no-tx',
        level: 'yellow',
        message: '有償キャンペーンですが取引最高額が未入力です。上限計算ができません。',
      });
    }
  } else {
    numericChecks.push({
      id: 'internal-scope',
      level: 'ok',
      message: '社内イベントのみの場合、景品表示法の適用外になりやすいですが、社外公開で一般懸賞と誤認されると論点が生じます。',
    });
  }

  for (const nc of numericChecks) {
    if (nc.level === 'red' || nc.level === 'yellow') {
      const numericSteps = rules.numericNextSteps?.[nc.id] || [
        { text: '左フォームの数値・条件を見直し、もう一度チェックを実行', kind: 'checklist' },
        { text: '消費者庁 景品表示法相談窓口へ問い合わせ', url: 'https://www.caa.go.jp/policies/policy/representation/contact', kind: 'consult' },
      ];
      flags.push({
        id: nc.id,
        level: nc.level,
        message: nc.message,
        action: nc.detail || '数値・条件を見直し、専門家確認を検討してください。',
        nextSteps: numericSteps,
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const f of flags) {
    const key = `${f.id}:${f.level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(f);
  }

  let overallLevel = 'ok';
  for (const f of deduped) {
    overallLevel = maxLevel(overallLevel, f.level);
  }

  const hasRedFlag = overallLevel === 'red';
  const headline =
    overallLevel === 'red'
      ? 'リスク高 — 専門家確認を強く推奨'
      : overallLevel === 'yellow'
        ? '要確認 — 論点あり'
        : '目安内 — 最終確認は専門家へ';

  const slackParagraph = buildSlackParagraph(input, deduped, overallLevel, rules);

  return {
    overallLevel,
    headline,
    hasRedFlag,
    flags: deduped,
    numericChecks,
    rulesVersion: rules.version,
    patternsVersion: patternsDoc.version,
    consultationResources: rules.consultationResources || [],
    referenceGuides: rules.referenceGuides || [],
    slackParagraph,
    disclaimer: rules.disclaimer,
  };
}

/**
 * @param {object} input
 * @param {Array} flags
 * @param {string} overallLevel
 * @param {object} rules
 */
function buildSlackParagraph(input, flags, overallLevel, rules) {
  const lines = [
    '【景品キャンペーン 一次チェック結果】',
    `対象: ${input.audience === 'internal' ? '社内イベント' : '一般向けキャンペーン'}`,
    `景品: ${input.prizeName || '（未入力）'} / 最高額 ${Number(input.maxPrizeYen || 0).toLocaleString('ja-JP')}円 / 総額 ${Number(input.totalPrizeYen || 0).toLocaleString('ja-JP')}円`,
    `判定目安: ${overallLevel === 'red' ? 'リスク高' : overallLevel === 'yellow' ? '要確認' : '目安内'}（ルール版 ${rules.version}）`,
  ];
  if (flags.length) {
    lines.push('論点:');
    flags.slice(0, 5).forEach((f) => {
      lines.push(`・[${f.level === 'red' ? '赤' : '黄'}] ${f.message}`);
      const step = f.nextSteps && f.nextSteps[0];
      if (step) lines.push(`  →次: ${step.text}`);
    });
  }
  lines.push('※法的助言ではありません。最終判断は専門家へ。');
  return lines.join('\n');
}

/**
 * Fisher-Yates shuffle (partial) using Web Crypto or injected randomFn.
 * @param {string[]} pool
 * @param {number} count
 * @param {{ allowDuplicate?: boolean, randomFn?: (n: number) => Uint32Array }} [opts]
 */
export function fisherYatesDraw(pool, count, opts = {}) {
  const names = pool.filter((n) => String(n).trim());
  const allowDuplicate = !!opts.allowDuplicate;
  const randomFn = opts.randomFn || defaultRandomFn;
  const n = names.length;
  if (n === 0 || count <= 0) return { winners: [], order: [], seedHex: null };

  const arr = names.slice();
  const winners = [];
  const order = [];
  const pickCount = allowDuplicate ? count : Math.min(count, n);

  for (let i = 0; i < pickCount; i++) {
    const remaining = allowDuplicate ? n : n - i;
    if (!allowDuplicate && remaining <= 0) break;
    const j = allowDuplicate
      ? secureRandomIndex(randomFn, n)
      : secureRandomIndex(randomFn, remaining);
    const picked = allowDuplicate ? arr[j] : (() => {
      const tmp = arr[i];
      arr[i] = arr[i + j];
      arr[i + j] = tmp;
      return arr[i];
    })();
    winners.push(picked);
    order.push({ round: i + 1, name: picked, index: j });
  }

  return { winners, order, algorithm: 'Fisher-Yates + CSPRNG' };
}

/**
 * @param {(n: number) => Uint32Array} randomFn
 * @param {number} max
 */
function secureRandomIndex(randomFn, max) {
  if (max <= 1) return 0;
  const uint32 = randomFn(1)[0];
  return uint32 % max;
}

function defaultRandomFn(count) {
  const buf = new Uint32Array(count);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }
  throw new Error('crypto.getRandomValues is not available');
}

/**
 * @param {string} text
 */
export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(data).digest('hex');
}

export const TOOL_VERSION = '1.1.0';

/** 抽選アルゴリズム（監査PDF・UI説明用） */
export const DRAW_ALGORITHM = {
  id: 'fisher-yates-webcrypto-v1',
  technical: 'Fisher-Yates + Web Crypto (crypto.getRandomValues)',
  plain: '名簿を1回シャッフルして当選者を選ぶ（Fisher-Yates＝公平シャッフルのデファクトスタンダード）＋ブラウザ標準の乱数（Web Crypto）',
  changePolicy: 'v1では方式固定。くじ引き式ではFisher-Yatesが事実上の標準。変更時はツール版を上げ、監査PDFに方式名を明記します。',
};

/**
 * @returns {{ seedBuf: Uint8Array, seedHex: string }}
 */
export function createSeedMaterial() {
  const seedBuf = new Uint8Array(16);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(seedBuf);
  } else {
    throw new Error('crypto.getRandomValues is not available');
  }
  const seedHex = Array.from(seedBuf).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { seedBuf, seedHex };
}

/**
 * @param {Uint8Array} seedBuf
 * @returns {(n: number) => Uint32Array}
 */
export function createSeededRandomFn(seedBuf) {
  let counter = 0;
  return (n) => {
    const buf = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      const b = new Uint8Array(4);
      globalThis.crypto.getRandomValues(b);
      buf[i] = new DataView(b.buffer).getUint32(0, true) ^ seedBuf[counter++ % seedBuf.length];
    }
    return buf;
  };
}

/**
 * @param {string[]} rosterLines
 * @param {number} winnerCount
 * @param {{ allowDuplicate?: boolean, exclude?: boolean, seedHex?: string, seedBuf?: Uint8Array, mode?: string }} [opts]
 */
export function runFairDraw(rosterLines, winnerCount, opts = {}) {
  const lines = rosterLines.map((s) => String(s).trim()).filter(Boolean);
  const count = Math.max(0, Number(winnerCount) || 0);
  const allowDuplicate = !!opts.allowDuplicate;
  const exclude = opts.exclude !== false;

  let seedBuf = opts.seedBuf;
  let seedHex = opts.seedHex;
  if (!seedBuf || !seedHex) {
    const material = createSeedMaterial();
    seedBuf = material.seedBuf;
    seedHex = material.seedHex;
  }

  const randomFn = createSeededRandomFn(seedBuf);
  let pool = lines.slice();
  const allWinners = [];
  const rounds = [];
  const roundsToRun = exclude && !allowDuplicate ? count : 1;
  const perRound = exclude && !allowDuplicate ? 1 : count;

  for (let r = 0; r < roundsToRun; r++) {
    const { winners } = fisherYatesDraw(pool, perRound, { allowDuplicate, randomFn });
    winners.forEach((w) => {
      allWinners.push(w);
      rounds.push({ round: r + 1, name: w });
    });
    if (exclude && !allowDuplicate) {
      pool = pool.filter((n) => !winners.includes(n));
      if (!pool.length) break;
    }
  }

  return {
    algorithmId: DRAW_ALGORITHM.id,
    algorithm: DRAW_ALGORITHM.technical,
    algorithmPlain: DRAW_ALGORITHM.plain,
    seedHex,
    rosterCount: lines.length,
    winners: allWinners,
    rounds,
    drawMode: 'simple',
    mode: opts.mode || 'draw',
  };
}

/**
 * 賞帯別抽選（1位1枠・2位3枠…）。exclude=true なら前の賞帯当選者を次の賞帯プールから除外。
 * @param {string[]} rosterLines
 * @param {Array<{ label?: string, count?: number, prizeName?: string }>} bands
 * @param {{ allowDuplicate?: boolean, exclude?: boolean, seedHex?: string, seedBuf?: Uint8Array, mode?: string }} [opts]
 */
export function runBandDraw(rosterLines, bands, opts = {}) {
  const lines = rosterLines.map((s) => String(s).trim()).filter(Boolean);
  const allowDuplicate = !!opts.allowDuplicate;
  const exclude = opts.exclude !== false;

  let seedBuf = opts.seedBuf;
  let seedHex = opts.seedHex;
  if (!seedBuf || !seedHex) {
    const material = createSeedMaterial();
    seedBuf = material.seedBuf;
    seedHex = material.seedHex;
  }

  const randomFn = createSeededRandomFn(seedBuf);
  let pool = lines.slice();
  const allWinners = [];
  /** @type {Array<{ label: string, prizeName: string, count: number, winners: string[] }>} */
  const bandResults = [];
  const rounds = [];

  for (const band of bands) {
    const label = String(band.label || '賞').trim() || '賞';
    const count = Math.max(0, Number(band.count) || 0);
    const prizeName = band.prizeName ? String(band.prizeName).trim() : '';
    if (count === 0) {
      bandResults.push({ label, prizeName, count: 0, winners: [] });
      continue;
    }
    const { winners } = fisherYatesDraw(pool, count, { allowDuplicate, randomFn });
    bandResults.push({ label, prizeName, count, winners: winners.slice() });
    winners.forEach((w) => {
      allWinners.push(w);
      rounds.push({ round: rounds.length + 1, name: w, band: label });
    });
    if (exclude && !allowDuplicate) {
      pool = pool.filter((n) => !winners.includes(n));
      if (!pool.length) break;
    }
  }

  return {
    algorithmId: DRAW_ALGORITHM.id,
    algorithm: DRAW_ALGORITHM.technical,
    algorithmPlain: DRAW_ALGORITHM.plain,
    seedHex,
    rosterCount: lines.length,
    winners: allWinners,
    bands: bandResults,
    rounds,
    drawMode: 'bands',
    mode: opts.mode || 'draw',
  };
}

/**
 * @param {string[]|string} rosterLines
 */
export async function finalizeDrawAudit(draw, rosterLines) {
  const lines = Array.isArray(rosterLines)
    ? rosterLines.map((s) => String(s).trim()).filter(Boolean)
    : String(rosterLines).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const rosterSha256 = await sha256Hex(lines.join('\n') + '\n');
  return { ...draw, rosterSha256 };
}
