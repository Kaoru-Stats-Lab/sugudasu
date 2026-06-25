/**
 * Sync 公開設定 — dist-sync/data/sync-public-config.json から読む
 */
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
      supabaseUrl: String(data.supabaseUrl),
      supabaseAnonKey: String(data.supabaseAnonKey),
    };
    return cached;
  } catch {
    return null;
  }
}

export function isSyncConfigured(config) {
  return Boolean(config?.supabaseUrl && config?.supabaseAnonKey);
}
