/**
 * SUGUDASU 動画コマ抜き — ローカル動画 → PNG
 * docs/notes/VIDEO_FRAME_PNG_SPEC.md
 */

/** 前後フレーム相当の既定ステップ（約 30fps） */
export const DEFAULT_FRAME_STEP_SEC = 1 / 30;

/**
 * ダウンロード用にファイル名のベース部分を安全化
 * @param {string} name
 * @returns {string}
 */
export function sanitizeBaseName(name) {
  let s = String(name || '')
    .replace(/\.[^.\\/]+$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!s || /^[._-]+$/.test(s)) s = 'video';
  if (s.length > 80) s = s.slice(0, 80);
  return s;
}

/**
 * @param {number} seconds
 * @returns {string} 例: 01m05s
 */
export function formatTimeSuffix(seconds) {
  const t = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const total = Math.floor(t);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}m${String(ss).padStart(2, '0')}s`;
}

/**
 * @param {string} sourceName 元ファイル名（拡張子可）
 * @param {number} currentTimeSec
 * @returns {string}
 */
export function buildPngFileName(sourceName, currentTimeSec) {
  return `${sanitizeBaseName(sourceName)}_${formatTimeSuffix(currentTimeSec)}.png`;
}

/**
 * @param {number} current
 * @param {number} duration
 * @param {number} delta
 * @returns {number}
 */
export function clampSeek(current, duration, delta) {
  const d = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  const next = (Number.isFinite(current) ? current : 0) + (Number.isFinite(delta) ? delta : 0);
  return Math.min(Math.max(0, next), d);
}

/**
 * @param {number} [fps]
 * @returns {number}
 */
export function frameStepSeconds(fps) {
  if (Number.isFinite(fps) && fps >= 1 && fps <= 120) return 1 / fps;
  return DEFAULT_FRAME_STEP_SEC;
}

/**
 * @param {HTMLVideoElement} video
 * @returns {Promise<Blob>}
 */
export function captureFramePng(video) {
  return new Promise((resolve, reject) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      reject(new Error('no-frame'));
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('no-ctx'));
      return;
    }
    try {
      ctx.drawImage(video, 0, 0, w, h);
    } catch (err) {
      reject(err);
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('toBlob-failed'));
        else resolve(blob);
      },
      'image/png'
    );
  });
}

/**
 * @param {Blob} blob
 * @param {string} fileName
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * @param {File} file
 * @returns {boolean}
 */
export function isAcceptedVideoFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'video/mp4' || type === 'video/webm') return true;
  const name = String(file.name || '').toLowerCase();
  return name.endsWith('.mp4') || name.endsWith('.webm');
}

function formatClock(seconds) {
  const t = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const mm = Math.floor(t / 60);
  const ss = t % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function showToast(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(showToast._tid);
  showToast._tid = setTimeout(() => {
    el.classList.add('hidden');
  }, 3200);
}

function init() {
  const dropZone = document.getElementById('vf-drop');
  const fileInput = document.getElementById('vf-file');
  const workspace = document.getElementById('vf-workspace');
  const emptyHint = document.getElementById('vf-empty');
  const video = document.getElementById('vf-video');
  const seek = document.getElementById('vf-seek');
  const timeLabel = document.getElementById('vf-time');
  const btnBack = document.getElementById('vf-frame-back');
  const btnFwd = document.getElementById('vf-frame-fwd');
  const btnPlay = document.getElementById('vf-play');
  const btnSave = document.getElementById('vf-save');
  const toast = document.getElementById('vf-toast');
  const status = document.getElementById('vf-status');
  const fileNameEl = document.getElementById('vf-filename');

  if (!dropZone || !fileInput || !video || !seek || !btnSave) return;

  /** @type {string|null} */
  let objectUrl = null;
  /** @type {string} */
  let sourceName = 'video';
  let seeking = false;

  function setStatus(msg, isError) {
    if (!status) return;
    status.textContent = msg || '';
    status.classList.toggle('text-rose-700', !!isError);
    status.classList.toggle('text-slate-500', !isError);
  }

  function revokeUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function syncUiFromVideo() {
    const t = video.currentTime || 0;
    const d = video.duration;
    if (Number.isFinite(d) && d > 0) {
      seek.max = String(d);
      seek.value = String(t);
      seek.disabled = false;
      if (timeLabel) {
        timeLabel.textContent = `${formatClock(t)} / ${formatClock(d)}`;
      }
    } else if (timeLabel) {
      timeLabel.textContent = formatClock(t);
    }
    if (btnPlay) {
      btnPlay.textContent = video.paused ? '再生' : '一時停止';
    }
  }

  function stepFrame(dir) {
    video.pause();
    const step = frameStepSeconds();
    const next = clampSeek(video.currentTime, video.duration, dir * step);
    seeking = true;
    video.currentTime = next;
  }

  function loadFile(file) {
    if (!isAcceptedVideoFile(file)) {
      setStatus('MP4 または WebM を選んでください。', true);
      return;
    }
    revokeUrl();
    sourceName = file.name || 'video';
    objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.load();
    if (fileNameEl) fileNameEl.textContent = sourceName;
    if (workspace) workspace.classList.remove('hidden');
    if (emptyHint) emptyHint.classList.add('hidden');
    setStatus('動画を読み込みました。シークまたはコマ送りで止めて保存できます。', false);
    btnSave.disabled = true;
  }

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (f) loadFile(f);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((ev) => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.add('border-sky-400', 'bg-sky-50/50');
    });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-sky-400', 'bg-sky-50/50');
    });
  });
  dropZone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  video.addEventListener('loadedmetadata', () => {
    syncUiFromVideo();
    btnSave.disabled = false;
  });
  video.addEventListener('timeupdate', () => {
    if (!seeking) syncUiFromVideo();
  });
  video.addEventListener('seeked', () => {
    seeking = false;
    syncUiFromVideo();
  });
  video.addEventListener('play', syncUiFromVideo);
  video.addEventListener('pause', syncUiFromVideo);
  video.addEventListener('error', () => {
    setStatus(
      'この動画はブラウザで再生できません。MP4（H.264）または WebM を試してください。',
      true
    );
    btnSave.disabled = true;
  });

  seek.addEventListener('input', () => {
    const v = Number(seek.value);
    if (!Number.isFinite(v)) return;
    video.pause();
    seeking = true;
    video.currentTime = v;
    syncUiFromVideo();
  });

  if (btnBack) btnBack.addEventListener('click', () => stepFrame(-1));
  if (btnFwd) btnFwd.addEventListener('click', () => stepFrame(1));
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!objectUrl) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepFrame(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepFrame(1);
    } else if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }
  });

  btnSave.addEventListener('click', async () => {
    video.pause();
    btnSave.disabled = true;
    try {
      const blob = await captureFramePng(video);
      const name = buildPngFileName(sourceName, video.currentTime);
      downloadBlob(blob, name);
      showToast(toast, `${name} を保存しました`);
      setStatus('PNG を保存しました（元の解像度のまま）。', false);
    } catch {
      setStatus(
        'フレームを保存できませんでした。再生できる動画か、もう一度シークしてから試してください。',
        true
      );
    } finally {
      btnSave.disabled = false;
    }
  });

  window.addEventListener('beforeunload', revokeUrl);
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else if (typeof document !== 'undefined') {
  init();
}
