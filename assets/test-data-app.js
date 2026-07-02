/**
 * test-data.html — UI wiring
 */
import {
  COUNT_OPTIONS,
  MAX_ROWS,
  PAYROLL_MONTHS_PER_EMPLOYEE,
  PRESET_META,
  EMPLOYEE_HEADERS,
  applyEmployeeHeaderTemplate,
  csvWithBom,
  defaultFilename,
  downloadCsvBlob,
  generateDataset,
  getDefaultReferenceYear,
  validateGenerateOptions,
} from './test-data-engine.js';
import { writeTestDataHandoff } from './test-data-handoff.js';

const NORMALIZE_LINE_LIMIT = 500;

const els = {
  idPrefix: document.getElementById('id-prefix'),
  emailDomain: document.getElementById('email-domain'),
  seed: document.getElementById('seed-input'),
  mineToggle: document.getElementById('mine-toggle'),
  referenceYear: document.getElementById('reference-year'),
  hireYearMin: document.getElementById('hire-year-min'),
  birthDateFormat: document.getElementById('birth-date-format'),
  hireDateFormat: document.getElementById('hire-date-format'),
  quoteZipCsv: document.getElementById('quote-zip-csv'),
  roundSalary1000: document.getElementById('round-salary-1000'),
  includeForeignNames: document.getElementById('include-foreign-names'),
  spaceInDiverseNames: document.getElementById('space-in-diverse-names'),
  payrollMonthlyVariation: document.getElementById('payroll-monthly-variation'),
  outputOptionsPanel: document.getElementById('output-options-panel'),
  roundSalaryWrap: document.getElementById('round-salary-wrap'),
  foreignNamesWrap: document.getElementById('foreign-names-wrap'),
  spaceDiverseNamesWrap: document.getElementById('space-diverse-names-wrap'),
  payrollVariationWrap: document.getElementById('payroll-variation-wrap'),
  employeeYearPanel: document.getElementById('employee-year-panel'),
  dateFormatPanel: document.getElementById('date-format-panel'),
  headerCustomPanel: document.getElementById('header-custom-panel'),
  headerFields: document.getElementById('header-fields'),
  btnHeaderReset: document.getElementById('btn-header-reset'),
  countSegment: document.getElementById('count-segment'),
  btnGenerate: document.getElementById('btn-generate'),
  btnDownload: document.getElementById('btn-download'),
  btnCopy: document.getElementById('btn-copy'),
  btnOpenNormalize: document.getElementById('btn-open-normalize'),
  btnReseed: document.getElementById('btn-reseed'),
  status: document.getElementById('status'),
  previewHead: document.getElementById('preview-head'),
  previewBody: document.getElementById('preview-body'),
  previewNote: document.getElementById('preview-note'),
  progressWrap: document.getElementById('progress-wrap'),
  progressBar: document.getElementById('progress-bar'),
};

/** @type {'employee'|'payroll'|'customer'|'transaction'} */
let preset = 'employee';
let count = 100;
/** @type {{ headers: string[], rows: Record<string, string|number>[], csv: string }|null} */
let lastResult = null;

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('font-semibold', isError);
  els.status.classList.toggle('text-slate-500', !isError);
}

function isEmployeeLike() {
  return preset === 'employee' || preset === 'payroll';
}

function outputLineCount(result = lastResult) {
  if (!result) return 0;
  return result.rows.length + 1;
}

function syncNormalizeButton() {
  if (!els.btnOpenNormalize) return;
  const lines = outputLineCount();
  const canHandoff = Boolean(lastResult) && isEmployeeLike() && lines > 0 && lines <= NORMALIZE_LINE_LIMIT;
  els.btnOpenNormalize.disabled = !canHandoff;
  els.btnOpenNormalize.title = canHandoff
    ? ''
    : lastResult && lines > NORMALIZE_LINE_LIMIT
      ? `全角半角整えは ${NORMALIZE_LINE_LIMIT} 行までです（ヘッダー含む）。件数を減らすかCSVダウンロードをご利用ください。`
      : '社員マスタまたは給与明細を生成後に使えます。';
}

