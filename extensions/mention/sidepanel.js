import {
  ACTION_LABELS,
  formatStars,
  normalizeSignals,
  runActionEngine,
} from './lib/action-engine.js';
import { DEFAULT_TEMPLATES, listDefaultTemplateEntries } from './lib/templates-default.js';
import {
  addDone,
  deleteTemplate,
  getAllTemplates,
  getSettings,
  listDone,
  putTemplate,
  saveSettings,
} from './lib/idb.js';
import {
  hasMapsPermission,
  isMapsRelatedUrl,
  requestMapsPermission,
} from './lib/origins.js';

/** @type {import('./lib/action-engine.js').ContextEnvelope | null} */
let currentSignals = null;
/** @type {ReturnType<typeof runActionEngine> | null} */
let currentEngine = null;
let currentActionId = null;
/** @type {Record<string, string>} */
let templateMap = {};
let settings = { brands: [], store: '', webhookUrl: '' };

const $ = (id) => document.getElementById(id);

function setStatus(msg) {
  $('mn-status').textContent = msg || '';
}

function setPermBox(visible, msg) {
  const box = $('mn-perm-box');
  box.hidden = !visible;
  if (msg) $('mn-perm-msg').textContent = msg;
}

function switchTab(tab) {
  document.querySelectorAll('.mn-tab').forEach((btn) => {
    const on = btn.dataset.tab === tab;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.mn-panel').forEach((panel) => {
    const on = panel.id === `panel-${tab}`;
    panel.hidden = !on;
    panel.classList.toggle('is-active', on);
  });
  if (tab === 'done') renderDone();
  if (tab === 'template') renderTemplateEditor();
  if (tab === 'setting') renderSettingsForm();
}

function mergeTemplates(userMap) {
  return { ...DEFAULT_TEMPLATES, ...userMap };
}

function matchBrand(signals, brands) {
  if (!brands?.length) return signals.brand || '';
  const hay = `${signals.title} ${signals.body} ${signals.ogTitle || ''}`.toLowerCase();
  for (const b of brands) {
    if (b && hay.includes(String(b).toLowerCase())) return b;
  }
  return brands[0] || '';
}

function renderCard() {
  const card = $('mn-card');
  const detail = $('mn-detail');
  if (!currentSignals || !currentEngine) {
    card.hidden = true;
    detail.hidden = true;
    return;
  }

  card.hidden = false;
  const stars = formatStars(currentSignals.stars);
  const metaParts = [currentEngine.categoryLabel, stars].filter(Boolean);
  $('mn-card-meta').textContent = metaParts.join(' · ');
  $('mn-card-author').textContent =
    currentSignals.author || currentSignals.title || currentSignals.url || '（投稿者不明）';
  $('mn-card-body').textContent = currentSignals.body || currentSignals.title || currentSignals.url;

  const actionsEl = $('mn-actions');
  actionsEl.innerHTML = '';
  for (const actionId of currentEngine.actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mn-btn';
    btn.dataset.action = actionId;
    btn.textContent = ACTION_LABELS[actionId] || actionId;
    if (actionId === currentActionId) btn.classList.add('is-active');
    btn.addEventListener('click', () => onActionClick(actionId));
    actionsEl.appendChild(btn);
  }

  if (currentEngine.unsupportedPage) {
    setStatus('このページは未対応です。');
  }
}

function onActionClick(actionId) {
  if (!currentEngine || !currentSignals) return;
  currentActionId = actionId;

  if (actionId === 'done') {
    void markDone('', 'done');
    return;
  }

  const text = currentEngine.filled[actionId] || '';
  $('mn-detail').hidden = false;
  $('mn-detail-label').textContent = `${ACTION_LABELS[actionId] || actionId} · 定型の展開`;
  $('mn-detail-text').value = text;
  $('mn-detail-hint').textContent = settings.webhookUrl
    ? 'コピーするか、Webhook 送信できます。'
    : 'コピーして元の画面へ貼り付けてください。Webhook は Setting で任意設定。';
  renderCard();
}

async function markDone(filledText, actionId) {
  if (!currentSignals) return;
  await addDone({
    actionId,
    filledText: filledText || '',
    category: currentEngine?.category || 'other',
    title: currentSignals.title || '',
    url: currentSignals.url || '',
    author: currentSignals.author || '',
    stars: currentSignals.stars,
  });
  setStatus('完了にしました。');
  currentActionId = null;
  $('mn-detail').hidden = true;
}

async function copyDetail() {
  const text = $('mn-detail-text').value || '';
  try {
    await navigator.clipboard.writeText(text);
    setStatus('コピーしました。');
  } catch {
    $('mn-detail-text').select();
    document.execCommand('copy');
    setStatus('コピーしました。');
  }
}

async function sendWebhook() {
  const url = (settings.webhookUrl || '').trim();
  if (!url) {
    setStatus('Setting で Webhook URL を保存してください。');
    switchTab('setting');
    return;
  }
  const text = $('mn-detail-text').value || '';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setStatus('Webhook に送信しました。');
    await markDone(text, currentActionId || 'slack_share');
  } catch (err) {
    setStatus(`Webhook 送信に失敗しました: ${err?.message || err}`);
  }
}

async function applyEnvelope(raw, tabUrl) {
  currentSignals = normalizeSignals(raw);
  currentSignals.brand = matchBrand(currentSignals, settings.brands);
  templateMap = mergeTemplates(await getAllTemplates());
  currentEngine = runActionEngine(
    currentSignals,
    {
      brands: settings.brands,
      brand: currentSignals.brand,
      store: settings.store,
    },
    templateMap
  );
  if (currentEngine.unsupportedPage) {
    setStatus('このページは未対応です。');
  } else {
    setStatus(tabUrl ? `読取: ${tabUrl}` : '読取完了');
  }
  renderCard();
}

