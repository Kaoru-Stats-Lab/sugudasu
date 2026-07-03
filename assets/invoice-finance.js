/**
 * 請求書 — 源泉徴収 · 内税混在（Finance 拡張）
 * SSOT: docs/notes/INVOICE_FINANCE_EXTENSION_SPEC.md
 */

export const WITHHOLDING_RATE_STANDARD = 0.1021;
export const WITHHOLDING_RATE_EXCESS = 0.2042;
export const PROGRESSIVE_THRESHOLD = 1_000_000;
/** 100万円以下部分の源泉税（No.2792 固定値） */
export const PROGRESSIVE_TAX_AT_1M = 102_100;
/** 手取契約で二段階税率に切り替わる手取額の上限（No.2792） */
export const HAND_TAKE_PROGRESSIVE_THRESHOLD = 897_900;
/** 手取 ÷ 0.8979 で支払金額を求める（10.21% 帯） */
export const NET_TO_GROSS_RATE_UNDER = 0.8979;
/** （手取 − 102,100）÷ 0.7958 で支払金額を求める（20.42% 帯） */
export const NET_TO_GROSS_RATE_EXCESS = 0.7958;
export const YEN_INPUT_MAX = 99_999_999;

/** @typedef {'floor' | 'round' | 'ceil'} RoundingMode */

/**
 * @param {number} value
 * @param {RoundingMode} [mode]
 */
export function applyRounding(value, mode = 'floor') {
  const v = Number(value) || 0;
  if (mode === 'round') return Math.round(v);
  if (mode === 'ceil') return Math.ceil(v);
  return Math.floor(v);
}

/**
 * @param {string | number} raw
 */
export function parseYenInput(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const digits = String(raw ?? '').replace(/[^\d.-]/g, '');
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Array<{ qty?: number, price?: number, taxRate?: number, spacer?: boolean }>} items
 * @param {RoundingMode} [rounding]
 */
export function computeInvoiceTotals(items, rounding = 'floor') {
  let subtotal = 0;
  let base8 = 0;
  let base10 = 0;

  for (const item of items || []) {
    if (item.spacer) continue;
    const name = String(item.name ?? '').trim();
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    if (!name && price === 0) continue;
    const line = Math.round(qty * price);
    subtotal += line;
    if (item.taxRate === 10) base10 += line;
    else if (item.taxRate === 8) base8 += line;
  }

  const calcBase10 = Math.max(0, base10);
  const calcBase8 = Math.max(0, base8);
  const tax10 = applyRounding(calcBase10 * 0.1, rounding);
  const tax8 = applyRounding(calcBase8 * 0.08, rounding);
  const totalTax = tax10 + tax8;
  const totalInTax = subtotal + totalTax;

  return {
    subtotal,
    base8: calcBase8,
    base10: calcBase10,
    tax8,
    tax10,
    totalTax,
    totalInTax,
  };
}

/**
 * @param {number} baseYen
 * @param {{ progressive?: boolean, rounding?: RoundingMode, rateStandard?: number, rateExcess?: number, threshold?: number }} [options]
 */
export function computeWithholdingTax(baseYen, options = {}) {
  const base = Math.max(0, Math.min(YEN_INPUT_MAX, Number(baseYen) || 0));
  const progressive = options.progressive !== false;
  const rateStd = options.rateStandard ?? WITHHOLDING_RATE_STANDARD;
  const rateExcess = options.rateExcess ?? WITHHOLDING_RATE_EXCESS;
  const threshold = options.threshold ?? PROGRESSIVE_THRESHOLD;
  const rounding = options.rounding ?? 'floor';

  let raw;
  if (!progressive || base <= threshold) {
    raw = base * rateStd;
  } else {
    // No.2792: （支払金額 − 100万円）× 20.42% ＋ 102,100円
    raw = (base - threshold) * rateExcess + PROGRESSIVE_TAX_AT_1M;
  }
  return applyRounding(raw, rounding);
}

