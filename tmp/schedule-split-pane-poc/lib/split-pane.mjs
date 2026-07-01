import {
  addDays,
  chartRange,
  clampToRange,
  countWorkingDays,
  diffDays,
  eachDay,
  formatShort,
  formatWeekday,
  isHoliday,
  isWeekend,
} from './dates.mjs';
import { applyOp, deltaDaysFromDrag } from './engine-stub.mjs';
import {
  belongsToSubtree,
  hasChildren,
  isBranchRow,
  isContainer,
  itemDepth,
} from './item-tree.mjs';
import { childrenOf, isCollapsed } from './visible-items.mjs';
import {
  activePreset,
  dependenciesEnabled,
  filterItemsForPreset,
  findOverflowWarnings,
  groupSpanForPreset,
  submitExportItems,
  visibleProperties,
} from './view-preset.mjs';

export const ROW_H = 36;

const COL_W = { week: 44, month: 18 };
const EDGE_HIT = 10;
const SCHEDULE_PROPERTY_CATALOG = [
  { id: 'prop_scope', label: '施工工区・位置（測点）', kind: 'text', tier: 'official' },
  { id: 'prop_subcontractor', label: '協力会社（下請）', kind: 'text', tier: 'ops' },
  { id: 'prop_labor', label: '配置予定人工数', kind: 'number', tier: 'ops' },
  { id: 'prop_machine', label: '投入予定重機・車両', kind: 'text', tier: 'ops' },
  { id: 'prop_material', label: '主要資材・予定数量', kind: 'text', tier: 'ops' },
  { id: 'prop_progress', label: '進捗率（出来高％）', kind: 'number', tier: 'official' },
  {
    id: 'prop_inspection',
    label: '段階確認・立会種別',
    kind: 'select',
    tier: 'official',
    options: ['立会', '書類確認', 'なし'],
  },
  { id: 'prop_road', label: '道路規制・占用フラグ', kind: 'checkbox', tier: 'ops' },
  { id: 'prop_delay', label: '直前変更・遅延理由', kind: 'text', tier: 'ops' },
  { id: 'prop_notice', label: '届出区分', kind: 'text', tier: 'official' },
  { id: 'prop_note', label: '備考', kind: 'text', tier: 'official' },
];

export class SplitPaneSchedule {
  constructor(root, state, onChange) {
    this.root = root;
    this.state = state;
    this.onChange = onChange;
    this.zoom = 'month';
    this.syncingScroll = false;
    this.drag = null;
    this.selectedId = null;
    this.editorItemId = null;
    this.editorMode = 'peek';
    this.overflowIds = new Set();
    this.buildChrome();
    this.render();
  }

  setState(state) {
    this.state = state;
    this.render();
  }

