/**
 * Smart Diff Change Navigator — Projection consumer only.
 * FORBIDDEN: SLIR lookup · Matcher · Delta mutate · pixel Anchor 正本
 * @see docs/ui/smart-diff/CHANGE_NAVIGATOR.md
 */

/**
 * @param {string} s
 */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {object} item
 */
export function kindBadge(item) {
  if (item.changeDetail === "table_changed") {
    return { text: "Changed", className: "sg-sd-badge sg-sd-badge--modified" };
  }
  if (item.candidate) return { text: "候補", className: "sg-sd-badge sg-sd-badge--candidate" };
  if (item.kind === "added") return { text: "Added", className: "sg-sd-badge sg-sd-badge--added" };
  if (item.kind === "deleted") return { text: "Deleted", className: "sg-sd-badge sg-sd-badge--deleted" };
  if (item.kind === "modified") return { text: "Modified", className: "sg-sd-badge sg-sd-badge--modified" };
  return { text: "Unchanged", className: "sg-sd-badge" };
}

/**
 * Review body from Projection item — no Diff recompute.
 * @param {object | null} item
 */
export function reviewCopy(item) {
  if (!item) return { before: "", after: "", note: "変更を選択してください" };
  if (item.changeDetail === "table_changed") {
    return {
      before: "",
      after: "",
      note: "表に変更があります",
      tableOnly: true,
    };
  }
  return {
    before: item.beforeText || (item.kind === "added" ? "" : ""),
    after: item.afterText || (item.kind === "deleted" ? "" : ""),
    note: item.candidate
      ? `? ${item.label}（候補 · 一致度 ${item.matchScore ?? "—"}%）`
      : "",
    tableOnly: false,
  };
}

/**
 * @param {object} projection
 * @param {{ selectedId?: string | null }} [state]
 */
export function renderNavigatorHtml(projection, state = {}) {
  const selectedId = state.selectedId ?? projection.view?.selectedId ?? null;
  const items = projection.items || [];
  const visible = items.filter((i) => i.visible && i.kind !== "unchanged");
  const count = projection.changeCount ?? visible.length;

  const list = items
    .map((item, index) => {
      const badge = kindBadge(item);
      const num =
        item.visible && item.kind !== "unchanged"
          ? visible.findIndex((v) => v.id === item.id) + 1
          : "·";
      const cand =
        item.candidate && item.kind !== "unchanged"
          ? `<span class="sg-sd-cand">? 一致度 ${esc(String(item.matchScore ?? "—"))}%</span>`
          : "";
      const hidden = item.visible ? "" : " hidden";
      const sel = item.id === selectedId ? " is-selected" : "";
      return `<button type="button" class="sg-sd-item${sel}" data-delta-id="${esc(item.id)}" data-index="${index}" aria-selected="${item.id === selectedId ? "true" : "false"}"${hidden} aria-hidden="${item.visible ? "false" : "true"}">
        <span class="sg-sd-item__num">[${esc(String(num))}]</span>
        <span class="sg-sd-item__label">${esc(item.label)}</span>
        <span class="${badge.className}">${esc(badge.text)}</span>
        ${cand}
      </button>`;
    })
    .join("");

  const selected = items.find((i) => i.id === selectedId) || null;
  const review = reviewCopy(selected);
  const anchor = selected
    ? {
        deltaId: selected.id,
        semanticNodeId: selected.newNodeRef || selected.oldNodeRef || null,
        originHint: selected.originHint || null,
      }
    : null;

  const reviewBody = review.tableOnly
    ? `<p class="sg-sd-table-note">${esc(review.note)}</p>`
    : `<div class="sg-sd-review-grid">
        <div><div class="sg-sd-pane-label">Before</div><pre class="sg-sd-pre sg-sd-pre--before">${esc(review.before)}</pre></div>
        <div><div class="sg-sd-pane-label">After</div><pre class="sg-sd-pre sg-sd-pre--after">${esc(review.after)}</pre></div>
      </div>${review.note ? `<p class="sg-sd-cand-note">${esc(review.note)}</p>` : ""}`;

  return {
    html: `<div class="sg-sd-nav" data-sg-smart-diff-navigator>
      <div class="sg-sd-nav__head">
        <strong>Changes ${esc(String(count))}</strong>
        <div class="sg-sd-nav__actions">
          <button type="button" data-sg-sd-prev class="sg-btn sg-btn--ghost text-xs">前の変更</button>
          <button type="button" data-sg-sd-next class="sg-btn sg-btn--ghost text-xs">次の変更</button>
        </div>
      </div>
      <div class="sg-sd-filters" role="group" aria-label="変更フィルタ">
        <label><input type="checkbox" data-filter="showModified" ${projection.view?.filter?.showModified !== false ? "checked" : ""}/> Modified</label>
        <label><input type="checkbox" data-filter="showAdded" ${projection.view?.filter?.showAdded !== false ? "checked" : ""}/> Added</label>
        <label><input type="checkbox" data-filter="showDeleted" ${projection.view?.filter?.showDeleted !== false ? "checked" : ""}/> Deleted</label>
        <label><input type="checkbox" data-filter="style" ${projection.view?.filter?.style ? "checked" : ""}/> Style</label>
      </div>
      <div class="sg-sd-list" role="listbox" aria-label="変更一覧">${list}</div>
      <div class="sg-sd-review" data-anchor='${esc(JSON.stringify(anchor))}'>${reviewBody}</div>
    </div>`,
    anchor,
    selectedId,
    changeCount: count,
  };
}

