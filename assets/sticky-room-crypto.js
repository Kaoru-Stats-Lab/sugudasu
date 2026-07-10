/**
 * sticky-room-crypto.js — Gate 7 WebCrypto AES-256-GCM（Room DataChannel E2E）
 * 鍵は URL fragment `#k=` にのみ置く（サーバーに送らない · 仕様書 §12）
 */

const ROOM_CRYPTO_VERSION = 1;
const ROOM_KEY_BYTES = 32;

/** @type {CryptoKey | null} */
let sessionKey = null;

/**
 * @param {Uint8Array} bytes
 */
function bytesToBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * @param {string} str
 */
function base64UrlToBytes(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (padded.length % 4)) % 4);
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/** @returns {Uint8Array} */
export function generateRoomKey() {
  return crypto.getRandomValues(new Uint8Array(ROOM_KEY_BYTES));
}

/**
 * @param {Uint8Array} keyBytes
 */
export function keyToFragment(keyBytes) {
  return `#k=${bytesToBase64Url(keyBytes)}`;
}

/**
 * @param {string} [hash]
 * @returns {Uint8Array | null}
 */
export function fragmentToKey(hash = '') {
  const match = hash.match(/(?:^|[#&])k=([A-Za-z0-9_-]+)/);
  if (!match) return null;
  const bytes = base64UrlToBytes(match[1]);
  if (bytes.length !== ROOM_KEY_BYTES) return null;
  return bytes;
}

/**
 * @param {Uint8Array} keyBytes
 */
export async function initRoomCrypto(keyBytes) {
  if (!keyBytes || keyBytes.length !== ROOM_KEY_BYTES) {
    throw new Error('Room key must be 32 bytes');
  }
  sessionKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
}

export function clearRoomCrypto() {
  sessionKey = null;
}

export function isCryptoReady() {
  return sessionKey !== null;
}

/**
 * @param {unknown} value
 * @returns {value is { t: 'e', v: number, iv: string, ct: string }}
 */
export function isEncryptedEnvelope(value) {
  if (!value || typeof value !== 'object') return false;
  const e = /** @type {{ t?: string, iv?: string, ct?: string }} */ (value);
  return e.t === 'e' && typeof e.iv === 'string' && typeof e.ct === 'string';
}

/**
 * @param {unknown} payload
 * @returns {Promise<{ t: 'e', v: number, iv: string, ct: string }>}
 */
export async function encryptPayload(payload) {
  if (!sessionKey) throw new Error('Room crypto not initialized');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, plaintext);
  return {
    t: 'e',
    v: ROOM_CRYPTO_VERSION,
    iv: bytesToBase64Url(iv),
    ct: bytesToBase64Url(new Uint8Array(ciphertext)),
  };
}

/**
 * @param {{ t: string, v?: number, iv: string, ct: string }} envelope
 * @returns {Promise<unknown>}
 */
export async function decryptPayload(envelope) {
  if (!sessionKey) throw new Error('Room crypto not initialized');
  if (!isEncryptedEnvelope(envelope)) throw new Error('Invalid crypto envelope');
  const iv = base64UrlToBytes(envelope.iv);
  const ct = base64UrlToBytes(envelope.ct);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sessionKey, ct);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

/**
 * @param {unknown} payload
 * @returns {Promise<string>}
 */
export async function encryptWireString(payload) {
  const envelope = await encryptPayload(payload);
  return JSON.stringify(envelope);
}

/**
 * @param {string} raw
 * @returns {Promise<unknown>}
 */
export async function decryptWireString(raw) {
  const outer = JSON.parse(raw);
  if (isEncryptedEnvelope(outer)) {
    return decryptPayload(outer);
  }
  if (isCryptoReady()) {
    throw new Error('Encrypted payload required when Room crypto is active');
  }
  return outer;
}
