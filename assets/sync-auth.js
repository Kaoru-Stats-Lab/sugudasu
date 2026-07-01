/**
 * Supabase Auth — Sync ドメイン専用
 * SSOT: docs/notes/SYNC_AUTH_POLICY.md
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';
import { sanitizeSupabaseAscii } from './sync-supabase-sanitize.js';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/**
 * @param {{ supabaseUrl: string, supabaseAnonKey: string }} config
 */
export function initSyncAuth(config) {
  const supabaseUrl = sanitizeSupabaseAscii(config.supabaseUrl, 'SYNC_SUPABASE_URL');
  const supabaseAnonKey = sanitizeSupabaseAscii(config.supabaseAnonKey, 'SYNC_SUPABASE_ANON_KEY');
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sg-sync-auth',
    },
  });
  return client;
}

export function getSyncClient() {
  if (!client) throw new Error('Sync auth not initialized');
  return client;
}

export function getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getSession() {
  const { data } = await getSyncClient().auth.getSession();
  return data.session ?? null;
}

/**
 * サーバ側で JWT を検証し、必要なら refresh する（getSession より信頼性高い）
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getValidatedSession() {
  const { data: userData, error } = await getSyncClient().auth.getUser();
  if (error || !userData.user) return null;
  const { data } = await getSyncClient().auth.getSession();
  return data.session ?? null;
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function signInWithPassword(email, password) {
  const { data, error } = await getSyncClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function signUpWithPassword(email, password) {
  const { data, error } = await getSyncClient().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: getAuthRedirectUrl() },
  });
  if (error) throw error;
  return data;
}

/**
 * @param {string} email
 */
export async function requestPasswordReset(email) {
  const { error } = await getSyncClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getAuthRedirectUrl(),
  });
  if (error) throw error;
}

/**
 * @param {string} newPassword
 */
export async function updatePassword(newPassword) {
  const { data, error } = await getSyncClient().auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSyncClient().auth.signOut();
  if (error) throw error;
}

/** @param {{ supabaseUrl: string, supabaseAnonKey: string }} config */
export async function pingSupabaseAuth(config) {
  const supabaseUrl = sanitizeSupabaseAscii(config.supabaseUrl, 'SYNC_SUPABASE_URL');
  const supabaseAnonKey = sanitizeSupabaseAscii(config.supabaseAnonKey, 'SYNC_SUPABASE_ANON_KEY');
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
    headers: { apikey: supabaseAnonKey },
  });
  return res.ok;
}

/**
 * @param {(event: string, session: import('@supabase/supabase-js').Session | null) => void} cb
 */
export function onAuthStateChange(cb) {
  return getSyncClient().auth.onAuthStateChange((event, session) => {
    cb(event, session);
  });
}