/**
 * 手取契約 — 手取希望額から支払金額（源泉の対象）を逆算（No.2792）
 * @param {number} netYen
 * @param {{ rounding?: RoundingMode }} [options]
 */
export function grossPaymentFromNetHandTake(netYen, options = {}) {
  const net = Math.max(0, Math.min(YEN_INPUT_MAX, Number(netYen) || 0));
  const rounding = options.rounding ?? 'floor';
  if (net === 0) return 0;
  if (net <= HAND_TAKE_PROGRESSIVE_THRESHOLD) {
    return applyRounding(net / NET_TO_GROSS_RATE_UNDER, rounding);
  }
  return applyRounding((net - PROGRESSIVE_TAX_AT_1M) / NET_TO_GROSS_RATE_EXCESS, rounding);
}

/**
 * @param {{ subtotal: number, totalInTax: number, enabled?: boolean, contractMode?: 'gross' | 'net', netTargetYen?: string | number, baseMode?: 'ex-tax' | 'in-tax', rounding?: RoundingMode, progressive?: boolean }} params
 */
export function computeWithholdingSummary(params) {
  const {
    subtotal,
    totalInTax,
    enabled = false,
    contractMode = 'gross',
    netTargetYen = 0,
    baseMode = 'ex-tax',
    rounding = 'floor',
    progressive = true,
  } = params;

  if (!enabled) {
    return {
      enabled: false,
      contractMode: 'gross',
      withholdingBase: 0,
      withholdingTax: 0,
      netPayment: totalInTax,
      progressiveApplied: false,
    };
  }

  if (contractMode === 'net') {
    const netTarget = parseYenInput(netTargetYen);
    const grossPayment = grossPaymentFromNetHandTake(netTarget, { rounding });
    const withholdingTax = computeWithholdingTax(grossPayment, { rounding, progressive });
    return {
      enabled: true,
      contractMode: 'net',
      netTarget,
      grossPayment,
      withholdingBase: grossPayment,
      withholdingTax,
      netFromContract: grossPayment - withholdingTax,
      netPayment: totalInTax - withholdingTax,
      progressiveApplied: progressive && grossPayment > PROGRESSIVE_THRESHOLD,
    };
  }

  const base = baseMode === 'in-tax' ? totalInTax : subtotal;
  const withholdingTax = computeWithholdingTax(base, { rounding, progressive });
  return {
    enabled: true,
    contractMode: 'gross',
    withholdingBase: base,
    withholdingTax,
    netPayment: totalInTax - withholdingTax,
    progressiveApplied: progressive && base > PROGRESSIVE_THRESHOLD,
  };
}

/**
 * @param {number} taxInclusiveTotal
 * @param {number} ratePercent
 * @param {RoundingMode} [rounding]
 */
export function splitInclusiveTaxAmount(taxInclusiveTotal, ratePercent, rounding = 'floor') {
  const total = Math.max(0, Math.min(YEN_INPUT_MAX, Number(taxInclusiveTotal) || 0));
  if (total === 0) {
    return { taxInclusiveTotal: 0, base: 0, tax: 0, ratePercent };
  }
  const rate = Number(ratePercent) / 100;
  const base = applyRounding(total / (1 + rate), rounding);
  const tax = total - base;
  return { taxInclusiveTotal: total, base, tax, ratePercent };
}

/**
 * 行ごと端数の比較用（同一税率を chunk 単位で分割して合算）
 * @param {number} taxInclusiveTotal
 * @param {number} ratePercent
 * @param {number} [chunkYen]
 * @param {RoundingMode} [rounding]
 */