  buildChrome() {
    this.root.innerHTML = '';
    this.root.className = 'schedule-shell';

    const period = this.state.projectPeriod || {};
    const ui = this.state.ui || { showDates: true };
    const calendar = this.state.calendar || { countWeekends: true };
    const preset = activePreset(this.state);

    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-left">
        <span class="eyebrow">Phase A PoC</span>
        <h1 class="site-title">工程表</h1>
        <div class="period-row">
          <span class="period-label">工期</span>
          <input type="date" class="period-input" id="period-start" value="${period.start || ''}" />
          <span class="period-sep">〜</span>
          <input type="date" class="period-input" id="period-end" value="${period.end || ''}" />
        </div>
      </div>
      <div class="toolbar-right">
        <div class="preset-toggle" role="tablist" aria-label="表示プリセット">
          <button type="button" data-preset="submit" class="preset-btn${preset === 'submit' ? ' is-active' : ''}">提出</button>
          <button type="button" data-preset="site" class="preset-btn${preset === 'site' ? ' is-active' : ''}">現場</button>
        </div>
        <button type="button" class="btn-primary" id="btn-submit-pdf" title="preset=submit 固定で出力（PoC）">提出用PDF</button>
        <label class="chk-label" title="ON: 先行の終了変更で後続がギャップ維持で追随（稼働日考慮）· 既定OFF">
          <input type="checkbox" id="chk-dependencies" ${dependenciesEnabled(this.state) ? 'checked' : ''} />
          依存連動
        </label>
        <span class="dep-hint" title="工区内の順序依存（矢印は非表示）">依存 ${(this.state.dependencies || []).length}本</span>
        <label class="chk-label" title="オフにすると土日を休日として工事日数を数える">
          <input type="checkbox" id="chk-weekends" ${calendar.countWeekends !== false ? 'checked' : ''} />
          土日を工事日に含める
        </label>
        <span class="holiday-hint" title="タイムラインの日付をクリックで休工日を切替">休工 ${(calendar.holidays || []).length}日</span>
        <button type="button" class="btn-ghost" id="btn-theme">${(ui.theme || 'light') === 'dark' ? 'ライト' : 'ダーク'}</button>
        <button type="button" class="btn-ghost" id="btn-toggle-dates">${ui.showDates ? '日付を隠す' : '日付を表示'}</button>
        <div class="zoom-toggle" role="tablist">
          <button type="button" data-zoom="week" class="zoom-btn">週</button>
          <button type="button" data-zoom="month" class="zoom-btn is-active">月</button>
        </div>
        <button type="button" class="btn-ghost" id="btn-today">今日</button>
      </div>
    `;
    this.root.appendChild(toolbar);

    this.warningBanner = document.createElement('div');
    this.warningBanner.className = 'warning-banner is-hidden';
    this.warningBanner.setAttribute('role', 'status');
    this.root.appendChild(this.warningBanner);

    toolbar.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dispatch({ type: 'set_preset', preset: btn.dataset.preset });
      });
    });
    toolbar.querySelector('#btn-submit-pdf').addEventListener('click', () => this.previewSubmitPdf());
    toolbar.querySelector('#period-start').addEventListener('change', (e) => {
      this.dispatch({
        type: 'edit_project_period',
        start: e.target.value,
        end: toolbar.querySelector('#period-end').value,
      });
    });
    toolbar.querySelector('#period-end').addEventListener('change', (e) => {
      this.dispatch({
        type: 'edit_project_period',
        start: toolbar.querySelector('#period-start').value,
        end: e.target.value,
      });
    });
    toolbar.querySelector('#chk-weekends').addEventListener('change', (e) => {
      this.dispatch({ type: 'set_calendar', patch: { countWeekends: e.target.checked } });
    });
    toolbar.querySelector('#chk-dependencies').addEventListener('change', (e) => {
      this.dispatch({ type: 'set_dependencies_enabled', enabled: e.target.checked });
    });
    toolbar.querySelector('#btn-toggle-dates').addEventListener('click', () => {
      const next = !(this.state.ui?.showDates !== false);
      this.dispatch({ type: 'set_ui', patch: { showDates: next } });
    });
    toolbar.querySelector('#btn-theme').addEventListener('click', () => {
      const theme = (this.state.ui?.theme || 'light') === 'dark' ? 'light' : 'dark';
      this.dispatch({ type: 'set_ui', patch: { theme } });
    });
    toolbar.querySelectorAll('.zoom-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.zoom = btn.dataset.zoom;
        toolbar.querySelectorAll('.zoom-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
        this.render();
      });
    });
    toolbar.querySelector('#btn-today').addEventListener('click', () => this.scrollToToday());

    const split = document.createElement('div');
    split.className = 'split-pane';
    split.innerHTML = `
      <div class="pane-table">
        <div class="table-head" id="table-head"></div>
        <div class="table-body" id="table-body"></div>
      </div>
      <div class="pane-timeline">
        <div class="timeline-head-wrap">
          <div class="timeline-head" id="timeline-head"></div>
        </div>
        <div class="timeline-body-wrap">
          <div class="timeline-body" id="timeline-body">
            <div class="grid-layer" id="grid-layer"></div>
            <div class="bars-layer" id="bars-layer"></div>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(split);

    const editorBackdrop = document.createElement('div');
    editorBackdrop.className = 'editor-backdrop is-hidden';
    editorBackdrop.innerHTML = `
      <aside class="editor-drawer" role="dialog" aria-label="項目編集">
        <div class="editor-head">
          <div class="editor-title-wrap">
            <span class="editor-caption">Notion Like Editor</span>
            <h2 class="editor-title">項目を編集</h2>
          </div>
          <div class="editor-head-actions">
            <button type="button" class="btn-ghost" id="editor-expand">全画面</button>
            <button type="button" class="btn-ghost" id="editor-close">閉じる</button>
          </div>
        </div>
        <div class="editor-body" id="editor-body"></div>
      </aside>
    `;
    this.root.appendChild(editorBackdrop);

    this.tableHead = split.querySelector('#table-head');
    this.tableBody = split.querySelector('#table-body');
    this.timelineHead = split.querySelector('#timeline-head');
    this.timelineBody = split.querySelector('#timeline-body');
    this.gridLayer = split.querySelector('#grid-layer');
    this.barsLayer = split.querySelector('#bars-layer');
    this.editorBackdrop = editorBackdrop;
    this.editorBody = editorBackdrop.querySelector('#editor-body');
    this.editorCloseBtn = editorBackdrop.querySelector('#editor-close');
    this.editorExpandBtn = editorBackdrop.querySelector('#editor-expand');

    this.tableBody.addEventListener('scroll', () => this.onTableScroll());
    this.timelineBody.addEventListener('scroll', () => this.onTimelineScroll());
    this.timelineBody.addEventListener('click', (e) => {
      if (e.target === this.timelineBody || e.target === this.gridLayer) {
        this.selectedId = null;
        this.editorItemId = null;
        this.render();
      }
    });
    this.editorBackdrop.addEventListener('click', (e) => {
      if (e.target === this.editorBackdrop) this.closeEditor();
    });
    this.editorCloseBtn.addEventListener('click', () => this.closeEditor());
    this.editorExpandBtn.addEventListener('click', () => {
      this.editorMode = this.editorMode === 'peek' ? 'full' : 'peek';
      this.renderEditor();
    });
  }

  colWidth() {
    return COL_W[this.zoom] || COL_W.month;
  }

  range() {
    return chartRange(this.state);
  }

  preset() {
    return activePreset(this.state);
  }

  showDates() {
    return this.state.ui?.showDates !== false;
  }

  theme() {
    return this.state.ui?.theme || 'light';
  }

  showMetaCols() {
    return this.preset() === 'site';
  }

  opsPropertyCols() {
    return visibleProperties(this.state.properties, this.preset());
  }

