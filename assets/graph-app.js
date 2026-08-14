/**
 * SUGUDASU Graph — tool page app
 * Pipeline: TSV → Observable → Decision → Spec → Renderer
 * Color Must Settings only (no Graph Editor).
 * Expectation UX: Intent 見本アイコン · 空状態サンプル · 貼付でプレビュー更新
 */
'use strict';

import { extractObservableFromTsv } from './graph-observable-extractor.js';
import { createGraphDecisionEngine } from './graph-decision-engine.js';
import { buildGraphSpec } from './graph-spec-builder.js';
import { renderGraph, wrapDeckHalfLeftPreview } from './graph-renderer.js';
import {
  normalizeHex,
  buildPresentationFromSettings,
  listSpecCategories,
} from './graph-presentation-settings.js';

const SAMPLE_TREND =
  '月\t来場者\n6月\t1000\n7月\t1100\n8月\t1400\n9月\t1300\n10月\t1250\n11月\t1180\n12月\t1600\n';
const SAMPLE_COMPARE =
  '拠点\t件数\n東京\t120\n大阪\t95\n名古屋\t70\n福岡\t55\n';
const SAMPLE_RANK =
  '商品\t売上\nA\t210\nB\t180\nC\t150\nD\t90\nE\t60\n';
const SAMPLE_TARGET =
  '部門\t実績\t目標\n第一営業\t85\t90\n第二営業\t72\t70\n第三営業\t64\t80\n';
const SAMPLES = {
  TREND: SAMPLE_TREND,
  COMPARISON: SAMPLE_COMPARE,
  RANKING: SAMPLE_RANK,
  TARGET_VS_ACTUAL: SAMPLE_TARGET,
};

const SAMPLE_SET = new Set(Object.values(SAMPLES));

