/**
 * Sync /timeline — Phase S1（Auth · ルーム · クラウド保存）
 * フルエディタは timeline-sync-app.js（S2）— ここでは保存・再開の最小 UI
 */
import { defaultTimelineTemplate } from './timeline-engine.js';
import { loadSyncPublicConfig, isSyncConfigured } from './sync-public-config.js';
import {
  getValidatedSession,
  initSyncAuth,
  onAuthStateChange,
  pingSupabaseAuth,
  requestPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from './sync-auth.js';
import {
  createRoom,
  deleteRoom,
  listMyRooms,
  loadRoomState,
  saveRoomState,
} from './sync-room-store.js';

const $ = (id) => document.getElementById(id);

/** @type {string | null} */
let activeRoomId = null;
/** @type {number} */
let activeRevision = 0;
/** @type {string | null} */
let activeRetainUntil = null;
/** @type {object} */
let workingPayload = defaultTimelineTemplate();

function formatRetainUntil(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** @type {'login' | 'signup' | 'forgot' | 'recovery'} */
let authView = 'login';

const AUTH_HEADINGS = {
  login: '幹事アカウントでログイン',
  signup: '幹事アカウントを新規登録',
  forgot: 'パスワードの再設定',
  recovery: '新しいパスワードの設定',
};

function mapSyncError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  if (msg.includes('Invalid login credentials') || code === 'invalid_credentials') {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (msg.includes('Email not confirmed') || code === 'email_not_confirmed') {
    return 'メールアドレスの確認が完了していません。受信トレイの確認メールを開いてください。';
  }
  if (msg.includes('User already registered') || code === 'user_already_exists') {
    return 'このメールアドレスは登録済みです。ログインするか、パスワードを忘れた場合は再設定してください。';
  }
  if (msg.includes('Password should be at least') || msg.includes('weak_password')) {
    return 'パスワードは6文字以上にしてください。';
  }
  if (msg.includes('Signup requires a valid password')) {
    return '有効なパスワードを入力してください（6文字以上）。';
  }
  if (msg.includes('room_quota_exceeded')) {
    return 'ルーム上限に達しています（trial は1件）。不要なルームを削除してください。';
  }
  if (msg.includes('room_delete_failed')) {
    return 'ルームを削除できませんでした（権限不足 · 既に削除済み · 通信エラー）。再読込後にもう一度お試しください。';
  }
  if (
    msg.includes('email rate limit') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('429')
  ) {
    return 'メール送信の上限に達しました。しばらく待ってから再試行してください（本番は Custom SMTP 設定が必要です）。';
  }
  if (msg.includes('payload_too_large')) {
    return '進行表データが大きすぎます（512KB 上限）。';
  }
  if (msg.includes('ISO-8859-1') || msg.includes('header')) {
    return '認証リクエスト失敗 — SYNC_SUPABASE_ANON_KEY に余分な文字が入っている可能性があります。再ビルドしてください。';
  }
  if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
    return 'Supabase に接続できません — SYNC_SUPABASE_URL が誤っているか、プロジェクトが停止・削除されています。Dashboard の Project URL を再コピーして再デプロイしてください。';
  }
  return msg || 'エラーが発生しました';
}

function setStatus(msg, isError = false) {
  const el = $('sync-s1-status');
  if (!el) return;
  el.textContent = msg;
  el.className = isError
    ? 'text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2'
    : 'text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2';
}

function updateDeleteButtonState() {
  const btn = $('sync-s1-delete-room');
  if (!btn) return;
  const canDelete = Boolean(activeRoomId);
  btn.removeAttribute('disabled');
  btn.classList.toggle('sync-s1-delete-muted', !canDelete);
  btn.setAttribute('aria-disabled', canDelete ? 'false' : 'true');
}

/**
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function confirmDelete(message) {
  const root = $('sync-s1-confirm');
  const msg = $('sync-s1-confirm-msg');
  const yes = $('sync-s1-confirm-yes');
  const no = $('sync-s1-confirm-no');
  if (!root || !msg || !yes || !no) {
    return Promise.resolve(window.confirm(message));
  }
  msg.textContent = message;
  root.classList.remove('hidden');
  return new Promise((resolve) => {
    const cleanup = (result) => {
      root.classList.add('hidden');
      yes.removeEventListener('click', onYes);
      no.removeEventListener('click', onNo);
      root.removeEventListener('click', onBackdrop);
      resolve(result);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    const onBackdrop = (e) => {
      if (e.target === root) cleanup(false);
    };
    yes.addEventListener('click', onYes);
    no.addEventListener('click', onNo);
    root.addEventListener('click', onBackdrop);
  });
}

function showPanel(name) {
  for (const id of ['sync-s1-setup', 'sync-s1-auth', 'sync-s1-app']) {
    const el = $(id);
    if (el) el.classList.toggle('hidden', id !== name);
  }
}

/**
 * @param {'login' | 'signup' | 'forgot' | 'recovery'} view
 */
function showAuthView(view) {
  authView = view;
  const heading = $('sync-s1-auth-heading');
  if (heading) heading.textContent = AUTH_HEADINGS[view] ?? AUTH_HEADINGS.login;
  for (const id of ['sync-s1-auth-login', 'sync-s1-auth-signup', 'sync-s1-auth-forgot', 'sync-s1-auth-recovery']) {
    const el = $(id);
    if (!el) continue;
    const key = id.replace('sync-s1-auth-', '');
    el.classList.toggle('hidden', key !== view);
  }
}

/**
 * @param {string} a
 * @param {string} b
 */
function passwordsMatch(a, b) {
  return a.length > 0 && a === b;
}

async function refreshRoomList() {
  const list = $('sync-s1-room-list');
  if (!list) return [];
  const rooms = await listMyRooms();
  list.innerHTML = '';
  if (!rooms.length) {
    list.innerHTML = '<li class="text-sm text-slate-500">ルームがありません — 新規作成してください</li>';
    return rooms;
  }
  for (const room of rooms) {
    const li = document.createElement('li');
    li.className = 'sync-s1-room-row';
    const btn = document.createElement('button');
    btn.type = 'button';
    const retain = formatRetainUntil(room.retain_until);
    btn.className =
      'sync-s1-room-select w-full text-left text-sm border border-slate-200 rounded-lg px-3 py-2 hover:bg-emerald-50 hover:border-emerald-200' +
      (activeRoomId === room.id ? ' ring-2 ring-emerald-400 bg-emerald-50/50' : '');
    btn.innerHTML = `<span class="font-semibold text-slate-800">${room.title}</span><span class="block text-[11px] text-slate-500 mt-0.5">保持期限: ${retain}</span>`;
    btn.addEventListener('click', () => selectRoom(room.id, room.title, room.retain_until));
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'sync-s1-room-del';
    delBtn.setAttribute('aria-label', `「${room.title}」を削除`);
    delBtn.textContent = '削除';
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestDeleteRoom(room.id, room.title);
    });
    li.appendChild(btn);
    li.appendChild(delBtn);
    list.appendChild(li);
  }
  return rooms;
}

