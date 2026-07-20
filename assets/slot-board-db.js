/**
 * SUGUDASU 枠取りパレット — IndexedDB
 * docs/notes/SLOT_BOARD_SPEC.md v0.2
 */
const DB_NAME = 'sugudasu-slot-board';
const DB_VERSION = 1;
const STORES = ['projects', 'lanes', 'candidates', 'historyLogs'];

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('idb-open'));
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (db.objectStoreNames.contains(name)) continue;
        const store = db.createObjectStore(name, { keyPath: 'id' });
        if (name !== 'projects') {
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @param {'readonly'|'readwrite'} mode
 * @param {(store: IDBObjectStore) => void} fn
 */
function withStore(db, storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try {
      result = fn(store);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('idb-tx'));
    tx.onabort = () => reject(tx.error || new Error('idb-abort'));
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
 * @param {string} storeName
 * @param {string} projectId
 */
export async function getByProject(db, storeName, projectId) {
  return withStore(db, storeName, 'readonly', (store) => {
    const idx = store.index('projectId');
    return reqToPromise(idx.getAll(projectId));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} id
 */
export async function getProject(db, id) {
  return withStore(db, 'projects', 'readonly', (store) => reqToPromise(store.get(id)));
}

/**
 * @param {IDBDatabase} db
 */
export async function listProjects(db) {
  return withStore(db, 'projects', 'readonly', (store) => reqToPromise(store.getAll()));
}

/**
 * @param {IDBDatabase} db
 * @param {object} project
 * @param {object[]} lanes
 * @param {object[]} candidates
 * @param {object[]} historyLogs
 */
export async function putProjectBundle(db, project, lanes, candidates, historyLogs) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    const pStore = tx.objectStore('projects');
    const lStore = tx.objectStore('lanes');
    const cStore = tx.objectStore('candidates');
    const hStore = tx.objectStore('historyLogs');

    pStore.put(project);

    const clearThen = (store, projectId, after) => {
      const idx = store.index('projectId');
      const r = idx.openCursor(IDBKeyRange.only(projectId));
      r.onsuccess = () => {
        const cursor = r.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else after();
      };
      r.onerror = () => reject(r.error);
    };

    let remaining = 3;
    const onCleared = () => {
      remaining -= 1;
      if (remaining > 0) return;
      for (const l of lanes) lStore.put(l);
      for (const c of candidates) cStore.put(c);
      for (const h of historyLogs) hStore.put(h);
    };

    clearThen(lStore, project.id, onCleared);
    clearThen(cStore, project.id, onCleared);
    clearThen(hStore, project.id, onCleared);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('idb-put-bundle'));
    tx.onabort = () => reject(tx.error || new Error('idb-abort'));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} projectId
 */
export async function deleteProjectBundle(db, projectId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    tx.objectStore('projects').delete(projectId);
    for (const name of ['lanes', 'candidates', 'historyLogs']) {
      const store = tx.objectStore(name);
      const idx = store.index('projectId');
      const r = idx.openCursor(IDBKeyRange.only(projectId));
      r.onsuccess = () => {
        const cursor = r.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('idb-delete'));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} projectId
 */
export async function loadProjectBundle(db, projectId) {
  const project = await getProject(db, projectId);
  if (!project) return null;
  const [lanes, candidates, historyLogs] = await Promise.all([
    getByProject(db, 'lanes', projectId),
    getByProject(db, 'candidates', projectId),
    getByProject(db, 'historyLogs', projectId),
  ]);
  lanes.sort((a, b) => (a.order || 0) - (b.order || 0));
  candidates.sort((a, b) => (a.order || 0) - (b.order || 0));
  historyLogs.sort((a, b) => (a.seq || 0) - (b.seq || 0));
  return { project, lanes, candidates, historyLogs };
}
