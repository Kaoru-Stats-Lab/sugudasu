import { DEFAULT_PARENT_PALETTE, parseColor } from './lib/colors.mjs';
import {
  createParent,
  createChild,
  sampleForest,
} from './lib/model.mjs';
import { renderAllParents } from './lib/render.mjs';

const state = { parents: sampleForest() };

const el = {
  forest: document.getElementById('gantt-forest'),
  parentName: document.getElementById('parent-name'),
  parentPalette: document.getElementById('parent-palette'),
  parentColorCustom: document.getElementById('parent-color-custom'),
  parentTransparent: document.getElementById('parent-transparent'),
  btnAddParent: document.getElementById('btn-add-parent'),
  childParent: document.getElementById('child-parent'),
  childName: document.getElementById('child-name'),
  childStart: document.getElementById('child-start'),
  childEnd: document.getElementById('child-end'),
  childColorOverride: document.getElementById('child-color-override'),
  childTransparent: document.getElementById('child-transparent'),
  btnAddChild: document.getElementById('btn-add-child'),
  parentList: document.getElementById('parent-list'),
  btnReset: document.getElementById('btn-reset'),
};

function initPaletteSelect() {
  el.parentPalette.innerHTML = DEFAULT_PARENT_PALETTE.map(
    (p) => `<option value="${p.hex}">${p.label} (${p.hex})</option>`,
  ).join('');
}

function resolveParentColor() {
  if (el.parentTransparent.checked) return 'transparent';
  const custom = el.parentColorCustom.value.trim();
  if (custom) {
    const parsed = parseColor(custom);
    if (parsed) return parsed.css;
    alert('親の色を解釈できません（HEX / rgb / rgba）');
    return null;
  }
  return el.parentPalette.value;
}

function resolveChildColorOverride() {
  if (el.childTransparent.checked) return 'transparent';
  const raw = el.childColorOverride.value.trim();
  if (!raw) return '';
  const parsed = parseColor(raw);
  if (!parsed) {
    alert('子の色上書きを解釈できません');
    return null;
  }
  return parsed.css;
}

function defaultChildDates() {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  return {
    start: isoDate(start),
    end: isoDate(end),
  };
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function syncParentSelect() {
  el.childParent.innerHTML = state.parents
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join('');
}

function syncParentList() {
  el.parentList.innerHTML = state.parents
    .map(
      (p) => `
    <li>
      <strong>${escapeHtml(p.name)}</strong>
      <span style="color:${p.color}"> ■</span>
      <div class="child-line">${p.children.length} 子 — ${p.children.map((c) => escapeHtml(c.name)).join(' · ') || '（なし）'}</div>
    </li>`,
    )
    .join('');
}

function paint() {
  syncParentSelect();
  syncParentList();
  renderAllParents(el.forest, state.parents);
}

function addParent() {
  const color = resolveParentColor();
  if (color == null) return;
  const name = el.parentName.value.trim();
  state.parents.push(createParent(name, color));
  el.parentName.value = '';
  el.parentColorCustom.value = '';
  el.parentTransparent.checked = false;
  paint();
}

function addChild() {
  const parentId = el.childParent.value;
  const parent = state.parents.find((p) => p.id === parentId);
  if (!parent) {
    alert('先に親チャートを追加してください');
    return;
  }
  const start = el.childStart.value;
  const end = el.childEnd.value;
  if (!start || !end) {
    alert('開始・終了日を入力してください');
    return;
  }
  if (start > end) {
    alert('終了は開始以降にしてください');
    return;
  }
  const colorOverride = resolveChildColorOverride();
  if (colorOverride === null) return;
  const name = el.childName.value.trim();
  parent.children.push(createChild(name, start, end, colorOverride));
  el.childName.value = '';
  el.childColorOverride.value = '';
  el.childTransparent.checked = false;
  const next = defaultChildDates();
  el.childStart.value = next.start;
  el.childEnd.value = next.end;
  paint();
}

function resetSample() {
  state.parents = sampleForest();
  paint();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

initPaletteSelect();
const dates = defaultChildDates();
el.childStart.value = dates.start;
el.childEnd.value = dates.end;

el.btnAddParent.addEventListener('click', addParent);
el.btnAddChild.addEventListener('click', addChild);
el.btnReset.addEventListener('click', resetSample);

paint();
