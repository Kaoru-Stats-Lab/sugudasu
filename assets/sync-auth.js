/**
 * Supabase Auth — Sync ドメイン専用
 * SSOT: docs/notes/SYNC_S1_ARCHITECTURE.md
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/**
 * @param {{ supabaseUrl: string, supabaseAnonKey: string }} config
 */
export function initSyncAuth(config) {
  client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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

/**
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getSession() {
  const { data } = await getSyncClient().auth.getSession();
  return data.session ?? null;
}

/**
 * @param {string} email
 */
export async function signInWithMagicLink(email) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await getSyncClient().auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await getSyncClient().auth.signOut();
  if (error) throw error;
}

/**
 * @param {(session: import('@supabase/supabase-js').Session | null) => void} cb
 */
export function onAuthStateChange(cb) {
  return getSyncClient().auth.onAuthStateChange((_event, session) => {
    cb(session);
  });
}