  tableGridTemplate() {
    const parts = ['minmax(108px, 1fr)'];
    if (this.showDates()) parts.push('84px', '84px');
    if (this.showMetaCols()) parts.push('minmax(44px, 68px)', 'minmax(40px, 56px)');
    for (const _p of this.opsPropertyCols()) parts.push('minmax(48px, 72px)');
    return parts.join(' ');
  }

  applyTableGrid(el) {
    el.style.display = 'grid';
    el.style.gridTemplateColumns = this.tableGridTemplate();
    el.style.alignItems = 'center';
  }

  updateTableWidth() {
    let w = 120;
    if (this.showDates()) w += 176;
    if (this.showMetaCols()) w += 108;
    w += this.opsPropertyCols().length * 56;
    this.root.style.setProperty('--table-w', `${w}px`);
  }

  visible() {
    return filterItemsForPreset(this.state.items, this.state.collapsed, this.preset());
  }

  previewSubmitPdf() {
    const rows = submitExportItems(this.state);
    const html = `
      <!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"/>
      <title>提出用工程表</title>
      <style>
      *{color:#000!important;-webkit-print-color-adjust:economy;print-color-adjust:economy}
      body{font-family:system-ui,sans-serif;padding:1.5rem;background:#fff;color:#000}
      h1{font-size:16px;color:#000}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #000;padding:6px 8px;font-size:12px;color:#000;background:#fff}
      th{font-weight:600}
      .note{color:#333;font-size:11px;margin-top:1rem}
      @media print{@page{margin:12mm}}
      </style></head>
      <body><h1>提出用工程表</h1>
      <table><thead><tr><th>工種</th><th>開始</th><th>終了</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${r.title}</td><td>${r.start || ''}</td><td>${r.end || ''}</td></tr>`).join('')}</tbody></table>
      <p class="note">PoC · 正本は紙/PDF · ステータス・担当・ops行は除外 · ${rows.length} 行</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  dispatch(op) {
    const next = applyOp(this.state, op);
    this.state = next;
    this.onChange(next);
    this.syncChrome();
    this.render();
  }

  openEditor(itemId) {
    this.editorItemId = itemId;
    this.editorMode = 'peek';
    this.selectedId = itemId;
    this.renderEditor();
  }

  closeEditor() {
    this.editorItemId = null;
    this.editorMode = 'peek';
    this.renderEditor();
  }

  renderEditor() {
    if (!this.editorBackdrop || !this.editorBody) return;
    const item = this.state.items.find((x) => x.id === this.editorItemId);
    if (!item) {
      this.editorBackdrop.classList.add('is-hidden');
      this.editorBody.innerHTML = '';
      return;
    }

    this.editorBackdrop.classList.remove('is-hidden');
    this.editorBackdrop.classList.toggle('is-full', this.editorMode === 'full');
    if (this.editorExpandBtn) {
      this.editorExpandBtn.textContent = this.editorMode === 'full' ? 'サイド表示' : '全画面';
    }
    const isTask = !isContainer(item);
    const parent = item.parentItemId
      ? this.state.items.find((x) => x.id === item.parentItemId)
      : null;
    const props = this.opsPropertyCols();

    this.editorBody.innerHTML = '';
    const form = document.createElement('div');
    form.className = 'editor-form';

    const row = (label, control) => {
      const wrap = document.createElement('label');
      wrap.className = 'editor-row';
      const l = document.createElement('span');
      l.className = 'editor-label';
      l.textContent = label;
      wrap.append(l, control);
      return wrap;
    };

    const title = document.createElement('input');
    title.type = 'text';
    title.className = 'editor-input';
    title.value = item.title || '';
    title.addEventListener('change', () => {
      this.dispatch({ type: 'edit_title', itemId: item.id, title: title.value || '無題' });
    });
    form.appendChild(row('名前', title));

    const typeInfo = document.createElement('div');
    typeInfo.className = 'editor-meta';
    typeInfo.textContent = `種別: ${isTask ? 'タスク（日時あり）' : 'グループ（日時なし）'}${
      parent ? ` / 親: ${parent.title}` : ''
    }`;
    form.appendChild(typeInfo);

    if (isTask) {
      const mkDate = (labelText, field) => {
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'editor-input';
        input.value = item[field] || '';
        const r = this.range();
        input.min = r.start;
        input.max = r.end;
        input.addEventListener('change', () => {
          this.dispatch({ type: 'edit_cell', itemId: item.id, field, value: input.value });
        });
        return row(labelText, input);
      };
      form.append(mkDate('開始', 'start'), mkDate('終了', 'end'));

      const status = document.createElement('select');
      status.className = 'editor-input';
      ['未着手', '進行中', '完了'].forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if ((item.status || '未着手') === s) opt.selected = true;
        status.appendChild(opt);
      });
      status.addEventListener('change', () => {
        this.dispatch({ type: 'edit_cell', itemId: item.id, field: 'status', value: status.value });
      });
      form.appendChild(row('ステータス', status));
    }

    if (isTask) {
      const assignee = document.createElement('input');
      assignee.type = 'text';
      assignee.className = 'editor-input';
      assignee.placeholder = '担当';
      assignee.value = item.assignee || '';
      assignee.addEventListener('change', () => {
        this.dispatch({ type: 'edit_cell', itemId: item.id, field: 'assignee', value: assignee.value });
      });
      form.appendChild(row('担当', assignee));

      props.forEach((prop) => {
        let control;
        if (prop.kind === 'checkbox') {
          const ip = document.createElement('input');
          ip.type = 'checkbox';
          ip.className = 'editor-checkbox';
          ip.checked = Boolean(item.values?.[prop.id]);
          ip.addEventListener('change', () => {
            this.dispatch({
              type: 'edit_property',
              itemId: item.id,
              propId: prop.id,
              value: ip.checked,
            });
          });
          control = ip;
        } else if (prop.kind === 'select' && Array.isArray(prop.options)) {
          const ip = document.createElement('select');
          ip.className = 'editor-input';
          const empty = document.createElement('option');
          empty.value = '';
          empty.textContent = '未選択';
          ip.appendChild(empty);
          for (const optVal of prop.options) {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            ip.appendChild(opt);
          }
          ip.value = item.values?.[prop.id] || '';
          ip.addEventListener('change', () => {
            this.dispatch({
              type: 'edit_property',
              itemId: item.id,
              propId: prop.id,
              value: ip.value,
            });
          });
          control = ip;
        } else {
          const ip = document.createElement('input');
          ip.type = prop.kind === 'number' ? 'number' : 'text';
          ip.className = 'editor-input';
          ip.value = item.values?.[prop.id] || '';
          ip.placeholder = prop.label;
          ip.addEventListener('change', () => {
            this.dispatch({
              type: 'edit_property',
              itemId: item.id,
              propId: prop.id,
              value: ip.value,
            });
          });
          control = ip;
        }
        form.appendChild(row(prop.label, control));
      });

      const addable = SCHEDULE_PROPERTY_CATALOG.filter(
        (c) => !this.state.properties.some((p) => p.id === c.id),
      );
      if (addable.length) {
        const propPicker = document.createElement('select');
        propPicker.className = 'editor-input';
        const head = document.createElement('option');
        head.value = '';
        head.textContent = 'プロパティ追加（工程管理向け）';
        propPicker.appendChild(head);
        addable.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.label} (${c.tier === 'official' ? '提出' : '現場'})`;
          propPicker.appendChild(opt);
        });
        propPicker.addEventListener('change', () => {
          if (!propPicker.value) return;
          const picked = SCHEDULE_PROPERTY_CATALOG.find((c) => c.id === propPicker.value);
          if (!picked) return;
          this.dispatch({
            type: 'add_property',
            property: { ...picked },
          });
        });
        form.appendChild(row('追加', propPicker));
      }
    }

    const actions = document.createElement('div');
    actions.className = 'editor-actions';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-danger';
    del.textContent = 'この項目を削除';
    del.addEventListener('click', () => {
      const ok = window.confirm('この項目と子要素を削除します。よろしいですか？');
      if (!ok) return;
      this.dispatch({ type: 'delete_item', itemId: item.id });
      this.closeEditor();
    });
    actions.appendChild(del);
    form.appendChild(actions);

    this.editorBody.appendChild(form);
  }

  syncChrome() {
    const preset = this.preset();
    this.root.classList.toggle('show-dates', this.showDates());
    this.root.classList.toggle('preset-submit', preset === 'submit');
    this.root.classList.toggle('preset-site', preset === 'site');
    this.root.classList.toggle('show-meta-cols', this.showMetaCols());
    this.root.classList.toggle('theme-dark', this.theme() === 'dark');
    this.root.classList.toggle('dependencies-on', dependenciesEnabled(this.state));
    this.updateTableWidth();
    const btn = this.root.querySelector('#btn-toggle-dates');
    if (btn) btn.textContent = this.showDates() ? '日付を隠す' : '日付を表示';
    const chk = this.root.querySelector('#chk-weekends');
    if (chk) chk.checked = this.state.calendar?.countWeekends !== false;
    const depChk = this.root.querySelector('#chk-dependencies');
    if (depChk) depChk.checked = dependenciesEnabled(this.state);
    const depHint = this.root.querySelector('.dep-hint');
    if (depHint) {
      depHint.textContent = `依存 ${(this.state.dependencies || []).length}本`;
    }
    const holHint = this.root.querySelector('.holiday-hint');
    if (holHint) holHint.textContent = `休工 ${(this.state.calendar?.holidays || []).length}日`;
    const themeBtn = this.root.querySelector('#btn-theme');
    if (themeBtn) themeBtn.textContent = this.theme() === 'dark' ? 'ライト' : 'ダーク';
    this.root.querySelectorAll('.preset-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.preset === preset);
    });
  }

  renderWarningBanner(warnings) {
    if (!this.warningBanner) return;
    if (!warnings.length) {
      this.warningBanner.className = 'warning-banner is-hidden';
      this.warningBanner.innerHTML = '';
      return;
    }
    this.warningBanner.className = 'warning-banner';
    this.warningBanner.innerHTML = `
      <strong>期間のはみ出し（${warnings.length}）</strong>
      <ul>${warnings.map((w) => `<li>${w.message}</li>`).join('')}</ul>
      <span class="warning-hint">提出行は自動では伸長しません（Q-VW-02）</span>`;
  }

  renderTableHead() {
    if (!this.tableHead) return;
    this.tableHead.innerHTML = '';
    this.tableHead.className = 'table-head';
    this.applyTableGrid(this.tableHead);

    const add = (cls, text) => {
      const el = document.createElement('div');
      el.className = `th ${cls}`;
      el.textContent = text;
      this.tableHead.append(el);
    };

    add('th-task', '名前');
    if (this.showDates()) {
      add('th-date', '開始');
      add('th-date', '終了');
    }
    if (this.showMetaCols()) {
      add('th-status', 'ステータス');
      add('th-assignee', '担当');
    }
    for (const prop of this.opsPropertyCols()) add('th-ops', prop.label);
  }

  onTableScroll() {
    if (this.syncingScroll) return;
    this.syncingScroll = true;
    this.timelineBody.scrollTop = this.tableBody.scrollTop;
    this.syncingScroll = false;
  }

  onTimelineScroll() {
    if (this.syncingScroll) return;
    this.syncingScroll = true;
    this.tableBody.scrollTop = this.timelineBody.scrollTop;
    this.timelineHead.style.transform = `translateX(${-this.timelineBody.scrollLeft}px)`;
    this.syncingScroll = false;
  }

  xForDate(iso, rangeStart) {
    return diffDays(rangeStart, iso) * this.colWidth();
  }

  barWidth(start, end, cw) {
    const days = diffDays(start, end) + 1;
    return Math.max(cw, days * cw - 1);
  }

  scrollToToday() {
    const today = new Date().toISOString().slice(0, 10);
    const { start } = this.range();
    const x = this.xForDate(today, start) - 120;
    this.timelineBody.scrollLeft = Math.max(0, x);
    this.timelineHead.style.transform = `translateX(${-this.timelineBody.scrollLeft}px)`;
  }

  parentRollupStatus(parentId) {
    const kids = childrenOf(this.state.items, parentId).filter((x) => x.start && x.end);
    if (kids.some((k) => k.status === '進行中')) return '進行中';
    if (kids.every((k) => k.status === '完了')) return '完了';
    return '未着手';
  }

  render() {
    this.syncChrome();
    const warnings = findOverflowWarnings(this.state.items);
    this.overflowIds = new Set(warnings.map((w) => w.opsId));
    this.renderWarningBanner(warnings);
    this.renderTableHead();

    const visible = this.visible();
    const range = this.range();
    const days = eachDay(range.start, range.end);
    const cw = this.colWidth();
    const totalW = days.length * cw;
    const totalH = visible.length * ROW_H;

    this.tableBody.innerHTML = '';
    this.gridLayer.innerHTML = '';
    this.barsLayer.innerHTML = '';

    this.gridLayer.style.width = `${totalW}px`;
    this.barsLayer.style.width = `${totalW}px`;
    this.timelineBody.style.minHeight = `${totalH}px`;

    this.renderHead(days, cw, range);
    this.renderGrid(days, cw, visible.length);
    this.renderTodayMarker(range, visible.length);

    visible.forEach((item, rowIndex) => {
      this.renderTableRow(item, rowIndex);
      if (isBranchRow(item, this.state.items) && groupSpanForPreset(this.state.items, item.id, this.preset())) {
        this.renderParentBar(item, rowIndex, range, cw);
      } else if (item.start && item.end) {
        this.renderBar(item, rowIndex, range, cw);
      }
      for (const parent of this.state.items) {
        if (isCollapsed(this.state.collapsed, parent.id)) continue;
        if (!hasChildren(this.state.items, parent.id) && !isContainer(parent)) continue;
        if (this.isLastInSubtree(visible, rowIndex, parent.id)) {
          this.renderAddSubRow(parent.id);
        }
      }
    });

    this.renderAddRow();
    this.renderEditor();
  }

  isLastInSubtree(visible, idx, rootId) {
    const item = visible[idx];
    if (!belongsToSubtree(item, rootId, this.state.items)) return false;
    const next = visible[idx + 1];
    if (!next) return true;
    return !belongsToSubtree(next, rootId, this.state.items);
  }

  renderAddSubRow(parentId) {
    const row = document.createElement('div');
    row.className = 'table-add-sub-row';
    const taskBtn = document.createElement('button');
    taskBtn.type = 'button';
    taskBtn.className = 'table-add-sub';
    taskBtn.innerHTML = '<span class="add-icon">+</span><span>新規サブアイテム</span>';
    taskBtn.addEventListener('click', () => {
      this.dispatch({ type: 'insert_item', parentItemId: parentId, title: '新規' });
    });
    const groupBtn = document.createElement('button');
    groupBtn.type = 'button';
    groupBtn.className = 'table-add-sub table-add-sub-muted';
    groupBtn.innerHTML = '<span class="add-icon">+</span><span>新規グループ</span>';
    groupBtn.title = '日付なしの集約行（孫・ひ孫の入れ子用）';
    groupBtn.addEventListener('click', () => {
      this.dispatch({ type: 'insert_item', parentItemId: parentId, asContainer: true, title: '新規グループ' });
    });
    row.append(taskBtn, groupBtn);
    this.tableBody.appendChild(row);
  }

  renderAddRow() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'table-add-row';
    btn.innerHTML = '<span class="add-icon">+</span><span>新規</span>';
    btn.addEventListener('click', () => {
      this.dispatch({ type: 'insert_item', asParent: true, title: '新規' });
    });
    this.tableBody.appendChild(btn);
  }

  renderTodayMarker(range, rowCount) {
    const today = new Date().toISOString().slice(0, 10);
    if (today < range.start || today > range.end) return;
    const x = this.xForDate(today, range.start);
    const line = document.createElement('div');
    line.className = 'today-marker';
    line.style.left = `${x}px`;
    line.style.height = `${rowCount * ROW_H}px`;
    this.gridLayer.appendChild(line);
  }

  renderHead(days, cw, range) {
    this.timelineHead.innerHTML = '';
    this.timelineHead.style.width = `${days.length * cw}px`;

    if (this.zoom === 'month') {
      let monthKey = '';
      days.forEach((iso) => {
        const d = new Date(iso + 'T12:00:00');
        const mk = `${d.getFullYear()}-${d.getMonth()}`;
        if (mk !== monthKey) {
          monthKey = mk;
          const label = document.createElement('div');
          label.className = 'head-month';
          label.textContent = `${d.getFullYear()}年${d.getMonth() + 1}月`;
          label.style.left = `${diffDays(range.start, iso) * cw}px`;
          this.timelineHead.appendChild(label);
        }
      });
    }

    const lower = document.createElement('div');
    lower.className = 'head-days';
    lower.style.width = `${days.length * cw}px`;
    days.forEach((iso, i) => {
      const cell = document.createElement('div');
      const cal = this.state.calendar || {};
      const hol = isHoliday(iso, cal);
      cell.className =
        'head-day' +
        (isWeekend(iso) ? ' is-weekend' : '') +
        (hol ? ' is-holiday' : '');
      cell.style.width = `${cw}px`;
      cell.title = hol ? '休工日（クリックで解除）' : 'クリックで休工日に設定';
      if (this.zoom === 'week') {
        cell.innerHTML = `<span class="dow">${formatWeekday(iso)}</span><span class="dom">${formatShort(iso)}</span>`;
      } else {
        cell.textContent = String(new Date(iso + 'T12:00:00').getDate());
      }
      cell.style.left = `${i * cw}px`;
      cell.addEventListener('click', () => {
        this.dispatch({ type: 'toggle_holiday', iso });
      });
      lower.appendChild(cell);
    });
    this.timelineHead.appendChild(lower);
  }

  renderGrid(days, cw, rowCount) {
    const cal = this.state.calendar || {};
    days.forEach((iso, i) => {
      const col = document.createElement('div');
      const hol = isHoliday(iso, cal);
      col.className =
        'grid-col' +
        (isWeekend(iso) ? ' is-weekend' : '') +
        (hol ? ' is-holiday' : '');
      col.style.left = `${i * cw}px`;
      col.style.width = `${cw}px`;
      col.style.height = `${rowCount * ROW_H}px`;
      col.title = hol ? '休工日' : '';
      this.gridLayer.appendChild(col);
    });
    for (let r = 0; r < rowCount; r++) {
      const line = document.createElement('div');
      line.className = 'grid-row-line';
      line.style.top = `${(r + 1) * ROW_H}px`;
      line.style.width = `${days.length * cw}px`;
      this.gridLayer.appendChild(line);
    }
  }

  mkToggle(item) {
    const collapsed = isCollapsed(this.state.collapsed, item.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'row-toggle';
    btn.textContent = collapsed ? '▶' : '▼';
    btn.setAttribute('aria-label', collapsed ? '展開' : '折りたたむ');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dispatch({ type: 'toggle_group', groupId: item.id });
    });
    return btn;
  }

  mkRollupDate(text) {
    const el = document.createElement('div');
    el.className = 'td td-date td-rollup';
    el.textContent = text || '—';
    return el;
  }

  mkStatusBadge(status) {
    const statusEl = document.createElement('div');
    statusEl.className = 'td td-status';
    const badge = document.createElement('span');
    badge.className = 'status-badge' + this.statusBadgeClass(status);
    badge.textContent = status || '—';
    statusEl.appendChild(badge);
    return statusEl;
  }

  statusBadgeClass(status) {
    if (status === '進行中') return ' is-active';
    if (status === '完了') return ' is-done';
    if (status === '未着手') return ' is-todo';
    return ' is-empty';
  }

  rootZoneIndex(item) {
    if (item.parentItemId) return -1;
    const roots = this.state.items.filter((i) => !i.parentItemId);
    const idx = roots.findIndex((r) => r.id === item.id);
    return idx >= 0 ? idx % 4 : -1;
  }

  renderTableRow(item, rowIndex) {
    const row = document.createElement('div');
    const items = this.state.items;
    const branch = isBranchRow(item, items);
    const depth = itemDepth(item, items);
    const isOpsOnly = item.visibility === 'site';
    row.className =
      'table-row' +
      (branch ? ' is-parent' : '') +
      (item.parentItemId ? ' is-child' : '') +
      (isOpsOnly ? ' is-ops-row' : '') +
      (item.id === this.selectedId ? ' is-selected' : '') +
      (this.overflowIds.has(item.id) ? ' is-overflow' : '');
    row.style.height = `${ROW_H}px`;
    row.dataset.id = item.id;
    const zoneIdx = this.rootZoneIndex(item);
    if (zoneIdx >= 0) row.dataset.zone = String(zoneIdx);
    this.applyTableGrid(row);

    const title = document.createElement('div');
    title.className = 'td td-task';
    title.style.paddingLeft = `${0.35 + depth * 0.75}rem`;
    if (hasChildren(items, item.id)) title.appendChild(this.mkToggle(item));
    const name = document.createElement('span');
    name.className = 'task-name';
    name.textContent = item.title;
    name.title = 'クリックして Edit で変更';
    title.appendChild(name);
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'open-btn';
    openBtn.textContent = 'OPEN';
    openBtn.title = 'Open in side peek';
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditor(item.id);
    });
    title.appendChild(openBtn);

    const cells = [title];

    if (isContainer(item) || (branch && !item.start && !item.end)) {
      const span = groupSpanForPreset(items, item.id, this.preset());
      if (this.showDates()) {
        cells.push(this.mkRollupDate(span?.start), this.mkRollupDate(span?.end));
      }
      if (this.showMetaCols()) {
        if (hasChildren(items, item.id)) {
          cells.push(this.mkStatusBadge(this.parentRollupStatus(item.id)));
        } else {
          const empty = document.createElement('div');
          empty.className = 'td td-status td-muted';
          empty.textContent = '—';
          cells.push(empty);
        }
        const assignee = document.createElement('div');
        assignee.className = 'td td-assignee td-muted';
        assignee.textContent = '—';
        cells.push(assignee);
      }
      for (const prop of this.opsPropertyCols()) {
        const empty = document.createElement('div');
        empty.className = 'td td-ops td-muted';
        empty.textContent = '—';
        cells.push(empty);
      }
      row.append(...cells);
      row.addEventListener('click', () => {
        this.openEditor(item.id);
      });
      this.tableBody.appendChild(row);
      return;
    }

    const mkDate = (field) => {
      const wrap = document.createElement('div');
      wrap.className = 'td td-date';
      const el = document.createElement('input');
      el.type = 'date';
      el.className = 'cell-input';
      el.value = item[field] || '';
      const { start: pStart, end: pEnd } = this.range();
      el.min = pStart;
      el.max = pEnd;
      el.addEventListener('change', () => {
        this.dispatch({ type: 'edit_cell', itemId: item.id, field, value: el.value });
      });
      wrap.appendChild(el);
      return wrap;
    };

    if (this.showDates()) cells.push(mkDate('start'), mkDate('end'));
    if (this.showMetaCols()) {
      cells.push(this.mkStatusBadge(item.status));
      const assignee = document.createElement('div');
      assignee.className = 'td td-assignee';
      assignee.textContent = item.assignee || '—';
      cells.push(assignee);
    }
    for (const prop of this.opsPropertyCols()) {
      const wrap = document.createElement('div');
      wrap.className = 'td td-ops';
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.className = 'cell-input';
      cell.value = item.values?.[prop.id] || '';
      cell.placeholder = prop.label;
      cell.addEventListener('change', () => {
        this.dispatch({
          type: 'edit_property',
          itemId: item.id,
          propId: prop.id,
          value: cell.value,
        });
      });
      wrap.appendChild(cell);
      cells.push(wrap);
    }

    const wd = countWorkingDays(item.start, item.end, this.state.calendar);
    row.title = `${item.title} · 工事日 ${wd}日`;
    row.append(...cells);
    row.addEventListener('click', () => {
      this.openEditor(item.id);
    });
    this.tableBody.appendChild(row);
  }

  renderParentBar(item, rowIndex, range, cw) {
    const span = groupSpanForPreset(this.state.items, item.id, this.preset());
    if (!span) return;

    const left = this.xForDate(span.start, range.start);
    const width = this.barWidth(span.start, span.end, cw);
    const top = rowIndex * ROW_H + 8;
    const height = ROW_H - 16;

    const wrap = document.createElement('div');
    wrap.className = 'parent-bar-wrap';
    wrap.dataset.id = item.id;
    wrap.style.left = `${left}px`;
    wrap.style.top = `${top}px`;
    wrap.style.width = `${width}px`;
    wrap.style.height = `${height}px`;

    const bar = document.createElement('div');
    bar.className = 'parent-bar';

    const chev = this.mkToggle(item);
    chev.classList.add('parent-chevron');
    const label = document.createElement('span');
    label.className = 'parent-bar-label';
    label.textContent = item.title;

    bar.append(chev, label);
    wrap.appendChild(bar);
    this.barsLayer.appendChild(wrap);

    wrap.addEventListener('click', (e) => {
      if (e.target.classList.contains('row-toggle')) return;
      this.openEditor(item.id);
    });
  }

  renderBar(item, rowIndex, range, cw) {
    if (!item.start || !item.end) return;

    const left = this.xForDate(item.start, range.start);
    const width = this.barWidth(item.start, item.end, cw);
    const top = rowIndex * ROW_H + 6;
    const height = ROW_H - 12;
    const selected = item.id === this.selectedId;
    const isOpsOnly = item.visibility === 'site';
    const overflow = this.overflowIds.has(item.id);

    const wrap = document.createElement('div');
    wrap.className =
      'bar-wrap' +
      (item.parentItemId ? ' is-child' : '') +
      (isOpsOnly ? ' is-ops' : '') +
      (selected ? ' is-selected' : '') +
      (overflow ? ' is-overflow' : '');
    wrap.dataset.id = item.id;
    wrap.style.left = `${left}px`;
    wrap.style.top = `${top}px`;
    wrap.style.width = `${width}px`;
    wrap.style.height = `${height}px`;

    const bar = document.createElement('div');
    bar.className = 'bar' + (isOpsOnly ? ' is-ops-bar' : '');

    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = item.title;

    const handleL = document.createElement('div');
    handleL.className = 'handle handle-l';
    const handleR = document.createElement('div');
    handleR.className = 'handle handle-r';

    bar.append(label, handleL, handleR);
    bar.title = item.status ? `${item.title} · ${item.status}` : item.title;
    wrap.appendChild(bar);
    this.barsLayer.appendChild(wrap);

    this.bindBarInteraction(wrap, bar, item, range);
    this.bindBarDrag(handleL, item, range, 'resize-start');
    this.bindBarDrag(handleR, item, range, 'resize-end');
  }

  bindBarInteraction(wrap, bar, item, range) {
    bar.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      bar.setPointerCapture(e.pointerId);

      const rect = bar.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      let mode = 'move';
      if (localX <= EDGE_HIT) mode = 'resize-start';
      else if (localX >= rect.width - EDGE_HIT) mode = 'resize-end';

      this.selectedId = item.id;
      this.drag = {
        mode,
        itemId: item.id,
        startX: e.clientX,
        rangeStart: range.start,
        rangeEnd: range.end,
        origStart: item.start,
        origEnd: item.end,
        moved: false,
      };
      document.body.classList.add('is-dragging');
      wrap.classList.add('is-active');
    });

    bar.addEventListener('pointermove', (e) => {
      if (!this.drag || this.drag.itemId !== item.id) {
        const rect = bar.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        bar.style.cursor =
          localX <= EDGE_HIT || localX >= rect.width - EDGE_HIT ? 'ew-resize' : 'grab';
        return;
      }
      if (Math.abs(e.clientX - this.drag.startX) > 3) this.drag.moved = true;
      this.applyDragPreview(e, item, range);
    });

    bar.addEventListener('pointerup', (e) => {
      if (!this.drag || this.drag.itemId !== item.id) return;
      this.commitDrag(e, item);
      wrap.classList.remove('is-active');
    });
  }

  bindBarDrag(el, item, range, mode) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      this.selectedId = item.id;
      this.drag = {
        mode,
        itemId: item.id,
        startX: e.clientX,
        rangeStart: range.start,
        rangeEnd: range.end,
        origStart: item.start,
        origEnd: item.end,
        moved: false,
      };
      document.body.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.drag || this.drag.itemId !== item.id) return;
      if (Math.abs(e.clientX - this.drag.startX) > 3) this.drag.moved = true;
      this.applyDragPreview(e, item, range);
    });
    el.addEventListener('pointerup', (e) => {
      if (!this.drag || this.drag.itemId !== item.id) return;
      this.commitDrag(e, item);
    });
  }

  applyDragPreview(e, item, range) {
    const dx = e.clientX - this.drag.startX;
    const delta = deltaDaysFromDrag(dx, this.colWidth());
    const { rangeStart, rangeEnd } = this.drag;

    if (this.drag.mode === 'move') {
      let previewStart = addDays(this.drag.origStart, delta);
      const dur = diffDays(this.drag.origStart, this.drag.origEnd) + 1;
      previewStart = clampToRange(previewStart, rangeStart, rangeEnd);
      let previewEnd = addDays(previewStart, dur - 1);
      previewEnd = clampToRange(previewEnd, rangeStart, rangeEnd);
      previewStart = addDays(previewEnd, -(dur - 1));
      this.updateBarPreview(item.id, previewStart, previewEnd, range);
    } else if (this.drag.mode === 'resize-start') {
      const start = clampToRange(addDays(this.drag.origStart, delta), rangeStart, rangeEnd);
      this.updateBarPreview(item.id, start, this.drag.origEnd, range);
    } else if (this.drag.mode === 'resize-end') {
      const end = clampToRange(addDays(this.drag.origEnd, delta), rangeStart, rangeEnd);
      this.updateBarPreview(item.id, this.drag.origStart, end, range);
    }
  }

  commitDrag(e, item) {
    const dx = e.clientX - this.drag.startX;
    const delta = deltaDaysFromDrag(dx, this.colWidth());
    const moved = this.drag.moved;
    const mode = this.drag.mode;
    document.body.classList.remove('is-dragging');

    if (mode === 'move' && delta !== 0) {
      this.dispatch({ type: 'move_bar', itemId: item.id, deltaDays: delta });
    } else if (mode === 'resize-start' && delta !== 0) {
      this.dispatch({
        type: 'resize_bar',
        itemId: item.id,
        edge: 'start',
        iso: addDays(this.drag.origStart, delta),
      });
    } else if (mode === 'resize-end' && delta !== 0) {
      this.dispatch({
        type: 'resize_bar',
        itemId: item.id,
        edge: 'end',
        iso: addDays(this.drag.origEnd, delta),
      });
    } else if (mode === 'move' && !moved) {
      this.openEditor(item.id);
    } else {
      this.render();
    }
    this.drag = null;
  }

  updateBarPreview(itemId, start, end, range) {
    if (start > end) return;
    const wrap = this.barsLayer.querySelector(`.bar-wrap[data-id="${itemId}"]`);
    if (!wrap) return;
    const cw = this.colWidth();
    const left = this.xForDate(start, range.start);
    const width = this.barWidth(start, end, cw);
    wrap.style.left = `${left}px`;
    wrap.style.width = `${width}px`;

    const row = this.tableBody.querySelector(`.table-row[data-id="${itemId}"]`);
    if (row) {
      const inputs = row.querySelectorAll('input[type=date]');
      if (inputs[0]) inputs[0].value = start;
      if (inputs[1]) inputs[1].value = end;
    }
  }
}