/**
 * @param {string} roomId
 * @param {string} title
 * @param {string | null | undefined} retainUntil
 */
async function selectRoom(roomId, title, retainUntil) {
  activeRoomId = roomId;
  activeRetainUntil = retainUntil ?? null;
  const titleEl = $('sync-s1-active-room');
  if (titleEl) titleEl.textContent = title;
  const retainEl = $('sync-s1-retain-until');
  if (retainEl) retainEl.textContent = formatRetainUntil(activeRetainUntil);
  const eventTitleInput = /** @type {HTMLInputElement | null} */ ($('sync-s1-event-title'));
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
  if (eventTitleInput) {
    eventTitleInput.value = workingPayload?.event?.title ?? '';
  }
  renderPayloadPreview();
  await refreshRoomList();
  updateDeleteButtonState();
}

function syncEventTitleFromInput() {
  const input = /** @type {HTMLInputElement | null} */ ($('sync-s1-event-title'));
  if (!input || !workingPayload?.event) return;
  workingPayload.event.title = input.value.trim() || '（無題）';
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
  syncEventTitleFromInput();
  setStatus('保存中…');
  try {
    const saved = await saveRoomState(activeRoomId, workingPayload, activeRevision);
    activeRevision = saved.revision;
    setStatus(`クラウドに保存しました · rev.${activeRevision}`);
    renderPayloadPreview();
  } catch (err) {
    setStatus(mapSyncError(err), true);
  }
}

