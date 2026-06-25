/**
 * Sync /timeline — Phase S1（Auth · ルーム · クラウド保存）
 * フルエディタは timeline-sync-app.js（S2）— ここでは保存・再開の最小 UI
 */
import { defaultTimelineTemplate } from './timeline-engine.js';
import { loadSyncPublicConfig, isSyncConfigured } from './sync-public-config.js';
import {
  getSession,
  initSyncAuth,
  onAuthStateChange,
  signInWithMagicLink,
  signOut,
} from './sync-auth.js';
import {
  createRoom,
  listMyRooms,
  loadRoomState,
  saveRoomState,
} from './sync-room-store.js';

const $ = (id) => document.getElementById(id);

/** @type {string | null} */
let activeRoomId = null;
/** @type {number} */
let activeRevision = 0;
/** @type {object} */
let workingPayload = defaultTimelineTemplate();

function setStatus(msg, isError = false) {
  const el = $('sync-s1-status');
  if (!el) return;
  el.textContent = msg;
  el.className = isError
    ? 'text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2'
    : 'text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2';
}

function showPanel(name) {
  for (const id of ['sync-s1-setup', 'sync-s1-auth', 'sync-s1-app']) {
    const el = $(id);
    if (el) el.classList.toggle('hidden', id !== name);
  }
}

async function refreshRoomList() {
  const list = $('sync-s1-room-list');
  if (!list) return;
  const rooms = await listMyRooms();
  list.innerHTML = '';
  if (!rooms.length) {
    list.innerHTML = '<li class="text-sm text-slate-500">ルームがありません — 新規作成してください</li>';
    return;
  }
  for (const room of rooms) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'w-full text-left text-sm border border-slate-200 rounded-lg px-3 py-2 hover:bg-emerald-50 hover:border-emerald-200';
    btn.textContent = room.title;
    btn.addEventListener('click', () => selectRoom(room.id, room.title));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

/**
 * @param {string} roomId
 * @param {string} title
 */
async function selectRoom(roomId, title) {
  activeRoomId = roomId;
  const titleEl = $('sync-s1-active-room');
  if (titleEl) titleEl.textContent = title;
  const state = await loadRoomState(roomId);
  if (state?.payload && typeof state.payload === 'object') {
    workingPayload = state.payload;
    activeRevision = state.revision ?? 0;
    setStatus(`クラウドから読み込み済み · rev.${activeRevision} · ${state.updated_at ?? ''}`);
  } else {
    workingPayload = defaultTimelineTemplate();
    activeRevision = 0;
    setStatus('新規ルーム — まだクラウドに保存されていません');
  }
  renderPayloadPreview();
}

function renderPayloadPreview() {
  const pre = $('sync-s1-payload-preview');
  if (!pre) return;
  const title = workingPayload?.event?.title ?? '（無題）';
  const rows = workingPayload?.rows?.length ?? 0;
  pre.textContent = `イベント: ${title}\nコマ数: ${rows}\nrev.${activeRevision}`;
}

async function handleSave() {
  if (!activeRoomId) {
    setStatus('ルームを選択してください', true);
    return;
  }
  setStatus('保存中…');
  const saved = await saveRoomState(activeRoomId, workingPayload, activeRevision);
  activeRevision = saved.revision;
  setStatus(`クラウドに保存しました · rev.${activeRevision}`);
  renderPayloadPreview();
}

function bindAuthForm() {
  $('sync-s1-signin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = /** @type {HTMLInputElement} */ ($('sync-s1-email'))?.value ?? '';
    if (!email.trim()) return;
    try {
      setStatus('マジックリンクを送信しました。メールのリンクから戻ってください。');
      await signInWithMagicLink(email);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'ログインに失敗しました', true);
    }
  });

  $('sync-s1-signout')?.addEventListener('click', async () => {
    await signOut();
    activeRoomId = null;
    showPanel('sync-s1-auth');
  });

  $('sync-s1-create-room')?.addEventListener('click', async () => {
    const title = /** @type {HTMLInputElement} */ ($('sync-s1-new-room-title'))?.value ?? '';
    try {
      const room = await createRoom(title);
      $('sync-s1-new-room-title').value = '';
      await refreshRoomList();
      await selectRoom(room.id, room.title);
      setStatus(`ルーム「${room.title}」を作成しました`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'ルーム作成に失敗', true);
    }
  });

  $('sync-s1-save')?.addEventListener('click', () => {
    handleSave().catch((err) => {
      setStatus(err instanceof Error ? err.message : '保存に失敗', true);
    });
  });

  $('sync-s1-import-core')?.addEventListener('click', () => {
    try {
      const raw = localStorage.getItem('sg-timeline-draft-v1');
      if (!raw) {
        setStatus('コアの下書き（localStorage）が見つかりません', true);
        return;
      }
      workingPayload = JSON.parse(raw);
      renderPayloadPreview();
      setStatus('コア下書きを読み込みました — 「クラウドに保存」で Sync へ');
    } catch {
      setStatus('下書きの形式が不正です', true);
    }
  });
}

async function bootApp() {
  showPanel('sync-s1-app');
  const session = await getSession();
  const emailEl = $('sync-s1-user-email');
  if (emailEl) emailEl.textContent = session?.user?.email ?? '';
  await refreshRoomList();
  if (!activeRoomId) {
    workingPayload = defaultTimelineTemplate();
    renderPayloadPreview();
  }
}

async function main() {
  const config = await loadSyncPublicConfig();
  if (!isSyncConfigured(config)) {
    showPanel('sync-s1-setup');
    setStatus(
      'Supabase 未設定 — SYNC_SUPABASE_URL / SYNC_SUPABASE_ANON_KEY をビルド環境に設定し、マイグレーションを適用してください（docs/notes/SYNC_ENV_KEYS.md）',
      true
    );
    return;
  }

  initSyncAuth(config);
  bindAuthForm();

  const session = await getSession();
  if (session) {
    await bootApp();
  } else {
    showPanel('sync-s1-auth');
  }

  onAuthStateChange((s) => {
    if (s) bootApp().catch(() => {});
    else showPanel('sync-s1-auth');
  });
}

main().catch((err) => {
  setStatus(err instanceof Error ? err.message : '起動エラー', true);
});
