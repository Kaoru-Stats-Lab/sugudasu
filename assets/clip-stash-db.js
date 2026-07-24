/**
 * SUGUDASU 仮置き — IndexedDB
 * docs/products/clip-stash/specification.md
 */
const DB_NAME = 'sugudasu-clip-stash';
const DB_VERSION = 1;
const STORE = 'cards';

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('idb-open'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * @param {IDBRequest} req
 */
function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * @param {IDBDatabase} db
 * @param {'readonly'|'readwrite'} mode
 * @param {(store: IDBObjectStore) => IDBRequest|void} fn
 */
function withStore(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let out;
    try {
      out = fn(store);
    } catch (err) {
      reject(err);
      return;
    }
    if (out && typeof out.onsuccess !== 'undefined') {
      out.onsuccess = () => resolve(out.result);
      out.onerror = () => reject(out.error);
    } else {
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error || new Error('idb-tx'));
    }
  });
}

/** @param {IDBDatabase} db */
export async function getAllCards(db) {
  const rows = await withStore(db, 'readonly', (s) => s.getAll());
  return (rows || []).sort((a, b) => a.order - b.order);
}

/** @param {IDBDatabase} db @param {object} card */
export async function putCard(db, card) {
  return withStore(db, 'readwrite', (s) => s.put(card));
}

/** @param {IDBDatabase} db @param {string} id */
export async function deleteCard(db, id) {
  return withStore(db, 'readwrite', (s) => s.delete(id));
}

/**
 * @param {IDBDatabase} db
 * @param {string[]} orderedIds
 */
export async function reorderCards(db, orderedIds) {
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  await Promise.all(
    orderedIds.map((id, index) =>
      new Promise((resolve, reject) => {
        const get = store.get(id);
        get.onsuccess = () => {
          const row = get.result;
          if (!row) {
            resolve();
            return;
          }
          row.order = index;
          const put = store.put(row);
          put.onsuccess = () => resolve();
          put.onerror = () => reject(put.error);
        };
        get.onerror = () => reject(get.error);
      }),
    ),
  );
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