async function requestDeleteRoom(roomId, title) {
  if (!roomId) {
    setStatus('削除するルームを選択してください', true);
    return;
  }
  const name = title || $('sync-s1-active-room')?.textContent || 'このルーム';
  const ok = await confirmDelete(
    `「${name}」をクラウドから削除します。進行表データも消えます。よろしいですか？`
  );
  if (!ok) return;
  setStatus('削除中…');
  try {
    await deleteRoom(roomId);
    if (activeRoomId === roomId) {
      activeRoomId = null;
      activeRevision = 0;
      activeRetainUntil = null;
      workingPayload = defaultTimelineTemplate();
      $('sync-s1-active-room').textContent = '（未選択）';
      const retainEl = $('sync-s1-retain-until');
      if (retainEl) retainEl.textContent = '—';
      const eventTitleInput = /** @type {HTMLInputElement | null} */ ($('sync-s1-event-title'));
      if (eventTitleInput) eventTitleInput.value = '';
      renderPayloadPreview();
    }
    await refreshRoomList();
    setStatus('ルームを削除しました');
    updateDeleteButtonState();
  } catch (err) {
    setStatus(mapSyncError(err), true);
  }
}

async function handleDeleteRoom() {
  if (!activeRoomId) {
    setStatus('削除するルームを一覧で選択するか、行の「削除」を押してください', true);
    return;
  }
  const name = $('sync-s1-active-room')?.textContent ?? 'このルーム';
  await requestDeleteRoom(activeRoomId, name);
}

function bindAuthForm() {
  $('sync-s1-goto-signup')?.addEventListener('click', () => showAuthView('signup'));
  $('sync-s1-goto-forgot')?.addEventListener('click', () => showAuthView('forgot'));
  $('sync-s1-goto-login-from-signup')?.addEventListener('click', () => showAuthView('login'));
  $('sync-s1-goto-login-from-forgot')?.addEventListener('click', () => showAuthView('login'));

  $('sync-s1-signin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = /** @type {HTMLInputElement} */ ($('sync-s1-login-email'))?.value ?? '';
    const password = /** @type {HTMLInputElement} */ ($('sync-s1-login-password'))?.value ?? '';
    if (!email.trim() || !password) return;
    try {
      setStatus('ログイン中…');
      await signInWithPassword(email, password);
      setStatus('ログインしました');
      await bootApp();
    } catch (err) {
      setStatus(mapSyncError(err), true);
    }
  });

  $('sync-s1-signup')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = /** @type {HTMLInputElement} */ ($('sync-s1-signup-email'))?.value ?? '';
    const password = /** @type {HTMLInputElement} */ ($('sync-s1-signup-password'))?.value ?? '';
    const password2 = /** @type {HTMLInputElement} */ ($('sync-s1-signup-password2'))?.value ?? '';
    if (!passwordsMatch(password, password2)) {
      setStatus('パスワード（確認）が一致しません', true);
      return;
    }
    try {
      setStatus('登録中…');
      const { session, user } = await signUpWithPassword(email, password);
      if (session) {
        setStatus('登録が完了しました');
        await bootApp();
      } else if (user) {
        setStatus(
          '確認メールを送信しました。メール内のリンクを開いたあと、ログインしてください。',
          false
        );
        showAuthView('login');
      } else {
        setStatus('登録を受け付けました。メールを確認してください。');
        showAuthView('login');
      }
    } catch (err) {
      setStatus(mapSyncError(err), true);
    }
  });

  $('sync-s1-forgot')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = /** @type {HTMLInputElement} */ ($('sync-s1-forgot-email'))?.value ?? '';
    if (!email.trim()) return;
    try {
      setStatus('再設定メールを送信しています…');
      await requestPasswordReset(email);
      setStatus('パスワード再設定用のメールを送信しました。メールのリンクから続行してください。');
      showAuthView('login');
    } catch (err) {
      setStatus(mapSyncError(err), true);
    }
  });

  $('sync-s1-recovery')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = /** @type {HTMLInputElement} */ ($('sync-s1-recovery-password'))?.value ?? '';
    const password2 = /** @type {HTMLInputElement} */ ($('sync-s1-recovery-password2'))?.value ?? '';
    if (!passwordsMatch(password, password2)) {
      setStatus('パスワード（確認）が一致しません', true);
      return;
    }
    try {
      setStatus('パスワードを更新しています…');
      await updatePassword(password);
      setStatus('パスワードを更新しました');
      await bootApp();
    } catch (err) {
      setStatus(mapSyncError(err), true);
    }
  });

  $('sync-s1-signout')?.addEventListener('click', async () => {
    await signOut();
    activeRoomId = null;
    updateDeleteButtonState();
    showPanel('sync-s1-auth');
    showAuthView('login');
  });

  $('sync-s1-create-room')?.addEventListener('click', async () => {
    const title = /** @type {HTMLInputElement} */ ($('sync-s1-new-room-title'))?.value ?? '';
    try {
      const room = await createRoom(title);
      $('sync-s1-new-room-title').value = '';
      await refreshRoomList();
      await selectRoom(room.id, room.title, room.retain_until);
      setStatus(`ルーム「${room.title}」を作成しました`);
    } catch (err) {
      setStatus(mapSyncError(err), true);
    }
  });

  $('sync-s1-delete-room')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleDeleteRoom().catch((err) => setStatus(mapSyncError(err), true));
  });

  $('sync-s1-event-title')?.addEventListener('input', () => {
    syncEventTitleFromInput();
  });

  $('sync-s1-save')?.addEventListener('click', () => {
    handleSave();
  });

  $('sync-s1-import-core')?.addEventListener('click', () => {
    try {
      const raw = localStorage.getItem('sg-timeline-draft-v1');
      if (!raw) {
        setStatus('コアの下書き（localStorage）が見つかりません', true);
        return;
      }
      workingPayload = JSON.parse(raw);
      const eventTitleInput = /** @type {HTMLInputElement | null} */ ($('sync-s1-event-title'));
      if (eventTitleInput) eventTitleInput.value = workingPayload?.event?.title ?? '';
      renderPayloadPreview();
      setStatus('コア下書きを読み込みました — 「クラウドに保存」で Sync へ');
    } catch {
      setStatus('下書きの形式が不正です', true);
    }
  });
}

