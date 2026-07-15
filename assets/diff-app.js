const $ = (id) => document.getElementById(id);

const MAX_LINES_FOR_EXACT = 700;
const MAX_CHARS = 120000;

const RISK_PATTERNS = {
  strong: /\b(must|required|shall|必須|しなければならない|禁止)\b/i,
  weak: /\b(should|recommended|may|推奨|任意|可能)\b/i,
  negation: /\b(not|no|never|cannot|can't|禁止|不可|しない|ではない)\b/i,
  date: /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
  number: /(?:\d[\d,]*(?:\.\d+)?)/,
  url: /https?:\/\/[^\s)]+/i,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
};

/** @type {Array<any>} */
let latestChanges = [];
/** @type {'side' | 'inline'} */
let layoutMode = 'side';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeInput(raw) {
  return String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function splitLines(text) {
  if (!text) return [];
  return text.split('\n');
}

function toWordSet(text) {
  return new Set(
    String(text ?? '')
      .toLowerCase()
      .match(/[\p{L}\p{N}_-]+/gu) || []
  );
}

function hasBrandRemoval(beforeLine, afterLine) {
  const beforeWords = toWordSet(beforeLine);
  const afterWords = toWordSet(afterLine);
  // DECISION: 初期は誤検知を抑えるためSUGUDASU/Sync系の監査用途に限定し、汎用固有名詞抽出は将来検討とする。
  for (const word of beforeWords) {
    if (word.length < 3) continue;
    if (/sugudasu|sync|timeline|schedule/.test(word) && !afterWords.has(word)) return true;
  }
  return false;
}

function riskFromChange(change) {
  let score = 1;
  const reasons = [];
  const before = change.before || '';
  const after = change.after || '';

  if (RISK_PATTERNS.number.test(before) !== RISK_PATTERNS.number.test(after) || extractNumbers(before) !== extractNumbers(after)) {
    score += 2;
    reasons.push('数値変更');
  }
  if (extractByPattern(before, RISK_PATTERNS.date) !== extractByPattern(after, RISK_PATTERNS.date)) {
    score += 2;
    reasons.push('日付変更');
  }
  if (extractByPattern(before, RISK_PATTERNS.url) !== extractByPattern(after, RISK_PATTERNS.url)) {
    score += 2;
    reasons.push('URL変更');
  }
  if (extractByPattern(before, RISK_PATTERNS.email) !== extractByPattern(after, RISK_PATTERNS.email)) {
    score += 2;
    reasons.push('メール変更');
  }

  const strongBefore = RISK_PATTERNS.strong.test(before);
  const strongAfter = RISK_PATTERNS.strong.test(after);
  const weakBefore = RISK_PATTERNS.weak.test(before);
  const weakAfter = RISK_PATTERNS.weak.test(after);
  if (strongBefore && weakAfter) {
    score += 3;
    reasons.push('必須→推奨の弱化');
  } else if (weakBefore && strongAfter) {
    score += 3;
    reasons.push('推奨→必須の強化');
  }

  const negBefore = RISK_PATTERNS.negation.test(before);
  const negAfter = RISK_PATTERNS.negation.test(after);
  if (negBefore !== negAfter) {
    score += 3;
    reasons.push('否定/肯定の反転');
  }

  if (change.type === 'remove') {
    score += 2;
    reasons.push('条件/文の削除');
  } else if (change.type === 'add') {
    score += 1;
    reasons.push('条件/文の追加');
  }

  if (hasBrandRemoval(before, after)) {
    score += 2;
    reasons.push('固有名詞/ブランド欠落');
  }

  const clamped = Math.max(1, Math.min(5, score));
  return {
    score: clamped,
    label: '★'.repeat(clamped) + '☆'.repeat(5 - clamped),
    reasons: reasons.length ? reasons : ['軽微な文言変更'],
  };
}

function extractNumbers(text) {
  const matches = String(text ?? '').match(/(?:\d[\d,]*(?:\.\d+)?)/g);
  return matches ? matches.join('|') : '';
}

function extractByPattern(text, pattern) {
  const match = String(text ?? '').match(pattern);
  return match ? match[0] : '';
}

function lcsDiff(beforeLines, afterLines) {
  const n = beforeLines.length;
  const m = afterLines.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = beforeLines[i] === afterLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const changes = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (beforeLines[i] === afterLines[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      changes.push({ type: 'remove', beforeLine: i + 1, afterLine: j + 1, before: beforeLines[i], after: '' });
      i += 1;
    } else {
      changes.push({ type: 'add', beforeLine: i + 1, afterLine: j + 1, before: '', after: afterLines[j] });
      j += 1;
    }
  }
  while (i < n) {
    changes.push({ type: 'remove', beforeLine: i + 1, afterLine: m, before: beforeLines[i], after: '' });
    i += 1;
  }
  while (j < m) {
    changes.push({ type: 'add', beforeLine: n, afterLine: j + 1, before: '', after: afterLines[j] });
    j += 1;
  }
  return mergeAddRemovePairs(changes);
}

function greedyLineDiff(beforeLines, afterLines) {
  const max = Math.max(beforeLines.length, afterLines.length);
  const changes = [];
  for (let idx = 0; idx < max; idx += 1) {
    const before = beforeLines[idx] ?? '';
    const after = afterLines[idx] ?? '';
    if (before === after) continue;
    if (!before && after) changes.push({ type: 'add', beforeLine: idx + 1, afterLine: idx + 1, before: '', after });
    else if (before && !after) changes.push({ type: 'remove', beforeLine: idx + 1, afterLine: idx + 1, before, after: '' });
    else changes.push({ type: 'replace', beforeLine: idx + 1, afterLine: idx + 1, before, after });
  }
  return changes;
}

function mergeAddRemovePairs(changes) {
  const merged = [];
  for (let i = 0; i < changes.length; i += 1) {
    const current = changes[i];
    const next = changes[i + 1];
    if (
      current &&
      next &&
      current.type === 'remove' &&
      next.type === 'add'
    ) {
      merged.push({
        type: 'replace',
        beforeLine: current.beforeLine,
        afterLine: next.afterLine,
        before: current.before,
        after: next.after,
      });
      i += 1;
      continue;
    }
    merged.push(current);
  }
  return merged;
}

function computeChanges(beforeText, afterText) {
  const beforeLines = splitLines(beforeText);
  const afterLines = splitLines(afterText);
  const estimatedCells = beforeLines.length * afterLines.length;
  // DECISION: 長文でのUIフリーズ回避を優先し、一定規模超過時は厳密LCSではなく行位置ベース比較へフォールバック。
  const base = (beforeLines.length <= MAX_LINES_FOR_EXACT && afterLines.length <= MAX_LINES_FOR_EXACT && estimatedCells <= 250000)
    ? lcsDiff(beforeLines, afterLines)
    : greedyLineDiff(beforeLines, afterLines);

  return base.map((change, idx) => {
    const risk = riskFromChange(change);
    return {
      id: `chg-${idx + 1}`,
      ...change,
      risk,
    };
  });
}

function renderSummary(changes) {
  const totalEl = $('diff-total');
  const highEl = $('diff-high');
  const mediumEl = $('diff-medium');
  const lowEl = $('diff-low');
  const statusEl = $('diff-status');
  if (!totalEl || !highEl || !mediumEl || !lowEl || !statusEl) return;

  const high = changes.filter((c) => c.risk.score >= 4).length;
  const medium = changes.filter((c) => c.risk.score === 3).length;
  const low = changes.filter((c) => c.risk.score <= 2).length;

  totalEl.textContent = String(changes.length);
  highEl.textContent = String(high);
  mediumEl.textContent = String(medium);
  lowEl.textContent = String(low);
  statusEl.textContent = changes.length
    ? `要確認から順に ${Math.min(5, high || changes.length)} 件を見てください。`
    : '目立った変更は見つかりませんでした。';
}

function renderMiniMap(changes) {
  const map = $('diff-mini-map');
  if (!map) return;
  map.innerHTML = '';
  if (!changes.length) {
    map.innerHTML = '<p class="text-[11px] text-slate-500">変更なし</p>';
    return;
  }
  const top = changes.length;
  for (let i = 0; i < changes.length; i += 1) {
    const c = changes[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `diff-map-dot diff-map-dot--${c.risk.score}`;
    btn.style.top = `${(i / top) * 100}%`;
    btn.title = `${c.risk.label} ${c.risk.reasons.join(' / ')}`;
    btn.addEventListener('click', () => {
      document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    map.appendChild(btn);
  }
}

function changeTypeLabel(type) {
  if (type === 'add') return '追加';
  if (type === 'remove') return '削除';
  return '変更';
}

function renderChangeCard(change) {
  // DECISION: レイアウトは一般的なDiff UI（左右/縦）を踏襲し、学習コストを増やす独自表示は採用しない。
  if (layoutMode === 'inline') {
    return `
      <div class="space-y-2">
        <p class="text-[11px] text-slate-500">Before L${change.beforeLine}</p>
        <pre class="diff-pre diff-pre--before">${escapeHtml(change.before || '（なし）')}</pre>
        <p class="text-[11px] text-slate-500">After L${change.afterLine}</p>
        <pre class="diff-pre diff-pre--after">${escapeHtml(change.after || '（なし）')}</pre>
      </div>
    `;
  }
  return `
    <div class="grid gap-2 md:grid-cols-2">
      <div>
        <p class="text-[11px] text-slate-500 mb-1">Before L${change.beforeLine}</p>
        <pre class="diff-pre diff-pre--before">${escapeHtml(change.before || '（なし）')}</pre>
      </div>
      <div>
        <p class="text-[11px] text-slate-500 mb-1">After L${change.afterLine}</p>
        <pre class="diff-pre diff-pre--after">${escapeHtml(change.after || '（なし）')}</pre>
      </div>
    </div>
  `;
}

function renderChanges(changes) {
  const list = $('diff-change-list');
  if (!list) return;
  if (!changes.length) {
    list.innerHTML = '<p class="text-sm text-slate-500">差分はありません。</p>';
    return;
  }
  list.innerHTML = changes
    .map((c, idx) => `
      <article id="${c.id}" class="sg-card p-4 space-y-2 border-l-4 ${c.risk.score >= 4 ? 'border-red-400' : c.risk.score === 3 ? 'border-amber-400' : 'border-slate-300'}">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-[11px] font-bold text-slate-700">#${idx + 1}</span>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.risk.score >= 4 ? 'bg-red-100 text-red-700' : c.risk.score === 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}">${c.risk.label}</span>
          <span class="text-[11px] text-slate-500">${changeTypeLabel(c.type)}</span>
          <span class="text-[11px] text-slate-500">${escapeHtml(c.risk.reasons.join(' · '))}</span>
        </div>
        ${renderChangeCard(c)}
      </article>
    `)
    .join('');
}

function rankedChanges(changes) {
  return [...changes].sort((a, b) => b.risk.score - a.risk.score);
}

function buildCopyReport(changes) {
  const lines = [
    'SUGUDASU 差分チェック',
    `変更の件数: ${changes.length}`,
    `要確認（高）: ${changes.filter((c) => c.risk.score >= 4).length}`,
    '',
  ];
  changes.forEach((c, i) => {
    lines.push(`#${i + 1} ${c.risk.label} ${changeTypeLabel(c.type)}（元 ${c.beforeLine}行目 → 後 ${c.afterLine}行目）`);
    lines.push(`理由: ${c.risk.reasons.join(' / ')}`);
    lines.push(`元の文: ${c.before || '（なし）'}`);
    lines.push(`書き換え後: ${c.after || '（なし）'}`);
    lines.push('');
  });
  return lines.join('\n');
}

async function copyReport() {
  const status = $('diff-copy-status');
  const report = buildCopyReport(latestChanges);
  try {
    await navigator.clipboard.writeText(report);
    if (status) status.textContent = '結果をコピーしました。';
  } catch {
    if (status) status.textContent = 'コピーに失敗しました。手動で選択してコピーしてください。';
  }
}

function analyze() {
  const beforeEl = $('diff-before');
  const afterEl = $('diff-after');
  const warningEl = $('diff-warning');
  if (!beforeEl || !afterEl) return;

  const beforeText = normalizeInput(beforeEl.value);
  const afterText = normalizeInput(afterEl.value);

  if (!beforeText && !afterText) return;
  if (beforeText.length > MAX_CHARS || afterText.length > MAX_CHARS) {
    if (warningEl) warningEl.textContent = '入力が大きすぎます（各12万文字以内）。';
    return;
  }
  if (warningEl) warningEl.textContent = '';

  const changes = rankedChanges(computeChanges(beforeText, afterText));
  latestChanges = changes;
  renderSummary(changes);
  renderMiniMap(changes);
  renderChanges(changes);
}

function bindEvents() {
  $('diff-run')?.addEventListener('click', analyze);
  $('diff-copy')?.addEventListener('click', copyReport);
  $('diff-print')?.addEventListener('click', () => window.print());
  $('diff-layout-side')?.addEventListener('click', () => {
    layoutMode = 'side';
    analyze();
  });
  $('diff-layout-inline')?.addEventListener('click', () => {
    layoutMode = 'inline';
    analyze();
  });

  // DECISION: 入力都度自動実行は重い文書で負荷が高いため、明示ボタン実行を基本にして誤操作時だけ再実行しやすくする。
  $('diff-before')?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze();
  });
  $('diff-after')?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze();
  });
}

bindEvents();
