import Gantt from '/node_modules/frappe-gantt/dist/frappe-gantt.es.js';
import { parentToFrappeTasks } from './model.mjs';
import { isTransparent, strokeForBar } from './colors.mjs';

const ganttByParent = new Map();

const GANTT_OPTS = {
  readonly: true,
  readonly_dates: true,
  readonly_progress: true,
  bar_height: 26,
  padding: 14,
  view_mode: 'Week',
  view_mode_select: true,
  today_button: true,
  popup_on: 'click',
};

export function renderAllParents(container, parents) {
  container.innerHTML = '';
  ganttByParent.forEach((g) => {
    try {
      g.$container?.remove();
    } catch (_) {
      /* ignore */
    }
  });
  ganttByParent.clear();

  parents.forEach((parent) => {
    const block = document.createElement('section');
    block.className = 'parent-block';
    block.dataset.parentId = parent.id;

    const head = document.createElement('header');
    head.className = 'parent-head';
    head.innerHTML = `
      <span class="swatch" style="background:${parent.color}"></span>
      <h2>${escapeHtml(parent.name)}</h2>
      <span class="meta">${parent.children.length} 子チャート</span>
    `;
    block.appendChild(head);

    const mount = document.createElement('div');
    mount.className = 'gantt-mount';
    mount.id = `gantt-${parent.id}`;
    block.appendChild(mount);

    container.appendChild(block);

    const tasks = parentToFrappeTasks(parent);
    const gantt = new Gantt(`#${mount.id}`, tasks, GANTT_OPTS);
    applyBarStrokes(mount, tasks);
    ganttByParent.set(parent.id, gantt);
  });
}

function applyBarStrokes(mount, tasks) {
  requestAnimationFrame(() => {
    tasks.forEach((task) => {
      const wrap = mount.querySelector(`.bar-wrapper[data-id="${task.id}"]`);
      if (!wrap) return;
      const bar = wrap.querySelector('.bar');
      if (!bar) return;
      const fill = task.color || '';
      if (isTransparent(fill)) {
        bar.style.fill = 'transparent';
        bar.style.stroke = task._meta?.stroke || strokeForBar(fill);
        bar.style.strokeWidth = '1.5';
      } else if (task._meta?.isParent) {
        bar.style.stroke = strokeForBar(fill);
        bar.style.strokeWidth = '1';
      }
    });
  });
}

export function refreshParent(parent) {
  const gantt = ganttByParent.get(parent.id);
  if (!gantt) return;
  const tasks = parentToFrappeTasks(parent);
  gantt.refresh(tasks);
  const mount = document.getElementById(`gantt-${parent.id}`);
  if (mount) applyBarStrokes(mount, tasks);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