async function refreshFromTab() {
  setStatus('タブを読み取り中…');
  setPermBox(false);
  $('mn-card').hidden = true;
  $('mn-detail').hidden = true;
  currentActionId = null;
  currentSignals = null;
  currentEngine = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tab?.url || '';

  if (!isMapsRelatedUrl(tabUrl)) {
    setStatus('');
    setPermBox(false);
    return;
  }

  const granted = await hasMapsPermission();
  if (!granted) {
    setStatus('');
    setPermBox(true, 'このサイトは未許可です。Google Maps / GBP の口コミを終わらせるには許可が必要です。');
    return;
  }

  const res = await chrome.runtime.sendMessage({ type: 'MENTION_EXTRACT_ACTIVE_TAB' });
  if (!res?.ok) {
    setStatus(`読み取れませんでした（${res?.error || 'unknown'}）。ページを再読み込みしてから再試行してください。`);
    return;
  }

  await applyEnvelope(
    res.signals || {
      adapterId: '',
      title: res.tab?.title || '',
      url: res.tab?.url || '',
      supported: false,
    },
    res.tab?.url
  );
}

async function onGrantMapsClick() {
  const ok = await requestMapsPermission();
  if (!ok) {
    setStatus('許可されませんでした。');
    return;
  }
  setPermBox(false);
  await refreshFromTab();
}

async function renderDone() {
  const rows = await listDone(80);
  const list = $('mn-done-list');
  const empty = $('mn-done-empty');
  list.innerHTML = '';
  if (!rows.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  for (const row of rows) {
    const li = document.createElement('li');
    const when = row.completedAt ? new Date(row.completedAt).toLocaleString('ja-JP') : '';
    li.innerHTML = `<p class="mn-list__title"></p><p class="mn-list__meta"></p>`;
    li.querySelector('.mn-list__title').textContent =
      row.title || row.url || ACTION_LABELS[row.actionId] || 'Done';
    li.querySelector('.mn-list__meta').textContent = [
      ACTION_LABELS[row.actionId] || row.actionId,
      formatStars(row.stars),
      when,
    ]
      .filter(Boolean)
      .join(' · ');
    list.appendChild(li);
  }
}

function renderTemplateEditor() {
  const select = $('mn-template-select');
  const entries = listDefaultTemplateEntries();
  const userKeys = Object.keys(templateMap).filter((k) => !DEFAULT_TEMPLATES[k]);
  const allKeys = [...new Set([...entries.map((e) => e.key), ...userKeys])].sort();
  const prev = select.value;
  select.innerHTML = '';
  for (const key of allKeys) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    select.appendChild(opt);
  }
  if (prev && allKeys.includes(prev)) select.value = prev;
  $('mn-template-body').value = templateMap[select.value] || DEFAULT_TEMPLATES[select.value] || '';
}

function renderSettingsForm() {
  $('mn-brands').value = (settings.brands || []).join('\n');
  $('mn-store').value = settings.store || '';
  $('mn-webhook-url').value = settings.webhookUrl || '';
}

async function loadState() {
  settings = await getSettings();
  templateMap = mergeTemplates(await getAllTemplates());
}

function wire() {
  document.querySelectorAll('.mn-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  $('mn-refresh').addEventListener('click', () => void refreshFromTab());
  $('mn-grant-maps').addEventListener('click', () => void onGrantMapsClick());
  $('mn-copy').addEventListener('click', () => void copyDetail());
  $('mn-webhook').addEventListener('click', () => void sendWebhook());
  $('mn-mark-done').addEventListener('click', () =>
    void markDone($('mn-detail-text').value || '', currentActionId || 'done')
  );

  $('mn-template-select').addEventListener('change', () => {
    const key = $('mn-template-select').value;
    $('mn-template-body').value = templateMap[key] || DEFAULT_TEMPLATES[key] || '';
  });
  $('mn-template-save').addEventListener('click', async () => {
    const key = $('mn-template-select').value;
    const body = $('mn-template-body').value;
    await putTemplate(key, body);
    templateMap = mergeTemplates(await getAllTemplates());
    setStatus('テンプレを保存しました。');
    if (currentSignals) {
      currentEngine = runActionEngine(
        currentSignals,
        { brands: settings.brands, brand: currentSignals.brand, store: settings.store },
        templateMap
      );
      renderCard();
    }
  });
  $('mn-template-reset').addEventListener('click', async () => {
    const key = $('mn-template-select').value;
    await deleteTemplate(key);
    templateMap = mergeTemplates(await getAllTemplates());
    $('mn-template-body').value = DEFAULT_TEMPLATES[key] || '';
    setStatus('既定テンプレに戻しました。');
  });

  $('mn-settings-save').addEventListener('click', async () => {
    const brands = $('mn-brands')
      .value.split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    settings = await saveSettings({
      brands,
      store: $('mn-store').value.trim(),
      webhookUrl: $('mn-webhook-url').value.trim(),
    });
    setStatus('設定を保存しました。');
    if (currentSignals) {
      currentSignals.brand = matchBrand(currentSignals, settings.brands);
      currentEngine = runActionEngine(
        currentSignals,
        { brands: settings.brands, brand: currentSignals.brand, store: settings.store },
        templateMap
      );
      renderCard();
    }
  });
}

wire();
void loadState().then(() => refreshFromTab());
