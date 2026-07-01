/**
 * Sync 公開設定 — dist-sync/data/sync-public-config.json から読む
 */
import { sanitizeSupabaseAscii } from './sync-supabase-sanitize.js';

let cached = null;

/**
 * @returns {Promise<{ supabaseUrl: string, supabaseAnonKey: string } | null>}
 */
export async function loadSyncPublicConfig() {
  if (cached) return cached;
  try {
    const res = await fetch('/data/sync-public-config.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.supabaseUrl || !data?.supabaseAnonKey) return null;
    cached = {
      supabaseUrl: sanitizeSupabaseAscii(data.supabaseUrl, 'SYNC_SUPABASE_URL'),
      supabaseAnonKey: sanitizeSupabaseAscii(data.supabaseAnonKey, 'SYNC_SUPABASE_ANON_KEY'),
    };
    return cached;
  } catch {
    return null;
  }
}

export function isSyncConfigured(config) {
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return false;
  return (
    config.supabaseUrl.includes('.supabase.co') && config.supabaseAnonKey.startsWith('eyJ')
  );
}