/** 装飾用ミニ図（実Rendererではない · 期待合わせ専用） */
function thumbSvg(kind) {
  const blue = '#1D4ED8';
  const orange = '#EA580C';
  const gray = '#94A3B8';
  const box = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 44" width="72" height="44" aria-hidden="true" class="shrink-0">${inner}</svg>`;

  switch (kind) {
    case 'line':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<polyline fill="none" stroke="${blue}" stroke-width="2" points="12,30 24,22 36,26 48,14 60,18"/>`
      );
    case 'bars':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="14" y="22" width="8" height="12" fill="${blue}"/>` +
          `<rect x="26" y="16" width="8" height="18" fill="${blue}"/>` +
          `<rect x="38" y="12" width="8" height="22" fill="${orange}"/>` +
          `<rect x="50" y="20" width="8" height="14" fill="${blue}"/>`
      );
    case 'rank':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="12" y="12" width="40" height="6" fill="${blue}"/>` +
          `<rect x="12" y="20" width="28" height="6" fill="${blue}"/>` +
          `<rect x="12" y="28" width="18" height="6" fill="${gray}"/>`
      );
    case 'target_line':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="14" y="22" width="8" height="12" fill="${blue}"/>` +
          `<rect x="26" y="18" width="8" height="16" fill="${blue}"/>` +
          `<rect x="38" y="14" width="8" height="20" fill="${blue}"/>` +
          `<rect x="50" y="20" width="8" height="14" fill="${blue}"/>` +
          `<line x1="12" y1="16" x2="60" y2="16" stroke="${orange}" stroke-width="2"/>`
      );
    case 'bullet':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="12" y="14" width="44" height="6" fill="#E2E8F0"/>` +
          `<rect x="12" y="14" width="28" height="6" fill="${blue}"/>` +
          `<line x1="48" y1="12" x2="48" y2="22" stroke="${orange}" stroke-width="2"/>` +
          `<rect x="12" y="26" width="44" height="6" fill="#E2E8F0"/>` +
          `<rect x="12" y="26" width="34" height="6" fill="${blue}"/>` +
          `<line x1="40" y1="24" x2="40" y2="34" stroke="${orange}" stroke-width="2"/>`
      );
    case 'grouped':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="14" y="18" width="6" height="16" fill="${blue}"/>` +
          `<rect x="21" y="14" width="6" height="20" fill="${orange}"/>` +
          `<rect x="34" y="20" width="6" height="14" fill="${blue}"/>` +
          `<rect x="41" y="16" width="6" height="18" fill="${orange}"/>` +
          `<rect x="54" y="22" width="6" height="12" fill="${blue}"/>` +
          `<rect x="61" y="12" width="6" height="22" fill="${orange}"/>`
      );
    case 'pieish':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="14" y="14" width="10" height="20" fill="${blue}"/>` +
          `<rect x="28" y="18" width="10" height="16" fill="${gray}"/>` +
          `<rect x="42" y="12" width="10" height="22" fill="${orange}"/>`
      );
    case 'bridge':
      return box(
        `<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>` +
          `<rect x="14" y="20" width="8" height="14" fill="${blue}"/>` +
          `<rect x="26" y="14" width="8" height="10" fill="${orange}"/>` +
          `<rect x="38" y="18" width="8" height="8" fill="${gray}"/>` +
          `<rect x="50" y="16" width="8" height="18" fill="${blue}"/>`
      );
    default:
      return box(`<rect x="8" y="8" width="56" height="28" fill="#F8FAFC" stroke="#E2E8F0"/>`);
  }
}

const INTENT_OPTIONS = [
  { id: 'TREND', label: '推移を見せたい', thumb: 'line', hint: '折れ線 · 時系列', previewReady: true },
  { id: 'COMPARISON', label: '比較したい', thumb: 'bars', hint: '棒で比べる', previewReady: true },
  { id: 'RANKING', label: '順位を見せたい', thumb: 'rank', hint: '横棒の並び', previewReady: true },
  { id: 'TARGET_VS_ACTUAL', label: '達成を見せたい', thumb: 'target_line', hint: '目標線 · Bullet · 並棒', previewReady: true },
  {
    id: 'BREAKDOWN',
    label: '内訳を見せたい',
    thumb: 'pieish',
    hint: '準備中（プレビュー未対応）',
    previewReady: false,
  },
  {
    id: 'BRIDGE',
    label: '増減要因を見せたい',
    thumb: 'bridge',
    hint: '準備中（プレビュー未対応）',
    previewReady: false,
  },
];

const CND_OPTIONS = [
  { id: 'target_as_line', label: '実績の棒に目標線', thumb: 'target_line' },
  { id: 'target_as_marker', label: 'Bullet（目標マーカー）', thumb: 'bullet' },
  { id: 'target_as_series', label: '実績と目標を並棒', thumb: 'grouped' },
];

function cardClass(selected, disabled) {
  if (disabled) {
    return 'flex items-start gap-3 text-left border rounded-md p-2.5 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed';
  }
  return (
    'flex items-start gap-3 text-left border rounded-md p-2.5 cursor-pointer transition ' +
    (selected
      ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300'
      : 'border-slate-200 bg-white hover:border-slate-300')
  );
}

export async function mountGraphApp(root) {
  if (!root) return;

  root.innerHTML = `
    <section class="sg-panel space-y-3" aria-labelledby="sg-graph-data-h">
      <h2 id="sg-graph-data-h" class="text-sm font-bold text-slate-700">1. 表を貼る</h2>
      <p class="text-xs text-slate-600 leading-relaxed">
        いまは見本の表です。下のプレビューが<strong>こんなグラフになる</strong>例です。Excelから自分の表に差し替えると、すぐ形が変わります。
      </p>
      <textarea id="sg-graph-tsv" class="w-full min-h-[8rem] font-mono text-xs border border-slate-300 rounded-md p-2" spellcheck="false" aria-label="TSVまたはExcelから貼り付け"></textarea>
      <div class="flex flex-wrap gap-2 items-center">
        <button type="button" id="sg-graph-sample" class="sg-btn-secondary text-xs">見本の表に戻す</button>
        <p class="text-xs text-slate-500">タブ区切り · サーバーには送りません</p>
      </div>
    </section>
    <section class="sg-panel space-y-3" aria-labelledby="sg-graph-intent-h">
      <h2 id="sg-graph-intent-h" class="text-sm font-bold text-slate-700">2. 何を伝えたいか</h2>
      <p class="text-xs text-slate-500">種類名ではなく目的を選びます。右のミニ図はイメージです。</p>
      <div id="sg-graph-intent-cards" class="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="sg-graph-intent-h"></div>
      <div id="sg-graph-cnd-wrap" class="hidden space-y-2 pt-1">
        <p class="text-xs font-semibold text-slate-600">目標の見せ方</p>
        <div id="sg-graph-cnd-cards" class="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="目標の見せ方"></div>
      </div>
    </section>
    <section class="sg-panel space-y-3" aria-labelledby="sg-graph-out-h">
      <h2 id="sg-graph-out-h" class="text-sm font-bold text-slate-700">3. プレビュー（貼るとすぐ更新）</h2>
      <div class="flex flex-wrap gap-3 items-center text-sm">
        <label>配置
          <select id="sg-graph-slot" class="border border-slate-300 rounded px-2 py-1">
            <option value="half_left" selected>半面（左）</option>
            <option value="full">全面</option>
            <option value="generic">汎用</option>
          </select>
        </label>
        <label class="flex items-center gap-1"><input type="checkbox" id="sg-graph-values"> 値ラベル</label>
        <label class="flex items-center gap-1"><input type="checkbox" id="sg-graph-frame"> 半面プレビュー枠</label>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" id="sg-graph-redraw" class="sg-btn-secondary text-sm">再描画</button>
        <button type="button" id="sg-graph-copy" class="sg-btn-primary text-sm">SVGをコピー</button>
      </div>
      <p id="sg-graph-msg" class="text-sm text-slate-600 min-h-[1.25rem]" role="status" aria-live="polite"></p>
      <div id="sg-graph-preview" class="overflow-auto border border-slate-200 rounded-md bg-slate-50 p-2 min-h-[280px]"></div>
    </section>
    <section class="sg-panel space-y-3" aria-labelledby="sg-graph-color-h">
      <h2 id="sg-graph-color-h" class="text-sm font-bold text-slate-700">4. 色（出力前）</h2>
      <p class="text-xs text-slate-500">変えると上のプレビューが更新されます。</p>
      <div class="flex flex-wrap gap-3 items-center">
        <label class="text-xs text-slate-600 flex items-center gap-2">主色
          <input type="color" id="sg-graph-series-pick" value="#1D4ED8">
          <input type="text" id="sg-graph-series-hex" value="#1D4ED8" class="font-mono text-xs border rounded px-1 w-24">
        </label>
        <label class="text-xs text-slate-600 flex items-center gap-2">強調色
          <input type="color" id="sg-graph-accent-pick" value="#EA580C">
          <input type="text" id="sg-graph-accent-hex" value="#EA580C" class="font-mono text-xs border rounded px-1 w-24">
        </label>
      </div>
      <div>
        <p class="text-xs text-slate-600 mb-1">強調する項目</p>
        <div id="sg-graph-cats" class="flex flex-col gap-1 text-sm max-h-36 overflow-auto border border-slate-100 rounded p-2"></div>
      </div>
    </section>
  `;

  const el = {
    tsv: root.querySelector('#sg-graph-tsv'),
    sampleBtn: root.querySelector('#sg-graph-sample'),
    intentCards: root.querySelector('#sg-graph-intent-cards'),
    cndWrap: root.querySelector('#sg-graph-cnd-wrap'),
    cndCards: root.querySelector('#sg-graph-cnd-cards'),
    seriesPick: root.querySelector('#sg-graph-series-pick'),
    seriesHex: root.querySelector('#sg-graph-series-hex'),
    accentPick: root.querySelector('#sg-graph-accent-pick'),
    accentHex: root.querySelector('#sg-graph-accent-hex'),
    cats: root.querySelector('#sg-graph-cats'),
    slot: root.querySelector('#sg-graph-slot'),
    values: root.querySelector('#sg-graph-values'),
    frame: root.querySelector('#sg-graph-frame'),
    redraw: root.querySelector('#sg-graph-redraw'),
    copy: root.querySelector('#sg-graph-copy'),
    msg: root.querySelector('#sg-graph-msg'),
    preview: root.querySelector('#sg-graph-preview'),
  };

  let intentId = 'TREND';
  let cndId = 'target_as_line';
  let usingSample = true;

  function renderIntentCards() {
    el.intentCards.innerHTML = INTENT_OPTIONS.map((o) => {
      const selected = o.id === intentId;
      const disabled = o.previewReady === false;
      return `<label class="${cardClass(selected, disabled)}">
        <input type="radio" name="sg-graph-intent" value="${o.id}" class="sr-only" ${selected ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
        ${thumbSvg(o.thumb)}
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-slate-800">${o.label}</span>
          <span class="block text-[11px] text-slate-500 mt-0.5">${o.hint}</span>
        </span>
      </label>`;
    }).join('');
  }

  function renderCndCards() {
    el.cndCards.innerHTML = CND_OPTIONS.map((o) => {
      const selected = o.id === cndId;
      return `<label class="${cardClass(selected, false)}">
        <input type="radio" name="sg-graph-cnd" value="${o.id}" class="sr-only" ${selected ? 'checked' : ''}>
        ${thumbSvg(o.thumb)}
        <span class="text-xs font-semibold text-slate-800 leading-snug">${o.label}</span>
      </label>`;
    }).join('');
  }

  function applySampleForIntent(id, force) {
    const next = SAMPLES[id] || SAMPLE_TREND;
    if (force || usingSample || SAMPLE_SET.has(el.tsv.value) || !String(el.tsv.value || '').trim()) {
      el.tsv.value = next;
      usingSample = true;
    }
  }

  renderIntentCards();
  renderCndCards();
  applySampleForIntent(intentId, true);

  let rulesDoc = null;
  let engine = null;
  let lastSvg = '';
  let lastCatsKey = '';
  let redrawTimer = 0;

  function setMsg(text, isErr) {
    el.msg.textContent = text || '';
    el.msg.classList.toggle('text-red-700', Boolean(isErr));
  }

  function selectedAccents() {
    return [...el.cats.querySelectorAll('input[type=checkbox]:checked')].map((c) => c.value);
  }

  function renderCatChecks(cats) {
    const keep = new Set(selectedAccents());
    if (!keep.size && cats.includes('12月')) keep.add('12月');
    el.cats.innerHTML = cats
      .map((c) => {
        const checked = keep.has(c) ? 'checked' : '';
        return `<label class="flex items-center gap-2"><input type="checkbox" value="${String(c).replace(/"/g, '&quot;')}" ${checked}><span>${c}</span></label>`;
      })
      .join('');
    lastCatsKey = cats.join('\0');
  }

  async function ensureEngine() {
    if (engine) return;
    const res = await fetch('/assets/graph-rules.json');
    if (!res.ok) {
      const res2 = await fetch('../assets/graph-rules.json');
      if (!res2.ok) throw new Error('ルール定義を読み込めませんでした');
      rulesDoc = await res2.json();
    } else {
      rulesDoc = await res.json();
    }
    engine = createGraphDecisionEngine(rulesDoc);
  }

  async function redraw() {
    try {
      await ensureEngine();
      el.cndWrap.classList.toggle('hidden', intentId !== 'TARGET_VS_ACTUAL');
      const extracted = extractObservableFromTsv(el.tsv.value);
      const decision = engine.decide({
        observable: extracted.observable,
        intent: intentId,
        measures: extracted.measures,
      });
      const payload = buildGraphSpec(decision, {
        intent: intentId,
        observable: extracted.observable,
        table: extracted.table,
        measures: extracted.measures,
        confirmation_choice_id: intentId === 'TARGET_VS_ACTUAL' ? cndId : null,
        rulesDoc,
      });
      if (!payload.graph_spec) {
        setMsg(
          payload.message ||
            `この表と目的の組み合わせではグラフを決められません（${payload.spec_kind || decision.state}）`,
          true
        );
        el.preview.innerHTML = '';
        lastSvg = '';
        return;
      }
      const cats = listSpecCategories(payload.graph_spec);
      if (cats.join('\0') !== lastCatsKey) renderCatChecks(cats);

      const sHex = normalizeHex(el.seriesHex.value);
      const aHex = normalizeHex(el.accentHex.value);
      if (sHex) {
        el.seriesHex.value = sHex;
        el.seriesPick.value = sHex;
      }
      if (aHex) {
        el.accentHex.value = aHex;
        el.accentPick.value = aHex;
      }

      const presentation = buildPresentationFromSettings({
        series_color: el.seriesHex.value,
        accent_color: el.accentHex.value,
        accent_categories: selectedAccents(),
        show_value_labels: el.values.checked,
      });
      const chart = await renderGraph(payload, {
        format: 'svg',
        deck_slot: el.slot.value,
        presentation,
      });
      if (!chart.ok) {
        setMsg(`描画できません: ${(chart.reason_codes || []).join(', ')}`, true);
        el.preview.innerHTML = '';
        lastSvg = '';
        return;
      }
      lastSvg = chart.body;
      if (el.frame.checked) {
        const prev = wrapDeckHalfLeftPreview(chart.body, {
          chartWidth: chart.width,
          chartHeight: chart.height,
        });
        el.preview.innerHTML = prev.ok ? prev.body : chart.body;
      } else {
        el.preview.innerHTML = chart.body;
      }
      const sampleNote = usingSample ? '見本プレビュー · ' : '';
      setMsg(`${sampleNote}${chart.chart_type} · ${chart.width}×${chart.height}`);
    } catch (err) {
      setMsg(String(err?.message || err), true);
    }
  }

  function scheduleRedraw() {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => {
      redraw();
    }, 280);
  }

  el.intentCards.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.name !== 'sg-graph-intent') return;
    intentId = t.value;
    applySampleForIntent(intentId, false);
    renderIntentCards();
    redraw();
  });
  el.cndCards.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.name !== 'sg-graph-cnd') return;
    cndId = t.value;
    renderCndCards();
    redraw();
  });

  el.sampleBtn.addEventListener('click', () => {
    applySampleForIntent(intentId, true);
    lastCatsKey = '';
    redraw();
  });

  el.tsv.addEventListener('input', () => {
    usingSample = SAMPLE_SET.has(el.tsv.value);
    scheduleRedraw();
  });

  el.seriesPick.addEventListener('input', () => {
    el.seriesHex.value = el.seriesPick.value.toUpperCase();
    scheduleRedraw();
  });
  el.accentPick.addEventListener('input', () => {
    el.accentHex.value = el.accentPick.value.toUpperCase();
    scheduleRedraw();
  });
  ['change'].forEach((ev) => {
    el.seriesHex.addEventListener(ev, () => redraw());
    el.accentHex.addEventListener(ev, () => redraw());
    el.slot.addEventListener(ev, () => redraw());
    el.values.addEventListener(ev, () => redraw());
    el.frame.addEventListener(ev, () => redraw());
  });
  el.cats.addEventListener('change', () => redraw());
  el.redraw.addEventListener('click', () => redraw());
  el.copy.addEventListener('click', async () => {
    if (!lastSvg) {
      setMsg('先にグラフを描画してください', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(lastSvg);
      setMsg('SVGをコピーしました。スライドに貼り付けてください。');
      try {
        globalThis.SG_ANALYTICS?.notifyJobDone?.('copy');
      } catch {
        /* ignore */
      }
    } catch {
      setMsg('クリップボードにコピーできませんでした', true);
    }
  });

  try {
    globalThis.SG_ANALYTICS?.bindTextJobStarted?.(el.tsv, { debounceMs: 400, minLength: 2 });
  } catch {
    /* ignore */
  }

  await redraw();
}