async function bootApp() {
  document.getElementById('sg-bookmark-banner')?.remove();
  showPanel('sync-s1-app');
  const session = await getValidatedSession();
  const emailEl = $('sync-s1-user-email');
  if (emailEl) emailEl.textContent = session?.user?.email ?? '';
  const rooms = await refreshRoomList();
  if (!activeRoomId && rooms.length > 0) {
    const first = rooms[0];
    await selectRoom(first.id, first.title, first.retain_until);
  } else if (!activeRoomId) {
    workingPayload = defaultTimelineTemplate();
    renderPayloadPreview();
  }
  updateDeleteButtonState();
}

async function main() {
  const config = await loadSyncPublicConfig();
  if (!isSyncConfigured(config)) {
    showPanel('sync-s1-setup');
    setStatus(
      'Supabase 未設定または anon が不正です — SYNC_SUPABASE_URL / SYNC_SUPABASE_ANON_KEY に Supabase の実キー（eyJ...）を設定し再ビルドしてください（docs/notes/SYNC_ENV_KEYS.md）',
      true
    );
    return;
  }

  initSyncAuth(config);

  try {
    const ok = await pingSupabaseAuth(config);
    if (!ok) {
      setStatus(
        'Supabase に接続できません（/auth/v1/health 失敗）— Project URL · プロジェクト稼働状態を確認してください',
        true
      );
    }
  } catch {
    setStatus(
      'Supabase に接続できません — SYNC_SUPABASE_URL のホスト名が存在しない可能性があります。Dashboard の Project URL を再コピーして再デプロイしてください。',
      true
    );
  }

  bindAuthForm();

  const session = await getValidatedSession();
  if (session) {
    await bootApp();
  } else {
    showPanel('sync-s1-auth');
    showAuthView('login');
  }

  onAuthStateChange((event, s) => {
    if (event === 'PASSWORD_RECOVERY') {
      showPanel('sync-s1-auth');
      showAuthView('recovery');
      return;
    }
    if (s) bootApp().catch(() => {});
    else {
      showPanel('sync-s1-auth');
      if (authView !== 'recovery') showAuthView('login');
    }
  });
}

main().catch((err) => {
  setStatus(err instanceof Error ? err.message : '起動エラー', true);
});
