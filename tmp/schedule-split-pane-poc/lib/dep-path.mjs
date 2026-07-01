/**
 * Notion 風依存矢印 — 棒の端点間をベジェで結ぶ（グリッド・日付レイアウトに非干渉）
 */
export function notionDepPath(x1, y1, x2, y2, colWidth = 18) {
  const bend = Math.max(14, colWidth * 0.35);
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dy) < 2) {
    const c = Math.max(bend, Math.abs(dx) * 0.42);
    return `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
  }

  if (dx >= 0) {
    const c1x = x1 + bend;
    const c2x = x2 - bend;
    return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
  }

  const midX = x1 + bend;
  const midY = y1 + dy * 0.5;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${midY}, ${midX} ${midY} C ${midX} ${midY}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}