export function compareInclusiveTaxPerChunk(
  taxInclusiveTotal,
  ratePercent,
  chunkYen = 10000,
  rounding = 'floor',
) {
  const total = Math.max(0, Number(taxInclusiveTotal) || 0);
  const block = splitInclusiveTaxAmount(total, ratePercent, rounding);
  if (total === 0) {
    return { block, perChunk: { base: 0, tax: 0 }, taxDiff: 0, baseDiff: 0 };
  }
  let sumBase = 0;
  let sumTax = 0;
  let remaining = total;
  const chunk = Math.max(1, Math.floor(chunkYen));
  while (remaining > 0) {
    const partTotal = Math.min(chunk, remaining);
    const part = splitInclusiveTaxAmount(partTotal, ratePercent, rounding);
    sumBase += part.base;
    sumTax += part.tax;
    remaining -= partTotal;
  }
  return {
    block,
    perChunk: { base: sumBase, tax: sumTax },
    baseDiff: sumBase - block.base,
    taxDiff: sumTax - block.tax,
  };
}

/**
 * @param {{ amount10?: number, amount8?: number, rounding?: RoundingMode, comparePerLine?: boolean, chunkYen?: number }} params
 */
export function splitMixedInclusiveTax(params) {
  const rounding = params.rounding ?? 'floor';
  const amount10 = Math.max(0, parseYenInput(params.amount10));
  const amount8 = Math.max(0, parseYenInput(params.amount8));
  const block10 = splitInclusiveTaxAmount(amount10, 10, rounding);
  const block8 = splitInclusiveTaxAmount(amount8, 8, rounding);

  /** @type {Array<{ ratePercent: number, block: ReturnType<typeof splitInclusiveTaxAmount>, compare?: ReturnType<typeof compareInclusiveTaxPerChunk> }>} */
  const rows = [
    { ratePercent: 10, block: block10 },
    { ratePercent: 8, block: block8 },
  ];

  if (params.comparePerLine) {
    rows[0].compare = compareInclusiveTaxPerChunk(amount10, 10, params.chunkYen, rounding);
    rows[1].compare = compareInclusiveTaxPerChunk(amount8, 8, params.chunkYen, rounding);
  }

  return {
    rows,
    totalInclusive: amount10 + amount8,
    totalBase: block10.base + block8.base,
    totalTax: block10.tax + block8.tax,
  };
}

/**
 * @param {ReturnType<typeof splitMixedInclusiveTax>} result
 */
export function formatMixedTaxCopyText(result) {
  const lines = [
    '【内税 8% / 10% 分離（参考計算）】',
    '税率\t税込\t本体\t消費税',
  ];
  for (const row of result.rows) {
    const b = row.block;
    lines.push(`${b.ratePercent}%\t${b.taxInclusiveTotal}\t${b.base}\t${b.tax}`);
  }
  lines.push(`合計\t${result.totalInclusive}\t${result.totalBase}\t${result.totalTax}`);
  lines.push('※インボイスは税率ごとに端数処理を1回。行ごと端数との差は検算用です。');
  return lines.join('\n');
}

export const WITHHOLDING_NTA_PRIMARY = {
  label: '国税庁 No.2792（源泉徴収・10.21% / 100万円超 20.42%）',
  url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2792_qa.htm',
};

/** @deprecated 互換用 — 正本は WITHHOLDING_NTA_PRIMARY */
export const WITHHOLDING_NTA_REFERENCES = [WITHHOLDING_NTA_PRIMARY];

export const MIXED_TAX_NTA_REFERENCE = {
  label: 'インボイス制度（税率ごとの記載）',
  url: 'https://www.invoice-kohyo.nta.go.jp/',
};

export const WITHHOLDING_DISCLAIMER =
  '※本ツールで提供する計算結果は、一般的な税率（10.21%）に基づく計算例です。実際の源泉徴収義務の有無や正確な税額、端数処理の取り扱いについては、契約内容や職種により異なる場合があります。実務でのご利用にあたっては、下記の国税庁公式情報をご確認いただくか、税理士等の専門家へご相談ください。';

export const MIXED_TAX_DISCLAIMER =
  '本ツールは税務申告の正確性を保証するものではありません。一般的な計算例としてご利用ください。内税混在分離は invoice 管轄です（warikan では扱いません）。';
