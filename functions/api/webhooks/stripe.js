/**
 * POST /api/webhooks/stripe — Phase S3（S1 はスタブ）
 * SSOT: docs/notes/SYNC_S1_ARCHITECTURE.md §2
 */
export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'stripe_webhook_not_enabled',
      phase: 'S3',
      message: 'Stripe webhook is reserved for Phase S3 billing.',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  );
}
