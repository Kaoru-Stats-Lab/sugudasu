/**
 * PDF ツール間の 1 回限り handoff（IndexedDB）
 * 印鑑→請求書（sessionStorage）と同型。PDF は容量のため IDB。
 * DECISION: 渡すのは切り出し後のバイトだけ。元のスキャン束は置かない。
 * DECISION: 読んだら消す。タブを閉じても残さない（consume / 期限切れ）。
 */
export const PDF_HANDOFF_DB = 'sg-pdf-handoff-v1';
export const PDF_HANDOFF_STORE = 'payload';
export const PDF_HANDOFF_KEY = 'current';
export const PDF_HANDOFF_VERSION = 1;
export const PDF_HANDOFF_TTL_MS = 30 * 60 * 1000;
export const PDF_HANDOFF_ALLOWED_TO = Object.freeze(['pdf-fill', 'annotate']);

/**
 * @param {string} toTool
 * @returns {boolean}
 */
export function isAllowedPdfHandoffTo(toTool) {
  return PDF_HANDOFF_ALLOWED_TO.includes(String(toTool || ''));
}

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizePdfHandoffFileName(name) {
  const raw = String(name || 'document.pdf').replace(/[\\/:*?"<>|]+/g, '_').trim();
  const base = raw.replace(/\.pdf$/i, '') || 'document';
  return `${base.slice(0, 80)}.pdf`;
}

/**
 * @param {number} createdAtMs
 * @param {number} [now]
 * @returns {boolean}
 */
export function isPdfHandoffExpired(createdAtMs, now = Date.now()) {
  const t = Number(createdAtMs) || 0;
  if (!t) return true;
  return now - t > PDF_HANDOFF_TTL_MS;
}

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no_idb'));
      return;
    }
    const req = indexedDB.open(PDF_HANDOFF_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PDF_HANDOFF_STORE)) {
        db.createObjectStore(PDF_HANDOFF_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('idb_open'));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {'readonly'|'readwrite'} mode
 * @returns {IDBObjectStore}
 */
function store(db, mode) {
  return db.transaction(PDF_HANDOFF_STORE, mode).objectStore(PDF_HANDOFF_STORE);
}

export async function clearPdfHandoff() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const req = store(db, 'readwrite').delete(PDF_HANDOFF_KEY);
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

/**
 * @param {{
 *   toTool: string,
 *   fromTool: string,
 *   filename: string,
 *   bytes: Uint8Array|ArrayBuffer,
 * }} payload
 * @returns {Promise<boolean>}
 */
export async function writePdfHandoff(payload) {
  const toTool = String(payload?.toTool || '');
  const fromTool = String(payload?.fromTool || '');
  if (!isAllowedPdfHandoffTo(toTool) || !fromTool) return false;
  const src = payload?.bytes;
  if (!src) return false;
  const bytes = src instanceof Uint8Array ? src : new Uint8Array(src);
  if (!bytes.byteLength) return false;
  const filename = sanitizePdfHandoffFileName(payload.filename);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const req = store(db, 'readwrite').put(
        {
          v: PDF_HANDOFF_VERSION,
          toTool,
          fromTool,
          filename,
          blob,
          createdAt: Date.now(),
        },
        PDF_HANDOFF_KEY,
      );
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * 読んで消す。toTool が違う・期限切れなら捨てて null。
 * @param {string} expectedToTool
 * @returns {Promise<{ file: File, fromTool: string } | null>}
 */
export async function consumePdfHandoff(expectedToTool) {
  if (!isAllowedPdfHandoffTo(expectedToTool)) return null;
  let row = null;
  try {
    const db = await openDb();
    row = await new Promise((resolve, reject) => {
      const req = store(db, 'readonly').get(PDF_HANDOFF_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    return null;
  }
  await clearPdfHandoff();
  if (!row || row.v !== PDF_HANDOFF_VERSION) return null;
  if (row.toTool !== expectedToTool) return null;
  if (isPdfHandoffExpired(row.createdAt)) return null;
  const blob = row.blob instanceof Blob ? row.blob : null;
  if (!blob || !blob.size) return null;
  const filename = sanitizePdfHandoffFileName(row.filename);
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { file, fromTool: String(row.fromTool || '') };
}
