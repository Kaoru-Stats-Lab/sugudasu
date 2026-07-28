/**
 * Mention by SUGUDASU — IndexedDB（端末内のみ）
 * DB: sugudasu-mention
 */

const DB_NAME = 'sugudasu-mention';
const DB_VERSION = 1;

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('done')) {
        const store = db.createObjectStore('done', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_completedAt', 'completedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => void} fn
 */
async function withStore(storeName, mode, fn) {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = fn(store);
  await txDone(tx);
  db.close();
  return result;
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getSettings() {
  const row = await withStore('settings', 'readonly', (store) => reqToPromise(store.get('main')));
  return (
    row || {
      id: 'main',
      brands: [],
      store: '',
      webhookUrl: '',
    }
  );
}

export async function saveSettings(settings) {
  const row = {
    id: 'main',
    brands: Array.isArray(settings.brands) ? settings.brands.filter(Boolean) : [],
    store: settings.store || '',
    webhookUrl: settings.webhookUrl || '',
  };
  await withStore('settings', 'readwrite', (store) => {
    store.put(row);
  });
  return row;
}

export async function getAllTemplates() {
  const rows = await withStore('templates', 'readonly', (store) => reqToPromise(store.getAll()));
  /** @type {Record<string, string>} */
  const map = {};
  for (const row of rows || []) {
    if (row?.key) map[row.key] = row.body || '';
  }
  return map;
}

export async function putTemplate(key, body) {
  await withStore('templates', 'readwrite', (store) => {
    store.put({ key, body: body || '', updatedAt: Date.now() });
  });
}

export async function deleteTemplate(key) {
  await withStore('templates', 'readwrite', (store) => {
    store.delete(key);
  });
}

export async function clearUserTemplates() {
  await withStore('templates', 'readwrite', (store) => {
    store.clear();
  });
}

const DONE_MAX = 200;

export async function addDone(record) {
  const row = {
    ...record,
    completedAt: record.completedAt || Date.now(),
  };
  await withStore('done', 'readwrite', (store) => {
    store.add(row);
  });
  await trimDoneOverLimit(DONE_MAX);
  return row;
}

/** completedAt 昇順で古いものから、maxCount 超過分を削除（ADR-0007） */
async function trimDoneOverLimit(maxCount) {
  const db = await openDb();
  const tx = db.transaction('done', 'readwrite');
  const store = tx.objectStore('done');
  const index = store.index('by_completedAt');
  const rows = await reqToPromise(index.getAll());
  const excess = (rows || []).length - maxCount;
  if (excess > 0) {
    for (let i = 0; i < excess; i += 1) {
      store.delete(rows[i].id);
    }
  }
  await txDone(tx);
  db.close();
}

export async function listDone(limit = 100) {
  const db = await openDb();
  const tx = db.transaction('done', 'readonly');
  const store = tx.objectStore('done');
  const index = store.index('by_completedAt');
  const rows = await reqToPromise(index.getAll(undefined, limit));
  await txDone(tx);
  db.close();
  return (rows || []).slice().reverse();
}
