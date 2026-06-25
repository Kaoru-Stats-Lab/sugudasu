/**
 * GET /api/health — Sync API 疎通
 */
export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'sugudasu-sync',
      phase: 'S1',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  );
}
