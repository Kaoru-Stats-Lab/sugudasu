/**
 * Supabase URL / anon key must be Latin-1 safe — browser fetch rejects headers otherwise.
 */
export function sanitizeSupabaseAscii(value, fieldName) {
  let s = String(value ?? '').trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  const stripped = s.replace(/[^\x00-\xFF]/g, '');
  if (stripped !== s) {
    throw new Error(
      `${fieldName} に ASCII 以外の文字が含まれています。Cloudflare の SYNC_SUPABASE_* を再貼り付けしてください。`
    );
  }
  return stripped;
}

/** Build-time: strip invisible unicode from env without throwing. */
export function stripNonLatin1Env(value) {
  let s = String(value ?? '').trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.replace(/[^\x00-\xFF]/g, '');
}