function readOptions() {
  const seed = Number.parseInt(els.seed.value, 10);
  const referenceYear = Number.parseInt(els.referenceYear?.value ?? '', 10) || getDefaultReferenceYear();
  const hireYearMin = Number.parseInt(els.hireYearMin?.value ?? '', 10) || 2000;
  const defaultPrefix = isEmployeeLike() ? `EMP-${referenceYear}` : 'CUST';
  const exportHeaders = preset === 'employee' ? readEmployeeExportHeaders() : undefined;
  return {
    preset,
    count,
    seed: Number.isFinite(seed) ? seed : 42,
    idPrefix: (els.idPrefix.value || defaultPrefix).trim(),
    emailDomain: (els.emailDomain.value || 'example.com').trim(),
    mineRate: els.mineToggle.checked && preset === 'employee' ? 0.05 : 0,
    referenceYear,
    hireYearMin,
    hireYearMax: referenceYear,
    exportHeaders,
    birthDateFormat: els.birthDateFormat?.value || 'slash',
    hireDateFormat: els.hireDateFormat?.value || 'dash',
    quoteZipInCsv: els.quoteZipCsv?.checked !== false,
    roundSalaryTo1000: els.roundSalary1000?.checked !== false,
    includeForeignNames: els.includeForeignNames?.checked !== false,
    spaceInDiverseNames: els.spaceInDiverseNames?.checked !== false,
    payrollMonthlyVariation: els.payrollMonthlyVariation?.checked !== false,
  };
}

function readEmployeeExportHeaders() {
  if (!els.headerFields) return undefined;
  const inputs = /** @type {HTMLInputElement[]} */ ([...els.headerFields.querySelectorAll('[data-header-key]')]);
  if (inputs.length === 0) return undefined;
  return inputs.map((input) => input.value.trim());
}

function buildHeaderFields(labels = EMPLOYEE_HEADERS) {
  if (!els.headerFields) return;
  els.headerFields.innerHTML = EMPLOYEE_HEADERS.map((key, i) => {
    const label = labels[i] ?? key;
    return `<label class="block space-y-0.5">
      <span class="text-[10px] text-slate-500 font-mono">${key}</span>
      <input type="text" class="sg-input text-xs font-mono py-1.5" data-header-key="${key}" value="${label.replace(/"/g, '&quot;')}" maxlength="40">
    </label>`;
  }).join('');
}

function applyHeaderTemplate(templateId) {
  const labels = applyEmployeeHeaderTemplate(EMPLOYEE_HEADERS, templateId);
  buildHeaderFields(labels);
}

function applyDateFormatPreset(style) {
  if (els.birthDateFormat) els.birthDateFormat.value = style;
  if (els.hireDateFormat) els.hireDateFormat.value = style;
}

function syncEmployeePanels() {
  const employee = preset === 'employee';
  const employeeLike = isEmployeeLike();
  const showOutput = employeeLike || preset === 'customer';
  if (els.employeeYearPanel) els.employeeYearPanel.classList.toggle('hidden', !employeeLike);
  if (els.dateFormatPanel) els.dateFormatPanel.classList.toggle('hidden', !employee);
  if (els.headerCustomPanel) els.headerCustomPanel.classList.toggle('hidden', !employee);
  if (els.outputOptionsPanel) els.outputOptionsPanel.classList.toggle('hidden', !showOutput);
  if (els.roundSalaryWrap) els.roundSalaryWrap.classList.toggle('hidden', !employeeLike);
  if (els.foreignNamesWrap) els.foreignNamesWrap.classList.toggle('hidden', !employeeLike);
  if (els.spaceDiverseNamesWrap) {
    els.spaceDiverseNamesWrap.classList.toggle('hidden', !employeeLike);
    if (els.includeForeignNames) els.spaceInDiverseNames.disabled = !els.includeForeignNames.checked;
  }
  if (els.payrollVariationWrap) els.payrollVariationWrap.classList.toggle('hidden', preset !== 'payroll');
  if (els.emailDomain) {
    const emailWrap = els.emailDomain.closest('label');
    if (emailWrap) emailWrap.classList.toggle('hidden', !employee);
  }
  if (els.mineToggle) {
    const mineWrap = els.mineToggle.closest('label');
    if (mineWrap) mineWrap.classList.toggle('hidden', !employee);
  }
}

function syncIdPrefixFromReferenceYear() {
  if (!isEmployeeLike() || !els.referenceYear) return;
  const y = Number.parseInt(els.referenceYear.value, 10) || getDefaultReferenceYear();
  const next = `EMP-${y}`;
  const current = els.idPrefix.value.trim();
  if (current === '' || /^EMP-\d{4}$/.test(current)) {
    els.idPrefix.value = next;
  }
  els.idPrefix.placeholder = next;
}

