import { childColorFromParent, isTransparent, strokeForBar } from './colors.mjs';

let seq = 1;
export function nextId(prefix) {
  return `${prefix}_${seq++}`;
}

export function createParent(name, color) {
  return {
    id: nextId('pc'),
    name: name || `親チャート ${seq - 1}`,
    color: color || '#2563EB',
    children: [],
  };
}

export function createChild(name, start, end, colorOverride) {
  return {
    id: nextId('cc'),
    name: name || `子 ${seq - 1}`,
    start,
    end,
    colorOverride: colorOverride || '',
    progress: 0,
  };
}

function minDate(dates) {
  return dates.reduce((a, b) => (a < b ? a : b));
}

function maxDate(dates) {
  return dates.reduce((a, b) => (a > b ? a : b));
}

/** One frappe-gantt task list per parent block */
export function parentToFrappeTasks(parent) {
  const children = parent.children || [];
  if (!children.length) {
    const today = new Date().toISOString().slice(0, 10);
    const end = addDays(today, 3);
    return [
      frappeTask(parent.id, parent.name, today, end, parent.color, {
        isParent: true,
        custom_class: 'sg-parent-bar',
      }),
    ];
  }

  const starts = children.map((c) => c.start);
  const ends = children.map((c) => c.end);
  const pStart = minDate(starts);
  const pEnd = maxDate(ends);

  const tasks = [
    frappeTask(parent.id, parent.name, pStart, pEnd, parent.color, {
      isParent: true,
      custom_class: 'sg-parent-bar',
      progress: avgProgress(children),
    }),
  ];

  children.forEach((child, i) => {
    const fill = childColorFromParent(parent.color, i, child.colorOverride);
    tasks.push(
      frappeTask(child.id, child.name, child.start, child.end, fill, {
        isChild: true,
        parentChartId: parent.id,
        custom_class: isTransparent(fill) ? 'sg-bar-transparent' : 'sg-child-bar',
        stroke: strokeForBar(fill),
      }),
    );
  });

  return tasks;
}

function frappeTask(id, name, start, end, color, extra = {}) {
  return {
    id,
    name,
    start,
    end,
    progress: extra.progress ?? 0,
    color,
    custom_class: extra.custom_class || '',
    _meta: extra,
  };
}

function avgProgress(children) {
  if (!children.length) return 0;
  const sum = children.reduce((a, c) => a + (c.progress || 0), 0);
  return Math.round(sum / children.length);
}

function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function sampleForest() {
  seq = 1;
  const p1 = createParent('設計フェーズ', '#2563EB');
  p1.children = [
    createChild('ワイヤー', '2026-07-01', '2026-07-04'),
    createChild('UI モック', '2026-07-03', '2026-07-08'),
    createChild('レビュー', '2026-07-08', '2026-07-10'),
  ];

  const p2 = createParent('開発', '#059669');
  p2.children = [
    createChild('API', '2026-07-11', '2026-07-18'),
    createChild('フロント', '2026-07-15', '2026-07-25'),
    createChild('結合', '2026-07-24', '2026-07-28'),
    createChild('バッファ', '2026-07-28', '2026-07-30'),
  ];

  const p3 = createParent('リリース準備', '#EA580C');
  p3.children = [
    createChild('ドキュメント', '2026-08-01', '2026-08-05'),
    createChild('ステージング', '2026-08-04', '2026-08-07'),
  ];

  return [p1, p2, p3];
}