/**
 * Mount into DOM. Re-renders from Projection only.
 * @param {HTMLElement} root
 * @param {object} projection
 * @param {{ onSelect?: (id: string, anchor: object|null) => void, onFilter?: (filter: object) => void }} [handlers]
 */
export function mountChangeNavigator(root, projection, handlers = {}) {
  if (!root) throw new Error("mountChangeNavigator: root required");
  let current = structuredClone
    ? structuredClone(projection)
    : JSON.parse(JSON.stringify(projection));
  let selectedId =
    current.view?.selectedId ||
    current.items?.find((i) => i.visible && i.kind !== "unchanged")?.id ||
    null;

  function paint() {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    current.view = { ...(current.view || {}), selectedId };
    const painted = renderNavigatorHtml(current, { selectedId });
    root.innerHTML = painted.html;
    const ms =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
    root.dataset.renderMs = String(Math.round(ms * 100) / 100);
    bind();
    return painted;
  }

  function bind() {
    root.querySelectorAll("[data-delta-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t0 =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        selectedId = btn.getAttribute("data-delta-id");
        const painted = paint();
        const ms =
          (typeof performance !== "undefined" ? performance.now() : Date.now()) -
          t0;
        root.dataset.selectMs = String(Math.round(ms * 100) / 100);
        handlers.onSelect?.(selectedId, painted.anchor);
      });
    });
    root.querySelector("[data-sg-sd-next]")?.addEventListener("click", () => {
      const list = (current.items || []).filter(
        (i) => i.visible && i.kind !== "unchanged"
      );
      if (!list.length) return;
      const idx = list.findIndex((i) => i.id === selectedId);
      selectedId = list[(idx + 1) % list.length].id;
      const painted = paint();
      handlers.onSelect?.(selectedId, painted.anchor);
    });
    root.querySelector("[data-sg-sd-prev]")?.addEventListener("click", () => {
      const list = (current.items || []).filter(
        (i) => i.visible && i.kind !== "unchanged"
      );
      if (!list.length) return;
      const idx = list.findIndex((i) => i.id === selectedId);
      selectedId = list[(idx <= 0 ? list.length : idx) - 1].id;
      const painted = paint();
      handlers.onSelect?.(selectedId, painted.anchor);
    });
    root.querySelectorAll("[data-filter]").forEach((input) => {
      input.addEventListener("change", () => {
        const key = input.getAttribute("data-filter");
        const filter = {
          ...(current.view?.filter || {}),
          content: true,
          addedDeleted: true,
          showModified: true,
          showAdded: true,
          showDeleted: true,
          showUnchanged: false,
          style: false,
        };
        root.querySelectorAll("[data-filter]").forEach((el) => {
          filter[el.getAttribute("data-filter")] = el.checked;
        });
        // visibility only — do not drop items
        current.items = (current.items || []).map((item) => {
          let visible = true;
          if (item.kind === "unchanged") visible = !!filter.showUnchanged;
          else if (item.kind === "modified") {
            visible =
              item.changeDetail === "style_only"
                ? !!filter.style
                : !!filter.showModified;
          } else if (item.kind === "added") visible = !!filter.showAdded;
          else if (item.kind === "deleted") visible = !!filter.showDeleted;
          return { ...item, visible };
        });
        current.view = { ...(current.view || {}), filter };
        current.changeCount = current.items.filter(
          (i) => i.visible && i.kind !== "unchanged"
        ).length;
        paint();
        handlers.onFilter?.(filter);
      });
    });
  }

  const first = paint();
  return {
    getSelectedId: () => selectedId,
    getAnchor: () => first.anchor,
    setProjection(next) {
      current = structuredClone
        ? structuredClone(next)
        : JSON.parse(JSON.stringify(next));
      selectedId =
        current.view?.selectedId ||
        current.items?.find((i) => i.visible && i.kind !== "unchanged")?.id ||
        null;
      return paint();
    },
    select(id) {
      selectedId = id;
      return paint();
    },
  };
}
