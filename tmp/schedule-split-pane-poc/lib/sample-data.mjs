import { addDays, nextWorkingDayAfter } from './dates.mjs';
import { defaultViewState } from './view-preset.mjs';

const TASK_TEMPLATE = [
  { key: 'kusso', title: '除草', days: 3 },
  { key: 'kusaku', title: '掘削', days: 5 },
  { key: 'hanshutsu', title: '搬出', days: 4 },
  { key: 'morido', title: '盛土', days: 5 },
  { key: 'tenaku', title: '転圧', days: 3 },
];

const GROUPS = [
  { id: 'g1', title: '第1工区', scopeId: 'g1', offsetDays: 0 },
  { id: 'g2', title: '第2工区', scopeId: 'g2', offsetDays: 14 },
  { id: 'g3', title: '第3工区', scopeId: 'g3', offsetDays: 28 },
  { id: 'g4', title: '第4工区', scopeId: 'g4', offsetDays: 42 },
];

export function createSampleItems() {
  const calendar = { countWeekends: true, holidays: ['2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05'] };
  const projectPeriod = { start: '2026-04-01', end: '2026-08-31' };
  const ui = { showDates: true, theme: 'light' };
  const collapsed = {};
  const viewState = defaultViewState();
  const properties = [
    { id: 'prop_qty', label: '数量', kind: 'text', tier: 'ops' },
  ];
  const items = [];
  const dependencies = [];

  GROUPS.forEach((grp, gi) => {
    items.push({
      id: grp.id,
      parentItemId: null,
      scopeId: grp.scopeId,
      visibility: 'both',
      title: grp.title,
      start: null,
      end: null,
      status: '',
      assignee: '',
      values: {},
    });

    let cursor = addDays(projectPeriod.start, grp.offsetDays);
    let prevTaskId = null;

    TASK_TEMPLATE.forEach((wt, wi) => {
      const start = cursor;
      const end = addDays(start, wt.days - 1);
      const taskId = `${grp.id}-${wt.key}`;
      items.push({
        id: taskId,
        parentItemId: grp.id,
        scopeId: grp.scopeId,
        workType: wt.key,
        visibility: 'both',
        title: wt.title,
        start,
        end,
        status: gi === 0 && wi === 0 ? '進行中' : '未着手',
        assignee: gi % 2 === 0 ? '佐藤' : '鈴木',
        values: {},
      });

      if (prevTaskId) {
        dependencies.push({
          id: `dep-${prevTaskId}-${taskId}`,
          from: prevTaskId,
          to: taskId,
          scopeId: grp.scopeId,
          shiftMode: 'maintain_gap',
        });
      }

      if (gi === 0 && wt.key === 'morido') {
        items.push({
          id: `${taskId}-crane`,
          parentItemId: taskId,
          scopeId: grp.scopeId,
          visibility: 'site',
          title: '重機入場（BH）',
          start: addDays(start, -1),
          end: addDays(end, 2),
          status: '未着手',
          assignee: '佐藤',
          values: { prop_qty: '1台' },
        });
      }

      if (gi === 0 && wt.key === 'kusaku') {
        items.push({
          id: `${taskId}-deliver`,
          parentItemId: taskId,
          scopeId: grp.scopeId,
          visibility: 'site',
          title: '資材納入',
          start,
          end: addDays(start, 1),
          status: '未着手',
          assignee: '鈴木',
          values: { prop_qty: '鉄板 12枚' },
        });
      }

      prevTaskId = taskId;
      cursor = nextWorkingDayAfter(end, calendar);
    });
  });

  return { projectPeriod, calendar, ui, collapsed, viewState, properties, items, dependencies };
}