function syncIdPrefixPlaceholder() {
  if (isEmployeeLike()) {
    syncIdPrefixFromReferenceYear();
  } else {
    if (els.idPrefix.value === '' || /^EMP-\d{4}$/.test(els.idPrefix.value.trim())) {
      els.idPrefix.value = 'CUST';
    }
    els.idPrefix.placeholder = 'CUST';
  }
}

function renderPreview(result) {
  const previewRows = result.rows.slice(0, 10);
  const internal = result.internalHeaders || result.headers;
  els.previewHead.innerHTML = result.headers
    .map((h) => `<th class="px-2 py-1.5 text-left font-semibold text-slate-700 border-b border-slate-200">${h}</th>`)
    .join('');
  els.previewBody.innerHTML = previewRows
    .map(
      (row) =>
        `<tr class="border-b border-slate-100">${internal
          .map((k) => {
            const val = row[k];
            const esc = String(val).replace(/"/g, '&quot;');
            return `<td class="px-2 py-1.5 text-slate-600 max-w-[12rem] truncate" title="${esc}">${val}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('');
  const more = result.rows.length > 10 ? `（先頭10件を表示 · 全 ${result.rows.length.toLocaleString()} 件）` : `（全 ${result.rows.length.toLocaleString()} 件）`;
  els.previewNote.textContent = more;
  els.btnDownload.disabled = false;
  els.btnCopy.disabled = !document.hasFocus();
  syncNormalizeButton();
}

async function generateWithYield() {
  const options = readOptions();
  const check = validateGenerateOptions(options.count, options.seed, {
    referenceYear: options.referenceYear,
    hireYearMin: options.hireYearMin,
    hireYearMax: options.hireYearMax,
    preset: options.preset,
  });
  if (!check.ok) {
    setStatus(check.message, true);
    return;
  }

  els.btnGenerate.disabled = true;
  els.btnDownload.disabled = true;
  els.btnCopy.disabled = true;
  if (els.btnOpenNormalize) els.btnOpenNormalize.disabled = true;
  els.progressWrap.classList.remove('hidden');
  els.progressBar.style.width = '0%';

  try {
    if (options.count > 500) {
      setStatus('生成中… 画面が固まらないよう分割処理しています。');
      await new Promise((r) => requestAnimationFrame(r));
      els.progressBar.style.width = '30%';
      await new Promise((r) => setTimeout(r, 0));
    }

    const result = generateDataset(options);
    lastResult = result;
    els.progressBar.style.width = '100%';
    renderPreview(result);
    const unit =
      options.preset === 'payroll'
        ? `社員 ${options.count.toLocaleString()} 人 · 明細 ${result.rows.length.toLocaleString()} 行`
        : `${result.rows.length.toLocaleString()} 件`;
    setStatus(
      `${PRESET_META[options.preset].label} · ${unit} · シード ${options.seed} — CSVダウンロードまたはコピーできます。`,
    );
  } catch (e) {
    setStatus(e.message || '生成に失敗しました。', true);
    lastResult = null;
    syncNormalizeButton();
  } finally {
    els.btnGenerate.disabled = false;
    setTimeout(() => {
      els.progressWrap.classList.add('hidden');
      els.progressBar.style.width = '0%';
    }, 400);
  }
}

function downloadCsv() {
  if (!lastResult) return;
  const options = readOptions();
  downloadCsvBlob(lastResult.csv, defaultFilename(options.idPrefix, options.preset));
  setStatus('CSV をダウンロードしました。Excel で文字化けする場合は「データから」取り込みを試してください。');
}

async function copyCsv() {
  if (!lastResult) return;
  if (!document.hasFocus()) {
    setStatus('ウィンドウを一度クリックしてフォーカス後に「コピー」を押してください。', true);
    return;
  }
  try {
    const text = csvWithBom(lastResult.csv);
    await navigator.clipboard.writeText(text);
    setStatus('CSV をクリップボードにコピーしました。');
  } catch (e) {
    const raw = e?.message || '';
    if (raw.includes('Document is not focused') || e?.name === 'NotAllowedError') {
      setStatus('コピーはブラウザが前面表示・フォーカス中のみ使えます。', true);
      return;
    }
    setStatus(`コピーに失敗しました: ${raw || 'CSVダウンロードをご利用ください。'}`, true);
  }
}

function openNormalize() {
  if (!lastResult) return;
  const lines = outputLineCount();
  if (lines > NORMALIZE_LINE_LIMIT) {
    setStatus(`全角半角整えは ${NORMALIZE_LINE_LIMIT} 行までです。件数を減らしてください。`, true);
    return;
  }
  if (!writeTestDataHandoff(lastResult.csv, 'csv_roster')) {
    setStatus('ブラウザのストレージに保存できませんでした。CSVダウンロードをご利用ください。', true);
    return;
  }
  window.location.href = 'normalize.html';
}

function randomSeed() {
  els.seed.value = String(Math.floor(Math.random() * 999999) + 1);
}

function countHintText(n) {
  if (preset === 'payroll') {
    const rows = n * PAYROLL_MONTHS_PER_EMPLOYEE;
    return `社員 ${n.toLocaleString()} 人 → 明細 ${rows.toLocaleString()} 行（×${PAYROLL_MONTHS_PER_EMPLOYEE}ヶ月 · 最大 ${MAX_ROWS.toLocaleString()} 行）`;
  }
  return `${n.toLocaleString()} 件（最大 ${MAX_ROWS.toLocaleString()}）`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.SUGUDASU_SEGMENT) {
    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'preset-segment',
      order: ['employee', 'payroll', 'customer', 'transaction'],
      initial: 'employee',
      hints: {
        employee: `<strong>社員マスタ:</strong> ${PRESET_META.employee.description}`,
        payroll: `<strong>給与明細:</strong> ${PRESET_META.payroll.description}`,
        customer: `<strong>顧客マスタ:</strong> ${PRESET_META.customer.description}`,
        transaction: `<strong>取引明細:</strong> ${PRESET_META.transaction.description}`,
      },
      hintId: 'preset-hint',
      modeClassMap: {
        employee: 'sg-segment--mode-ec',
        payroll: 'sg-segment--mode-ec',
        customer: 'sg-segment--mode-ec',
        transaction: 'sg-segment--mode-csv',
      },
      onChange: (value) => {
        preset = value;
        syncEmployeePanels();
        syncIdPrefixPlaceholder();
        lastResult = null;
        els.btnDownload.disabled = true;
        els.previewBody.innerHTML = '';
        els.previewHead.innerHTML = '';
        els.previewNote.textContent = '「生成」を押すとプレビューが表示されます。';
        syncNormalizeButton();
        const countHint = document.getElementById('count-hint');
        if (countHint) countHint.innerHTML = countHintText(count);
      },
    });

    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'count-segment',
      order: COUNT_OPTIONS.map(String),
      initial: '100',
      hints: Object.fromEntries(COUNT_OPTIONS.map((n) => [String(n), countHintText(n)])),
      hintId: 'count-hint',
      onChange: (value) => {
        count = Number.parseInt(value, 10) || 100;
      },
    });
  }

  els.btnGenerate.addEventListener('click', () => generateWithYield());
  els.btnDownload.addEventListener('click', () => downloadCsv());
  els.btnCopy.addEventListener('click', () => copyCsv());
  if (els.btnOpenNormalize) els.btnOpenNormalize.addEventListener('click', () => openNormalize());
  els.btnReseed.addEventListener('click', () => randomSeed());
  if (els.referenceYear) {
    els.referenceYear.value = String(getDefaultReferenceYear());
    els.referenceYear.addEventListener('change', () => syncIdPrefixFromReferenceYear());
    els.referenceYear.addEventListener('input', () => syncIdPrefixFromReferenceYear());
  }

  buildHeaderFields();
  document.querySelectorAll('[data-header-template]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyHeaderTemplate(btn.getAttribute('data-header-template') || 'default');
    });
  });
  if (els.btnHeaderReset) {
    els.btnHeaderReset.addEventListener('click', () => applyHeaderTemplate('default'));
  }
  document.querySelectorAll('[data-date-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyDateFormatPreset(btn.getAttribute('data-date-preset') || 'slash');
    });
  });
  if (els.includeForeignNames && els.spaceInDiverseNames) {
    els.includeForeignNames.addEventListener('change', () => syncEmployeePanels());
  }

  els.btnDownload.disabled = true;
  els.btnCopy.disabled = true;
  syncEmployeePanels();
  syncIdPrefixPlaceholder();
  syncNormalizeButton();
  randomSeed();
  setStatus('プリセットと件数を選び、「生成」を押してください。データはブラウザ内だけで作られます。');

  window.addEventListener('focus', () => {
    if (lastResult) els.btnCopy.disabled = false;
  });
  window.addEventListener('blur', () => {
    els.btnCopy.disabled = true;
  });
});
