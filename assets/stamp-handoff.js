/**
 * 印影 → 請求書 handoff（sessionStorage · 1回限り）
 * SSOT: docs/notes/STAMP_TOOL_SPEC.md
 */

export const STAMP_HANDOFF_KEY = 'sg-stamp-handoff-v1';
export const STAMP_HANDOFF_VERSION = 1;

/** @typedef {'user' | 'comp'} StampSlot */

/**
 * @param {{ slot: StampSlot, dataUrl: string, label?: string }} payload
 */
export function writeStampHandoff(payload) {
  if (!payload?.dataUrl || !payload.slot) return false;
  const body = {
    v: STAMP_HANDOFF_VERSION,
    slot: payload.slot === 'comp' ? 'comp' : 'user',
    dataUrl: String(payload.dataUrl),
    label: String(payload.label ?? '').slice(0, 40),
    createdAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(STAMP_HANDOFF_KEY, JSON.stringify(body));
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {{ v: number, slot: StampSlot, dataUrl: string, label: string } | null}
 */
export function readStampHandoff() {
  try {
    const raw = sessionStorage.getItem(STAMP_HANDOFF_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.dataUrl || data.v !== STAMP_HANDOFF_VERSION) return null;
    const slot = data.slot === 'comp' ? 'comp' : 'user';
    return {
      v: data.v,
      slot,
      dataUrl: String(data.dataUrl),
      label: String(data.label ?? ''),
    };
  } catch {
    return null;
  }
}

export function clearStampHandoff() {
  try {
    sessionStorage.removeItem(STAMP_HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {StampSlot} slot
 */
export function stampSlotLabel(slot) {
  return slot === 'comp' ? '社印' : '担当者印';
}
