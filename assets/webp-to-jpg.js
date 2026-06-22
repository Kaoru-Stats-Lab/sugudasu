/**
 * ブラウザ内画像フォーマット変換（Canvas · 非送信）
 * T09 · webp-to-jpg.html — **入力 WebP のみ** · 出力 PNG/JPEG
 */

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES = 20;
export const MAX_DIMENSION = 8192;

const EXT_TO_MIME = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  avif: 'image/avif',
  bmp: 'image/bmp',
};

/** @param {File} file */
export function guessImageMime(file) {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return EXT_TO_MIME[ext] || '';
}

/** @param {'png'|'jpeg'|'webp'} format */
export function mimeForFormat(format) {
  if (format === 'png') return 'image/png';
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  throw new Error('bad_format');
}

/** @param {'png'|'jpeg'|'webp'} format */
export function extForFormat(format) {
  if (format === 'jpeg') return 'jpg';
  return format;
}

/** @param {string} originalName @param {'png'|'jpeg'|'webp'} format */
export function outputFilename(originalName, format) {
  const baseName = (originalName || 'image').split(/[/\\]/).pop() || 'image';
  const base = baseName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${extForFormat(format)}`;
}

/** @param {File|{ name: string, type?: string }} file */
export function isWebpFile(file) {
  return guessImageMime(file) === 'image/webp';
}

/** webp-to-jpg 用 — WebP 入力のみ */
export function validateWebpInput(file) {
  if (!isWebpFile(file)) {
    return {
      ok: false,
      code: 'not_webp',
      message: 'WebP ファイルのみ対応です。PNG/JPEG の入力は対象外です。',
    };
  }
  return validateImageFile(file);
}

/** @param {string} raw */
export function parseFetchableImageUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return { ok: false, code: 'empty', message: 'URL を入力してください。' };
  }
  let u;
  try {
    u = new URL(trimmed);
  } catch {
    return { ok: false, code: 'bad_url', message: 'URL の形式が正しくありません。' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, code: 'bad_protocol', message: 'http / https の URL のみ対応です。' };
  }
  return { ok: true, url: u.href };
}

/** @param {string} urlString */
export function filenameFromImageUrl(urlString) {
  let path = '';
  try {
    path = new URL(urlString).pathname;
  } catch {
    return 'image.webp';
  }
  const base = decodeURIComponent(path.split('/').pop() || '') || 'image.webp';
  if (/\.webp$/i.test(base)) return base;
  const stem = base.replace(/\.[^.]+$/, '') || 'image';
  return `${stem}.webp`;
}

/** @param {Blob} blob */
export async function isWebpBlob(blob) {
  if (blob.type === 'image/webp') return true;
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  if (head.length < 12) return false;
  const riff = String.fromCharCode(head[0], head[1], head[2], head[3]) === 'RIFF';
  const webp = String.fromCharCode(head[8], head[9], head[10], head[11]) === 'WEBP';
  return riff && webp;
}

/**
 * CORS 許可ホストのみ成功。非送信（ユーザーのブラウザから直接 fetch）。
 * @param {string} urlString
 * @returns {Promise<File>}
 */
export async function fetchWebpFromUrl(urlString) {
  const parsed = parseFetchableImageUrl(urlString);
  if (!parsed.ok) {
    const err = new Error(parsed.message);
    err.code = parsed.code;
    throw err;
  }

  let res;
  try {
    res = await fetch(parsed.url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
  } catch {
    const err = new Error(
      'ブラウザの制限でこの URL から取得できません。画像を保存してドロップするか、ページ上でコピーして Ctrl+V で貼り付けてください。',
    );
    err.code = 'cors_blocked';
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`取得に失敗しました（HTTP ${res.status}）。`);
    err.code = 'http_error';
    throw err;
  }

  const blob = await res.blob();
  if (blob.size > MAX_FILE_BYTES) {
    const err = new Error(`1ファイル ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB までです。`);
    err.code = 'too_large';
    throw err;
  }

  if (!(await isWebpBlob(blob))) {
    const err = new Error('WebP 画像ではありません。本ツールは WebP 入力専用です。');
    err.code = 'not_webp';
    throw err;
  }

  const name = filenameFromImageUrl(parsed.url);
  return new File([blob], name, { type: 'image/webp' });
}

/** @param {DataTransfer|null|undefined} dt */
export function filesFromClipboard(dt) {
  if (!dt) return { files: [], url: '' };
  /** @type {File[]} */
  const files = [];
  const items = dt.items ? Array.from(dt.items) : [];
  for (const item of items) {
    if (item.kind !== 'file') continue;
    const type = item.type || '';
    if (!type.startsWith('image/')) continue;
    const blob = item.getAsFile();
    if (!blob) continue;
    const ext = type === 'image/webp' ? 'webp' : type.split('/')[1] || 'bin';
    const name = blob.name && blob.name !== 'image.png' ? blob.name : `pasted-${Date.now()}.${ext}`;
    files.push(new File([blob], name, { type: blob.type || type }));
  }
  if (files.length === 0 && dt.files?.length) {
    for (const f of Array.from(dt.files)) {
      if (f.type.startsWith('image/')) files.push(f);
    }
  }
  const text = (dt.getData('text/plain') || '').trim();
  const urlCandidate = parseFetchableImageUrl(text);
  return { files, url: urlCandidate.ok ? urlCandidate.url : '' };
}

/** @param {File} file */
export function validateImageFile(file) {
  const mime = guessImageMime(file);
  if (!mime) {
    return { ok: false, code: 'unsupported', message: '画像ファイル（WebP / PNG / JPEG 等）を選んでください。' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, code: 'too_large', message: `1ファイル ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB までです。` };
  }
  return { ok: true, mime };
}

/**
 * @param {File} file
 * @param {{ format?: 'png'|'jpeg'|'webp', quality?: number }} opts
 */
export async function convertImageFile(file, opts = {}) {
  const format = opts.format || 'png';
  const quality = typeof opts.quality === 'number' ? opts.quality : 0.92;

  const check = validateWebpInput(file);
  if (!check.ok) {
    const err = new Error(check.message);
    err.code = check.code;
    throw err;
  }

  const source = await loadImageSource(file);
  const w = source.width;
  const h = source.height;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    disposeSource(source);
    const err = new Error(`長辺 ${MAX_DIMENSION}px までです（${w}×${h}）。`);
    err.code = 'too_big';
    throw err;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    disposeSource(source);
    throw new Error('canvas_unavailable');
  }
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(source.source, 0, 0, w, h);
  disposeSource(source);

  const outMime = mimeForFormat(format);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Object.assign(new Error('encode_failed'), { code: 'encode_failed' }))),
      outMime,
      format === 'jpeg' ? quality : undefined,
    );
  });

  return {
    blob,
    width: w,
    height: h,
    format,
    filename: outputFilename(file.name, format),
    sourceMime: check.mime,
  };
}

/** @param {File} file */
async function loadImageSource(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        kind: 'bitmap',
      };
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url);
    return { width: img.naturalWidth, height: img.naturalHeight, source: img, kind: 'img', url };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function loadHtmlImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(Object.assign(new Error('decode_failed'), { code: 'decode_failed' }));
    img.src = url;
  });
}

function disposeSource(src) {
  if (src.kind === 'bitmap' && src.source.close) src.source.close();
  if (src.url) URL.revokeObjectURL(src.url);
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
